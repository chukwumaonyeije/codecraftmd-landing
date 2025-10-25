/**
 * Diagnosis Prioritization Algorithm
 * 
 * Intelligently scores and ranks ICD-10 diagnoses to determine:
 * - Which should be the primary diagnosis
 * - Which should be excluded from billing
 * - Optimal order for CMS-1500 form (max 12 diagnoses)
 */

import { Diagnosis, DiagnosisStatus } from '@/types/diagnosis';

// Configuration for prioritization algorithm
export interface PrioritizationOptions {
  maxResults?: number;           // Default: 12 (CMS-1500 limit)
  minConfidence?: number;        // Default: 0.3
  enableAcuteBoost?: boolean;    // Default: true
  enableZCodeFiltering?: boolean; // Default: true
  weights?: {
    confidence?: number;          // Default: 0.30
    status?: number;              // Default: 0.25
    specificity?: number;         // Default: 0.15
    frequency?: number;           // Default: 0.15
    codeType?: number;            // Default: 0.10
    acute?: number;               // Default: 0.05
  };
}

export interface PrioritizedDiagnosis extends Diagnosis {
  priorityScore: number;
}

// Default configuration
const DEFAULT_OPTIONS: Required<PrioritizationOptions> = {
  maxResults: 12,
  minConfidence: 0.3,
  enableAcuteBoost: true,
  enableZCodeFiltering: true,
  weights: {
    confidence: 0.30,
    status: 0.25,
    specificity: 0.15,
    frequency: 0.15,
    codeType: 0.10,
    acute: 0.05,
  },
};

// Keywords that indicate acute conditions
const ACUTE_KEYWORDS = [
  'acute', 'sudden', 'new onset', 'recent', 'exacerbation',
  'flare', 'attack', 'episode', 'injury', 'trauma', 'fracture'
];

// ICD-10 categories typically associated with acute conditions
const ACUTE_CATEGORIES = ['S', 'T', 'V', 'W', 'X', 'Y']; // Injury, poisoning, external causes

// Low-priority Z codes (administrative/contact)
const LOW_PRIORITY_Z_CODES = [
  'Z00', 'Z01', 'Z02', // Encounters for examinations
  'Z23',              // Immunization
  'Z71', 'Z72',       // Counseling, lifestyle
  'Z76',              // Healthcare facility contact
];

/**
 * Main prioritization function
 * Scores, filters, and sorts diagnoses for optimal billing
 */
export function prioritizeDiagnoses(
  diagnoses: Diagnosis[],
  clinicalNote: string,
  options: PrioritizationOptions = {}
): PrioritizedDiagnosis[] {
  // Merge options with defaults
  const opts: Required<PrioritizationOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
    weights: { ...DEFAULT_OPTIONS.weights, ...options.weights },
  };

  // Validate inputs
  if (!diagnoses || diagnoses.length === 0) {
    return [];
  }

  // Step 1: Score each diagnosis
  const scored = diagnoses.map(diagnosis => ({
    ...diagnosis,
    priorityScore: calculatePriorityScore(diagnosis, clinicalNote, opts),
  }));

  // Step 2: Filter out non-billable diagnoses
  const filtered = scored.filter(diagnosis => 
    !shouldFilterOut(diagnosis, scored, opts)
  );

  // Step 3: Sort by priority score (descending)
  const sorted = filtered.sort((a, b) => b.priorityScore - a.priorityScore);

  // Step 4: Limit to max results (CMS-1500 limit)
  const limited = sorted.slice(0, opts.maxResults);

  // Step 5: Update priority field (first = primary, rest = secondary)
  return limited.map((diagnosis, index) => ({
    ...diagnosis,
    priority: index === 0 ? 'primary' : 'secondary',
  })) as PrioritizedDiagnosis[];
}

/**
 * Calculate overall priority score for a diagnosis
 */
