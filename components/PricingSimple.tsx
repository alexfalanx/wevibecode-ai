// components/PricingSimple.tsx
'use client';

import { Check } from 'lucide-react';

interface PricingSimpleProps {
  onGetStarted?: () => void;
}

export default function PricingSimple({ onGetStarted }: PricingSimpleProps) {
  return (
    <div className="py-12 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Honest Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            One price. One website. Built by AI in 5 minutes.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-indigo-100 overflow-hidden">
            {/* Badge */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-2 text-sm font-semibold">
              NO SUBSCRIPTIONS • PAY ONCE
            </div>

            {/* Price */}
            <div className="p-8 text-center">
              <div className="mb-6">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  £19.99
                </div>
                <div className="text-gray-600">per website, one-time payment</div>
                <div className="text-sm text-gray-500 mt-1">
                  (≈ €23 / $25)
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8 text-left">
                <FeatureItem text="Unlimited AI generation attempts" />
                <FeatureItem text="Unlimited editing forever" />
                <FeatureItem text="Published on your subdomain" />
                <FeatureItem text="Custom domain support" />
                <FeatureItem text="Download HTML/CSS anytime" />
                <FeatureItem text="Mobile responsive design" />
                <FeatureItem text="SEO optimized" />
                <FeatureItem text="No branding (clean website)" />
                <FeatureItem text="Free hosting included" />
                <FeatureItem text="Email support" />
              </div>

              {/* CTA Button */}
              <button
                onClick={onGetStarted}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Get Started Free
              </button>

              <p className="text-sm text-gray-500 mt-4">
                Try it free • Pay when you publish
              </p>
            </div>
          </div>
        </div>

        {/* Value Props */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
          <ValueProp
            icon="⚡"
            title="5 Minutes"
            description="Your website is ready before your coffee gets cold"
          />
          <ValueProp
            icon="🎨"
            title="AI-Powered"
            description="Just describe what you need, we build it"
          />
          <ValueProp
            icon="🔓"
            title="Forever Yours"
            description="Pay once, edit and use it forever"
          />
        </div>

        {/* Comparison */}
        <div className="mt-16 bg-white rounded-xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Compare to Alternatives
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <ComparisonItem
              title="Wix/Squarespace"
              price="£16-45/month"
              note="Forever subscription"
              time="Hours to learn"
            />
            <ComparisonItem
              title="Freelancer"
              price="£200-500"
              note="Per website"
              time="1-2 weeks"
              highlight={false}
            />
            <ComparisonItem
              title="WeVibeCode.ai"
              price="£19.99 once"
              note="Pay once, use forever"
              time="5 minutes"
              highlight={true}
            />
          </div>
        </div>

        {/* FAQ Quick */}
        <div className="mt-12 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Quick Questions
          </h3>
          <div className="space-y-3 text-sm">
            <QuickFAQ
              q="Can I try it first?"
              a="Yes! Generate a free preview. Pay £19.99 only when you're ready to publish."
            />
            <QuickFAQ
              q="What if I need changes later?"
              a="Edit unlimited times, forever. No time limits."
            />
            <QuickFAQ
              q="Do I need to pay monthly?"
              a="No. Pay £19.99 once per website. That's it."
            />
            <QuickFAQ
              q="Need multiple websites?"
              a="Each website is £19.99. Buy as many as you need."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
        <Check className="w-3 h-3 text-green-600" />
      </div>
      <span className="text-gray-700">{text}</span>
    </div>
  );
}

function ValueProp({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div>
      <div className="text-4xl mb-3">{icon}</div>
      <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function ComparisonItem({
  title,
  price,
  note,
  time,
  highlight = false,
}: {
  title: string;
  price: string;
  note: string;
  time: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        highlight
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className={`font-semibold mb-2 ${highlight ? 'text-indigo-900' : 'text-gray-900'}`}>
        {title}
      </div>
      <div className={`text-2xl font-bold mb-1 ${highlight ? 'text-indigo-600' : 'text-gray-700'}`}>
        {price}
      </div>
      <div className="text-sm text-gray-600 mb-2">{note}</div>
      <div className="text-xs text-gray-500">Ready in: {time}</div>
    </div>
  );
}

function QuickFAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="font-semibold text-gray-900 mb-1">{q}</div>
      <div className="text-gray-600">{a}</div>
    </div>
  );
}
