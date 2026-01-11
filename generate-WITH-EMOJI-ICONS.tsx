// app/dashboard/generate/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Sparkles, Loader2, CreditCard, Building2 } from 'lucide-react';

const WEBSITE_TYPES = [
  { value: 'landing', label: 'Landing Page', icon: '🚀', description: 'Perfect for products, services, or campaigns' },
  { value: 'portfolio', label: 'Portfolio', icon: '💼', description: 'Showcase your work and skills' },
  { value: 'business', label: 'Business', icon: '🏢', description: 'Professional company website' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️', description: 'Menu, location, and reservations' },
  { value: 'blog', label: 'Blog', icon: '📝', description: 'Content and articles' },
  { value: 'ecommerce', label: 'E-commerce', icon: '🛒', description: 'Product showcase and sales' },
];

const COLOR_SCHEMES = [
  { value: 'blue-modern', label: 'Blue Modern', colors: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
  { value: 'purple-elegant', label: 'Purple Elegant', colors: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { value: 'green-fresh', label: 'Green Fresh', colors: 'bg-gradient-to-r from-green-500 to-emerald-500' },
  { value: 'orange-warm', label: 'Orange Warm', colors: 'bg-gradient-to-r from-orange-500 to-red-500' },
  { value: 'dark-professional', label: 'Dark Professional', colors: 'bg-gradient-to-r from-gray-800 to-gray-900' },
  { value: 'minimal-light', label: 'Minimal Light', colors: 'bg-gradient-to-r from-gray-100 to-gray-200' },
];

export default function GeneratePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [websiteType, setWebsiteType] = useState('landing');
  const [colorScheme, setColorScheme] = useState('blue-modern');
  const [businessName, setBusinessName] = useState('');
  const [useAIName, setUseAIName] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    setUser(user);

    // Get credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .single();

    if (profile) {
      setCredits(profile.credits_remaining);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe your website');
      return;
    }

    if (!useAIName && !businessName.trim()) {
      setError('Please enter a business name or let AI create one');
      return;
    }

    if (credits !== null && credits < 1) {
      setError('Insufficient credits. Please purchase more credits.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Add business name to prompt if provided
      const finalPrompt = useAIName 
        ? prompt 
        : `Business name: "${businessName}". ${prompt}`;

      const response = await fetch('/api/generate-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          websiteType,
          colorScheme,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate website');
      }

      // Success! Redirect to preview
      router.push(`/dashboard/preview/${data.previewId}`);
      
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate website');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-lg mb-6">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">
              {credits !== null ? credits : '...'} Credits Remaining
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Generate Your Website with AI
          </h1>
          <p className="text-xl text-gray-700">
            Describe your vision, and we'll create a professional website in seconds
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          
          {/* Business Name Section */}
          <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <label className="text-lg font-semibold text-gray-900">
                Business Name
              </label>
            </div>
            
            {/* Toggle */}
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setUseAIName(true)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  useAIName
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                ✨ Let AI Create a Name
              </button>
              <button
                onClick={() => setUseAIName(false)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  !useAIName
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                ✏️ I Have a Name
              </button>
            </div>

            {/* Name Input (if user wants to provide) */}
            {!useAIName && (
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter your business name (e.g., 'FitTrack Pro')"
                className="w-full px-4 py-3 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:outline-none text-gray-900"
                disabled={loading}
              />
            )}

            {useAIName && (
              <p className="text-sm text-gray-600">
                🎨 AI will create a creative, memorable name based on your description
              </p>
            )}
          </div>

          {/* Prompt Input */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Describe Your Website
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: A modern landing page for a fitness app with workout tracking, meal planning, and progress photos. Focus on health and motivation with an energetic vibe."
              className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none resize-none text-gray-900"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-2">
              💡 Be specific about content, sections, and style you want
            </p>
          </div>

          {/* Website Type WITH EMOJI ICONS */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Website Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {WEBSITE_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setWebsiteType(type.value)}
                  disabled={loading}
                  className={`p-4 rounded-xl border-2 transition text-left ${
                    websiteType === type.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{type.icon}</span>
                    <div className="font-semibold text-gray-900">{type.label}</div>
                  </div>
                  <div className="text-xs text-gray-600">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Scheme */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Color Scheme Inspiration
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COLOR_SCHEMES.map((scheme) => (
                <button
                  key={scheme.value}
                  onClick={() => setColorScheme(scheme.value)}
                  disabled={loading}
                  className={`p-4 rounded-xl border-2 transition ${
                    colorScheme === scheme.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`h-8 ${scheme.colors} rounded-lg mb-2`}></div>
                  <div className="text-sm font-medium text-gray-900">{scheme.label}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              🎨 AI will create vibrant multi-color gradients based on this theme
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || (credits !== null && credits < 1)}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Creating Your Stunning Website...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Generate Website (1 Credit)
              </>
            )}
          </button>
        </div>

        {/* Examples */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">💡 Example Prompts:</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="p-3 bg-gray-50 rounded-lg">
              <strong>🚀 Fitness App:</strong> "A landing page for a fitness tracking app with workout plans, meal planning, and progress photos. Energetic and motivating vibe with bold colors."
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <strong>🍽️ Restaurant:</strong> "An Italian restaurant website with menu, location, hours, and reservation system. Warm, inviting atmosphere showcasing pasta and pizza."
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <strong>💼 Portfolio:</strong> "A portfolio for a graphic designer with 6 creative projects, about section, skills, and contact form. Modern with smooth animations."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
