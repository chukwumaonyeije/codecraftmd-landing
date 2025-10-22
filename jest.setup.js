// Jest setup file
// This file is run once before all tests

// Mock fetch for Node.js environment
global.fetch = require('node-fetch');

// Setup test environment variables
process.env.OPENAI_API_KEY = 'sk-test-key-for-testing-only';

// Add custom matchers if needed
expect.extend({
  toBeValidICD10Code(received) {
    const pattern = /^[A-TV-Z][0-9][0-9AB](\.[0-9A-TV-Z]{1,4})?$/;
    const pass = pattern.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ICD-10 code`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ICD-10 code`,
        pass: false,
      };
    }
  },
});