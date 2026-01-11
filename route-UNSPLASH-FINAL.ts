// app/api/generate-website/route.ts
// ULTIMATE VERSION - Real Photos (Unsplash) + AI Graphics + Perfect Structure
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const VISUAL_STYLES = {
  'bold-modern': {
    name: 'Bold & Modern',
    fonts: { heading: 'Montserrat', body: 'Inter', headingWeight: '800', bodyWeight: '400' },
    typography: { h1Size: '72px', h2Size: '48px', bodySize: '18px', lineHeight: '1.4', letterSpacing: '-0.02em', textTransform: 'uppercase' },
    effects: { borderRadius: '4px', shadowStyle: '0 20px 60px rgba(0,0,0,0.4)', buttonRadius: '6px', cardPadding: '40px', sectionSpacing: '80px' },
    personality: 'Sharp, impactful, confident, tech-forward'
  },
  'elegant-minimal': {
    name: 'Elegant & Minimal',
    fonts: { heading: 'Playfair Display', body: 'Lato', headingWeight: '300', bodyWeight: '300' },
    typography: { h1Size: '64px', h2Size: '42px', bodySize: '17px', lineHeight: '1.8', letterSpacing: '0.01em', textTransform: 'capitalize' },
    effects: { borderRadius: '24px', shadowStyle: '0 10px 40px rgba(0,0,0,0.1)', buttonRadius: '30px', cardPadding: '60px', sectionSpacing: '120px' },
    personality: 'Refined, sophisticated, luxurious, spacious'
  },
  'playful-fun': {
    name: 'Playful & Fun',
    fonts: { heading: 'Fredoka', body: 'Nunito', headingWeight: '600', bodyWeight: '400' },
    typography: { h1Size: '56px', h2Size: '38px', bodySize: '18px', lineHeight: '1.6', letterSpacing: '0em', textTransform: 'none' },
    effects: { borderRadius: '32px', shadowStyle: '0 15px 50px rgba(0,0,0,0.2)', buttonRadius: '40px', cardPadding: '50px', sectionSpacing: '100px' },
    personality: 'Bouncy, energetic, colorful, approachable'
  },
  'professional-trust': {
    name: 'Professional & Trust',
    fonts: { heading: 'Source Serif Pro', body: 'Open Sans', headingWeight: '600', bodyWeight: '400' },
    typography: { h1Size: '48px', h2Size: '36px', bodySize: '16px', lineHeight: '1.7', letterSpacing: '0em', textTransform: 'capitalize' },
    effects: { borderRadius: '8px', shadowStyle: '0 8px 30px rgba(0,0,0,0.15)', buttonRadius: '8px', cardPadding: '45px', sectionSpacing: '90px' },
    personality: 'Traditional, trustworthy, structured, corporate'
  },
  'creative-artistic': {
    name: 'Creative & Artistic',
    fonts: { heading: 'Space Grotesk', body: 'Work Sans', headingWeight: '700', bodyWeight: '400' },
    typography: { h1Size: '60px', h2Size: '44px', bodySize: '17px', lineHeight: '1.6', letterSpacing: '0.02em', textTransform: 'none' },
    effects: { borderRadius: '16px', shadowStyle: '0 25px 70px rgba(0,0,0,0.3)', buttonRadius: '12px', cardPadding: '55px', sectionSpacing: '110px' },
    personality: 'Unique, bold, unconventional, expressive'
  },
  'warm-friendly': {
    name: 'Warm & Friendly',
    fonts: { heading: 'Quicksand', body: 'Poppins', headingWeight: '600', bodyWeight: '400' },
    typography: { h1Size: '52px', h2Size: '40px', bodySize: '17px', lineHeight: '1.7', letterSpacing: '0em', textTransform: 'capitalize' },
    effects: { borderRadius: '16px', shadowStyle: '0 12px 45px rgba(0,0,0,0.18)', buttonRadius: '20px', cardPadding: '48px', sectionSpacing: '95px' },
    personality: 'Welcoming, approachable, humanistic, cozy'
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, websiteType, colorScheme, visualStyle, includeImages } = body;

    if (!prompt || !websiteType || !visualStyle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return request.cookies.get(name)?.value; },
          set(name: string, value: string, options: any) {},
          remove(name: string, options: any) {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('credits_remaining').eq('id', user.id).single();
    if (!profile) {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // NEW CREDIT SYSTEM: Images add fixed credits (not per image)
    const baseCredits = 1;
    const imageCredits = includeImages ? 4 : 0; // Flat fee for curated images
    const totalCredits = baseCredits + imageCredits;

    if (profile.credits_remaining < totalCredits) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${totalCredits} credits (${baseCredits} website + ${imageCredits} curated images)` },
        { status: 402 }
      );
    }

    console.log(`Starting generation: ${totalCredits} credits`);

    // STEP 1: CREATE DETAILED SPECIFICATION
    console.log('Step 1: Creating detailed specification...');
    const style = VISUAL_STYLES[visualStyle as keyof typeof VISUAL_STYLES];
    const enhancedSpec = await enhancePromptWithDetails(prompt, websiteType, colorScheme, style);
    console.log('Detailed spec created');

    // STEP 2: FETCH REAL PHOTOS FROM UNSPLASH
    let images: any[] = [];
    if (includeImages) {
      console.log('Step 2: Fetching curated real photos...');
      images = await fetchUnsplashImages(enhancedSpec, websiteType);
      console.log(`Fetched ${images.length} real photos`);
    }

    // STEP 3: GENERATE WEBSITE
    console.log('Step 3: Generating structured website...');
    const systemPrompt = buildStructuredSystemPrompt(websiteType, colorScheme, style, images, enhancedSpec);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: enhancedSpec.fullSpecification },
      ],
      temperature: 0.85,
      max_tokens: 4500,
    });

    const generatedCode = completion.choices[0].message.content;
    if (!generatedCode) {
      return NextResponse.json({ error: 'Failed to generate website' }, { status: 500 });
    }

    const { html, css, js } = parseGeneratedCode(generatedCode);

    const { data: preview, error: previewError } = await supabase
      .from('previews')
      .insert({
        user_id: user.id,
        title: prompt.substring(0, 100),
        html_content: html,
        css_content: css,
        js_content: js,
        preview_type: 'website',
        generation_prompt: enhancedSpec.fullSpecification,
        generation_type: websiteType,
        credits_used: totalCredits,
      })
      .select()
      .single();

    if (previewError || !preview) {
      return NextResponse.json({ error: 'Failed to save website' }, { status: 500 });
    }

    await supabase.from('profiles').update({ credits_remaining: profile.credits_remaining - totalCredits }).eq('id', user.id);
    await supabase.from('credits_log').insert({
      user_id: user.id,
      credits_used: totalCredits,
      action: 'generate_website',
      details: { 
        preview_id: preview.id,
        images_count: images.length,
        image_source: 'unsplash'
      },
    });

    return NextResponse.json({
      success: true,
      previewId: preview.id,
      creditsRemaining: profile.credits_remaining - totalCredits,
      imagesUsed: images.length,
    });

  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// ENHANCED PROMPT WITH DETAILED CONTENT
async function enhancePromptWithDetails(
  userPrompt: string,
  websiteType: string,
  colorScheme: string,
  style: any
): Promise<any> {
  
  const enhancementPrompt = `You are a creative director. Create a DETAILED specification.

USER'S IDEA: "${userPrompt}"
WEBSITE TYPE: ${websiteType}
VISUAL STYLE: ${style.name}

CREATE DETAILED SPECIFICATION:

1. BUSINESS NAME (creative, memorable)

2. SPECIFIC CONTENT:
${websiteType === 'restaurant' ? `
   - List 6-8 SPECIFIC DISHES with exact names and descriptions
   - Cuisine type (Italian, Japanese, Mexican, etc.)
   - Restaurant atmosphere and unique selling points
` : websiteType === 'portfolio' ? `
   - 6 SPECIFIC PROJECT NAMES and descriptions
   - Your expertise/role
   - Industry/specialization
` : websiteType === 'business' ? `
   - 3-4 SPECIFIC SERVICES with details
   - Industry/niche
   - Target customers
` : websiteType === 'ecommerce' ? `
   - 5-6 SPECIFIC PRODUCTS with names and descriptions
   - Product category
   - Brand positioning
` : `
   - SPECIFIC features/offerings with names
   - Key benefits
   - Target audience
`}

3. SEARCH KEYWORDS FOR IMAGES:
   - Hero image keyword: [specific searchable term]
   - Item 1 keyword: [specific searchable term]
   - Item 2 keyword: [specific searchable term]
   (etc - be VERY specific for image searches)

4. SECTIONS with emoji icons and content

CRITICAL: Be SPECIFIC. Don't say "Dish 1" - say "Spaghetti Carbonara with pancetta and parmesan".

Output format:
---
BUSINESS NAME: [name]

CONTENT: [detailed content]

IMAGE SEARCH KEYWORDS:
hero: [keyword]
item1: [keyword]
item2: [keyword]
...

SECTIONS: [sections]
---`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a creative expert providing SPECIFIC details.' },
      { role: 'user', content: enhancementPrompt },
    ],
    temperature: 0.8,
    max_tokens: 2000,
  });

  const fullSpec = response.choices[0].message.content || userPrompt;
  
  return {
    fullSpecification: fullSpec,
    businessName: extractBusinessName(fullSpec),
    searchKeywords: extractSearchKeywords(fullSpec),
    contentDetails: extractContentDetails(fullSpec)
  };
}

function extractBusinessName(spec: string): string {
  const match = spec.match(/BUSINESS NAME:\s*(.+)/i);
  return match ? match[1].trim() : 'Business';
}

function extractSearchKeywords(spec: string): Record<string, string> {
  const keywords: Record<string, string> = {};
  const section = spec.match(/IMAGE SEARCH KEYWORDS:\s*([\s\S]*?)(?=SECTIONS:|$)/i);
  
  if (section) {
    const lines = section[1].split('\n');
    lines.forEach(line => {
      const match = line.match(/(.+?):\s*(.+)/);
      if (match) {
        keywords[match[1].trim().toLowerCase()] = match[2].trim();
      }
    });
  }
  
  return keywords;
}

function extractContentDetails(spec: string): string {
  const match = spec.match(/CONTENT:\s*([\s\S]*?)(?=IMAGE SEARCH KEYWORDS:|SECTIONS:|$)/i);
  return match ? match[1].trim() : spec;
}

// FETCH REAL PHOTOS FROM UNSPLASH
async function fetchUnsplashImages(
  enhancedSpec: any,
  websiteType: string
): Promise<any[]> {
  const images: any[] = [];
  const imageNeeds = determineImageNeeds(websiteType);
  
  // Unsplash API endpoint
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'demo'; // Add your key
  
  for (const need of imageNeeds) {
    try {
      // Get search keyword from spec
      const searchKeyword = enhancedSpec.searchKeywords[need.type] || getDefaultSearchTerm(need.type, websiteType);
      
      console.log(`Searching Unsplash: "${searchKeyword}"`);
      
      // Search Unsplash
      const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchKeyword)}&per_page=1&orientation=${need.orientation || 'landscape'}&client_id=${UNSPLASH_ACCESS_KEY}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const photo = data.results[0];
        images.push({
          type: need.type,
          url: photo.urls.regular, // High-quality URL
          alt: photo.alt_description || need.alt,
          photographer: photo.user.name,
          photographerUrl: photo.user.links.html,
          downloadLocation: photo.links.download_location
        });
        
        // Trigger download endpoint (Unsplash requirement)
        if (photo.links.download_location) {
          fetch(photo.links.download_location, {
            headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` }
          }).catch(() => {});
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${need.type}:`, error);
      // Continue with other images
    }
  }
  
  return images;
}

function determineImageNeeds(websiteType: string): any[] {
  const needs: Record<string, any[]> = {
    restaurant: [
      { type: 'hero', alt: 'Restaurant ambiance', orientation: 'landscape' },
      { type: 'dish1', alt: 'Signature dish', orientation: 'square' },
      { type: 'dish2', alt: 'Popular dish', orientation: 'square' },
      { type: 'dish3', alt: 'Chef special', orientation: 'square' },
      { type: 'dish4', alt: 'Dessert', orientation: 'square' },
      { type: 'dish5', alt: 'Appetizer', orientation: 'square' },
      { type: 'dish6', alt: 'Main course', orientation: 'square' },
    ],
    landing: [
      { type: 'hero', alt: 'Hero image', orientation: 'landscape' },
      { type: 'feature1', alt: 'Feature', orientation: 'square' },
      { type: 'feature2', alt: 'Feature', orientation: 'square' },
      { type: 'feature3', alt: 'Feature', orientation: 'square' },
    ],
    portfolio: [
      { type: 'hero', alt: 'Profile', orientation: 'portrait' },
      { type: 'project1', alt: 'Project', orientation: 'landscape' },
      { type: 'project2', alt: 'Project', orientation: 'landscape' },
      { type: 'project3', alt: 'Project', orientation: 'landscape' },
      { type: 'project4', alt: 'Project', orientation: 'landscape' },
      { type: 'project5', alt: 'Project', orientation: 'landscape' },
      { type: 'project6', alt: 'Project', orientation: 'landscape' },
    ],
    business: [
      { type: 'hero', alt: 'Business', orientation: 'landscape' },
      { type: 'service1', alt: 'Service', orientation: 'landscape' },
      { type: 'service2', alt: 'Service', orientation: 'landscape' },
      { type: 'service3', alt: 'Service', orientation: 'landscape' },
    ],
    ecommerce: [
      { type: 'hero', alt: 'Product hero', orientation: 'landscape' },
      { type: 'product1', alt: 'Product', orientation: 'square' },
      { type: 'product2', alt: 'Product', orientation: 'square' },
      { type: 'product3', alt: 'Product', orientation: 'square' },
      { type: 'product4', alt: 'Product', orientation: 'square' },
      { type: 'product5', alt: 'Product', orientation: 'square' },
    ],
    blog: [
      { type: 'hero', alt: 'Blog hero', orientation: 'landscape' },
      { type: 'post1', alt: 'Article', orientation: 'landscape' },
      { type: 'post2', alt: 'Article', orientation: 'landscape' },
      { type: 'post3', alt: 'Article', orientation: 'landscape' },
    ],
  };
  
  return needs[websiteType] || needs.landing;
}

function getDefaultSearchTerm(imageType: string, websiteType: string): string {
  if (websiteType === 'restaurant') {
    if (imageType === 'hero') return 'restaurant interior elegant';
    if (imageType.startsWith('dish')) return 'gourmet food plated';
  }
  if (websiteType === 'landing') {
    if (imageType === 'hero') return 'modern technology workspace';
    return 'abstract technology';
  }
  if (websiteType === 'portfolio') {
    if (imageType === 'hero') return 'creative professional workspace';
    return 'creative design project';
  }
  return 'professional business';
}

function buildStructuredSystemPrompt(
  websiteType: string,
  colorScheme: string,
  style: any,
  images: any[],
  enhancedSpec: any
): string {
  
  const imagesList = images.length > 0 ? `
