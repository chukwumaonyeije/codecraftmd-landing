# Domain Setup Instructions for codecraftmd.com

## Step 1: Add Custom Domain in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/codecraftmd-e48b0/hosting)
2. Click on "Hosting" in the left sidebar
3. Click "Add custom domain"
4. Enter: `codecraftmd.com`
5. Follow the verification steps Firebase provides

## Step 2: DNS Configuration at Namecheap

Firebase will provide you with DNS records to add to your Namecheap domain:

### A Records (typical)
```
Type: A
Host: @
Value: 151.101.1.195
TTL: Automatic

Type: A
Host: @
Value: 151.101.65.195
TTL: Automatic
```

### CNAME Record for www
```
Type: CNAME
Host: www
Value: codecraftmd-e48b0.web.app
TTL: Automatic
```

## Step 3: Add DNS Records in Namecheap

1. Login to your Namecheap account
2. Go to Domain List → Manage for codecraftmd.com
3. Go to Advanced DNS tab
4. Add the A records and CNAME record provided by Firebase
5. Remove any existing A records pointing elsewhere

## Step 4: Verify Domain

After DNS propagation (usually 5-60 minutes):
1. Return to Firebase Console
2. Click "Verify" on your custom domain
3. Firebase will automatically provision SSL certificate

## Current Status
- ✅ App deployed to: https://codecraftmd-e48b0.web.app
- 🔄 Custom domain pending: codecraftmd.com

## Next Steps After Domain Setup
Once domain is working, we'll implement:
1. User usage tracking
2. Stripe billing integration  
3. Subscription management