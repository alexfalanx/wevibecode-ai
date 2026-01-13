'use client';

// components/TemplateGallery.tsx
// Template gallery UI for selecting pre-built templates

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Zap } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  preview: string;
  vibe: string[];
  bestFor: string[];
  colorScheme: 'light' | 'dark';
  layout: string;
  source: string;
  path: string;
}

interface TemplateGalleryProps {
  onSelect: (templateId: string) => void;
  onClose: () => void;
}

export default function TemplateGallery({ onSelect, onClose }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'business', label: 'Business' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'landing', label: 'Landing Page' },
    { id: 'blog', label: 'Blog' },
    { id: 'ecommerce', label: 'E-commerce' },
    { id: 'restaurant', label: 'Restaurant' },
  ];

  const filteredTemplates = templates.filter(template => {
    if (filter === 'all') return true;
    return template.bestFor.includes(filter);
  });

  const getTemplatePreview = (template: Template) => {
    // Use template's banner image as preview via API route
    return `/api/template-preview/${template.name}/banner.jpg`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              Choose a Template
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Start with a professional design, customize to your needs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setFilter(category.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  filter === category.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-48 mb-3"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="group cursor-pointer"
                  onClick={() => onSelect(template.id)}
                >
                  <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 group-hover:border-indigo-600 transition-all duration-300">
                    <div className="aspect-video bg-gray-100 relative">
                      <img
                        src={getTemplatePreview(template)}
                        alt={template.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=' + template.name;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center gap-2 text-white">
                            <Zap className="w-4 h-4" />
                            <span className="font-medium">Use This Template</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition">
                      {template.name}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.vibe.slice(0, 2).map(vibe => (
                        <span
                          key={vibe}
                          className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {vibe}
                        </span>
                      ))}
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          template.colorScheme === 'dark'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-50 text-gray-900 border border-gray-200'
                        }`}
                      >
                        {template.colorScheme}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Best for: {template.bestFor.join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No templates found for this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
