// app/s/[slug]/page.tsx
// Public page for viewing published sites

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublishedSitePage({ params }: PageProps) {
  const { slug } = await params;

  // Create Supabase client (no auth required for public access)
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component, can't set cookies
          }
        },
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

  if (error || !preview) {
    notFound();
  }

  // Return raw HTML
  return (
    <div
      dangerouslySetInnerHTML={{ __html: preview.html_content }}
      style={{ width: '100%', height: '100vh' }}
    />
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: preview } = await supabase
    .from('previews')
    .select('title, slug')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  return {
    title: preview?.title || 'Published Site',
    description: `View ${preview?.title || 'this site'} created with WeVibeCode AI`,
  };
}

// Enable static generation for published sites
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour
