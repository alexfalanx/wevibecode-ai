// app/api/generate-website/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, websiteType, colorScheme } = body;

    if (!prompt || !websiteType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client
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

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (profile.credits_remaining < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    // Build the system prompt based on website type
    const systemPrompt = buildSystemPrompt(websiteType, colorScheme);

    // Call OpenAI GPT-4
    console.log('Calling OpenAI GPT-4...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const generatedCode = completion.choices[0].message.content;

    if (!generatedCode) {
      return NextResponse.json(
        { error: 'Failed to generate website' },
        { status: 500 }
      );
    }

    // Parse the generated code to extract HTML, CSS, and JS
    const { html, css, js } = parseGeneratedCode(generatedCode);

    // Create preview in database
    const { data: preview, error: previewError } = await supabase
      .from('previews')
      .insert({
        user_id: user.id,
        title: prompt.substring(0, 100),
        html_content: html,
        css_content: css,
        js_content: js,
        preview_type: 'website',
        generation_prompt: prompt,
        generation_type: websiteType,
        credits_used: 1,
      })
      .select()
      .single();

    if (previewError || !preview) {
      console.error('Error creating preview:', previewError);
      return NextResponse.json(
        { error: 'Failed to save generated website' },
        { status: 500 }
      );
    }

    // Deduct credit
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits_remaining: profile.credits_remaining - 1 })
      .eq('id', user.id);

    if (creditError) {
      console.error('Error deducting credit:', creditError);
    }

    // Log credit usage
    await supabase.from('credits_log').insert({
      user_id: user.id,
      credits_used: 1,
      action: 'generate_website',
      details: { preview_id: preview.id, prompt: prompt.substring(0, 100) },
    });

    console.log('Website generated successfully:', preview.id);

    return NextResponse.json({
      success: true,
      previewId: preview.id,
      creditsRemaining: profile.credits_remaining - 1,
    });

  } catch (error: any) {
    console.error('Website generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(websiteType: string, colorScheme?: string): string {
  const basePrompt = `You are an expert web developer. Generate a complete, professional, modern website with HTML, CSS, and JavaScript.

CRITICAL REQUIREMENTS:
1. Output ONLY the code wrapped in markdown code blocks
2. Use this exact format:

\`\`\`html
<!-- HTML code here -->
\`\`\`

\`\`\`css
/* CSS code here */
\`\`\`

\`\`\`javascript
// JavaScript code here (optional)
\`\`\`

3. Create a COMPLETE, production-ready website
4. Use modern, clean design with proper spacing
5. Make it fully responsive (mobile, tablet, desktop)
6. Use semantic HTML5
7. Include smooth animations and transitions
8. Add interactive elements where appropriate
9. Use professional typography (system fonts)
10. Ensure accessibility (ARIA labels, alt text)

DESIGN GUIDELINES:
- Modern, minimalist aesthetic
- Professional color scheme${colorScheme ? `: ${colorScheme}` : ''}
- Proper whitespace and padding
- Clear visual hierarchy
- Smooth hover effects
- Mobile-first responsive design
- Fast loading (no external dependencies)

`;

  const typeSpecific: Record<string, string> = {
    landing: `
TYPE: Landing Page
Create a conversion-focused landing page with:
- Hero section with compelling headline and CTA
- Features/benefits section (3-4 items)
- Social proof or testimonials
- Final CTA section
- Sticky navigation
`,
    portfolio: `
TYPE: Portfolio Website
Create a personal portfolio with:
- Hero/about section
- Project showcase grid (3-6 projects)
- Skills section
- Contact form or contact info
- Smooth scroll navigation
`,
    business: `
TYPE: Business Website
Create a professional business site with:
- Hero with business value proposition
- Services section (3-4 services)
- About/team section
- Contact section with form
- Professional, trustworthy design
`,
    restaurant: `
TYPE: Restaurant Website
Create an appetizing restaurant site with:
- Hero with food imagery styling
- Menu highlights section
- Location and hours
- Reservation/contact section
- Warm, inviting color scheme
`,
    blog: `
TYPE: Blog/Content Website
Create a clean blog layout with:
- Header with site title and navigation
- Featured post section
- Grid of blog post cards (6-9 posts)
- Sidebar with categories
- Clean, readable typography
`,
    ecommerce: `
TYPE: E-commerce Product Page
Create a product showcase with:
- Product hero with image gallery
- Product details and pricing
- Features/specifications grid
- Add to cart CTA
- Related products section
`,
  };

  return basePrompt + (typeSpecific[websiteType] || typeSpecific.landing);
}

function parseGeneratedCode(generatedCode: string): { html: string; css: string; js: string } {
  let html = '';
  let css = '';
  let js = '';

  // Extract HTML
  const htmlMatch = generatedCode.match(/```html\n([\s\S]*?)```/);
  if (htmlMatch) {
    html = htmlMatch[1].trim();
  }

  // Extract CSS
  const cssMatch = generatedCode.match(/```css\n([\s\S]*?)```/);
  if (cssMatch) {
    css = cssMatch[1].trim();
  }

  // Extract JavaScript
  const jsMatch = generatedCode.match(/```javascript\n([\s\S]*?)```/);
  if (jsMatch) {
    js = jsMatch[1].trim();
  }

  // If no code blocks found, try to extract from the raw output
  if (!html && generatedCode.includes('<html')) {
    html = generatedCode;
  }

  return { html, css, js };
}
