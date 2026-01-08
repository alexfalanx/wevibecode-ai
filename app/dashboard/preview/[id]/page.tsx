'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sparkles, ArrowLeft, Download, Eye, Edit, Loader2, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const websiteId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [website, setWebsite] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    fetchWebsite();
  }, [websiteId]);

  const fetchWebsite = async () => {
    try {
      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('Please log in to view this website');
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/websites/${websiteId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setWebsite(data.website);
      } else {
        alert('Website not found: ' + data.error);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching website:', error);
      alert('Failed to load website');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!website) return;
    
    const element = document.createElement('a');
    const file = new Blob([website.code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${website.name.replace(/\s+/g, '-').toLowerCase()}.tsx`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your website...</p>
        </div>
      </div>
    );
  }

  if (!website) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Website not found</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </button>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-700 to-pink-700 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">{website.name}</div>
                  <div className="text-xs text-gray-500">Preview</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Device Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                    previewMode === 'desktop'
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Desktop
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                    previewMode === 'mobile'
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mobile
                </button>
              </div>

              {/* Actions */}
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                <Download className="w-4 h-4" />
                Download Code
              </button>
              
              <button
                onClick={() => router.push(`/dashboard/edit/${websiteId}`)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Preview Area */}
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className={`bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden transition-all ${
            previewMode === 'mobile' ? 'max-w-[375px] mx-auto' : ''
          }`}>
            {/* Preview Frame */}
            <div className="bg-gray-100 p-4 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-600 font-mono">
                  {website.name.replace(/\s+/g, '-').toLowerCase()}.wevibecode.ai
                </div>
              </div>
            </div>

            {/* Website Preview */}
            <div className={`bg-white ${previewMode === 'mobile' ? 'h-[667px]' : 'min-h-[800px]'} overflow-auto p-8`}>
              {/* For now, show the code */}
              <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-auto max-h-[700px]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-400">Generated Code</span>
                  <button
                    onClick={handleDownload}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition flex items-center gap-2"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  <code>{website.code}</code>
                </pre>
              </div>
              
              {/* Instructions */}
              <div className="mt-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-3">🚀 How to Use Your Website</h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600">1.</span>
                    <span>Click "Download Code" to save the file</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600">2.</span>
                    <span>Create a new Next.js project or add to existing one</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600">3.</span>
                    <span>Save as <code className="bg-white px-2 py-1 rounded font-mono text-xs">page.tsx</code> in your app folder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600">4.</span>
                    <span>Run <code className="bg-white px-2 py-1 rounded font-mono text-xs">npm run dev</code> to see it live!</span>
                  </li>
                </ol>
                
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong className="text-gray-900">Coming Soon:</strong> Live preview, one-click deployment, and custom domains!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <div className="text-2xl mb-2">🎨</div>
              <h3 className="font-bold text-gray-900 mb-1">Style</h3>
              <p className="text-gray-600 capitalize">{website.style}</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <div className="text-2xl mb-2">📄</div>
              <h3 className="font-bold text-gray-900 mb-1">Sections</h3>
              <p className="text-gray-600">{website.sections?.length || 0} sections</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <div className="text-2xl mb-2">✨</div>
              <h3 className="font-bold text-gray-900 mb-1">Status</h3>
              <p className="text-gray-600 capitalize">{website.status}</p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-indigo-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">What's Next?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Edit className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Customize Content</h4>
                  <p className="text-sm text-gray-600">Edit text, images, and layout to match your exact needs</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Go Live</h4>
                  <p className="text-sm text-gray-600">Connect your domain and publish to the world</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}