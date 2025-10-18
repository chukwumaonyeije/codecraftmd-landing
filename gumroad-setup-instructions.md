# 🚀 Gumroad Lead Magnet Setup - Step by Step

## Step 1: Create Your PDF Guide
✅ **COMPLETED** - Your guide is ready in `lead-magnet-pdf.html`

**To convert to PDF:**
1. The HTML file should be open in your browser now
2. Press `Ctrl + P` (Print)
3. Choose "Save as PDF" as the destination
4. Save as: `5-Ways-AI-Can-Reduce-Billing-Workload-80-Percent.pdf`
5. Make sure "More settings" → "Headers and footers" is OFF
6. Click "Save"

---

## Step 2: Create Gumroad Account & Product

### Create Account:
1. Go to [https://gumroad.com](https://gumroad.com)
2. Click "Start selling" (top right)
3. Sign up with email or Google
4. Complete your profile setup

### Create Your Product:
1. Dashboard → "Products" → "New Product"
2. Choose **"Digital Product"**
3. **Product Name:** "5 Ways AI Can Reduce Your Billing Workload by 80%"
4. **Price:** Set to **$0** (or $0+ to allow tips)
5. **Upload File:** Upload your PDF
6. **Short Description:**
```
Discover how to cut your medical billing workload by 80% using AI automation — learn five powerful, practical strategies in this free guide.

✅ Automated ICD-10 code extraction
✅ Smart CPT code matching  
✅ Intelligent claims pre-screening
✅ Prior authorization automation
✅ Predictive revenue analytics

Perfect for healthcare professionals, practice managers, and medical billing staff looking to reduce administrative burden and focus more on patient care.
```

### Configure Email Capture:
**In the current Gumroad interface, look for these settings:**

1. **Email Collection** (usually under "Advanced" or "Checkout" settings):
   - ✅ "Collect customer email" should be ON by default
   - ✅ Look for "Marketing emails" or "Allow marketing" toggle

2. **Customer Communication**:
   - ✅ Enable "Send product updates to customers"
   - ✅ This might be under "Marketing" or "Customer" settings

3. **Custom thank you message:**
```
🎉 Thanks for downloading your AI billing guide!

Your PDF is downloading now. You'll also receive occasional insights on AI + healthcare automation that can help streamline your practice.

Ready to see these strategies in action? Schedule a demo at info@codecraftmd.com

- Dr. Chukwuma Onyeije, CodeCraftMD
```

### Product Settings:
- **Category:** Business & Industrial
- **Tags:** medical billing, AI automation, healthcare, ICD-10, productivity
- ✅ **Make product discoverable:** ON

---

## Step 3: Get Your Product URL

After publishing, you'll get a URL like:
`https://gum.co/YOUR_PRODUCT_SLUG`

**Copy this URL - you'll need it for the next step!**

### 🔧 **Can't Find Email Settings?**

If you don't see the exact email options mentioned above, here's what to look for in the current Gumroad interface:

**Location Options:**
- Check under "Checkout" tab when editing your product
- Look in "Settings" → "Marketing" in your main dashboard
- Try "Product Settings" → "Advanced Options"
- Check "Customer" or "Audience" sections

**Alternative Names:**
- "Email marketing permissions"
- "Allow promotional emails"
- "Customer communication preferences"
- "Newsletter signup"

**Key Point:** As long as emails are collected at checkout (which happens by default), you'll be able to export your customer list and email them manually if needed.

---

## Step 4: Update Your Website

You need to replace the placeholder Gumroad link in your popup. 

**Current placeholder in index.html:**
```html
<a href="#" id="gumroadButton" class="gumroad-button bg-blue-600...">
```

**Replace with your actual Gumroad URL:**
```html
<a href="https://gum.co/YOUR_PRODUCT_SLUG" id="gumroadButton" class="gumroad-button bg-blue-600...">
```

---

## Step 5: Test Your Setup

### Test Process:
1. Open your website in incognito/private browsing
2. Wait 15 seconds or scroll down 50% to trigger popup
3. Click "Get Your Free Guide" 
4. Complete the $0 checkout process
5. Verify:
   - ✅ PDF downloads automatically
   - ✅ Receipt email arrives  
   - ✅ Your email is captured in Gumroad "Audience" tab

---

## Step 6: Monitor & Optimize

### Analytics to Track:
- **Gumroad Dashboard:**
  - Download count
  - Email capture rate
  - Geographic data
  
- **Website Analytics:**
  - Popup appearance rate
  - Click-through rate to Gumroad
  - Conversion rate

### Optimization Tips:
- Test popup timing (try 10s, 15s, 20s)
- A/B test popup headlines
- Monitor email deliverability
- Send follow-up email sequences

---

## Step 7: Follow-Up Email Strategy

### Immediate (Day 0):
- Welcome email with PDF (automatic)
- Link to schedule demo

### Day 3:
- "Did you implement Strategy #1?" follow-up
- Case study or success story

### Day 7:
- "5 Common AI Billing Mistakes to Avoid"
- Soft pitch for consultation

### Day 14:
- "Ready to automate your billing?" 
- Direct CTA for CodeCraftMD demo

---

## Quick Reference Commands:

**Update Gumroad link in popup:**
```bash
# Find and replace in index.html
# Replace: href="#" 
# With: href="https://gum.co/YOUR_PRODUCT_SLUG"
```

**Test popup manually:**
```javascript
// In browser console:
window.showLeadMagnet()
```

**Reset popup for testing:**
```javascript
// In browser console:
localStorage.removeItem('leadMagnetSeen')
```

---

## 🎯 Success Metrics

**Week 1 Goals:**
- 50+ PDF downloads
- 90%+ email capture rate
- 5+ demo requests

**Month 1 Goals:**  
- 200+ subscribers
- 10+ qualified leads
- 2+ paying customers

---

## Need Help?

If you encounter any issues:
1. Check Gumroad's help docs
2. Test in incognito mode
3. Verify email deliverability
4. Contact Gumroad support if needed

**Ready to launch your lead magnet! 🚀**