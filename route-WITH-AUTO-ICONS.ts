// app/api/generate-website/route.ts
// COMPLETE VERSION - Auto Icons + Real Photos + Full Content
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

    const baseCredits = 1;
    const imageCredits = includeImages ? 4 : 0;
    const totalCredits = baseCredits + imageCredits;

    if (profile.credits_remaining < totalCredits) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${totalCredits} credits` },
        { status: 402 }
      );
    }

    console.log(`Starting generation: ${totalCredits} credits`);

    // STEP 1: CREATE DETAILED SPECIFICATION WITH MORE CONTENT
    console.log('Step 1: Creating detailed specification...');
    const style = VISUAL_STYLES[visualStyle as keyof typeof VISUAL_STYLES];
    const enhancedSpec = await enhancePromptWithDetails(prompt, websiteType, colorScheme, style);
    console.log('Detailed spec created');

    // STEP 2: FETCH REAL PHOTOS
    let images: any[] = [];
    if (includeImages) {
      console.log('Step 2: Fetching professional photos...');
      images = await fetchUnsplashImages(enhancedSpec, websiteType);
      console.log(`Fetched ${images.length} photos`);
    }

    // STEP 3: GENERATE AUTO ICON
    console.log('Step 3: Creating branded icon...');
    const autoIcon = generateAutoIcon(websiteType, enhancedSpec.businessName, style);
    console.log('Icon created');

    // STEP 4: GENERATE COMPLETE WEBSITE
    console.log('Step 4: Generating complete website...');
    const systemPrompt = buildCompleteSystemPrompt(websiteType, colorScheme, style, images, enhancedSpec, autoIcon);
    
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
      details: { preview_id: preview.id, images_count: images.length },
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

// GENERATE AUTO ICON - Simple SVG based on type
function generateAutoIcon(websiteType: string, businessName: string, style: any): string {
  const initial = businessName.charAt(0).toUpperCase();
  
  const icons: Record<string, string> = {
    restaurant: `<svg viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 6v16h4V6h-4zm0 18v18h4V24h-4zM22 6c-2.21 0-4 1.79-4 4v8c0 2.21 1.79 4 4 4v22h4V22c2.21 0 4-1.79 4-4v-8c0-2.21-1.79-4-4-4h-4z"/>
</svg>`,
    landing: `<svg viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M24 4L6 18v24h12V28h12v14h12V18L24 4zm0 8l12 9v17h-4V26H16v12h-4V21l12-9z"/>
</svg>`,
    portfolio: `<svg viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <circle cx="24" cy="24" r="20"/>
  <text x="24" y="32" font-size="20" text-anchor="middle" fill="white" font-weight="bold">${initial}</text>
</svg>`,
    business: `<svg viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 8h12v6H8V8zm0 8h12v6H8v-6zm0 8h12v6H8v-6zm0 8h12v6H8v-6zm16-24h16v6H24V8zm0 8h16v6H24v-6zm0 8h16v6H24v-6zm0 8h16v6H24v-6z"/>
</svg>`,
    blog: `<svg viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 8h24v4H12V8zm0 8h24v4H12v-4zm0 8h18v4H12v-4zm0 8h18v4H12v-4z"/>
</svg>`,
    ecommerce: `<svg viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 8L8 18v20h32V18l-6-10H14zm0 4h20l4 6H10l4-6zm-4 10h28v14H10V22z"/>
  <circle cx="18" cy="36" r="3"/>
  <circle cx="30" cy="36" r="3"/>
</svg>`,
  };
  
  return icons[websiteType] || icons.portfolio;
}

// ENHANCED PROMPT - MORE COMPLETE CONTENT
async function enhancePromptWithDetails(
  userPrompt: string,
  websiteType: string,
  colorScheme: string,
  style: any
): Promise<any> {
  
  const enhancementPrompt = `You are a creative director creating a COMPLETE, SUBSTANTIAL website specification.

USER'S IDEA: "${userPrompt}"
WEBSITE TYPE: ${websiteType}
VISUAL STYLE: ${style.name}

CREATE A COMPREHENSIVE SPECIFICATION:

1. BUSINESS NAME (creative, memorable)

