// app/dashboard/generate/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Sparkles, Loader2, CreditCard, Check } from 'lucide-react';

const WEBSITE_TYPES = [
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'landing', label: 'Landing Page', icon: '🚀' },
  { value: 'portfolio', label: 'Portfolio', icon: '💼' },
  { value: 'business', label: 'Business', icon: '🏢' },
  { value: 'blog', label: 'Blog', icon: '📝' },
  { value: 'ecommerce', label: 'E-commerce', icon: '🛒' },
];

const VIBES = [
  { value: 'professional', label: 'Professional', icon: '👔' },
  { value: 'fun', label: 'Fun & Playful', icon: '🎉' },
  { value: 'luxury', label: 'Luxury', icon: '✨' },
  { value: 'minimal', label: 'Minimalist', icon: '⚪' },
  { value: 'bold', label: 'Bold & Vibrant', icon: '🔥' },
  { value: 'calm', label: 'Calm & Peaceful', icon: '🌊' },
];

const AVAILABLE_SECTIONS = {
  restaurant: [
    { id: 'hero', label: 'Hero Section', required: true },
    { id: 'about', label: 'About/Story' },
    { id: 'gallery', label: 'Photo Gallery' },
    { id: 'menu', label: 'Menu (PDF link)' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'location', label: 'Location & Hours' },
    { id: 'contact', label: 'Contact Form' },
  ],
  landing: [
    { id: 'hero', label: 'Hero Section', required: true },
    { id: 'features', label: 'Features (3-4 cards)' },
    { id: 'social-proof', label: 'Social Proof (logos)' },
    { id: 'how-it-works', label: 'How It Works (steps)' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: 'Contact Form' },
  ],
  portfolio: [
    { id: 'hero', label: 'Hero/Intro', required: true },
    { id: 'projects', label: 'Projects Grid' },
    { id: 'skills', label: 'Skills' },
    { id: 'about', label: 'About' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'contact', label: 'Contact' },
  ],
  business: [
    { id: 'hero', label: 'Hero Section', required: true },
    { id: 'services', label: 'Services (3-4 cards)' },
    { id: 'about', label: 'About' },
    { id: 'team', label: 'Team' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'stats', label: 'Stats/Numbers' },
    { id: 'contact', label: 'Contact Form' },
  ],
  blog: [
    { id: 'hero', label: 'Hero Section', required: true },
    { id: 'featured', label: 'Featured Posts' },
    { id: 'about', label: 'About Author' },
    { id: 'categories', label: 'Categories' },
    { id: 'newsletter', label: 'Newsletter Signup' },
    { id: 'contact', label: 'Contact' },
  ],
  ecommerce: [
    { id: 'hero', label: 'Hero Section', required: true },
    { id: 'products', label: 'Featured Products' },
    { id: 'about', label: 'About Brand' },
    { id: 'testimonials', label: 'Reviews' },
    { id: 'shipping', label: 'Shipping Info' },
    { id: 'contact', label: 'Contact' },
  ],
};

const COLOR_PALETTES = [
  { 
    id: 'ocean',
    label: 'Ocean',
    primary: '#3B82F6',
    secondary: '#06B6D4',
    gradient: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 'sunset',
    label: 'Sunset',
    primary: '#F59E0B',
    secondary: '#EF4444',
    gradient: 'from-orange-500 to-red-500'
  },
  { 
    id: 'forest',
    label: 'Forest',
    primary: '#10B981',
    secondary: '#059669',
    gradient: 'from-green-500 to-emerald-600'
  },
  { 
    id: 'royal',
    label: 'Royal',
    primary: '#8B5CF6',
    secondary: '#EC4899',
    gradient: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'professional',
    label: 'Professional',
    primary: '#1E40AF',
    secondary: '#3B82F6',
    gradient: 'from-blue-800 to-blue-500'
  },
  { 
    id: 'minimal',
    label: 'Minimal',
    primary: '#0F172A',
    secondary: '#64748B',
    gradient: 'from-slate-900 to-slate-600'
  },
];

