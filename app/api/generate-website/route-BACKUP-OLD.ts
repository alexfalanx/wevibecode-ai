// app/api/generate-website/route.ts
// COMPLETE MODERNIZATION - All fixes applied
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      websiteType,
      sections,
      vibe,
      colorMode,
      colorPalette,
      customLogo,
      logoColorMode,
      logoColorPalette,
      includeImages 
    } = body;

    if (!prompt || !websiteType || !sections) {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    const baseCredits = 1;
    const imageCredits = includeImages ? 3 : 0;
    const logoCredits = customLogo ? 3 : 0;
    const totalCredits = baseCredits + imageCredits + logoCredits;

    if (profile.credits_remaining < totalCredits) {
      return NextResponse.json({ error: `Need ${totalCredits} credits` }, { status: 402 });
    }

    console.log(`🎨 Starting generation: images=${includeImages ? '3' : '0'}, logo=${customLogo}`);

    // STEP 1: TWO-STEP GENERATION
    const content = await generateContent(prompt, websiteType, sections, vibe);
    console.log(`✅ Content generated with ${Object.keys(content).length} fields`);

    // STEP 2: Generate SIMPLE ICON logo if requested (like WeVibeCode.ai)
    let logoUrl = '';
    if (customLogo) {
      const logoColors = logoColorMode === 'ai' 
        ? await chooseLogoColors(prompt, websiteType, vibe)
        : logoColorPalette;
      
      logoUrl = await generateSimpleIconLogo(content.businessName, vibe, websiteType, logoColors);
      console.log(`✅ Logo generated: ${logoUrl ? 'success' : 'failed'}`);
    }

    // STEP 3: Choose website colors
    const colors = colorMode === 'ai' 
      ? await chooseColors(prompt, websiteType, vibe)
      : colorPalette;

    // STEP 4: Fetch HIGH-QUALITY, BRIGHT images (FIXED - No double enhancement)
    let images: any[] = [];
    if (includeImages && content.imageSearchTerms) {
      images = await fetchBrightImages(content.imageSearchTerms, websiteType, vibe);
      console.log(`✅ Images fetched: ${images.length}/3`);
    }

    // STEP 5: Build website
    const website = buildWebsite(content, sections, colors, images, logoUrl, websiteType, vibe);

    // STEP 6: Save
    const { data: preview, error: previewError } = await supabase
      .from('previews')
      .insert({
        user_id: user.id,
        title: prompt.substring(0, 100),
        html_content: website.html,
        css_content: website.css,
        js_content: website.js,
        preview_type: 'website',
        generation_prompt: prompt,
        generation_type: websiteType,
        credits_used: totalCredits,
      })
      .select()
      .single();

    if (previewError || !preview) {
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    await supabase
      .from('profiles')
      .update({ credits_remaining: profile.credits_remaining - totalCredits })
      .eq('id', user.id);

    await supabase.from('credits_log').insert({
      user_id: user.id,
      credits_used: totalCredits,
      action: 'generate_website',
      details: { preview_id: preview.id, custom_logo: customLogo, images: images.length },
    });

    console.log(`🎉 Generation complete! Preview ID: ${preview.id}`);

    return NextResponse.json({
      success: true,
      previewId: preview.id,
      creditsRemaining: profile.credits_remaining - totalCredits,
    });

  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

// ========================================
// STEP 1: EXPAND PROMPT (GPT-4o-mini)
// ========================================
async function expandPrompt(prompt: string, websiteType: string, vibe: string, sections: string[]): Promise<string> {
  console.log('📝 Step 1: Expanding prompt with GPT-4o-mini...');
  
  const expansionPrompt = `You are a professional copywriter and brand strategist. Expand this website brief into a detailed, creative content specification.

USER BRIEF: "${prompt}"
WEBSITE TYPE: ${websiteType}
VIBE: ${vibe}
SECTIONS REQUESTED: ${sections.join(', ')}

Create a comprehensive content plan that includes:
1. A creative, memorable business name (if not provided)
2. Detailed hero section concept (compelling headline, value proposition, CTA)
3. For EACH requested section, provide specific content ideas and messaging
4. Brand voice and tone guidelines
5. Unique selling points and key differentiators
6. Target audience insights
7. CRITICAL: Suggest SHORT, SPECIFIC Unsplash search terms (MAX 5-6 WORDS each, focus on "bright", quality, and atmosphere)

Write a detailed paragraph (250-350 words) describing:
- The business concept and unique value
- Content strategy for each section
- Brand personality and voice
- Visual direction (bright, professional images)
- Customer journey and messaging priorities
- SHORT, specific image search terms (5-6 words max)

Be creative, specific, and strategic. Think like a marketing director planning a high-converting website.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an expert copywriter and brand strategist with 15 years of experience.' },
      { role: 'user', content: expansionPrompt },
    ],
    temperature: 0.9,
    max_tokens: 600,
  });

  const expandedBrief = response.choices[0].message.content || prompt;
  console.log(`✅ Expanded brief: ${expandedBrief.length} characters`);
  return expandedBrief;
}

// ========================================
// IMPROVED IMAGE SEARCH TERMS (FIXED - SHORT TERMS)
// ========================================
async function generateContent(prompt: string, websiteType: string, sections: string[], vibe: string): Promise<any> {
  const expandedBrief = await expandPrompt(prompt, websiteType, vibe, sections);
  
  console.log('🎨 Step 2: Generating detailed content with GPT-4o...');
  
  // Build dynamic JSON schema
  let jsonSchema = `{
  "businessName": "Creative, memorable business name",
  "tagline": "Catchy one-liner tagline (10-15 words)",
  "hero": {
    "headline": "Compelling 5-10 word headline that grabs attention",
    "subtitle": "2-3 sentence value proposition explaining what you do and why it matters",
    "cta": "Action-oriented CTA button text (2-4 words)"
  },`;

  // Add sections dynamically
  if (sections.includes('about')) {
    jsonSchema += `
  "about": {
    "title": "Section title (2-4 words)",
    "text": "3-4 rich paragraphs telling your story, mission, and values (200-300 words total)",
    "highlights": ["Key point 1", "Key point 2", "Key point 3"]
  },`;
  }

  if (sections.includes('features') || sections.includes('services')) {
    jsonSchema += `
  "features": [
    {"icon": "relevant emoji", "title": "Feature/Service name", "description": "2-3 detailed sentences explaining the benefit and value"},
    {"icon": "relevant emoji", "title": "Feature/Service name", "description": "2-3 detailed sentences explaining the benefit and value"},
    {"icon": "relevant emoji", "title": "Feature/Service name", "description": "2-3 detailed sentences explaining the benefit and value"},
    {"icon": "relevant emoji", "title": "Feature/Service name", "description": "2-3 detailed sentences explaining the benefit and value"}
  ],`;
  }

  if (sections.includes('testimonials')) {
    jsonSchema += `
  "testimonials": [
    {"text": "Detailed, authentic testimonial with specific results or benefits (3-4 sentences)", "author": "Full Name", "role": "Job Title at Company Name"},
    {"text": "Detailed, authentic testimonial with specific results or benefits (3-4 sentences)", "author": "Full Name", "role": "Job Title at Company Name"},
    {"text": "Detailed, authentic testimonial with specific results or benefits (3-4 sentences)", "author": "Full Name", "role": "Job Title at Company Name"}
  ],`;
  }

  // FIXED: SHORT image search terms (5-6 words max)
  jsonSchema += `
  "imageSearchTerms": {
    "hero": "SHORT Unsplash search (MAX 5-6 WORDS). Example: 'bright restaurant interior sunlight' NOT 'bright modern restaurant interior natural sunlight plants professional photography'. CRITICAL: Keep it SHORT and SPECIFIC.",
    "about": "SHORT search (5-6 words max). Focus on: bright, professional, quality",
    "features": "SHORT search (5-6 words max). Include: bright, vibrant, daylight"
  }
}`;

  const contentPrompt = `Based on this detailed brief, create exceptional website content:

EXPANDED BRIEF:
${expandedBrief}

WEBSITE TYPE: ${websiteType}
VIBE: ${vibe}
SECTIONS TO CREATE: ${sections.join(', ')}

Generate comprehensive, professional content in this exact JSON structure:
${jsonSchema}

CRITICAL REQUIREMENTS FOR IMAGE SEARCH TERMS:
✅ Keep them SHORT - Maximum 5-6 words total
✅ Example GOOD: "bright restaurant interior daylight"
✅ Example BAD: "bright colorful modern restaurant interior natural sunlight elegant furniture professional photography high quality"
✅ Focus on: "bright" + subject + lighting
✅ NO brand names or trademarks
✅ Quality over quantity - SHORT and specific

OTHER REQUIREMENTS:
✅ Write RICH, DETAILED content - minimum 200 words for about section
✅ Make it sound ${vibe} in tone throughout
✅ Use professional, engaging copy that converts visitors
✅ Return ONLY valid JSON, no markdown formatting, no extra text`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { 
        role: 'system', 
        content: 'You are an elite copywriter with expertise in conversion optimization and brand storytelling. You create compelling, detailed website content that engages visitors and drives action. You excel at creating SHORT, SPECIFIC Unsplash search terms (5-6 words max). Return ONLY valid JSON with no markdown formatting.' 
      },
      { role: 'user', content: contentPrompt },
    ],
    temperature: 0.85,
    max_tokens: 4000,
  });

  const content = response.choices[0].message.content || '{}';
  
  try {
    let cleaned = content.trim()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const parsed = JSON.parse(cleaned);
    console.log(`✅ Content with image terms: ${parsed.imageSearchTerms?.hero || 'none'}`);
    return parsed;
  } catch (e: any) {
    console.error('❌ JSON parse error:', e.message);
    
    return {
      businessName: 'Business',
      tagline: 'Your tagline here',
      hero: { 
        headline: 'Welcome to Our Business', 
        subtitle: 'We provide excellent services to help you succeed.',
        cta: 'Get Started' 
      },
      imageSearchTerms: {
        hero: `bright ${websiteType} interior`,
        about: `bright professional ${websiteType}`,
        features: `bright modern ${websiteType}`
      }
    };
  }
}

// ========================================
// FIXED: FETCH BRIGHT IMAGES (NO DOUBLE ENHANCEMENT)
// ========================================
async function fetchBrightImages(searchTerms: any, websiteType: string, vibe: string): Promise<any[]> {
  const images: any[] = [];
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'demo') {
    console.error('❌ Unsplash API key missing');
    return [];
  }
  
  // FIXED: Use AI-generated terms directly, limit to 5 words, add only "bright professional"
  const prepareSearchTerm = (term: string): string => {
    // Take first 5 words from AI term
    const words = term.split(' ').slice(0, 5).join(' ');
    // Add only 2 enhancement words
    return `${words} bright professional`;
  };
  
  const enhancedTerms = [
    prepareSearchTerm(searchTerms?.hero || 'modern workspace'),
    prepareSearchTerm(searchTerms?.about || 'professional team'),
    prepareSearchTerm(searchTerms?.features || 'modern design')
  ];
  
  console.log('🖼️  Fetching BRIGHT images with LIMITED terms:');
  enhancedTerms.forEach((term, i) => {
    const wordCount = term.split(' ').length;
    console.log(`  ${i + 1}. ${term} (${wordCount} words)`);
  });
  
  for (let i = 0; i < enhancedTerms.length; i++) {
    const term = enhancedTerms[i];
    
    try {
      // Unsplash API with color and quality filters
      const response = await fetch(
        `https://api.unsplash.com/search/photos?` +
        `query=${encodeURIComponent(term)}` +
        `&per_page=3` +
        `&orientation=landscape` +
        `&content_filter=high`,
        {
          headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` }
        }
      );
      
      if (!response.ok) {
        if (response.status === 400) {
          console.error(`❌ Unsplash 400 Error: Query may be too long`);
          console.error(`   Query was: "${term}"`);
        } else {
          console.error(`❌ Unsplash error: ${response.status}`);
        }
        continue;
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Pick the brightest image from top 3 results
        let bestPhoto = data.results[0];
        let bestBrightness = 0;
        
        for (const photo of data.results) {
          const brightness = photo.color ? hexToBrightness(photo.color) : 0;
          if (brightness > bestBrightness) {
            bestBrightness = brightness;
            bestPhoto = photo;
          }
        }
        
        const brightness = hexToBrightness(bestPhoto.color);
        
        images.push({
          url: bestPhoto.urls.regular,
          photographer: bestPhoto.user.name,
          photographerUrl: bestPhoto.user.links.html,
          brightness: brightness > 160 ? 'light' : 'dark',
          rawBrightness: brightness
        });
        
        console.log(`✅ Image ${i + 1}: brightness=${brightness} by ${bestPhoto.user.name}`);
        
        // Trigger download tracking
        if (bestPhoto.links.download_location) {
          fetch(bestPhoto.links.download_location, {
            headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` }
          }).catch(() => {});
        }
      } else {
        console.warn(`⚠️  No images for: "${term}"`);
      }
    } catch (error: any) {
      console.error(`❌ Image fetch error:`, error.message);
    }
  }
  
  const avgBrightness = images.length > 0 
    ? Math.round(images.reduce((sum, img) => sum + (img.rawBrightness || 0), 0) / images.length)
    : 0;
  console.log(`📊 Fetched ${images.length}/3 images, avg brightness: ${avgBrightness}`);
  return images;
}

