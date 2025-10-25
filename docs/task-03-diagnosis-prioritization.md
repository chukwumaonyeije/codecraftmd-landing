# Task 03: Diagnosis Prioritization Algorithm

**Status:** 🚧 In Progress  
**Phase:** 1 - Core AI Infrastructure  
**Started:** 2025-10-25  
**Dependencies:** Task 01 ✅, Task 02 ✅

## Overview

Implement an intelligent diagnosis prioritization algorithm that scores and ranks ICD-10 codes to determine which should be the primary diagnosis and which should be excluded from billing.

## Requirements

### Scoring Algorithm

The prioritization system considers multiple factors:

1. **AI Confidence Score** (0-1)
   - Higher confidence = higher priority
   - Weight: 30%

2. **Diagnosis Status**
   - `confirmed` > `suspected` > `rule_out` > `history_of`
   - `rule_out` diagnoses are filtered out (not billable)
   - Weight: 25%

3. **Code Specificity**
   - Longer codes (more specific) score higher
   - E.g., `E11.65` (7 chars) > `E11.9` (5 chars) > `E11` (3 chars)
   - Weight: 15%

4. **Frequency/Evidence Strength**
   - How many times diagnosis is mentioned in note
   - Counted from evidence text mentions
   - Weight: 15%

5. **Code Type Penalties**
   - "Unspecified" codes score lower
   - Z codes (administrative) score lower
   - Symptom codes (e.g., R codes) score lower if definitive diagnosis exists
   - Weight: 10%

6. **Acute vs Chronic**
   - Acute conditions score higher than chronic
   - Identified by keywords and ICD-10 categories
   - Weight: 5%

### Filtering Logic

**Exclude from billing:**
- Rule-out diagnoses (`status: "rule_out"`)
- Symptom codes (R codes) when definitive diagnosis exists
- Low-priority Z codes (contact, screening) unless primary reason for visit
- Codes with validation errors
- Codes with confidence < 0.3 (configurable threshold)

### Output Requirements

- Sort diagnoses by priority score (descending)
- Return top 12 diagnoses (CMS-1500 form limit)
- Add `priorityScore` field to each diagnosis
- Mark first diagnosis as `priority: "primary"`, rest as `"secondary"`

## Technical Implementation

### Core Function Signature

```typescript
function prioritizeDiagnoses(
  diagnoses: Diagnosis[],
  clinicalNote: string,
  options?: PrioritizationOptions
): Diagnosis[]
```

### Helper Functions

1. `isAcuteCondition(code: string, description: string): boolean`
2. `isSymptomCode(code: string): boolean`
3. `isZCode(code: string): boolean`
4. `isUnspecifiedCode(description: string): boolean`
5. `getCodeSpecificity(code: string): number`
6. `countMentions(clinicalNote: string, diagnosis: Diagnosis): number`
7. `calculateStatusScore(status: DiagnosisStatus): number`
8. `shouldFilterOut(diagnosis: Diagnosis, allDiagnoses: Diagnosis[]): boolean`

### Scoring Formula

```typescript
priorityScore = 
  (confidence * 0.30) +
  (statusScore * 0.25) +
  (specificity * 0.15) +
  (frequencyScore * 0.15) +
  (codeTypeScore * 0.10) +
  (acuteScore * 0.05)
```

## Integration Points

### Current Integration
- ✅ `types/diagnosis.ts` - Add `priorityScore` field
- ✅ `lib/diagnosis-prioritizer.ts` - Core algorithm
- ✅ `app/api/extract-codes/route.ts` - Call after validation

### Future Integration (Planned)
- ⏳ Task 08: UI priority indicators and sorting
- ⏳ Task 09: CMS-1500 generation (use prioritized codes)

## Files to Create/Modify

### New Files
- `lib/diagnosis-prioritizer.ts` - Core prioritization logic
- `__tests__/lib/diagnosis-prioritizer.test.ts` - Comprehensive tests

### Modified Files
- `types/diagnosis.ts` - Add `priorityScore?: number` field
- `app/api/extract-codes/route.ts` - Integrate prioritization

## Test Cases

### Unit Tests

1. **Scoring Tests**
   - Test confidence scoring
   - Test status scoring (confirmed > suspected > rule_out)
   - Test specificity scoring (longer codes > shorter)
   - Test frequency scoring
   - Test code type penalties

2. **Filtering Tests**
   - Filter out rule-out diagnoses
   - Filter symptom codes when definitive exists
   - Filter low-priority Z codes
   - Filter validation errors

3. **Edge Cases**
   - Empty diagnosis array
   - All diagnoses below confidence threshold
   - More than 12 diagnoses
   - Duplicate codes
   - Missing fields

4. **Integration Tests**
   - Real-world clinical note scenarios
   - Multiple acute conditions
   - Chronic disease management
   - Well-child visit (Z codes primary)

## Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Primary/secondary classification accuracy | >90% | ⏳ |
| Appropriate filtering (rule-outs, symptoms) | >95% | ⏳ |
| Score calibration (highest score = primary) | >85% | ⏳ |
| Performance (1000 diagnoses) | <100ms | ⏳ |
| Test coverage | >90% | ⏳ |

## Example Usage

```typescript
import { prioritizeDiagnoses } from '@/lib/diagnosis-prioritizer';

const diagnoses = [
  {
    code: "E11.9",
    description: "Type 2 diabetes mellitus without complications",
    confidence: 0.95,
    status: "confirmed",
    evidence: "Patient has diabetes",
    priority: "secondary",
    validated: true
  },
  {
    code: "I10",
    description: "Essential hypertension",
    confidence: 0.92,
    status: "confirmed",
    evidence: "BP 150/95, hypertension",
    priority: "secondary",
    validated: true
  },
  // ... more diagnoses
];

const prioritized = prioritizeDiagnoses(diagnoses, clinicalNote);
// Returns sorted, scored, filtered array with top 12
```

## Performance Considerations

- Efficient text searching (avoid repeated full-text scans)
- Cache expensive calculations
- Use binary search for sorted operations
- Benchmark with large diagnosis arrays (100+ items)

## Configuration Options

```typescript
interface PrioritizationOptions {
  maxResults?: number;           // Default: 12
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
```

## Checklist

- [ ] Create prioritization algorithm
- [ ] Implement helper functions
- [ ] Add filtering logic
- [ ] Implement scoring weights
- [ ] Create comprehensive test suite
- [ ] Integrate with extract-codes API
- [ ] Update TypeScript types
- [ ] Performance benchmarking
- [ ] Documentation
- [ ] Code review
- [ ] Merged to billing-improvements

## Next Steps

1. Implement core prioritization function
2. Create helper functions
3. Write comprehensive tests
4. Integrate with API
5. Validate with real clinical notes
6. Begin Task 04: Evidence Linking

## References

- [CMS ICD-10 Coding Guidelines](https://www.cms.gov/medicare/coding-billing/icd-10-codes)
- [ICD-10-CM Official Guidelines for Coding and Reporting](https://www.cdc.gov/nchs/data/icd/10cmguidelines-FY2023-final.pdf)
- Task 01: Structured JSON Output
- Task 02: Code Validation
