# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

CodeCraftMD is an AI-powered medical billing automation web application built as a Firebase-hosted static site with authentication and future Data Connect integration. The application extracts ICD-10 codes from clinical notes and generates billing summaries.

## Development Commands

### Local Development
```bash
# Install dependencies for Firebase Functions
cd functions && npm install && cd ..

# Start all Firebase services locally (recommended for development)
firebase emulators:start

# Start specific services only
firebase emulators:start --only hosting,functions,firestore,auth

# Serve hosting only (static files)
firebase serve --only hosting
```

### Deployment
```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# Deploy with environment config
firebase functions:config:set openai.key="your-openai-api-key"
firebase deploy --only functions
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Set Firebase Functions config (for production)
firebase functions:config:set openai.key="your-actual-openai-key"

# View current config
firebase functions:config:get
```

## Architecture Overview

### Frontend Structure
- **Root Landing Page**: `index.html` - Main marketing page with embedded Firebase auth
- **Public Pages**: `public/` directory contains the actual served pages:
  - `public/index.html` - Login page (served as root)
  - `public/login.html` - Dedicated login form
  - `public/signup.html` - User registration form
- **Dashboard**: `dashboard.html` - Protected dashboard with ICD-10 extraction and PDF generation (served via Firebase rewrite at `/dashboard`)

### Firebase Integration
- **Authentication**: Uses Firebase Auth with email/password and Google OAuth
- **Hosting**: Static site deployment with URL rewrites
- **Data Connect**: PostgreSQL backend configured (currently with example schema)
  - Database: `codecrft` on Cloud SQL instance `codecraftmd-landing-fdc`
  - Location: `northamerica-northeast1`

### Key Technologies
- **Frontend**: Vanilla HTML/CSS/JavaScript with Tailwind CSS via CDN
- **File Processing**: Mammoth.js (DOCX), PDF.js (PDF), native FileReader (TXT)
- **AI Processing**: OpenAI GPT-4 via secure Firebase Functions
- **PDF Generation**: PDFMake library for CMS-1500 style billing summaries
- **Backend**: Firebase Cloud Functions (Node.js 18)
- **Database**: Firebase Firestore with HIPAA-conscious security rules
- **Authentication**: Firebase Auth (email/password + Google OAuth)
- **Data Connect**: PostgreSQL backend configured (for future expansion)

### Authentication Flow
1. Users land on marketing page (`index.html`) or login page (`public/index.html`)
2. Authentication handled via Firebase Auth SDK
3. Successful login redirects to `/dashboard` (served as `dashboard.html`)
4. Dashboard is protected and checks auth state on load

### Data Architecture (Prepared)
- Data Connect schema and connectors are configured but currently use example/template code
- GraphQL queries and mutations ready for implementation
- PostgreSQL database configured for production data storage

## Firebase Configuration
- Project ID: `codecraftmd-e48b0`
- Firebase config is embedded directly in HTML files (consistent across all pages)
- Hosting configured to serve `public/` directory as web root
- URL rewrite: `/dashboard` → `/dashboard.html` with no-cache headers

## Important File Locations
- **Main landing page**: `index.html` (marketing site)
- **Application entry**: `public/index.html` (login page)
- **Dashboard**: `dashboard.html` (main application)
- **Firebase config**: `firebase.json`
- **Data Connect config**: `dataconnect/dataconnect.yaml`
- **Database schema**: `dataconnect/schema/schema.gql`

## Development Notes
- **Security**: Medical data never stored in client-side code; processed server-side via Functions
- **AI Integration**: OpenAI GPT-4 processing happens securely in Firebase Functions
- **HIPAA Considerations**: Firestore rules restrict data access to authenticated users only
- **Fallback Strategy**: If AI extraction fails, regex-based extraction provides backup
- **File Support**: Supports .txt, .docx, and .pdf files up to 10MB
- **Data Persistence**: Consultation history stored per user with audit logging
- **Error Handling**: Comprehensive error handling with user-friendly notifications
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

## Required Environment Variables
- `OPENAI_API_KEY`: Required for AI-powered ICD-10 extraction
- Firebase Functions config: Set via `firebase functions:config:set openai.key="your-key"`

## Testing
```bash
# Test with Firebase emulators
firebase emulators:start

# Functions logs during development
firebase functions:log

# Test specific function
firebase functions:shell
```
