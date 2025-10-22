# Quick Start Guide - Task-01 Testing

## 🚀 Get Started in 5 Minutes

### Step 1: Environment Setup (1 minute)

```powershell
# Set your OpenAI API key
$apiKey = Read-Host "Enter your OpenAI API key" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey)
$plainKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Create .env.local
@"
OPENAI_API_KEY=$plainKey
"@ | Out-File .env.local -Encoding utf8

Write-Host "✅ Environment configured!" -ForegroundColor Green
```

### Step 2: Install Dependencies (1 minute)

```powershell
npm install
```

### Step 3: Start Dev Server (30 seconds)

```powershell
npm run dev
```

Wait for: `✓ Ready on http://localhost:3000`

### Step 4: Run Quick Test (2 minutes)

**Option A: CLI Test (Fast)**
```powershell
# Open new terminal
npm run test:api
```

**Option B: Interactive UI (Visual)**
1. Open http://localhost:3000/test-extraction
2. Click "hypertension" sample
3. Click "Extract ICD-10 Codes"
4. Click "Run Validation Tests"

### ✅ Success Indicators

You should see:
- ✅ Response in < 5 seconds
- ✅ ICD-10 codes extracted (e.g., I10)
- ✅ All 6 fields populated
- ✅ Confidence scores 0-1
- ✅ Evidence quotes from note

## 📋 Full Testing Checklist

Once quick test passes, follow `TASK_01_TESTING.md` for comprehensive testing.

## ❌ Troubleshooting

### "OPENAI_API_KEY not configured"
```powershell
# Verify .env.local exists
Test-Path .env.local

# Check it has the key
Get-Content .env.local

# Restart server
npm run dev
```

### "Module not found"
```powershell
# Clean install
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm install
```

### Port 3000 already in use
```powershell
# Kill process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

## 🎯 What to Test

### Critical Tests
1. ✅ Basic extraction works
2. ✅ All 6 fields present
3. ✅ ICD-10 format valid
4. ✅ Response time < 5s

### Nice-to-Have Tests
- Error handling (empty input, too long, etc.)
- Multiple diagnosis extraction
- Edge cases (suspected, rule_out, etc.)

## 📝 After Testing

Mark items complete in:
- [ ] `TASK_01_TESTING.md` - Fill in actual results
- [ ] `BILLING_BRANCH_STRATEGY.md` - Check off completed items

## 🔄 Next Steps

Once testing passes:
1. Commit changes to task-01 branch
2. Merge to billing-improvements
3. Begin task-02 (CMS validation)

---

**Need Help?** Check `docs/TASK_01_STRUCTURED_JSON_OUTPUT.md` for full documentation.