export default function GeneratePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [websiteType, setWebsiteType] = useState('restaurant');
  const [selectedSections, setSelectedSections] = useState<string[]>(['hero']);
  const [vibe, setVibe] = useState('professional');
  const [colorMode, setColorMode] = useState<'palette' | 'ai'>('palette');
  const [selectedPalette, setSelectedPalette] = useState('ocean');
  const [businessName, setBusinessName] = useState('');
  const [useAIName, setUseAIName] = useState(true);
  const [customLogo, setCustomLogo] = useState(false);
  const [logoColorMode, setLogoColorMode] = useState<'palette' | 'ai'>('ai');
  const [logoColorPalette, setLogoColorPalette] = useState('royal');
  const [includeImages, setIncludeImages] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Reset sections when type changes
    const required = AVAILABLE_SECTIONS[websiteType as keyof typeof AVAILABLE_SECTIONS]
      .filter(s => s.required)
      .map(s => s.id);
    setSelectedSections(required);
  }, [websiteType]);

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

  const toggleSection = (sectionId: string) => {
    if (selectedSections.includes(sectionId)) {
      // Don't allow removing required sections
      const section = AVAILABLE_SECTIONS[websiteType as keyof typeof AVAILABLE_SECTIONS]
        .find(s => s.id === sectionId);
      if (section?.required) return;
      
      setSelectedSections(selectedSections.filter(id => id !== sectionId));
    } else {
      setSelectedSections([...selectedSections, sectionId]);
    }
  };

  const calculateTotalCredits = () => {
    const baseCredits = 1;
    const imageCredits = includeImages ? 3 : 0; // 3 images now
    const logoCredits = customLogo ? 3 : 0;
    return baseCredits + imageCredits + logoCredits;
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

      const palette = COLOR_PALETTES.find(p => p.id === selectedPalette);
      const logoPalette = COLOR_PALETTES.find(p => p.id === logoColorPalette);

      const response = await fetch('/api/generate-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          websiteType,
          sections: selectedSections,
          vibe,
          colorMode,
          colorPalette: colorMode === 'palette' ? {
            primary: palette?.primary,
            secondary: palette?.secondary
          } : null,
          customLogo,
          logoColorMode,
          logoColorPalette: logoColorMode === 'palette' ? {
            primary: logoPalette?.primary,
            secondary: logoPalette?.secondary
          } : null,
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
  const availableSections = AVAILABLE_SECTIONS[websiteType as keyof typeof AVAILABLE_SECTIONS];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-lg mb-6">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">
              {credits !== null ? credits : '...'} Credits
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Build Your Professional Website
          </h1>
          <p className="text-xl text-gray-700">
            Pick sections, choose colors, describe your business
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          
          {/* Business Name */}
          <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
            <label className="text-lg font-semibold text-gray-900 mb-4 block">Business Name</label>
            
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
              placeholder="Example: A modern Italian restaurant specializing in handmade pasta and wood-fired pizza. Warm, family-friendly atmosphere."
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
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="font-semibold text-gray-900">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Vibe Selector */}
          <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-100">
            <label className="text-lg font-semibold text-gray-900 mb-4 block">
              Vibe & Personality
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {VIBES.map((v) => (
                <button
                  key={v.value}
                  onClick={() => setVibe(v.value)}
                  disabled={loading}
                  className={`p-4 rounded-lg border-2 transition ${
                    vibe === v.value ? 'border-yellow-500 bg-yellow-50 shadow-lg' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-1">{v.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{v.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Logo Option */}
          <div className="mb-8 p-6 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border-2 border-violet-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-lg font-semibold text-gray-900 block mb-1">
                  AI-Generated Custom Logo
                </label>
                <p className="text-sm text-gray-600">
                  {customLogo 
                    ? '✨ AI will create a unique logo image for your brand'
                    : '📝 Simple icon will be used before business name'}
                </p>
              </div>
              <button
                onClick={() => setCustomLogo(!customLogo)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                  customLogo ? 'bg-violet-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                  customLogo ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {customLogo && (
              <div className="mt-4 space-y-4">
                <div className="p-3 bg-white rounded-lg border border-violet-200">
                  <p className="text-sm text-violet-700 font-medium mb-3">
                    +3 credits - Professional AI-generated logo
                  </p>
                  
                  <label className="text-sm font-semibold text-gray-900 block mb-2">Logo Colors</label>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      onClick={() => setLogoColorMode('palette')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                        logoColorMode === 'palette' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Pick Colors
                    </button>
                    <button
                      onClick={() => setLogoColorMode('ai')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                        logoColorMode === 'ai' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      AI Choose
                    </button>
                  </div>

                  {logoColorMode === 'palette' && (
                    <div className="grid grid-cols-3 gap-2">
                      {COLOR_PALETTES.map((palette) => (
                        <button
                          key={palette.id}
                          onClick={() => setLogoColorPalette(palette.id)}
                          disabled={loading}
                          className={`p-2 rounded-lg border-2 transition ${
                            logoColorPalette === palette.id
                              ? 'border-violet-500 shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`h-8 bg-gradient-to-r ${palette.gradient} rounded mb-1`}></div>
                          <div className="text-xs font-medium text-gray-700">{palette.label}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {logoColorMode === 'ai' && (
                    <div className="text-center py-3 text-sm text-gray-600">
                      AI will choose perfect colors for your logo
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section Picker */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-100">
            <label className="text-lg font-semibold text-gray-900 mb-4 block">
              Choose Sections
            </label>
            <p className="text-sm text-gray-600 mb-4">Select which sections to include in your website</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => toggleSection(section.id)}
                  disabled={loading || section.required}
                  className={`p-4 rounded-lg border-2 transition text-left flex items-center gap-3 ${
                    selectedSections.includes(section.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  } ${section.required ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                    selectedSections.includes(section.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedSections.includes(section.id) && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{section.label}</div>
                    {section.required && (
                      <div className="text-xs text-gray-500">Required</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Color System */}
          <div className="mb-8 p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border-2 border-pink-100">
            <label className="text-lg font-semibold text-gray-900 mb-4 block">
              Color Scheme
            </label>
            
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setColorMode('palette')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  colorMode === 'palette' ? 'bg-pink-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                🎨 Pick Colors
              </button>
              <button
                onClick={() => setColorMode('ai')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  colorMode === 'ai' ? 'bg-pink-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                ✨ AI Choose
              </button>
            </div>

            {colorMode === 'palette' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.id}
                    onClick={() => setSelectedPalette(palette.id)}
                    disabled={loading}
                    className={`p-4 rounded-lg border-2 transition ${
                      selectedPalette === palette.id
                        ? 'border-pink-500 bg-white shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`h-12 bg-gradient-to-r ${palette.gradient} rounded-lg mb-2`}></div>
                    <div className="font-medium text-gray-900 text-sm">{palette.label}</div>
                  </button>
                ))}
              </div>
            )}

            {colorMode === 'ai' && (
              <div className="text-center py-6 text-gray-600">
                AI will choose the perfect colors based on your business
              </div>
            )}
          </div>

          {/* Images Toggle */}
          <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-lg font-semibold text-gray-900">
                Professional Photos
              </label>
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
            <p className="text-sm text-gray-600">
              {includeImages 
                ? '✨ Include 2-3 strategic professional photos from Unsplash'
                : 'Use colors and gradients only (no photos)'}
            </p>
          </div>

          {/* Credit Display */}
          <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 text-lg">Total Cost</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• 1 credit (website)</div>
                  {includeImages && <div>• 3 credits (2-3 professional photos)</div>}
                  {customLogo && <div>• 3 credits (AI custom logo)</div>}
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
                Creating Your Website...
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
