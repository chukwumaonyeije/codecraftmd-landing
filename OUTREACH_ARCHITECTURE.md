# Outreach Campaign System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     MARKETING MATERIALS                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Postcard │  │   Booth  │  │  Email   │  │ Business │       │
│  │ + QR Code│  │ + QR Code│  │ + QR Code│  │   Card   │       │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘       │
└────────┼─────────────┼─────────────┼─────────────┼─────────────┘
         │             │             │             │
         └─────────────┴─────────────┴─────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │  https://codecraftmd.com/outreach   │
         │       ?campaign=snailmail-q1        │
         └─────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    LANDING PAGE (outreach/page.tsx)              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ • Detects campaign parameter                              │  │
│  │ • Calls GET /api/outreach → Tracks visit in Firestore    │  │
│  │ • Displays 2-week free trial offer                        │  │
│  │ • Shows sign-up form                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
    User Leaves Page         User Submits Form
         │                         │
         ▼                         ▼
   ┌──────────┐           ┌──────────────────────┐
   │ Firestore│           │ POST /api/outreach    │
   │  Record: │           │  • Validates email    │
   │ "visited"│           │  • Saves lead data    │
   └──────────┘           │  • Generates offer    │
                          └──────┬────────────────┘
                                 │
                                 ▼
                          ┌─────────────┐
                          │  Firestore  │
                          │   Record:   │
                          │ "signed-up" │
                          └─────────────┘
                                 │
                                 ▼
                          ┌─────────────────────┐
                          │  Success Screen     │
                          │  • Show offer code  │
                          │  • Next steps       │
                          └─────────────────────┘
```

## Data Storage Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLOUD FIRESTORE                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Collection: outreach_leads                              │   │
│  │                                                           │   │
│  │  Document 1:                   Document 2:               │   │
│  │  ┌─────────────────────┐       ┌────────────────────┐   │   │
│  │  │ campaign: "snailmail"       │ campaign: "atlanta"│   │   │
│  │  │ status: "visited"   │       │ status: "signed-up"│   │   │
│  │  │ timestamp: ...      │       │ email: "dr@..."    │   │   │
│  │  │ ipAddress: ...      │       │ name: "Dr. Smith"  │   │   │
│  │  │ userAgent: ...      │       │ phone: "(555)..."  │   │   │
│  │  └─────────────────────┘       │ offerCode: "..."   │   │   │
│  │                                 │ timestamp: ...     │   │   │
│  │                                 └────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Admin Dashboard Flow

```
┌───────────────────────────────────────────────────────────┐
│              Admin Logs Into Dashboard                    │
│              https://codecraftmd.com/dashboard            │
└────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Check if Admin User │
              │  (email verification)│
              └──────┬───────┬───────┘
                     │       │
            Not Admin│       │Admin
                     │       │
                     ▼       ▼
            ┌──────────┐   ┌───────────────────────────────┐
            │  Hide    │   │  Show Campaign Section        │
            │ Campaign │   │                               │
            │ Section  │   │  ┌─────────────────────────┐  │
            └──────────┘   │  │ Total Visits: 124       │  │
                           │  │ Sign-ups: 47            │  │
                           │  │ Conversion: 37.9%       │  │
                           │  │ Active Campaigns: 5     │  │
                           │  └─────────────────────────┘  │
                           │                               │
                           │  ┌─────────────────────────┐  │
                           │  │ Lead List:              │  │
                           │  │ • Campaign: snailmail   │  │
                           │  │   Email: dr@example.com │  │
                           │  │   Status: Signed Up     │  │
                           │  │   Code: SNAILMAIL-2WEEKS│  │
                           │  └─────────────────────────┘  │
                           └───────────────────────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────────┐
│                   FIRESTORE RULES                       │
│                                                          │
│  Client (Browser)                                       │
│       │                                                  │
│       ├─ READ  ────────────X DENIED                     │
│       │                                                  │
│       └─ WRITE ────────────X DENIED                     │
│                                                          │
│  Server (Admin SDK)                                     │
│       │                                                  │
│       ├─ READ  ────────────✓ ALLOWED (if admin)        │
│       │                                                  │
│       └─ WRITE ────────────✓ ALLOWED                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Campaign Lifecycle

```
┌─────────┐
│ CREATED │  ← Marketing team creates campaign
└────┬────┘
     │
     ▼
┌──────────┐
│ DEPLOYED │  ← QR codes printed on materials
└────┬─────┘
     │
     ├──→ VISIT 1: Visit tracked in Firestore
     │    (status: "visited")
     │
     ├──→ VISIT 2: Visit tracked
     │
     ├──→ VISIT 3: Converts to lead
     │    (status: "signed-up")
     │
     ├──→ VISIT 4: Visit tracked
     │
     └──→ VISIT 5: Converts to lead
          
          Statistics Updated in Dashboard:
          • Total Visits: 5
          • Sign-ups: 2
          • Conversion Rate: 40%
```

## API Request Flow

### Visit Tracking (GET)
```
User scans QR code
       │
       ▼
Landing page loads
       │
       ▼
useEffect hook fires
       │
       ▼
fetch('/api/outreach?campaign=snailmail-q1')
       │
       ▼
API extracts campaign parameter
       │
       ▼
Creates Firestore document:
{
  campaign: "snailmail-q1",
  status: "visited",
  timestamp: now,
  ipAddress: req.headers['x-forwarded-for'],
  userAgent: req.headers['user-agent']
}
       │
       ▼
Returns offer code:
{
  success: true,
  campaign: "snailmail-q1",
  offerCode: "SNAILMAIL-Q1-2WEEKS"
}
```

### Lead Capture (POST)
```
User fills form and clicks submit
       │
       ▼
Form validation passes
       │
       ▼
fetch('/api/outreach', {
  method: 'POST',
  body: JSON.stringify({
    campaign: "snailmail-q1",
    email: "dr@example.com",
    name: "Dr. Smith",
    phone: "(555) 123-4567"
  })
})
       │
       ▼
API validates email field
       │
       ▼
Creates Firestore document:
{
  campaign: "snailmail-q1",
  status: "signed-up",
  email: "dr@example.com",
  name: "Dr. Smith",
  phone: "(555) 123-4567",
  offerCode: "SNAILMAIL-Q1-2WEEKS",
  timestamp: now
}
       │
       ▼
Returns success:
{
  success: true,
  leadId: "abc123",
  offerCode: "SNAILMAIL-Q1-2WEEKS",
  message: "Thank you! Your free trial is ready."
}
       │
       ▼
Frontend shows success screen with offer code
```

## Technology Stack Layers

```
┌─────────────────────────────────────────────┐
│         PRESENTATION LAYER                  │
│  • React Components (Next.js)              │
│  • Tailwind CSS Styling                    │
│  • TypeScript Type Safety                  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         APPLICATION LAYER                   │
│  • Next.js API Routes                       │
│  • Form Validation Logic                   │
│  • Campaign Tracking Logic                 │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         DATA ACCESS LAYER                   │
│  • Firebase Admin SDK                       │
│  • Firestore Queries                        │
│  • Real-time Listeners                      │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         PERSISTENCE LAYER                   │
│  • Cloud Firestore Database                │
│  • Security Rules Engine                    │
│  • Automatic Backups                        │
└─────────────────────────────────────────────┘
```

## Deployment Pipeline

```
Developer Machine
       │
       ├── npm run build
       │   (Builds Next.js app)
       │
       ├── npm run lint
       │   (Checks code quality)
       │
       └── firebase deploy
           │
           ├──→ Uploads static assets
           │    (HTML, CSS, JS)
           │
           ├──→ Deploys API routes
           │    (Edge functions)
           │
           ├──→ Updates Firestore rules
           │    (Security configuration)
           │
           └──→ Updates hosting config
                (Rewrites, redirects)
                      │
                      ▼
              Production Server
              codecraftmd.com
```

## Monitoring & Analytics

```
┌─────────────────────────────────────────────────────┐
│                 MONITORING STACK                    │
│                                                      │
│  Firebase Console                                   │
│  ├── Firestore: View all leads                     │
│  ├── Hosting: Traffic metrics                      │
│  └── Functions: API performance                    │
│                                                      │
│  Admin Dashboard                                    │
│  ├── Campaign statistics                           │
│  ├── Lead list                                      │
│  └── Conversion rates                              │
│                                                      │
│  Browser DevTools                                   │
│  ├── Console logs                                   │
│  ├── Network requests                              │
│  └── Performance metrics                           │
└─────────────────────────────────────────────────────┘
```

---

**Note**: This architecture is designed to be scalable, secure, and easy to maintain. All components are production-ready and follow best practices for Next.js and Firebase applications.
