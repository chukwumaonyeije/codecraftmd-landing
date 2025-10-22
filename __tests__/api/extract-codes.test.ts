import { NextRequest } from 'next/server';
import { POST } from '@/app/api/extract-codes/route';
import { ExtractCodesRequest, ExtractCodesResponse, ExtractCodesError } from '@/types/diagnosis';

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
}));

describe('/api/extract-codes', () => {
  let mockOpenAI: any;

  beforeEach(() => {
    // Setup OpenAI mock
    const { OpenAI } = require('openai');
    mockOpenAI = new OpenAI();
    
    // Mock environment variable
    process.env.OPENAI_API_KEY = 'sk-test-key-1234567890';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  const createMockRequest = (body: any): NextRequest => {
    return new NextRequest('http://localhost:3000/api/extract-codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  const mockSuccessResponse = {
    choices: [{
      message: {
        content: JSON.stringify({
          diagnoses: [
            {
              code: "I10",
              description: "Essential hypertension",
              confidence: 0.95,
              evidence: "Blood pressure 160/90 mmHg",
              priority: "primary",
              status: "confirmed"
            },
            {
              code: "E11.9",
              description: "Type 2 diabetes mellitus without complications",
              confidence: 0.88,
              evidence: "HbA1c 8.2%, patient reports diabetes diagnosis",
              priority: "secondary",
              status: "confirmed"
            }
          ]
        })
      }
    }]
  };

  describe('Successful extraction', () => {
    it('should extract diagnoses successfully', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue(mockSuccessResponse);

      const request = createMockRequest({
        clinicalNote: "Patient presents with elevated blood pressure 160/90 mmHg and diabetes with HbA1c 8.2%"
      });

      const response = await POST(request);
      const data: ExtractCodesResponse = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.diagnoses).toHaveLength(2);
      expect(data.model).toBe('gpt-4o');
      expect(data.diagnoses[0]).toEqual({
        code: "I10",
        description: "Essential hypertension",
        confidence: 0.95,
        evidence: "Blood pressure 160/90 mmHg",
        priority: "primary",
        status: "confirmed"
      });
    });

    it('should handle empty diagnoses array', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({ diagnoses: [] })
          }
        }]
      });

      const request = createMockRequest({
        clinicalNote: "Patient appears healthy with no symptoms"
      });

      const response = await POST(request);
      const data: ExtractCodesResponse = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.diagnoses).toEqual([]);
    });
  });

  describe('Input validation', () => {
    it('should reject empty clinical note', async () => {
      const request = createMockRequest({
        clinicalNote: ""
      });

      const response = await POST(request);
      const data: ExtractCodesError = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.error).toContain('Clinical note is required');
    });

    it('should reject too long clinical note', async () => {
      const longNote = 'a'.repeat(50001);
      const request = createMockRequest({
        clinicalNote: longNote
      });

      const response = await POST(request);
      const data: ExtractCodesError = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.error).toContain('exceeds maximum length');
    });

    it('should reject too short clinical note', async () => {
      const request = createMockRequest({
        clinicalNote: "short"
      });

      const response = await POST(request);
      const data: ExtractCodesError = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.error).toContain('too short');
    });

    it('should reject non-string clinical note', async () => {
      const request = createMockRequest({
        clinicalNote: 123
      });

      const response = await POST(request);
      const data: ExtractCodesError = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Error handling', () => {
    it('should handle missing API key', async () => {
      delete process.env.OPENAI_API_KEY;

      const request = createMockRequest({
        clinicalNote: "Patient has chest pain"
      });

      const response = await POST(request);
      const data: ExtractCodesError = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe('API_ERROR');
      expect(data.error).toContain('API key not configured');
    });

    it('should handle OpenAI rate limit error', async () => {
      const rateLimit = new Error('Rate limit exceeded');
      (rateLimit as any).status = 429;
      mockOpenAI.chat.completions.create.mockRejectedValue(rateLimit);

      const request = createMockRequest({
        clinicalNote: "Patient has chest pain and shortness of breath"
      });

      const response = await POST(request);
      const data: ExtractCodesError = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.code).toBe('RATE_LIMIT');
      expect(data.retryAfter).toBe(60);
    });

    it('should handle invalid JSON response from OpenAI', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: "Invalid JSON response"
          }
        }]
      });

      const request = createMockRequest({
        clinicalNote: "Patient has chest pain and shortness of breath"
      });

      const response = await POST(request);
      const data: ExtractCodesError = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('Data validation and sanitization', () => {
    it('should filter out invalid diagnosis objects', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              diagnoses: [
                {
                  code: "I10",
                  description: "Essential hypertension",
                  confidence: 0.95,
                  evidence: "Blood pressure 160/90 mmHg",
                  priority: "primary",
                  status: "confirmed"
                },
                {
                  code: "INVALID",
                  description: "Invalid diagnosis",
                  confidence: 0.5,
                  evidence: "No evidence",
                  priority: "primary",
                  status: "confirmed"
                },
                {
                  code: "E11.9",
                  // missing description - invalid
                  confidence: 0.8,
                  evidence: "Diabetes noted",
                  priority: "secondary",
                  status: "confirmed"
                }
              ]
            })
          }
        }]
      });

      const request = createMockRequest({
        clinicalNote: "Patient has hypertension and diabetes"
      });

      const response = await POST(request);
      const data: ExtractCodesResponse = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.diagnoses).toHaveLength(1); // Only valid diagnosis
      expect(data.diagnoses[0].code).toBe("I10");
    });

    it('should normalize confidence values', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              diagnoses: [
                {
                  code: "I10",
                  description: "Essential hypertension",
                  confidence: 1.5, // > 1, should be clamped to 1
                  evidence: "Blood pressure 160/90 mmHg",
                  priority: "primary",
                  status: "confirmed"
                },
                {
                  code: "E11.9",
                  description: "Type 2 diabetes",
                  confidence: -0.1, // < 0, should be clamped to 0
                  evidence: "Diabetes noted",
                  priority: "secondary",
                  status: "confirmed"
                }
              ]
            })
          }
        }]
      });

      const request = createMockRequest({
        clinicalNote: "Patient has hypertension and diabetes"
      });

      const response = await POST(request);
      const data: ExtractCodesResponse = await response.json();

      expect(data.diagnoses[0].confidence).toBe(1);
      expect(data.diagnoses[1].confidence).toBe(0);
    });
  });
});