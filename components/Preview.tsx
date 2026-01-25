// components/Preview.tsx
// OPTIMIZED - Lazy loading, better caching, and performance improvements

'use client';

import { useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, RefreshCw, Maximize, Edit, Upload, Check, ExternalLink } from 'lucide-react';
import { PreviewSkeleton } from './LoadingSkeleton';
import { trackPreviewView, logError } from '@/lib/analytics';
import SiteEditor from './SiteEditor';
import PublishModal from './PublishModal';
import PublishSuccessModal from './PublishSuccessModal';
import { useTranslation } from 'react-i18next';

interface PreviewProps {
  previewId: string;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export default function Preview({ previewId }: PreviewProps) {
  const { t } = useTranslation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [showEditor, setShowEditor] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string>('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAndRenderPreview();
  }, [previewId]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      } else if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleRefresh();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen]);

  const handleRefresh = () => {
    loadAndRenderPreview();
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      exitFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const loadAndRenderPreview = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Fetch HTML directly from database
      const { data, error: fetchError } = await supabase
        .from('previews')
        .select('*')
        .eq('id', previewId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Preview not found');

      // Store preview data for later use
      setPreviewData(data);

      console.log(`✅ Preview loaded - HTML: ${data.html_content?.length || 0} chars`);

      // Track preview view
      trackPreviewView(previewId);

      // Check if html_content is a complete HTML document or just content
      const isCompleteDocument = data.html_content?.trim().toLowerCase().startsWith('<!doctype') ||
                                  data.html_content?.trim().toLowerCase().startsWith('<html');

      let finalHtml: string;

      if (isCompleteDocument) {
        // html_content already contains a complete HTML document with inlined CSS/JS
        finalHtml = data.html_content || '';
        console.log(`✅ Using complete HTML document from html_content`);
      } else {
        // html_content is just content, need to construct full document
        finalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
    }
    ${data.css_content || ''}
  </style>
</head>
<body>
  ${data.html_content || ''}
  <script>
    ${data.js_content || ''}
  </script>
</body>
</html>
        `.trim();
        console.log(`✅ Constructed full HTML document from separate fields`);
      }

      // Set HTML content for srcdoc attribute
      setHtmlContent(finalHtml);
      console.log(`✅ HTML ready for rendering (${Math.round(finalHtml.length / 1024)}KB)`);

      setLoading(false);
    } catch (err: any) {
      console.error('Preview render error:', err);
      const errorMsg = err.message || 'Failed to render preview';
      setError(errorMsg);
      setLoading(false);

      // Log error for monitoring
      logError(err, {
        action: 'load_preview',
        previewId,
      });
    }
  };

  if (loading) {
    return <PreviewSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Preview</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const getViewportDimensions = () => {
    switch (viewportMode) {
      case 'mobile':
        return { width: '375px', height: '100%' };
      case 'tablet':
        return { width: '768px', height: '100%' };
      default:
        return { width: '100%', height: '100%' };
    }
  };

  const dimensions = getViewportDimensions();

  return (
    <div ref={containerRef} className="w-full h-[calc(100vh-100px)] bg-gray-100 flex flex-col">
      {/* Viewport Toggle */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-medium">{t('preview.view')}</span>

        <button
          onClick={() => setViewportMode('desktop')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            viewportMode === 'desktop'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title="Desktop view (Full width)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2"/>
            <path d="M8 21h8" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 17v4" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {t('preview.desktop')}
        </button>

        <button
          onClick={() => setViewportMode('tablet')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            viewportMode === 'tablet'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title="Tablet view (768px)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2"/>
            <path d="M12 18h.01" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {t('preview.tablet')}
        </button>

        <button
          onClick={() => setViewportMode('mobile')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            viewportMode === 'mobile'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title="Mobile view (375px)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="7" y="2" width="10" height="20" rx="2" strokeWidth="2"/>
            <path d="M12 18h.01" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {t('preview.mobile')}
        </button>

          <span className="ml-4 text-xs text-gray-500">
            {viewportMode === 'desktop' && t('preview.fullWidth')}
            {viewportMode === 'tablet' && '768px wide'}
            {viewportMode === 'mobile' && '375px wide'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditor(true)}
            className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition flex items-center gap-2"
            title="Edit text and colors"
          >
            <Edit className="w-4 h-4" />
            {t('preview.edit')}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPublishModal(true)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                previewData?.is_published
                  ? 'bg-green-100 hover:bg-green-200 text-green-700'
                  : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
              }`}
              title={previewData?.is_published ? t('preview.published') : t('preview.publish')}
            >
              {previewData?.is_published ? (
                <>
                  <Check className="w-4 h-4" />
                  {t('preview.published')}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {t('preview.publish')}
                </>
              )}
            </button>

            {previewData?.is_published && previewData?.published_url && (
              <button
                onClick={() => window.open(previewData.published_url, '_blank', 'noopener,noreferrer')}
                className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-medium transition flex items-center gap-2"
                title={`Visit: ${previewData.published_url}`}
              >
                <ExternalLink className="w-4 h-4" />
                {t('preview.viewLive')}
              </button>
            )}
          </div>

          <button
            onClick={handleRefresh}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition flex items-center gap-2"
            title="Refresh preview (Ctrl/Cmd + R)"
          >
            <RefreshCw className="w-4 h-4" />
            {t('preview.refresh')}
          </button>

          <button
            onClick={toggleFullscreen}
            className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-medium transition flex items-center gap-2"
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen"}
          >
            <Maximize className="w-4 h-4" />
            {isFullscreen ? t('preview.exit') : t('preview.fullscreen')}
          </button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 flex items-start justify-center overflow-auto p-6">
        <div
          className="bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300"
          style={{
            width: dimensions.width,
            height: 'calc(100vh - 200px)',
            maxWidth: '100%'
          }}
        >
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            srcDoc={htmlContent}
            title="Website Preview"
          />
        </div>
      </div>

      {/* Site Editor Modal */}
      {showEditor && previewData && (
        <SiteEditor
          previewId={previewId}
          htmlContent={htmlContent}
          onSave={async (editedHtml) => {
            setIsSaving(true);
            try {
              const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
              );

              // Update HTML content in database
              const { error: updateError } = await supabase
                .from('previews')
                .update({
                  html_content: editedHtml,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', previewId);

              if (updateError) throw updateError;

              // Reload preview
              await loadAndRenderPreview();
              setShowEditor(false);
            } catch (err: any) {
              console.error('Save error:', err);
              alert('Failed to save changes: ' + err.message);
            } finally {
              setIsSaving(false);
            }
          }}
          onClose={() => setShowEditor(false)}
        />
      )}

      {/* Publish Modal */}
      {showPublishModal && previewData && (
        <PublishModal
          previewId={previewId}
          title={previewData.title || 'Untitled'}
          currentSlug={previewData.slug}
          currentDomain={previewData.custom_domain}
          isPublished={previewData.is_published || false}
          onClose={() => setShowPublishModal(false)}
          onPublish={(url) => {
            // Reload preview data to update published status
            loadAndRenderPreview();
            setShowPublishModal(false);

            // Show success modal with published URL
            setPublishedUrl(url);
            setShowSuccessModal(true);
          }}
        />
      )}

      {/* Publish Success Modal */}
      {showSuccessModal && publishedUrl && (
        <PublishSuccessModal
          publishedUrl={publishedUrl}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
}