REAL PROFESSIONAL PHOTOS PROVIDED - USE THESE EXACT URLs:
${images.map((img, i) => `
${i + 1}. ${img.type}: ${img.url}
   Alt: "${img.alt}"
   Photo by: ${img.photographer}
`).join('')}

CRITICAL IMAGE USAGE:
- Use EXACT URLs in <img src="..." />
- Include photographer credit in footer: "Photos by [name] on Unsplash"
- Images are HIGH-QUALITY, REAL photos - use prominently!
- For text over images, add dark overlay: background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(...)
` : '';

  const structureRequirements = {
    restaurant: `
RESTAURANT STRUCTURE - MANDATORY:
1. HEADER: Business name + Navigation (Home, Menu, About, Contact) + Sticky
2. HERO: Full-width hero image with dark overlay, white text, CTA button
3. MENU: Grid of dishes with images, names, descriptions below (not over images!)
4. ABOUT: Restaurant story
5. LOCATION/HOURS
6. FOOTER with photo credits
`,
    landing: `
LANDING STRUCTURE - MANDATORY:
1. HEADER: Logo + Navigation + CTA
2. HERO: Full-width with overlay, headline, CTA
3. FEATURES: 3 feature cards with images
4. SOCIAL PROOF
5. CTA SECTION
6. FOOTER with photo credits
`,
    portfolio: `
