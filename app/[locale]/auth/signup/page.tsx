'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createBrowserClient } from '@supabase/ssr';  // ← NEW CORRECT IMPORT

export default function SignupPage({ params }: { params: { locale: string } }) {
  const t = useTranslations();
  const router = useRouter();

  // Create Supabase client for browser/client-side
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('Starting signup process for:', email);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/${params.locale}/auth/callback`,
          data: {
            preferred_language: params.locale || 'en',
          },
        },
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        setError(t(`errors.${signUpError.message}`) || signUpError.message);
        setLoading(false);
        return;
      }

      console.log('Signup successful:', data);

      // Check if email confirmation is required
      if (data.user && !data.session) {
        setMessage(t('auth.confirmEmailSent'));
      } else if (data.session) {
        // Auto-logged in (when confirmation is disabled)
        setMessage(t('auth.signupSuccess'));

        // Small delay to allow profile trigger to run
        setTimeout(() => {
          router.push(`/${params.locale}/dashboard`);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setError(err.message || t('errors.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6">
          {t('auth.signup')}
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('auth.loading') : t('auth.signup')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t('auth.alreadyHaveAccount')}{' '}
          <a href={`/${params.locale}/auth/login`} className="text-blue-600 hover:underline">
            {t('auth.login')}
          </a>
        </p>
      </div>
    </div>
  );
}