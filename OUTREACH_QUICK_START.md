# Outreach Campaign - Quick Start

## What Was Created

✅ **Landing Page** (`/app/outreach/page.tsx`)
- Beautiful, responsive design
- Campaign tracking on page load
- Sign-up form for lead capture
- 2-week free trial offer display
- Success confirmation with offer code

✅ **API Route** (`/app/api/outreach/route.ts`)
- GET endpoint: Track campaign visits
- POST endpoint: Capture lead information
- Automatic Firestore logging
- Unique offer code generation

✅ **Dashboard Integration** (`dashboard.html`)
- Admin-only campaign metrics section
- Real-time statistics (visits, signups, conversion rate)
- Lead details with contact information
- Campaign performance tracking

✅ **Firestore Security** (`firestore.rules`)
- Server-side only write access
- Admin-only read access
- Secure data collection

✅ **Documentation**
- Complete setup guide (`OUTREACH_CAMPAIGN_SETUP.md`)
- QR code generator script (`generate-qr-campaigns.ps1`)

## How It Works

1. **Create QR Code**
   ```
   URL: https://codecraftmd.com/outreach?campaign=YOUR-CAMPAIGN-NAME
   ```

2. **User Scans QR Code**
   - Visits landing page
   - Visit is automatically tracked in Firestore
   - Sees 2-week free trial offer

3. **User Signs Up**
   - Enters name, email, phone (optional)
   - Submits form
   - Gets unique offer code
   - Lead saved to Firestore

4. **You Track Results**
   - Log into admin dashboard
   - View campaign statistics
   - See all leads and conversions
   - Export data as needed

## Quick Deploy

```powershell
# Build the application
npm run build

# Deploy to Firebase
firebase deploy

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

## Generate QR Codes

```powershell
# Run the generator script
.\generate-qr-campaigns.ps1

# Or manually create URLs:
# https://codecraftmd.com/outreach?campaign=YOUR-CAMPAIGN-NAME
```

## View Campaign Data

1. Log into dashboard: `https://codecraftmd.com/dashboard`
2. Must be logged in as admin email (see `dashboard.html` line 2340)
3. Campaign section appears automatically for admins
4. Click "🔄 Refresh" to update data

## Test Locally

```powershell
# Start dev server
npm run dev

# Visit in browser
http://localhost:3000/outreach?campaign=test

# Fill out form and submit

# Check dashboard
http://localhost:3000/dashboard

# View Firestore Console
https://console.firebase.google.com/project/codecraftmd-e48b0/firestore
```

## Campaign URLs Examples

```
Direct Mail Q1:
https://codecraftmd.com/outreach?campaign=snailmail-q1-2025

Atlanta Conference:
https://codecraftmd.com/outreach?campaign=atlanta-physician-fair

Referral Program:
https://codecraftmd.com/outreach?campaign=referral-dr-smith
```

## Firestore Structure

Collection: `outreach_leads`

**Visit Record:**
```json
{
  "campaign": "snailmail-q1",
  "status": "visited",
  "timestamp": "2025-01-15T10:30:00Z",
  "ipAddress": "192.168.1.1"
}
```

**Signup Record:**
```json
{
  "campaign": "snailmail-q1",
  "status": "signed-up",
  "email": "doctor@example.com",
  "name": "Dr. Jane Smith",
  "phone": "(555) 123-4567",
  "offerCode": "SNAILMAIL-Q1-2WEEKS",
  "timestamp": "2025-01-15T10:35:00Z"
}
```

## Admin Setup

To add admin users, edit `dashboard.html` (line 2340):

```javascript
const isAdmin = userEmail === 'admin@codecraftmd.com' || 
                userEmail === 'onyeiulonu@gmail.com' ||
                userEmail === 'your-email@example.com';
```

## Customization Tips

### Change Offer Duration
Edit `app/outreach/page.tsx` line 93:
```tsx
<div className="text-4xl font-bold text-yellow-900 mb-2">
  3 Weeks FREE  {/* Changed from 2 weeks */}
</div>
```

### Modify Benefits
Edit `app/outreach/page.tsx` lines 106-134:
```tsx
<ul className="space-y-3">
  <li>Your custom benefit here</li>
</ul>
```

### Change Colors
Edit `app/outreach/page.tsx` line 75:
```tsx
className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100"
```

## Troubleshooting

**Problem**: QR code doesn't work
- **Solution**: Test URL in browser first, ensure campaign parameter is included

**Problem**: Data not showing in dashboard
- **Solution**: Check admin email list, refresh page, check browser console

**Problem**: Firebase permission errors
- **Solution**: Deploy Firestore rules: `firebase deploy --only firestore:rules`

**Problem**: API route not working
- **Solution**: Check Next.js is running, verify API route file exists

## Next Steps

1. ✅ Test locally
2. ✅ Deploy to production
3. ✅ Generate QR codes
4. ✅ Add to marketing materials
5. ✅ Track in dashboard

## Files Modified/Created

```
app/
  api/
    outreach/
      route.ts                    ← NEW API endpoint
  outreach/
    page.tsx                      ← NEW landing page

dashboard.html                    ← UPDATED with campaign tracking
firestore.rules                   ← UPDATED with security rules

OUTREACH_CAMPAIGN_SETUP.md        ← NEW complete guide
OUTREACH_QUICK_START.md           ← NEW this file
generate-qr-campaigns.ps1         ← NEW QR generator script
```

## Support

Need help?
- Review `OUTREACH_CAMPAIGN_SETUP.md` for detailed instructions
- Check Firebase Console for errors
- View browser console for client-side errors
- Check server logs: `firebase functions:log`

---

**Ready to launch your campaigns! 🚀**
