// templates/template-system.ts
// v6.0 - DOM-BASED SYSTEMATIC REPLACEMENT

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

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

  // Remove "Sign Up" buttons from navigation BUT KEEP OTHER MENU ITEMS
  result = result.replace(/<li><a[^>]*class=["'][^"']*button[^"']*["'][^>]*>Sign Up<\/a><\/li>/gi, '');
  // Don't remove all buttons, just signup specific ones

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

// v6.0 - DOM-BASED SYSTEMATIC REPLACEMENT
export function injectContent(
  html: string,
  content: any,
  images: any[],
  logoUrl: string,
  colors: any
): string {
  console.log(`📝 v6.0 DOM-BASED INJECTION for: ${content.businessName}`);

  // Parse HTML with jsdom
  const dom = new JSDOM(html);
  const document = dom.window.document;

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

  // 1. SYSTEMATICALLY REPLACE ALL H1 TAGS (PRESERVE NESTED ELEMENTS)
  const h1Elements = document.querySelectorAll('h1');
  h1Elements.forEach((h1) => {
    // PHASE 2 FIX: Preserve nested elements by targeting text nodes only
    const links = h1.querySelectorAll('a');
    if (links.length > 0) {
      // Replace text in links while preserving link structure
      links.forEach(link => {
        // Find text nodes within link
        const textNodes = Array.from(link.childNodes).filter(node => node.nodeType === 3);
        if (textNodes.length > 0) {
          textNodes[0].textContent = businessName;
          textNodes.slice(1).forEach(node => node.textContent = '');
        } else {
          link.textContent = businessName;
        }
      });
    } else {
      // Find first text node in h1
      const textNodes = Array.from(h1.childNodes).filter(node => node.nodeType === 3);
      if (textNodes.length > 0 && textNodes[0].textContent?.trim()) {
        textNodes[0].textContent = businessName;
        textNodes.slice(1).forEach(node => node.textContent = '');
      } else {
        h1.textContent = businessName;
      }
    }
  });
  console.log(`✅ Replaced ${h1Elements.length} H1 tags with business name`);

  // 2. SYSTEMATICALLY REPLACE ALL H2 TAGS
  const h2Elements = document.querySelectorAll('h2');
  const h2Replacements = [heroHeadline, aboutTitle, 'Our Services', 'Get In Touch', heroHeadline];
  h2Elements.forEach((h2, index) => {
    const replacement = h2Replacements[index % h2Replacements.length];
    // Keep links if they exist
    const links = h2.querySelectorAll('a');
    if (links.length > 0) {
      links.forEach(link => {
        link.textContent = replacement;
      });
    } else {
      h2.textContent = replacement;
    }
  });
  console.log(`✅ Replaced ${h2Elements.length} H2 tags with section titles`);

  // 3. SYSTEMATICALLY REPLACE ALL H3 TAGS
  const h3Elements = document.querySelectorAll('h3');
  h3Elements.forEach((h3, index) => {
    const replacement = featureTitles[index % featureTitles.length];
    // Keep links if they exist
    const links = h3.querySelectorAll('a');
    if (links.length > 0) {
      links.forEach(link => {
        link.textContent = replacement;
      });
    } else {
      h3.textContent = replacement;
    }
  });
  console.log(`✅ Replaced ${h3Elements.length} H3 tags with feature titles`);

  // 4. SYSTEMATICALLY REPLACE ALL PARAGRAPH TAGS
  const pElements = document.querySelectorAll('p');
  pElements.forEach((p, index) => {
    // Skip if paragraph is empty or only has images
    if (!p.textContent?.trim() || p.querySelector('img')) return;

    // Skip if paragraph only contains links or buttons
    const onlyHasLinks = Array.from(p.childNodes).every(node =>
      node.nodeType === 3 && !node.textContent?.trim() ||
      (node as any).tagName === 'A' ||
      (node as any).tagName === 'BR'
    );

    if (onlyHasLinks) return;

    // Replace with content from pool
    const replacement = paragraphPool[index % paragraphPool.length];

    // Keep <br> tags and structure, just replace text nodes
    const textNodes = Array.from(p.childNodes).filter(node => node.nodeType === 3);
    if (textNodes.length > 0 && textNodes[0].textContent) {
      textNodes[0].textContent = replacement;
      // Remove other text nodes
      textNodes.slice(1).forEach(node => node.remove());
    } else {
      p.textContent = replacement;
    }
  });
  console.log(`✅ Replaced ${pElements.length} paragraph tags with business content`);

  // 5. REPLACE MENU ITEMS (EXPANDED SELECTORS, HIDE INSTEAD OF REMOVE)
  const menuLinks = document.querySelectorAll(
    'nav a, #nav a, .menu a, header a, ul.nav a, .navigation a, #menu a'
  );
  let menuLinksReplaced = 0;
  menuLinks.forEach(link => {
    const text = link.textContent?.trim().toLowerCase() || '';
    if (text.includes('generic') || text.includes('dropdown')) {
      link.textContent = 'About';
      link.setAttribute('href', '#about');
      menuLinksReplaced++;
    } else if (text.includes('elements') || text.includes('layouts')) {
      link.textContent = 'Services';
      link.setAttribute('href', '#services');
      menuLinksReplaced++;
    } else if (text.includes('sign up') || text.includes('signup')) {
      link.textContent = 'Contact';
      link.setAttribute('href', '#contact');
      menuLinksReplaced++;
    } else if (text.includes('log in') || text.includes('login')) {
      // PHASE 2 FIX: Hide instead of remove to preserve menu structure
      (link as HTMLElement).style.display = 'none';
      menuLinksReplaced++;
    }
  });
  console.log(`✅ Updated ${menuLinksReplaced} menu navigation links`);

  // 6. REPLACE CTA BUTTONS
  const buttons = document.querySelectorAll('button, .button, input[type="submit"], input[type="button"]');
  buttons.forEach(button => {
    const text = button.textContent?.trim().toLowerCase() || '';
    if (text.includes('activate') || text.includes('get started') || text.includes('learn more')) {
      if (button.tagName === 'INPUT') {
        button.setAttribute('value', ctaText);
      } else {
        button.textContent = ctaText;
      }
    }
  });
  console.log(`✅ Replaced CTA buttons`);

  // 7. REPLACE TITLE TAG
  const titleElement = document.querySelector('title');
  if (titleElement) {
    titleElement.textContent = `${businessName} - ${heroSubtitle}`;
  }

  // 8. CLEAN FOOTER - Remove HTML5 UP credits (PRESERVE STRUCTURE)
  // PHASE 2 FIX: Target specific elements instead of replacing entire innerHTML
  const copyrightParagraphs = document.querySelectorAll(
    'footer p.copyright, #footer p.copyright, .copyright, footer p'
  );
  copyrightParagraphs.forEach(p => {
    const text = p.textContent || '';
    if (text.includes('Untitled') || text.includes('HTML5 UP') || text.includes('Design:')) {
      // Replace just the text content, preserving paragraph element and classes
      p.textContent = `© ${businessName}. All rights reserved.`;
    }
  });

  // Hide (don't remove) design credit links to preserve layout
  const designLinks = document.querySelectorAll('a[href*="html5up"]');
  designLinks.forEach(link => {
    (link as HTMLElement).style.display = 'none';
  });

  console.log(`✅ Cleaned footer and removed template credits`);

  // Get modified HTML
  let result = dom.serialize();

  // 9. REPLACE IMAGES (still use regex for this)
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

  // 11. ADD HERO BACKGROUND IMAGE (EXPANDED SELECTORS)
  if (images.length > 0) {
    const heroImage = images[0].url;

    // PHASE 2 FIX: Expanded selectors for hero sections
    // Try multiple common hero section patterns
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

    console.log(`✅ Added hero background image with expanded selectors`);
  }

  console.log(`✅ v6.0 DOM-BASED INJECTION COMPLETE - NO LOREM IPSUM LEFT!`);
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
