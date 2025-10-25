import { NextRequest, NextResponse } from 'next/server';
import { validateICD10Code, validateICD10Codes, getCacheStats, ValidationResult } from '@/lib/icd10-validator';

export interface ValidateCodeRequest {
  code?: string;
  codes?: string[];
}

export interface ValidateCodeResponse {
  success: boolean;
  result?: ValidationResult;
  results?: ValidationResult[];
  cacheStats?: {
    size: number;
    ttlMs: number;
  };
  processingTimeMs?: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: ValidateCodeRequest = await request.json();

    // Validate request
    if (!body.code && !body.codes) {
      return NextResponse.json<ValidateCodeResponse>(
        {
          success: false,
          error: 'Either "code" or "codes" parameter is required'
        },
        { status: 400 }
      );
    }

    if (body.code && body.codes) {
      return NextResponse.json<ValidateCodeResponse>(
        {
          success: false,
          error: 'Provide either "code" or "codes", not both'
        },
        { status: 400 }
      );
    }

    // Single code validation
    if (body.code) {
      if (typeof body.code !== 'string' || body.code.trim().length === 0) {
        return NextResponse.json<ValidateCodeResponse>(
          {
            success: false,
            error: 'Code must be a non-empty string'
          },
          { status: 400 }
        );
      }

      const result = await validateICD10Code(body.code);
      const processingTime = Date.now() - startTime;

      return NextResponse.json<ValidateCodeResponse>({
        success: true,
        result,
        cacheStats: getCacheStats(),
        processingTimeMs: processingTime
      });
    }

    // Batch validation
    if (body.codes) {
      if (!Array.isArray(body.codes)) {
        return NextResponse.json<ValidateCodeResponse>(
          {
            success: false,
            error: 'Codes must be an array'
          },
          { status: 400 }
        );
      }

      if (body.codes.length === 0) {
        return NextResponse.json<ValidateCodeResponse>(
          {
            success: false,
            error: 'Codes array cannot be empty'
          },
          { status: 400 }
        );
      }

      if (body.codes.length > 50) {
        return NextResponse.json<ValidateCodeResponse>(
          {
            success: false,
            error: 'Maximum 50 codes can be validated at once'
          },
          { status: 400 }
        );
      }

      // Validate that all items are strings
      if (!body.codes.every(code => typeof code === 'string')) {
        return NextResponse.json<ValidateCodeResponse>(
          {
            success: false,
            error: 'All codes must be strings'
          },
          { status: 400 }
        );
      }

      const results = await validateICD10Codes(body.codes);
      const processingTime = Date.now() - startTime;

      return NextResponse.json<ValidateCodeResponse>({
        success: true,
        results,
        cacheStats: getCacheStats(),
        processingTimeMs: processingTime
      });
    }

    // Should never reach here
    return NextResponse.json<ValidateCodeResponse>(
      {
        success: false,
        error: 'Invalid request'
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Validation error:', error);

    const processingTime = Date.now() - startTime;

    return NextResponse.json<ValidateCodeResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        processingTimeMs: processingTime
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const stats = getCacheStats();
  
  return NextResponse.json({
    status: 'healthy',
    service: 'validate-codes',
    timestamp: new Date().toISOString(),
    cache: stats
  });
}
