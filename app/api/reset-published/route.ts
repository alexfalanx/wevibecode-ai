// app/api/reset-published/route.ts
// Utility endpoint to unpublish all sites for a user

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
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

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Unpublish all sites for this user
    const { error: updateError, count } = await supabase
      .from('previews')
      .update({
        is_published: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('is_published', true);

    if (updateError) {
      console.error('Error unpublishing sites:', updateError);
      return NextResponse.json(
        { error: 'Failed to unpublish sites' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully unpublished all sites`,
      count: count || 0,
    });

  } catch (error: any) {
    console.error('Reset published sites error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
