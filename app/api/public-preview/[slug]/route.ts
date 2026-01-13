// app/api/public-preview/[slug]/route.ts
// Serve published sites publicly via slug

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const { slug } = params;

    if (!slug) {
      return new NextResponse('Slug is required', { status: 400 });
    }

    // Create Supabase client (no auth required for public access)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => {
            return request.cookies.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }));
          },
          setAll: () => {},
        },
      }
    );

    // Fetch published preview by slug
    const { data: preview, error } = await supabase
      .from('previews')
      .select('html_content, title, slug, is_published')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching preview:', error);
      return new NextResponse('Internal server error', { status: 500 });
    }

    if (!preview) {
      return new NextResponse('Site not found or not published', { status: 404 });
    }

    // Return HTML with proper headers
    return new NextResponse(preview.html_content, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
        'X-Robots-Tag': 'index, follow', // Allow search engines
      },
    });

  } catch (error: any) {
    console.error('Public preview error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// Configure runtime and caching
export const runtime = 'edge'; // Use edge runtime for better performance
export const revalidate = 3600; // Revalidate every hour
