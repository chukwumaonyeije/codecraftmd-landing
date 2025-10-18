# 🔑 OpenAI API Key Setup Instructions

## **Current Issue**
The "Using basic code detection" message appears because the OpenAI API key is not configured in your Firebase Functions environment. The Firebase logs show status code 400 errors, confirming this issue.

## **🚀 Quick Fix Steps**

### **Step 1: Get Your OpenAI API Key**
1. Go to: https://platform.openai.com/api-keys
2. Log in to your OpenAI account
3. Click "Create new secret key"
4. Name it: `CodeCraftMD-Production`
5. **Copy the key** - it will look like: `sk-...`

### **Step 2: Set Up Environment Variable**
Open your terminal in the project directory and run:

```bash
# Set OpenAI API key as environment variable
firebase functions:config:set openai.api_key="your_openai_api_key_here"
```

**Replace `your_openai_api_key_here` with your actual API key.**

### **Step 3: Update Functions Code**
The code needs to be updated to use Firebase config instead of process.env.

### **Step 4: Redeploy**
```bash
firebase deploy --only functions
```

## **🔒 Security Notes**
- ✅ API key stored securely in Firebase Functions config
- ✅ Not exposed in frontend code
- ✅ Only accessible by authenticated Firebase Functions
- ✅ Encrypted in Firebase infrastructure

## **🧪 Testing After Setup**
1. Go to your dashboard
2. Paste medical text and click "Extract ICD-10 Codes"
3. You should see proper ICD-10 codes extracted (not "basic code detection")

## **💡 Expected Behavior After Fix**
- ✅ Proper medical AI analysis
- ✅ Accurate ICD-10 codes with descriptions
- ✅ CPT codes extracted
- ✅ Enhanced billing data for PDFs
- ✅ No more "basic code detection" warnings

---

**⚠️ IMPORTANT:** Keep your OpenAI API key secure and never commit it to code repositories.