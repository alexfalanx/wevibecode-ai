# Install Preview Page - Complete Setup

Write-Host "📦 Installing Preview Page..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Create directory structure
Write-Host "Step 1: Creating directory structure..." -ForegroundColor Yellow
$previewDir = "app\dashboard\preview\[id]"

if (!(Test-Path $previewDir)) {
    New-Item -ItemType Directory -Path $previewDir -Force | Out-Null
    Write-Host "  ✅ Created: $previewDir" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  Directory already exists: $previewDir" -ForegroundColor Cyan
}

# Step 2: Create the page.tsx file directly
Write-Host ""
Write-Host "Step 2: Creating page.tsx file..." -ForegroundColor Yellow

$pageContent = @'
// app/dashboard/preview/[id]/page.tsx
'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Preview from '@/components/Preview';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PreviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreview();
  }, [resolvedParams.id]);

  const loadPreview = async () => {
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

      const { data, error: fetchError } = await supabase
        .from('previews')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Preview not found');

      setPreview(data);
    } catch (err: any) {
      console.error('Preview load error:', err);
      setError(err.message || 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Preview Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/history')}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to History</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{preview.title}</h1>
                <p className="text-sm text-gray-500">
                  {preview.generation_type && `${preview.generation_type.charAt(0).toUpperCase() + preview.generation_type.slice(1)} • `}
                  {new Date(preview.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Component */}
      <Preview previewId={preview.id} />
    </div>
  );
}
'@

$targetFile = "$previewDir\page.tsx"
$pageContent | Out-File -FilePath $targetFile -Encoding UTF8 -Force

if (Test-Path $targetFile) {
    Write-Host "  ✅ Created: $targetFile" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to create file!" -ForegroundColor Red
    exit 1
}

# Step 3: Verify
Write-Host ""
Write-Host "Step 3: Verification..." -ForegroundColor Yellow

$fileSize = (Get-Item $targetFile).Length
Write-Host "  📄 File size: $fileSize bytes" -ForegroundColor Cyan

if ($fileSize -gt 100) {
    Write-Host "  ✅ File created successfully!" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  File might be empty or incomplete" -ForegroundColor Yellow
}

# Step 4: Show structure
Write-Host ""
Write-Host "Step 4: Final directory structure:" -ForegroundColor Yellow
Get-ChildItem "app\dashboard\preview" -Recurse | ForEach-Object {
    $indent = "  " * (($_.FullName.Split('\').Count) - (Get-Location).Path.Split('\').Count - 3)
    if ($_.PSIsContainer) {
        Write-Host "$indent📁 $($_.Name)" -ForegroundColor Cyan
    } else {
        Write-Host "$indent📄 $($_.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npm run build" -ForegroundColor White
Write-Host "  2. If successful, run: vercel --prod" -ForegroundColor White
Write-Host ""
