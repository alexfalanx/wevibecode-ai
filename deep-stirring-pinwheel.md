# Export & Download Features Implementation Plan

## Overview
Add comprehensive export and one-click deployment features to WeVibeCode.ai, allowing users to download generated websites as HTML files, ZIP packages, or deploy directly to hosting platforms.

## User Requirements (Confirmed)
- ✅ All export formats: HTML, Offline HTML (base64), ZIP
- ✅ One-click deployment (Netlify/Vercel/GitHub Pages)
- ✅ Both image strategies: ZIP with local images + base64 embed
- ⏭️ Code editor: Skip for MVP (Phase 2)

## Architecture Decisions

### 1. ZIP Generation: **Client-side with JSZip**
- Lightweight (14KB), runs in browser
- No server load, instant downloads
- Package: `jszip@3.10.1`

### 2. Image Handling: **Hybrid Approach**
- **ZIP Export**: Download images → save to /images folder → rewrite HTML paths
- **Offline HTML**: Download images → convert to base64 → embed in HTML
- **Standard HTML**: Keep external Pexels URLs (fast, small file)

### 3. Deployment Integration: **Server-side API proxies**
- Server endpoints call Netlify/Vercel/GitHub APIs
- User provides API tokens (stored encrypted in profile)
- Async deployment with status polling

### 4. File Downloads: **Browser Blob API + file-saver**
- No additional backend needed for downloads
- Cross-browser compatibility via file-saver
- Package: `file-saver@2.0.5`

## Dependencies to Add

```bash
npm install jszip@3.10.1 file-saver@2.0.5
npm install --save-dev @types/file-saver
```

## File Structure

### New Files
```
app/
  api/
    download-images/route.ts          # Download images (CORS bypass)
    deploy/
      netlify/route.ts                # Netlify deployment
      vercel/route.ts                 # Vercel deployment
      github/route.ts                 # GitHub Pages deployment

components/
  ExportMenu.tsx                      # Export dropdown (HTML/ZIP/Deploy)
  DeploymentModal.tsx                 # One-click deployment UI

lib/
  export/
    zipExporter.ts                    # ZIP generation logic
    htmlExporter.ts                   # HTML export with images
    imageDownloader.ts                # Image fetching/base64
    deploymentService.ts              # Deployment API clients

types/
  export.ts                           # TypeScript interfaces
```

### Modified Files
```
components/Preview.tsx                # Add export button to toolbar
app/dashboard/preview/[id]/page.tsx   # Pass export functionality
package.json                          # Add dependencies
```

## Implementation Steps

### Phase 1: Foundation (Days 1-2)

#### 1.1 Install Dependencies
```bash
npm install jszip@3.10.1 file-saver@2.0.5
npm install --save-dev @types/file-saver
```

#### 1.2 Create Type Definitions
**File**: `types/export.ts`

```typescript
export type ExportFormat = 'html' | 'offline-html' | 'zip';

export interface ExportOptions {
  format: ExportFormat;
  downloadImages: boolean;
  optimizeImages?: boolean;
}

export interface ImageAsset {
  url: string;
  localPath: string;
  data: Blob;
  base64?: string;
}

export interface DeploymentConfig {
  platform: 'netlify' | 'vercel' | 'github';
  apiToken: string;
  siteName: string;
  customDomain?: string;
}

export interface DeploymentResult {
  success: boolean;
  url?: string;
  error?: string;
  deploymentId?: string;
}
```

#### 1.3 Create Image Downloader Utility
**File**: `lib/export/imageDownloader.ts`

```typescript
import { ImageAsset } from '@/types/export';

/**
 * Extracts all image URLs from HTML content
 */
export function extractImagesFromHTML(html: string): string[] {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const urls: string[] = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }

  return urls.filter(url => url.startsWith('http'));
}

/**
 * Downloads images via server API (bypasses CORS)
 */
export async function downloadImages(urls: string[]): Promise<ImageAsset[]> {
  const response = await fetch('/api/download-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  });

  if (!response.ok) {
    throw new Error('Failed to download images');
  }

  const data = await response.json();
  return data.images;
}

/**
 * Converts Blob to base64 data URL
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Rewrites HTML image sources to local paths
 */
export function rewriteImagePaths(html: string, images: ImageAsset[]): string {
  let updatedHTML = html;

  images.forEach((img, index) => {
    updatedHTML = updatedHTML.replace(img.url, img.localPath);
  });

  return updatedHTML;
}

/**
 * Embeds images as base64 in HTML
 */
export function embedImagesAsBase64(html: string, images: ImageAsset[]): string {
  let updatedHTML = html;

  images.forEach((img) => {
    if (img.base64) {
      updatedHTML = updatedHTML.replace(img.url, img.base64);
    }
  });

  return updatedHTML;
}
```

