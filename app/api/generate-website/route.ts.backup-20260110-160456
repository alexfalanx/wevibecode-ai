// app/api/generate-website/route.ts
// FINAL - Custom Logos + Readable Text + Bright Images
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
    const imageCredits = includeImages ? 3 : 0; // 3 images now
    const logoCredits = customLogo ? 3 : 0;
    const totalCredits = baseCredits + imageCredits + logoCredits;

    if (profile.credits_remaining < totalCredits) {
      return NextResponse.json({ error: `Need ${totalCredits} credits` }, { status: 402 });
    }

    console.log(`🎨 Generating: images=${includeImages ? '3' : '0'}, logo=${customLogo}`);

    // STEP 1: Generate content
    const content = await generateContent(prompt, websiteType, sections, vibe);

    // STEP 2: Generate custom logo if requested
    let logoUrl = '';
    if (customLogo) {
      const logoColors = logoColorMode === 'ai' 
        ? await chooseColors(prompt, websiteType, vibe)
        : logoColorPalette;
      
      logoUrl = await generateCustomLogo(content.businessName, vibe, websiteType, logoColors);
    }

    // STEP 3: Choose website colors
    const colors = colorMode === 'ai' 
      ? await chooseColors(prompt, websiteType, vibe)
      : colorPalette;

    // STEP 4: Fetch images (3 now)
    let images: any[] = [];
    if (includeImages && content.imageSearchTerms) {
      images = await fetchImages(content.imageSearchTerms);
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

async function generateContent(prompt: string, websiteType: string, sections: string[], vibe: string): Promise<any> {
  const contentPrompt = `Create content for a ${websiteType} with ${vibe} vibe.

USER: "${prompt}"
SECTIONS: ${sections.join(', ')}

Return JSON:
{
  "businessName": "Creative name",
  "hero": {"headline": "...", "subtitle": "...", "cta": "..."},
  ${sections.includes('about') ? `"about": {"title": "...", "text": "..."},` : ''}
  ${sections.includes('features') || sections.includes('services') ? `"features": [{"icon": "🚀", "title": "...", "description": "..."}],` : ''}
  ${sections.includes('testimonials') ? `"testimonials": [{"text": "...", "author": "...", "role": "..."}],` : ''}
  "imageSearchTerms": {
    "hero": "SPECIFIC term"
  }
}

Return ONLY valid JSON.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Return ONLY valid JSON.' },
      { role: 'user', content: contentPrompt },
    ],
    temperature: 0.8,
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content || '{}';
  try {
    let cleaned = content.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    return JSON.parse(cleaned);
  } catch (e) {
    return {
      businessName: 'Business',
      hero: { headline: 'Welcome', subtitle: 'Description', cta: 'Get Started' }
    };
  }
}

async function generateCustomLogo(businessName: string, vibe: string, websiteType: string, logoColors: any): Promise<string> {
  try {
    const primary = logoColors.primary || '#3B82F6';
    const secondary = logoColors.secondary || '#06B6D4';
    
    const logoPrompt = `Create a modern, professional logo for "${businessName}", a ${websiteType} business with a ${vibe} vibe. 

Style: Clean, minimalist, modern logo design. Simple geometric shapes or abstract mark. Professional and memorable.

Color scheme: Use ${primary} as the primary color and ${secondary} as the secondary/accent color.

Requirements:
- Simple and clean design
- Uses the specified colors: ${primary} and ${secondary}
- Works at small sizes
- Modern aesthetic
- NO text/letters in the image
- Just the logo mark/icon
- White or transparent background`;

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
  const colorPrompt = `For "${prompt}" (${websiteType}, ${vibe} vibe), choose 2 colors.

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

async function fetchImages(searchTerms: any): Promise<any[]> {
  const images: any[] = [];
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'demo';
  
  // Fetch 3 images: hero, about/section1, section2
  const termsToFetch = [
    searchTerms.hero, 
    searchTerms.about || searchTerms.section1, 
    searchTerms.section2 || searchTerms.featured
  ].filter(Boolean).slice(0, 3);
  
  for (const term of termsToFetch) {
    try {
      const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(term)}&per_page=1&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.results?.[0]) {
        const photo = data.results[0];
        images.push({
          url: photo.urls.regular,
          alt: photo.alt_description || term,
          photographer: photo.user.name,
          brightness: photo.color ? getBrightness(photo.color) : 'dark',
        });
        
        if (photo.links.download_location) {
          fetch(photo.links.download_location, {
            headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` }
          }).catch(() => {});
        }
      }
    } catch (error) {
      console.error(`Image fetch failed: ${term}`);
    }
  }
  
  return images;
}

function getBrightness(hexColor: string): 'light' | 'dark' {
  // Simple brightness detection from hex color
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? 'light' : 'dark';
}

function getFont(websiteType: string, vibe: string): { logo: string; heading: string; body: string } {
  const fonts: Record<string, Record<string, { logo: string; heading: string; body: string }>> = {
    restaurant: {
      professional: { logo: 'Playfair Display', heading: 'Cormorant Garamond', body: 'Lora' },
      fun: { logo: 'Righteous', heading: 'Fredoka', body: 'Nunito' },
      luxury: { logo: 'Bodoni Moda', heading: 'Cinzel', body: 'Crimson Text' },
      minimal: { logo: 'Work Sans', heading: 'Inter', body: 'Inter' },
      bold: { logo: 'Bebas Neue', heading: 'Oswald', body: 'Roboto' },
      calm: { logo: 'Quicksand', heading: 'Raleway', body: 'Open Sans' },
    },
    landing: {
      professional: { logo: 'Poppins', heading: 'Montserrat', body: 'Roboto' },
      fun: { logo: 'Fredoka', heading: 'Baloo 2', body: 'Nunito' },
      luxury: { logo: 'Abril Fatface', heading: 'Playfair Display', body: 'Lato' },
      minimal: { logo: 'Space Grotesk', heading: 'Inter', body: 'Inter' },
      bold: { logo: 'Russo One', heading: 'Barlow', body: 'Work Sans' },
      calm: { logo: 'Josefin Sans', heading: 'Karla', body: 'Source Sans Pro' },
    },
    portfolio: {
      professional: { logo: 'Merriweather', heading: 'IBM Plex Sans', body: 'IBM Plex Sans' },
      fun: { logo: 'Pacifico', heading: 'Comfortaa', body: 'Quicksand' },
      luxury: { logo: 'Cormorant Garamond', heading: 'Libre Baskerville', body: 'Crimson Text' },
      minimal: { logo: 'Manrope', heading: 'DM Sans', body: 'DM Sans' },
      bold: { logo: 'Black Ops One', heading: 'Anton', body: 'Barlow' },
      calm: { logo: 'Satisfy', heading: 'Lora', body: 'Karla' },
    },
    business: {
      professional: { logo: 'Montserrat', heading: 'Roboto', body: 'Roboto' },
      fun: { logo: 'Archivo Black', heading: 'Rubik', body: 'Nunito' },
      luxury: { logo: 'Cinzel', heading: 'Playfair Display', body: 'Lato' },
      minimal: { logo: 'Lexend', heading: 'Inter', body: 'Inter' },
      bold: { logo: 'Oswald', heading: 'Barlow Condensed', body: 'Work Sans' },
      calm: { logo: 'Philosopher', heading: 'Raleway', body: 'Open Sans' },
    },
    blog: {
      professional: { logo: 'Spectral', heading: 'PT Serif', body: 'Source Serif Pro' },
      fun: { logo: 'Carter One', heading: 'Fredoka', body: 'Nunito' },
      luxury: { logo: 'Italiana', heading: 'Playfair Display', body: 'Crimson Text' },
      minimal: { logo: 'Epilogue', heading: 'DM Sans', body: 'DM Sans' },
      bold: { logo: 'Alfa Slab One', heading: 'Passion One', body: 'Barlow' },
      calm: { logo: 'Literata', heading: 'Lora', body: 'Source Sans Pro' },
    },
    ecommerce: {
      professional: { logo: 'Lato', heading: 'Poppins', body: 'Roboto' },
      fun: { logo: 'Lilita One', heading: 'Baloo 2', body: 'Nunito' },
      luxury: { logo: 'Cormorant Garamond', heading: 'Cinzel', body: 'Lato' },
      minimal: { logo: 'Outfit', heading: 'Inter', body: 'Inter' },
      bold: { logo: 'Teko', heading: 'Oswald', body: 'Work Sans' },
      calm: { logo: 'Eczar', heading: 'Karla', body: 'Source Sans Pro' },
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
  const css = generateCSS(colors, fonts);
  const js = generateJS();
  
  return { html, css, js };
}

function generateHTML(content: any, sections: string[], images: any[], logoUrl: string, websiteType: string): string {
  const heroImage = images[0];
  const secondImage = images[1];
  const thirdImage = images[2];
  
  // Determine text color based on image brightness
  const heroTextClass = heroImage?.brightness === 'light' ? 'text-dark' : 'text-light';
  
  let sectionsHTML = '';
  
  // Hero
  sectionsHTML += `
  <section class="hero ${heroTextClass}" id="home">
    ${heroImage ? `
    <div class="hero-image">
      <img src="${heroImage.url}" alt="Hero">
      <div class="hero-overlay"></div>
    </div>
    ` : '<div class="hero-gradient"></div>'}
    <div class="hero-content">
      <h1>${content.hero?.headline || 'Welcome'}</h1>
      <p>${content.hero?.subtitle || ''}</p>
      <button class="cta-button">${content.hero?.cta || 'Get Started'}</button>
    </div>
  </section>`;
  
  // About section with second image
  if (sections.includes('about') && content.about) {
    sectionsHTML += `
  <section class="section" id="about">
    <div class="container">
      <div class="section-grid">
        ${secondImage ? `<img src="${secondImage.url}" alt="About" class="section-image">` : ''}
        <div class="section-content">
          <h2>${content.about.title || 'About Us'}</h2>
          <p>${content.about.text || ''}</p>
        </div>
      </div>
    </div>
  </section>`;
  }
  
  // Features/Services
  if ((sections.includes('features') || sections.includes('services')) && content.features) {
    sectionsHTML += `
  <section class="section" id="services">
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
  <section class="section testimonials-section">
    <div class="container">
      <h2 class="section-title">Testimonials</h2>
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
  <section class="section" id="contact">
    <div class="container">
      <h2 class="section-title">Get In Touch</h2>
      <form class="contact-form">
        <input type="text" placeholder="Name" required>
        <input type="email" placeholder="Email" required>
        <textarea placeholder="Message" rows="5" required></textarea>
        <button type="submit" class="cta-button">Send Message</button>
      </form>
    </div>
  </section>`;
  }
  
  // Logo display
  const logoDisplay = logoUrl 
    ? `<img src="${logoUrl}" alt="Logo" class="logo-image">`
    : `<span class="logo-icon">✨</span>`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.businessName || 'Website'}</title>
</head>
<body>
  <header class="header">
    <div class="container">
      <div class="nav-wrapper">
        <div class="logo">
          ${logoDisplay}
          <span class="logo-text">${content.businessName || 'Business'}</span>
        </div>
        <nav class="nav-desktop">
          <a href="#home">Home</a>
          ${sections.includes('about') ? '<a href="#about">About</a>' : ''}
          ${sections.includes('services') || sections.includes('features') ? '<a href="#services">Services</a>' : ''}
          ${sections.includes('contact') ? '<a href="#contact">Contact</a>' : ''}
        </nav>
        <button class="mobile-toggle" onclick="toggleMobileMenu()">
          <span></span><span></span><span></span>
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
      ${images.length > 0 ? `<p class="credits">Photos: ${images.map(img => img.photographer).join(', ')}</p>` : ''}
    </div>
  </footer>
</body>
</html>`;
}

function generateCSS(colors: any, fonts: { logo: string; heading: string; body: string }): string {
  const primary = colors.primary || '#3B82F6';
  const secondary = colors.secondary || '#06B6D4';
  
  // Build Google Fonts import URL
  const fontsToImport = Array.from(new Set([fonts.logo, fonts.heading, fonts.body]))
    .map(font => font.replace(/ /g, '+') + ':wght@400;600;700;800')
    .join('&family=');
  
  return `@import url('https://fonts.googleapis.com/css2?family=${fontsToImport}&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: '${fonts.body}', -apple-system, sans-serif;
  color: #0f172a;
  line-height: 1.6;
  background: #ffffff;
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

.logo-text {
  font-family: '${fonts.logo}', serif;
  font-size: 28px;
  font-weight: 800;
  color: ${primary};
  letter-spacing: -0.02em;
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

/* HERO - MUCH LIGHTER */
.hero { position: relative; min-height: 70vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }

.hero-image { position: absolute; inset: 0; }
.hero-image img { width: 100%; height: 100%; object-fit: cover; filter: brightness(1.3); }

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, ${primary}10, ${secondary}10);
}

.hero-gradient { position: absolute; inset: 0; background: linear-gradient(135deg, ${primary}08, ${secondary}08); }

.hero-content { position: relative; z-index: 2; text-align: center; padding: 60px 24px; max-width: 800px; }

/* Text contrast based on image brightness */
.hero.text-light h1,
.hero.text-light p {
  color: #ffffff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}

.hero.text-dark h1,
.hero.text-dark p {
  color: #0f172a;
  text-shadow: 0 2px 8px rgba(255, 255, 255, 0.8);
}

.hero-content h1 {
  font-family: '${fonts.heading}', sans-serif;
  font-size: 56px;
  font-weight: 800;
  margin-bottom: 20px;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.hero-content p { 
  font-family: '${fonts.body}', sans-serif;
  font-size: 20px; 
  margin-bottom: 32px; 
  font-weight: 500; 
}

.cta-button {
  padding: 16px 40px;
  font-size: 16px;
  font-weight: 600;
  font-family: '${fonts.body}', sans-serif;
  color: white;
  background: linear-gradient(135deg, ${primary}, ${secondary});
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px ${primary}25;
}

.cta-button:hover { transform: translateY(-2px); box-shadow: 0 8px 24px ${primary}35; }

/* SECTIONS */
.section { padding: 100px 24px; }
.section:nth-child(even) { background: #f8fafc; }

.section-title {
  font-family: '${fonts.heading}', sans-serif;
  text-align: center;
  font-size: 42px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 60px;
}

.section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
.section-image { width: 100%; border-radius: 16px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.1); }

.section-hero-image {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 16px;
  margin-bottom: 40px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.1);
}

.section-content h2 { font-family: '${fonts.heading}', sans-serif; font-size: 36px; font-weight: 700; margin-bottom: 20px; }
.section-content p { font-family: '${fonts.body}', sans-serif; font-size: 17px; color: #64748b; line-height: 1.8; }

.cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }

.card {
  padding: 32px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  transition: all 0.3s;
}

.card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08); border-color: ${primary}20; }
.card-icon { font-size: 40px; margin-bottom: 16px; }
.card h3 { font-family: '${fonts.heading}', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 12px; }
.card p { font-family: '${fonts.body}', sans-serif; color: #64748b; line-height: 1.7; }

.testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
.testimonial { padding: 32px; background: white; border-radius: 16px; border: 1px solid rgba(15, 23, 42, 0.08); }
.quote { font-family: '${fonts.body}', sans-serif; font-size: 17px; color: #475569; font-style: italic; margin-bottom: 20px; }
.author strong { font-family: '${fonts.heading}', sans-serif; display: block; color: #0f172a; margin-bottom: 4px; }
.author span { font-family: '${fonts.body}', sans-serif; font-size: 14px; color: #64748b; }

.contact-form { max-width: 600px; margin: 0 auto; }
.contact-form input,
.contact-form textarea {
  width: 100%;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 10px;
  font-family: '${fonts.body}', sans-serif;
  font-size: 16px;
}

.footer { padding: 40px 24px; background: #0f172a; color: #94a3b8; text-align: center; }
.footer p { font-family: '${fonts.body}', sans-serif; }
.credits { margin-top: 10px; font-size: 13px; opacity: 0.7; }

@media (max-width: 768px) {
  .hero-content h1 { font-size: 36px; }
  .section-title { font-size: 32px; }
  .section-grid { grid-template-columns: 1fr; }
  .cards-grid { grid-template-columns: 1fr; }
  .section { padding: 60px 20px; }
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
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});`;
}
