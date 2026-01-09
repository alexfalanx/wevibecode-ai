// components/Preview.tsx
'use client';

import { useState } from 'react';
import { Monitor, Tablet, Smartphone, Maximize2, RefreshCw, X } from 'lucide-react';

type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface PreviewProps {
  previewId: string;
  onClose?: () => void;
}

export default function Preview({ previewId, onClose }: PreviewProps) {
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const deviceSizes = {
    desktop: { width: '100%', height: '100%' },
    tablet: { width: '768px', height: '1024px' },
    mobile: { width: '375px', height: '667px' },
  };

  const currentSize = deviceSizes[device];

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'}`}>
      {/* Controls Bar */}
      <div className="bg-gray-100 border-b border-gray-300 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Device Toggles */}
          <button
            onClick={() => setDevice('desktop')}
            className={`p-2 rounded-lg transition ${
              device === 'desktop' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title="Desktop View"
          >
            <Monitor className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setDevice('tablet')}
            className={`p-2 rounded-lg transition ${
              device === 'tablet' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title="Tablet View"
          >
            <Tablet className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setDevice('mobile')}
            className={`p-2 rounded-lg transition ${
              device === 'mobile' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title="Mobile View"
          >
            <Smartphone className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition"
            title="Refresh Preview"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Device Size Label */}
        <div className="text-sm text-gray-600 font-medium">
          {device === 'desktop' && 'Desktop'}
          {device === 'tablet' && 'Tablet (768x1024)'}
          {device === 'mobile' && 'Mobile (375x667)'}
        </div>

        {/* Close Button */}
        {onClose && !isFullscreen && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Preview Container */}
      <div className={`bg-gray-200 ${isFullscreen ? 'h-[calc(100vh-73px)]' : 'h-[600px]'} flex items-center justify-center overflow-auto p-4`}>
        <div
          className="bg-white shadow-2xl transition-all duration-300"
          style={{
            width: currentSize.width,
            height: currentSize.height,
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          <iframe
            key={refreshKey}
            src={`/api/preview/${previewId}`}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            title="Preview"
          />
        </div>
      </div>
    </div>
  );
}