#### 1.4 Create Server API for Image Downloads
**File**: `app/api/download-images/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json();

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'Invalid URLs array' },
        { status: 400 }
      );
    }

    // Limit to 10 images per request
    if (urls.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 images per request' },
        { status: 400 }
      );
    }

    const images = await Promise.all(
      urls.map(async (url, index) => {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'WeVibeCode-Export/1.0'
            }
          });

          if (!response.ok) {
            console.error(`Failed to fetch ${url}: ${response.status}`);
            return null;
          }

          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const dataUrl = `data:${blob.type};base64,${base64}`;

          return {
            url,
            localPath: `images/image-${index}.jpg`,
            base64: dataUrl,
            type: blob.type,
            size: blob.size,
          };
        } catch (error) {
          console.error(`Error downloading image ${url}:`, error);
          return null;
        }
      })
    );

    // Filter out failed downloads
    const successfulImages = images.filter(img => img !== null);

    return NextResponse.json({ images: successfulImages });
  } catch (error: any) {
    console.error('Download images error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Phase 2: HTML Exports (Days 3-5)

#### 2.1 HTML Exporter
**File**: `lib/export/htmlExporter.ts`

```typescript
import { saveAs } from 'file-saver';
import { downloadImages, extractImagesFromHTML, embedImagesAsBase64 } from './imageDownloader';

/**
 * Export as standard HTML (external images)
 */
export async function exportAsHTML(htmlContent: string, title: string): Promise<void> {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const filename = sanitizeFilename(title) + '.html';
  saveAs(blob, filename);
}

/**
 * Export as offline HTML (base64 embedded images)
 */
export async function exportAsOfflineHTML(
  htmlContent: string,
  title: string,
  onProgress?: (percent: number, status: string) => void
): Promise<void> {
  try {
    onProgress?.(10, 'Extracting images...');
    const imageUrls = extractImagesFromHTML(htmlContent);

    if (imageUrls.length === 0) {
      // No images, export as-is
      await exportAsHTML(htmlContent, title + '-offline');
      return;
    }

    onProgress?.(30, `Downloading ${imageUrls.length} images...`);
    const images = await downloadImages(imageUrls);

    onProgress?.(70, 'Embedding images...');
    const offlineHTML = embedImagesAsBase64(htmlContent, images);

    onProgress?.(90, 'Creating file...');
    const blob = new Blob([offlineHTML], { type: 'text/html;charset=utf-8' });
    const filename = sanitizeFilename(title) + '-offline.html';

    onProgress?.(100, 'Download starting...');
    saveAs(blob, filename);
  } catch (error) {
    console.error('Offline HTML export error:', error);
    throw new Error('Failed to create offline HTML');
  }
}

/**
 * Sanitize filename for safe downloads
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 100);
}
```

#### 2.2 Add Export Button to Preview
**File**: `components/Preview.tsx` (modify existing)

**Location**: After line 255 (in Action Buttons section)

```typescript
// Add import at top
import ExportMenu from './ExportMenu';

// Add in Action Buttons section (after Fullscreen button)
<ExportMenu previewId={previewId} />
```

### Phase 3: ZIP Export (Days 6-8)

#### 3.1 ZIP Exporter
**File**: `lib/export/zipExporter.ts`

```typescript
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  downloadImages,
  extractImagesFromHTML,
  rewriteImagePaths
} from './imageDownloader';

/**
 * Export as ZIP package with local images
 */
