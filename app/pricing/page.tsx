// app/pricing/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import PricingSimple from '@/components/PricingSimple';
import { ArrowLeft } from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/dashboard/generate');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Home</span>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/login')}
                className="text-gray-600 hover:text-gray-900 transition"
              >
                Sign In
              </button>
              <button
                onClick={handleGetStarted}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Component */}
      <PricingSimple onGetStarted={handleGetStarted} />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            &copy; 2026 WeVibeCode.ai • AI Website Builder •{' '}
            <a href="/terms" className="hover:text-white">Terms</a> •{' '}
            <a href="/privacy" className="hover:text-white">Privacy</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
