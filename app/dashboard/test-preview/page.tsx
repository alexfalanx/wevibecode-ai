// app/dashboard/test-preview/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPreview, generateSampleHTML } from '@/lib/preview';

export default function TestPreviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateSample = async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate sample HTML
      const sampleData = generateSampleHTML('My Awesome Website');

      // Create preview in database
      const preview = await createPreview(sampleData);

      // Redirect to preview page
      router.push(`/dashboard/preview/${preview.id}`);
    } catch (err) {
      console.error('Error creating preview:', err);
      setError('Failed to create preview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">
            Test Preview System
          </h1>
          <p className="text-gray-600 mb-8">
            Click the button below to generate a sample website preview and test the preview system.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <button
            onClick={handleCreateSample}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Preview...' : 'Create Sample Preview'}
          </button>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">What this does:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✅ Generates a sample HTML website</li>
              <li>✅ Saves it to the database</li>
              <li>✅ Opens the preview page</li>
              <li>✅ Shows responsive preview controls (desktop/tablet/mobile)</li>
              <li>✅ Allows fullscreen mode</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
