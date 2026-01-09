// middleware.ts (Phase 2 - With locale persistence)
import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

const locales = ['en', 'it', 'pl', 'es', 'de'];
const defaultLocale = 'en';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    /\.(.*)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Determine preferred locale
  let preferredLocale = defaultLocale;

  try {
    // Priority 1: User's saved preference in database (for logged-in users)
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.preferred_language && locales.includes(profile.preferred_language)) {
        preferredLocale = profile.preferred_language;
      }
    }

    // Priority 2: Cookie (for guests or fallback)
    if (preferredLocale === defaultLocale) {
      const cookieLocale = request.cookies.get('preferred_locale')?.value;
      if (cookieLocale && locales.includes(cookieLocale)) {
        preferredLocale = cookieLocale;
      }
    }

    // Priority 3: Browser Accept-Language header
    if (preferredLocale === defaultLocale) {
      const acceptLanguage = request.headers.get('accept-language');
      if (acceptLanguage) {
        const browserLocales = acceptLanguage
          .split(',')
          .map(lang => lang.split(';')[0].trim().split('-')[0]);
        
        const matchedLocale = browserLocales.find(lang => locales.includes(lang));
        if (matchedLocale) {
          preferredLocale = matchedLocale;
        }
      }
    }
  } catch (error) {
    console.error('Error determining locale:', error);
    // Fall back to default locale on error
  }

  // Redirect to locale-prefixed path
  const redirectUrl = new URL(`/${preferredLocale}${pathname}`, request.url);
  redirectUrl.search = request.nextUrl.search;
  
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
