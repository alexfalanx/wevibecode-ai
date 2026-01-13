// components/ImageGallery.tsx
// Gallery view of user's uploaded images

'use client';

import { useState, useEffect } from 'react';
import { Trash2, Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface UserImage {
  id: string;
  url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface ImageGalleryProps {
  onSelectImage?: (imageUrl: string) => void;
  selectable?: boolean;
  refreshTrigger?: number;
}

export default function ImageGallery({
  onSelectImage,
  selectable = false,
  refreshTrigger = 0
}: ImageGalleryProps) {
  const [images, setImages] = useState<UserImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/upload-image');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch images');
      }

      setImages(data.images || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load images';
      console.error('❌ Fetch error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [refreshTrigger]);

  const handleDelete = async (imageId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      setDeletingId(imageId);

      const response = await fetch('/api/upload-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete image');
      }

      // Remove from local state
      setImages(prev => prev.filter(img => img.id !== imageId));

      if (selectedImageId === imageId) {
        setSelectedImageId(null);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete image';
      console.error('❌ Delete error:', errorMessage);
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectImage = (image: UserImage) => {
    if (!selectable) return;

    setSelectedImageId(image.id);
    if (onSelectImage) {
      onSelectImage(image.url);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="ml-3 text-gray-600">Loading images...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-800 font-medium">Error loading images</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={fetchImages}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No images uploaded yet</p>
        <p className="text-gray-500 text-sm mt-1">Upload your first image to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Your Images ({images.length})
        </h3>
        <button
          onClick={fetchImages}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            onClick={() => handleSelectImage(image)}
            className={`
              relative group rounded-lg overflow-hidden border-2 transition-all
              ${selectable ? 'cursor-pointer' : ''}
              ${selectedImageId === image.id
                ? 'border-indigo-500 ring-2 ring-indigo-500 ring-offset-2'
                : 'border-gray-200 hover:border-indigo-300'
              }
            `}
          >
            {/* Image */}
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
              <img
                src={image.url}
                alt={image.file_name}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Selected Checkmark */}
              {selectedImageId === image.id && (
                <div className="absolute top-2 right-2 bg-indigo-500 rounded-full p-1">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                <button
                  onClick={(e) => handleDelete(image.id, e)}
                  disabled={deletingId === image.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg disabled:opacity-50"
                  title="Delete image"
                >
                  {deletingId === image.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Image Info */}
            <div className="p-2 bg-white">
              <p className="text-xs font-medium text-gray-900 truncate" title={image.file_name}>
                {image.file_name}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {formatFileSize(image.file_size)}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(image.created_at)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
