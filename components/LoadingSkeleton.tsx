// components/LoadingSkeleton.tsx
// Reusable loading skeleton components for better UX

'use client';

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 animate-pulse">
      <div className="w-16 h-16 bg-gray-200 rounded-2xl mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
      <div className="h-10 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <div className="h-10 w-64 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-6 w-80 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <CardSkeleton />
          <CardSkeleton />
          <div className="grid grid-rows-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function GeneratePageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Skeleton */}
        <div className="text-center mb-12">
          <div className="w-48 h-12 bg-white/80 rounded-full mx-auto mb-6 animate-pulse"></div>
          <div className="h-12 w-96 bg-white/60 rounded mx-auto mb-4 animate-pulse"></div>
          <div className="h-6 w-80 bg-white/50 rounded mx-auto animate-pulse"></div>
        </div>

        {/* Form Sections Skeleton */}
        <div className="space-y-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-100 animate-pulse">
              <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-24 bg-gray-100 rounded-lg"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PreviewSkeleton() {
  return (
    <div className="w-full h-[calc(100vh-100px)] bg-gray-100 flex flex-col">
      {/* Controls Skeleton */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-center gap-4">
        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>

      {/* Preview Skeleton */}
      <div className="flex-1 flex items-start justify-center overflow-auto p-6">
        <div className="bg-white shadow-2xl rounded-lg w-full h-full animate-pulse">
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
              <div className="h-4 w-32 bg-gray-300 rounded mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow border border-gray-200 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="w-24 h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
