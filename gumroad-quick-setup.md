# 🚀 Quick Gumroad Setup - Current Interface (2024)

## Step 1: Create Your Product

1. **Go to Gumroad.com** → Sign up or login
2. **Dashboard** → **"+ Create"** or **"New Product"** button
3. **Choose "Digital"** product type

---

## Step 2: Basic Product Setup

### Product Details:
- **Title:** `5 Ways AI Can Reduce Your Billing Workload by 80%`
- **Price:** `$0` (or `$0+` for tips)
- **Upload your PDF file**

### Description:
```
Discover how to cut your medical billing workload by 80% using AI automation — learn five powerful, practical strategies in this free guide.

✅ Automated ICD-10 code extraction
✅ Smart CPT code matching  
✅ Intelligent claims pre-screening
✅ Prior authorization automation
✅ Predictive revenue analytics

Perfect for healthcare professionals, practice managers, and medical billing staff looking to reduce administrative burden and focus more on patient care.
```

---

## Step 3: Email Collection (Current Interface)

### ✅ **Email Collection is AUTOMATIC**
- Gumroad collects emails by default for all purchases (even $0)
- No need to toggle anything special
- Emails will appear in your **"Customers"** or **"Audience"** section

### 📧 **To Send Emails Later:**
1. **Dashboard** → **"Customers"** 
2. **Export** customer list
3. Use in your email platform (Mailchimp, ConvertKit, etc.)

### 🎯 **Optional: Marketing Permissions**
Look for these (location varies):
- **"Checkout Settings"** → Marketing emails toggle
- **"Settings"** → **"Marketing"** → Customer communications
- **Product page** → **"Advanced"** → Email preferences

---

## Step 4: Publish & Get Your Link

1. **Click "Publish"** 
2. **Copy your product URL:** `https://gum.co/your-product-slug`
3. **Test the checkout** in incognito mode

---

## Step 5: Update Your Website

Replace this line in `index.html`:
```html
<!-- FIND: -->
<a href="#" id="gumroadButton" class="gumroad-button

<!-- REPLACE WITH: -->
<a href="https://gum.co/your-product-slug" id="gumroadButton" class="gumroad-button
```

---

## ✅ **You're Done!**

### Test Checklist:
- [ ] PDF downloads when someone "buys" for $0
- [ ] Email is captured (check Customers section)  
- [ ] Popup appears on your website
- [ ] Gumroad link works from popup

### Key Benefits:
- ✅ **Instant email capture** - Even for free products
- ✅ **Professional checkout** - Builds trust
- ✅ **Customer management** - All emails in one place
- ✅ **Analytics** - Track downloads and conversions

---

## 🆘 **Need Help?**

**If you can't find email settings:**
- Don't worry! Emails are collected automatically
- You can always export your customer list
- Focus on getting the product published first

**Still stuck?**
- Gumroad has live chat support
- Check their help docs: help.gumroad.com
- The most important thing is that the product works and captures emails (which it does by default)

**Ready to capture leads! 🎯**