// middleware.ts
// Phase 2 - Language Persistence with new Supabase SSR
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const locales = ['en', 'it', 'pl', 'es', 'de'];
const defaultLocale = 'en';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // files with extensions
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

  // Determine user's preferred locale
  let locale = defaultLocale;

  // Create Supabase client for middleware
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Priority 1: Check if user is logged in and has preferred language in database
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferred_language')
      .eq('id', user.id)
      .single();

    if (profile?.preferred_language && locales.includes(profile.preferred_language)) {
      locale = profile.preferred_language;
    }
  }

  // Priority 2: Check cookie for preferred locale
  if (locale === defaultLocale) {
    const cookieLocale = request.cookies.get('preferred_locale')?.value;
    if (cookieLocale && locales.includes(cookieLocale)) {
      locale = cookieLocale;
    }
  }

  // Priority 3: Check Accept-Language header
  if (locale === defaultLocale) {
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
      const browserLocale = acceptLanguage.split(',')[0].split('-')[0];
      if (locales.includes(browserLocale)) {
        locale = browserLocale;
      }
    }
  }

  // Redirect to localized path
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  
  // Preserve query parameters
  newUrl.search = request.nextUrl.search;

  return NextResponse.redirect(newUrl);
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
