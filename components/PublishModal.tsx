'use client';

// components/PublishModal.tsx
// Modal for publishing sites to subdomain or custom domain

import React, { useState } from 'react';
import { X, Globe, Link2, Check, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { validateSlug, validateDomain, generateCnameValue } from '@/lib/publish';
import type { PublishOptions, DomainVerificationResult } from '@/types/publish';

interface PublishModalProps {
  previewId: string;
  title: string;
  currentSlug?: string | null;
  currentDomain?: string | null;
  isPublished: boolean;
  onClose: () => void;
  onPublish: (publishedUrl: string) => void;
}

export default function PublishModal({
  previewId,
  title,
  currentSlug,
  currentDomain,
  isPublished,
  onClose,
  onPublish,
}: PublishModalProps) {
  const [publishType, setPublishType] = useState<'subdomain' | 'custom'>('subdomain');
  const [slug, setSlug] = useState(currentSlug || '');
  const [customDomain, setCustomDomain] = useState(currentDomain || '');
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<DomainVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState<'choose' | 'configure' | 'verify'>('choose');

  const handlePublish = async () => {
    setError(null);
    setIsPublishing(true);

    try {
      // Validate inputs
      if (publishType === 'subdomain') {
        const slugValidation = validateSlug(slug);
        if (!slugValidation.valid) {
          setError(slugValidation.error || 'Invalid slug');
          setIsPublishing(false);
          return;
        }
      } else {
        const domainValidation = validateDomain(customDomain);
        if (!domainValidation.valid) {
          setError(domainValidation.error || 'Invalid domain');
          setIsPublishing(false);
          return;
        }

        // For custom domain, verify DNS first
        if (!verificationResult?.verified) {
          setError('Please verify your domain first');
          setIsPublishing(false);
          return;
        }
      }

      // Call publish API
      const publishData: PublishOptions = {
        previewId,
        publishType,
        slug: publishType === 'subdomain' ? slug : undefined,
        customDomain: publishType === 'custom' ? customDomain : undefined,
      };

      const response = await fetch('/api/publish-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to publish');
      }

      // Success!
      onPublish(result.data.published_url);

    } catch (err: any) {
      setError(err.message || 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleVerifyDomain = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/verify-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: customDomain }),
      });

      const result: DomainVerificationResult = await response.json();

      setVerificationResult(result);

      if (!result.verified) {
        setError(result.error || 'Domain verification failed');
      } else {
        setStep('verify');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify domain');
    } finally {
      setIsVerifying(false);
    }
  };

  const cnameValue = generateCnameValue();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Publish Your Site</h2>
            <p className="text-sm text-gray-600 mt-1">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'choose' && (
            <div className="space-y-4">
              {/* Publish Type Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subdomain Option */}
                <button
                  onClick={() => {
                    setPublishType('subdomain');
                    setStep('configure');
                  }}
                  className={`p-6 border-2 rounded-lg text-left transition ${
                    publishType === 'subdomain'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Globe className="w-8 h-8 text-indigo-600 mb-3" />
                  <h3 className="text-lg font-bold mb-2">Subdomain</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Quick and easy. Your site will be at:
                  </p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    [slug].wevibecode.ai
                  </code>
                  <div className="mt-3 text-xs text-gray-500">
                    ✓ Instant setup<br />
                    ✓ Free SSL certificate<br />
                    ✓ CDN included
                  </div>
                </button>

                {/* Custom Domain Option */}
                <button
                  onClick={() => {
                    setPublishType('custom');
                    setStep('configure');
                  }}
                  className={`p-6 border-2 rounded-lg text-left transition ${
                    publishType === 'custom'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Link2 className="w-8 h-8 text-indigo-600 mb-3" />
                  <h3 className="text-lg font-bold mb-2">Custom Domain</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Use your own domain name:
                  </p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    yourdomain.com
                  </code>
                  <div className="mt-3 text-xs text-gray-500">
                    ✓ Professional branding<br />
                    ✓ Full control<br />
                    ⚠ Requires DNS setup
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 'configure' && publishType === 'subdomain' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('choose')}
                className="text-sm text-indigo-600 hover:underline mb-4"
              >
                ← Back to options
              </button>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Choose your subdomain slug
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="my-awesome-site"
                    className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <span className="text-gray-600">.wevibecode.ai</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use lowercase letters, numbers, and hyphens only
                </p>
              </div>

              {slug && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">Your site will be published at:</p>
                  <code className="text-sm font-mono bg-white px-3 py-2 rounded block">
                    https://{slug}.wevibecode.ai
                  </code>
                </div>
              )}
            </div>
          )}

          {step === 'configure' && publishType === 'custom' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('choose')}
                className="text-sm text-indigo-600 hover:underline mb-4"
              >
                ← Back to options
              </button>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Enter your custom domain
                </label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
                  placeholder="example.com"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">DNS Setup Instructions:</h4>
                <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                  <li>Go to your domain registrar's DNS settings</li>
                  <li>Add a CNAME record with these values:</li>
                </ol>
                <div className="mt-3 p-3 bg-white rounded border text-xs font-mono">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-500">Type:</span> CNAME
                    </div>
                    <div>
                      <span className="text-gray-500">Name:</span> @ or www
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Value:</span> {cnameValue}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  DNS changes can take up to 48 hours to propagate
                </p>
              </div>

              {customDomain && (
                <button
                  onClick={handleVerifyDomain}
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Verify DNS Configuration
                    </>
                  )}
                </button>
              )}

              {verificationResult && (
                <div className={`p-4 rounded-lg border ${
                  verificationResult.verified
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-2">
                    {verificationResult.verified ? (
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {verificationResult.verified
                          ? 'Domain verified successfully!'
                          : 'Domain verification failed'}
                      </p>
                      {verificationResult.error && (
                        <p className="text-xs mt-1 text-gray-600">
                          {verificationResult.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'choose' && (
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
            >
              Cancel
            </button>

            <button
              onClick={handlePublish}
              disabled={isPublishing || (publishType === 'subdomain' && !slug) || (publishType === 'custom' && !verificationResult?.verified)}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Publish Now
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
