// app/api/preview/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 16 - params is now a Promise
    const params = await context.params;
    const previewId = params.id;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Not needed for GET requests
          },
          remove(name: string, options: any) {
            // Not needed for GET requests
          },
        },
      }
    );

    // Fetch preview from database
    const { data: preview, error } = await supabase
      .from('previews')
      .select('html_content, css_content, js_content')
      .eq('id', previewId)
      .single();

    if (error || !preview) {
      console.error('Preview fetch error:', error);
      return new NextResponse('Preview not found', { status: 404 });
    }

    // Construct full HTML document
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
    }
    ${preview.css_content || ''}
  </style>
</head>
<body>
  ${preview.html_content}
  <script>
    ${preview.js_content || ''}
  </script>
</body>
</html>
    `.trim();

    // Return HTML with proper headers
    return new NextResponse(fullHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'SAMEORIGIN',
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src * data:; font-src *;",
      },
    });
  } catch (error) {
    console.error('Preview API error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
