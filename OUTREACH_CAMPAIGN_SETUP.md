# Outreach Campaign Setup Guide

## Overview

The outreach campaign feature allows you to track QR code campaigns for CodeCraftMD. When potential clients scan a QR code from your marketing materials, they're directed to a landing page where they can sign up for a 2-week free trial.

## Features

- **Campaign Tracking**: Track unique campaigns via QR codes with campaign identifiers
- **Lead Capture**: Collect visitor information (name, email, phone)
- **Analytics Dashboard**: View campaign performance metrics (admin only)
- **Automatic Offer Codes**: Generate unique offer codes for each campaign
- **Firebase Integration**: All data stored securely in Firestore

## URL Structure

You can use either of these URL formats:

### Subdomain (Recommended)
```
https://outreach.codecraftmd.com/?campaign=snailmail-q1
```

### Path-based
```
https://codecraftmd.com/outreach?campaign=atlanta-mfm
```

## Setup Instructions

### 1. Deploy the Application

```powershell
# Build the Next.js application
npm run build

# Deploy to Firebase (or your preferred hosting)
firebase deploy
```

### 2. Configure DNS (For Subdomain)

If using `outreach.codecraftmd.com`:

1. Go to your DNS provider (where codecraftmd.com is registered)
2. Add a CNAME record:
   - **Name**: `outreach`
   - **Value**: Your Firebase hosting URL or main domain
   - **TTL**: 3600

### 3. Update Firebase Hosting (Optional)

If you need custom domain routing, update `firebase.json`:

```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/outreach",
        "destination": "/outreach/index.html"
      }
    ]
  }
}
```

### 4. Set Up Firestore Rules

The Firestore rules are already configured in `firestore.rules`. Deploy them:

```powershell
firebase deploy --only firestore:rules
```

## Creating QR Codes

### 1. Generate QR Code URLs

Create URLs with unique campaign identifiers:

```
https://outreach.codecraftmd.com/?campaign=snailmail-q1-2025
https://outreach.codecraftmd.com/?campaign=atlanta-physician-fair
https://outreach.codecraftmd.com/?campaign=networking-event-march
```

### 2. Generate QR Codes

Use any QR code generator:

- **Online**: QR Code Generator, QRCode Monkey
- **PowerShell Script**:

```powershell
# Install QRCoder package (if needed)
# Then create QR codes

$campaigns = @(
    "snailmail-q1-2025",
    "atlanta-physician-fair",
    "networking-event-march"
)

foreach ($campaign in $campaigns) {
    $url = "https://outreach.codecraftmd.com/?campaign=$campaign"
    # Generate QR code and save to file
    Write-Host "QR Code URL: $url"
}
```

### 3. Design Marketing Materials

Include the QR code on:
- Direct mail postcards
- Conference handouts
- Business cards
- Booth displays
- Email signatures

**Recommended Text**:
```
Scan to try CodeCraftMD FREE for 2 weeks!
AI-powered medical billing automation
No credit card required
```

## Viewing Campaign Data

### Admin Access

Campaign data is only visible to admin users. By default, admins are:
- `admin@codecraftmd.com`
- `onyeiulonu@gmail.com`

To add more admin emails, edit `dashboard.html`:

```javascript
const isAdmin = userEmail === 'admin@codecraftmd.com' || 
                userEmail === 'onyeiulonu@gmail.com' ||
                userEmail === 'youremail@example.com';
```

### Dashboard Metrics

When logged in as admin, you'll see:

1. **Total Visits**: Number of QR code scans (page visits)
2. **Sign-ups**: Number of completed registrations
3. **Conversion Rate**: Percentage of visitors who signed up
4. **Active Campaigns**: Number of unique campaigns

### Lead Details

For each lead, you'll see:
- Campaign name
- Visit/Sign-up status
- Email, name, phone (if provided)
- Unique offer code
- Timestamp

## API Endpoints

### GET /api/outreach

**Purpose**: Track page visits

**Parameters**:
- `campaign` (optional): Campaign identifier
- `source` (optional): Traffic source (default: "qr-code")

**Response**:
```json
{
  "success": true,
  "campaign": "snailmail-q1",
  "offerCode": "SNAILMAIL-Q1-2WEEKS"
}
```

### POST /api/outreach

**Purpose**: Capture lead information

**Body**:
```json
{
  "campaign": "snailmail-q1",
  "email": "doctor@example.com",
  "name": "Dr. Jane Smith",
  "phone": "(555) 123-4567"
}
```

**Response**:
```json
{
  "success": true,
  "leadId": "abc123",
  "offerCode": "SNAILMAIL-Q1-2WEEKS",
  "message": "Thank you! Your free trial is ready."
}
```

## Firestore Data Structure

### Collection: `outreach_leads`

```javascript
{
  campaign: "snailmail-q1",
  source: "qr-code",
  status: "visited" | "signed-up",
  timestamp: Timestamp,
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  
  // Only for signed-up leads:
  email: "doctor@example.com",
  name: "Dr. Jane Smith",
  phone: "(555) 123-4567",
  offerCode: "SNAILMAIL-Q1-2WEEKS"
}
```

## Campaign Naming Best Practices

Use descriptive, hyphenated names:

✅ **Good**:
- `snailmail-q1-2025`
- `atlanta-physician-conference-march`
- `cardiology-association-booth`
- `referral-program-dr-smith`

❌ **Avoid**:
- `campaign1` (not descriptive)
- `test` (vague)
- Spaces or special characters

## Testing

### Local Testing

```powershell
# Start development server
npm run dev

# Visit in browser
http://localhost:3000/outreach?campaign=test-campaign

# Check Firestore for data
# Visit dashboard at http://localhost:3000/dashboard
```

### Production Testing

1. Create a test QR code with campaign `test-your-name`
2. Scan the QR code with your phone
3. Complete the sign-up form
4. Log into the admin dashboard
5. Verify the lead appears in campaign tracking

## Customization

### Update Offer Duration

In `app/outreach/page.tsx`, change the offer text:

```tsx
<div className="text-4xl font-bold text-yellow-900 mb-2">
  2 Weeks FREE  {/* Change to 3 Weeks, 1 Month, etc. */}
</div>
```

### Change Offer Code Format

In `app/api/outreach/route.ts`:

```typescript
offerCode: `${campaign.toUpperCase()}-2WEEKS`,
// Change to:
offerCode: `WELCOME-${campaign.toUpperCase()}-FREE`,
```

### Customize Landing Page

Edit `app/outreach/page.tsx`:
- Update branding colors
- Modify benefit list
- Add testimonials
- Include demo videos

## Troubleshooting

### QR Code Not Working

1. Check URL format is correct
2. Ensure campaign parameter is included
3. Test URL in browser first

### Data Not Appearing in Dashboard

1. Verify you're logged in as admin
2. Check admin email list in `dashboard.html`
3. Refresh the dashboard
4. Check browser console for errors

### Firebase Permission Errors

1. Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. Check Firebase console for security rule errors
3. Verify Firebase Admin SDK credentials

## Next Steps

1. **Email Automation**: Integrate with email service to automatically send welcome emails
2. **CRM Integration**: Connect to your CRM for lead management
3. **A/B Testing**: Test different landing page variations
4. **Follow-up Sequences**: Set up automated follow-up campaigns

## Support

For questions or issues:
- Email: support@codecraftmd.com
- Check Firebase logs: `firebase functions:log`
- Review browser console for errors
