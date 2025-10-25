// Types for ICD-10 diagnosis extraction with structured output

export type DiagnosisPriority = "primary" | "secondary";
export type DiagnosisStatus = "confirmed" | "suspected" | "rule_out" | "history_of";

export interface Diagnosis {
  code: string;              // ICD-10 format (e.g., "M79.3", "I10")
  description: string;       // Human-readable description
  confidence: number;        // 0-1 confidence score
  evidence: string;          // Quote from clinical note supporting diagnosis
  priority: DiagnosisPriority;
  status: DiagnosisStatus;
  // Task 02: Validation fields
  validated?: boolean;       // Whether code has been validated against CMS database
  validationError?: string;  // Error message if validation failed
  officialDescription?: string; // Official CMS description if different from AI description
}

export interface ExtractCodesRequest {
  clinicalNote: string;
}

export interface ExtractCodesResponse {
  success: boolean;
  diagnoses: Diagnosis[];
  timestamp: string;
  model: string;
  processingTimeMs?: number;
  error?: string;
  warning?: string;
}

export interface ExtractCodesError {
  success: false;
  error: string;
  code: 'RATE_LIMIT' | 'API_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR';
  retryAfter?: number; // seconds to wait before retrying
}

// JSON Schema for OpenAI Structured Output
export const DiagnosisSchema = {
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
} as const;