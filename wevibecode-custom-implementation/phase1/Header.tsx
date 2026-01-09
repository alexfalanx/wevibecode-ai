// components/Header.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const t = useTranslations();
  const { user, loading } = useAuth();
  const pathname = usePathname();
  
  // Extract locale from pathname (e.g., /en/dashboard -> en)
  const locale = pathname.split('/')[1] || 'en';

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href={`/${locale}`} className="text-2xl font-bold text-blue-600">
          WeVibeCode.ai
        </Link>
        
        <div className="flex gap-4 items-center">
          {!loading && (
            <>
              {user ? (
                // Logged in - show dashboard link
                <Link 
                  href={`/${locale}/dashboard`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('dashboard')}
                </Link>
              ) : (
                // Not logged in - show login/signup buttons
                <>
                  <Link 
                    href={`/${locale}/auth/login`}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    {t('login')}
                  </Link>
                  <Link 
                    href={`/${locale}/auth/signup`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('signup')}
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
