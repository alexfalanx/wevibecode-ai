// app/api/publish-site/route.ts
// Handle subdomain and custom domain publishing

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
  createUniqueSlug,
  validateSlug,
  validateDomain,
  generatePublishedUrl,
} from '@/lib/publish';
import type { PublishOptions } from '@/types/publish';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: PublishOptions = await request.json();
    const { previewId, publishType, customDomain, slug: customSlug } = body;

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

    // Get preview and verify ownership
    const { data: preview, error: previewError } = await supabase
      .from('previews')
      .select('*')
      .eq('id', previewId)
      .single();

    if (previewError || !preview || preview.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Preview not found or access denied' },
        { status: 404 }
      );
    }

    // Check user credits (optional: implement publish limits)
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_remaining, subscription_tier')
      .eq('id', user.id)
      .single();

    // Soft cap: Free users can publish max 5 sites
    if (profile?.subscription_tier === 'free') {
      const { count } = await supabase
        .from('previews')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_published', true);

      if (count && count >= 5) {
        return NextResponse.json(
          { error: 'Free users can publish up to 5 sites. Upgrade for unlimited publishing.' },
          { status: 403 }
        );
      }
    }

    let finalSlug: string;
    let finalPublishedUrl: string;
    let finalCustomDomain: string | null = null;

    if (publishType === 'subdomain') {
      // Generate or validate slug
      if (customSlug) {
        const slugValidation = validateSlug(customSlug);
        if (!slugValidation.valid) {
          return NextResponse.json(
            { error: slugValidation.error },
            { status: 400 }
          );
        }

        // Check if slug is already taken
        const { data: existingSlug } = await supabase
          .from('previews')
          .select('id')
          .eq('slug', customSlug)
          .neq('id', previewId)
          .maybeSingle();

        if (existingSlug) {
          return NextResponse.json(
            { error: 'This slug is already taken. Please choose another.' },
            { status: 400 }
          );
        }

        finalSlug = customSlug;
      } else {
        // Auto-generate unique slug from title
        finalSlug = createUniqueSlug(preview.title || 'site');

        // Ensure uniqueness
        let attempts = 0;
        while (attempts < 5) {
          const { data: existingSlug } = await supabase
            .from('previews')
            .select('id')
            .eq('slug', finalSlug)
            .maybeSingle();

          if (!existingSlug) break;

          finalSlug = createUniqueSlug(preview.title || 'site');
          attempts++;
        }
      }

      // Generate URL using request origin for localhost support
      const origin = request.headers.get('origin') || request.headers.get('host') || process.env.NEXT_PUBLIC_BASE_URL || 'https://wevibecode.ai';
      const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;
      finalPublishedUrl = generatePublishedUrl(finalSlug, baseUrl);

    } else if (publishType === 'custom') {
      // Validate custom domain
      if (!customDomain) {
        return NextResponse.json(
          { error: 'Custom domain is required' },
          { status: 400 }
        );
      }

      const domainValidation = validateDomain(customDomain);
      if (!domainValidation.valid) {
        return NextResponse.json(
          { error: domainValidation.error },
          { status: 400 }
        );
      }

      // Check if domain is already used
      const { data: existingDomain } = await supabase
        .from('previews')
        .select('id')
        .eq('custom_domain', customDomain)
        .neq('id', previewId)
        .maybeSingle();

      if (existingDomain) {
        return NextResponse.json(
          { error: 'This domain is already in use' },
          { status: 400 }
        );
      }

      finalSlug = preview.slug || createUniqueSlug(preview.title || 'site');
      finalCustomDomain = customDomain;
      finalPublishedUrl = `https://${customDomain}`;
    } else {
      return NextResponse.json(
        { error: 'Invalid publish type' },
        { status: 400 }
      );
    }

    // Update preview with publishing info
    const { data: updatedPreview, error: updateError } = await supabase
      .from('previews')
      .update({
        slug: finalSlug,
        custom_domain: finalCustomDomain,
        published_url: finalPublishedUrl,
        is_published: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', previewId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating preview:', updateError);
      return NextResponse.json(
        { error: 'Failed to publish site' },
        { status: 500 }
      );
    }

    // Log the publish action
    await supabase.from('credits_log').insert({
      user_id: user.id,
      credits_used: 0, // Publishing is free for now
      action: 'publish_site',
      details: {
        preview_id: previewId,
        publish_type: publishType,
        slug: finalSlug,
        custom_domain: finalCustomDomain,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedPreview.id,
        slug: updatedPreview.slug,
        custom_domain: updatedPreview.custom_domain,
        published_url: updatedPreview.published_url,
        is_published: updatedPreview.is_published,
      },
    });

  } catch (error: any) {
    console.error('Publish site error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Unpublish a site
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const previewId = searchParams.get('previewId');

    if (!previewId) {
      return NextResponse.json(
        { error: 'Preview ID is required' },
        { status: 400 }
      );
    }

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

    // Verify ownership
    const { data: preview } = await supabase
      .from('previews')
      .select('user_id')
      .eq('id', previewId)
      .single();

    if (!preview || preview.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Preview not found or access denied' },
        { status: 404 }
      );
    }

    // Unpublish
    const { error: updateError } = await supabase
      .from('previews')
      .update({
        is_published: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', previewId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to unpublish site' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Unpublish site error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
