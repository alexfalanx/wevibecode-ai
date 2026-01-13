'use client';

// components/PublishSuccessModal.tsx
// Success modal shown after publishing a site

import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check } from 'lucide-react';

interface PublishSuccessModalProps {
  publishedUrl: string;
  onClose: () => void;
}

export default function PublishSuccessModal({ publishedUrl, onClose }: PublishSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVisit = () => {
    window.open(publishedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Site Published Successfully!</h2>
          <p className="text-gray-600">Your site is now live and accessible to everyone.</p>
        </div>

        {/* Published URL */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Published URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={publishedUrl}
              readOnly
              className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-900 cursor-text select-all"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              onClick={handleCopy}
              className="p-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition"
              title="Copy URL"
            >
              {copied ? (
                <Check className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Close
          </button>
          <button
            onClick={handleVisit}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Visit Site
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900">
            <strong>Note:</strong> Your published URL is saved and can be accessed anytime from your dashboard.
            Share this link with anyone to show them your site!
          </p>
        </div>
      </div>
    </div>
  );
}