export async function exportAsZIP(
  htmlContent: string,
  title: string,
  onProgress?: (percent: number, status: string) => void
): Promise<void> {
  try {
    onProgress?.(5, 'Initializing...');
    const zip = new JSZip();

    onProgress?.(10, 'Extracting images...');
    const imageUrls = extractImagesFromHTML(htmlContent);

    let updatedHTML = htmlContent;

    if (imageUrls.length > 0) {
      onProgress?.(20, `Downloading ${imageUrls.length} images...`);
      const images = await downloadImages(imageUrls);

      onProgress?.(50, 'Adding images to package...');
      const imagesFolder = zip.folder('images');

      for (const img of images) {
        if (img.base64) {
          // Convert base64 back to binary
          const base64Data = img.base64.split(',')[1];
          imagesFolder?.file(
            img.localPath.replace('images/', ''),
            base64Data,
            { base64: true }
          );
        }
      }

      onProgress?.(70, 'Updating HTML references...');
      updatedHTML = rewriteImagePaths(htmlContent, images);
    }

    onProgress?.(80, 'Creating package...');

    // Add HTML file
    zip.file('index.html', updatedHTML);

    // Add README
    zip.file('README.txt', createReadme(title));

    // Add deployment instructions
    zip.file('DEPLOY.txt', createDeploymentGuide());

    onProgress?.(90, 'Generating ZIP...');

    // Generate ZIP
    const blob = await zip.generateAsync(
      { type: 'blob' },
      (metadata) => {
        const percent = 90 + (metadata.percent * 0.1);
        onProgress?.(percent, 'Finalizing...');
      }
    );

    const filename = sanitizeFilename(title) + '-website.zip';
    onProgress?.(100, 'Download starting...');
    saveAs(blob, filename);
  } catch (error) {
    console.error('ZIP export error:', error);
    throw new Error('Failed to create ZIP package');
  }
}

function createReadme(title: string): string {
  return `${title} - Website Package
${'='.repeat(title.length + 20)}

This package contains your generated website.

Contents:
- index.html: Your website (open this in a browser)
- images/: Image assets used in the website
- README.txt: This file
- DEPLOY.txt: Deployment instructions

To Use:
1. Extract this ZIP file
2. Open index.html in your web browser
3. Upload all files to your hosting service

Created with WeVibeCode.ai
https://www.wevibecode.ai
`;
}

function createDeploymentGuide(): string {
  return `Deployment Guide
================

Option 1: Netlify (Recommended)
- Drag and drop this folder to https://app.netlify.com/drop
- Your site will be live in seconds
- Free HTTPS and custom domain support

Option 2: Vercel
- Install Vercel CLI: npm install -g vercel
- Run: vercel --prod
- Follow the prompts

Option 3: GitHub Pages
- Create a new GitHub repository
- Upload these files
- Enable GitHub Pages in repository settings

Option 4: Traditional Hosting (cPanel, FTP)
- Upload all files to public_html or www folder
- Ensure index.html is in the root directory

For more help, visit: https://www.wevibecode.ai/docs/deployment
`;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 100);
}
```

#### 3.2 Export Menu Component
**File**: `components/ExportMenu.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Download, FileDown, Package, Cloud } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { exportAsHTML, exportAsOfflineHTML } from '@/lib/export/htmlExporter';
import { exportAsZIP } from '@/lib/export/zipExporter';
import { useToast } from './Toast';

interface ExportMenuProps {
  previewId: string;
}

export default function ExportMenu({ previewId }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, status: '' });
  const [showDeployment, setShowDeployment] = useState(false);
  const toast = useToast();

  const handleExport = async (format: 'html' | 'offline-html' | 'zip') => {
    try {
      setLoading(true);
      setIsOpen(false);

      // Fetch preview from Supabase
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('previews')
        .select('html_content, title')
        .eq('id', previewId)
        .single();

      if (error || !data) {
        throw new Error('Failed to fetch preview');
      }

      const updateProgress = (percent: number, status: string) => {
        setProgress({ percent, status });
      };

      switch (format) {
        case 'html':
          await exportAsHTML(data.html_content, data.title);
          toast.success('HTML file downloaded!');
          break;

        case 'offline-html':
          await exportAsOfflineHTML(data.html_content, data.title, updateProgress);
          toast.success('Offline HTML downloaded!');
          break;

        case 'zip':
          await exportAsZIP(data.html_content, data.title, updateProgress);
          toast.success('ZIP package downloaded!');
          break;
      }

      setProgress({ percent: 0, status: '' });
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
          title="Export website"
        >
          <Download className="w-4 h-4" />
          {loading ? progress.status || 'Exporting...' : 'Export'}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-600 uppercase">Export Options</p>
            </div>

            <button
              onClick={() => handleExport('html')}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-start gap-3"
            >
              <FileDown className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">HTML File</div>
                <div className="text-xs text-gray-500">
                  Single file with external images (fast)
                </div>
              </div>
            </button>

            <button
              onClick={() => handleExport('offline-html')}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-start gap-3"
            >
              <FileDown className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Offline HTML</div>
                <div className="text-xs text-gray-500">
                  Self-contained with embedded images
                </div>
              </div>
            </button>

            <button
              onClick={() => handleExport('zip')}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-start gap-3"
            >
              <Package className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">ZIP Package</div>
                <div className="text-xs text-gray-500">
                  Complete website folder ready to deploy
                </div>
              </div>
            </button>

            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowDeployment(true);
                }}
                className="w-full px-4 py-3 text-left hover:bg-indigo-50 transition flex items-start gap-3"
              >
                <Cloud className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">One-Click Deploy</div>
                  <div className="text-xs text-gray-500">
                    Deploy to Netlify, Vercel, or GitHub Pages
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress overlay */}
      {loading && progress.percent > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Exporting...</h3>
            <div className="mb-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600">{progress.status}</p>
          </div>
        </div>
      )}

      {/* Deployment Modal */}
      {showDeployment && (
        <DeploymentModal
          previewId={previewId}
          onClose={() => setShowDeployment(false)}
        />
      )}
    </>
  );
}
```

### Phase 4: One-Click Deployment (Days 9-12)

#### 4.1 Deployment Service
**File**: `lib/export/deploymentService.ts`

```typescript
import { DeploymentConfig, DeploymentResult } from '@/types/export';

