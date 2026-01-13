// templates/template-system.ts
// v5.1 COMPLETE - ALL PHRASES FROM ALL 10 TEMPLATES

import fs from 'fs';
import path from 'path';

const TEMPLATE_MAPPING: { [key: string]: string[] } = {
  restaurant: ['Alpha', 'Spectral', 'Stellar'],
  real_estate: ['Phantom', 'Forty', 'Stellar'],
  professional: ['Solid State', 'Alpha', 'Dimension'],
  healthcare: ['Alpha', 'Solid State', 'Stellar'],
  salon: ['Phantom', 'Spectral', 'Forty'],
  business: ['Alpha', 'Solid State', 'Hyperspace'],
  ecommerce: ['Forty', 'Phantom', 'Spectral'],
  landing: ['Dimension', 'Spectral', 'Hyperspace'],
};

export function selectTemplate(businessType: string): string {
  const options = TEMPLATE_MAPPING[businessType] || ['Alpha', 'Spectral', 'Stellar'];
  const selected = options[Math.floor(Math.random() * options.length)];
  console.log(`🎨 Selected template: ${selected} for ${businessType}`);
  return selected;
}

export function loadTemplate(templateName: string): string {
  const templatePath = path.join(process.cwd(), 'templates', 'html5up', templateName, 'index.html');
  
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found: ${templatePath}`);
    return '';
  }
  
  return fs.readFileSync(templatePath, 'utf-8');
}

export function loadTemplateCSS(templateName: string): string {
  const cssPath = path.join(process.cwd(), 'templates', 'html5up', templateName, 'assets', 'css', 'main.css');
  
  if (!fs.existsSync(cssPath)) {
    console.error(`❌ CSS not found: ${cssPath}`);
    return '';
  }
  
  return fs.readFileSync(cssPath, 'utf-8');
}

function stripExternalAssets(html: string): string {
  let result = html;
  result = result.replace(/<script[^>]*src=["'][^"']*["'][^>]*><\/script>/gi, '');
  result = result.replace(/<link[^>]*href=["'][^"']*fontawesome[^"']*["'][^>]*>/gi, '');
  result = result.replace(/<link[^>]*href=["'][^"']*assets\/css\/[^"']*["'][^>]*>/gi, '');
  result = result.replace(/<noscript>[\s\S]*?<\/noscript>/gi, '');

  // Remove unwanted sections for business websites
  // Remove CTA/signup sections
  result = result.replace(/<section[^>]*id=["']cta["'][^>]*>[\s\S]*?<\/section>/gi, '');

  // Remove "Sign Up" buttons from navigation
  result = result.replace(/<li><a[^>]*class=["'][^"']*button[^"']*["'][^>]*>Sign Up<\/a><\/li>/gi, '');
  result = result.replace(/<a[^>]*class=["'][^"']*button[^"']*["'][^>]*>Sign Up<\/a>/gi, '');

  // Remove social media links from footer (keep footer structure)
  result = result.replace(/<ul class="icons">[\s\S]*?<\/ul>/gi, '');

  console.log(`✅ Stripped external assets and unwanted sections from HTML`);
  return result;
}

function replaceIcons(html: string): string {
  let result = html;
  result = result.replace(/class="icon[^"]*fa-gem[^"]*"/gi, 'style="font-size: 2em;"');
  result = result.replace(/>(<span[^>]*class="icon[^"]*fa-[^"]*"[^>]*>)<\/span>/gi, '>●</span>');
  return result;
}

// v5.1 COMPLETE - ALL TEMPLATES, ALL PHRASES
export function injectContent(
  html: string,
  content: any,
  images: any[],
  logoUrl: string,
  colors: any
): string {
  let result = html;
  
  console.log(`📝 v5.1 COMPLETE INJECTION for: ${content.businessName}`);
  
  // 1. FOOTER: Replace "Untitled" and copyright
  result = result.replace(/&copy;\s*Untitled[^<]*/gi, `&copy; ${content.businessName}`);
  result = result.replace(/©\s*Untitled[^<]*/gi, `© ${content.businessName}`);
  result = result.replace(/Untitled Inc/gi, content.businessName);
  result = result.replace(/All rights reserved\./gi, '');
  result = result.replace(/All rights reserved/gi, '');
  result = result.replace(/<li>Design:\s*<a[^>]*>HTML5 UP<\/a><\/li>/gi, '');
  result = result.replace(/Design:\s*<a[^>]*>HTML5 UP<\/a>/gi, '');
  result = result.replace(/Design:\s*HTML5 UP/gi, '');
  
  // 2. NUCLEAR: Replace "by HTML5 UP" everywhere
  result = result.replace(/<span[^>]*>by HTML5 UP<\/span>/gi, '');
  result = result.replace(/by HTML5 UP/gi, '');
  result = result.replace(/designed by HTML5 UP/gi, '');
  result = result.replace(/designed by/gi, '');
  
  // 3. NUCLEAR: Replace ALL template names and H1 tags
  const allTemplateNames = [
    'Alpha', 'Dimension', 'Spectral', 'Stellar', 'Phantom',
    'Forty', 'Solid State', 'Story', 'Massively', 'Hyperspace'
  ];

  allTemplateNames.forEach(name => {
    const regex = new RegExp(`\\b${name}\\b`, 'gi');
    result = result.replace(regex, content.businessName || 'Your Business');

    const titleTag = new RegExp(`<title>${name}[^<]*<\\/title>`, 'gi');
    result = result.replace(titleTag, `<title>${content.businessName || 'Your Business'}</title>`);
  });

  // Replace ALL H1 tags with business name
  result = result.replace(/<h1[^>]*>([^<]*)<\/h1>/gi, `<h1>${content.businessName || 'Your Business'}</h1>`);
  
  // 4. SMART H2 REPLACEMENT - First H2 is hero, rest are section titles
  const allH2Headings = [
    'Introducing the ultimate mobile app',
    'Sign up for beta access',
    'Massa libero',
    'Sed ipsum dolor',
    'Feugiat consequat',
    'Ultricies aliquam',
    'What we do',
    'Get in touch',
    'And this is a massive headline',
    'Sed magna ipsum faucibus',
    'Primis eget imperdiet lorem',
    'Ante mattis interdum dolor',
    'Tempus sed nulla imperdiet',
    'Odio magna sed consectetur',
    'Augue lorem primis vestibulum',
    'This is Solid State',
    'Magna arcu feugiat',
    'Tempus adipiscing',
    'Nullam dignissim',
    'Vitae phasellus',
    'Arcu aliquet vel lobortis',
    'Magna primis lobortis sed ullamcorper',
    'Tortor dolore feugiat elementum magna',
    'Augue eleifend aliquet sed condimentum',
    'Accumsan mus tortor nunc aliquet',
    'Arcue ut vel commodo',
    'Ipsum sed adipiscing',
    'Magna veroeros',
    'Ipsum consequat',
    'Congue imperdiet',
    'Aliquam sed mauris',
    'Etiam feugiat',
    'Magna etiam feugiat',
    'Pharetra etiam nulla',
    'Massa sed condimentum',
    'Ipsum sed consequat'
  ];

  // Build replacement text for different sections
  const heroHeadline = content.hero?.headline || content.businessName || 'Welcome';
  const heroSubtitle = content.hero?.subtitle || content.tagline || 'Professional services';
  const aboutTitle = content.about?.title || 'About Us';
  const servicesTitle = 'Our Services';
  const contactTitle = 'Get In Touch';

  // Replace H2s - Just use hero headline for main ones, content for others
  const h2Replacements = [heroHeadline, aboutTitle, servicesTitle, contactTitle];
  let h2Index = 0;

  allH2Headings.forEach(heading => {
    const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(<h2[^>]*>)[^<]*${escapedHeading}[^<]*(<\\/h2>)`, 'gi');
    const replacement = h2Replacements[Math.min(h2Index, h2Replacements.length - 1)];
    result = result.replace(regex, `$1${replacement}$2`);
    if (result.match(regex)) h2Index++; // Only increment if we actually replaced something
  });
  
  // 5. H3 HEADINGS - Use feature/service titles
  const allH3Headings = [
    'Magna etiam', 'Ipsum dolor', 'Sed feugiat', 'Enim phasellus',
    'Sed lorem adipiscing', 'Accumsan integer', 'Aliquam', 'Tempus',
    'Magna', 'Ipsum', 'Consequat', 'Etiam', 'Nullam', 'Veroeros',
    'Dolor', 'Ultricies', 'Dictum', 'Pretium', 'Lorem ipsum amet',
    'Aliquam sed nullam', 'Sed erat ullam corper', 'Veroeros quis lorem',
    'Urna quis bibendum', 'Aliquam urna dapibus', 'Lorem', 'Feugiat',
    'Sed feugiat lorem', 'Nisl placerat', 'Ante fermentum', 'Fusce consequat',
    'Arcu accumsan', 'Ac Augue Eget', 'Mus Scelerisque', 'Mauris Imperdiet',
    'Aenean Primis', 'Tortor Ut', 'Amed sed feugiat', 'Dolor nullam',
    'Ipsum Dolor', 'Feugiat Lorem', 'Magna Amet', 'Sed Tempus',
    'Ultrices Magna', 'Ipsum Lorem', 'Magna Risus', 'Tempus Dolor',
    'Elit', 'Amet', 'Consectetur', 'Adipiscing'
  ];

  // Use feature titles if available, otherwise generic
  const featureTitles = content.features?.map((f: any) => f.title) || content.services?.map((s: any) => s.title) || [];
  let h3Index = 0;

  allH3Headings.forEach(heading => {
    const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(<h3[^>]*>)(<a[^>]*>)?${escapedHeading}(<\\/a>)?(<\\/h3>)`, 'gi');
    const replacement = featureTitles[h3Index] || content.businessName || 'Our Service';
    result = result.replace(regex, `$1$2${replacement}$3$4`);
    if (result.match(regex) && featureTitles.length > 0) {
      h3Index = (h3Index + 1) % featureTitles.length; // Cycle through features
    }
  });
  
  // 6. ALL LOREM IPSUM PHRASES - Use actual content
  const allLoremPhrases = [
    'Etiam quis viverra lorem',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
    'Lorem ipsum dolor sit amet',
    'Aenean ornare velit lacus',
    'Integer volutpat ante et accumsan',
    'Adipiscing magna sed dolor',
    'Sed nisl arcu euismod',
    'Praesent eleifend dignissim',
    'Nullam et orci eu lorem',
    'Vivamus et sagittis',
    'Mauris aliquet magna',
    'Ipsum dolor sit amet',
    'feugiat amet tempus',
    'Lorem etiam nullam',
    'Nisl sed aliquam',
    'Blandit varius ut praesent',
    'Condimentum turpis massa',
    'Phasellus convallis elit',
    'Morbi id ante sed ex',
    'Donec imperdiet consequat',
    'Suspendisse feugiat congue posuere',
    'Nulla massa urna, fermentum eget',
    'Nam elementum nisl et mi',
    'Nam a orci mi, elementum ac arcu',
    'Integer maximus varius lorem',
    'Praesent eleifend lacus in lectus',
    'Cras eu ornare dui curabitur lacinia',
    'Donec eget ex magna',
    'Donec hendrerit imperdiet',
    'Cras turpis ante, nullam sit amet',
    'Cras mattis ante fermentum',
    'Nam maximus erat id euismod',
    'Congue imperdiet'
  ];

  // Build array of replacement texts from content
  const replacementTexts = [
    heroSubtitle,
    content.about?.text || content.hero?.subtitle,
    ...(content.features || content.services || []).map((f: any) => f.description),
    content.tagline,
    `${content.businessName} provides professional services.`
  ].filter(Boolean); // Remove nulls

  let textIndex = 0;

  allLoremPhrases.forEach(phrase => {
    const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(<p[^>]*>)[^<]*${escapedPhrase}[^<]*(<\\/p>)`, 'gi');
    const replacement = replacementTexts[textIndex % replacementTexts.length];
    result = result.replace(regex, `$1${replacement}$2`);
    if (result.match(regex)) textIndex++; // Cycle through different content
  });

  // AGGRESSIVE: Replace any remaining lorem ipsum patterns
  result = result.replace(/<p[^>]*>[^<]*lorem[^<]*<\/p>/gi, `<p>${heroSubtitle}</p>`);
  result = result.replace(/<p[^>]*>[^<]*ipsum[^<]*<\/p>/gi, `<p>${heroSubtitle}</p>`);
  result = result.replace(/<p[^>]*>[^<]*dolor sit amet[^<]*<\/p>/gi, `<p>${heroSubtitle}</p>`);
  result = result.replace(/<p[^>]*>[^<]*consectetur adipiscing[^<]*<\/p>/gi, `<p>${heroSubtitle}</p>`);
  result = result.replace(/<p[^>]*>[^<]*sed do eiusmod[^<]*<\/p>/gi, `<p>${heroSubtitle}</p>`);
  result = result.replace(/<p[^>]*>[^<]*tempor incididunt[^<]*<\/p>/gi, `<p>${heroSubtitle}</p>`);

  // Replace common placeholder paragraphs
  result = result.replace(/<p[^>]*>Aliquam ut ex ut augue[^<]*<\/p>/gi, `<p>${heroSubtitle}</p>`);
  result = result.replace(/<p[^>]*>Another[^<]*site[^<]*template[^<]*<\/p>/gi, `<p>${heroSubtitle}</p>`);
  result = result.replace(/<p[^>]*>Another[^<]*responsive[^<]*<\/p>/gi, `<p>${heroSubtitle}</p>`);
  result = result.replace(/<p[^>]*>crafted by[^<]*<\/p>/gi, `<p>${heroSubtitle}</p>`);

  // Spectral specific banner text
  result = result.replace(/Another fine responsive<br \/>[^<]*site template freebie<br \/>[^<]*crafted by[^<]*/gi, heroSubtitle);

  // Replace multiline lorem patterns in paragraphs (with <br> tags)
  result = result.replace(/<p[^>]*>[^<]*Aliquam ut ex[^<]*<br[^>]*>[^<]*fringilla[^<]*<\/p>/gi, `<p>${heroSubtitle}</p>`);
  result = result.replace(/<p[^>]*>[^<]*Arcu aliquet[^<]*<br[^>]*>[^<]*eget augue[^<]*<\/p>/gi, `<p>${heroSubtitle}</p>`);
  
  // 7. Replace images
  if (images.length > 0) {
    result = result.replace(/images\/pic01\.jpg/gi, images[0]?.url || 'https://via.placeholder.com/800x600');
    result = result.replace(/images\/pic02\.jpg/gi, images[1]?.url || images[0]?.url || 'https://via.placeholder.com/800x600');
    result = result.replace(/images\/pic03\.jpg/gi, images[2]?.url || images[0]?.url || 'https://via.placeholder.com/800x600');
    result = result.replace(/src="images\/[^"]+"/gi, `src="${images[0]?.url || 'https://via.placeholder.com/400x300'}"`);
    console.log(`✅ NUKED images: Replaced with ${images.length} real images`);
  } else {
    result = result.replace(/images\/pic0[123]\.jpg/gi, 'https://via.placeholder.com/800x600');
    result = result.replace(/src="images\/[^"]+"/gi, 'src="https://via.placeholder.com/400x300"');
  }
  
  // 8. Add logo to header
  if (logoUrl) {
    // Replace gem icons with logo
    result = result.replace(
      /<span[^>]*class="icon[^"]*fa-gem[^"]*"[^>]*><\/span>/gi,
      `<img src="${logoUrl}" alt="${content.businessName}" style="width: 48px; height: 48px; object-fit: contain; border-radius: 8px; margin-right: 10px;">`
    );

    // Add logo before business name in header
    result = result.replace(
      /(<h1[^>]*><a[^>]*>)([^<]+)(<\/a>)/gi,
      `$1<img src="${logoUrl}" alt="${content.businessName}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 6px; vertical-align: middle; margin-right: 8px;">$2$3`
    );

    console.log(`✅ Added logo to header`);
  }

  // 9. Add background image to banner/hero section
  if (images.length > 0) {
    const heroImage = images[0].url;

    // For Alpha and similar templates with id="banner"
    result = result.replace(
      /(<section[^>]*id=["']banner["'][^>]*)(>)/gi,
      `$1 style="background-image: url('${heroImage}'); background-size: cover; background-position: center; background-attachment: fixed;"$2`
    );

    // For templates with class="banner"
    result = result.replace(
      /(<section[^>]*class=["'][^"']*banner[^"']*["'][^>]*)(>)/gi,
      `$1 style="background-image: url('${heroImage}'); background-size: cover; background-position: center;"$2`
    );

    console.log(`✅ Added hero background image`);
  }
  
  console.log(`✅ v5.1 COMPLETE INJECTION DONE`);
  return result;
}

export function applyColors(css: string, colors: any): string {
  let result = css;
  
  console.log(`🎨 Applying colors: ${colors.primary}, ${colors.secondary}`);
  
  const colorMap = [
    { from: /#5e42a6/gi, to: colors.primary },
    { from: /#b74e91/gi, to: colors.secondary },
    { from: /#5052b5/gi, to: colors.primary },
    { from: /#ff6699/gi, to: colors.secondary },
    { from: /#00b3ff/gi, to: colors.primary },
    { from: /#8cc9f0/gi, to: colors.secondary },
    { from: /#ed4933/gi, to: colors.primary },
    { from: /#21b2a6/gi, to: colors.secondary },
  ];
  
  colorMap.forEach(({ from, to }) => {
    result = result.replace(from, to);
  });
  
  console.log(`✅ Colors applied`);
  return result;
}

export function inlineCSS(html: string, css: string): string {
  let result = html;
  result = result.replace(/<link[^>]*rel="stylesheet"[^>]*>/gi, '');

  // Add custom CSS for better logo, banner visibility, and business name styling
  const customCSS = `
/* Enhanced business name in header */
#header h1 a {
  font-size: 1.5em !important;
  font-weight: 700 !important;
  letter-spacing: 0.025em !important;
}

/* Banner/Hero text visibility over background image */
#banner {
  position: relative;
}

#banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 0;
}

#banner * {
  position: relative;
  z-index: 1;
}

#banner h2,
#banner p {
  color: #fff !important;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

/* Logo styling */
#header img[alt] {
  display: inline-block;
  vertical-align: middle;
}

/* Footer improvements */
#footer {
  text-align: center;
}

#footer .copyright {
  font-size: 0.9em;
  margin-top: 1em;
}
`;

  result = result.replace('</head>', `<style>${css}${customCSS}</style></head>`);
  console.log(`✅ CSS inlined (${Math.round(css.length / 1024)}KB + custom styles)`);
  return result;
}

export function generateFromTemplate(
  templateName: string,
  content: any,
  images: any[],
  logoUrl: string,
  colors: any
): string {
  console.log(`🎨 === GENERATING FROM TEMPLATE: ${templateName} ===`);
  console.log(`📋 Business: ${content.businessName}`);
  console.log(`🖼️  Images: ${images.length}`);
  console.log(`🎨 Colors: ${colors.primary}, ${colors.secondary}`);
  
  const html = loadTemplate(templateName);
  const css = loadTemplateCSS(templateName);
  
  if (!html || !css) {
    console.error('❌ Failed to load template files');
    return '';
  }
  
  console.log(`✅ Template loaded: ${Math.round(html.length / 1024)}KB HTML, ${Math.round(css.length / 1024)}KB CSS`);
  
  let result = stripExternalAssets(html);
  result = replaceIcons(result);
  result = injectContent(result, content, images, logoUrl, colors);
  
  const styledCSS = applyColors(css, colors);
  result = inlineCSS(result, styledCSS);
  
  console.log(`✅ === TEMPLATE GENERATION COMPLETE ===`);
  console.log(`📦 Final size: ${Math.round(result.length / 1024)}KB`);
  
  return result;
}