PORTFOLIO STRUCTURE - MANDATORY:
1. HEADER: Name + Navigation
2. HERO/INTRO with profile
3. PROJECTS: Grid of project images with titles below
4. ABOUT
5. CONTACT
6. FOOTER with photo credits
`,
  };

  return `You are an ELITE web developer creating a PROFESSIONAL website with REAL photos.

${structureRequirements[websiteType as keyof typeof structureRequirements] || structureRequirements.landing}

${imagesList}

OUTPUT FORMAT:
\`\`\`html
<!-- Complete HTML -->
\`\`\`

\`\`\`css
/* Complete CSS with Google Fonts */
\`\`\`

\`\`\`javascript
// Optional JS
\`\`\`

VISUAL STYLE:
- Fonts: ${style.fonts.heading} (${style.fonts.headingWeight}) + ${style.fonts.body}
- Typography: H1 ${style.typography.h1Size}, ${style.typography.textTransform}
- Effects: radius ${style.effects.borderRadius}, shadows ${style.effects.shadowStyle}

CRITICAL TEXT READABILITY:
- NEVER put text directly over images without overlay
- Hero section: Add dark overlay (rgba(0,0,0,0.4-0.6))
- Use white text on dark overlays
- Dish/product names: BELOW images, not on them
- Keep text areas separate from photos

CSS MUST START WITH:
@import url('https://fonts.googleapis.com/css2?family=${style.fonts.heading.replace(' ', '+')}:wght@${style.fonts.headingWeight}&family=${style.fonts.body.replace(' ', '+')}:wght@${style.fonts.bodyWeight}&display=swap');

REQUIREMENTS:
1. Include complete header with navigation
2. Use provided real photos strategically
3. Text must be READABLE - use overlays or separate sections
4. Credit photographers in footer
5. Make it clean, professional, structured
6. Business name: ${enhancedSpec.businessName}

Make it STUNNING and PROFESSIONAL with REAL photography!`;
}

function parseGeneratedCode(code: string): { html: string; css: string; js: string } {
  const htmlMatch = code.match(/```html\n([\s\S]*?)```/);
  const cssMatch = code.match(/```css\n([\s\S]*?)```/);
  const jsMatch = code.match(/```javascript\n([\s\S]*?)```/);
  
  return {
    html: htmlMatch ? htmlMatch[1].trim() : (code.includes('<html') ? code : ''),
    css: cssMatch ? cssMatch[1].trim() : '',
    js: jsMatch ? jsMatch[1].trim() : ''
  };
}
