import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const campaign = searchParams.get('campaign') || 'unknown';
    const source = searchParams.get('source') || 'qr-code';
    
    // Log the campaign visit to Firestore
    const db = admin.firestore();
    const outreachRef = db.collection('outreach_leads');
    
    const leadData = {
      campaign,
      source,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      status: 'visited',
    };
    
    await outreachRef.add(leadData);
    
    console.log('Campaign visit tracked:', { campaign, source });
    
    // Return campaign information for the frontend
    return NextResponse.json({
      success: true,
      campaign,
      source,
      offerCode: `${campaign.toUpperCase()}-2WEEKS`,
      message: 'Campaign tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking campaign:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to track campaign',
        campaign: 'unknown',
        offerCode: 'WELCOME-2WEEKS', // fallback offer
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaign, email, name, phone } = body;
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Store lead with contact information
    const db = admin.firestore();
    const outreachRef = db.collection('outreach_leads');
    
    const leadData = {
      campaign: campaign || 'unknown',
      email,
      name: name || null,
      phone: phone || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'signed-up',
      offerCode: `${(campaign || 'WELCOME').toUpperCase()}-2WEEKS`,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    };
    
    const docRef = await outreachRef.add(leadData);
    
    console.log('Lead captured:', { id: docRef.id, email, campaign });
    
    return NextResponse.json({
      success: true,
      leadId: docRef.id,
      offerCode: leadData.offerCode,
      message: 'Thank you! Your free trial is ready.',
    });
  } catch (error) {
    console.error('Error capturing lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to capture lead' },
      { status: 500 }
    );
  }
}