2. COMPLETE CONTENT (be VERY detailed):
${websiteType === 'restaurant' ? `
   - 8-10 SPECIFIC MENU ITEMS with exact names, ingredients, prices
   - Restaurant story/history (3-4 sentences)
   - Chef information
   - Location details
   - Hours of operation
   - Reservation info
   - Ambiance description
` : websiteType === 'portfolio' ? `
   - 6-8 DETAILED PROJECTS with names, descriptions, technologies used
   - About section (who you are, background, 4-5 sentences)
   - Skills list (10+ specific skills)
   - Work experience (2-3 positions)
   - Contact information
   - Testimonials (2-3)
` : websiteType === 'business' ? `
   - 4-6 SPECIFIC SERVICES with detailed descriptions
   - Company mission and values (3-4 sentences)
   - Team members (3-4 people with roles)
   - Client testimonials (3)
   - Process/methodology
   - Contact information
` : websiteType === 'ecommerce' ? `
   - 6-8 PRODUCTS with names, descriptions, prices
   - Brand story
   - Product categories
   - Shipping info
   - Return policy
   - Customer testimonials
` : `
   - 4-6 KEY FEATURES with detailed explanations
   - Benefits for each feature
   - Testimonials (3)
   - Pricing tiers (if applicable)
   - FAQ section (5 questions)
   - Contact/CTA
`}

3. IMAGE SEARCH KEYWORDS (specific):
   hero: [exact searchable term]
   ${websiteType === 'restaurant' ? 'dish1-8' : websiteType === 'portfolio' ? 'project1-6' : 'item1-6'}: [specific terms]

4. FULL SECTIONS with content

CRITICAL: Make it SUBSTANTIAL. This should be a COMPLETE website with lots of content.

Output format:
---
BUSINESS NAME: [name]

COMPLETE CONTENT:
[All detailed content here - be thorough!]

IMAGE SEARCH KEYWORDS:
hero: [keyword]
item1: [keyword]
...

SECTIONS:
[All sections with actual content]
---`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You create COMPREHENSIVE, COMPLETE specifications with lots of detail.' },
      { role: 'user', content: enhancementPrompt },
    ],
    temperature: 0.8,
    max_tokens: 2500,
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
  const match = spec.match(/COMPLETE CONTENT:\s*([\s\S]*?)(?=IMAGE SEARCH KEYWORDS:|$)/i);
  return match ? match[1].trim() : spec;
}

// FETCH UNSPLASH IMAGES
async function fetchUnsplashImages(enhancedSpec: any, websiteType: string): Promise<any[]> {
  const images: any[] = [];
  const imageNeeds = determineImageNeeds(websiteType);
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'demo';
  
  for (const need of imageNeeds) {
    try {
      const searchKeyword = enhancedSpec.searchKeywords[need.type] || getDefaultSearchTerm(need.type, websiteType);
      const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchKeyword)}&per_page=1&orientation=${need.orientation || 'landscape'}&client_id=${UNSPLASH_ACCESS_KEY}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const photo = data.results[0];
        images.push({
          type: need.type,
          url: photo.urls.regular,
          alt: photo.alt_description || need.alt,
          photographer: photo.user.name,
          photographerUrl: photo.user.links.html,
        });
        
        if (photo.links.download_location) {
          fetch(photo.links.download_location, {
            headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` }
          }).catch(() => {});
        }
      }
    } catch (error) {
      console.error(`Failed ${need.type}:`, error);
    }
  }
  
  return images;
}

function determineImageNeeds(websiteType: string): any[] {
  const needs: Record<string, any[]> = {
    restaurant: [
      { type: 'hero', alt: 'Restaurant', orientation: 'landscape' },
      { type: 'dish1', alt: 'Dish', orientation: 'square' },
      { type: 'dish2', alt: 'Dish', orientation: 'square' },
      { type: 'dish3', alt: 'Dish', orientation: 'square' },
      { type: 'dish4', alt: 'Dish', orientation: 'square' },
      { type: 'dish5', alt: 'Dish', orientation: 'square' },
      { type: 'dish6', alt: 'Dish', orientation: 'square' },
      { type: 'dish7', alt: 'Dish', orientation: 'square' },
      { type: 'dish8', alt: 'Dish', orientation: 'square' },
    ],
    landing: [
      { type: 'hero', alt: 'Hero', orientation: 'landscape' },
      { type: 'feature1', alt: 'Feature', orientation: 'landscape' },
      { type: 'feature2', alt: 'Feature', orientation: 'landscape' },
      { type: 'feature3', alt: 'Feature', orientation: 'landscape' },
      { type: 'feature4', alt: 'Feature', orientation: 'landscape' },
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
      { type: 'service4', alt: 'Service', orientation: 'landscape' },
      { type: 'team1', alt: 'Team', orientation: 'portrait' },
      { type: 'team2', alt: 'Team', orientation: 'portrait' },
    ],
  };
  
  return needs[websiteType] || needs.landing;
}

