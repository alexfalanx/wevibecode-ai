'use client';

// components/SiteEditor.tsx
// UI for editing text and colors in generated sites

import React, { useState, useEffect } from 'react';
import { ChromePicker } from 'react-color';
import { extractColorPalette, extractEditableElements, extractEditableElementsWithHtml, applyTextEdit, applyColorEdit } from '@/lib/publish';
import type { ColorPalette, EditableElement } from '@/types/publish';
import { X, Type, Palette, Save, RotateCcw } from 'lucide-react';

interface SiteEditorProps {
  previewId: string;
  htmlContent: string;
  onSave: (editedHtml: string) => Promise<void>;
  onClose: () => void;
}

export default function SiteEditor({ previewId, htmlContent, onSave, onClose }: SiteEditorProps) {
  const [editMode, setEditMode] = useState<'text' | 'color'>('text');
  const [editedHtml, setEditedHtml] = useState(htmlContent);
  const [colorPalette, setColorPalette] = useState<ColorPalette>({});
  const [editableElements, setEditableElements] = useState<EditableElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<EditableElement | null>(null);
  const [selectedColor, setSelectedColor] = useState<{ key: string; value: string } | null>(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setSaving] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempColor, setTempColor] = useState<string>('');

  useEffect(() => {
    // Extract editable elements and color palette on mount
    // Use the version that returns both elements and HTML with data attributes
    const { elements, html } = extractEditableElementsWithHtml(htmlContent);
    const palette = extractColorPalette(htmlContent);

    setEditableElements(elements);
    setColorPalette(palette);

    // Initialize editedHtml with the version that has data-editable-id attributes
    // This ensures selectors work correctly from the start
    setEditedHtml(html);
  }, [htmlContent]);

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
          <h2 className="text-xl font-bold">Edit Your Site</h2>
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
            Edit Text
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
            Edit Colors
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {editMode === 'text' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Click on any text element below to edit it
              </p>

              {editableElements.map(element => (
                <div
                  key={element.id}
                  className="p-3 border rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition cursor-pointer"
                  onClick={() => handleTextEdit(element)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 uppercase font-medium">
                        {element.type}
                      </span>
                      <p className="text-gray-900 mt-1">{element.content}</p>
                    </div>
                    <Type className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {editMode === 'color' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Click on any color to change it
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Text Edit Modal */}
      {selectedElement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold mb-4">Edit {selectedElement.type}</h3>

            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 border rounded-lg min-h-[100px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter new text..."
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
                Cancel
              </button>
              <button
                onClick={applyTextChange}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Apply
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
            <h3 className="text-lg font-bold mb-4">Edit Color: {selectedColor.key}</h3>

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
                Cancel
              </button>
              <button
                onClick={applyColorChange}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
