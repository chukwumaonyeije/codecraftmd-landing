import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { 
  Diagnosis, 
  ExtractCodesRequest, 
  ExtractCodesResponse, 
  ExtractCodesError,
  DiagnosisSchema 
} from '@/types/diagnosis';
import { validateICD10Codes } from '@/lib/icd10-validator';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting and retry configuration
const RATE_LIMIT_DELAY = 60000; // 1 minute
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Progressive backoff

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json<ExtractCodesError>({
        success: false,
        error: 'OpenAI API key not configured',
        code: 'API_ERROR'
      }, { status: 500 });
    }

    // Parse and validate request
    const body: ExtractCodesRequest = await request.json();
    
    if (!body.clinicalNote || typeof body.clinicalNote !== 'string') {
      return NextResponse.json<ExtractCodesError>({
        success: false,
        error: 'Clinical note is required and must be a string',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    if (body.clinicalNote.length > 50000) {
      return NextResponse.json<ExtractCodesError>({
        success: false,
        error: 'Clinical note exceeds maximum length of 50,000 characters',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    if (body.clinicalNote.trim().length < 10) {
      return NextResponse.json<ExtractCodesError>({
        success: false,
        error: 'Clinical note is too short to extract meaningful diagnoses',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Extract codes with retry logic
    const diagnoses = await extractCodesWithRetry(body.clinicalNote);
    
    // Task 02: Validate extracted codes against CMS database
    const codes = diagnoses.map(d => d.code);
    const validationResults = await validateICD10Codes(codes);
    
    // Merge validation results with diagnoses
    const validatedDiagnoses = diagnoses.map((diagnosis, index) => {
      const validation = validationResults[index];
      return {
        ...diagnosis,
        validated: validation.isValid,
        validationError: validation.errorMessage,
        officialDescription: validation.officialDescription
      };
    });
    
    const processingTime = Date.now() - startTime;

    const response: ExtractCodesResponse = {
      success: true,
      diagnoses: validatedDiagnoses,
      timestamp: new Date().toISOString(),
      model: 'gpt-4o',
      processingTimeMs: processingTime
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Extract codes error:', error);
    
    const processingTime = Date.now() - startTime;
    
    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json<ExtractCodesError>({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT',
          retryAfter: 60
        }, { status: 429 });
      }
      
      return NextResponse.json<ExtractCodesError>({
        success: false,
        error: `OpenAI API error: ${error.message}`,
        code: 'API_ERROR'
      }, { status: error.status || 500 });
    }

    return NextResponse.json<ExtractCodesError>({
      success: false,
      error: 'An unexpected error occurred while processing your request',
      code: 'UNKNOWN_ERROR'
    }, { status: 500 });
  }
}

async function extractCodesWithRetry(clinicalNote: string): Promise<Diagnosis[]> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await extractCodes(clinicalNote);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on validation errors or non-retryable errors
      if (error instanceof OpenAI.APIError && error.status && error.status < 500) {
        throw error;
      }

      // Wait before retry (except on last attempt)
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
      }
    }
  }

  throw lastError;
}

async function extractCodes(clinicalNote: string): Promise<Diagnosis[]> {
  const systemPrompt = `You are an expert medical coder specializing in ICD-10 diagnosis code extraction from clinical documentation.

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
- Evidence quotes should be direct excerpts from the note`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Please analyze this clinical note and extract all relevant ICD-10 diagnoses:\n\n${clinicalNote}`
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'diagnosis_extraction',
        schema: DiagnosisSchema
      }
    },
    temperature: 0.1,
    max_tokens: 2000,
  });

  const result = completion.choices[0].message.content;
  
  if (!result) {
    throw new Error('No response from OpenAI');
  }

  let parsedResult: { diagnoses: Diagnosis[] };
  try {
    parsedResult = JSON.parse(result);
  } catch (error) {
    console.error('Failed to parse OpenAI response:', result);
    throw new Error('Invalid JSON response from OpenAI');
  }

  // Validate the structure
  if (!parsedResult || !Array.isArray(parsedResult.diagnoses)) {
    throw new Error('Invalid response structure from OpenAI');
  }

  // Validate and sanitize each diagnosis
  const validatedDiagnoses: Diagnosis[] = [];
  
  for (const diagnosis of parsedResult.diagnoses) {
    if (!isValidDiagnosis(diagnosis)) {
      console.warn('Invalid diagnosis object:', diagnosis);
      continue;
    }

    // Additional ICD-10 format validation
    if (!isValidICD10Code(diagnosis.code)) {
      console.warn('Invalid ICD-10 code format:', diagnosis.code);
      continue;
    }

    // Ensure confidence is within valid range
    const confidence = Math.max(0, Math.min(1, diagnosis.confidence));

    validatedDiagnoses.push({
      code: diagnosis.code.toUpperCase(),
      description: diagnosis.description.trim(),
      confidence,
      evidence: diagnosis.evidence.trim(),
      priority: diagnosis.priority,
      status: diagnosis.status
    });
  }

  return validatedDiagnoses;
}

function isValidDiagnosis(diagnosis: any): diagnosis is Diagnosis {
  return (
    diagnosis &&
    typeof diagnosis === 'object' &&
    typeof diagnosis.code === 'string' &&
    typeof diagnosis.description === 'string' &&
    typeof diagnosis.confidence === 'number' &&
    typeof diagnosis.evidence === 'string' &&
    typeof diagnosis.priority === 'string' &&
    typeof diagnosis.status === 'string' &&
    ['primary', 'secondary'].includes(diagnosis.priority) &&
    ['confirmed', 'suspected', 'rule_out', 'history_of'].includes(diagnosis.status)
  );
}

function isValidICD10Code(code: string): boolean {
  // ICD-10 pattern: Letter (A-Z except U) + 2 digits + optional decimal + up to 4 alphanumeric
  const icd10Pattern = /^[A-TV-Z][0-9][0-9AB](\.[0-9A-TV-Z]{1,4})?$/;
  return icd10Pattern.test(code);
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'extract-codes',
    timestamp: new Date().toISOString()
  });
}