function getDefaultSearchTerm(imageType: string, websiteType: string): string {
  if (websiteType === 'restaurant') {
    if (imageType === 'hero') return 'restaurant interior elegant dining';
    return 'gourmet food plated professional';
  }
  if (websiteType === 'landing') {
    if (imageType === 'hero') return 'modern technology innovation';
    return 'technology abstract futuristic';
  }
  return 'professional business modern';
}

function buildCompleteSystemPrompt(
  websiteType: string,
  colorScheme: string,
  style: any,
  images: any[],
  enhancedSpec: any,
  autoIcon: string
): string {
  
  const imagesList = images.length > 0 ? `
PROFESSIONAL PHOTOS:
${images.map((img, i) => `${i + 1}. ${img.type}: ${img.url} (${img.alt})`).join('\n')}

USE ALL IMAGES in appropriate sections!
` : '';

  const structures: Record<string, string> = {
    restaurant: `
COMPLETE RESTAURANT STRUCTURE:

1. HEADER (sticky):
   - Logo: SVG icon + business name
   - Nav: Home | Menu | About | Contact | Reservations
   
2. HERO (full-width, overlay):
   - Background: hero image
   - Dark overlay
   - Headline + tagline + CTA button

3. ABOUT SECTION:
   - Restaurant story
   - Chef information
   - What makes us special
   
4. MENU SECTION:
   - Grid of 8+ dishes with images
   - Each: image, name, description, price
   - Categories if needed

5. AMBIANCE/GALLERY:
   - Additional photos
   - Atmosphere description

6. LOCATION & HOURS:
   - Address, map
   - Hours of operation
   - Reservation info

7. TESTIMONIALS:
   - 3 customer reviews

8. FOOTER:
   - Contact, social
   - Photo credits
   
MAKE IT SUBSTANTIAL - use ALL content provided!`,

    landing: `
COMPLETE LANDING PAGE:

1. HEADER: Logo + Nav + CTA

2. HERO: Full image, overlay, headline, CTA

3. FEATURES: 4-5 features with images & details

4. BENEFITS: Why choose us

5. SOCIAL PROOF: Testimonials

6. PRICING (if applicable)

7. FAQ

8. FINAL CTA

9. FOOTER with credits

USE ALL IMAGES!`,

    portfolio: `
COMPLETE PORTFOLIO:

1. HEADER: Name + Nav

2. HERO: Profile photo + intro

3. PROJECTS: 6+ projects with images

4. SKILLS: Full list

5. EXPERIENCE: Work history

6. TESTIMONIALS

7. CONTACT

8. FOOTER

USE ALL IMAGES!`,
  };

  return `You are creating a COMPLETE, PROFESSIONAL, SUBSTANTIAL website.

${structures[websiteType as keyof typeof structures] || structures.landing}

${imagesList}

BRANDED LOGO:
Use this SVG icon in the header next to business name:
${autoIcon}

Example header HTML:
<header>
  <div class="logo">
    <div class="logo-icon">${autoIcon}</div>
    <span class="logo-text">${enhancedSpec.businessName}</span>
  </div>
  <nav>...</nav>
</header>

CSS for logo:
.logo { display: flex; align-items: center; gap: 12px; }
.logo-icon { width: 40px; height: 40px; color: [brand-color]; }
.logo-icon svg { width: 100%; height: 100%; }
.logo-text { font-size: 24px; font-weight: bold; }

OUTPUT FORMAT:
\`\`\`html
<!-- COMPLETE HTML -->
\`\`\`

\`\`\`css
/* COMPLETE CSS with fonts */
@import url('https://fonts.googleapis.com/css2?family=${style.fonts.heading.replace(' ', '+')}:wght@${style.fonts.headingWeight}&family=${style.fonts.body.replace(' ', '+')}:wght@${style.fonts.bodyWeight}&display=swap');
\`\`\`

\`\`\`javascript
// Optional JS
\`\`\`

VISUAL STYLE: ${style.name}
FONTS: ${style.fonts.heading} + ${style.fonts.body}
EFFECTS: ${style.effects.borderRadius}, ${style.effects.shadowStyle}

CRITICAL:
1. Include COMPLETE header with icon logo
2. USE ALL ${images.length} IMAGES provided
3. Create SUBSTANTIAL content (use all details from spec)
4. Text readable (overlays on images)
5. All sections complete
6. Credit photographers in footer
7. Make it look PROFESSIONAL and COMPLETE

Business: ${enhancedSpec.businessName}

Make it AMAZING - substantial, complete, professional!`;
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
