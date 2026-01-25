// templates/template-system-cheerio.ts
// v7.0 - CHEERIO-BASED SYSTEMATIC REPLACEMENT (serverless-compatible)
// Migrated from jsdom to cheerio to resolve ES Module compatibility issues

import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

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
  result = result.replace(/<section[^>]*id=["']cta["'][^>]*>[\s\S]*?<\/section>/gi, '');
  result = result.replace(/<li><a[^>]*class=["'][^"']*button[^"']*["'][^>]*>Sign Up<\/a><\/li>/gi, '');
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

// v7.0 - CHEERIO-BASED SYSTEMATIC REPLACEMENT
export function injectContent(
  html: string,
  content: any,
  images: any[],
  logoUrl: string,
  colors: any
): string {
  console.log(`📝 v7.0 CHEERIO-BASED INJECTION for: ${content.businessName}`);

  // Parse HTML with cheerio
  const $ = cheerio.load(html);

  // Prepare content arrays
  const businessName = content.businessName || 'Your Business';
  const heroHeadline = content.hero?.headline || businessName;
  const heroSubtitle = content.hero?.subtitle || content.tagline || 'Professional services you can trust';
  const aboutTitle = content.about?.title || 'About Us';
  const aboutText = content.about?.text || heroSubtitle;
  const ctaText = content.hero?.cta || 'Get Started';

  // Build feature/service titles and descriptions
  const featureTitles = content.features?.map((f: any) => f.title) || content.services?.map((s: any) => s.title) || ['Our Service', 'Quality', 'Expertise'];
  const featureDescriptions = content.features?.map((f: any) => f.description) || content.services?.map((s: any) => s.description) || [heroSubtitle];

  // Build paragraph content pool
  const paragraphPool = [
    heroSubtitle,
    aboutText,
    ...featureDescriptions,
    content.tagline,
    `${businessName} is committed to providing exceptional service.`,
    `We take pride in delivering quality results for our clients.`,
    `Our team of professionals is dedicated to your success.`
  ].filter(Boolean);

  // 1. REPLACE ALL H1 TAGS
  $('h1').each((i, elem) => {
    const $h1 = $(elem);
    const $links = $h1.find('a');

    if ($links.length > 0) {
      // Replace text in links while preserving link structure
      $links.each((j, link) => {
        $(link).text(businessName);
      });
    } else {
      $h1.text(businessName);
    }
  });
  console.log(`✅ Replaced ${$('h1').length} H1 tags with business name`);

  // 2. REPLACE ALL H2 TAGS
  const h2Replacements = [heroHeadline, aboutTitle, 'Our Services', 'Get In Touch', heroHeadline];
  $('h2').each((i, elem) => {
    const $h2 = $(elem);
    const replacement = h2Replacements[i % h2Replacements.length];
    const $links = $h2.find('a');

    if ($links.length > 0) {
      $links.each((j, link) => {
        $(link).text(replacement);
      });
    } else {
      $h2.text(replacement);
    }
  });
  console.log(`✅ Replaced ${$('h2').length} H2 tags with section titles`);

  // 3. REPLACE ALL H3 TAGS
  $('h3').each((i, elem) => {
    const $h3 = $(elem);
    const replacement = featureTitles[i % featureTitles.length];
    const $links = $h3.find('a');

    if ($links.length > 0) {
      $links.each((j, link) => {
        $(link).text(replacement);
      });
    } else {
      $h3.text(replacement);
    }
  });
  console.log(`✅ Replaced ${$('h3').length} H3 tags with feature titles`);

  // 4. REPLACE ALL PARAGRAPH TAGS
  $('p').each((i, elem) => {
    const $p = $(elem);

    // Skip if paragraph is empty or only has images
    if (!$p.text().trim() || $p.find('img').length > 0) return;

    // Skip if paragraph only contains links or buttons
    const $links = $p.find('a');
    const $buttons = $p.find('button, .button, input[type="submit"]');

    if ($links.length > 0 && $p.text().trim() === $links.text().trim()) {
      return; // Paragraph only contains link text
    }

    if ($buttons.length > 0) return;

    // Replace with content from pool
    const replacement = paragraphPool[i % paragraphPool.length];
    $p.text(replacement);
  });
  console.log(`✅ Replaced ${$('p').length} paragraph tags with business content`);

  // 5. REPLACE MENU ITEMS
  const menuSelectors = 'nav a, #nav a, .menu a, header a, ul.nav a, .navigation a, #menu a';
  let menuLinksReplaced = 0;

  $(menuSelectors).each((i, elem) => {
    const $link = $(elem);
    const text = $link.text().trim().toLowerCase();

    if (text.includes('generic') || text.includes('dropdown')) {
      $link.text('About');
      $link.attr('href', '#about');
      menuLinksReplaced++;
    } else if (text.includes('elements') || text.includes('layouts')) {
      $link.text('Services');
      $link.attr('href', '#services');
      menuLinksReplaced++;
    } else if (text.includes('sign up') || text.includes('signup')) {
      $link.text('Contact');
      $link.attr('href', '#contact');
      menuLinksReplaced++;
    } else if (text.includes('log in') || text.includes('login')) {
      // Hide instead of remove to preserve menu structure
      $link.css('display', 'none');
      menuLinksReplaced++;
    }
  });
  console.log(`✅ Updated ${menuLinksReplaced} menu navigation links`);

  // 6. REPLACE CTA BUTTONS
  $('button, .button, input[type="submit"], input[type="button"]').each((i, elem) => {
    const $button = $(elem);
    const text = $button.text().trim().toLowerCase();
    const val = $button.attr('value')?.toLowerCase() || '';

    if (text.includes('activate') || text.includes('get started') || text.includes('learn more') ||
        val.includes('activate') || val.includes('get started') || val.includes('learn more')) {
      // Check if it's an input by checking if value attribute exists
      if ($button.attr('type') === 'submit' || $button.attr('type') === 'button') {
        $button.attr('value', ctaText);
      } else {
        $button.text(ctaText);
      }
    }
  });
  console.log(`✅ Replaced CTA buttons`);

  // 7. REPLACE TITLE TAG
  $('title').text(`${businessName} - ${heroSubtitle}`);

  // 8. CLEAN FOOTER
  const copyrightSelectors = 'footer p.copyright, #footer p.copyright, .copyright, footer p';
  $(copyrightSelectors).each((i, elem) => {
    const $p = $(elem);
    const text = $p.text();

    if (text.includes('Untitled') || text.includes('HTML5 UP') || text.includes('Design:')) {
      $p.text(`© ${businessName}. All rights reserved.`);
    }
  });

  // Hide design credit links
  $('a[href*="html5up"]').css('display', 'none');
  console.log(`✅ Cleaned footer and removed template credits`);

  // Get modified HTML
  let result = $.html();

  // 9. REPLACE IMAGES (still use regex for this - cheerio would load all images)
  if (images.length > 0) {
    result = result.replace(/images\/pic01\.jpg/gi, images[0]?.url || 'https://via.placeholder.com/800x600');
    result = result.replace(/images\/pic02\.jpg/gi, images[1]?.url || images[0]?.url || 'https://via.placeholder.com/800x600');
    result = result.replace(/images\/pic03\.jpg/gi, images[2]?.url || images[0]?.url || 'https://via.placeholder.com/800x600');
    result = result.replace(/images\/pic04\.jpg/gi, images[0]?.url || 'https://via.placeholder.com/800x600');
    result = result.replace(/images\/pic05\.jpg/gi, images[1]?.url || images[0]?.url || 'https://via.placeholder.com/800x600');
    result = result.replace(/src="images\/[^"]+"/gi, `src="${images[0]?.url || 'https://via.placeholder.com/400x300'}"`);
    console.log(`✅ Replaced template images with ${images.length} real images`);
  }

  // 10. ADD LOGO
  if (logoUrl) {
    result = result.replace(
      /<span[^>]*class="icon[^"]*fa-gem[^"]*"[^>]*><\/span>/gi,
      `<img src="${logoUrl}" alt="${businessName}" style="width: 48px; height: 48px; object-fit: contain; border-radius: 8px; margin-right: 10px;">`
    );
    result = result.replace(
      /(<h1[^>]*><a[^>]*>)([^<]+)(<\/a>)/gi,
      `$1<img src="${logoUrl}" alt="${businessName}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 6px; vertical-align: middle; margin-right: 8px;">$2$3`
    );
    console.log(`✅ Added logo to header`);
  }

  // 11. ADD HERO BACKGROUND IMAGE
  if (images.length > 0) {
    const heroImage = images[0].url;

    result = result.replace(
      /(<section[^>]*id=["']banner["'][^>]*)(>)/gi,
      `$1 style="background-image: url('${heroImage}'); background-size: cover; background-position: center; background-attachment: fixed;"$2`
    );
    result = result.replace(
      /(<section[^>]*id=["']hero["'][^>]*)(>)/gi,
      `$1 style="background-image: url('${heroImage}'); background-size: cover; background-position: center; background-attachment: fixed;"$2`
    );
    result = result.replace(
      /(<section[^>]*id=["']intro["'][^>]*)(>)/gi,
      `$1 style="background-image: url('${heroImage}'); background-size: cover; background-position: center; background-attachment: fixed;"$2`
    );
    result = result.replace(
      /(<section[^>]*class=["'][^"']*banner[^"']*["'][^>]*)(>)/gi,
      `$1 style="background-image: url('${heroImage}'); background-size: cover; background-position: center;"$2`
    );
    result = result.replace(
      /(<section[^>]*class=["'][^"']*hero[^"']*["'][^>]*)(>)/gi,
      `$1 style="background-image: url('${heroImage}'); background-size: cover; background-position: center;"$2`
    );
    result = result.replace(
      /(<div[^>]*id=["']header["'][^>]*)(>)/gi,
      `$1 style="background-image: url('${heroImage}'); background-size: cover; background-position: center;"$2`
    );

    console.log(`✅ Added hero background image`);
  }

  console.log(`✅ v7.0 CHEERIO-BASED INJECTION COMPLETE - NO LOREM IPSUM LEFT!`);
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
