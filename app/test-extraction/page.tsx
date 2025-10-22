'use client';

import { useState } from 'react';
import DiagnosisExtractor from '@/components/DiagnosisExtractor';
import { Diagnosis } from '@/types/diagnosis';

// Sample clinical notes for testing
const sampleNotes = {
  hypertension: `Chief Complaint: High blood pressure check
  
History of Present Illness:
58-year-old male presents for routine blood pressure monitoring. Patient reports intermittent headaches and occasional dizziness. Blood pressure readings at home have been elevated (150-160/90-95 mmHg) over the past 2 weeks.

Physical Examination:
- Vital Signs: BP 162/94 mmHg, HR 78 bpm, Temp 98.6°F
- HEENT: Normal
- Cardiovascular: Regular rate and rhythm, no murmurs
- Lungs: Clear bilaterally

Assessment & Plan:
- Essential hypertension - Continue current antihypertensive therapy
- Follow up in 4 weeks`,

  diabetes: `Chief Complaint: Diabetes follow-up

History of Present Illness:
45-year-old female with Type 2 diabetes mellitus presents for routine diabetes management. Patient reports good adherence to metformin. Recent HbA1c was 8.2%. Denies polyuria, polydipsia, or recent weight changes.

Physical Examination:
- Vital Signs: BP 128/82 mmHg, BMI 32
- Feet: No ulcers, good circulation
- Eyes: Diabetic retinopathy screening due

Laboratory Results:
- HbA1c: 8.2% (target <7%)
- Fasting glucose: 145 mg/dL

Assessment & Plan:
- Type 2 diabetes mellitus with poor glycemic control
- Increase metformin dose and add glipizide
- Diabetic retinopathy screening scheduled`,

  complex: `Chief Complaint: Chest pain and shortness of breath

History of Present Illness:
72-year-old male with history of hypertension and coronary artery disease presents with acute onset chest pain and dyspnea. Pain started 2 hours ago, described as crushing substernal pain radiating to left arm. Associated with diaphoresis and nausea.

Past Medical History:
- Essential hypertension
- Coronary artery disease
- Previous myocardial infarction (2019)
- Type 2 diabetes mellitus

Physical Examination:
- Vital Signs: BP 180/100 mmHg, HR 110 bpm, RR 24, O2 sat 92% on room air
- Cardiovascular: Tachycardic, S3 gallop present
- Pulmonary: Bilateral crackles in lower lobes
- Extremities: No edema

ECG: ST-elevation in leads II, III, aVF consistent with inferior STEMI

Laboratory:
- Troponin I: 15.2 ng/mL (elevated)
- BNP: 850 pg/mL (elevated)

Assessment & Plan:
- Acute ST-elevation myocardial infarction (STEMI) - inferior wall
- Acute heart failure with pulmonary edema
- Hypertensive crisis
- Background diabetes mellitus and coronary artery disease
- Emergent cardiac catheterization indicated`,

  suspected: `Chief Complaint: Joint pain and stiffness

History of Present Illness:
55-year-old female presents with 6-month history of bilateral hand and wrist pain and morning stiffness lasting >1 hour. Pain is worse in the morning and improves with activity. Patient also reports fatigue and occasional low-grade fever.

Physical Examination:
- Joints: Bilateral MCP and PIP joint swelling and tenderness
- Morning stiffness >1 hour
- No obvious joint deformities yet

Laboratory:
- RF: Positive (1:320)
- Anti-CCP: Positive (high titer)
- ESR: 45 mm/hr (elevated)
- CRP: 15 mg/L (elevated)

Assessment & Plan:
- Probable rheumatoid arthritis - refer to rheumatology
- Rule out other inflammatory arthropathies
- Start NSAIDs for symptom management
- Rheumatology consultation scheduled`,
};