// Helper: Convert hex color to brightness value (0-255)
function hexToBrightness(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substr(0, 2), 16);
  const g = parseInt(clean.substr(2, 2), 16);
  const b = parseInt(clean.substr(4, 2), 16);
  return Math.round((r * 299 + g * 587 + b * 114) / 1000);
}

// ========================================
// LOGO COLOR GENERATION (WITH VARIETY)
// ========================================
async function chooseLogoColors(prompt: string, websiteType: string, vibe: string): Promise<any> {
  const colorPrompt = `Choose 2 VIBRANT, DIVERSE colors for a logo for "${prompt}" (${websiteType}, ${vibe} vibe).

IMPORTANT: Choose colors that are:
- DIFFERENT from the standard navy blue (#3B82F6)
- VIBRANT and eye-catching
- Appropriate for ${vibe} vibe
- Professional but distinctive

Vibe-specific suggestions:
- luxury: gold/purple, rose gold/navy, emerald/gold
- fun: orange/pink, lime/purple, coral/teal
- professional: teal/navy, forest green/charcoal, burgundy/gold
- minimal: charcoal/mint, slate/coral, black/gold
- bold: red/black, electric blue/orange, magenta/yellow
- calm: sage/lavender, sky blue/mint, seafoam/beige

Return JSON:
{"primary": "#HEX", "secondary": "#HEX"}

AVOID using: #3B82F6, #2196F3 (overused blues)
Return ONLY valid JSON.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a color theory expert. Return ONLY valid JSON with vibrant, diverse color choices.' },
      { role: 'user', content: colorPrompt },
    ],
    temperature: 0.9,
    max_tokens: 200,
  });

  const content = response.choices[0].message.content || '{}';
  try {
    let cleaned = content.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const colors = JSON.parse(cleaned);
    console.log(`🎨 Logo colors: ${colors.primary}, ${colors.secondary}`);
    return colors;
  } catch (e) {
    const fallbackColors: Record<string, any> = {
      luxury: { primary: '#D4AF37', secondary: '#8B4789' },
      fun: { primary: '#FF6B35', secondary: '#FF1654' },
      professional: { primary: '#008080', secondary: '#2C3E50' },
      minimal: { primary: '#2D3748', secondary: '#48BB78' },
      bold: { primary: '#E53E3E', secondary: '#000000' },
      calm: { primary: '#81C784', secondary: '#BA68C8' },
    };
    return fallbackColors[vibe] || { primary: '#D4AF37', secondary: '#8B4789' };
  }
}

// ========================================
// NEW: SIMPLE ICON LOGO (Like WeVibeCode.ai)
// ========================================
async function generateSimpleIconLogo(businessName: string, vibe: string, websiteType: string, logoColors: any): Promise<string> {
  try {
    const primary = logoColors.primary || '#D4AF37';
    const secondary = logoColors.secondary || '#8B4789';
    
    // SIMPLE ICON PROMPT - Like WeVibeCode.ai logo style
    const logoPrompt = `Create a simple, modern icon logo for "${businessName}".

Style: Minimalist geometric icon or abstract symbol. Clean, professional, memorable. Similar to tech company logos like Vercel, Stripe, or WeVibeCode.ai.

Requirements:
- SIMPLE geometric shape or abstract mark
- Uses ${primary} and ${secondary} colors
- Clean, flat design (no 3D effects)
- Works at small sizes (32px to 512px)
- Modern, professional aesthetic
- NO text or letters - just the icon
- NO complex illustrations or detailed drawings
- Think: circle, triangle, hexagon, waves, abstract shapes
- White or transparent background
- ${vibe} vibe

Examples of style:
- Geometric shapes with gradient
- Abstract letter mark
- Simple symbolic icon
- Flat, modern design`;

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: logoPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    return response.data?.[0]?.url || '';
  } catch (error) {
    console.error('Logo generation failed:', error);
    return '';
  }
}

async function chooseColors(prompt: string, websiteType: string, vibe: string): Promise<any> {
  const colorPrompt = `For "${prompt}" (${websiteType}, ${vibe} vibe), choose 2 colors for the WEBSITE theme.

Return JSON:
{"primary": "#HEX", "secondary": "#HEX"}

Return ONLY valid JSON.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Return ONLY valid JSON.' },
      { role: 'user', content: colorPrompt },
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  const content = response.choices[0].message.content || '{}';
  try {
    let cleaned = content.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    return JSON.parse(cleaned);
  } catch (e) {
    return { primary: '#3B82F6', secondary: '#06B6D4' };
  }
}

