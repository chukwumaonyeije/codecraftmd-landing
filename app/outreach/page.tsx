'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OutreachContent() {
  const searchParams = useSearchParams();
  const [campaign, setCampaign] = useState<string>('');
  const [offerCode, setOfferCode] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const campaignParam = searchParams.get('campaign') || 'general';
    setCampaign(campaignParam);

    // Track the visit
    fetch(`/api/outreach?campaign=${campaignParam}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOfferCode(data.offerCode);
        }
      })
      .catch(err => console.error('Error tracking visit:', err));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          campaign,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        setSubmitMessage(data.message);
        setOfferCode(data.offerCode);
      } else {
        setSubmitMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setSubmitMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Welcome to CodeCraftMD</h1>
          <p className="text-xl opacity-90">AI-Powered Medical Billing Made Simple</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {!isSuccess ? (
            <>
              {/* Offer Section */}
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-8 text-center">
                <div className="text-yellow-800 text-sm font-semibold uppercase tracking-wide mb-2">
                  Exclusive Offer
                </div>
                <div className="text-4xl font-bold text-yellow-900 mb-2">
                  2 Weeks FREE
                </div>
                <p className="text-gray-700 text-lg">
                  No credit card required • Cancel anytime
                </p>
                {campaign && campaign !== 'general' && (
                  <div className="mt-4 text-sm text-gray-600">
                    Campaign: <span className="font-mono font-semibold">{campaign}</span>
                  </div>
                )}
              </div>

              {/* Benefits */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Why CodeCraftMD?</h2>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">AI-powered ICD-10 and CPT code extraction from consultation notes</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">HIPAA-compliant and secure cloud storage</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Save hours on billing and reduce coding errors</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Automated medical necessity narratives</span>
                  </li>
                </ul>
              </div>

              {/* Signup Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Dr. Jane Smith"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="doctor@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold py-4 rounded-lg hover:from-blue-700 hover:to-indigo-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {isSubmitting ? 'Processing...' : 'Start My Free Trial'}
                </button>
              </form>

              {submitMessage && !isSuccess && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
                  {submitMessage}
                </div>
              )}
            </>
          ) : (
            // Success State
            <div className="text-center py-8">
              <div className="mb-6">
                <svg className="w-20 h-20 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to CodeCraftMD!</h2>
              <p className="text-lg text-gray-600 mb-6">{submitMessage}</p>
              
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                <div className="text-sm font-semibold text-blue-800 uppercase mb-2">Your Offer Code</div>
                <div className="text-3xl font-mono font-bold text-blue-900">{offerCode}</div>
                <p className="text-sm text-gray-600 mt-2">Save this code for your records</p>
              </div>

              <div className="space-y-4">
                <p className="text-gray-700">
                  Check your email for login instructions and next steps.
                </p>
                <a
                  href="https://codecraftmd.com"
                  className="inline-block bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-800 transition duration-200"
                >
                  Go to Dashboard
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 text-center text-sm text-gray-600">
          <p>Questions? Contact us at <a href="mailto:support@codecraftmd.com" className="text-blue-600 hover:underline">support@codecraftmd.com</a></p>
        </div>
      </div>
    </div>
  );
}

export default function OutreachPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <OutreachContent />
    </Suspense>
  );
}
