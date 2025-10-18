const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { OpenAI } = require('openai');

// Load environment variables
require('dotenv').config();

admin.initializeApp();

// Initialize OpenAI with API key from Firebase config or environment variables
const getOpenAIApiKey = () => {
  const apiKey = functions.config().openai?.api_key || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OpenAI API key not found in Firebase config or environment variables');
    console.log('Available config keys:', Object.keys(functions.config()));
  }
  return apiKey;
};

// Lazy initialize OpenAI client to avoid module-level failures
const getOpenAIClient = () => {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
};

// HIPAA-compliant ICD-10 extraction endpoint
exports.extractICD10Codes = functions
  .runWith({ 
    timeoutSeconds: 60, 
    memory: '256MB'
  })
  .https.onCall(async (data, context) => {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to use this service.'
      );
    }

    const { consultationText } = data;

    // Validate input
    if (!consultationText || typeof consultationText !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Consultation text is required and must be a string.'
      );
    }

    if (consultationText.length > 50000) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Consultation text exceeds maximum length of 50,000 characters.'
      );
    }

    const openai = getOpenAIClient();
    const apiKey = getOpenAIApiKey();
    console.log('API key check - length:', apiKey ? apiKey.length : 'null');
    console.log('API key starts with sk-:', apiKey ? apiKey.startsWith('sk-') : 'no key');
    
    if (!openai) {
      console.error('OpenAI client not initialized - returning fallback');
      // Provide fallback extraction with clear error message
      const fallbackCodes = extractCodesWithRegex(consultationText);
      
      return {
        success: true,
        codes: fallbackCodes,
        timestamp: new Date().toISOString(),
        method: 'fallback_regex',
        warning: 'Error extracting codes: OpenAI API key not configured. Using basic code detection. Please review carefully.'
      };
    }
    
    console.log('OpenAI client initialized successfully, proceeding with AI extraction...');

    try {
      // Call OpenAI API for ICD-10 extraction
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a medical coding expert specializing in ICD-10 diagnosis code extraction. 
                     Extract ICD-10 codes from clinical notes with high accuracy. 
                     Return only a JSON array of objects with "code" and "description" fields.
                     Only include codes that are clearly supported by the documentation.
                     Be conservative and precise - accuracy is more important than quantity.`
          },
          {
            role: 'user',
            content: `Extract ICD-10 codes from this clinical note:\n\n${consultationText}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      });

      const result = completion.choices[0].message.content;
      
      try {
        const extractedCodes = JSON.parse(result);
        
        // Validate the response format
        if (!Array.isArray(extractedCodes)) {
          throw new Error('Response is not an array');
        }

        // Validate each code object
        const validatedCodes = extractedCodes.filter(item => 
          item && 
          typeof item === 'object' && 
          typeof item.code === 'string' && 
          typeof item.description === 'string' &&
          /^[A-TV-Z][0-9][0-9AB](\.[0-9A-TV-Z]{1,4})?$/.test(item.code)
        );

        // Log extraction for audit purposes (without PHI)
        await admin.firestore().collection('audit_logs').add({
          userId: context.auth.uid,
          action: 'icd10_extraction',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          codesExtracted: validatedCodes.length,
          textLength: consultationText.length
        });

        return {
          success: true,
          codes: validatedCodes,
          timestamp: new Date().toISOString()
        };

      } catch (parseError) {
        // Fallback to regex extraction if AI response can't be parsed
        console.warn('Failed to parse AI response, using fallback:', parseError);
        
        const fallbackCodes = extractCodesWithRegex(consultationText);
        
        return {
          success: true,
          codes: fallbackCodes,
          timestamp: new Date().toISOString(),
          method: 'fallback_regex'
        };
      }

    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      // Provide fallback extraction
      const fallbackCodes = extractCodesWithRegex(consultationText);
      
      // Log the error for monitoring
      await admin.firestore().collection('audit_logs').add({
        userId: context.auth.uid,
        action: 'icd10_extraction_error',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        error: error.message,
        fallbackUsed: true
      });

      return {
        success: true,
        codes: fallbackCodes,
        timestamp: new Date().toISOString(),
        method: 'fallback_regex',
        warning: 'AI extraction failed, using basic pattern matching. Please review codes carefully.'
      };
    }
  });

// Fallback regex extraction function
function extractCodesWithRegex(text) {
  const icdPattern = /\b[A-TV-Z][0-9][0-9AB](?:\.[0-9A-TV-Z]{1,4})?\b/g;
  const matches = [...new Set(text.match(icdPattern) || [])];
  
  return matches.map(code => ({
    code: code.toUpperCase(),
    description: 'Description not available (manual review required)',
    confidence: 'low'
  }));
}

// Function to validate and sanitize consultation data before saving
exports.validateConsultation = functions.firestore
  .document('consultations/{consultationId}')
  .onWrite(async (change, context) => {
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    // Log all consultation operations for audit
    if (after) {
      await admin.firestore().collection('audit_logs').add({
        userId: after.userId,
        action: after.status === 'draft' ? 'consultation_draft_saved' : 'consultation_finalized',
        consultationId: context.params.consultationId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        codesCount: after.extractedCodes ? after.extractedCodes.length : 0
      });
    }

    return null;
  });

// Health check endpoint
exports.healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'codecraftmd-backend'
  });
});

// Function to cleanup old consultation drafts (run monthly)
exports.cleanupOldDrafts = functions.pubsub
  .schedule('0 0 1 * *') // First day of every month
  .onRun(async (context) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldDrafts = await admin.firestore()
      .collection('consultations')
      .where('status', '==', 'draft')
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .get();

    const batch = admin.firestore().batch();
    oldDrafts.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    
    console.log(`Cleaned up ${oldDrafts.size} old draft consultations`);
    return null;
  });