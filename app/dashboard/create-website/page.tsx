'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, Loader2, Check, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Initialize Supabase client
const supabase = createClient();

export default function CreateWebsitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    sections: [] as string[],
    style: '',
    primaryColor: '#6366f1', // Indigo
    secondaryColor: '#ec4899', // Pink
    description: '',
  });

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      alert('Please log in to continue');
      router.push('/login');
      return;
    }
    
    setIsAuthenticated(true);
    console.log('[Auth] User authenticated:', session.user.id);
  };

  const industries = [
    { value: 'restaurant', label: 'Restaurant / Cafe', icon: '🍕' },
    { value: 'gym', label: 'Gym / Fitness', icon: '💪' },
    { value: 'salon', label: 'Salon / Spa', icon: '💇' },
    { value: 'portfolio', label: 'Portfolio / Personal', icon: '🎨' },
    { value: 'consulting', label: 'Consulting / Services', icon: '💼' },
    { value: 'retail', label: 'Retail / Shop', icon: '🛍️' },
    { value: 'health', label: 'Healthcare / Medical', icon: '🏥' },
    { value: 'education', label: 'Education / Training', icon: '📚' },
    { value: 'other', label: 'Other', icon: '✨' },
  ];

  const availableSections = [
    { value: 'about', label: 'About Us' },
    { value: 'services', label: 'Services / Products' },
    { value: 'pricing', label: 'Pricing / Menu' },
    { value: 'gallery', label: 'Gallery / Portfolio' },
    { value: 'testimonials', label: 'Testimonials' },
    { value: 'team', label: 'Team / Staff' },
    { value: 'contact', label: 'Contact Form' },
    { value: 'location', label: 'Location / Map' },
    { value: 'faq', label: 'FAQ' },
  ];

  const styles = [
    { value: 'modern', label: 'Modern', description: 'Clean, minimalist, contemporary' },
    { value: 'bold', label: 'Bold', description: 'Eye-catching, vibrant, energetic' },
    { value: 'elegant', label: 'Elegant', description: 'Sophisticated, refined, premium' },
    { value: 'playful', label: 'Playful', description: 'Fun, colorful, friendly' },
    { value: 'professional', label: 'Professional', description: 'Corporate, trustworthy, serious' },
  ];

  const toggleSection = (section: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section]
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        alert('Session expired. Please log in again.');
        router.push('/login');
        return;
      }

      console.log('[Generate] Sending request with auth token');

      const response = await fetch('/api/generate-website', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      console.log('[Generate] Response:', data);

      if (data.success) {
        // Redirect to preview or dashboard
        router.push(`/dashboard/preview/${data.websiteId}`);
      } else {
        alert('Failed to generate website: ' + data.error);
      }
    } catch (error) {
      console.error('Error generating website:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = formData.businessName && formData.industry;
  const canProceedStep2 = formData.sections.length > 0;
  const canGenerate = canProceedStep1 && canProceedStep2 && formData.style;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-700 to-pink-700 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                WeVibeCode
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                {step > 1 ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <span className="font-semibold hidden sm:inline">Business Info</span>
            </div>
            <div className={`h-1 w-16 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                {step > 2 ? <Check className="w-5 h-5" /> : '2'}
              </div>
              <span className="font-semibold hidden sm:inline">Content</span>
            </div>
            <div className={`h-1 w-16 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="font-semibold hidden sm:inline">Style</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <div>
              <div className="mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                  <Store className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Tell us about your business</h2>
                <p className="text-gray-600">We'll use this to create your perfect website</p>
              </div>

              <div className="space-y-6">
                {/* Business Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g., Bella's Bistro, FitZone Gym, Serenity Spa"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                  />
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Industry *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {industries.map((industry) => (
                      <button
                        key={industry.value}
                        onClick={() => setFormData({ ...formData, industry: industry.value })}
                        className={`p-4 rounded-xl border-2 transition text-left ${
                          formData.industry === industry.value
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{industry.icon}</div>
                        <div className="text-sm font-semibold text-gray-900">{industry.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Brief Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell us a bit more about your business, target audience, or special features..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition resize-none"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className={`px-8 py-3 rounded-xl font-semibold transition ${
                    canProceedStep1
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Content Sections */}
          {step === 2 && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">What sections do you need?</h2>
                <p className="text-gray-600">Select all that apply (you can always edit later)</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {availableSections.map((section) => (
                  <button
                    key={section.value}
                    onClick={() => toggleSection(section.value)}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      formData.sections.includes(section.value)
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{section.label}</span>
                      {formData.sections.includes(section.value) && (
                        <Check className="w-5 h-5 text-indigo-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className={`px-8 py-3 rounded-xl font-semibold transition ${
                    canProceedStep2
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Style */}
          {step === 3 && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose your style</h2>
                <p className="text-gray-600">Pick a design that matches your brand</p>
              </div>

              <div className="space-y-6">
                {/* Style Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Design Style *
                  </label>
                  <div className="grid gap-3">
                    {styles.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setFormData({ ...formData, style: style.value })}
                        className={`p-4 rounded-xl border-2 transition text-left ${
                          formData.style === style.value
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-bold text-gray-900">{style.label}</div>
                        <div className="text-sm text-gray-600">{style.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Pickers */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="w-16 h-16 rounded-xl border-2 border-gray-300 cursor-pointer"
                      />
                      <div>
                        <div className="text-sm font-mono text-gray-600">{formData.primaryColor}</div>
                        <div className="text-xs text-gray-500">Main brand color</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        className="w-16 h-16 rounded-xl border-2 border-gray-300 cursor-pointer"
                      />
                      <div>
                        <div className="text-sm font-mono text-gray-600">{formData.secondaryColor}</div>
                        <div className="text-xs text-gray-500">Accent color</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate || loading}
                  className={`px-8 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${
                    canGenerate && !loading
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Website (1 Credit)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
          <p className="text-sm text-indigo-900">
            <strong>💡 Pro Tip:</strong> The AI will create a complete, professional website based on your choices. 
            You can always edit the content, colors, and layout after generation!
          </p>
        </div>
      </main>
    </div>
  );
}