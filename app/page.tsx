'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Code2, Palette, Users, Rocket, ArrowRight, Check, Star, Globe, Menu, X, Clock, Store, Calculator, Calendar, BarChart3 } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

function useTranslation(locale: string) {
  const [translations, setTranslations] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log(`[Translation] Loading locale: ${locale}`);
    setIsLoading(true);
    
    fetch(`/locales/${locale}/common.json`)
      .then((res) => {
        console.log(`[Translation] Fetch response for ${locale}:`, res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log(`[Translation] Successfully loaded ${locale}:`, Object.keys(data));
        setTranslations(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(`[Translation] Failed to load ${locale}:`, error);
        console.log('[Translation] Falling back to English');
        fetch('/locales/en/common.json')
          .then((res) => res.json())
          .then((data) => {
            console.log('[Translation] Fallback successful');
            setTranslations(data);
            setIsLoading(false);
          })
          .catch((fallbackError) => {
            console.error('[Translation] Fallback also failed:', fallbackError);
            setIsLoading(false);
          });
      });
  }, [locale]);

  const t = (key: string): string => {
    if (isLoading) return '...';
    
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

  return { t, isLoading };
}

export default function LandingPage() {
  const [locale, setLocale] = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { t, isLoading } = useTranslation(locale);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('wevibecode-lang');
    if (saved && LANGUAGES.find(l => l.code === saved)) {
      console.log('[Language] Loading saved language:', saved);
      setLocale(saved);
    }
  }, []);

  const changeLanguage = (code: string) => {
    console.log('[Language] Changing to:', code);
    setLocale(code);
    localStorage.setItem('wevibecode-lang', code);
    setShowLangMenu(false);
    setShowMobileMenu(false);
    
    // Force page to recognize change
    window.dispatchEvent(new Event('languagechange'));
  };

  const currentLang = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0];

  // Don't render until mounted (prevents hydration mismatch)
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white" key={locale}>
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
            <nav className="hidden md:flex items-center gap-4">
              <a href="#how-it-works" className="text-gray-700 hover:text-gray-900 transition font-medium">{t('header.features')}</a>
              <a href="#pricing" className="text-gray-700 hover:text-gray-900 transition font-medium">{t('header.pricing')}</a>
              
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
              
              {/* LOGIN BUTTON - ADDED */}
              <button 
                onClick={() => window.location.href = '/login'}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition font-medium"
              >
                {t('header.login') || 'Login'}
              </button>
              
              <button 
                onClick={() => window.location.href = '/signup'}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                {t('header.getStarted')}
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
                  {t('header.features')}
                </a>
                <a 
                  href="#pricing" 
                  onClick={() => setShowMobileMenu(false)}
                  className="text-gray-700 hover:text-gray-900 transition py-2 font-medium"
                >
                  {t('header.pricing')}
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
                
                {/* LOGIN BUTTON MOBILE - ADDED */}
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="w-full py-2 text-gray-700 hover:text-gray-900 transition font-medium text-left border-t border-gray-200 pt-3"
                >
                  {t('header.login') || 'Login'}
                </button>
                
                <button 
                  onClick={() => window.location.href = '/signup'}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                >
                  {t('header.getStarted')}
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
              {(() => {
                const title = t('hero.title');
                // Find where "Apps" appears (works for "Apps", "Tus Apps", "Le Tue App", etc.)
                const appsPatterns = ['Apps.', 'Apps,', 'Aplikacje.', 'App.'];
                let splitIndex = -1;
                
                for (const pattern of appsPatterns) {
                  const index = title.indexOf(pattern);
                  if (index !== -1) {
                    splitIndex = index + pattern.length;
                    break;
                  }
                }
                
                if (splitIndex === -1) return title;
                
                const beforeApps = title.substring(0, splitIndex);
                const afterApps = title.substring(splitIndex).trim();
                
                return (
                  <>
                    {beforeApps}
                    <br />
                    <span className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                      {afterApps}
                    </span>
                  </>
                );
              })()}
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto font-medium">
              {t('hero.subtitle')}
            </p>

            {/* Two Clear Paths */}
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Path 1: Websites */}
              <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-indigo-200 hover:border-indigo-400 transition cursor-pointer group">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                  <Store className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">{t('hero.websitePath.title')}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {t('hero.websitePath.subtitle')}
                </p>
                <ul className="text-left space-y-2 mb-6">
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('hero.websitePath.feature1')}</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('hero.websitePath.feature2')}</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('hero.websitePath.feature3')}</span>
                  </li>
                </ul>
                <button 
                  onClick={() => window.location.href = '/signup?type=website'}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2 group-hover:scale-105"
                >
                  {t('hero.websitePath.cta')}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-sm text-gray-500 mt-3">{t('hero.websitePath.price')}</p>
              </div>

              {/* Path 2: Simple Apps */}
              <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-pink-200 hover:border-pink-400 transition cursor-pointer group">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">{t('hero.appPath.title')}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {t('hero.appPath.subtitle')}
                </p>
                <ul className="text-left space-y-2 mb-6">
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('hero.appPath.feature1')}</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('hero.appPath.feature2')}</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{t('hero.appPath.feature3')}</span>
                  </li>
                </ul>
                <button 
                  onClick={() => window.location.href = '/signup?type=app'}
                  className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2 group-hover:scale-105"
                >
                  {t('hero.appPath.cta')}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-sm text-gray-500 mt-3">{t('hero.appPath.price')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple App Examples */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">{t('apps.title')}</h2>
            <p className="text-xl text-gray-700">{t('apps.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 hover:shadow-lg transition">
              <Calendar className="w-12 h-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-gray-900">{t('apps.booking.title')}</h3>
              <p className="text-gray-600 text-sm">
                {t('apps.booking.description')}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 hover:shadow-lg transition">
              <Users className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-gray-900">{t('apps.directory.title')}</h3>
              <p className="text-gray-600 text-sm">
                {t('apps.directory.description')}
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 hover:shadow-lg transition">
              <Calculator className="w-12 h-12 text-pink-600 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-gray-900">{t('apps.calculator.title')}</h3>
              <p className="text-gray-600 text-sm">
                {t('apps.calculator.description')}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 hover:shadow-lg transition">
              <BarChart3 className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-gray-900">{t('apps.dashboard.title')}</h3>
              <p className="text-gray-600 text-sm">
                {t('apps.dashboard.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">{t('howItWorks.title')}</h2>
            <p className="text-xl text-gray-700">{t('howItWorks.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">{t('howItWorks.step1.title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('howItWorks.step1.description')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">{t('howItWorks.step2.title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('howItWorks.step2.description')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">{t('howItWorks.step3.title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('howItWorks.step3.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">{t('pricing.title')}</h2>
            <p className="text-xl text-gray-700">{t('pricing.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free Trial */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-300">
              <h3 className="text-xl font-bold mb-2 text-gray-900">{t('pricing.free.name')}</h3>
              <div className="text-3xl font-bold mb-6 text-gray-900">
                {t('pricing.free.price')}
                <span className="text-base text-gray-600 font-normal">{t('pricing.free.perMonth')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>{t('pricing.free.credits')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>{t('pricing.free.vibes')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>{t('pricing.free.gallery')}</span>
                </li>
              </ul>
              <button 
                onClick={() => window.location.href = '/signup'}
                className="w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition"
              >
                {t('pricing.free.cta')}
              </button>
            </div>

            {/* Website */}
            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-300">
              <h3 className="text-xl font-bold mb-2 text-gray-900">{t('pricing.website.name')}</h3>
              <div className="text-3xl font-bold mb-6 text-gray-900">
                {t('pricing.website.price')}
                <span className="text-base text-gray-600 font-normal">{t('pricing.website.perMonth')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>{t('pricing.website.feature1')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>{t('pricing.website.feature2')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>{t('pricing.website.feature3')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>{t('pricing.website.feature4')}</span>
                </li>
              </ul>
              <button 
                onClick={() => window.location.href = '/signup?plan=website'}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                {t('pricing.website.cta')}
              </button>
              <p className="text-xs text-center text-gray-500 mt-3">{t('pricing.website.note')}</p>
            </div>

            {/* Website + App Bundle - MOST POPULAR */}
            <div className="bg-gradient-to-br from-indigo-600 to-pink-600 rounded-2xl p-6 text-white transform md:scale-105 shadow-2xl">
              <div className="bg-white/25 rounded-lg px-3 py-1 text-xs font-bold w-fit mb-4">
                {t('pricing.bundle.badge')}
              </div>
              <h3 className="text-xl font-bold mb-2">{t('pricing.bundle.name')}</h3>
              <div className="text-3xl font-bold mb-6">
                {t('pricing.bundle.price')}
                <span className="text-base opacity-90 font-normal">{t('pricing.bundle.perMonth')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" /> 
                  <span>{t('pricing.bundle.feature1')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" /> 
                  <span>{t('pricing.bundle.feature2')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" /> 
                  <span>{t('pricing.bundle.feature3')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" /> 
                  <span>{t('pricing.bundle.feature4')}</span>
                </li>
              </ul>
              <button 
                onClick={() => window.location.href = '/signup?plan=bundle'}
                className="w-full py-3 bg-white text-indigo-700 rounded-xl font-bold hover:bg-gray-50 transition"
              >
                {t('pricing.bundle.cta')}
              </button>
              <p className="text-xs text-center opacity-90 mt-3">{t('pricing.bundle.note')}</p>
            </div>

            {/* Unlimited */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-300">
              <h3 className="text-xl font-bold mb-2 text-gray-900">{t('pricing.unlimited.name')}</h3>
              <div className="text-3xl font-bold mb-6 text-gray-900">
                {t('pricing.unlimited.price')}
                <span className="text-base text-gray-600 font-normal">{t('pricing.unlimited.perMonth')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>{t('pricing.unlimited.feature1')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>{t('pricing.unlimited.feature2')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>{t('pricing.unlimited.feature3')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-800">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> 
                  <span>{t('pricing.unlimited.feature4')}</span>
                </li>
              </ul>
              <button 
                onClick={() => window.location.href = '/signup?plan=unlimited'}
                className="w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition"
              >
                {t('pricing.unlimited.cta')}
              </button>
              <p className="text-xs text-center text-gray-500 mt-3">{t('pricing.unlimited.note')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 to-pink-600">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-xl mb-8 opacity-95">{t('cta.subtitle')}</p>
          
          <button
            onClick={() => window.location.href = '/signup'}
            className="px-8 py-4 bg-white text-indigo-700 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2 mx-auto text-lg"
          >
            {t('cta.button')}
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm mt-4 opacity-90">{t('cta.note')}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <span className="text-xl font-bold text-white">WeVibeCode.ai</span>
          </div>
          <p className="mb-4">{t('footer.tagline')}</p>
          <div className="flex justify-center gap-6 text-sm flex-wrap">
            <a href="#" className="hover:text-white transition">{t('footer.twitter')}</a>
            <a href="#" className="hover:text-white transition">{t('footer.github')}</a>
            <a href="#" className="hover:text-white transition">{t('footer.discord')}</a>
            <a href="#" className="hover:text-white transition">{t('footer.docs')}</a>
          </div>
          <p className="text-xs mt-8 text-gray-500">{t('footer.copyright')}</p>
        </div>
      </footer>
    </div>
  );
}
