# 📅 Calendly Setup Guide for CodeCraftMD Demo Scheduling

## Step 1: Create Calendly Account

### Account Setup:
1. Go to [https://calendly.com](https://calendly.com)
2. Click "Get started for free"
3. Sign up with your professional email (onyeije@gmail.com)
4. Choose the **Free Plan** to start (upgrade later if needed)

### Profile Setup:
- **Name:** Dr. Chukwuma Onyeije
- **Title:** Founder, CodeCraftMD
- **Professional Photo:** Upload a professional headshot
- **Bio:** "Practicing physician and founder of CodeCraftMD. I help healthcare professionals reduce billing workload by 80% using AI automation."

---

## Step 2: Create Demo Event Type

### Event Details:
- **Event Name:** "CodeCraftMD Demo - AI Billing Automation"
- **Duration:** 15 minutes
- **Event Type:** One-on-One
- **Location:** Zoom (Calendly will auto-generate Zoom links)

### Event Description:
```
Ready to see how AI can cut your billing time by 80%?

In this 15-minute demo, I'll show you:
✅ Live AI extraction of ICD-10 codes from clinical notes
✅ Automated CPT code matching with medical necessity
✅ Your specific time-savings calculation
✅ Custom implementation roadmap for your practice

This is perfect for:
• Physicians spending 2+ hours daily on billing
• Practice managers looking to reduce administrative costs
• Healthcare professionals frustrated with manual coding

What to expect:
- Quick screen share demonstration
- Analysis of your current workflow
- Specific recommendations for your practice
- No sales pressure - just valuable insights

Looking forward to showing you how CodeCraftMD can give you back your evenings!

Questions? Email me at info@codecraftmd.com
```

### Advanced Settings:
- **Buffer time:** 5 minutes before and after
- **Max events per day:** 6
- **Date range:** 60 days into future
- **Minimum notice:** 2 hours
- **Time increments:** 15 minutes

---

## Step 3: Set Your Availability

### Recommended Schedule:
**Monday - Friday:**
- 9:00 AM - 12:00 PM (Morning slots)
- 1:00 PM - 5:00 PM (Afternoon slots)  
- 7:00 PM - 8:30 PM (Evening slots for busy physicians)

**Saturday:**
- 9:00 AM - 12:00 PM (Weekend option)

### Time Zone Settings:
- Set your primary time zone
- Allow invitees to see times in their zone
- Display multiple time zones if serving national audience

---

## Step 4: Customize Booking Page

### Branding:
- **Logo:** Upload CodeCraftMD logo
- **Color scheme:** Blue (#1D4ED8) to match your website
- **Welcome message:** "Let's reduce your billing workload by 80%"

### Questions to Ask Invitees:
1. **Name** (required)
2. **Email** (required)
3. **Phone** (optional)
4. **Practice Type** (dropdown):
   - Family Medicine
   - Internal Medicine
   - Pediatrics
   - Cardiology
   - Orthopedics
   - Other
5. **Practice Size** (dropdown):
   - Solo practitioner
   - 2-5 physicians
   - 6-10 physicians  
   - 11-25 physicians
   - 25+ physicians
6. **Current Billing Challenge** (text area):
   "What's your biggest billing frustration right now?"
7. **Weekly Billing Hours** (dropdown):
   - Less than 5 hours
   - 5-10 hours
   - 10-20 hours
   - More than 20 hours

---

## Step 5: Integration & Notifications

### Email Confirmations:
**Confirmation Email Template:**
```
Subject: Your CodeCraftMD Demo is Confirmed! 🎉

Hi [Invitee Name],

Thanks for booking a demo! I'm excited to show you how AI can transform your billing workflow.

📅 Demo Details:
Date: [Event Date]
Time: [Event Time]
Duration: 15 minutes
Zoom Link: [Zoom Link] (will be sent closer to meeting time)

🎯 What We'll Cover:
• Live demo of AI code extraction
• Your potential time savings calculation  
• Custom implementation roadmap
• Q&A about your specific needs

📋 Come Prepared:
• Think about your current billing process
• Consider your most common diagnosis types
• Bring any questions about AI automation

Looking forward to our conversation!

Best,
Dr. Chukwuma Onyeije
CodeCraftMD

P.S. - If you need to reschedule, just click the link in your calendar invite.
```

### Reminder Settings:
- **24 hours before:** Email + SMS reminder
- **1 hour before:** Email reminder
- **Custom message:** "Looking forward to showing you how to cut your billing time by 80%!"

### Follow-up Actions:
- **After booking:** Add to email sequence "Demo Scheduled"
- **After completion:** Send thank you email with resources
- **No-show:** Trigger no-show email sequence

---

## Step 6: Integration with Website

### Direct Booking Links:
Your Calendly link will be: `https://calendly.com/your-username/codecraftmd-demo`

### Website Integration Options:

#### Option 1: Direct Link (Simplest)
```html
<a href="https://calendly.com/your-username/codecraftmd-demo" 
   class="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition">
   📅 Schedule Your Free Demo
</a>
```

#### Option 2: Popup Widget (Recommended)
```html
<!-- Calendly link widget begin -->
<link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">
<script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript" async></script>
<a href="" onclick="Calendly.initPopupWidget({url: 'https://calendly.com/your-username/codecraftmd-demo'});return false;"
   class="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition">
   📅 Schedule Your Free Demo
</a>
<!-- Calendly link widget end -->
```

#### Option 3: Inline Embed (For dedicated booking page)
```html
<!-- Calendly inline widget begin -->
<div class="calendly-inline-widget" data-url="https://calendly.com/your-username/codecraftmd-demo" style="min-width:320px;height:630px;"></div>
<script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
<!-- Calendly inline widget end -->
```

---

## Step 7: Update Website with Calendly Integration

I'll update your website to include Calendly booking in all the right places:

1. **Email sequence links** → Replace [Calendly Link] placeholders
2. **Landing page CTA buttons** → Add demo booking options
3. **Thank you message** → Include demo booking
4. **Contact section** → Add demo scheduling option

---

## Step 8: Testing & Optimization

### Test Your Setup:
1. **Book a test appointment** using a different email
2. **Check all email notifications** arrive properly
3. **Test the Zoom integration** works correctly
4. **Verify mobile experience** looks good
5. **Test reminder system** sends at right times

### Optimization Tips:
- **Track booking rates** from different sources
- **A/B test different CTAs** (Schedule Demo vs Book Free Consultation)
- **Monitor no-show rates** and adjust reminders
- **Collect feedback** after demos to improve process

---

## Step 9: Calendly Analytics & Reporting

### Key Metrics to Track:
- **Booking conversion rate** (website visitors → bookings)
- **Show rate** (bookings → attended demos)  
- **Demo to trial rate** (demos → CodeCraftMD signups)
- **Peak booking times** (optimize availability)
- **Source tracking** (which emails/pages drive bookings)

### Monthly Reports:
- Total demos booked
- Show/no-show rates
- Conversion to trials
- Most effective traffic sources
- Common questions/objections

---

## Step 10: Advanced Automations (Optional)

### Zapier Integrations:
1. **New booking** → Add to CRM
2. **Demo completed** → Send follow-up sequence
3. **No-show** → Add to re-engagement campaign
4. **Booking cancelled** → Trigger alternative content

### CRM Integration:
- Sync booking data with your customer database
- Track demo outcomes and follow-up actions
- Measure ROI of demo program

---

## Quick Setup Checklist:

- [ ] Create Calendly account
- [ ] Set up demo event type (15 minutes)
- [ ] Configure availability schedule  
- [ ] Customize booking page with branding
- [ ] Add intake questions
- [ ] Set up email confirmations and reminders
- [ ] Test booking flow end-to-end
- [ ] Get your booking link
- [ ] Update website with Calendly integration
- [ ] Replace email template placeholders
- [ ] Test on mobile devices
- [ ] Set up analytics tracking

**Your Calendly URL will be:** `https://calendly.com/[your-username]/codecraftmd-demo`

Ready to start booking demos? This setup should convert 5-15% of your email subscribers into demo bookings!