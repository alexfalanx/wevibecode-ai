'use client';

// components/SiteEditor.tsx
// UI for editing text and colors in generated sites

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChromePicker } from 'react-color';
import { extractColorPalette, extractEditableElements, extractEditableElementsWithHtml, applyTextEdit, applyColorEdit, extractImages, extractImagesWithHtml, replaceImage, type SiteImage } from '@/lib/publish';
import type { ColorPalette, EditableElement } from '@/types/publish';
import { X, Type, Palette, Save, RotateCcw, Image as ImageIcon, Loader2 } from 'lucide-react';
import ImageUploader from './ImageUploader';
import ImageGallery from './ImageGallery';

interface SiteEditorProps {
  previewId: string;
  htmlContent: string;
  onSave: (editedHtml: string) => Promise<void>;
  onClose: () => void;
}

export default function SiteEditor({ previewId, htmlContent, onSave, onClose }: SiteEditorProps) {
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState<'text' | 'color' | 'images'>('text');
  const [editedHtml, setEditedHtml] = useState(htmlContent);
  const [colorPalette, setColorPalette] = useState<ColorPalette>({});
  const [editableElements, setEditableElements] = useState<EditableElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<EditableElement | null>(null);
  const [selectedColor, setSelectedColor] = useState<{ key: string; value: string } | null>(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setSaving] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempColor, setTempColor] = useState<string>('');

  // Image management state
  const [siteImages, setSiteImages] = useState<SiteImage[]>([]);
  const [replacingImage, setReplacingImage] = useState<SiteImage | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [refreshGallery, setRefreshGallery] = useState(0);
  const [imageReplaceSuccess, setImageReplaceSuccess] = useState(false);

  // AI Image Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    // Extract editable elements and color palette on mount
    // Use the version that returns both elements and HTML with data attributes
    const { elements, html: htmlWithEditableIds } = extractEditableElementsWithHtml(htmlContent);
    const palette = extractColorPalette(htmlContent);

    // Now extract images and add data-img-id attributes
    const { images, html: finalHtml } = extractImagesWithHtml(htmlWithEditableIds);

    console.log('📸 Initialized with', images.length, 'images');

    setEditableElements(elements);
    setColorPalette(palette);
    setSiteImages(images);

    // Initialize editedHtml with the version that has both data-editable-id and data-img-id attributes
    // This ensures selectors work correctly from the start
    setEditedHtml(finalHtml);
  }, [htmlContent]);

  // Re-extract images when edited HTML changes (for after replacements)
  useEffect(() => {
    const { images } = extractImagesWithHtml(editedHtml);
    console.log('🔄 Re-extracted', images.length, 'images after HTML change');
    setSiteImages(images);
  }, [editedHtml]);

  const handleTextEdit = (element: EditableElement) => {
    setSelectedElement(element);
    setEditText(element.content);
  };

  const applyTextChange = () => {
    if (!selectedElement) return;

    const newHtml = applyTextEdit(
      editedHtml,
      selectedElement.selector,
      selectedElement.content,
      editText
    );

    setEditedHtml(newHtml);

    // Re-extract elements from the updated HTML to keep them in sync
    // This also ensures data attributes are preserved/updated
    const { elements } = extractEditableElementsWithHtml(newHtml);
    setEditableElements(elements);

    setSelectedElement(null);
    setEditText('');
  };

  const handleColorEdit = (key: string, value: string) => {
    setSelectedColor({ key, value });
    setTempColor(value); // Initialize with current color
    setShowColorPicker(true);
  };

  const applyColorChange = () => {
    if (!selectedColor || !tempColor) return;

    const newHtml = applyColorEdit(editedHtml, selectedColor.key, tempColor);

    setEditedHtml(newHtml);

    // Update the palette by replacing just the changed color
    // This maintains the same color names/keys instead of re-extracting
    const updatedPalette = { ...colorPalette };
    updatedPalette[selectedColor.key] = tempColor;
    setColorPalette(updatedPalette);

    setShowColorPicker(false);
    setSelectedColor(null);
    setTempColor('');
  };

  const handleReplaceImageClick = (image: SiteImage) => {
    console.log('Opening replacement modal for:', image.id);
    setReplacingImage(image);
    setShowImageSelector(true);
  };

  const handleSelectReplacement = (newUrl: string) => {
    if (!replacingImage) return;

    console.log('🔄 Replacing image:', {
      selector: replacingImage.selector,
      oldSrc: replacingImage.src,
      newSrc: newUrl
    });

    // Replace the image in HTML
    const newHtml = replaceImage(editedHtml, replacingImage.selector, newUrl);

    console.log('✅ Image replaced, new HTML length:', newHtml.length);

    // Update the HTML - this will trigger the useEffect to re-extract images
    setEditedHtml(newHtml);

    // Close modal and reset state
    setShowImageSelector(false);
    setReplacingImage(null);

    // Show success message
    setImageReplaceSuccess(true);
    setTimeout(() => setImageReplaceSuccess(false), 2000);
  };

  const handleUploadComplete = () => {
    setRefreshGallery(prev => prev + 1);
  };

  const handleSearchImages = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch('/api/search-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, perPage: 9 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search images');
      }

      setSearchResults(data.images || []);

      if (data.images.length === 0) {
        setSearchError('No images found. Try a different search term.');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setSearchError(error.message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (imageUrl: string) => {
    handleSelectReplacement(imageUrl);
    // Clear search results after selection
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editedHtml);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const { elements, html } = extractEditableElementsWithHtml(htmlContent);
    const palette = extractColorPalette(htmlContent);

    setEditedHtml(html);
    setEditableElements(elements);
    setColorPalette(palette);
    setSelectedElement(null);
    setSelectedColor(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">{t('editor.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex border-b">
          <button
            onClick={() => setEditMode('text')}
            className={`flex-1 flex items-center justify-center gap-2 p-3 font-medium transition ${
              editMode === 'text'
                ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Type className="w-5 h-5" />
            {t('editor.editText')}
          </button>
          <button
            onClick={() => setEditMode('color')}
            className={`flex-1 flex items-center justify-center gap-2 p-3 font-medium transition ${
              editMode === 'color'
                ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Palette className="w-5 h-5" />
            {t('editor.editColors')}
          </button>
          <button
            onClick={() => setEditMode('images')}
            className={`flex-1 flex items-center justify-center gap-2 p-3 font-medium transition ${
              editMode === 'images'
                ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            {t('images.editImages')}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {editMode === 'text' && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600 mb-4">
                Click any text to edit it. Elements are organized by section.
              </p>

              {(() => {
                // Group elements by section
                const groupedElements = editableElements.reduce((acc, element) => {
                  const section = element.sectionLabel || 'Other';
                  if (!acc[section]) {
                    acc[section] = [];
                  }
                  acc[section].push(element);
                  return acc;
                }, {} as Record<string, typeof editableElements>);

                // Render each section
                return Object.entries(groupedElements).map(([sectionLabel, elements]) => (
                  <div key={sectionLabel} className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                      {sectionLabel}
                    </h3>
                    <div className="space-y-2">
                      {elements.map(element => (
                        <div
                          key={element.id}
                          className="p-3 border bg-white rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition cursor-pointer"
                          onClick={() => handleTextEdit(element)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <span className="text-xs text-gray-500 uppercase font-medium">
                                {element.type}
                              </span>
                              <p className="text-gray-900 mt-1 line-clamp-2">{element.content}</p>
                            </div>
                            <Type className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          {editMode === 'color' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                {t('editor.clickToChangeColor')}
              </p>

              {Object.entries(colorPalette).map(([key, value]) => {
                if (!value) return null;
                return (
                  <div
                    key={key}
                    className="p-3 border rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition cursor-pointer"
                    onClick={() => handleColorEdit(key, value)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700">{key}</span>
                        <p className="text-xs text-gray-500 mt-1">{value}</p>
                      </div>
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-gray-200"
                        style={{ backgroundColor: value }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {editMode === 'images' && (
            <div className="space-y-6">
              {/* Logo Upload Section */}
              <div className="border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50">
                <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Upload Business Logo
                </h3>
                <p className="text-xs text-indigo-700 mb-3">
                  Upload a logo to replace or enhance your business name in the header. This logo will appear in the top-left corner of your site.
                </p>
                <ImageUploader onUploadComplete={() => {
                  handleUploadComplete();
                  // Show success message
                  setImageReplaceSuccess(true);
                  setTimeout(() => setImageReplaceSuccess(false), 2000);
                  // Note: To actually apply logo, user needs to select it from gallery and replace the header logo
                  alert('Logo uploaded! Now click on the current logo/business name in "Current Images" below and select your new logo to replace it.');
                }} />
                <p className="text-xs text-gray-600 mt-2 bg-yellow-50 border border-yellow-200 p-2 rounded">
                  <strong>Tip:</strong> After uploading, scroll down to "Current Images", click on the logo/header image, and select your new uploaded logo to replace it.
                </p>
              </div>

              {/* Debug Info */}
              <details className="text-xs bg-gray-50 p-2 rounded">
                <summary className="cursor-pointer font-mono text-gray-600">Debug Info (click to expand)</summary>
                <div className="mt-2 space-y-1 font-mono">
                  <div>Total images: {siteImages.length}</div>
                  {siteImages.map((img, idx) => (
                    <div key={idx} className="pl-2 text-gray-500">
                      {idx + 1}. {img.selector} → {img.src.substring(0, 50)}...
                    </div>
                  ))}
                </div>
              </details>

              {/* Success Message */}
              {imageReplaceSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">{t('images.imageReplaced')}</span>
                </div>
              )}

              {/* Current Images in Site */}
              {siteImages.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    {t('images.currentImages')} ({siteImages.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {siteImages.map((image) => (
                      <div
                        key={image.id}
                        className="border rounded-lg overflow-hidden bg-white hover:border-indigo-300 transition"
                      >
                        <div className="aspect-video bg-gray-100 relative">
                          <img
                            src={image.src}
                            alt={image.alt || 'Site image'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-gray-600 truncate mb-2">
                            {image.alt || 'No description'}
                          </p>
                          <button
                            onClick={() => handleReplaceImageClick(image)}
                            className="w-full px-3 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition"
                          >
                            {t('images.replaceImage')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">{t('images.noImagesInSite')}</p>
                </div>
              )}

              {/* Upload New Image */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  {t('images.uploadNewImage')}
                </h3>
                <ImageUploader onUploadComplete={handleUploadComplete} />
              </div>

              {/* Your Uploaded Images Gallery */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  {t('images.yourUploadedImages')}
                </h3>
                <ImageGallery
                  selectable={false}
                  refreshTrigger={refreshGallery}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
            {t('editor.reset')}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('editor.saving') : t('editor.saveChanges')}
            </button>
          </div>
        </div>
      </div>

      {/* Text Edit Modal */}
      {selectedElement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold mb-4">{t('editor.editElement')} {selectedElement.type}</h3>

            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 border rounded-lg min-h-[100px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t('editor.enterNewText')}
              autoFocus
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setSelectedElement(null);
                  setEditText('');
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={applyTextChange}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                {t('editor.applyChanges')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Color Picker Modal */}
      {showColorPicker && selectedColor && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowColorPicker(false);
              setSelectedColor(null);
              setTempColor('');
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h3 className="text-lg font-bold mb-4">{t('editor.editColorKey')}: {selectedColor.key}</h3>

            <ChromePicker
              color={tempColor || selectedColor.value}
              onChange={(color) => setTempColor(color.hex)}
              onChangeComplete={(color) => setTempColor(color.hex)}
              disableAlpha
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowColorPicker(false);
                  setSelectedColor(null);
                  setTempColor('');
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={applyColorChange}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                {t('editor.applyChanges')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Selector Modal */}
      {showImageSelector && replacingImage && (
        <div
          key={replacingImage.id}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">{t('images.selectReplacement')}</h3>
              <button
                onClick={() => {
                  setShowImageSelector(false);
                  setReplacingImage(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Upload Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  {t('images.uploadNewImage')}
                </h4>
                <ImageUploader onUploadComplete={handleUploadComplete} />
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* AI Image Search Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Search Stock Images
                </h4>
                <p className="text-xs text-gray-600 mb-3">
                  Describe the image you want (e.g., "modern office", "happy team", "luxury restaurant")
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchImages()}
                    placeholder="e.g., modern office space"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={handleSearchImages}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      'Search'
                    )}
                  </button>
                </div>

                {/* Search Error */}
                {searchError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {searchError}
                  </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Found {searchResults.length} images. Click to select:
                    </p>
                    <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                      {searchResults.map((image) => (
                        <div
                          key={image.id}
                          onClick={() => handleSelectSearchResult(image.url)}
                          className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-indigo-500 transition"
                        >
                          <div className="aspect-video bg-gray-100">
                            <img
                              src={image.thumbnail}
                              alt={image.alt}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 bg-white text-indigo-600 px-3 py-1 rounded-full text-xs font-semibold">
                              Select
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Photos by Pexels photographers
                    </p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* Gallery Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Your Uploaded Images
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Click an image to select it as replacement:
                </p>
                <ImageGallery
                  selectable={true}
                  onSelectImage={handleSelectReplacement}
                  refreshTrigger={refreshGallery}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
