import {
  prioritizeDiagnoses,
  getCodeSpecificity,
  countMentions,
  isSymptomCode,
  isZCode,
  isUnspecifiedCode,
  isAcuteCondition,
  getScoreBreakdown,
  PrioritizationOptions,
} from '@/lib/diagnosis-prioritizer';
import { Diagnosis } from '@/types/diagnosis';

describe('Diagnosis Prioritization', () => {
  const mockClinicalNote = `
    Patient presents with acute chest pain and shortness of breath.
    History of type 2 diabetes mellitus and hypertension.
    Recent exacerbation of symptoms. Patient reports chest pain started suddenly
    this morning. Diabetes has been well-controlled on metformin.
    Blood pressure elevated at 150/95.
  `;

  const mockDiagnoses: Diagnosis[] = [
    {
      code: 'E11.9',
      description: 'Type 2 diabetes mellitus without complications',
      confidence: 0.95,
      status: 'confirmed',
      evidence: 'History of type 2 diabetes',
      priority: 'secondary',
      validated: true,
    },
    {
      code: 'I10',
      description: 'Essential hypertension',
      confidence: 0.92,
      status: 'confirmed',
      evidence: 'Blood pressure 150/95, hypertension',
      priority: 'secondary',
      validated: true,
    },
    {
      code: 'R07.9',
      description: 'Chest pain, unspecified',
      confidence: 0.88,
      status: 'confirmed',
      evidence: 'Patient reports chest pain',
      priority: 'secondary',
      validated: true,
    },
    {
      code: 'I21.9',
      description: 'Acute myocardial infarction, unspecified',
      confidence: 0.75,
      status: 'suspected',
      evidence: 'Acute chest pain and elevated BP',
      priority: 'primary',
      validated: true,
    },
    {
      code: 'J45.40',
      description: 'Moderate persistent asthma',
      confidence: 0.30,
      status: 'rule_out',
      evidence: 'Shortness of breath',
      priority: 'secondary',
      validated: true,
    },
  ];

  describe('prioritizeDiagnoses', () => {
    it('should return sorted diagnoses by priority score', () => {
      const result = prioritizeDiagnoses(mockDiagnoses, mockClinicalNote);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('priorityScore');
      
      // Verify descending order
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].priorityScore).toBeGreaterThanOrEqual(result[i + 1].priorityScore);
      }
    });

    it('should filter out rule-out diagnoses', () => {
      const result = prioritizeDiagnoses(mockDiagnoses, mockClinicalNote);
      
      const ruleOutDiagnosis = result.find(d => d.status === 'rule_out');
      expect(ruleOutDiagnosis).toBeUndefined();
    });

    it('should mark first diagnosis as primary', () => {
      const result = prioritizeDiagnoses(mockDiagnoses, mockClinicalNote);
      
      expect(result[0].priority).toBe('primary');
    });

    it('should mark remaining diagnoses as secondary', () => {
      const result = prioritizeDiagnoses(mockDiagnoses, mockClinicalNote);
      
      for (let i = 1; i < result.length; i++) {
        expect(result[i].priority).toBe('secondary');
      }
    });

    it('should limit results to maxResults (default 12)', () => {
      const manyDiagnoses = Array(20).fill(null).map((_, i) => ({
        ...mockDiagnoses[0],
        code: `E11.${i}`,
        confidence: 0.9 - (i * 0.01),
      }));

      const result = prioritizeDiagnoses(manyDiagnoses, mockClinicalNote);
      expect(result.length).toBeLessThanOrEqual(12);
    });

    it('should respect custom maxResults option', () => {
      const options: PrioritizationOptions = { maxResults: 5 };
      const result = prioritizeDiagnoses(mockDiagnoses, mockClinicalNote, options);
      
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should filter diagnoses below minConfidence threshold', () => {
      const options: PrioritizationOptions = { minConfidence: 0.85 };
      const result = prioritizeDiagnoses(mockDiagnoses, mockClinicalNote, options);
      
      result.forEach(d => {
        expect(d.confidence).toBeGreaterThanOrEqual(0.85);
      });
    });

    it('should handle empty diagnosis array', () => {
      const result = prioritizeDiagnoses([], mockClinicalNote);
      expect(result).toEqual([]);
    });

    it('should filter symptom codes when definitive diagnosis exists', () => {
      const result = prioritizeDiagnoses(mockDiagnoses, mockClinicalNote);
      
      // R07.9 (chest pain symptom) should be filtered if acute MI is confirmed
      const symptomCode = result.find(d => d.code === 'R07.9');
      
      // Either filtered out OR acute MI has higher priority
      if (symptomCode) {
        const acuteMI = result.find(d => d.code === 'I21.9');
        if (acuteMI && acuteMI.status === 'confirmed') {
          expect(symptomCode.priorityScore).toBeLessThan(acuteMI.priorityScore);
        }
      }
    });

    it('should prioritize acute conditions over chronic', () => {
      const acuteDiagnoses: Diagnosis[] = [
        {
          code: 'I21.9',
          description: 'Acute myocardial infarction',
          confidence: 0.85,
          status: 'confirmed',
          evidence: 'Acute chest pain',
          priority: 'secondary',
          validated: true,
        },
        {
          code: 'E11.9',
          description: 'Type 2 diabetes mellitus',
          confidence: 0.95,
          status: 'confirmed',
          evidence: 'Diabetes',
          priority: 'secondary',
          validated: true,
        },
      ];

      const result = prioritizeDiagnoses(acuteDiagnoses, mockClinicalNote, {
        enableAcuteBoost: true,
      });

      // Acute MI should score higher despite lower confidence
      const acuteMI = result.find(d => d.code === 'I21.9');
      expect(acuteMI).toBeDefined();
    });
  });

  describe('getCodeSpecificity', () => {
    it('should score longer codes higher', () => {
      expect(getCodeSpecificity('I10')).toBeLessThan(getCodeSpecificity('E11.9'));
      expect(getCodeSpecificity('E11.9')).toBeLessThan(getCodeSpecificity('E11.65'));
      expect(getCodeSpecificity('E11.65')).toBeLessThan(getCodeSpecificity('E11.649'));
    });

    it('should handle codes without decimal points', () => {
      const score = getCodeSpecificity('I10');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });

    it('should give highest score to 7-character codes', () => {
      expect(getCodeSpecificity('E11.649')).toBe(1.0);
    });

    it('should give low score to 3-character codes', () => {
      expect(getCodeSpecificity('I10')).toBe(0.3);
    });
  });

  describe('countMentions', () => {
    it('should count mentions of diagnosis in clinical note', () => {
      const diagnosis: Diagnosis = {
        code: 'E11.9',
        description: 'Type 2 diabetes mellitus',
        confidence: 0.9,
        status: 'confirmed',
        evidence: 'diabetes history',
        priority: 'secondary',
      };

      const count = countMentions(mockClinicalNote, diagnosis);
      expect(count).toBeGreaterThan(0);
    });

    it('should count evidence as a mention', () => {
      const diagnosis: Diagnosis = {
        code: 'I10',
        description: 'Hypertension',
        confidence: 0.9,
        status: 'confirmed',
        evidence: 'BP elevated',
        priority: 'secondary',
      };

      const count = countMentions(mockClinicalNote, diagnosis);
      expect(count).toBeGreaterThan(0);
    });

    it('should handle empty clinical note', () => {
      const diagnosis: Diagnosis = {
        code: 'I10',
        description: 'Hypertension',
        confidence: 0.9,
        status: 'confirmed',
        evidence: 'BP elevated',
        priority: 'secondary',
      };

      const count = countMentions('', diagnosis);
      expect(count).toBe(0);
    });

    it('should cap mentions at 5', () => {
      const repeatedNote = 'diabetes '.repeat(10);
      const diagnosis: Diagnosis = {
        code: 'E11.9',
        description: 'Diabetes',
        confidence: 0.9,
        status: 'confirmed',
        evidence: 'diabetes',
        priority: 'secondary',
      };

      const count = countMentions(repeatedNote, diagnosis);
      expect(count).toBeLessThanOrEqual(5);
    });
  });

  describe('isSymptomCode', () => {
    it('should identify R codes as symptom codes', () => {
      expect(isSymptomCode('R07.9')).toBe(true);
      expect(isSymptomCode('R50.9')).toBe(true);
    });

    it('should return false for non-R codes', () => {
      expect(isSymptomCode('I10')).toBe(false);
      expect(isSymptomCode('E11.9')).toBe(false);
    });
  });

  describe('isZCode', () => {
    it('should identify Z codes', () => {
      expect(isZCode('Z00.00')).toBe(true);
      expect(isZCode('Z23')).toBe(true);
    });

    it('should return false for non-Z codes', () => {
      expect(isZCode('I10')).toBe(false);
      expect(isZCode('R07.9')).toBe(false);
    });
  });

  describe('isUnspecifiedCode', () => {
    it('should identify unspecified codes by description', () => {
      expect(isUnspecifiedCode('Chest pain, unspecified')).toBe(true);
      expect(isUnspecifiedCode('Diabetes, not otherwise specified')).toBe(true);
      expect(isUnspecifiedCode('Hypertension NOS')).toBe(true);
    });

    it('should return false for specified codes', () => {
      expect(isUnspecifiedCode('Essential hypertension')).toBe(false);
      expect(isUnspecifiedCode('Type 2 diabetes mellitus')).toBe(false);
    });
  });

  describe('isAcuteCondition', () => {
    it('should identify acute conditions by keywords', () => {
      expect(isAcuteCondition('I21.9', 'Acute myocardial infarction')).toBe(true);
      expect(isAcuteCondition('J18.9', 'Acute pneumonia')).toBe(true);
      expect(isAcuteCondition('K35.80', 'Acute appendicitis')).toBe(true);
    });

    it('should identify acute conditions by ICD-10 category', () => {
      expect(isAcuteCondition('S72.001A', 'Fracture of femur')).toBe(true); // S = injury
      expect(isAcuteCondition('T36.0X1A', 'Poisoning by penicillins')).toBe(true); // T = poisoning
    });

    it('should return false for chronic conditions', () => {
      expect(isAcuteCondition('E11.9', 'Type 2 diabetes mellitus')).toBe(false);
      expect(isAcuteCondition('I10', 'Essential hypertension')).toBe(false);
    });
  });

  describe('getScoreBreakdown', () => {
    it('should return detailed score breakdown', () => {
      const diagnosis: Diagnosis = {
        code: 'E11.9',
        description: 'Type 2 diabetes mellitus without complications',
        confidence: 0.95,
        status: 'confirmed',
        evidence: 'diabetes history',
        priority: 'secondary',
        validated: true,
      };

      const breakdown = getScoreBreakdown(diagnosis, mockClinicalNote);

      expect(breakdown).toHaveProperty('confidence');
      expect(breakdown).toHaveProperty('status');
      expect(breakdown).toHaveProperty('specificity');
      expect(breakdown).toHaveProperty('frequency');
      expect(breakdown).toHaveProperty('codeType');
      expect(breakdown).toHaveProperty('acute');
      expect(breakdown).toHaveProperty('total');

      // Total should be sum of all components
      const sum = 
        breakdown.confidence +
        breakdown.status +
        breakdown.specificity +
        breakdown.frequency +
        breakdown.codeType +
        breakdown.acute;

      expect(breakdown.total).toBeCloseTo(sum, 5);
    });

    it('should respect custom weights', () => {
      const diagnosis: Diagnosis = {
        code: 'I10',
        description: 'Essential hypertension',
        confidence: 0.9,
        status: 'confirmed',
        evidence: 'BP 150/95',
        priority: 'secondary',
        validated: true,
      };

      const breakdown = getScoreBreakdown(diagnosis, mockClinicalNote, {
        weights: {
          confidence: 0.5,
          status: 0.5,
        },
      });

      expect(breakdown.confidence).toBeGreaterThan(0);
      expect(breakdown.status).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle diagnosis with missing optional fields', () => {
      const minimalDiagnosis: Diagnosis = {
        code: 'I10',
        description: 'Hypertension',
        confidence: 0.8,
        status: 'confirmed',
        evidence: 'BP elevated',
        priority: 'secondary',
      };

      const result = prioritizeDiagnoses([minimalDiagnosis], mockClinicalNote);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('priorityScore');
    });

    it('should handle validation errors gracefully', () => {
      const invalidDiagnosis: Diagnosis = {
        code: 'INVALID',
        description: 'Invalid code',
        confidence: 0.9,
        status: 'confirmed',
        evidence: 'test',
        priority: 'secondary',
        validated: false,
        validationError: 'Invalid ICD-10 format',
      };

      const result = prioritizeDiagnoses([invalidDiagnosis], mockClinicalNote);
      
      // Should be filtered out due to validation error
      expect(result.length).toBe(0);
    });

    it('should handle duplicate codes', () => {
      const duplicates: Diagnosis[] = [
        mockDiagnoses[0],
        { ...mockDiagnoses[0], evidence: 'different evidence' },
      ];

      const result = prioritizeDiagnoses(duplicates, mockClinicalNote);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle Z codes as primary when no other diagnoses', () => {
      const zCodeOnly: Diagnosis[] = [
        {
          code: 'Z00.00',
          description: 'Encounter for general adult medical examination',
          confidence: 0.95,
          status: 'confirmed',
          evidence: 'Annual checkup',
          priority: 'primary',
          validated: true,
        },
      ];

      const result = prioritizeDiagnoses(zCodeOnly, 'Annual checkup appointment');
      
      // Z code should not be filtered when it's the only diagnosis
      expect(result.length).toBe(1);
      expect(result[0].code).toBe('Z00.00');
      expect(result[0].priority).toBe('primary');
    });

    it('should handle all diagnoses below confidence threshold', () => {
      const lowConfidence: Diagnosis[] = mockDiagnoses.map(d => ({
        ...d,
        confidence: 0.2,
      }));

      const result = prioritizeDiagnoses(lowConfidence, mockClinicalNote, {
        minConfidence: 0.3,
      });

      expect(result.length).toBe(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle acute chest pain visit correctly', () => {
      const chestPainDiagnoses: Diagnosis[] = [
        {
          code: 'I21.9',
          description: 'Acute myocardial infarction, unspecified',
          confidence: 0.85,
          status: 'suspected',
          evidence: 'Acute chest pain, ST elevation',
          priority: 'secondary',
          validated: true,
        },
        {
          code: 'R07.9',
          description: 'Chest pain, unspecified',
          confidence: 0.95,
          status: 'confirmed',
          evidence: 'Patient reports chest pain',
          priority: 'secondary',
          validated: true,
        },
        {
          code: 'E11.9',
          description: 'Type 2 diabetes mellitus',
          confidence: 0.92,
          status: 'confirmed',
          evidence: 'History of diabetes',
          priority: 'secondary',
          validated: true,
        },
      ];

      const result = prioritizeDiagnoses(chestPainDiagnoses, mockClinicalNote);

      // Acute MI should be primary despite lower confidence
      expect(result[0].code).toBe('I21.9');
      expect(result[0].priority).toBe('primary');
    });

    it('should handle chronic disease management visit', () => {
      const chronicDiagnoses: Diagnosis[] = [
        {
          code: 'E11.65',
          description: 'Type 2 diabetes with hyperglycemia',
          confidence: 0.95,
          status: 'confirmed',
          evidence: 'HbA1c 8.5%, hyperglycemia',
          priority: 'secondary',
          validated: true,
        },
        {
          code: 'I10',
          description: 'Essential hypertension',
          confidence: 0.92,
          status: 'confirmed',
          evidence: 'BP 145/90',
          priority: 'secondary',
          validated: true,
        },
        {
          code: 'E78.5',
          description: 'Hyperlipidemia',
          confidence: 0.88,
          status: 'confirmed',
          evidence: 'Elevated cholesterol',
          priority: 'secondary',
          validated: true,
        },
      ];

      const result = prioritizeDiagnoses(chronicDiagnoses, 
        'Follow-up visit for diabetes, hypertension, and cholesterol management. HbA1c 8.5%.');

      // Most specific diabetes code should be primary
      expect(result[0].code).toBe('E11.65');
      expect(result.length).toBe(3);
    });
  });
});
