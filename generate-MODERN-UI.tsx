// app/dashboard/generate/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Sparkles, Loader2, CreditCard, Building2, Image as ImageIcon, Zap, Palette, Briefcase } from 'lucide-react';

const WEBSITE_TYPES = [
  { value: 'landing', label: 'Landing Page', icon: '🚀', description: 'Perfect for products and services' },
  { value: 'portfolio', label: 'Portfolio', icon: '💼', description: 'Showcase your work' },
  { value: 'business', label: 'Business', icon: '🏢', description: 'Professional company site' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️', description: 'Menu and reservations' },
  { value: 'blog', label: 'Blog', icon: '📝', description: 'Content and articles' },
  { value: 'ecommerce', label: 'E-commerce', icon: '🛒', description: 'Product showcase' },
];

const VISUAL_STYLES = [
  { value: 'bold-modern', label: 'Bold & Modern', icon: '⚡', description: 'Clean, tech-forward like Stripe' },
  { value: 'elegant-minimal', label: 'Elegant & Minimal', icon: '💎', description: 'Refined, luxurious like Apple' },
  { value: 'playful-fun', label: 'Playful & Fun', icon: '🎨', description: 'Energetic, friendly like Notion' },
  { value: 'professional-trust', label: 'Professional', icon: '🏛️', description: 'Corporate, trustworthy' },
  { value: 'creative-artistic', label: 'Creative & Artistic', icon: '🎭', description: 'Bold, unique like Awwwards' },
  { value: 'warm-friendly', label: 'Warm & Friendly', icon: '🌟', description: 'Cozy, welcoming' },
];

const INDUSTRIES = [
  { value: 'technology', label: 'Technology', icon: '💻' },
  { value: 'food', label: 'Food & Dining', icon: '🍕' },
  { value: 'fashion', label: 'Fashion & Style', icon: '👗' },
  { value: 'health', label: 'Health & Wellness', icon: '🏥' },
  { value: 'creative', label: 'Creative & Design', icon: '🎨' },
  { value: 'finance', label: 'Finance & Business', icon: '💼' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
];

const VIBES = [
  { value: 'professional', label: 'Professional', icon: '👔' },
  { value: 'fun', label: 'Fun & Playful', icon: '🎉' },
  { value: 'luxury', label: 'Luxury', icon: '✨' },
  { value: 'minimalist', label: 'Minimalist', icon: '⚪' },
  { value: 'bold', label: 'Bold & Vibrant', icon: '🔥' },
  { value: 'calm', label: 'Calm & Peaceful', icon: '🌊' },
];

const COLOR_SCHEMES = [
  { value: 'blue', label: 'Blue', colors: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
  { value: 'purple', label: 'Purple', colors: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { value: 'green', label: 'Green', colors: 'bg-gradient-to-r from-green-500 to-emerald-500' },
  { value: 'orange', label: 'Orange', colors: 'bg-gradient-to-r from-orange-500 to-red-500' },
  { value: 'mono', label: 'Monochrome', colors: 'bg-gradient-to-r from-gray-800 to-gray-600' },
  { value: 'custom', label: 'AI Choice', colors: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500' },
];

export default function GeneratePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [websiteType, setWebsiteType] = useState('landing');
  const [visualStyle, setVisualStyle] = useState('bold-modern');
  const [industry, setIndustry] = useState('technology');
  const [vibe, setVibe] = useState('professional');
  const [colorScheme, setColorScheme] = useState('blue');
  const [businessName, setBusinessName] = useState('');
  const [useAIName, setUseAIName] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .single();

    if (profile) {
      setCredits(profile.credits_remaining);
    }
  };

  const calculateTotalCredits = () => {
    const baseCredits = 1;
    const imageCredits = includeImages ? 4 : 0;
    return baseCredits + imageCredits;
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

    const totalCredits = calculateTotalCredits();

    if (credits !== null && credits < totalCredits) {
      setError(`Insufficient credits. Need ${totalCredits} credits.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const finalPrompt = useAIName 
        ? prompt 
        : `Business name: "${businessName}". ${prompt}`;

      const response = await fetch('/api/generate-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          websiteType,
          visualStyle,
          industry,
          vibe,
          colorScheme,
          includeImages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate website');
      }

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

  const totalCredits = calculateTotalCredits();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-lg mb-6">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">
              {credits !== null ? credits : '...'} Credits
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Generate Your Modern Website
          </h1>
          <p className="text-xl text-gray-700">
            AI-powered, 2024 design standards, animated and professional
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          
          {/* Business Name */}
          <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <label className="text-lg font-semibold text-gray-900">Business Name</label>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setUseAIName(true)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  useAIName ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                ✨ AI Creates Name
              </button>
              <button
                onClick={() => setUseAIName(false)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  !useAIName ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                ✏️ I Have a Name
              </button>
            </div>

            {!useAIName && (
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter business name"
                className="w-full px-4 py-3 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:outline-none text-gray-900 bg-white"
                style={{ color: '#111827' }}
                disabled={loading}
              />
            )}
          </div>

          {/* Description */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Describe Your Website
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: A modern platform for freelance designers to showcase portfolios and connect with clients. Focus on clean aesthetics and easy navigation."
              className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none resize-none text-gray-900 bg-white"
              style={{ color: '#111827' }}
              disabled={loading}
            />
          </div>

          {/* Website Type */}
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
                    websiteType === type.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
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

          {/* Industry Selector - NEW */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <label className="text-lg font-semibold text-gray-900">Industry</label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind.value}
                  onClick={() => setIndustry(ind.value)}
                  disabled={loading}
                  className={`p-3 rounded-lg border-2 transition ${
                    industry === ind.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-1">{ind.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{ind.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Vibe Selector - NEW */}
          <div className="mb-8 p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border-2 border-pink-100">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-pink-600" />
              <label className="text-lg font-semibold text-gray-900">Vibe</label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {VIBES.map((v) => (
                <button
                  key={v.value}
                  onClick={() => setVibe(v.value)}
                  disabled={loading}
                  className={`p-3 rounded-lg border-2 transition ${
                    vibe === v.value ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-xl mb-1">{v.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{v.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Visual Style */}
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-100">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-purple-600" />
              <label className="text-lg font-semibold text-gray-900">Visual Style</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {VISUAL_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setVisualStyle(style.value)}
                  disabled={loading}
                  className={`p-5 rounded-xl border-2 transition text-left ${
                    visualStyle === style.value ? 'border-purple-500 bg-purple-50 shadow-lg' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{style.icon}</span>
                    <div className="font-bold text-gray-900">{style.label}</div>
                  </div>
                  <div className="text-xs text-gray-600">{style.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Scheme */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Color Accent
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COLOR_SCHEMES.map((scheme) => (
                <button
                  key={scheme.value}
                  onClick={() => setColorScheme(scheme.value)}
                  disabled={loading}
                  className={`p-4 rounded-xl border-2 transition ${
                    colorScheme === scheme.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`h-8 ${scheme.colors} rounded-lg mb-2`}></div>
                  <div className="text-sm font-medium text-gray-900">{scheme.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Images Toggle */}
          <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-green-600" />
                <label className="text-lg font-semibold text-gray-900">
                  Professional Photos
                </label>
              </div>
              <button
                onClick={() => setIncludeImages(!includeImages)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                  includeImages ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                  includeImages ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
            {includeImages ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  ✨ <strong>2-3 strategic real photos</strong> from Unsplash
                </p>
                <p className="text-sm text-gray-600">
                  Modern sites use fewer, better images + icon-based cards
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Cost: +4 credits (curated professional photos)
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Clean design with icons and gradients (no photos)
              </p>
            )}
          </div>

          {/* Credit Display */}
          <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 text-lg">Total Cost</div>
                <div className="text-sm text-gray-600">
                  {includeImages ? '1 credit (website) + 4 credits (photos)' : '1 credit (website only)'}
                </div>
              </div>
              <div className="text-3xl font-bold text-indigo-600">
                {totalCredits} {totalCredits === 1 ? 'Credit' : 'Credits'}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || (credits !== null && credits < totalCredits)}
            className="w-full py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Creating Modern Website...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Generate Website ({totalCredits} {totalCredits === 1 ? 'Credit' : 'Credits'})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
