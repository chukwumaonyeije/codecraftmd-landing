import { POST, GET } from '@/app/api/validate-codes/route';
import { NextRequest } from 'next/server';
import { clearValidationCache } from '@/lib/icd10-validator';

// Mock fetch for NLM API
global.fetch = jest.fn();

describe('Validate Codes API', () => {
  beforeEach(() => {
    clearValidationCache();
    jest.clearAllMocks();
    
    // Default mock for successful validation
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [1, ['I10'], null, ['Essential (primary) hypertension']]
    });
  });

  describe('POST /api/validate-codes', () => {
    describe('Single Code Validation', () => {
      test('should validate a single valid code', async () => {
        const request = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: JSON.stringify({ code: 'I10' })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.result).toBeDefined();
        expect(data.result.isValid).toBe(true);
        expect(data.result.code).toBe('I10');
        expect(data.processingTimeMs).toBeDefined();
        expect(data.cacheStats).toBeDefined();
      });

      test('should reject invalid format code', async () => {
        const request = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: JSON.stringify({ code: 'INVALID' })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.result.isValid).toBe(false);
        expect(data.result.source).toBe('format');
      });

      test('should normalize code case', async () => {
        const request = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: JSON.stringify({ code: 'i10' })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data.result.code).toBe('I10');
      });
    });

    describe('Batch Code Validation', () => {
      test('should validate multiple codes', async () => {
        const request = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: JSON.stringify({ codes: ['I10', 'E11.9', 'J44.9'] })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.results).toBeDefined();
        expect(data.results.length).toBe(3);
        expect(data.processingTimeMs).toBeDefined();
      });

      test('should handle mixed valid and invalid codes', async () => {
        const request = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: JSON.stringify({ codes: ['I10', 'INVALID', 'E11.9'] })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data.results.length).toBe(3);
        expect(data.results[1].isValid).toBe(false);
        expect(data.results[1].source).toBe('format');
      });

      test('should reject more than 50 codes', async () => {
        const codes = Array(51).fill('I10');
        const request = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: JSON.stringify({ codes })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Maximum 50');
      });

      test('should reject empty codes array', async () => {
        const request = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: JSON.stringify({ codes: [] })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('empty');
      });

      test('should reject non-string codes', async () => {
        const request = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: JSON.stringify({ codes: ['I10', 123, 'E11.9'] })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('must be strings');
      });
    });

    describe('Request Validation', () => {
      test('should reject missing code/codes parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: JSON.stringify({})
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('required');
      });

      test('should reject both code and codes parameters', async () => {
        const request = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: JSON.stringify({ code: 'I10', codes: ['E11.9'] })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('not both');
      });

      test('should reject empty string code', async () => {
        const request = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: JSON.stringify({ code: '' })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });

      test('should reject non-string code', async () => {
        const request = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: JSON.stringify({ code: 123 })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });

      test('should reject non-array codes', async () => {
        const request = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: JSON.stringify({ codes: 'I10' })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('array');
      });
    });

    describe('Error Handling', () => {
      test('should handle NLM API errors gracefully', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        const request = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: JSON.stringify({ code: 'I10' })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      });

      test('should handle malformed JSON', async () => {
        const request = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: 'not json'
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
      });
    });

    describe('Performance', () => {
      test('should complete validation within 5 seconds', async () => {
        const request = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: JSON.stringify({ code: 'I10' })
        });

        const startTime = Date.now();
        const response = await POST(request);
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(5000);
        
        const data = await response.json();
        expect(data.processingTimeMs).toBeLessThan(5000);
      });

      test('should use cache for subsequent requests', async () => {
        const request1 = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: JSON.stringify({ code: 'I10' })
        });

        // First request - hits API
        await POST(request1);
        const apiCallCount = (global.fetch as jest.Mock).mock.calls.length;

        const request2 = new NextRequest('http://localhost:3000/api/validate-codes', {
          method: 'POST',
          body: JSON.stringify({ code: 'I10' })
        });

        // Second request - hits cache
        const response2 = await POST(request2);
        const data2 = await response2.json();

        expect(data2.result.source).toBe('cache');
        expect((global.fetch as jest.Mock).mock.calls.length).toBe(apiCallCount); // No new API calls
      });
    });
  });

  describe('GET /api/validate-codes', () => {
    test('should return health check with cache stats', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('validate-codes');
      expect(data.timestamp).toBeDefined();
      expect(data.cache).toBeDefined();
      expect(data.cache.size).toBeDefined();
      expect(data.cache.ttlMs).toBeDefined();
    });
  });
});
