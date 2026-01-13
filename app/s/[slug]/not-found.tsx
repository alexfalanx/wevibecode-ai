// app/s/[slug]/not-found.tsx
// 404 page for published sites that don't exist

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Not Found</h1>
        <p className="text-gray-600 mb-6">
          This site doesn't exist or hasn't been published yet.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          Go to WeVibeCode AI
        </a>
      </div>
    </div>
  );
}
