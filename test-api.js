/**
 * Simple test script to validate the ICD-10 extraction API
 * Run with: node test-api.js
 */

const testCases = [
  {
    name: "Simple Hypertension",
    clinicalNote: `
Patient presents with elevated blood pressure. 
Vital signs: BP 162/94 mmHg, HR 78 bpm.
Assessment: Essential hypertension.
Plan: Continue antihypertensive therapy.
    `.trim()
  },
  {
    name: "Diabetes with Complications",
    clinicalNote: `
45-year-old female with Type 2 diabetes mellitus.
HbA1c: 8.2% (target <7%).
Diabetic retinopathy screening due.
Assessment: Type 2 diabetes mellitus with poor glycemic control.
    `.trim()
  },
  {
    name: "Complex Case - STEMI",
    clinicalNote: `
72-year-old male presents with acute chest pain and dyspnea.
Pain described as crushing substernal radiating to left arm.
ECG: ST-elevation in leads II, III, aVF.
Troponin I: 15.2 ng/mL (elevated).
Assessment: Acute ST-elevation myocardial infarction (STEMI) - inferior wall.
    `.trim()
  }
];

async function testAPI() {
  console.log('🧪 Testing ICD-10 Extraction API');
  console.log('='.repeat(50));

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    console.log('-'.repeat(30));
    
    try {
      const response = await fetch('http://localhost:3000/api/extract-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinicalNote: testCase.clinicalNote
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Success: Extracted ${data.diagnoses.length} diagnoses`);
        console.log(`⏱️  Processing time: ${data.processingTimeMs}ms`);
        console.log(`🤖 Model: ${data.model}`);
        
        data.diagnoses.forEach((diagnosis, index) => {
          console.log(`\n${index + 1}. ${diagnosis.code} - ${diagnosis.description}`);
          console.log(`   📊 Confidence: ${(diagnosis.confidence * 100).toFixed(1)}%`);
          console.log(`   🎯 Priority: ${diagnosis.priority}`);
          console.log(`   📋 Status: ${diagnosis.status}`);
          console.log(`   📝 Evidence: "${diagnosis.evidence}"`);
        });
      } else {
        console.log(`❌ Error: ${data.error}`);
        console.log(`🔧 Error Code: ${data.code}`);
      }

    } catch (error) {
      console.log(`💥 Request failed: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎯 Testing completed');
}

// Validation tests
function runValidationTests() {
  console.log('\n🔍 Running Validation Tests');
  console.log('='.repeat(50));

  const validationTests = [
    {
      name: 'ICD-10 Code Format',
      test: (code) => /^[A-TV-Z][0-9][0-9AB](\.[0-9A-TV-Z]{1,4})?$/.test(code),
      examples: ['I10', 'E11.9', 'M79.3', 'Z51.11']
    },
    {
      name: 'Priority Values',
      test: (priority) => ['primary', 'secondary'].includes(priority),
      examples: ['primary', 'secondary']
    },
    {
      name: 'Status Values',
      test: (status) => ['confirmed', 'suspected', 'rule_out', 'history_of'].includes(status),
      examples: ['confirmed', 'suspected', 'rule_out', 'history_of']
    },
    {
      name: 'Confidence Range',
      test: (confidence) => confidence >= 0 && confidence <= 1,
      examples: [0, 0.5, 0.95, 1]
    }
  ];

  validationTests.forEach(test => {
    console.log(`\n📋 ${test.name}:`);
    test.examples.forEach(example => {
      const result = test.test(example);
      console.log(`  ${result ? '✅' : '❌'} ${JSON.stringify(example)} → ${result ? 'VALID' : 'INVALID'}`);
    });
  });
}

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('🚀 Starting API Tests...\n');
  
  // First run validation tests
  runValidationTests();
  
  // Check if server is likely running
  console.log('\n🌐 Checking if development server is running...');
  fetch('http://localhost:3000/api/extract-codes')
    .then(() => {
      console.log('✅ Server appears to be running');
      return testAPI();
    })
    .catch(error => {
      console.log('❌ Server not reachable. Please start your development server:');
      console.log('   npm run dev');
      console.log('   # or');
      console.log('   yarn dev');
      console.log('\nThen run this test again: node test-api.js');
    });
}

module.exports = { testAPI, runValidationTests };