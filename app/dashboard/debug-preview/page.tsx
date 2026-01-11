'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function DebugPreviewPage() {
  const [previewId, setPreviewId] = useState('e2ae2fab-a902-4fad-8cb3-36bcd7dd70f8');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkPreview = async () => {
    setLoading(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('previews')
        .select('*')
        .eq('id', previewId)
        .single();

      if (error) {
        setResult({ error: error.message });
      } else {
        setResult({
          id: data.id,
          title: data.title,
          html_length: data.html_content?.length || 0,
          css_length: data.css_content?.length || 0,
          js_length: data.js_content?.length || 0,
          html_preview: data.html_content?.substring(0, 500),
          starts_with_doctype: data.html_content?.trim().toLowerCase().startsWith('<!doctype'),
          starts_with_html: data.html_content?.trim().toLowerCase().startsWith('<html'),
          generation_type: data.generation_type,
          created_at: data.created_at,
        });
      }
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Preview Debugger</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <label className="block text-sm font-medium mb-2">Preview ID:</label>
          <input
            type="text"
            value={previewId}
            onChange={(e) => setPreviewId(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg mb-4"
            placeholder="Enter preview ID"
          />
          <button
            onClick={checkPreview}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Preview'}
          </button>
        </div>

        {result && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Results:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>

            {result.html_preview && (
              <div className="mt-6">
                <h3 className="font-bold mb-2">HTML Preview (first 500 chars):</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                  {result.html_preview}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
