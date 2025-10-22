import { useState, useCallback } from 'react';
import { 
  Diagnosis, 
  ExtractCodesRequest, 
  ExtractCodesResponse, 
  ExtractCodesError 
} from '@/types/diagnosis';

interface UseDiagnosisExtractionReturn {
  diagnoses: Diagnosis[];
  isLoading: boolean;
  error: string | null;
  extractCodes: (clinicalNote: string) => Promise<void>;
  clearError: () => void;
  clearResults: () => void;
}

/**
 * Custom hook for ICD-10 diagnosis extraction
 * Handles API calls, loading states, error handling, and retry logic
 */
export function useDiagnosisExtraction(): UseDiagnosisExtractionReturn {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractCodes = useCallback(async (clinicalNote: string): Promise<void> => {
    if (!clinicalNote.trim()) {
      setError('Clinical note cannot be empty');
      return;
    }

    if (clinicalNote.length > 50000) {
      setError('Clinical note exceeds maximum length of 50,000 characters');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDiagnoses([]);

    try {
      const response = await extractCodesWithRetry(clinicalNote);
      setDiagnoses(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResults = useCallback(() => {
    setDiagnoses([]);
    setError(null);
  }, []);

  return {
    diagnoses,
    isLoading,
    error,
    extractCodes,
    clearError,
    clearResults,
  };
}

/**
 * Extract codes with automatic retry logic for rate limits and transient errors
 */
async function extractCodesWithRetry(
  clinicalNote: string,
  maxRetries: number = 3
): Promise<Diagnosis[]> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const request: ExtractCodesRequest = {
        clinicalNote
      };

      const response = await fetch('/api/extract-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: ExtractCodesResponse | ExtractCodesError = await response.json();

      if (!data.success) {
        const errorData = data as ExtractCodesError;
        
        // Handle rate limiting
        if (errorData.code === 'RATE_LIMIT') {
          const retryAfter = errorData.retryAfter || 60;
          
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            continue;
          }
        }
        
        // Don't retry validation errors
        if (errorData.code === 'VALIDATION_ERROR') {
          throw new Error(errorData.error);
        }

        lastError = new Error(errorData.error);
        
        // Wait before retry for other errors
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
      } else {
        const successData = data as ExtractCodesResponse;
        return successData.diagnoses;
      }
    } catch (err) {
      lastError = err as Error;
      
      // Don't retry network errors that are likely permanent
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        throw new Error('Network error: Please check your connection and try again');
      }
      
      // Wait before retry
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError || new Error('Maximum retries exceeded');
}

/**
 * Example usage in a React component:
 * 
 * ```tsx
 * import { useDiagnosisExtraction } from '@/hooks/useDiagnosisExtraction';
 * 
 * function MyComponent() {
 *   const { diagnoses, isLoading, error, extractCodes, clearError } = useDiagnosisExtraction();
 *   
 *   const handleExtract = async () => {
 *     const clinicalNote = "Patient presents with chest pain and shortness of breath...";
 *     await extractCodes(clinicalNote);
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={handleExtract} disabled={isLoading}>
 *         {isLoading ? 'Extracting...' : 'Extract Codes'}
 *       </button>
 *       
 *       {error && (
 *         <div className="error">
 *           {error}
 *           <button onClick={clearError}>Dismiss</button>
 *         </div>
 *       )}
 *       
 *       {diagnoses.length > 0 && (
 *         <div>
 *           {diagnoses.map((diagnosis, index) => (
 *             <div key={index}>
 *               <strong>{diagnosis.code}</strong>: {diagnosis.description}
 *               <span>Confidence: {(diagnosis.confidence * 100).toFixed(0)}%</span>
 *             </div>
 *           ))}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */