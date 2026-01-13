// app/dashboard/generate/page.tsx
// IMPROVED v2.0 - Better business types, smart sections, custom color picker, example prompts
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Sparkles, Loader2, CreditCard, Check, Layout } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { trackGeneration, trackPageView, logError } from '@/lib/analytics';
import TemplateGallery from '@/components/TemplateGallery';

// IMPROVED: Professional business categories based on market research
const WEBSITE_TYPES = [
  { value: 'restaurant', label: 'Restaurant & Bar', icon: '🍽️', emoji: '🍕' },
  { value: 'landing', label: 'Landing Page', icon: '🚀', emoji: '🎯' },
  { value: 'real_estate', label: 'Real Estate', icon: '🏠', emoji: '🏡' },
  { value: 'professional', label: 'Professional Services', icon: '💼', emoji: '⚖️' },
  { value: 'healthcare', label: 'Healthcare & Medical', icon: '🏥', emoji: '⚕️' },
  { value: 'salon', label: 'Salon & Spa', icon: '💇', emoji: '✨' },
  { value: 'business', label: 'Business & Corporate', icon: '🏢', emoji: '💼' },
  { value: 'ecommerce', label: 'E-commerce Store', icon: '🛒', emoji: '🛍️' },
];

const VIBES = [
  { value: 'professional', label: 'Professional', icon: '👔' },
  { value: 'fun', label: 'Fun & Playful', icon: '🎉' },
  { value: 'luxury', label: 'Luxury', icon: '✨' },
  { value: 'minimal', label: 'Minimalist', icon: '⚪' },
  { value: 'bold', label: 'Bold & Vibrant', icon: '🔥' },
  { value: 'calm', label: 'Calm & Peaceful', icon: '🌊' },
];

// IMPROVED: Industry-specific sections based on research
const AVAILABLE_SECTIONS = {
  restaurant: [
    { id: 'hero', label: 'Hero Section', required: true },
    { id: 'menu', label: 'Menu' },
    { id: 'gallery', label: 'Photo Gallery' },
    { id: 'about', label: 'Our Story' },
    { id: 'location', label: 'Location & Hours' },
    { id: 'reservations', label: 'Reservations/Booking' },
    { id: 'testimonials', label: 'Reviews' },
    { id: 'contact', label: 'Contact' },
  ],
  landing: [
    { id: 'hero', label: 'Hero Section', required: true },
    { id: 'features', label: 'Key Features' },
    { id: 'social_proof', label: 'Social Proof/Logos' },
    { id: 'how_it_works', label: 'How It Works' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'faq', label: 'FAQ' },
    { id: 'cta', label: 'Call to Action' },
  ],
  real_estate: [
    { id: 'hero', label: 'Hero Section', required: true },
    { id: 'featured_listings', label: 'Featured Listings' },
    { id: 'about', label: 'About Agent/Firm' },
    { id: 'services', label: 'Services' },
    { id: 'testimonials', label: 'Client Reviews' },
    { id: 'neighborhoods', label: 'Neighborhoods' },
    { id: 'stats', label: 'Sales Stats' },
    { id: 'contact', label: 'Contact' },
  ],
  professional: [
    { id: 'hero', label: 'Hero Section', required: true },
    { id: 'services', label: 'Services' },
    { id: 'about', label: 'About' },
    { id: 'team', label: 'Team' },
    { id: 'case_studies', label: 'Case Studies/Work' },
    { id: 'testimonials', label: 'Client Testimonials' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: 'Contact' },
  ],
  healthcare: [
    { id: 'hero', label: 'Hero Section', required: true },
    { id: 'services', label: 'Services/Specialties' },
    { id: 'about', label: 'About Practice' },
    { id: 'team', label: 'Our Doctors/Staff' },
    { id: 'insurance', label: 'Insurance & Billing' },
    { id: 'patient_portal', label: 'Patient Portal Link' },
    { id: 'testimonials', label: 'Patient Reviews' },
    { id: 'contact', label: 'Contact & Directions' },
  ],
  salon: [
    { id: 'hero', label: 'Hero Section', required: true },
    { id: 'services', label: 'Services & Pricing' },
    { id: 'gallery', label: 'Before/After Gallery' },
    { id: 'about', label: 'About Us' },
    { id: 'team', label: 'Our Stylists/Team' },
    { id: 'booking', label: 'Book Appointment' },
    { id: 'testimonials', label: 'Reviews' },
    { id: 'contact', label: 'Contact & Hours' },
  ],
  business: [
    { id: 'hero', label: 'Hero Section', required: true },
    { id: 'services', label: 'Services/Solutions' },
    { id: 'about', label: 'About Company' },
    { id: 'team', label: 'Leadership Team' },
    { id: 'stats', label: 'Key Metrics' },
    { id: 'case_studies', label: 'Case Studies' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'contact', label: 'Contact' },
  ],
  ecommerce: [
    { id: 'hero', label: 'Hero Section', required: true },
    { id: 'featured', label: 'Featured Products' },
    { id: 'categories', label: 'Product Categories' },
    { id: 'about', label: 'About Brand' },
    { id: 'testimonials', label: 'Customer Reviews' },
    { id: 'shipping', label: 'Shipping Info' },
    { id: 'returns', label: 'Returns Policy' },
    { id: 'contact', label: 'Contact/Support' },
  ],
};

// Example prompts for each business type
const EXAMPLE_PROMPTS = {
  restaurant: [
    { icon: '🍕', text: 'Italian pizzeria with authentic wood-fired oven and cozy atmosphere' },
    { icon: '🍜', text: 'Modern ramen restaurant with traditional Japanese recipes and sake bar' },
    { icon: '☕', text: 'Artisan coffee shop with locally roasted beans and fresh pastries' },
  ],
  landing: [
    { icon: '📱', text: 'SaaS productivity app that helps teams collaborate efficiently' },
    { icon: '💪', text: 'Online fitness program with personalized workout plans' },
    { icon: '🎓', text: 'Online course platform teaching web development' },
  ],
  real_estate: [
    { icon: '🏡', text: 'Luxury real estate agent specializing in waterfront properties' },
    { icon: '🏢', text: 'Commercial real estate firm for office and retail spaces' },
    { icon: '🏠', text: 'First-time homebuyer specialist in suburban neighborhoods' },
  ],
  professional: [
    { icon: '⚖️', text: 'Family law attorney with 15 years of divorce and custody experience' },
    { icon: '💼', text: 'Management consulting firm helping businesses optimize operations' },
    { icon: '📊', text: 'CPA firm specializing in small business tax planning' },
  ],
  healthcare: [
    { icon: '⚕️', text: 'Family medicine practice providing comprehensive primary care' },
    { icon: '🦷', text: 'Modern dental practice with cosmetic and implant services' },
    { icon: '🧘', text: 'Physical therapy clinic specializing in sports injuries' },
  ],
  salon: [
    { icon: '✨', text: 'Upscale hair salon specializing in balayage and color correction' },
    { icon: '💅', text: 'Nail salon and spa with organic products and relaxing atmosphere' },
    { icon: '💆', text: 'Day spa offering massage, facials, and wellness treatments' },
  ],
  business: [
    { icon: '💼', text: 'B2B software company providing cloud solutions for enterprises' },
    { icon: '📈', text: 'Marketing agency specializing in digital strategy and branding' },
    { icon: '🏗️', text: 'Construction company for commercial and residential projects' },
  ],
  ecommerce: [
    { icon: '👕', text: 'Sustainable fashion brand with eco-friendly clothing' },
    { icon: '🎮', text: 'Gaming accessories store with custom controllers and peripherals' },
    { icon: '🌿', text: 'Organic skincare products made from natural ingredients' },
  ],
};

