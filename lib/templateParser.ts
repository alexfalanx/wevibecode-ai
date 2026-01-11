// lib/templateParser.ts
// Template parser for injecting dynamic content into free HTML templates

import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

interface Template {
  id: string;
  name: string;
  source: string;
  path: string;
  bestFor: string[];
  vibe: string[];
  layout: string;
  html: string;
  css: string;
  js: string;
}

interface TemplateIndex {
  templates: Array<{
    id: string;
    name: string;
    source: string;
    path: string;
    bestFor: string[];
    vibe: string[];
    layout: string;
    hasHero: boolean;
    hasSidebar: boolean;
    colorScheme: string;
  }>;
}

export class TemplateParser {
  private templatesPath: string;
  private templateIndex: TemplateIndex;
  private templateCache: Map<string, Template>;

  constructor(templatesPath: string = './templates') {
    this.templatesPath = templatesPath;
    this.templateCache = new Map();
    
    // Load template index
    const indexPath = path.join(templatesPath, 'template-index.json');
    
    try {
      this.templateIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      console.log(`✅ Loaded ${this.templateIndex.templates.length} templates from index`);
    } catch (error) {
      console.error('❌ Failed to load template index:', error);
      this.templateIndex = { templates: [] };
    }
  }

  /**
   * Select best template based on website type and vibe
   */
  selectTemplate(websiteType: string, vibe: string): string {
    console.log(`🔍 Searching for template: ${websiteType} + ${vibe}`);
    
    // First try: exact match (type AND vibe)
    const exactMatches = this.templateIndex.templates.filter(t => 
      t.bestFor.includes(websiteType) && t.vibe.includes(vibe)
    );

    if (exactMatches.length > 0) {
      const selected = exactMatches[Math.floor(Math.random() * exactMatches.length)];
      console.log(`✅ Exact match found: ${selected.name}`);
      return selected.id;
    }

    // Second try: match website type only
    const typeMatches = this.templateIndex.templates.filter(t => 
      t.bestFor.includes(websiteType)
    );
    
    if (typeMatches.length > 0) {
      const selected = typeMatches[Math.floor(Math.random() * typeMatches.length)];
      console.log(`⚠️  Type-only match: ${selected.name} (vibe mismatch)`);
      return selected.id;
    }

    // Third try: match vibe only
    const vibeMatches = this.templateIndex.templates.filter(t => 
      t.vibe.includes(vibe)
    );
    
    if (vibeMatches.length > 0) {
      const selected = vibeMatches[Math.floor(Math.random() * vibeMatches.length)];
      console.log(`⚠️  Vibe-only match: ${selected.name} (type mismatch)`);
      return selected.id;
    }
    
    // Last resort: random template
    if (this.templateIndex.templates.length > 0) {
      const allTemplates = this.templateIndex.templates;
      const selected = allTemplates[Math.floor(Math.random() * allTemplates.length)];
      console.log(`⚠️  Random fallback: ${selected.name}`);
      return selected.id;
    }

    console.error('❌ No templates available!');
    return '';
  }

