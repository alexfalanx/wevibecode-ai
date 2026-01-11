// app/api/generate-website/route.ts
// COMPLETE v6.0 - HTML5UP TEMPLATE SYSTEM INTEGRATED! 🎨
// ✅ NEW: 10 HTML5UP templates - AI picks best for business type
// ✅ NEW: Content injection into professional templates  
// ✅ NEW: Dynamic color customization per template
// Previous: Pexels images, Gallery, Testimonials, Menu, Logo fixes
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import OpenAI from 'openai';
// Note: Using custom HTML builder instead of HTML5UP templates
// import { selectTemplate, generateFromTemplate } from '../../../templates/template-system';

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
    console.log(`📋 DEBUG - customLogo: ${customLogo} (type: ${typeof customLogo})`);

    // STEP 1: TWO-STEP GENERATION
    const content = await generateContent(prompt, websiteType, sections, vibe);
    console.log(`✅ Content generated with ${Object.keys(content).length} fields`);

    // STEP 2: Generate SIMPLE ICON logo if requested (like WeVibeCode.ai)
    let logoUrl = '';
    if (customLogo) {
      console.log(`✅ customLogo is TRUE - generating logo...`);
      const logoColors = logoColorMode === 'ai' 
        ? await chooseLogoColors(prompt, websiteType, vibe)
        : logoColorPalette;
      
      logoUrl = await generateSimpleIconLogo(content.businessName, vibe, websiteType, logoColors);
      console.log(`✅ Logo generated: ${logoUrl ? 'success' : 'failed'}`);
    } else {
      console.log(`⏭️  customLogo is FALSE - skipping logo generation`);
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

    // STEP 5: Build custom website with proper sections
    console.log(`🏗️  Building custom website for ${websiteType}...`);
    const { html, css, js } = buildWebsite(content, sections, colors, images, logoUrl, websiteType, vibe);

    if (!html) {
      throw new Error('Website generation failed');
    }

    // Combine HTML with inline CSS and JS
    const finalHtml = html
      .replace('STYLES_PLACEHOLDER', css)
      .replace('SCRIPTS_PLACEHOLDER', js);

    console.log(`✅ Custom website built: ${Math.round(finalHtml.length / 1024)}KB`);

    // STEP 6: Save
    const { data: preview, error: previewError } = await supabase
      .from('previews')
      .insert({
        user_id: user.id,
        title: prompt.substring(0, 100),
        html_content: finalHtml,
        css_content: '', // CSS is inlined in HTML
        js_content: '', // JS is inlined in HTML
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

  if (sections.includes('menu')) {
    jsonSchema += `
  "menu": {
    "title": "Menu section title",
    "categories": [
      {
        "name": "Category 1 name (e.g., Appetizers, Starters, Cold Dishes)",
        "items": [
          {"name": "Actual dish name 1", "description": "Brief appetizing description", "price": "$XX"},
          {"name": "Actual dish name 2", "description": "Brief appetizing description", "price": "$XX"},
          {"name": "Actual dish name 3", "description": "Brief appetizing description", "price": "$XX"},
          {"name": "Actual dish name 4", "description": "Brief appetizing description", "price": "$XX"}
        ]
      },
      {
        "name": "Category 2 name (e.g., Main Dishes, Entrees, Signature Items)",
        "items": [
          {"name": "Actual dish name 1", "description": "Brief appetizing description", "price": "$XX"},
          {"name": "Actual dish name 2", "description": "Brief appetizing description", "price": "$XX"},
          {"name": "Actual dish name 3", "description": "Brief appetizing description", "price": "$XX"},
          {"name": "Actual dish name 4", "description": "Brief appetizing description", "price": "$XX"}
        ]
      },
      {
        "name": "Category 3 name (e.g., Desserts, Drinks, Sides)",
        "items": [
          {"name": "Actual item name 1", "description": "Brief appetizing description", "price": "$XX"},
          {"name": "Actual item name 2", "description": "Brief appetizing description", "price": "$XX"},
          {"name": "Actual item name 3", "description": "Brief appetizing description", "price": "$XX"}
        ]
      }
    ]
  },`;
  }

  if (sections.includes('testimonials')) {
    jsonSchema += `
  "testimonials": [
    {"text": "Detailed, authentic testimonial with specific results or benefits (3-4 sentences)", "author": "Full Name", "role": "Job Title at Company Name"},
    {"text": "Detailed, authentic testimonial with specific results or benefits (3-4 sentences)", "author": "Full Name", "role": "Job Title at Company Name"},
    {"text": "Detailed, authentic testimonial with specific results or benefits (3-4 sentences)", "author": "Full Name", "role": "Job Title at Company Name"}
  ],`;
  }

  if (sections.includes('gallery')) {
    jsonSchema += `
  "gallery": {
    "title": "Gallery section title (2-4 words)",
    "items": ["Description for image 1", "Description for image 2", "Description for image 3", "Description for image 4", "Description for image 5", "Description for image 6"]
  },`;
  }

  if (sections.includes('pricing')) {
    jsonSchema += `
  "pricing": {
    "title": "Pricing section title",
    "plans": [
      {"name": "Plan Name", "price": "$XX/month", "description": "Brief description of this plan", "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"], "cta": "Get Started", "featured": false},
      {"name": "Plan Name", "price": "$XX/month", "description": "Brief description of this plan", "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"], "cta": "Get Started", "featured": true},
      {"name": "Plan Name", "price": "$XX/month", "description": "Brief description of this plan", "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5", "Feature 6"], "cta": "Contact Us", "featured": false}
    ]
  },`;
  }

  if (sections.includes('faq')) {
    jsonSchema += `
  "faq": {
    "title": "FAQ section title",
    "items": [
      {"question": "Specific question customers ask?", "answer": "Detailed, helpful answer (2-3 sentences)"},
      {"question": "Specific question customers ask?", "answer": "Detailed, helpful answer (2-3 sentences)"},
      {"question": "Specific question customers ask?", "answer": "Detailed, helpful answer (2-3 sentences)"},
      {"question": "Specific question customers ask?", "answer": "Detailed, helpful answer (2-3 sentences)"},
      {"question": "Specific question customers ask?", "answer": "Detailed, helpful answer (2-3 sentences)"}
    ]
  },`;
  }

  if (sections.includes('team')) {
    jsonSchema += `
  "team": {
    "title": "Team section title",
    "members": [
      {"name": "Full Name", "role": "Job Title", "bio": "Brief bio describing their expertise and role (2-3 sentences)"},
      {"name": "Full Name", "role": "Job Title", "bio": "Brief bio describing their expertise and role (2-3 sentences)"},
      {"name": "Full Name", "role": "Job Title", "bio": "Brief bio describing their expertise and role (2-3 sentences)"},
      {"name": "Full Name", "role": "Job Title", "bio": "Brief bio describing their expertise and role (2-3 sentences)"}
    ]
  },`;
  }

  if (sections.includes('stats')) {
    jsonSchema += `
  "stats": {
    "title": "Stats section title",
    "items": [
      {"number": "500+", "label": "Metric Label"},
      {"number": "10K+", "label": "Metric Label"},
      {"number": "15", "label": "Metric Label"},
      {"number": "99%", "label": "Metric Label"}
    ]
  },`;
  }

  if (sections.includes('how_it_works')) {
    jsonSchema += `
  "howItWorks": {
    "title": "How It Works section title",
    "steps": [
      {"title": "Step 1 Title", "description": "Detailed description of what happens in this step (2-3 sentences)"},
      {"title": "Step 2 Title", "description": "Detailed description of what happens in this step (2-3 sentences)"},
      {"title": "Step 3 Title", "description": "Detailed description of what happens in this step (2-3 sentences)"},
      {"title": "Step 4 Title", "description": "Detailed description of what happens in this step (2-3 sentences)"}
    ]
  },`;
  }

  if (sections.includes('newsletter')) {
    jsonSchema += `
  "newsletter": {
    "title": "Newsletter section title",
    "description": "Compelling reason to subscribe (1-2 sentences)"
  },`;
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
${websiteType === 'restaurant' ? `
🍽️ RESTAURANT-SPECIFIC: Be VERY specific about cuisine type
✅ For ramen: "ramen noodles bowl japanese" (NOT "restaurant interior")
✅ For Italian: "pasta carbonara italian food" (NOT "restaurant interior")
✅ For cafe: "coffee latte art beans" (NOT "restaurant interior")
✅ For sushi: "sushi rolls nigiri japanese" (NOT "restaurant interior")
✅ Focus on the ACTUAL FOOD/DISH, not generic restaurant
` : ''}
✅ Keep them SHORT - Maximum 5-6 words total
✅ Example GOOD: "bright restaurant interior daylight"
✅ Example BAD: "bright colorful modern restaurant interior natural sunlight elegant furniture professional photography high quality"
✅ Focus on: "bright" + specific subject + lighting
✅ NO brand names or trademarks
✅ Quality over quantity - SHORT and specific

OTHER REQUIREMENTS:
✅ Write RICH, DETAILED content - minimum 200 words for about section
✅ Make it sound ${vibe} in tone throughout
✅ Use professional, engaging copy that converts visitors
${sections.includes('menu') ? `
✅ MENU CRITICAL: Generate EXACTLY the structure shown above:
   - Category 1: 4 complete items with unique names, descriptions, and prices
   - Category 2: 4 complete items with unique names, descriptions, and prices
   - Category 3: 3 complete items with unique names, descriptions, and prices
   - Total: 11 menu items (NOT 3, NOT 6, but 11 items)
   - Each item MUST have: actual dish name, appetizing description, realistic price
` : ''}
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
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

  // CRITICAL: Check if API key exists
  if (!PEXELS_API_KEY || PEXELS_API_KEY === 'demo') {
    console.error('❌ CRITICAL: Pexels API key missing!');
    console.error('   Set PEXELS_API_KEY in Vercel environment variables');
    console.error('   Get free key at: https://www.pexels.com/api/');
    console.error('   Returning empty images array - website will have no images');
    return [];
  }

  console.log('🔑 Pexels API key found:', PEXELS_API_KEY.substring(0, 10) + '...');

  // PEXELS: Use AI-generated terms directly, limit to 5 words
  const prepareSearchTerm = (term: string): string => {
    // Take first 5 words from AI term
    const words = term.split(' ').slice(0, 5).join(' ');
    // Pexels handles quality filtering automatically
    return words;
  };

  const searchQueries = [
    prepareSearchTerm(searchTerms?.hero || 'modern workspace'),
    prepareSearchTerm(searchTerms?.about || 'professional team'),
    prepareSearchTerm(searchTerms?.features || 'modern design')
  ];

  console.log('🖼️  Fetching HIGH-QUALITY images from Pexels:');
  searchQueries.forEach((term, i) => {
    console.log(`  ${i + 1}. "${term}"`);
  });

  for (let i = 0; i < searchQueries.length; i++) {
    const query = searchQueries[i];

    try {
      const apiUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
      console.log(`📡 Fetching: ${apiUrl}`);

      // Pexels API - Better quality, better curation
      const response = await fetch(apiUrl, {
        headers: { 'Authorization': PEXELS_API_KEY }
      });

      console.log(`📥 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Pexels API error: ${response.status} - ${errorText}`);
        continue;
      }

      const data = await response.json();
      console.log(`📊 Pexels returned ${data.photos?.length || 0} photos for "${query}"`);

      if (data.photos && data.photos.length > 0) {
        // Pexels returns high-quality, curated photos
        // Pick the first result (Pexels curates well)
        const photo = data.photos[0];

        // Calculate brightness from image dimensions (Pexels doesn't provide color hex)
        // We'll use a heuristic: landscape photos are typically well-lit
        const brightness = 180; // Pexels photos are consistently bright

        images.push({
          url: photo.src.large2x || photo.src.large, // High quality version
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url,
          brightness: 'light',
          rawBrightness: brightness,
          alt: photo.alt || query
        });

        console.log(`✅ Image ${i + 1}: ${photo.width}x${photo.height} by ${photo.photographer}`);
        console.log(`   URL: ${photo.src.large2x || photo.src.large}`);
      } else {
        console.warn(`⚠️  No images found for: "${query}"`);
      }
    } catch (error: any) {
      console.error(`❌ Image fetch error for "${query}":`, error.message);
      console.error(`   Stack:`, error.stack);
    }
  }

  const avgBrightness = images.length > 0
    ? Math.round(images.reduce((sum, img) => sum + (img.rawBrightness || 0), 0) / images.length)
    : 0;
  console.log(`📊 FINAL RESULT: Fetched ${images.length}/3 images, avg brightness: ${avgBrightness}`);

  if (images.length === 0) {
    console.error('⚠️  WARNING: No images were fetched! Website will have no images.');
  }

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
    
    // Type-specific ULTRA-SIMPLE icon descriptions (emoji-style)
    const iconExamples: { [key: string]: string } = {
      restaurant: 'Two simple lines forming a fork and knife crossed in an X shape. JUST 2 LINES, like an emoji.',
      cafe: 'Simple coffee cup outline, single color. Like ☕ emoji but flat.',
      business: 'Simple briefcase outline. One rectangle with handle on top. Like 💼 emoji but flat.',
      professional: 'Simple handshake icon. Two hands meeting. Like 🤝 emoji but flat.',
      healthcare: 'Simple plus sign or cross. Like ➕ emoji.',
      salon: 'Two scissors blades in an X. Like ✂️ emoji but flat.',
      real_estate: 'Simple house outline. Triangle roof on square. Like 🏠 emoji but flat.',
      ecommerce: 'Simple shopping bag. Rectangle with two handles. Like 🛍️ emoji but flat.',
      landing: 'Simple rocket outline pointing up. Like 🚀 emoji but flat.',
    };
    
    const example = iconExamples[websiteType] || 'Simple geometric circle or triangle';
    
    // BRUTALLY SIMPLE PROMPT - Pretend you're making an emoji
    const logoPrompt = `Create a FLAT, SIMPLE icon. Think emoji-style, but just the outline.

EXACTLY LIKE THIS: ${example}

CRITICAL RULES (DALL-E MUST FOLLOW):
✅ Flat 2D design - NO perspective, NO depth, NO shadows
✅ Maximum 2-3 simple shapes (lines, circles, rectangles)
✅ Single solid color OR simple two-tone (${primary} and ${secondary})
✅ White or transparent background
✅ Clean edges, no details
✅ Size: Works at 32px (like an emoji)
✅ Style: Like iOS emoji, Material Icons, or Heroicons

❌ ABSOLUTELY FORBIDDEN:
❌ No gradients or color blending
❌ No 3D effects or depth
❌ No realistic objects
❌ No complex illustrations
❌ No scenes or compositions
❌ No decorative flourishes
❌ No text or letters
❌ Nothing that looks like "artwork"

IMAGINE: You're designing an emoji for ${websiteType}. Make it THAT simple.

If restaurant: Just show ╳ (two crossing lines for fork/knife)
If medical: Just show + (a plus sign)
If business: Just show ▭ with tiny handle (briefcase outline)

Keep it STUPID SIMPLE. Emoji-level simple.`;

    console.log(`🎨 Generating ULTRA-SIMPLE ${websiteType} logo...`);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: logoPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const url = response.data?.[0]?.url || '';
    console.log(`✅ Logo generated: ${url ? 'SUCCESS' : 'FAILED'}`);
    return url;
  } catch (error) {
    console.error('❌ Logo generation failed:', error);
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
  
  // Menu Section (for restaurants)
  if (sections.includes('menu') && content.menu) {
    sectionsHTML += `
  <section class="section fade-in-section" id="menu">
    <div class="container">
      <h2 class="section-title">${content.menu.title || 'Our Menu'}</h2>
      <div class="menu-container">
        ${content.menu.categories ? content.menu.categories.map((category: any) => `
        <div class="menu-category">
          <h3 class="menu-category-title">${category.name}</h3>
          <div class="menu-items">
            ${category.items ? category.items.map((item: any) => `
            <div class="menu-item">
              <div class="menu-item-header">
                <h4 class="menu-item-name">${item.name}</h4>
                <span class="menu-item-price">${item.price}</span>
              </div>
              <p class="menu-item-description">${item.description}</p>
            </div>
            `).join('') : ''}
          </div>
        </div>
        `).join('') : ''}
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
    const avatarColors = ['#3B82F6', '#A855F7', '#EC4899', '#10B981', '#F97316', '#EF4444'];
    
    sectionsHTML += `
  <section class="section testimonials-section fade-in-section">
    <div class="container">
      <h2 class="section-title">What Our Clients Say</h2>
      <div class="testimonials-grid">
        ${content.testimonials.map((t: any, idx: number) => {
          const initial = t.author ? t.author.charAt(0).toUpperCase() : '?';
          const avatarColor = avatarColors[idx % avatarColors.length];
          return `
        <div class="testimonial">
          <div class="testimonial-header">
            <div class="testimonial-avatar" style="background: ${avatarColor};">
              ${initial}
            </div>
            <div class="author">
              <strong>${t.author}</strong>
              <span>${t.role}</span>
            </div>
          </div>
          <p class="quote">"${t.text}"</p>
        </div>
        `;
        }).join('')}
      </div>
    </div>
  </section>`;
  }
  
  // Gallery
  if (sections.includes('gallery') && content.gallery) {
    sectionsHTML += `
  <section class="section fade-in-section" id="gallery">
    <div class="container">
      <h2 class="section-title">${content.gallery.title || 'Gallery'}</h2>
      <div class="gallery-grid">
        ${content.gallery.items && images.length > 0 ? content.gallery.items.slice(0, images.length).map((item: string, idx: number) => `
        <div class="gallery-item">
          <img src="${images[idx].url}" alt="Gallery ${idx + 1}">
          <div class="gallery-overlay">
            <p>${item}</p>
          </div>
        </div>
        `).join('') : ''}
      </div>
    </div>
  </section>`;
  }
  
  // Pricing
  if (sections.includes('pricing') && content.pricing) {
    sectionsHTML += `
  <section class="section fade-in-section" id="pricing">
    <div class="container">
      <h2 class="section-title">${content.pricing.title || 'Pricing Plans'}</h2>
      <div class="pricing-grid">
        ${content.pricing.plans ? content.pricing.plans.map((plan: any) => `
        <div class="pricing-card ${plan.featured ? 'featured' : ''}">
          ${plan.featured ? '<div class="pricing-badge">Most Popular</div>' : ''}
          <h3>${plan.name}</h3>
          <div class="price">${plan.price}</div>
          <p class="price-description">${plan.description || ''}</p>
          <ul class="pricing-features">
            ${plan.features ? plan.features.map((f: string) => `<li>${f}</li>`).join('') : ''}
          </ul>
          <button class="cta-button ${plan.featured ? '' : 'secondary'}">${plan.cta || 'Choose Plan'}</button>
        </div>
        `).join('') : ''}
      </div>
    </div>
  </section>`;
  }
  
  // FAQ
  if (sections.includes('faq') && content.faq) {
    sectionsHTML += `
  <section class="section fade-in-section" id="faq">
    <div class="container">
      <h2 class="section-title">${content.faq.title || 'Frequently Asked Questions'}</h2>
      <div class="faq-list">
        ${content.faq.items ? content.faq.items.map((item: any) => `
        <div class="faq-item">
          <h3 class="faq-question" onclick="this.parentElement.classList.toggle('active')">
            ${item.question}
            <span class="faq-icon">+</span>
          </h3>
          <div class="faq-answer">
            <p>${item.answer}</p>
          </div>
        </div>
        `).join('') : ''}
      </div>
    </div>
  </section>`;
  }
  
  // Team
  if (sections.includes('team') && content.team) {
    sectionsHTML += `
  <section class="section fade-in-section" id="team">
    <div class="container">
      <h2 class="section-title">${content.team.title || 'Meet Our Team'}</h2>
      <div class="team-grid">
        ${content.team.members ? content.team.members.map((member: any) => `
        <div class="team-member">
          <div class="team-member-image">
            <div class="team-initial">${member.name ? member.name.charAt(0) : '?'}</div>
          </div>
          <h3>${member.name}</h3>
          <p class="team-role">${member.role}</p>
          <p class="team-bio">${member.bio || ''}</p>
        </div>
        `).join('') : ''}
      </div>
    </div>
  </section>`;
  }
  
  // Stats
  if (sections.includes('stats') && content.stats) {
    sectionsHTML += `
  <section class="section stats-section fade-in-section" id="stats">
    <div class="container">
      <h2 class="section-title">${content.stats.title || 'By The Numbers'}</h2>
      <div class="stats-grid">
        ${content.stats.items ? content.stats.items.map((stat: any) => `
        <div class="stat-item">
          <div class="stat-number">${stat.number}</div>
          <div class="stat-label">${stat.label}</div>
        </div>
        `).join('') : ''}
      </div>
    </div>
  </section>`;
  }
  
  // How It Works
  if (sections.includes('how_it_works') && content.howItWorks) {
    sectionsHTML += `
  <section class="section fade-in-section" id="how-it-works">
    <div class="container">
      <h2 class="section-title">${content.howItWorks.title || 'How It Works'}</h2>
      <div class="steps-grid">
        ${content.howItWorks.steps ? content.howItWorks.steps.map((step: any, idx: number) => `
        <div class="step-item">
          <div class="step-number">${idx + 1}</div>
          <h3>${step.title}</h3>
          <p>${step.description}</p>
        </div>
        `).join('') : ''}
      </div>
    </div>
  </section>`;
  }
  
  // Newsletter
  if (sections.includes('newsletter') && content.newsletter) {
    sectionsHTML += `
  <section class="section newsletter-section fade-in-section" id="newsletter">
    <div class="container">
      <h2 class="section-title">${content.newsletter.title || 'Subscribe to Our Newsletter'}</h2>
      <p class="newsletter-description">${content.newsletter.description || 'Stay updated with our latest news and offers.'}</p>
      <form class="newsletter-form">
        <input type="email" placeholder="Your email address" required>
        <button type="submit" class="cta-button">Subscribe</button>
      </form>
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

.testimonial-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.testimonial-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: 700;
  font-family: '${fonts.heading}', sans-serif;
  flex-shrink: 0;
}

.quote { 
  font-family: '${fonts.body}', sans-serif; 
  font-size: 17px; 
  color: #475569; 
  font-style: italic; 
  margin-bottom: 0;
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

/* GALLERY */
.gallery-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
  gap: 24px; 
}

.gallery-item { 
  position: relative; 
  border-radius: 16px; 
  overflow: hidden; 
  aspect-ratio: 4/3;
  cursor: pointer;
}

.gallery-item img { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
  transition: transform 0.3s;
  filter: brightness(1.1) saturate(1.1);
}

.gallery-item:hover img { 
  transform: scale(1.05); 
}

.gallery-overlay { 
  position: absolute; 
  bottom: 0; 
  left: 0; 
  right: 0; 
  padding: 20px; 
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); 
  color: white; 
  opacity: 0; 
  transition: opacity 0.3s;
}

.gallery-item:hover .gallery-overlay { 
  opacity: 1; 
}

/* MENU */
.menu-container {
  max-width: 900px;
  margin: 0 auto;
}

.menu-category {
  margin-bottom: 56px;
}

.menu-category:last-child {
  margin-bottom: 0;
}

.menu-category-title {
  font-family: var(--heading-font);
  font-size: 32px;
  font-weight: 700;
  color: ${primary};
  margin-bottom: 28px;
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 3px solid ${primary};
  position: relative;
}

.menu-category-title::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 3px;
  background: ${secondary};
}

.menu-items {
  display: grid;
  gap: 20px;
}

.menu-item {
  padding: 24px;
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  transition: all 0.3s;
}

.menu-item:hover {
  transform: translateX(4px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  border-color: ${primary}40;
}

.menu-item-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
  gap: 16px;
}

.menu-item-name {
  font-family: var(--heading-font);
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
  flex: 1;
}

.menu-item-price {
  font-family: var(--heading-font);
  font-size: 18px;
  font-weight: 700;
  color: ${primary};
  white-space: nowrap;
}

.menu-item-description {
  color: #64748b;
  font-size: 15px;
  line-height: 1.6;
  margin: 0;
}

/* PRICING */
.pricing-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
  gap: 32px; 
  max-width: 1000px; 
  margin: 0 auto;
}

