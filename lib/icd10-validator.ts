// ICD-10 Code Validation Service with CMS Database Integration
// Task 02: Code Validation with CMS Database and Caching

export interface ValidationResult {
  isValid: boolean;
  code: string;
  officialDescription?: string;
  category?: string;
  errorMessage?: string;
  source: 'cache' | 'api' | 'format';
  validatedAt: string;
}

export interface CachedCode {
  code: string;
  description: string;
  category: string;
  cachedAt: number;
  expiresAt: number;
}

// In-memory cache for ICD-10 codes
// In production, this should be Redis or similar
class ICD10Cache {
  private cache: Map<string, CachedCode> = new Map();
  private readonly TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  get(code: string): CachedCode | null {
    const normalized = this.normalizeCode(code);
    const cached = this.cache.get(normalized);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(normalized);
      return null;
    }

    return cached;
  }

  set(code: string, description: string, category: string): void {
    const normalized = this.normalizeCode(code);
    const now = Date.now();
    
    this.cache.set(normalized, {
      code: normalized,
      description,
      category,
      cachedAt: now,
      expiresAt: now + this.TTL
    });
  }

  has(code: string): boolean {
    const cached = this.get(code);
    return cached !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private normalizeCode(code: string): string {
    // Remove spaces and convert to uppercase
    return code.replace(/\s/g, '').toUpperCase();
  }
}

// Singleton cache instance
const cache = new ICD10Cache();

/**
 * Validates ICD-10 code format
 * Pattern: Letter (A-Z except U) + 2 digits + optional decimal + up to 4 alphanumeric
 */
function validateFormat(code: string): boolean {
  const icd10Pattern = /^[A-TV-Z][0-9][0-9AB](\.[0-9A-TV-Z]{1,4})?$/;
  return icd10Pattern.test(code.toUpperCase());
}

/**
 * Validate ICD-10 code against NLM API
 * Uses the VSAC (Value Set Authority Center) API from NLM
 */
async function validateWithNLM(code: string): Promise<ValidationResult> {
  const normalizedCode = code.replace(/\s/g, '').toUpperCase();
  
  try {
    // NLM CTS (Clinical Table Search) Service
    // This is a free, public API for ICD-10 code validation
    const url = `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=${encodeURIComponent(normalizedCode)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`NLM API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Response format: [count, [codes], null, [names]]
    // Example: [1, ["I10"], null, ["Essential (primary) hypertension"]]
    if (data && Array.isArray(data) && data.length >= 4) {
      const count = data[0];
      const codes = data[1];
      const names = data[3];
      
      if (count > 0 && codes && names) {
        // Find exact match (case-insensitive)
        const matchIndex = codes.findIndex(
          (c: string) => c.toUpperCase() === normalizedCode
        );
        
        if (matchIndex !== -1) {
          const description = names[matchIndex];
          const category = normalizedCode.charAt(0); // First letter indicates category
          
          // Cache the valid code
          cache.set(normalizedCode, description, category);
          
          return {
            isValid: true,
            code: normalizedCode,
            officialDescription: description,
            category,
            source: 'api',
            validatedAt: new Date().toISOString()
          };
        }
      }
    }

    return {
      isValid: false,
      code: normalizedCode,
      errorMessage: 'Code not found in CMS ICD-10 database',
      source: 'api',
      validatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('NLM API validation error:', error);
    
    // If it's a timeout or network error, we can't definitively say it's invalid
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      return {
        isValid: false,
        code: normalizedCode,
        errorMessage: 'Validation service temporarily unavailable',
        source: 'api',
        validatedAt: new Date().toISOString()
      };
    }

    throw error;
  }
}

/**
 * Main validation function with caching
 * Fast-path: format check → cache → API
 */
export async function validateICD10Code(code: string): Promise<ValidationResult> {
  const startTime = Date.now();
  const normalizedCode = code.replace(/\s/g, '').toUpperCase();

  // Step 1: Format validation (fastest)
  if (!validateFormat(normalizedCode)) {
    return {
      isValid: false,
      code: normalizedCode,
      errorMessage: 'Invalid ICD-10 code format',
      source: 'format',
      validatedAt: new Date().toISOString()
    };
  }

  // Step 2: Check cache (fast)
  const cached = cache.get(normalizedCode);
  if (cached) {
    const duration = Date.now() - startTime;
    console.log(`Cache hit for ${normalizedCode} (${duration}ms)`);
    
    return {
      isValid: true,
      code: cached.code,
      officialDescription: cached.description,
      category: cached.category,
      source: 'cache',
      validatedAt: new Date().toISOString()
    };
  }

  // Step 3: Validate with external API
  const duration = Date.now() - startTime;
  console.log(`Cache miss for ${normalizedCode}, validating with API (${duration}ms)`);
  
  return await validateWithNLM(normalizedCode);
}

/**
 * Batch validation for multiple codes
 * Optimized to minimize API calls
 */
export async function validateICD10Codes(codes: string[]): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const codesToValidate: string[] = [];

  // First pass: format check and cache lookup
  for (const code of codes) {
    const normalizedCode = code.replace(/\s/g, '').toUpperCase();
    
    // Format check
    if (!validateFormat(normalizedCode)) {
      results.push({
        isValid: false,
        code: normalizedCode,
        errorMessage: 'Invalid ICD-10 code format',
        source: 'format',
        validatedAt: new Date().toISOString()
      });
      continue;
    }

    // Cache check
    const cached = cache.get(normalizedCode);
    if (cached) {
      results.push({
        isValid: true,
        code: cached.code,
        officialDescription: cached.description,
        category: cached.category,
        source: 'cache',
        validatedAt: new Date().toISOString()
      });
      continue;
    }

    // Needs API validation
    codesToValidate.push(normalizedCode);
  }

  // Second pass: API validation for uncached codes
  // We'll validate them one at a time, but could be parallelized
  const apiResults = await Promise.all(
    codesToValidate.map(code => validateWithNLM(code))
  );

  return [...results, ...apiResults];
}

/**
 * Clear the validation cache
 * Useful for testing or manual cache invalidation
 */
export function clearValidationCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; ttlMs: number } {
  return {
    size: cache.size(),
    ttlMs: 7 * 24 * 60 * 60 * 1000
  };
}

/**
 * Pre-populate cache with common codes
 * This can be called on application startup
 */
export function preloadCommonCodes(): void {
  // Common ICD-10 codes that should be cached
  const commonCodes: Array<[string, string, string]> = [
    ['I10', 'Essential (primary) hypertension', 'I'],
    ['E11.9', 'Type 2 diabetes mellitus without complications', 'E'],
    ['J44.9', 'Chronic obstructive pulmonary disease, unspecified', 'J'],
    ['M79.3', 'Panniculitis, unspecified', 'M'],
    ['I25.10', 'Atherosclerotic heart disease of native coronary artery without angina pectoris', 'I'],
    ['E78.5', 'Hyperlipidemia, unspecified', 'E'],
    ['F41.9', 'Anxiety disorder, unspecified', 'F'],
    ['M54.5', 'Low back pain', 'M'],
    ['R07.9', 'Chest pain, unspecified', 'R'],
    ['Z00.00', 'Encounter for general adult medical examination without abnormal findings', 'Z']
  ];

  for (const [code, description, category] of commonCodes) {
    cache.set(code, description, category);
  }
  
  console.log(`Preloaded ${commonCodes.length} common ICD-10 codes into cache`);
}
