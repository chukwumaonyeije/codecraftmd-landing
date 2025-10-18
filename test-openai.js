// Test script to directly call the OpenAI extraction function
const fetch = require('node-fetch');
const admin = require('firebase-admin');

// Test the extraction function directly
async function testExtraction() {
  try {
    console.log('🧪 Testing OpenAI extraction function...');
    
    // Test data
    const testText = `
      Patient presents with chest pain and shortness of breath. 
      Physical examination reveals elevated blood pressure 150/90 mmHg.
      EKG shows normal sinus rhythm. 
      Diagnosed with hypertension and chest pain.
      Plan: Start ACE inhibitor, follow up in 2 weeks.
    `;
    
    // Make direct HTTP request to the function
    const response = await fetch('https://us-central1-codecraftmd-e48b0.cloudfunctions.net/extractICD10Codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail auth, but we'll see the error
      },
      body: JSON.stringify({
        consultationText: testText
      })
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', response.headers);
    
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);
    
    if (!response.ok) {
      console.log('❌ Request failed with status:', response.status);
    } else {
      const data = JSON.parse(responseText);
      console.log('✅ Success! Extracted codes:', data);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testExtraction();