// Color picker component with draggable selector
function ColorPicker({ value, onChange, label }: { value: string; label: string; onChange: (color: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create gradient
    const gradient1 = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient1.addColorStop(0, '#ff0000');
    gradient1.addColorStop(0.15, '#ffff00');
    gradient1.addColorStop(0.33, '#00ff00');
    gradient1.addColorStop(0.49, '#00ffff');
    gradient1.addColorStop(0.67, '#0000ff');
    gradient1.addColorStop(0.84, '#ff00ff');
    gradient1.addColorStop(1, '#ff0000');

    ctx.fillStyle = gradient1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add white to black gradient overlay
    const gradient2 = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient2.addColorStop(0, 'rgba(255,255,255,1)');
    gradient2.addColorStop(0.5, 'rgba(255,255,255,0)');
    gradient2.addColorStop(0.5, 'rgba(0,0,0,0)');
    gradient2.addColorStop(1, 'rgba(0,0,0,1)');

    ctx.fillStyle = gradient2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleColorPick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const imageData = ctx.getImageData(x, y, 1, 1);
    const pixel = imageData.data;

    const hex = '#' + 
      ('0' + pixel[0].toString(16)).slice(-2) +
      ('0' + pixel[1].toString(16)).slice(-2) +
      ('0' + pixel[2].toString(16)).slice(-2);

    onChange(hex);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <canvas
        ref={canvasRef}
        width={200}
        height={120}
        className="w-full h-32 rounded-lg cursor-crosshair border-2 border-gray-300"
        onMouseDown={(e) => {
          setIsDragging(true);
          handleColorPick(e);
        }}
        onMouseMove={(e) => isDragging && handleColorPick(e)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      />
      <div className="flex items-center gap-3">
        <div 
          className="w-12 h-12 rounded-lg border-2 border-gray-300" 
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

export default function GeneratePage() {
  const router = useRouter();
  const toast = useToast();
  const [prompt, setPrompt] = useState('');
  const [websiteType, setWebsiteType] = useState('restaurant');
  const [selectedSections, setSelectedSections] = useState<string[]>(['hero']);
  const [vibe, setVibe] = useState('professional');
  const [colorMode, setColorMode] = useState<'custom' | 'ai'>('ai');
  const [customPrimary, setCustomPrimary] = useState('#3B82F6');
  const [customSecondary, setCustomSecondary] = useState('#06B6D4');
  const [businessName, setBusinessName] = useState('');
  const [useAIName, setUseAIName] = useState(true);
  const [customLogo, setCustomLogo] = useState(false);
  const [logoColorMode, setLogoColorMode] = useState<'custom' | 'ai'>('ai');
  const [logoPrimary, setLogoPrimary] = useState('#D4AF37');
  const [logoSecondary, setLogoSecondary] = useState('#8B4789');
  const [includeImages, setIncludeImages] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    trackPageView('generate');
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
    const imageCredits = includeImages ? 3 : 0;
    const logoCredits = customLogo ? 3 : 0;
    return baseCredits + imageCredits + logoCredits;
  };

  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplate(templateId);
    setShowTemplateGallery(false);

    // For now, just redirect to AI generation with template hint
    // In the future, we could have a separate template customization flow
    toast.success(`Template selected: ${templateId}. Customize below and generate!`);

    // Scroll to the prompt section
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe your website');
      setError('Please describe your website');
      return;
    }

    if (!useAIName && !businessName.trim()) {
      toast.error('Please enter a business name or let AI create one');
      setError('Please enter a business name or let AI create one');
      return;
    }

    const totalCredits = calculateTotalCredits();

    if (credits !== null && credits < totalCredits) {
      toast.error(`Insufficient credits. You need ${totalCredits} credits but only have ${credits}.`);
      setError(`Insufficient credits. Need ${totalCredits} credits.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Show progress notifications
      setGenerationStep('Preparing your request...');
      toast.info('Starting website generation...', 3000);

      const finalPrompt = useAIName
        ? prompt
        : `Business name: "${businessName}". ${prompt}`;

      setGenerationStep('AI is analyzing your requirements...');

      const response = await fetch('/api/generate-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          websiteType,
          sections: selectedSections,
          vibe,
          colorMode,
          colorPalette: colorMode === 'custom' ? {
            primary: customPrimary,
            secondary: customSecondary
          } : null,
          customLogo,
          logoColorMode,
          logoColorPalette: logoColorMode === 'custom' ? {
            primary: logoPrimary,
            secondary: logoSecondary
          } : null,
          includeImages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate website');
      }

      setGenerationStep('Website created successfully!');
      toast.success(`Website generated! ${totalCredits} ${totalCredits === 1 ? 'credit' : 'credits'} used.`);

      // Track successful generation
      trackGeneration(websiteType, totalCredits);

      // Redirect to preview
      router.push(`/dashboard/preview/${data.previewId}`);

    } catch (err: any) {
      console.error('Generation error:', err);
      const errorMsg = err.message || 'Failed to generate website';
      setError(errorMsg);
      toast.error(errorMsg, 7000);
      setGenerationStep('');

      // Log error for monitoring
      logError(err, {
        action: 'generate_website',
        websiteType,
        prompt: prompt.substring(0, 100), // First 100 chars only
      });
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
  const examplePrompts = EXAMPLE_PROMPTS[websiteType as keyof typeof EXAMPLE_PROMPTS];

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
          <p className="text-xl text-gray-700 mb-6">
            Choose your business type, describe your vision, and let AI build it
          </p>

          {/* Template Selection Button */}
          <button
            onClick={() => setShowTemplateGallery(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition shadow-lg"
          >
            <Layout className="w-5 h-5" />
            Start from a Template
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Or continue below to generate with AI
          </p>
        </div>

        <div className="space-y-8">
          
          {/* Business Type */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-indigo-100">
            <label className="text-lg font-semibold text-gray-900 mb-4 block">
              1. What type of website do you need?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {WEBSITE_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setWebsiteType(type.value)}
                  disabled={loading}
                  className={`p-4 rounded-lg border-2 transition text-center ${
                    websiteType === type.value
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt with Examples */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-purple-100">
            <label className="text-lg font-semibold text-gray-900 mb-4 block">
              2. Describe your business
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Cozy Italian restaurant with wood-fired pizzas, homemade pasta, and local wine selection..."
              disabled={loading}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition resize-none"
            />
            
            {/* Example Prompts */}
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium text-gray-600 mb-2">Try these examples:</div>
              {examplePrompts.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(example.text)}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg transition flex items-start gap-3 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition">{example.icon}</span>
                  <span className="text-sm text-gray-700 group-hover:text-purple-700">{example.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Vibe */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-pink-100">
            <label className="text-lg font-semibold text-gray-900 mb-4 block">
              3. Choose your vibe
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {VIBES.map((v) => (
                <button
                  key={v.value}
                  onClick={() => setVibe(v.value)}
                  disabled={loading}
                  className={`p-4 rounded-lg border-2 transition ${
                    vibe === v.value
                      ? 'border-pink-500 bg-pink-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-1">{v.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{v.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-100">
            <label className="text-lg font-semibold text-gray-900 mb-4 block">
              4. Select sections for your {WEBSITE_TYPES.find(t => t.value === websiteType)?.label}
            </label>
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

          {/* Colors */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-emerald-100">
            <label className="text-lg font-semibold text-gray-900 mb-4 block">
              5. Choose your brand colors
            </label>
            
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setColorMode('custom')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  colorMode === 'custom' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🎨 Pick Custom Colors
              </button>
              <button
                onClick={() => setColorMode('ai')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  colorMode === 'ai' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✨ Let AI Choose
              </button>
            </div>

            {colorMode === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ColorPicker 
                  value={customPrimary} 
                  onChange={setCustomPrimary}
                  label="Primary Color"
                />
                <ColorPicker 
                  value={customSecondary} 
                  onChange={setCustomSecondary}
                  label="Secondary Color"
                />
              </div>
            )}

            {colorMode === 'ai' && (
              <div className="text-center py-6 text-gray-600">
                ✨ AI will analyze your business and choose the perfect color scheme
              </div>
            )}
          </div>

          {/* Logo */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-violet-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="text-lg font-semibold text-gray-900 block mb-1">
                  6. AI-Generated Custom Logo
                </label>
                <p className="text-sm text-gray-600">
                  {customLogo 
                    ? '✨ AI will create a unique simple icon logo'
                    : '📝 Text-only logo will be used'}
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
              <div className="mt-4 p-4 bg-violet-50 rounded-lg border border-violet-200">
                <p className="text-sm text-violet-700 font-medium mb-4">
                  +3 credits - Professional AI-generated logo icon
                </p>
                
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setLogoColorMode('custom')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                      logoColorMode === 'custom' ? 'bg-violet-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    Pick Logo Colors
                  </button>
                  <button
                    onClick={() => setLogoColorMode('ai')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                      logoColorMode === 'ai' ? 'bg-violet-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    AI Choose
                  </button>
                </div>

                {logoColorMode === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <ColorPicker 
                      value={logoPrimary} 
                      onChange={setLogoPrimary}
                      label="Logo Primary"
                    />
                    <ColorPicker 
                      value={logoSecondary} 
                      onChange={setLogoSecondary}
                      label="Logo Secondary"
                    />
                  </div>
                )}

                {logoColorMode === 'ai' && (
                  <div className="text-center py-3 text-sm text-gray-600">
                    AI will choose perfect logo colors
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Images */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-green-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-lg font-semibold text-gray-900">
                7. Include Professional Photos
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
                ? '✨ +3 credits - Include 2-3 strategic professional photos from Unsplash'
                : 'Use colors and gradients only (no photos)'}
            </p>
          </div>

          {/* Cost Summary */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-xl shadow-lg border-2 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 text-lg mb-2">Total Cost</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• 1 credit (website generation)</div>
                  {includeImages && <div>• 3 credits (professional photos)</div>}
                  {customLogo && <div>• 3 credits (AI custom logo)</div>}
                </div>
              </div>
              <div className="text-4xl font-bold text-indigo-600">
                {totalCredits}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {/* Progress Indicator */}
          {loading && generationStep && (
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="text-lg font-semibold text-indigo-900">{generationStep}</span>
              </div>
              <div className="w-full bg-indigo-100 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || (credits !== null && credits < totalCredits)}
            className="w-full py-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold text-xl hover:shadow-2xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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

      {/* Template Gallery Modal */}
      {showTemplateGallery && (
        <TemplateGallery
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}
    </div>
  );
}
