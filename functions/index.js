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
// Call OpenAI API for ICD-10 extraction with structured output
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert medical coder specializing in ICD-10 diagnosis code extraction from clinical documentation.

Your task is to:
1. Carefully analyze the clinical note for all documented diagnoses, symptoms, and conditions
2. Extract only diagnoses that are clearly supported by the documentation
3. Assign appropriate ICD-10 codes using the most specific code available
4. Provide confidence scores based on documentation clarity
5. Quote specific evidence from the note that supports each diagnosis
6. Classify each diagnosis by priority (primary/secondary) and status

Guidelines:
- Be conservative: only extract diagnoses with clear clinical evidence
- Use the most specific ICD-10 code available
- Primary diagnoses are the main reason for the encounter
- Secondary diagnoses are additional conditions that affect care
- Status classifications:
  * confirmed: definitive diagnosis stated
  * suspected: provisional or possible diagnosis
  * rule_out: condition being ruled out
  * history_of: past medical history
- Confidence should reflect documentation quality and clinical certainty
- Evidence quotes should be direct excerpts from the note`
          },
          {
            role: 'user',
            content: `Please analyze this clinical note and extract all relevant ICD-10 diagnoses:\n\n${consultationText}`
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'diagnosis_extraction',
            schema: {
              type: "object",
              properties: {
                diagnoses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        pattern: "^[A-TV-Z][0-9][0-9AB](\\.[0-9A-TV-Z]{1,4})?$",
                        description: "Valid ICD-10 code format"
                      },
                      description: {
                        type: "string",
                        description: "Clear description of the diagnosis"
                      },
                      confidence: {
                        type: "number",
                        minimum: 0,
                        maximum: 1,
                        description: "Confidence level from 0 to 1"
                      },
                      evidence: {
                        type: "string",
                        description: "Direct quote from the clinical note that supports this diagnosis"
                      },
                      priority: {
                        type: "string",
                        enum: ["primary", "secondary"],
                        description: "Whether this is a primary or secondary diagnosis"
                      },
                      status: {
                        type: "string",
                        enum: ["confirmed", "suspected", "rule_out", "history_of"],
                        description: "Clinical status of the diagnosis"
                      }
                    },
                    required: ["code", "description", "confidence", "evidence", "priority", "status"],
                    additionalProperties: false
                  }
                }
              },
              required: ["diagnoses"],
              additionalProperties: false
            }
          }
        },
        temperature: 0.1,
        max_tokens: 2000,
      });

      const result = completion.choices[0].message.content;
      
      try {
        const extractedData = JSON.parse(result);
        
        // Validate the response format
        if (!extractedData || !Array.isArray(extractedData.diagnoses)) {
          throw new Error('Invalid response structure from OpenAI');
        }

        // Validate each diagnosis object
        const validatedCodes = extractedData.diagnoses.filter(item => 
          item && 
          typeof item === 'object' && 
          typeof item.code === 'string' && 
          typeof item.description === 'string' &&
          typeof item.confidence === 'number' &&
          typeof item.evidence === 'string' &&
          typeof item.priority === 'string' &&
          typeof item.status === 'string' &&
          ['primary', 'secondary'].includes(item.priority) &&
          ['confirmed', 'suspected', 'rule_out', 'history_of'].includes(item.status) &&
          /^[A-TV-Z][0-9][0-9AB](\.[0-9A-TV-Z]{1,4})?$/.test(item.code)
        ).map(item => ({
          code: item.code.toUpperCase(),
          description: item.description.trim(),
          confidence: Math.max(0, Math.min(1, item.confidence)),
          evidence: item.evidence.trim(),
          priority: item.priority,
          status: item.status
        }));

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
          diagnoses: validatedCodes,
          timestamp: new Date().toISOString(),
          model: 'gpt-4o',
          method: 'structured_output'
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