'use client';

import React, { useState } from 'react';
import { 
  Diagnosis, 
  ExtractCodesRequest, 
  ExtractCodesResponse, 
  ExtractCodesError 
} from '@/types/diagnosis';

interface DiagnosisExtractorProps {
  onExtractComplete?: (diagnoses: Diagnosis[]) => void;
  onError?: (error: string) => void;
}

export default function DiagnosisExtractor({ 
  onExtractComplete, 
  onError 
}: DiagnosisExtractorProps) {
  const [clinicalNote, setClinicalNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const extractCodes = async (note: string, attempt: number = 0): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const request: ExtractCodesRequest = {
        clinicalNote: note
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
        
        // Handle rate limiting with automatic retry
        if (errorData.code === 'RATE_LIMIT' && attempt < 2) {
          const retryAfter = errorData.retryAfter || 60;
          setError(`Rate limit exceeded. Retrying in ${retryAfter} seconds...`);
          
          setTimeout(() => {
            setRetryCount(attempt + 1);
            extractCodes(note, attempt + 1);
          }, retryAfter * 1000);
          
          return;
        }

        throw new Error(errorData.error);
      }

      const successData = data as ExtractCodesResponse;
      setDiagnoses(successData.diagnoses);
      setRetryCount(0);
      
      onExtractComplete?.(successData.diagnoses);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clinicalNote.trim()) {
      setError('Please enter a clinical note');
      return;
    }

    if (clinicalNote.length > 50000) {
      setError('Clinical note exceeds maximum length of 50,000 characters');
      return;
    }

    extractCodes(clinicalNote);
  };

  const getPriorityBadgeColor = (priority: string) => {
    return priority === 'primary' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'suspected': return 'bg-yellow-100 text-yellow-800';
      case 'rule_out': return 'bg-red-100 text-red-800';
      case 'history_of': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          ICD-10 Code Extraction
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="clinical-note" className="block text-sm font-medium text-gray-700 mb-2">
              Clinical Note
            </label>
            <textarea
              id="clinical-note"
              value={clinicalNote}
              onChange={(e) => setClinicalNote(e.target.value)}
              placeholder="Enter the clinical note for ICD-10 code extraction..."
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              disabled={isLoading}
            />
            <div className="mt-1 text-sm text-gray-500">
              {clinicalNote.length.toLocaleString()} / 50,000 characters
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !clinicalNote.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Extracting Codes...
                {retryCount > 0 && ` (Retry ${retryCount})`}
              </span>
            ) : (
              'Extract ICD-10 Codes'
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {diagnoses.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Extracted Diagnoses ({diagnoses.length})
          </h3>
          
          <div className="space-y-4">
            {diagnoses.map((diagnosis, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <code className="text-lg font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                        {diagnosis.code}
                      </code>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(diagnosis.priority)}`}>
                        {diagnosis.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(diagnosis.status)}`}>
                        {diagnosis.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {diagnosis.description}
                    </h4>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getConfidenceColor(diagnosis.confidence)}`}>
                      {(diagnosis.confidence * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Supporting Evidence:</h5>
                  <p className="text-sm text-gray-600 italic">&quot;{diagnosis.evidence}&quot;</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These codes are AI-generated suggestions. Always review and verify 
              all diagnoses against clinical documentation and coding guidelines before use.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}