.pricing-card { 
  padding: 48px 32px; 
  background: white; 
  border: 2px solid rgba(15, 23, 42, 0.1); 
  border-radius: 20px; 
  text-align: center; 
  position: relative; 
  transition: all 0.3s;
}

.pricing-card.featured { 
  border-color: ${primary}; 
  box-shadow: 0 12px 48px rgba(15, 23, 42, 0.12); 
  transform: scale(1.05);
}

.pricing-badge { 
  position: absolute; 
  top: -12px; 
  left: 50%; 
  transform: translateX(-50%); 
  background: linear-gradient(135deg, ${primary}, ${secondary}); 
  color: white; 
  padding: 6px 20px; 
  border-radius: 20px; 
  font-size: 13px; 
  font-weight: 700;
}

.pricing-card h3 { 
  font-family: '${fonts.heading}', sans-serif; 
  font-size: 24px; 
  font-weight: 700; 
  margin-bottom: 12px;
}

.price { 
  font-family: '${fonts.heading}', sans-serif; 
  font-size: 48px; 
  font-weight: 900; 
  color: ${primary}; 
  margin: 20px 0;
}

.price-description { 
  color: #64748b; 
  margin-bottom: 32px; 
  font-size: 15px;
}

.pricing-features { 
  list-style: none; 
  margin: 32px 0; 
  text-align: left;
  padding: 0;
}

