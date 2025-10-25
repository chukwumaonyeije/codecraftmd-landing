import { 
  validateICD10Code, 
  validateICD10Codes, 
  clearValidationCache, 
  getCacheStats,
  preloadCommonCodes,
  ValidationResult 
} from '@/lib/icd10-validator';

// Mock fetch for testing
global.fetch = jest.fn();

describe('ICD-10 Validator', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearValidationCache();
    jest.clearAllMocks();
  });

  describe('Format Validation', () => {
    test('should reject invalid format codes immediately', async () => {
      const invalidCodes = [
        'ABC',           // Too short
        '123',           // No letter
        'U10',           // Invalid letter (U)
        'A1',            // Too short
        'A1C',           // Invalid format
        'A10.12345',     // Too many digits after decimal
        'A10.',          // Trailing decimal
        '',              // Empty
        'a10',           // Lowercase (should be handled)
      ];

      for (const code of invalidCodes) {
        const result = await validateICD10Code(code);
        
        // Lowercase should be normalized, others should fail
        if (code === 'a10') {
          // This should pass format check after normalization
          continue;
        }
        
        expect(result.isValid).toBe(false);
        expect(result.source).toBe('format');
        expect(result.errorMessage).toContain('format');
      }
    });

    test('should accept valid format codes', async () => {
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [1, ['I10'], null, ['Essential (primary) hypertension']]
      });

      const validCodes = [
        'I10',
        'E11.9',
        'J44.9',
        'M79.3',
        'I25.10',
        'E78.5',
        'F41.9',
        'M54.5',
        'R07.9',
        'Z00.00',
        'A00.0',
        'B99',
        'C50.919'
      ];

      for (const code of validCodes) {
        const result = await validateICD10Code(code);
        // Format should be valid (actual validation depends on API)
        expect(result.source).not.toBe('format');
      }
    });
  });

  describe('Cache Functionality', () => {
    test('should cache valid codes', async () => {
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [1, ['I10'], null, ['Essential (primary) hypertension']]
      });

      // First call - should hit API
      const result1 = await validateICD10Code('I10');
      expect(result1.source).toBe('api');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second call - should hit cache
      const result2 = await validateICD10Code('I10');
      expect(result2.source).toBe('cache');
      expect(result2.isValid).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1); // No additional API calls
    });

    test('should normalize codes for cache lookup', async () => {
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [1, ['I10'], null, ['Essential (primary) hypertension']]
      });

      // Cache with uppercase
      await validateICD10Code('I10');
      
      // Lookup with lowercase should hit cache
      const result = await validateICD10Code('i10');
      expect(result.source).toBe('cache');
      expect(result.isValid).toBe(true);
    });

    test('should provide cache statistics', async () => {
      clearValidationCache();
      const stats1 = getCacheStats();
      expect(stats1.size).toBe(0);

      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [1, ['I10'], null, ['Essential (primary) hypertension']]
      });

      await validateICD10Code('I10');
      
      const stats2 = getCacheStats();
      expect(stats2.size).toBe(1);
      expect(stats2.ttlMs).toBeGreaterThan(0);
    });

    test('should preload common codes', () => {
      clearValidationCache();
      preloadCommonCodes();
      
      const stats = getCacheStats();
      expect(stats.size).toBeGreaterThan(5); // At least some codes loaded
    });
  });

  describe('API Integration', () => {
    test('should validate against NLM API', async () => {
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [1, ['I10'], null, ['Essential (primary) hypertension']]
      });

      const result = await validateICD10Code('I10');
      
      expect(result.isValid).toBe(true);
      expect(result.code).toBe('I10');
      expect(result.officialDescription).toBe('Essential (primary) hypertension');
      expect(result.category).toBe('I');
      expect(result.source).toBe('api');
      
      // Verify API was called with correct URL
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('clinicaltables.nlm.nih.gov'),
        expect.any(Object)
      );
    });

    test('should handle code not found in database', async () => {
      // Mock API response with no matches
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [0, [], null, []]
      });

      const result = await validateICD10Code('Z99.999');
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('not found');
      expect(result.source).toBe('api');
    });

    test('should handle API timeout', async () => {
      // Mock timeout
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AbortError')), 100)
        )
      );

      const result = await validateICD10Code('I10');
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('temporarily unavailable');
    });

    test('should handle API errors gracefully', async () => {
      // Mock API error
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      });

      await expect(validateICD10Code('I10')).rejects.toThrow();
    });

    test('should have reasonable timeout', async () => {
      // Mock slow API
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000))
      );

      const startTime = Date.now();
      
      try {
        await validateICD10Code('I10');
      } catch (error) {
        // Expected to timeout
      }
      
      const duration = Date.now() - startTime;
      // Should timeout before 10 seconds (we set 5 second timeout)
      expect(duration).toBeLessThan(7000);
    }, 10000);
  });

  describe('Batch Validation', () => {
    test('should validate multiple codes efficiently', async () => {
      // Mock successful API responses
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [1, ['I10'], null, ['Essential (primary) hypertension']]
      });

      const codes = ['I10', 'E11.9', 'J44.9'];
      const results = await validateICD10Codes(codes);
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.source === 'api')).toBe(true);
    });

    test('should use cache for batch validation', async () => {
      // Preload one code
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [1, ['I10'], null, ['Essential (primary) hypertension']]
      });
      
      await validateICD10Code('I10');
      jest.clearAllMocks();

      // Batch validate including cached code
      const codes = ['I10', 'E11.9'];
      const results = await validateICD10Codes(codes);
      
      expect(results[0].source).toBe('cache'); // I10 from cache
      expect(results[1].source).toBe('api');   // E11.9 from API
      expect(fetch).toHaveBeenCalledTimes(1);  // Only one API call
    });

    test('should handle mixed valid and invalid codes', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [1, ['I10'], null, ['Essential (primary) hypertension']]
      });

      const codes = ['I10', 'INVALID', 'E11.9'];
      const results = await validateICD10Codes(codes);
      
      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
      expect(results[1].source).toBe('format');
      expect(results[2].isValid).toBe(true);
    });
  });

  describe('Performance', () => {
    test('should validate cached codes in under 50ms', async () => {
      // Preload cache
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [1, ['I10'], null, ['Essential (primary) hypertension']]
      });
      
      await validateICD10Code('I10');

      // Measure cached validation
      const startTime = Date.now();
      await validateICD10Code('I10');
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(50);
    });

    test('should validate format in under 10ms', async () => {
      const startTime = Date.now();
      await validateICD10Code('INVALID');
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty strings', async () => {
      const result = await validateICD10Code('');
      expect(result.isValid).toBe(false);
      expect(result.source).toBe('format');
    });

    test('should handle whitespace', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [1, ['I10'], null, ['Essential (primary) hypertension']]
      });

      const result = await validateICD10Code(' I10 ');
      expect(result.code).toBe('I10'); // Trimmed
    });

    test('should handle case insensitivity', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [1, ['I10'], null, ['Essential (primary) hypertension']]
      });

      const lower = await validateICD10Code('i10');
      const upper = await validateICD10Code('I10');
      const mixed = await validateICD10Code('I10');
      
      expect(lower.code).toBe('I10');
      expect(upper.code).toBe('I10');
      expect(mixed.code).toBe('I10');
    });
  });
});