// ========================================
// MODERNIZED FONTS (2026 - No more Bebas Neue!)
// ========================================
function getFont(websiteType: string, vibe: string): { logo: string; heading: string; body: string } {
  const fonts: Record<string, Record<string, { logo: string; heading: string; body: string }>> = {
    restaurant: {
      professional: { logo: 'Space Grotesk', heading: 'Playfair Display', body: 'Inter' },
      fun: { logo: 'Outfit', heading: 'Fredoka', body: 'Poppins' },
      luxury: { logo: 'Cormorant Garamond', heading: 'Cinzel', body: 'Montserrat' },
      minimal: { logo: 'DM Sans', heading: 'DM Sans', body: 'IBM Plex Sans' },
      bold: { logo: 'Syne', heading: 'Oswald', body: 'Archivo' },
      calm: { logo: 'Lexend', heading: 'Raleway', body: 'Manrope' },
    },
    landing: {
      professional: { logo: 'Space Grotesk', heading: 'Montserrat', body: 'Inter' },
      fun: { logo: 'Outfit', heading: 'Baloo 2', body: 'Poppins' },
      luxury: { logo: 'Cormorant Garamond', heading: 'Playfair Display', body: 'Montserrat' },
      minimal: { logo: 'DM Sans', heading: 'DM Sans', body: 'IBM Plex Sans' },
      bold: { logo: 'Syne', heading: 'Barlow', body: 'Archivo' },
      calm: { logo: 'Lexend', heading: 'Karla', body: 'Manrope' },
    },
    portfolio: {
      professional: { logo: 'Space Grotesk', heading: 'IBM Plex Sans', body: 'Inter' },
      fun: { logo: 'Outfit', heading: 'Comfortaa', body: 'Poppins' },
      luxury: { logo: 'Cormorant Garamond', heading: 'Libre Baskerville', body: 'Montserrat' },
      minimal: { logo: 'DM Sans', heading: 'DM Sans', body: 'IBM Plex Sans' },
      bold: { logo: 'Syne', heading: 'Anton', body: 'Archivo' },
      calm: { logo: 'Lexend', heading: 'Lora', body: 'Manrope' },
    },
    business: {
      professional: { logo: 'Space Grotesk', heading: 'Roboto', body: 'Inter' },
      fun: { logo: 'Outfit', heading: 'Rubik', body: 'Poppins' },
      luxury: { logo: 'Cormorant Garamond', heading: 'Playfair Display', body: 'Montserrat' },
      minimal: { logo: 'DM Sans', heading: 'DM Sans', body: 'IBM Plex Sans' },
      bold: { logo: 'Syne', heading: 'Barlow Condensed', body: 'Archivo' },
      calm: { logo: 'Lexend', heading: 'Raleway', body: 'Manrope' },
    },
    blog: {
      professional: { logo: 'Space Grotesk', heading: 'PT Serif', body: 'Inter' },
      fun: { logo: 'Outfit', heading: 'Fredoka', body: 'Poppins' },
      luxury: { logo: 'Cormorant Garamond', heading: 'Playfair Display', body: 'Montserrat' },
      minimal: { logo: 'DM Sans', heading: 'DM Sans', body: 'IBM Plex Sans' },
      bold: { logo: 'Syne', heading: 'Passion One', body: 'Archivo' },
      calm: { logo: 'Lexend', heading: 'Lora', body: 'Manrope' },
    },
    ecommerce: {
      professional: { logo: 'Space Grotesk', heading: 'Poppins', body: 'Inter' },
      fun: { logo: 'Outfit', heading: 'Baloo 2', body: 'Poppins' },
      luxury: { logo: 'Cormorant Garamond', heading: 'Cinzel', body: 'Montserrat' },
      minimal: { logo: 'DM Sans', heading: 'DM Sans', body: 'IBM Plex Sans' },
      bold: { logo: 'Syne', heading: 'Oswald', body: 'Archivo' },
      calm: { logo: 'Lexend', heading: 'Karla', body: 'Manrope' },
    },
  };

  return fonts[websiteType]?.[vibe] || fonts.landing.professional;
}