function calculatePriorityScore(
  diagnosis: Diagnosis,
  clinicalNote: string,
  options: Required<PrioritizationOptions>
): number {
  const { weights } = options;

  // 1. Confidence score (0-1, already normalized)
  const confidenceScore = diagnosis.confidence * weights.confidence;

  // 2. Status score (0-1)
  const statusScore = calculateStatusScore(diagnosis.status) * weights.status;

  // 3. Specificity score (0-1)
  const specificityScore = getCodeSpecificity(diagnosis.code) * weights.specificity;

  // 4. Frequency score (0-1)
  const frequencyScore = calculateFrequencyScore(diagnosis, clinicalNote) * weights.frequency;

  // 5. Code type score (0-1, penalties applied)
  const codeTypeScore = calculateCodeTypeScore(diagnosis) * weights.codeType;

  // 6. Acute condition boost (0-1)
  const acuteScore = (options.enableAcuteBoost && isAcuteCondition(diagnosis.code, diagnosis.description))
    ? 1.0 * weights.acute
    : 0.5 * weights.acute; // Chronic conditions get half score

  // Total score (0-1 range)
  return confidenceScore + statusScore + specificityScore + 
         frequencyScore + codeTypeScore + acuteScore;
}

/**
 * Calculate score based on diagnosis status
 * confirmed (1.0) > suspected (0.7) > history_of (0.4) > rule_out (0.0)
 */
function calculateStatusScore(status: DiagnosisStatus): number {
  switch (status) {
    case 'confirmed':
      return 1.0;
    case 'suspected':
      return 0.7;
    case 'history_of':
      return 0.4;
    case 'rule_out':
      return 0.0; // Will be filtered out
    default:
      return 0.5;
  }
}

/**
 * Calculate specificity score based on code length
 * More specific codes (longer) score higher
 */
export function getCodeSpecificity(code: string): number {
  const length = code.replace('.', '').length;
  
  // ICD-10 codes range from 3-7 characters (without decimal)
  // E.g., "I10" = 3, "E11.9" = 4, "E11.65" = 5
  if (length >= 7) return 1.0;  // Most specific (e.g., E11.649)
  if (length === 6) return 0.9;
  if (length === 5) return 0.7;
  if (length === 4) return 0.5;
  if (length === 3) return 0.3;  // Least specific (e.g., I10)
  return 0.1; // Invalid/unknown
}

/**
 * Calculate frequency score based on how often diagnosis is mentioned
 */
function calculateFrequencyScore(diagnosis: Diagnosis, clinicalNote: string): number {
  const mentions = countMentions(clinicalNote, diagnosis);
  
  // Normalize: 1 mention = 0.3, 2 = 0.6, 3+ = 1.0
  if (mentions >= 3) return 1.0;
  if (mentions === 2) return 0.6;
  if (mentions === 1) return 0.3;
  return 0.0;
}

/**
 * Count how many times a diagnosis is mentioned in the clinical note
 */
export function countMentions(clinicalNote: string, diagnosis: Diagnosis): number {
  if (!clinicalNote || !diagnosis) return 0;

  const noteLower = clinicalNote.toLowerCase();
  let count = 0;

  // Count mentions of the description
  const descWords = diagnosis.description
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3); // Ignore short words

  // Count significant words from description
  descWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = clinicalNote.match(regex);
    if (matches) count += matches.length;
  });

  // Also count mentions in evidence
  if (diagnosis.evidence) {
    count += 1; // Evidence itself is a strong indicator
  }

  return Math.min(count, 5); // Cap at 5 to avoid skewing
}

/**
 * Calculate code type score with penalties
 */
function calculateCodeTypeScore(diagnosis: Diagnosis): number {
  let score = 1.0;

  // Penalty for "unspecified" codes
  if (isUnspecifiedCode(diagnosis.description)) {
    score -= 0.3;
  }

  // Penalty for Z codes (administrative)
  if (isZCode(diagnosis.code)) {
    score -= 0.4;
  }

  // Penalty for symptom codes (R codes) 
  if (isSymptomCode(diagnosis.code)) {
    score -= 0.2;
  }

  return Math.max(score, 0); // Don't go negative
}