.pricing-features li { 
  padding: 12px 0; 
  padding-left: 32px; 
  position: relative; 
  font-size: 15px; 
  color: #475569;
}

.pricing-features li::before { 
  content: '✓'; 
  position: absolute; 
  left: 0; 
  color: ${primary}; 
  font-weight: 700;
  font-size: 18px;
}

.cta-button.secondary { 
  background: white; 
  color: ${primary}; 
  border: 2px solid ${primary};
}

.cta-button.secondary:hover { 
  background: ${primary}; 
  color: white;
}

/* FAQ */
.faq-list { 
  max-width: 800px; 
  margin: 0 auto;
}

.faq-item { 
  background: white; 
  border: 1px solid rgba(15, 23, 42, 0.08); 
  border-radius: 16px; 
  margin-bottom: 16px; 
  overflow: hidden;
}

.faq-question { 
  font-family: '${fonts.heading}', sans-serif; 
  font-size: 18px; 
  font-weight: 700; 
  padding: 24px 32px; 
  cursor: pointer; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  transition: background 0.2s;
  margin: 0;
}

.faq-question:hover { 
  background: #f8fafc;
}

.faq-icon { 
  font-size: 24px; 
  font-weight: 300; 
  transition: transform 0.3s;
}

.faq-item.active .faq-icon { 
  transform: rotate(45deg);
}