function buildWebsite(
  content: any,
  sections: string[],
  colors: any,
  images: any[],
  logoUrl: string,
  websiteType: string,
  vibe: string
): { html: string; css: string; js: string } {
  
  const fonts = getFont(websiteType, vibe);
  const html = generateHTML(content, sections, images, logoUrl, websiteType);
  const css = generateCSS(colors, fonts, images, vibe);
  const js = generateJS();
  
  return { html, css, js };
}

function generateHTML(content: any, sections: string[], images: any[], logoUrl: string, websiteType: string): string {
  const heroImage = images[0];
  const secondImage = images[1];
  const thirdImage = images[2];
  
  const heroTextClass = heroImage?.brightness === 'light' ? 'hero-on-light' : 'hero-on-dark';
  
  let sectionsHTML = '';
  
  // Hero
  sectionsHTML += `
  <section class="hero ${heroTextClass}" id="home">
    ${heroImage ? `
    <div class="hero-image">
      <img src="${heroImage.url}" alt="Hero" id="heroImg">
      <div class="hero-overlay"></div>
    </div>
    ` : '<div class="hero-gradient"></div>'}
    <div class="hero-content">
      <h1>${content.hero?.headline || 'Welcome'}</h1>
      <p>${content.hero?.subtitle || ''}</p>
      <button class="cta-button">${content.hero?.cta || 'Get Started'}</button>
    </div>
  </section>`;
  
  // About section (FIXED - proper encoding)
  if (sections.includes('about') && content.about) {
    sectionsHTML += `
  <section class="section fade-in-section" id="about">
    <div class="container">
      <div class="section-grid">
        ${secondImage ? `<img src="${secondImage.url}" alt="About" class="section-image">` : ''}
        <div class="section-content">
          <h2>${content.about.title || 'About Us'}</h2>
          <p>${content.about.text || ''}</p>
          ${content.about.highlights ? `
          <ul class="highlights">
            ${content.about.highlights.map((h: string) => `<li>${h}</li>`).join('')}
          </ul>
          ` : ''}
        </div>
      </div>
    </div>
  </section>`;
  }
  
  // Features/Services
  if ((sections.includes('features') || sections.includes('services')) && content.features) {
    sectionsHTML += `
  <section class="section fade-in-section" id="services">
    <div class="container">
      ${thirdImage ? `<img src="${thirdImage.url}" alt="Feature" class="section-hero-image">` : ''}
      <h2 class="section-title">${sections.includes('services') ? 'Our Services' : 'Features'}</h2>
      <div class="cards-grid">
        ${content.features.map((f: any) => `
        <div class="card">
          <div class="card-icon">${f.icon || '✨'}</div>
          <h3>${f.title}</h3>
          <p>${f.description}</p>
        </div>
        `).join('')}
      </div>
    </div>
  </section>`;
  }
  
  // Testimonials
  if (sections.includes('testimonials') && content.testimonials) {
    sectionsHTML += `
  <section class="section testimonials-section fade-in-section">
    <div class="container">
      <h2 class="section-title">What Our Clients Say</h2>
      <div class="testimonials-grid">
        ${content.testimonials.map((t: any) => `
        <div class="testimonial">
          <p class="quote">"${t.text}"</p>
          <div class="author">
            <strong>${t.author}</strong>
            <span>${t.role}</span>
          </div>
        </div>
        `).join('')}
      </div>
    </div>
  </section>`;
  }
  
  // Contact
  if (sections.includes('contact')) {
    sectionsHTML += `
  <section class="section fade-in-section" id="contact">
    <div class="container">
      <h2 class="section-title">Get In Touch</h2>
      ${content.location ? `
      <div class="contact-info">
        <p>📍 ${content.location.address}</p>
        <p>🕐 ${content.location.hours}</p>
        <p>📞 ${content.location.phone}</p>
        <p>✉️ ${content.location.email}</p>
      </div>
      ` : ''}
      <form class="contact-form">
        <input type="text" placeholder="Your Name" required>
        <input type="email" placeholder="Your Email" required>
        <textarea placeholder="Your Message" rows="5" required></textarea>
        <button type="submit" class="cta-button">Send Message</button>
      </form>
    </div>
  </section>`;
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.businessName || 'Website'}</title>
  <style>STYLES_PLACEHOLDER</style>
</head>
<body>
  <header class="header">
    <div class="container">
      <div class="nav-wrapper">
        <div class="logo">
          ${logoUrl ? `<img src="${logoUrl}" alt="${content.businessName}" class="logo-image">` : '<span class="logo-icon">✨</span>'}
          <span class="logo-text">${content.businessName || 'Business'}</span>
        </div>
        <nav class="nav-desktop">
          <a href="#home">Home</a>
          ${sections.includes('about') ? '<a href="#about">About</a>' : ''}
          ${sections.includes('services') || sections.includes('features') ? '<a href="#services">Services</a>' : ''}
          ${sections.includes('contact') ? '<a href="#contact">Contact</a>' : ''}
        </nav>
        <button class="mobile-toggle" onclick="toggleMobileMenu()" aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
    <div class="mobile-menu" id="mobileMenu">
      <a href="#home" onclick="closeMobileMenu()">Home</a>
      ${sections.includes('about') ? '<a href="#about" onclick="closeMobileMenu()">About</a>' : ''}
      ${sections.includes('services') || sections.includes('features') ? '<a href="#services" onclick="closeMobileMenu()">Services</a>' : ''}
      ${sections.includes('contact') ? '<a href="#contact" onclick="closeMobileMenu()">Contact</a>' : ''}
    </div>
  </header>

  ${sectionsHTML}

  <footer class="footer">
    <div class="container">
      <p>&copy; 2026 ${content.businessName}. All rights reserved.</p>
      ${content.tagline ? `<p class="tagline">${content.tagline}</p>` : ''}
      ${images.length > 0 ? `<p class="credits">Photos: ${images.map(img => img.photographer).join(', ')}</p>` : ''}
    </div>
  </footer>
  
  <script>SCRIPTS_PLACEHOLDER</script>
</body>
</html>`;
}

// ========================================
// MODERNIZED CSS WITH LOGO GRADIENTS
// ========================================
function generateCSS(colors: any, fonts: { logo: string; heading: string; body: string }, images: any[], vibe: string): string {
  const primary = colors.primary || '#3B82F6';
  const secondary = colors.secondary || '#06B6D4';
  
  const heroImage = images[0];
  const isHeroLight = heroImage?.brightness === 'light';
  
  // Logo gradients per vibe
  const logoGradients: Record<string, string> = {
    professional: `linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)`,
    luxury: `linear-gradient(135deg, #d4af37 0%, #f4e4c1 50%, #d4af37 100%)`,
    fun: `linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #48dbfb 100%)`,
    minimal: `linear-gradient(135deg, #1f2937 0%, #4b5563 100%)`,
    bold: `linear-gradient(135deg, #dc2626 0%, #000000 100%)`,
    calm: `linear-gradient(135deg, #10b981 0%, #3b82f6 100%)`
  };
  
  const logoGradient = logoGradients[vibe] || logoGradients.professional;
  
  // Build Google Fonts import
  const fontsToImport = Array.from(new Set([fonts.logo, fonts.heading, fonts.body]))
    .map(font => font.replace(/ /g, '+') + ':wght@400;500;600;700;800;900')
    .join('&family=');
  
  return `@import url('https://fonts.googleapis.com/css2?family=${fontsToImport}&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  font-family: '${fonts.body}', -apple-system, sans-serif;
  color: #0f172a;
  line-height: 1.6;
  background: #ffffff;
  overflow-x: hidden;
}

.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

/* HEADER */
.header {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  z-index: 1000;
}

.nav-wrapper { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; }

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-image {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 8px;
}

.logo-icon {
  font-size: 32px;
}

/* MODERN LOGO TEXT WITH GRADIENT */
.logo-text {
  font-family: '${fonts.logo}', sans-serif;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: ${logoGradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: all 0.3s ease;
}

/* Fallback for browsers that don't support gradient text */
@supports not (background-clip: text) {
  .logo-text {
    color: ${primary};
  }
}

.logo-text:hover {
  filter: brightness(1.1);
  transform: scale(1.02);
}

.nav-desktop { display: flex; gap: 32px; }
.nav-desktop a { 
  text-decoration: none; 
  color: #64748b; 
  font-family: '${fonts.body}', sans-serif;
  font-weight: 500; 
  transition: color 0.2s; 
}
.nav-desktop a:hover { color: ${primary}; }

.mobile-toggle { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; }
.mobile-toggle span { width: 24px; height: 2px; background: #0f172a; transition: all 0.3s; }

.mobile-menu { display: none; background: white; max-height: 0; overflow: hidden; transition: max-height 0.3s; }
.mobile-menu.active { max-height: 300px; }
.mobile-menu a { display: block; padding: 16px 24px; text-decoration: none; color: #0f172a; border-bottom: 1px solid rgba(15, 23, 42, 0.05); font-family: '${fonts.body}', sans-serif; }

@media (max-width: 768px) {
  .nav-desktop { display: none; }
  .mobile-toggle { display: flex; }
  .mobile-menu { display: block; }
}

/* HERO - COMFORTABLE GRADIENTS (70% LIGHTER) */
.hero { 
  position: relative; 
  min-height: 80vh; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  overflow: hidden; 
}

.hero-image { 
  position: absolute; 
  inset: 0; 
  z-index: 0;
}

.hero-image img { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
  filter: brightness(1.1) saturate(1.2);
  will-change: transform;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
}

/* FIXED: 70% lighter overlay */
.hero-on-dark .hero-overlay {
  background: linear-gradient(135deg, rgba(0,0,0,0.2), rgba(0,0,0,0.1));
}

.hero-on-dark .hero-content h1 {
  background: linear-gradient(135deg, #ffffff 0%, ${primary} 50%, ${secondary} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3)) drop-shadow(0 1px 4px rgba(0, 0, 0, 0.2));
}

.hero-on-dark .hero-content p {
  color: #ffffff;
  text-shadow: 
    0 1px 4px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

.hero-on-light .hero-overlay {
  background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
}

.hero-on-light .hero-content h1 {
  background: linear-gradient(135deg, ${primary} 0%, ${secondary} 50%, #0f172a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 6px rgba(255, 255, 255, 0.6)) drop-shadow(0 1px 3px rgba(255, 255, 255, 0.4));
}

.hero-on-light .hero-content p {
  color: #0f172a;
  text-shadow: 
    0 1px 3px rgba(255, 255, 255, 0.6),
    0 2px 6px rgba(255, 255, 255, 0.3);
}

.hero-gradient { 
  position: absolute; 
  inset: 0; 
  background: linear-gradient(135deg, ${primary}08, ${secondary}08); 
  z-index: 0;
}

.hero-content { 
  position: relative; 
  z-index: 2; 
  text-align: center; 
  padding: 80px 24px; 
  max-width: 900px; 
}

.hero-content h1 {
  font-family: '${fonts.heading}', sans-serif;
  font-size: 68px;
  font-weight: 900;
  margin-bottom: 28px;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

@supports not (background-clip: text) {
  .hero-on-dark .hero-content h1 {
    color: #ffffff;
    text-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.3),
      0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  .hero-on-light .hero-content h1 {
    color: #0f172a;
    text-shadow: 
      0 2px 4px rgba(255, 255, 255, 0.6),
      0 4px 10px rgba(255, 255, 255, 0.3);
  }
}

.hero-content p { 
  font-family: '${fonts.body}', sans-serif;
  font-size: 24px; 
  margin-bottom: 36px; 
  font-weight: 500;
  opacity: 0.98;
  line-height: 1.5;
}

.cta-button {
  padding: 18px 48px;
  font-size: 17px;
  font-weight: 700;
  font-family: '${fonts.body}', sans-serif;
  color: white;
  background: linear-gradient(135deg, ${primary}, ${secondary});
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 6px 20px ${primary}40;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cta-button:hover { 
  transform: translateY(-3px); 
  box-shadow: 0 10px 32px ${primary}50; 
}

/* SECTIONS */
.section { 
  padding: 120px 24px;
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.section.fade-in-section.visible {
  opacity: 1;
  transform: translateY(0);
}

.section:nth-child(even) { background: #f8fafc; }

.section-title {
  font-family: '${fonts.heading}', sans-serif;
  text-align: center;
  font-size: 48px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 64px;
  letter-spacing: -0.02em;
}

.section-grid { 
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  gap: 80px; 
  align-items: center; 
}

.section-image { 
  width: 100%; 
  border-radius: 20px; 
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
  transition: transform 0.3s;
  filter: brightness(1.1) saturate(1.1);
}

.section-image:hover {
  transform: scale(1.02);
}

.section-hero-image {
  width: 100%;
  max-height: 450px;
  object-fit: cover;
  border-radius: 20px;
  margin-bottom: 48px;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
  filter: brightness(1.1) saturate(1.1);
}

.section-content h2 { 
  font-family: '${fonts.heading}', sans-serif; 
  font-size: 40px; 
  font-weight: 800; 
  margin-bottom: 24px;
  letter-spacing: -0.02em;
}

.section-content p { 
  font-family: '${fonts.body}', sans-serif; 
  font-size: 18px; 
  color: #475569; 
  line-height: 1.8;
  margin-bottom: 16px;
}

/* MODERN LIST STYLING (FIXED ENCODING) */
.highlights {
  list-style: none;
  margin-top: 24px;
  padding: 0;
}

.highlights li {
  position: relative;
  padding-left: 32px;
  margin-bottom: 16px;
  font-family: '${fonts.body}', sans-serif;
  font-size: 17px;
  color: #475569;
  font-weight: 500;
  line-height: 1.6;
}

.highlights li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  width: 20px;
  height: 20px;
  background: ${primary};
  border-radius: 50%;
  opacity: 0.15;
}

.highlights li::after {
  content: '✓';
  position: absolute;
  left: 5px;
  top: 6px;
  color: ${primary};
  font-weight: 700;
  font-size: 14px;
}

.cards-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
  gap: 32px; 
}

.card {
  padding: 40px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  transition: all 0.3s;
}

.card:hover { 
  transform: translateY(-6px); 
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.1); 
  border-color: ${primary}30; 
}

.card-icon { 
  font-size: 48px; 
  margin-bottom: 20px; 
}

.card h3 { 
  font-family: '${fonts.heading}', sans-serif; 
  font-size: 22px; 
  font-weight: 700; 
  margin-bottom: 14px;
  color: #0f172a;
}

.card p { 
  font-family: '${fonts.body}', sans-serif; 
  color: #64748b; 
  line-height: 1.7;
  font-size: 16px;
}

.testimonials-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); 
  gap: 32px; 
}

.testimonial { 
  padding: 40px; 
  background: white; 
  border-radius: 20px; 
  border: 1px solid rgba(15, 23, 42, 0.08);
  transition: all 0.3s;
}

.testimonial:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
}

.quote { 
  font-family: '${fonts.body}', sans-serif; 
  font-size: 17px; 
  color: #475569; 
  font-style: italic; 
  margin-bottom: 24px;
  line-height: 1.7;
}

.author strong { 
  font-family: '${fonts.heading}', sans-serif; 
  display: block; 
  color: #0f172a; 
  margin-bottom: 6px;
  font-weight: 700;
}

.author span { 
  font-family: '${fonts.body}', sans-serif; 
  font-size: 14px; 
  color: #64748b; 
}

.contact-info {
  text-align: center;
  margin-bottom: 48px;
}

.contact-info p {
  font-size: 17px;
  color: #475569;
  margin: 12px 0;
}

.contact-form { 
  max-width: 600px; 
  margin: 0 auto; 
}

.contact-form input,
.contact-form textarea {
  width: 100%;
  padding: 18px 24px;
  margin-bottom: 20px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  font-family: '${fonts.body}', sans-serif;
  font-size: 16px;
  transition: border-color 0.2s;
}

.contact-form input:focus,
.contact-form textarea:focus {
  outline: none;
  border-color: ${primary};
}

.footer { 
  padding: 60px 24px; 
  background: #0f172a; 
  color: #94a3b8; 
  text-align: center; 
}

.footer p { 
  font-family: '${fonts.body}', sans-serif;
  margin: 8px 0;
}

.footer .tagline {
  color: #64748b;
  font-style: italic;
  font-size: 15px;
}

.credits { 
  margin-top: 16px; 
  font-size: 13px; 
  opacity: 0.7; 
}

@media (max-width: 768px) {
  .hero-content h1 { font-size: 42px; }
  .hero-content p { font-size: 18px; }
  .section-title { font-size: 36px; }
  .section-grid { grid-template-columns: 1fr; }
  .cards-grid { grid-template-columns: 1fr; }
  .section { padding: 80px 20px; }
  .logo-text { font-size: 22px; }
}`;
}

function generateJS(): string {
  return `function toggleMobileMenu() {
  document.getElementById('mobileMenu').classList.toggle('active');
}

function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('active');
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMobileMenu();
    }
  });
});

// Parallax effect
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const heroImg = document.getElementById('heroImg');
  
  if (heroImg) {
    heroImg.style.transform = \`translateY(\${scrolled * 0.5}px)\`;
  }
});

// Fade-in sections on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.querySelectorAll('.fade-in-section').forEach(section => {
  observer.observe(section);
});

// Form submission
const forms = document.querySelectorAll('form');
forms.forEach(form => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thank you for your message! We\\'ll get back to you soon.');
    form.reset();
  });
});`;
}