/**
 * Check if code is a symptom code (R codes)
 */
export function isSymptomCode(code: string): boolean {
  return code.startsWith('R');
}

/**
 * Check if code is a Z code (administrative/contact)
 */
export function isZCode(code: string): boolean {
  return code.startsWith('Z');
}

/**
 * Check if description indicates an unspecified code
 */
export function isUnspecifiedCode(description: string): boolean {
  const lower = description.toLowerCase();
  return lower.includes('unspecified') || 
         lower.includes('not otherwise specified') ||
         lower.includes('nos');
}

/**
 * Check if condition is acute vs chronic
 */
export function isAcuteCondition(code: string, description: string): boolean {
  const descLower = description.toLowerCase();

  // Check for acute keywords
  const hasAcuteKeyword = ACUTE_KEYWORDS.some(keyword => 
    descLower.includes(keyword)
  );

  // Check if code category is typically acute
  const category = code.charAt(0);
  const isAcuteCategory = ACUTE_CATEGORIES.includes(category);

  return hasAcuteKeyword || isAcuteCategory;
}

/**
 * Determine if diagnosis should be filtered out (not billable)
 */
function shouldFilterOut(
  diagnosis: PrioritizedDiagnosis,
  allDiagnoses: PrioritizedDiagnosis[],
  options: Required<PrioritizationOptions>
): boolean {
  // Filter rule-out diagnoses (not billable)
  if (diagnosis.status === 'rule_out') {
    return true;
  }

  // Filter diagnoses below confidence threshold
  if (diagnosis.confidence < options.minConfidence) {
    return true;
  }

  // Filter diagnoses with validation errors
  if (diagnosis.validated === false && diagnosis.validationError) {
    return true;
  }

  // Filter symptom codes if definitive diagnosis exists
  if (isSymptomCode(diagnosis.code)) {
    const hasDefinitiveDiagnosis = allDiagnoses.some(d => 
      !isSymptomCode(d.code) && 
      d.status === 'confirmed' &&
      d.confidence > 0.7
    );
    if (hasDefinitiveDiagnosis) {
      return true;
    }
  }

  // Filter low-priority Z codes (unless they're the only/primary diagnosis)
  if (options.enableZCodeFiltering && isLowPriorityZCode(diagnosis.code)) {
    const hasOtherDiagnoses = allDiagnoses.some(d => 
      !isZCode(d.code) && 
      d.status === 'confirmed'
    );
    if (hasOtherDiagnoses) {
      return true;
    }
  }

  return false;
}

/**
 * Check if Z code is low-priority (administrative/contact)
 */
function isLowPriorityZCode(code: string): boolean {
  if (!isZCode(code)) return false;
  
  return LOW_PRIORITY_Z_CODES.some(prefix => code.startsWith(prefix));
}

/**
 * Get score breakdown for debugging/transparency
 */
export function getScoreBreakdown(
  diagnosis: Diagnosis,
  clinicalNote: string,
  options: PrioritizationOptions = {}
): Record<string, number> {
  const opts: Required<PrioritizationOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
    weights: { ...DEFAULT_OPTIONS.weights, ...options.weights },
  };

  return {
    confidence: diagnosis.confidence * opts.weights.confidence,
    status: calculateStatusScore(diagnosis.status) * opts.weights.status,
    specificity: getCodeSpecificity(diagnosis.code) * opts.weights.specificity,
    frequency: calculateFrequencyScore(diagnosis, clinicalNote) * opts.weights.frequency,
    codeType: calculateCodeTypeScore(diagnosis) * opts.weights.codeType,
    acute: (opts.enableAcuteBoost && isAcuteCondition(diagnosis.code, diagnosis.description) ? 1.0 : 0.5) * opts.weights.acute,
    total: calculatePriorityScore(diagnosis, clinicalNote, opts),
  };
}