.faq-answer { 
  max-height: 0; 
  overflow: hidden; 
  transition: max-height 0.3s ease;
}

.faq-item.active .faq-answer { 
  max-height: 500px;
}

.faq-answer p { 
  padding: 0 32px 24px; 
  color: #64748b; 
  line-height: 1.7;
  margin: 0;
}

/* TEAM */
.team-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
  gap: 40px;
}

.team-member { 
  text-align: center;
}

.team-member-image { 
  width: 120px; 
  height: 120px; 
  margin: 0 auto 20px; 
  border-radius: 50%; 
  background: linear-gradient(135deg, ${primary}, ${secondary}); 
  display: flex; 
  align-items: center; 
  justify-content: center;
}

.team-initial { 
  font-size: 48px; 
  font-weight: 700; 
  color: white;
}

.team-member h3 { 
  font-family: '${fonts.heading}', sans-serif; 
  font-size: 20px; 
  font-weight: 700; 
  margin-bottom: 8px;
}

.team-role { 
  color: ${primary}; 
  font-weight: 600; 
  margin-bottom: 12px; 
  font-size: 15px;
}

.team-bio { 
  color: #64748b; 
  font-size: 14px; 
  line-height: 1.6;
}

/* STATS */
.stats-section { 
  background: linear-gradient(135deg, ${primary}15, ${secondary}15);
}

