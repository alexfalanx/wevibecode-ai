'use client';

import React, { useState } from 'react';
import { Sparkles, Zap, Check, ArrowRight, Clock, DollarSign, Globe, Menu, X } from 'lucide-react';

export default function LandingPage() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                WeVibeCode
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#how-it-works" className="text-gray-700 hover:text-gray-900 transition font-medium">How It Works</a>
              <a href="#pricing" className="text-gray-700 hover:text-gray-900 transition font-medium">Pricing</a>
              <button
                onClick={() => window.location.href = '/login'}
                className="text-gray-700 hover:text-gray-900 transition font-medium"
              >
                Log In
              </button>
              <button
                onClick={() => window.location.href = '/signup'}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                Get Started Free
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-700"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col gap-4">
                <a href="#how-it-works" onClick={() => setShowMobileMenu(false)} className="text-gray-700 py-2 font-medium">
                  How It Works
                </a>
                <a href="#pricing" onClick={() => setShowMobileMenu(false)} className="text-gray-700 py-2 font-medium">
                  Pricing
                </a>
                <button onClick={() => window.location.href = '/login'} className="text-left text-gray-700 py-2 font-medium">
                  Log In
                </button>
                <button
                  onClick={() => window.location.href = '/signup'}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                >
                  Get Started Free
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 text-gray-900 leading-tight">
            Your Website.<br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              5 Minutes. £19.99.
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto font-medium leading-relaxed">
            No templates. No drag-and-drop. No monthly fees.<br />
            Just tell our AI what you need. We build it. Done.
          </p>

          {/* Value Props */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold">Ready in 5 minutes</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold">£19.99 once, use forever</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Zap className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold">AI-powered</span>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/signup'}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Try It Free
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-600 mt-4">No credit card required • Pay £19.99 only when you publish</p>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">
            Why Pay Monthly When You Can Own It?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Wix */}
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="text-xl font-bold mb-2 text-gray-900">Wix / Squarespace</div>
              <div className="text-4xl font-bold mb-4 text-gray-700">£16-45</div>
              <div className="text-gray-600 mb-6">per month, forever</div>
              <div className="text-sm text-gray-600 space-y-2 mb-6">
                <p>= £192-540 per year</p>
                <p>Hours to learn</p>
                <p>1000s of unused features</p>
              </div>
              <div className="text-xs text-gray-500">Cancel anytime*<br />*But your site disappears</div>
            </div>

            {/* Freelancer */}
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="text-xl font-bold mb-2 text-gray-900">Freelancer</div>
              <div className="text-4xl font-bold mb-4 text-gray-700">£200-500</div>
              <div className="text-gray-600 mb-6">one-time payment</div>
              <div className="text-sm text-gray-600 space-y-2 mb-6">
                <p>1-2 weeks wait</p>
                <p>Revisions cost extra</p>
                <p>Complicated handoff</p>
              </div>
              <div className="text-xs text-gray-500">Good quality<br />but slow & expensive</div>
            </div>

            {/* WeVibeCode */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white transform md:scale-105 shadow-2xl">
              <div className="bg-white/20 rounded-lg px-3 py-1 text-xs font-bold w-fit mx-auto mb-2">
                BEST VALUE
              </div>
              <div className="text-xl font-bold mb-2">WeVibeCode.ai</div>
              <div className="text-5xl font-bold mb-4">£19.99</div>
              <div className="opacity-90 mb-6">one-time payment</div>
              <div className="text-sm space-y-2 mb-6">
                <p>✓ Ready in 5 minutes</p>
                <p>✓ Edit unlimited forever</p>
                <p>✓ No monthly fees</p>
              </div>
              <div className="text-xs opacity-90">Pay once<br />Use forever</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gray-900">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16">
            Seriously, it's this simple.
          </p>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Describe Your Business</h3>
              <p className="text-gray-600 leading-relaxed">
                Tell our AI what you do. Restaurant? Salon? Portfolio? We've got templates for 8 different business types.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">AI Builds Your Site</h3>
              <p className="text-gray-600 leading-relaxed">
                5 minutes later, your complete website is ready. Professional design, mobile-friendly, SEO optimized.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Edit & Publish</h3>
              <p className="text-gray-600 leading-relaxed">
                Change colors, text, images. Generate new versions. When perfect, pay £19.99 and publish. That's it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">
            What You Get for £19.99
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <FeatureCard
              icon="⚡"
              title="Unlimited AI Generations"
              description="Try different designs until perfect. No extra charges."
            />
            <FeatureCard
              icon="✏️"
              title="Unlimited Editing Forever"
              description="Change text, colors, images anytime. No time limits."
            />
            <FeatureCard
              icon="🌐"
              title="Published & Hosted"
              description="Your site lives on wevibecode.ai subdomain. Free forever."
            />
            <FeatureCard
              icon="🔗"
              title="Custom Domain Support"
              description="Connect your own domain name (yourbusiness.com)."
            />
            <FeatureCard
              icon="📱"
              title="Mobile Responsive"
              description="Looks perfect on phones, tablets, and desktops."
            />
            <FeatureCard
              icon="🔍"
              title="SEO Optimized"
              description="Meta tags, Open Graph, structured data included."
            />
            <FeatureCard
              icon="💾"
              title="Download HTML/CSS"
              description="Export your website anytime. It's yours."
            />
            <FeatureCard
              icon="🎨"
              title="No Branding"
              description="Clean website. No 'Powered by' footer."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
            Simple, Honest Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            One price. One website. Built by AI in 5 minutes.
          </p>

          <div className="bg-white rounded-3xl p-10 shadow-2xl border-2 border-indigo-200">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-2 rounded-xl text-sm font-semibold mb-6">
              NO SUBSCRIPTIONS • PAY ONCE
            </div>

            <div className="text-6xl font-bold text-gray-900 mb-3">
              £19.99
            </div>
            <div className="text-xl text-gray-600 mb-8">
              per website, one-time payment
            </div>

            <button
              onClick={() => window.location.href = '/signup'}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105 mb-4"
            >
              Try It Free
            </button>

            <p className="text-sm text-gray-500">
              Generate free preview • Pay £19.99 only when you publish
            </p>
          </div>

          <p className="text-sm text-gray-600 mt-8 max-w-md mx-auto">
            Perfect for restaurants, salons, portfolios, landing pages, small businesses, events, and more.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">
            Quick Questions
          </h2>

          <div className="space-y-6">
            <FAQItem
              q="Can I try it first?"
              a="Yes! Generate a free preview. Pay £19.99 only when you're ready to publish."
            />
            <FAQItem
              q="What if I need changes later?"
              a="Edit unlimited times, forever. Change text, colors, images anytime. No time limits, no extra fees."
            />
            <FAQItem
              q="Do I need to pay monthly?"
              a="No. Pay £19.99 once per website. That's it. No subscriptions, no recurring charges."
            />
            <FAQItem
              q="How many times can I regenerate?"
              a="Unlimited. Try different designs until it's perfect. We won't charge extra."
            />
            <FAQItem
              q="Can I use my own domain?"
              a="Yes. Connect yourbusiness.com to your website. Instructions provided."
            />
            <FAQItem
              q="What if I need multiple websites?"
              a="Each website is £19.99. Buy as many as you need."
            />
            <FAQItem
              q="Is it really ready in 5 minutes?"
              a="Yes. Our AI generates your complete website in about 5 minutes. You can edit after that."
            />
            <FAQItem
              q="What business types do you support?"
              a="Restaurants, salons, real estate, healthcare, professional services, landing pages, portfolios, and more."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready in 5 Minutes
          </h2>
          <p className="text-xl mb-8 opacity-95">
            Your website. AI-built. £19.99. Forever yours.
          </p>

          <button
            onClick={() => window.location.href = '/signup'}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all transform hover:scale-105"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm mt-4 opacity-90">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <span className="text-xl font-bold text-white">WeVibeCode.ai</span>
          </div>
          <p className="mb-4">AI Website Builder • £19.99 • Forever Yours</p>
          <p className="text-xs mt-8 text-gray-500">&copy; 2026 WeVibeCode.ai • All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex gap-4 p-6 bg-gray-50 rounded-xl hover:shadow-lg transition">
      <div className="text-3xl flex-shrink-0">{icon}</div>
      <div>
        <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-gray-50 p-6 rounded-xl">
      <div className="font-bold text-gray-900 mb-2">{q}</div>
      <div className="text-gray-600">{a}</div>
    </div>
  );
}
