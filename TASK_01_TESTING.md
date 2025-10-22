# Task-01 Manual Testing Checklist

**Date Started:** _______
**Tester:** _______
**Status:** 🚧 In Progress

## Prerequisites
- [x] Code files created
- [ ] .env.local configured with OPENAI_API_KEY
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server running (`npm run dev`)

## Test Scenarios

### Test 1: Basic API Functionality
**Objective:** Verify API accepts valid input and returns structured JSON

**Steps:**
1. Start dev server: `npm run dev`
2. Run CLI test: `npm run test:api`

**Expected Results:**
- [ ] Server starts on http://localhost:3000
- [ ] API responds with status 200
- [ ] Response contains `success: true`
- [ ] Response includes `diagnoses` array
- [ ] Each diagnosis has all 6 required fields

**Actual Results:**
```
[Record output here]
```

---

### Test 2: Interactive UI Testing
**Objective:** Test the extraction UI with sample clinical notes

**Steps:**
1. Navigate to http://localhost:3000/test-extraction
2. Click "hypertension" sample note
3. Click "Extract ICD-10 Codes"
4. Click "Run Validation Tests"

**Expected Results:**
- [ ] Page loads without errors
- [ ] Sample note populates textarea
- [ ] Extraction completes within 5 seconds
- [ ] Results display with confidence badges
- [ ] All validation tests pass (5/5 green checkmarks)

**Actual Results:**
```
Extraction time: _____ ms
Codes extracted: _____
Validation results: _____
```

---

### Test 3: Input Validation
**Objective:** Verify proper error handling

**Test 3a: Empty Input**
**Steps:**
1. Go to http://localhost:3000/test-extraction
2. Leave textarea empty
3. Click "Extract ICD-10 Codes"

**Expected Results:**
- [ ] Error message: "Please enter a clinical note"
- [ ] No API call made

**Test 3b: Too Short Input**
**Steps:**
1. Enter "test" (< 10 characters)
2. Click "Extract ICD-10 Codes"

**Expected Results:**
- [ ] Error message: "Clinical note is too short..."
- [ ] HTTP 400 status

**Test 3c: Too Long Input**
**Steps:**
1. Paste text > 50,000 characters
2. Click "Extract ICD-10 Codes"

**Expected Results:**
- [ ] Error message: "exceeds maximum length"
- [ ] HTTP 400 status

**Actual Results:**
```
[Record each test result]
```

---

### Test 4: Data Structure Validation
**Objective:** Verify all diagnosis fields are properly formatted

**Steps:**
1. Extract codes from "complex" sample note
2. Inspect each diagnosis object

**Expected Results:**
- [ ] `code`: Valid ICD-10 format (e.g., "I10", "E11.9")
- [ ] `description`: Non-empty string
- [ ] `confidence`: Number between 0 and 1
- [ ] `evidence`: Direct quote from clinical note
- [ ] `priority`: "primary" or "secondary"
- [ ] `status`: "confirmed", "suspected", "rule_out", or "history_of"

**Sample Diagnosis to Verify:**
```json
{
  "code": "_____",
  "description": "_____",
  "confidence": _____,
  "evidence": "_____",
  "priority": "_____",
  "status": "_____"
}
```

---

### Test 5: Error Handling
**Objective:** Verify graceful failure handling

**Test 5a: Invalid API Key**
**Steps:**
1. Temporarily set invalid OPENAI_API_KEY in .env.local
2. Restart server
3. Try extraction

**Expected Results:**
- [ ] Error message displayed to user
- [ ] HTTP 500 status
- [ ] Error code: "API_ERROR"
- [ ] No crash or unhandled exceptions

**Test 5b: Network Timeout (Optional)**
**Steps:**
1. Disconnect internet mid-request (if possible)

**Expected Results:**
- [ ] Retry logic activates
- [ ] User-friendly error message
- [ ] No crash

**Actual Results:**
```
[Record error handling behavior]
```

---

### Test 6: Performance Benchmarks
**Objective:** Verify performance meets requirements

**Steps:**
1. Extract codes from each sample note
2. Record processing time from response

**Expected Results:**
- [ ] Simple note (hypertension): < 3 seconds
- [ ] Medium note (diabetes): < 4 seconds  
- [ ] Complex note (STEMI): < 5 seconds
- [ ] Average response time: < 5 seconds

**Actual Results:**
| Note Type | Processing Time | Codes Extracted | Pass/Fail |
|-----------|-----------------|-----------------|-----------|
| Simple    | _____ms        | _____          | ___       |
| Medium    | _____ms        | _____          | ___       |
| Complex   | _____ms        | _____          | ___       |
| Average   | _____ms        | _____          | ___       |

---

### Test 7: Diagnosis Quality
**Objective:** Verify extracted codes are clinically accurate

**Steps:**
1. Extract codes from diabetes sample note
2. Verify codes match clinical content

**Expected Results:**
- [ ] E11.9 (Type 2 diabetes) extracted with high confidence
- [ ] Evidence quotes actual text from note
- [ ] Primary diagnosis correctly identified
- [ ] No hallucinated codes

**Actual Results:**
```
Codes found: _____
Accuracy: _____
False positives: _____
```

---

### Test 8: Firebase Function (Optional)
**Objective:** Test updated Firebase function

**Steps:**
1. `cd functions`
2. `firebase emulators:start --only functions`
3. Call `extractICD10Codes` function

**Expected Results:**
- [ ] Function responds with structured output
- [ ] Same data format as Next.js API route
- [ ] Audit logging works

**Actual Results:**
```
[Record Firebase function results]
```

---

## Final Checklist

### Code Quality
- [ ] No console errors in browser
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No linting errors (`npm run lint`)
- [ ] All imports resolve correctly

### Success Metrics Verification
- [ ] ✅ 95%+ valid ICD-10 code format
- [ ] ✅ <5 second response time
- [ ] ✅ All 6 required fields populated
- [ ] ✅ Error handling for all edge cases
- [ ] ✅ Proper retry logic for rate limits

### Documentation
- [ ] README updated with API usage
- [ ] Environment variables documented
- [ ] Example requests/responses provided
- [ ] Troubleshooting guide included

## Issues Found

| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| 1 |       |          |        |       |
| 2 |       |          |        |       |

## Sign-Off

**All tests passed:** [ ] Yes [ ] No

**Ready for merge:** [ ] Yes [ ] No

**Tester Signature:** _______________ **Date:** _______________

**Reviewer Signature:** _______________ **Date:** _______________