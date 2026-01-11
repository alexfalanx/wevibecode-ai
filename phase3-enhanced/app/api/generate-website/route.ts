// app/api/generate-website/route.ts
// ULTIMATE VERSION - Visual Styles + AI Images + Enhanced Generation
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// VISUAL STYLE PROFILES - Complete design systems
const VISUAL_STYLES = {
  'bold-modern': {
    name: 'Bold & Modern',
    fonts: {
      heading: 'Montserrat',
      body: 'Inter',
      headingWeight: '800',
      bodyWeight: '400'
    },
    typography: {
      h1Size: '72px',
      h2Size: '48px',
      h3Size: '32px',
      bodySize: '18px',
      lineHeight: '1.4',
      letterSpacing: '-0.02em',
      textTransform: 'uppercase' // For headlines
    },
    effects: {
      borderRadius: '4px',
      shadowStyle: '0 20px 60px rgba(0,0,0,0.4)',
      buttonRadius: '6px',
      cardPadding: '40px',
      sectionSpacing: '80px'
    },
    personality: 'Sharp, impactful, confident, tech-forward'
  },
  
  'elegant-minimal': {
    name: 'Elegant & Minimal',
    fonts: {
      heading: 'Playfair Display',
      body: 'Lato',
      headingWeight: '300',
      bodyWeight: '300'
    },
    typography: {
      h1Size: '64px',
      h2Size: '42px',
      h3Size: '28px',
      bodySize: '17px',
      lineHeight: '1.8',
      letterSpacing: '0.01em',
      textTransform: 'capitalize'
    },
    effects: {
      borderRadius: '24px',
      shadowStyle: '0 10px 40px rgba(0,0,0,0.1)',
      buttonRadius: '30px',
      cardPadding: '60px',
      sectionSpacing: '120px'
    },
    personality: 'Refined, sophisticated, luxurious, spacious'
  },
  
  'playful-fun': {
    name: 'Playful & Fun',
    fonts: {
      heading: 'Fredoka',
      body: 'Nunito',
      headingWeight: '600',
      bodyWeight: '400'
    },
    typography: {
      h1Size: '56px',
      h2Size: '38px',
      h3Size: '26px',
      bodySize: '18px',
      lineHeight: '1.6',
      letterSpacing: '0em',
      textTransform: 'none'
    },
    effects: {
      borderRadius: '32px',
      shadowStyle: '0 15px 50px rgba(0,0,0,0.2)',
      buttonRadius: '40px',
      cardPadding: '50px',
      sectionSpacing: '100px'
    },
    personality: 'Bouncy, energetic, colorful, approachable'
  },
  
  'professional-trust': {
    name: 'Professional & Trust',
    fonts: {
      heading: 'Source Serif Pro',
      body: 'Open Sans',
      headingWeight: '600',
      bodyWeight: '400'
    },
    typography: {
      h1Size: '48px',
      h2Size: '36px',
      h3Size: '24px',
      bodySize: '16px',
      lineHeight: '1.7',
      letterSpacing: '0em',
      textTransform: 'capitalize'
    },
    effects: {
      borderRadius: '8px',
      shadowStyle: '0 8px 30px rgba(0,0,0,0.15)',
      buttonRadius: '8px',
      cardPadding: '45px',
      sectionSpacing: '90px'
    },
    personality: 'Traditional, trustworthy, structured, corporate'
  },
  
  'creative-artistic': {
    name: 'Creative & Artistic',
    fonts: {
      heading: 'Space Grotesk',
      body: 'Work Sans',
      headingWeight: '700',
      bodyWeight: '400'
    },
    typography: {
      h1Size: '60px',
      h2Size: '44px',
      h3Size: '30px',
      bodySize: '17px',
      lineHeight: '1.6',
      letterSpacing: '0.02em',
      textTransform: 'none'
    },
    effects: {
      borderRadius: '16px',
      shadowStyle: '0 25px 70px rgba(0,0,0,0.3)',
      buttonRadius: '12px',
      cardPadding: '55px',
      sectionSpacing: '110px'
    },
    personality: 'Unique, bold, unconventional, expressive'
  },
  
  'warm-friendly': {
    name: 'Warm & Friendly',
    fonts: {
      heading: 'Quicksand',
      body: 'Poppins',
      headingWeight: '600',
      bodyWeight: '400'
    },
    typography: {
      h1Size: '52px',
      h2Size: '40px',
      h3Size: '28px',
      bodySize: '17px',
      lineHeight: '1.7',
      letterSpacing: '0em',
      textTransform: 'capitalize'
    },
    effects: {
      borderRadius: '16px',
      shadowStyle: '0 12px 45px rgba(0,0,0,0.18)',
      buttonRadius: '20px',
      cardPadding: '48px',
      sectionSpacing: '95px'
    },
    personality: 'Welcoming, approachable, humanistic, cozy'
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, websiteType, colorScheme, visualStyle, includeImages } = body;

    if (!prompt || !websiteType || !visualStyle) {
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

    // Calculate credits needed
    const baseCredits = 1;
    let imageCredits = 0;
    let generatedImages: any[] = [];
    
    if (includeImages) {
      // Analyze how many images we'll need
      const imageCount = determineImageCount(websiteType);
      imageCredits = imageCount * 2; // 2 credits per image
    }
    
    const totalCredits = baseCredits + imageCredits;

    if (profile.credits_remaining < totalCredits) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${totalCredits} credits (${baseCredits} website + ${imageCredits} images)` },
        { status: 402 }
      );
    }

    console.log(`Starting generation: ${totalCredits} credits (${baseCredits} base + ${imageCredits} images)`);

    // STEP 1: ENHANCE THE PROMPT
    console.log('Step 1: Enhancing prompt...');
    const style = VISUAL_STYLES[visualStyle as keyof typeof VISUAL_STYLES];
    const enhancedPrompt = await enhancePrompt(prompt, websiteType, colorScheme, style);
    console.log('Enhanced prompt created');

    // STEP 2: GENERATE IMAGES (if requested)
    if (includeImages) {
      console.log('Step 2: Generating AI images...');
      generatedImages = await generateImages(enhancedPrompt, websiteType, style);
      console.log(`Generated ${generatedImages.length} images`);
    }

    // STEP 3: GENERATE WEBSITE WITH STYLE + IMAGES
    console.log('Step 3: Generating website...');
    const systemPrompt = buildSystemPrompt(websiteType, colorScheme, style, generatedImages);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: enhancedPrompt },
      ],
      temperature: 0.85,
      max_tokens: 4500,
    });

    const generatedCode = completion.choices[0].message.content;

    if (!generatedCode) {
      return NextResponse.json(
        { error: 'Failed to generate website' },
        { status: 500 }
      );
    }

    // Parse the generated code
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
        generation_prompt: enhancedPrompt,
        generation_type: websiteType,
        credits_used: totalCredits,
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

    // Deduct credits
    await supabase
      .from('profiles')
      .update({ credits_remaining: profile.credits_remaining - totalCredits })
      .eq('id', user.id);

    // Log credit usage
    await supabase.from('credits_log').insert({
      user_id: user.id,
      credits_used: totalCredits,
      action: 'generate_website',
      details: { 
        preview_id: preview.id, 
        original_prompt: prompt.substring(0, 100),
        visual_style: visualStyle,
        images_generated: generatedImages.length,
        total_credits: totalCredits
      },
    });

    console.log('Website generated successfully!');

    return NextResponse.json({
      success: true,
      previewId: preview.id,
      creditsRemaining: profile.credits_remaining - totalCredits,
      imagesGenerated: generatedImages.length,
    });

  } catch (error: any) {
    console.error('Website generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function determineImageCount(websiteType: string): number {
  const imageCounts: Record<string, number> = {
    landing: 5, // Hero + 3 features + CTA
    portfolio: 7, // Hero + 6 projects
    business: 6, // Hero + 3 services + 2 team
    restaurant: 8, // Hero + 6 menu items + ambiance
    blog: 4, // Hero + 3 blog posts
    ecommerce: 6, // Hero + 5 products
  };
  return imageCounts[websiteType] || 4;
}

async function generateImages(
  enhancedPrompt: string,
  websiteType: string,
  style: any
): Promise<any[]> {
  const images: any[] = [];
  
  // Analyze what images we need
  const imageNeeds = analyzeImageNeeds(enhancedPrompt, websiteType);
  
  console.log(`Need ${imageNeeds.length} images`);
  
  // Generate each image
  for (const need of imageNeeds) {
    try {
      const imagePrompt = buildImagePrompt(need, style);
      console.log(`Generating: ${need.type}`);
      
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });

      const imageUrl = response.data?.[0]?.url;
      
      if (imageUrl) {
        images.push({
          type: need.type,
          url: imageUrl,
          alt: need.alt,
          prompt: imagePrompt
        });
      }
    } catch (error) {
      console.error(`Failed to generate ${need.type} image:`, error);
      // Continue with other images even if one fails
    }
  }
  
  return images;
}

function analyzeImageNeeds(prompt: string, websiteType: string): any[] {
  // Define image needs based on website type
  const typeNeeds: Record<string, any[]> = {
    landing: [
      { type: 'hero', alt: 'Hero image' },
      { type: 'feature1', alt: 'Feature 1' },
      { type: 'feature2', alt: 'Feature 2' },
      { type: 'feature3', alt: 'Feature 3' },
      { type: 'cta', alt: 'Call to action' },
    ],
    portfolio: [
      { type: 'hero', alt: 'Profile photo' },
      { type: 'project1', alt: 'Project 1' },
      { type: 'project2', alt: 'Project 2' },
      { type: 'project3', alt: 'Project 3' },
      { type: 'project4', alt: 'Project 4' },
      { type: 'project5', alt: 'Project 5' },
      { type: 'project6', alt: 'Project 6' },
    ],
    business: [
      { type: 'hero', alt: 'Business hero' },
      { type: 'service1', alt: 'Service 1' },
      { type: 'service2', alt: 'Service 2' },
      { type: 'service3', alt: 'Service 3' },
      { type: 'team1', alt: 'Team member 1' },
      { type: 'team2', alt: 'Team member 2' },
    ],
    restaurant: [
      { type: 'hero', alt: 'Restaurant ambiance' },
      { type: 'dish1', alt: 'Signature dish 1' },
      { type: 'dish2', alt: 'Signature dish 2' },
      { type: 'dish3', alt: 'Signature dish 3' },
      { type: 'dish4', alt: 'Signature dish 4' },
      { type: 'dish5', alt: 'Signature dish 5' },
      { type: 'dish6', alt: 'Signature dish 6' },
      { type: 'ambiance', alt: 'Interior ambiance' },
    ],
    blog: [
      { type: 'hero', alt: 'Blog hero' },
      { type: 'post1', alt: 'Featured post 1' },
      { type: 'post2', alt: 'Featured post 2' },
      { type: 'post3', alt: 'Featured post 3' },
    ],
    ecommerce: [
      { type: 'hero', alt: 'Product hero' },
      { type: 'product1', alt: 'Product 1' },
      { type: 'product2', alt: 'Product 2' },
      { type: 'product3', alt: 'Product 3' },
      { type: 'product4', alt: 'Product 4' },
      { type: 'product5', alt: 'Product 5' },
    ],
  };
  
  return typeNeeds[websiteType] || typeNeeds.landing;
}

function buildImagePrompt(need: any, style: any): string {
  const baseStyle = `Professional, high-quality, ${style.personality}, modern photography style`;
  
  // Customize based on image type
  const typePrompts: Record<string, string> = {
    hero: `${baseStyle}. Wide hero banner image, eye-catching, vibrant`,
    feature1: `${baseStyle}. Icon or illustration representing a key feature`,
    feature2: `${baseStyle}. Icon or illustration representing a key feature`,
    feature3: `${baseStyle}. Icon or illustration representing a key feature`,
    project1: `${baseStyle}. Portfolio project screenshot or mockup`,
    service1: `${baseStyle}. Service illustration or icon`,
    dish1: `${baseStyle}. Appetizing food photography, overhead view`,
    team1: `${baseStyle}. Professional headshot, friendly expression`,
    product1: `${baseStyle}. Product photography, clean background`,
    post1: `${baseStyle}. Blog post featured image, engaging`,
  };
  
  const basePrompt = typePrompts[need.type] || typePrompts.hero;
  
  return `${basePrompt}. No text, no watermarks, suitable for website use.`;
}

async function enhancePrompt(
  userPrompt: string,
  websiteType: string,
  colorScheme: string,
  style: any
): Promise<string> {
  
  const enhancementPrompt = `You are a creative director. Enhance this website concept with specific details.

USER'S IDEA: "${userPrompt}"

WEBSITE TYPE: ${websiteType}
VISUAL STYLE: ${style.name} - ${style.personality}
COLOR SCHEME: ${colorScheme}

Create a detailed specification including:
1. Business name (creative, memorable)
2. Specific sections with content
3. Headlines and CTAs
4. Visual descriptions
5. Emoji icons for sections

Make it 5x more detailed. Output ONLY the enhanced specification.`;

  const enhancement = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a creative branding expert.' },
      { role: 'user', content: enhancementPrompt },
    ],
    temperature: 0.8,
    max_tokens: 1500,
  });

  return enhancement.choices[0].message.content || userPrompt;
}

function buildSystemPrompt(
  websiteType: string,
  colorScheme: string,
  style: any,
  images: any[]
): string {
  
  const imageInstructions = images.length > 0 ? `
IMAGES PROVIDED:
${images.map((img, i) => `${i + 1}. ${img.type}: ${img.url} (alt: "${img.alt}")`).join('\n')}

CRITICAL: Use these EXACT image URLs in your HTML with <img> tags.
Example: <img src="${images[0]?.url}" alt="${images[0]?.alt}" class="...">
` : '';

  return `You are an ELITE web developer. Generate a STUNNING website.

OUTPUT FORMAT (CRITICAL):
\`\`\`html
<!-- HTML here -->
\`\`\`

\`\`\`css
/* CSS here with Google Fonts import */
\`\`\`

\`\`\`javascript
// JS here if needed
\`\`\`

VISUAL STYLE SYSTEM - FOLLOW EXACTLY:

FONTS (import from Google Fonts):
- Heading: ${style.fonts.heading}, weight ${style.fonts.headingWeight}
- Body: ${style.fonts.body}, weight ${style.fonts.bodyWeight}

TYPOGRAPHY:
- H1: ${style.typography.h1Size}, ${style.typography.textTransform}
- H2: ${style.typography.h2Size}
- H3: ${style.typography.h3Size}
- Body: ${style.typography.bodySize}
- Line height: ${style.typography.lineHeight}
- Letter spacing: ${style.typography.letterSpacing}

DESIGN ELEMENTS:
- Border radius: ${style.effects.borderRadius}
- Box shadow: ${style.effects.shadowStyle}
- Button radius: ${style.effects.buttonRadius}
- Card padding: ${style.effects.cardPadding}
- Section spacing: ${style.effects.sectionSpacing}

PERSONALITY: ${style.personality}

${imageInstructions}

CRITICAL CSS STRUCTURE:
@import url('https://fonts.googleapis.com/css2?family=${style.fonts.heading.replace(' ', '+')}:wght@${style.fonts.headingWeight}&family=${style.fonts.body.replace(' ', '+')}:wght@${style.fonts.bodyWeight}&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: '${style.fonts.body}', sans-serif;
  font-size: ${style.typography.bodySize};
  line-height: ${style.typography.lineHeight};
  color: #1a1a1a;
}

h1, h2, h3 {
  font-family: '${style.fonts.heading}', serif;
  font-weight: ${style.fonts.headingWeight};
  letter-spacing: ${style.typography.letterSpacing};
}

h1 { font-size: ${style.typography.h1Size}; text-transform: ${style.typography.textTransform}; }
h2 { font-size: ${style.typography.h2Size}; }
h3 { font-size: ${style.typography.h3Size}; }

Make it STUNNING with this exact visual style!`;
}

function parseGeneratedCode(generatedCode: string): { html: string; css: string; js: string } {
  let html = '';
  let css = '';
  let js = '';

  const htmlMatch = generatedCode.match(/```html\n([\s\S]*?)```/);
  if (htmlMatch) html = htmlMatch[1].trim();

  const cssMatch = generatedCode.match(/```css\n([\s\S]*?)```/);
  if (cssMatch) css = cssMatch[1].trim();

  const jsMatch = generatedCode.match(/```javascript\n([\s\S]*?)```/);
  if (jsMatch) js = jsMatch[1].trim();

  if (!html && generatedCode.includes('<html')) {
    html = generatedCode;
  }

  return { html, css, js };
}
