// 🔧 CodeCraftMD Diagnostics Script
// Run this in browser console to test both theme and OpenAI integration issues

console.log('🚀 Starting CodeCraftMD Diagnostics...');

// 1️⃣ THEME CONSISTENCY TEST
function testThemeConsistency() {
  console.log('\n🎨 === THEME CONSISTENCY TEST ===');
  
  // Check computed styles
  const body = document.body;
  const computedStyle = window.getComputedStyle(body);
  const backgroundColor = computedStyle.backgroundColor;
  const color = computedStyle.color;
  
  console.log('📱 Current browser:', navigator.userAgent.includes('Edg') ? 'Microsoft Edge' : 'Chrome/Other');
  console.log('🌈 Body background-color:', backgroundColor);
  console.log('📝 Body text color:', color);
  console.log('🌙 Prefers dark scheme:', window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Check meta tags
  const colorScheme = document.querySelector('meta[name="color-scheme"]');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  
  console.log('🏷️  Color scheme meta:', colorScheme ? colorScheme.content : 'Not found');
  console.log('🎯 Theme color meta:', themeColor ? themeColor.content : 'Not found');
  
  // Check if background is white
  const isWhiteBackground = backgroundColor === 'rgb(255, 255, 255)' || backgroundColor === 'white';
  console.log(isWhiteBackground ? '✅ Background is WHITE' : '❌ Background is NOT WHITE');
  
  return isWhiteBackground;
}

// 2️⃣ OPENAI INTEGRATION TEST
async function testOpenAIIntegration() {
  console.log('\n🤖 === OPENAI INTEGRATION TEST ===');
  
  // Check if user is logged in
  if (!firebase.auth().currentUser) {
    console.log('❌ User not logged in - cannot test OpenAI integration');
    return false;
  }
  
  console.log('✅ User logged in:', firebase.auth().currentUser.email);
  
  // Check Firebase Functions availability
  try {
    console.log('🔍 Testing Firebase Functions connection...');
    const token = await firebase.auth().currentUser.getIdToken();
    
    const testResponse = await fetch('https://us-central1-codecraftmd-e48b0.cloudfunctions.net/healthCheck');
    const healthData = await testResponse.json();
    console.log('💚 Health check response:', healthData);
    
    if (testResponse.ok) {
      console.log('✅ Firebase Functions are accessible');
    } else {
      console.log('❌ Firebase Functions health check failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Firebase Functions connection failed:', error);
    return false;
  }
  
  // Test with sample medical text
  const sampleText = `
    Patient presents with chest pain and shortness of breath. 
    Physical examination reveals elevated blood pressure 150/90 mmHg.
    EKG shows normal sinus rhythm. 
    Diagnosed with hypertension and chest pain.
    Plan: Start ACE inhibitor, follow up in 2 weeks.
  `;
  
  console.log('📋 Testing with sample medical text...');
  console.log('📝 Sample text length:', sampleText.length);
  
  try {
    // Test the OpenAI extraction function
    const codes = await window.callOpenAIForICD10 ? window.callOpenAIForICD10(sampleText) : null;
    
    if (codes && codes.length > 0) {
      console.log('✅ OpenAI extraction successful!');
      console.log('📊 Extracted codes:', codes);
      return true;
    } else {
      console.log('⚠️ OpenAI extraction returned no codes');
      return false;
    }
  } catch (error) {
    console.error('❌ OpenAI extraction failed:', error);
    return false;
  }
}

// 3️⃣ STRIPE INTEGRATION TEST
function testStripeIntegration() {
  console.log('\n💳 === STRIPE INTEGRATION TEST ===');
  
  // Check if Stripe is loaded
  if (typeof Stripe === 'undefined') {
    console.log('❌ Stripe.js not loaded');
    return false;
  }
  
  console.log('✅ Stripe.js loaded');
  
  // Check credit system
  const creditCount = document.getElementById('creditCount');
  if (creditCount) {
    console.log('💰 Current credits display:', creditCount.textContent);
  }
  
  // Check payment modal
  const paymentModal = document.getElementById('paymentModal');
  if (paymentModal) {
    console.log('✅ Payment modal found');
  } else {
    console.log('❌ Payment modal not found');
  }
  
  return true;
}

// 4️⃣ COMPREHENSIVE TEST RUNNER
async function runAllDiagnostics() {
  console.log('🔥 === CODECRAFTMD COMPREHENSIVE DIAGNOSTICS ===\n');
  
  const results = {
    theme: testThemeConsistency(),
    stripe: testStripeIntegration(),
    openai: await testOpenAIIntegration()
  };
  
  console.log('\n📊 === DIAGNOSTIC RESULTS SUMMARY ===');
  console.log('🎨 Theme Consistency:', results.theme ? '✅ PASS' : '❌ FAIL');
  console.log('💳 Stripe Integration:', results.stripe ? '✅ PASS' : '❌ FAIL');  
  console.log('🤖 OpenAI Integration:', results.openai ? '✅ PASS' : '❌ FAIL');
  
  if (results.theme && results.stripe && results.openai) {
    console.log('\n🎉 ALL SYSTEMS OPERATIONAL! 🎉');
  } else {
    console.log('\n⚠️  ISSUES DETECTED - CHECK INDIVIDUAL TESTS ABOVE');
  }
  
  return results;
}

// Run diagnostics automatically
runAllDiagnostics();

// Export functions for manual testing
window.debugCodeCraftMD = {
  testTheme: testThemeConsistency,
  testOpenAI: testOpenAIIntegration,
  testStripe: testStripeIntegration,
  runAll: runAllDiagnostics
};

console.log('\n💡 Manual testing available via:');
console.log('   window.debugCodeCraftMD.testTheme()');
console.log('   window.debugCodeCraftMD.testOpenAI()');
console.log('   window.debugCodeCraftMD.testStripe()');
console.log('   window.debugCodeCraftMD.runAll()');