  /**
   * Load and parse template files with caching
   */
  loadTemplate(templateId: string): Template | null {
    // Check cache first
    if (this.templateCache.has(templateId)) {
      console.log(`📦 Using cached template: ${templateId}`);
      return this.templateCache.get(templateId)!;
    }

    const templateMeta = this.templateIndex.templates.find(t => t.id === templateId);
    
    if (!templateMeta) {
      console.error(`❌ Template ${templateId} not found in index`);
      return null;
    }

    const templatePath = path.join(this.templatesPath, templateMeta.path);
    const htmlPath = path.join(templatePath, 'index.html');

    if (!fs.existsSync(htmlPath)) {
      console.error(`❌ HTML file not found: ${htmlPath}`);
      return null;
    }

    console.log(`📂 Loading template from: ${htmlPath}`);
    const html = fs.readFileSync(htmlPath, 'utf-8');
    
    // Parse HTML and extract CSS/JS
    const $ = cheerio.load(html);
    
    // Extract all CSS
    let css = '';
    
    // Inline styles
    $('style').each((i, elem) => {
      css += $(elem).html() + '\n\n';
    });
    
    // Linked stylesheets
    $('link[rel="stylesheet"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && !href.startsWith('http') && !href.startsWith('//')) {
        const cssPath = path.join(templatePath, href);
        if (fs.existsSync(cssPath)) {
          console.log(`  📄 Loading CSS: ${href}`);
          css += fs.readFileSync(cssPath, 'utf-8') + '\n\n';
        }
      }
    });
    
    // Extract all JavaScript
    let js = '';
    
    // Inline scripts
    $('script').each((i, elem) => {
      const src = $(elem).attr('src');
      if (!src) {
        // Inline script
        js += $(elem).html() + '\n\n';
      } else if (!src.startsWith('http') && !src.startsWith('//')) {
        // Local script file
        const jsPath = path.join(templatePath, src);
        if (fs.existsSync(jsPath)) {
          console.log(`  📄 Loading JS: ${src}`);
          js += fs.readFileSync(jsPath, 'utf-8') + '\n\n';
        }
      }
    });

    const template: Template = {
      id: templateId,
      name: templateMeta.name,
      source: templateMeta.source,
      path: templateMeta.path,
      bestFor: templateMeta.bestFor,
      vibe: templateMeta.vibe,
      layout: templateMeta.layout,
      html,
      css,
      js,
    };

    // Cache the template
    this.templateCache.set(templateId, template);
    console.log(`✅ Template loaded and cached: ${templateMeta.name}`);

    return template;
  }

  /**
   * Inject dynamic content into template
   */
  injectContent(
    template: Template, 
    content: any, 
    colors: any, 
    images: any[], 
    logoUrl: string,
    fonts: { logo: string; heading: string; body: string }
  ): { html: string; css: string; js: string } {
    
    console.log('🎨 Injecting content into template...');
    const $ = cheerio.load(template.html);

    // ==========================================
    // BUSINESS NAME & LOGO
    // ==========================================
    const businessName = content.businessName || 'Business';
    
    // Replace logo/brand text
    $('#logo, .logo, .brand, header h1').first().text(businessName);
    
    // Inject logo image if available
    if (logoUrl) {
      $('#logo img, .logo img').attr('src', logoUrl);
      if ($('#logo img, .logo img').length === 0) {
        $('#logo, .logo').prepend(`<img src="${logoUrl}" alt="${businessName}" style="height: 48px; margin-right: 12px;">`);
      }
    }

    // ==========================================
    // HERO SECTION
    // ==========================================
    // Find hero section (multiple selectors for different templates)
    const $hero = $('#banner, #intro, .hero, .banner, #header, header.major');
    
    if ($hero.length > 0) {
      // Replace headline
      $hero.find('h1, h2').first().text(content.hero?.headline || 'Welcome');
      
      // Replace subtitle
      $hero.find('p').first().text(content.hero?.subtitle || '');
      
      // Replace CTA button
      $hero.find('a.button, a.primary, .cta, a[href="#"]').first().text(content.hero?.cta || 'Get Started');
      
      // Inject hero background image
      if (images[0]) {
        $hero.css({
          'background-image': `url(${images[0].url})`,
          'background-size': 'cover',
          'background-position': 'center'
        });
        
        // Add overlay for better text contrast
        if (!$hero.find('.overlay').length) {
          $hero.prepend('<div class="overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.4); z-index: 0;"></div>');
        }
      }
    }

    // ==========================================
    // ABOUT SECTION
    // ==========================================
    if (content.about) {
      const $about = $('#about, .about, #one');
      
      if ($about.length > 0) {
        $about.find('h2, h3').first().text(content.about.title || 'About Us');
        $about.find('p').first().text(content.about.text || '');
        
        // Inject about image
        if (images[1]) {
          $about.find('img').attr('src', images[1].url);
          if ($about.find('img').length === 0) {
            $about.find('.image, .pic').html(`<img src="${images[1].url}" alt="About" style="width: 100%; border-radius: 8px;">`);
          }
        }
      }
    }

    // ==========================================
    // FEATURES / SERVICES
    // ==========================================
    if (content.features && content.features.length > 0) {
      const $featuresSection = $('#features, .features, #two, .services');
      
      if ($featuresSection.length > 0) {
        // Find feature cards
        const $featureCards = $featuresSection.find('.feature, article, .service, .box');
        
        content.features.forEach((feature: any, index: number) => {
          const $card = $featureCards.eq(index);
          if ($card.length > 0) {
            // Replace icon
            $card.find('.icon, .fa').first().text(feature.icon || '✨');
            
            // Replace title
            $card.find('h3, h4').first().text(feature.title);
            
            // Replace description
            $card.find('p').first().text(feature.description);
          }
        });
        
        // Inject features background image
        if (images[2]) {
          $featuresSection.css({
            'background-image': `url(${images[2].url})`,
            'background-size': 'cover',
            'background-attachment': 'fixed',
            'background-position': 'center'
          });
        }
      }
    }

    // ==========================================
    // TESTIMONIALS
    // ==========================================
    if (content.testimonials && content.testimonials.length > 0) {
      const $testimonialsSection = $('#testimonials, .testimonials, #three');
      
      if ($testimonialsSection.length > 0) {
        const $testimonialCards = $testimonialsSection.find('.testimonial, blockquote, .review');
        
        content.testimonials.forEach((testimonial: any, index: number) => {
          const $card = $testimonialCards.eq(index);
          if ($card.length > 0) {
            $card.find('p, .quote').first().text(`"${testimonial.text}"`);
            $card.find('.author, .name, cite').text(testimonial.author);
            $card.find('.role, .title, .company').text(testimonial.role);
          }
        });
      }
    }

    // ==========================================
    // CONTACT SECTION
    // ==========================================
    const $contact = $('#contact, .contact, #footer');
    
    if ($contact.length > 0 && content.location) {
      $contact.find('.address').text(content.location.address || '');
      $contact.find('.phone').text(content.location.phone || '');
      $contact.find('.email').text(content.location.email || '');
    }

    // ==========================================
    // FOOTER
    // ==========================================
    $('footer').find('.copyright, p').first().text(`© 2026 ${businessName}. All rights reserved.`);
    
    if (content.tagline) {
      $('footer').append(`<p style="margin-top: 8px; opacity: 0.7;">${content.tagline}</p>`);
    }

    // ==========================================
    // INJECT CUSTOM STYLES (COLORS & FONTS)
    // ==========================================
    let customCSS = template.css;
    
    // Replace primary colors (common color values in templates)
    const commonPrimaryColors = [
      '#4CAF50', '#2196F3', '#00BCD4', '#03A9F4', 
      '#3f51b5', '#009688', '#4caf50', '#2196f3',
      'rgb(63, 81, 181)', 'rgb(33, 150, 243)'
    ];
    
    commonPrimaryColors.forEach(oldColor => {
      const regex = new RegExp(oldColor, 'gi');
      customCSS = customCSS.replace(regex, colors.primary || '#3B82F6');
    });
    
    // Replace secondary colors
    const commonSecondaryColors = [
      '#FF9800', '#FF5722', '#E91E63', '#9C27B0',
      '#ff9800', '#ff5722', '#e91e63', '#9c27b0',
      'rgb(255, 152, 0)', 'rgb(255, 87, 34)'
    ];
    
    commonSecondaryColors.forEach(oldColor => {
      const regex = new RegExp(oldColor, 'gi');
      customCSS = customCSS.replace(regex, colors.secondary || '#06B6D4');
    });

    // Add Google Fonts import
    const fontsToImport = Array.from(new Set([fonts.logo, fonts.heading, fonts.body]))
      .map(font => font.replace(/ /g, '+') + ':wght@400;600;700;800;900')
      .join('&family=');
    
    customCSS = `@import url('https://fonts.googleapis.com/css2?family=${fontsToImport}&display=swap');\n\n` + customCSS;
    
    // Add custom font overrides
    customCSS += `\n\n/* Custom font overrides */
#logo, .logo, .brand { font-family: '${fonts.logo}', serif !important; }
h1, h2, h3, h4, h5, h6 { font-family: '${fonts.heading}', sans-serif !important; }
body, p, a, li { font-family: '${fonts.body}', sans-serif !important; }
`;

    // Add photographer credits if images used
    if (images.length > 0) {
      const credits = images.map(img => img.photographer).filter(Boolean).join(', ');
      if (credits) {
        $('footer').append(`<p class="photo-credits" style="margin-top: 16px; font-size: 13px; opacity: 0.6;">Photos by ${credits}</p>`);
      }
    }

    console.log('✅ Content injection complete');

    return {
      html: $.html(),
      css: customCSS,
      js: template.js,
    };
  }

  /**
   * Get all available templates
   */
  getAvailableTemplates(): TemplateIndex['templates'] {
    return this.templateIndex.templates;
  }

  /**
   * Clear template cache (useful for development)
   */
  clearCache(): void {
    this.templateCache.clear();
    console.log('🗑️  Template cache cleared');
  }
}

// Export singleton instance
export const templateParser = new TemplateParser();
