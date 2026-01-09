// app/dashboard/history/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Eye, Trash2, Clock, Sparkles } from 'lucide-react';

interface Preview {
  id: string;
  title: string;
  generation_prompt: string;
  generation_type: string;
  created_at: string;
  credits_used: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('previews')
        .select('id, title, generation_prompt, generation_type, created_at, credits_used')
        .eq('user_id', user.id)
        .not('generation_prompt', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPreviews(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this generated website?')) {
      return;
    }

    try {
      setDeleting(id);

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase
        .from('previews')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPreviews(previews.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting preview:', error);
      alert('Failed to delete website');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      landing: 'Landing Page',
      portfolio: 'Portfolio',
      business: 'Business',
      restaurant: 'Restaurant',
      blog: 'Blog',
      ecommerce: 'E-commerce',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Generation History</h1>
          <p className="text-lg text-gray-600">View and manage your AI-generated websites</p>
        </div>

        {/* Empty State */}
        {previews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No websites generated yet</h3>
            <p className="text-gray-600 mb-6">Start creating amazing websites with AI!</p>
            <button
              onClick={() => router.push('/dashboard/generate')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Generate Your First Website
            </button>
          </div>
        ) : (
          /* Generation List */
          <div className="grid gap-6">
            {previews.map((preview) => (
              <div
                key={preview.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                        {getTypeLabel(preview.generation_type)}
                      </span>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {formatDate(preview.created_at)}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {preview.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {preview.generation_prompt}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/preview/${preview.id}`)}
                      className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                      title="View Preview"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(preview.id)}
                      disabled={deleting === preview.id}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                      title="Delete"
                    >
                      {deleting === preview.id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard/generate')}
            className="px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition"
          >
            Generate New Website
          </button>
        </div>
      </div>
    </div>
  );
}
