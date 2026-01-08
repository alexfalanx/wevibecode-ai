'use client';

import React from 'react';
import { Store, Zap, Sparkles, LogOut, Plus, FolderOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const credits = 10; // This should come from Supabase
  const totalProjects = 0; // This should come from Supabase
  const currentPlan = 'free';

  const handleLogout = () => {
    // Add your logout logic here
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-700 to-pink-700 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                WeVibeCode
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-lg">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-indigo-900">{credits} credits</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            Welcome back! 👋
          </h1>
          <p className="text-xl text-gray-600">
            You have <span className="font-bold text-indigo-600">{credits} credits</span> remaining.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Create Website Card */}
          <button
            onClick={() => router.push('/dashboard/create-website')}
            className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-white hover:shadow-2xl transition transform hover:scale-105 text-left group"
          >
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Create Website</h3>
            <p className="text-white/90 mb-4">Build a professional website in seconds</p>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span>Get Started</span>
              <Plus className="w-4 h-4" />
            </div>
          </button>

          {/* Create Simple App Card */}
          <button
            onClick={() => router.push('/dashboard/create-app')}
            className="bg-gradient-to-br from-pink-600 to-purple-600 rounded-2xl p-8 text-white hover:shadow-2xl transition transform hover:scale-105 text-left group"
          >
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Create Simple App</h3>
            <p className="text-white/90 mb-4">Booking, directory, calculator & more</p>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span>Get Started</span>
              <Plus className="w-4 h-4" />
            </div>
          </button>

          {/* Stats Card */}
          <div className="grid grid-rows-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <div className="text-center">
                <div className="text-5xl mb-2">📁</div>
                <div className="text-3xl font-bold text-gray-900">{totalProjects}</div>
                <div className="text-gray-600 font-medium">Total Projects</div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <div className="text-center">
                <div className="text-5xl mb-2">✨</div>
                <div className="text-3xl font-bold text-gray-900">{currentPlan}</div>
                <div className="text-gray-600 font-medium">Current Plan</div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Projects</h2>
          
          {totalProjects === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6">
                <FolderOpen className="w-full h-full text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first website or app to get started!
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/dashboard/create-website')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
                >
                  Create Website
                </button>
                <button
                  onClick={() => router.push('/dashboard/create-app')}
                  className="px-6 py-3 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition"
                >
                  Create Simple App
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Project cards will go here */}
              <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-indigo-400 transition cursor-pointer">
                <div className="text-2xl mb-3">🌐</div>
                <h3 className="font-bold text-gray-900 mb-1">My Restaurant Site</h3>
                <p className="text-sm text-gray-600 mb-4">Website • Created 2 days ago</p>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition">
                    Edit
                  </button>
                  <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">
                    View
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-100">
          <h3 className="text-lg font-bold text-gray-900 mb-3">💡 Quick Tips</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span><strong>Websites cost 1 credit</strong> - Perfect for restaurants, gyms, portfolios</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-600 font-bold">•</span>
              <span><strong>Simple Apps cost 1 credit</strong> - Great for booking, directories, calculators</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">•</span>
              <span><strong>Edit anytime for free</strong> - No extra credits needed for updates</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}