.stats-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
  gap: 48px; 
  text-align: center;
}

.stat-number { 
  font-family: '${fonts.heading}', sans-serif; 
  font-size: 56px; 
  font-weight: 900; 
  color: ${primary}; 
  margin-bottom: 12px;
}

.stat-label { 
  font-family: '${fonts.body}', sans-serif; 
  font-size: 16px; 
  font-weight: 600; 
  color: #64748b; 
  text-transform: uppercase; 
  letter-spacing: 0.5px;
}

/* HOW IT WORKS */
.steps-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
  gap: 40px;
}

.step-item { 
  text-align: center; 
  padding: 32px; 
  background: white; 
  border-radius: 20px; 
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.step-number { 
  width: 64px; 
  height: 64px; 
  margin: 0 auto 24px; 
  border-radius: 50%; 
  background: linear-gradient(135deg, ${primary}, ${secondary}); 
  color: white; 
  font-size: 28px; 
  font-weight: 900; 
  display: flex; 
  align-items: center; 
  justify-content: center;
}

.step-item h3 { 
  font-family: '${fonts.heading}', sans-serif; 
  font-size: 20px; 
  font-weight: 700; 
  margin-bottom: 12px;
}

.step-item p { 
  color: #64748b; 
  font-size: 15px; 
  line-height: 1.6;
}

/* NEWSLETTER */
.newsletter-section { 
  background: linear-gradient(135deg, ${primary}, ${secondary}); 
  color: white;
}

.newsletter-section .section-title { 
  color: white;
}

.newsletter-description { 
  text-align: center; 
  font-size: 18px; 
  margin-bottom: 32px; 
  opacity: 0.95;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.newsletter-form { 
  max-width: 600px; 
  margin: 0 auto; 
  display: flex; 
  gap: 12px;
}

.newsletter-form input { 
  flex: 1; 
  padding: 18px 24px; 
  border: none; 
  border-radius: 12px; 
  font-size: 16px;
}

.newsletter-form button { 
  background: white; 
  color: ${primary}; 
  padding: 18px 36px;
  box-shadow: none;
}

.newsletter-form button:hover { 
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
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
  
  .newsletter-form { 
    flex-direction: column;
  }
  
  .pricing-card.featured { 
    transform: scale(1);
  }
  
  .gallery-grid, 
  .pricing-grid, 
  .team-grid, 
  .stats-grid, 
  .steps-grid { 
    grid-template-columns: 1fr;
  }
  
  .stat-number {
    font-size: 42px;
  }
  
  .price {
    font-size: 36px;
  }
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
