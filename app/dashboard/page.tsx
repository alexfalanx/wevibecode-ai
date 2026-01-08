'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Profile {
  email: string;
  full_name: string | null;
  credits_remaining: number;
  subscription_tier: string;
}

interface Project {
  id: string;
  title: string;
  vibe_theme: string;
  status: string;
  created_at: string;
  deploy_url: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();

      if (!response.ok) {
        router.push('/login');
        return;
      }

      setProfile(data.profile);
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Dashboard error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const getVibeEmoji = (theme: string) => {
    const emojis: Record<string, string> = {
      cyberpunk: '🌃',
      cozy: '☕',
      brutalist: '⬛',
      retro: '🌊',
      corporate: '💼',
    };
    return emojis[theme] || '🎨';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      generating: 'bg-yellow-100 text-yellow-700',
      ready: 'bg-green-100 text-green-700',
      deployed: 'bg-blue-100 text-blue-700',
      failed: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-indigo-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                WeVibeCode
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-lg">
                <span className="text-sm font-semibold text-indigo-900">
                  ⚡ {profile?.credits_remaining} credits
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}! 👋
          </h1>
          <p className="text-gray-600">
            You have <span className="font-semibold text-indigo-600">{profile?.credits_remaining} credits</span> remaining.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <button
            onClick={() => router.push('/generate')}
            className="p-6 bg-gradient-to-br from-indigo-600 to-pink-600 text-white rounded-2xl hover:shadow-2xl hover:scale-105 transition-all flex flex-col items-center text-center group"
          >
            <div className="text-4xl mb-4">➕</div>
            <h3 className="text-xl font-bold mb-2">Generate New App</h3>
            <p className="text-sm opacity-90">Start building with AI in seconds</p>
          </button>

          <div className="p-6 bg-white rounded-2xl border-2 border-gray-200 flex flex-col items-center text-center">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">{projects.length}</h3>
            <p className="text-sm text-gray-600">Total Projects</p>
          </div>

          <div className="p-6 bg-white rounded-2xl border-2 border-gray-200 flex flex-col items-center text-center">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">{profile?.subscription_tier}</h3>
            <p className="text-sm text-gray-600">Current Plan</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Projects</h2>

          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-6">Create your first AI-generated app to get started!</p>
              <button
                onClick={() => router.push('/generate')}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
              >
                ➕ Generate Your First App
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="text-5xl mb-4">
                    {getVibeEmoji(project.vibe_theme)}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {project.title}
                  </h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <div className="text-xs text-gray-500">
                    🕐 {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}