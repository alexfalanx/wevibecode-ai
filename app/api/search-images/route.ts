// app/api/search-images/route.ts
// API endpoint to search for stock images using Pexels
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, perPage = 9 } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }

    // Create Supabase client for auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {},
          remove(name: string, options: any) {},
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check Pexels API key
    if (!PEXELS_API_KEY || PEXELS_API_KEY === 'demo') {
      return NextResponse.json(
        { error: 'Pexels API not configured' },
        { status: 500 }
      );
    }

    console.log(`🔍 Searching Pexels for: "${query}"`);

    // Search Pexels API
    const apiUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform Pexels response to our format
    const images = data.photos?.map((photo: any) => ({
      id: photo.id.toString(),
      url: photo.src.large2x, // High quality image
      thumbnail: photo.src.medium, // Smaller for preview
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      alt: photo.alt || query,
    })) || [];

    console.log(`✅ Found ${images.length} images for "${query}"`);

    return NextResponse.json({
      success: true,
      images,
      query,
    });

  } catch (error: any) {
    console.error('❌ Image search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search images' },
      { status: 500 }
    );
  }
}
