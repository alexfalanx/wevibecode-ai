'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Code2, Palette, Users, Rocket, ArrowRight, Check, Star, Globe, Menu, X, Clock, Store, Calculator, Calendar, BarChart3 } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
];

function useTranslation(locale: string) {
  const [translations, setTranslations] = useState<any>({});

  useEffect(() => {
    fetch(`/locales/${locale}/common.json`)
      .then((res) => res.json())
      .then((data) => setTranslations(data))
      .catch(() => {
        fetch('/locales/en/common.json')
          .then((res) => res.json())
          .then((data) => setTranslations(data));
      });
  }, [locale]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return { t };
}

export default function LandingPage() {
  const [locale, setLocale] = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const { t } = useTranslation(locale);

  useEffect(() => {
    const saved = localStorage.getItem('wevibecode-lang');
    if (saved && LANGUAGES.find(l => l.code === saved)) {
      setLocale(saved);
    }
  }, []);

  const changeLanguage = (code: string) => {
    setLocale(code);
    localStorage.setItem('wevibecode-lang', code);
    setShowLangMenu(false);
    setShowMobileMenu(false);
  };

  const currentLang = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-700 to-pink-700 rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                WeVibeCode
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-gray-700 hover:text-gray-900 transition font-medium">How It Works</a>
              <a href="#pricing" className="text-gray-700 hover:text-gray-900 transition font-medium">Pricing</a>
              
              {/* Language Switcher Desktop */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <Globe className="w-4 h-4 text-gray-700" />
                  <span className="text-sm font-medium text-gray-900">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
                </button>
                
                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition flex items-center gap-3 ${
                          locale === lang.code ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-800'
                        }`}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <span className="font-medium">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => window.location.href = '/signup'}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                Get Started Free
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-700 hover:text-gray-900"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col gap-4">
                <a 
                  href="#how-it-works" 
                  onClick={() => setShowMobileMenu(false)}
                  className="text-gray-700 hover:text-gray-900 transition py-2 font-medium"
                >
                  How It Works
                </a>
                <a 
                  href="#pricing" 
                  onClick={() => setShowMobileMenu(false)}
                  className="text-gray-700 hover:text-gray-900 transition py-2 font-medium"
                >
                  Pricing
                </a>
                
                {/* Language Switcher Mobile */}
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`px-4 py-2 text-left rounded-lg hover:bg-gray-50 transition flex items-center gap-3 ${
                        locale === lang.code ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-800'
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="font-medium">{lang.name}</span>
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => window.location.href = '/signup'}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                >
                  Get Started Free
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section - TWO PATHS */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-gray-900">
              Your Website. Your Apps.<br />
              <span className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                Your Vibe. In 5 Minutes.
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto font-medium">
              Professional websites and simple apps built by AI. No coding. No setup. Live instantly.
            </p>

            {/* Two Clear Paths */}
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Path 1: Websites */}
              <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-indigo-200 hover:border-indigo-400 transition cursor-pointer group">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                  <Store className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">I Need a Website</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Perfect for restaurants, gyms, salons, portfolios, landing pages, and small businesses
                </p>
                <ul className="text-left space-y-2 mb-6">
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Live in 5 minutes with your own domain</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Mobile-friendly & SEO optimized</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Update anytime with simple text commands</span>
                  </li>
                </ul>
                <button 
                  onClick={() => window.location.href = '/signup?type=website'}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2 group-hover:scale-105"
                >
                  Create My Website
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-sm text-gray-500 mt-3">Starting at $19/month</p>
              </div>

              {/* Path 2: Simple Apps */}
              <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-pink-200 hover:border-pink-400 transition cursor-pointer group">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">I Need a Simple App</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Booking systems, directories, calculators, dashboards, and custom tools
                </p>
                <ul className="text-left space-y-2 mb-6">
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Pre-built templates ready to customize</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Email notifications & calendar sync</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Works perfectly with your website</span>
                  </li>
                </ul>
                <button 
                  onClick={() => window.location.href = '/signup?type=app'}
                  className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2 group-hover:scale-105"
                >
                  Create My App
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-sm text-gray-500 mt-3">Starting at $49/month</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple App Examples */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">Popular Simple Apps</h2>
            <p className="text-xl text-gray-700">Built in minutes, not weeks</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 hover:shadow-lg transition">
              <Calendar className="w-12 h-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-gray-900">Booking System</h3>
              <p className="text-gray-600 text-sm">
                Accept appointments with calendar sync, email confirmations, and payment collection
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 hover:shadow-lg transition">
              <Users className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-gray-900">Directory</h3>
              <p className="text-gray-600 text-sm">
                Searchable listings with filters, profiles, and contact forms for your community
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 hover:shadow-lg transition">
              <Calculator className="w-12 h-12 text-pink-600 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-gray-900">Calculator</h3>
              <p className="text-gray-600 text-sm">
                Custom pricing tools, ROI calculators, quote generators for your business
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 hover:shadow-lg transition">
              <BarChart3 className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-gray-900">Dashboard</h3>
              <p className="text-gray-600 text-sm">
                Track metrics, display data, and share insights with your team or clients
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">How It Works</h2>
            <p className="text-xl text-gray-700">From idea to live in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Describe What You Need</h3>
              <p className="text-gray-600 leading-relaxed">
                Tell us about your business, what you want on your site, and your preferred style
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">AI Builds It Instantly</h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI generates your professional site or app with your branding in minutes
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Go Live & Update Anytime</h3>
              <p className="text-gray-600 leading-relaxed">
                Connect your domain and launch. Update your content anytime with simple text commands
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-700">Start free, upgrade when you're ready</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free Trial */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-300">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Free Trial</h3>
              <div className="text-3xl font-bold mb-6 text-gray-900">
                $0
                <span className="text-base text-gray-600 font-normal"> / 7 days</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>Try before you buy</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>Test domain preview</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>No credit card</span>
                </li>
              </ul>
              <button 
                onClick={() => window.location.href = '/signup'}
                className="w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition"
              >
                Start Free
              </button>
            </div>

            {/* Website */}
            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-300">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Website</h3>
              <div className="text-3xl font-bold mb-6 text-gray-900">
                $19
                <span className="text-base text-gray-600 font-normal"> / month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>Live with your domain</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>Mobile responsive</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>Unlimited updates</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>SEO optimized</span>
                </li>
              </ul>
              <button 
                onClick={() => window.location.href = '/signup?plan=website'}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                Get Started
              </button>
              <p className="text-xs text-center text-gray-500 mt-3">Or $49 one-time for export</p>
            </div>

            {/* Website + App Bundle - MOST POPULAR */}
            <div className="bg-gradient-to-br from-indigo-600 to-pink-600 rounded-2xl p-6 text-white transform md:scale-105 shadow-2xl">
              <div className="bg-white/25 rounded-lg px-3 py-1 text-xs font-bold w-fit mb-4">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">Website + App</h3>
              <div className="text-3xl font-bold mb-6">
                $68
                <span className="text-base opacity-90 font-normal"> / month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" /> 
                  <span>Everything in Website</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" /> 
                  <span>1 simple app included</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" /> 
                  <span>Email notifications</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" /> 
                  <span>Priority support</span>
                </li>
              </ul>
              <button 
                onClick={() => window.location.href = '/signup?plan=bundle'}
                className="w-full py-3 bg-white text-indigo-700 rounded-xl font-bold hover:bg-gray-50 transition"
              >
                Get Started
              </button>
              <p className="text-xs text-center opacity-90 mt-3">Save $20/month vs separate</p>
            </div>

            {/* Unlimited */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-300">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Unlimited</h3>
              <div className="text-3xl font-bold mb-6 text-gray-900">
                $199
                <span className="text-base text-gray-600 font-normal"> / month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>Unlimited websites</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>Unlimited apps</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>White-label option</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>Dedicated support</span>
                </li>
              </ul>
              <button 
                onClick={() => window.location.href = '/signup?plan=unlimited'}
                className="w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition"
              >
                Get Started
              </button>
              <p className="text-xs text-center text-gray-500 mt-3">Perfect for agencies</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 to-pink-600">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Launch Your Site?</h2>
          <p className="text-xl mb-8 opacity-95">Join thousands of businesses already live with WeVibeCode</p>
          
          <button
            onClick={() => window.location.href = '/signup'}
            className="px-8 py-4 bg-white text-indigo-700 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2 mx-auto text-lg"
          >
            Start Building Free
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm mt-4 opacity-90">No credit card required • 7-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <span className="text-xl font-bold text-white">WeVibeCode.ai</span>
          </div>
          <p className="mb-4">Build professional websites and apps in minutes, not weeks</p>
          <div className="flex justify-center gap-6 text-sm flex-wrap">
            <a href="#" className="hover:text-white transition">Twitter</a>
            <a href="#" className="hover:text-white transition">GitHub</a>
            <a href="#" className="hover:text-white transition">Discord</a>
            <a href="#" className="hover:text-white transition">Docs</a>
          </div>
          <p className="text-xs mt-8 text-gray-500">© 2026 WeVibeCode.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}