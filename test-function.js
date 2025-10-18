const admin = require('firebase-admin');
const functions = require('firebase-functions-test')();

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}

// Sample test data
const testData = {
    consultationText: "Patient presents with chest pain, shortness of breath, and elevated troponin levels. ECG shows ST elevation. Diagnosed with acute myocardial infarction."
};

console.log('Testing extractICD10Codes function...');
console.log('Test data:', testData);

// This would call the function locally if we had it set up
// For now, let's just show what we would test
console.log('Function would process:', testData.consultationText.length, 'characters');

functions.cleanup();