export default function TestExtractionPage() {
  const [selectedSample, setSelectedSample] = useState<string>('');
  const [extractedDiagnoses, setExtractedDiagnoses] = useState<Diagnosis[]>([]);
  const [testResults, setTestResults] = useState<string[]>([]);

  const handleExtractComplete = (diagnoses: Diagnosis[]) => {
    setExtractedDiagnoses(diagnoses);
    
    // Add test result
    const result = `✅ Successfully extracted ${diagnoses.length} diagnoses`;
    setTestResults(prev => [...prev, result]);
  };

  const handleError = (error: string) => {
    const result = `❌ Error: ${error}`;
    setTestResults(prev => [...prev, result]);
  };

  const loadSampleNote = (key: string) => {
    setSelectedSample(sampleNotes[key as keyof typeof sampleNotes]);
  };

  const runValidationTests = () => {
    setTestResults([]);
    
    const tests = [
      {
        name: 'ICD-10 Code Format',
        check: (diagnoses: Diagnosis[]) => 
          diagnoses.every(d => /^[A-TV-Z][0-9][0-9AB](\.[0-9A-TV-Z]{1,4})?$/.test(d.code))
      },
      {
        name: 'Required Fields Present',
        check: (diagnoses: Diagnosis[]) =>
          diagnoses.every(d => d.code && d.description && d.evidence && d.priority && d.status)
      },
      {
        name: 'Confidence Range Valid',
        check: (diagnoses: Diagnosis[]) =>
          diagnoses.every(d => d.confidence >= 0 && d.confidence <= 1)
      },
      {
        name: 'Priority Values Valid',
        check: (diagnoses: Diagnosis[]) =>
          diagnoses.every(d => ['primary', 'secondary'].includes(d.priority))
      },
      {
        name: 'Status Values Valid',
        check: (diagnoses: Diagnosis[]) =>
          diagnoses.every(d => ['confirmed', 'suspected', 'rule_out', 'history_of'].includes(d.status))
      }
    ];

    const results = tests.map(test => {
      const passed = test.check(extractedDiagnoses);
      return `${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASS' : 'FAIL'}`;
    });

    setTestResults(prev => [...prev, '--- Validation Tests ---', ...results]);
  };

  const clearResults = () => {
    setTestResults([]);
    setExtractedDiagnoses([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 ICD-10 Extraction Test Suite
          </h1>
          <p className="text-gray-600 mb-6">
            Test the structured output functionality before merging to main branch
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Sample Clinical Notes</h2>
              <div className="space-y-2">
                {Object.entries(sampleNotes).map(([key, note]) => (
                  <button
                    key={key}
                    onClick={() => loadSampleNote(key)}
                    className="block w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200"
                  >
                    <div className="font-medium capitalize text-blue-800">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </div>
                    <div className="text-sm text-blue-600 truncate">
                      {note.split('\\n')[0]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm h-64 overflow-y-auto">
                {testResults.length > 0 ? (
                  testResults.map((result, index) => (
                    <div key={index}>{result}</div>
                  ))
                ) : (
                  <div className="text-gray-500">No test results yet...</div>
                )}
              </div>
              <div className="mt-4 space-x-2">
                {extractedDiagnoses.length > 0 && (
                  <button
                    onClick={runValidationTests}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Run Validation Tests
                  </button>
                )}
                <button
                  onClick={clearResults}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Clear Results
                </button>
              </div>
            </div>
          </div>

          {selectedSample && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Selected Clinical Note</h3>
              <div className="bg-gray-50 p-4 rounded-md border max-h-40 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedSample}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DiagnosisExtractor
          onExtractComplete={handleExtractComplete}
          onError={handleError}
        />

        {/* API Testing Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-2xl font-semibold mb-4">🔧 Manual API Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Test API Directly</h3>
              <code className="block bg-gray-100 p-3 rounded text-sm">
                POST /api/extract-codes<br/>
                Content-Type: application/json<br/><br/>
                {JSON.stringify({
                  clinicalNote: "Patient presents with..."
                }, null, 2)}
              </code>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Expected Response</h3>
              <code className="block bg-gray-100 p-3 rounded text-sm">
                {JSON.stringify({
                  success: true,
                  diagnoses: [
                    {
                      code: "I10",
                      description: "Essential hypertension",
                      confidence: 0.95,
                      evidence: "Blood pressure 160/90 mmHg",
                      priority: "primary",
                      status: "confirmed"
                    }
                  ],
                  timestamp: "2024-01-20T12:00:00Z",
                  model: "gpt-4o"
                }, null, 2)}
              </code>
            </div>
          </div>
        </div>

        {/* Environment Check */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">⚠️ Environment Setup Required</h3>
          <ul className="text-yellow-700 space-y-1">
            <li>• Ensure <code>OPENAI_API_KEY</code> is set in your environment variables</li>
            <li>• Install required dependencies: <code>npm install openai</code></li>
            <li>• For Firebase functions: Update the functions directory as well</li>
          </ul>
        </div>
      </div>
    </div>
  );
}