/**
 * Deploy to Netlify
 */
export async function deployToNetlify(
  htmlContent: string,
  config: DeploymentConfig
): Promise<DeploymentResult> {
  try {
    const response = await fetch('/api/deploy/netlify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        htmlContent,
        siteName: config.siteName,
        apiToken: config.apiToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return {
      success: true,
      url: data.url,
      deploymentId: data.deploymentId,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Deploy to Vercel
 */
export async function deployToVercel(
  htmlContent: string,
  config: DeploymentConfig
): Promise<DeploymentResult> {
  try {
    const response = await fetch('/api/deploy/vercel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        htmlContent,
        projectName: config.siteName,
        apiToken: config.apiToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return {
      success: true,
      url: data.url,
      deploymentId: data.deploymentId,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Deploy to GitHub Pages
 */
export async function deployToGitHub(
  htmlContent: string,
  config: DeploymentConfig
): Promise<DeploymentResult> {
  try {
    const response = await fetch('/api/deploy/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        htmlContent,
        repoName: config.siteName,
        apiToken: config.apiToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return {
      success: true,
      url: data.url,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

#### 4.2 Netlify Deployment API
**File**: `app/api/deploy/netlify/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
  try {
    const { htmlContent, siteName, apiToken } = await request.json();

    // Create ZIP for deployment
    const zip = new JSZip();
    zip.file('index.html', htmlContent);

    const zipBlob = await zip.generateAsync({ type: 'nodebuffer' });

    // Deploy to Netlify
    const deployResponse = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/zip',
      },
      body: zipBlob,
    });

    if (!deployResponse.ok) {
      const error = await deployResponse.text();
      return NextResponse.json(
        { error: `Netlify deployment failed: ${error}` },
        { status: deployResponse.status }
      );
    }

    const site = await deployResponse.json();

    return NextResponse.json({
      success: true,
      url: site.url || site.ssl_url,
      deploymentId: site.id,
    });
  } catch (error: any) {
    console.error('Netlify deployment error:', error);
    return NextResponse.json(
      { error: error.message || 'Deployment failed' },
      { status: 500 }
    );
  }
}
```

#### 4.3 Deployment Modal
**File**: `components/DeploymentModal.tsx`

```typescript
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { deployToNetlify, deployToVercel, deployToGitHub } from '@/lib/export/deploymentService';
import { useToast } from './Toast';

interface DeploymentModalProps {
  previewId: string;
  onClose: () => void;
}

export default function DeploymentModal({ previewId, onClose }: DeploymentModalProps) {
  const [platform, setPlatform] = useState<'netlify' | 'vercel' | 'github'>('netlify');
  const [siteName, setSiteName] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState('');
  const toast = useToast();

  const handleDeploy = async () => {
    if (!siteName || !apiToken) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setDeploying(true);

      // Fetch HTML
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('previews')
        .select('html_content')
        .eq('id', previewId)
        .single();

      if (error || !data) {
        throw new Error('Failed to fetch preview');
      }

      // Deploy based on platform
      let result;
      switch (platform) {
        case 'netlify':
          result = await deployToNetlify(data.html_content, { platform, siteName, apiToken });
          break;
        case 'vercel':
          result = await deployToVercel(data.html_content, { platform, siteName, apiToken });
          break;
        case 'github':
          result = await deployToGitHub(data.html_content, { platform, siteName, apiToken });
          break;
      }

      if (result.success && result.url) {
        setDeployedUrl(result.url);
        toast.success('Deployment successful!');
      } else {
        throw new Error(result.error || 'Deployment failed');
      }
    } catch (error: any) {
      console.error('Deployment error:', error);
      toast.error(error.message || 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Deploy Website</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {deployedUrl ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-lg font-bold mb-2">Deployment Successful!</h3>
            <p className="text-gray-600 mb-4">Your website is live at:</p>
            <a
              href={deployedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 font-medium break-all"
            >
              {deployedUrl}
            </a>
            <button
              onClick={onClose}
              className="mt-6 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Platform</label>
              <div className="grid grid-cols-3 gap-2">
                {['netlify', 'vercel', 'github'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p as any)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      platform === p
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Site Name</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="my-awesome-site"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">API Token</label>
              <input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder={`Your ${platform} API token`}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your token from {platform === 'netlify' ? 'netlify.com' : platform === 'vercel' ? 'vercel.com' : 'github.com'}/settings
              </p>
            </div>

            <button
              onClick={handleDeploy}
              disabled={deploying}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {deploying ? 'Deploying...' : 'Deploy Now'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

## Critical Files Summary

### Core Implementation Files (Priority Order)
1. **lib/export/imageDownloader.ts** - Image handling (most critical)
2. **app/api/download-images/route.ts** - CORS bypass for images
3. **lib/export/htmlExporter.ts** - HTML export logic
4. **lib/export/zipExporter.ts** - ZIP generation
5. **components/ExportMenu.tsx** - Main UI component
6. **lib/export/deploymentService.ts** - Deployment logic
7. **components/DeploymentModal.tsx** - Deployment UI
8. **app/api/deploy/netlify/route.ts** - Netlify API

### Modified Files
1. **components/Preview.tsx** - Add `<ExportMenu />` at line 255
2. **package.json** - Add jszip, file-saver dependencies

## Testing & Verification

### Phase 1: Manual Testing Checklist
- [ ] Export HTML: Download and open in browser
- [ ] Export Offline HTML: Disconnect WiFi, verify images load
- [ ] Export ZIP: Extract, verify folder structure
- [ ] ZIP images: Check images/ folder has downloads
- [ ] Deploy to Netlify: Verify live URL works
- [ ] Deploy to Vercel: Verify deployment succeeds
- [ ] Deploy to GitHub: Verify Pages site is live

### Phase 2: Edge Cases
- [ ] Large files (>5MB HTML): Progress indicator shows
- [ ] 404 images: Graceful handling, skip failed downloads
- [ ] Slow network: Timeout after 60s with error message
- [ ] Invalid API tokens: Clear error message
- [ ] Special characters in filename: Sanitization works

### Phase 3: Performance
- [ ] ZIP generation < 10s for 3 images
- [ ] Progress indicator updates smoothly
- [ ] No memory leaks during export
- [ ] Downloads work on mobile (iOS/Android)

## Implementation Timeline

### Week 1: Core Export Features
- **Days 1-2**: Foundation (dependencies, types, image downloader, API)
- **Days 3-5**: HTML exports (standard + offline with base64)
- **Days 6-8**: ZIP export with local images folder

### Week 2: Deployment Integration
- **Days 9-10**: Netlify deployment API + UI
- **Days 11-12**: Vercel + GitHub Pages deployment
- **Days 13-14**: Testing, bug fixes, documentation

## Deployment Checklist

### Before Deploying
- [ ] All dependencies installed: `npm install`
- [ ] TypeScript compiles: `npm run build`
- [ ] Environment variables set (if needed)
- [ ] Analytics tracking added for export events
- [ ] Error logging configured

### After Deploying
- [ ] Test each export format on production
- [ ] Verify CORS for image downloads
- [ ] Check deployment APIs work with real tokens
- [ ] Monitor error logs for first week
- [ ] Collect user feedback

## Success Metrics

Track these in analytics:
- Export button clicks
- Export format distribution (HTML vs ZIP vs Offline)
- Deployment usage by platform
- Export completion rate
- Average export time
- Error rate by export type

## Next Steps (Future Enhancements)

1. **Code Editor** (Phase 2)
   - Monaco or lightweight alternative
   - Edit before export
   - Syntax validation

2. **Custom Domains** (Phase 2)
   - Connect custom domains to deployments
   - DNS configuration helpers

3. **FTP Upload** (Phase 3)
   - Direct FTP deployment
   - Traditional hosting support

4. **Export History** (Phase 3)
   - Track all exports
   - Re-download previous exports
   - Analytics dashboard
