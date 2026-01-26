// templates/template-phantom-clean.ts
// v1.0 - CLEAN PHANTOM TEMPLATE SYSTEM
// Strategy: Strip ALL original CSS and use our own clean, minimal CSS
// This avoids CSS specificity wars entirely

import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

/**
 * Load the raw Phantom template HTML
 */
export function loadPhantomTemplate(): string {
  const templatePath = path.join(process.cwd(), 'templates', 'html5up', 'Phantom', 'index.html');

  if (!fs.existsSync(templatePath)) {
    console.error('❌ Phantom template not found:', templatePath);
    return '';
  }

  return fs.readFileSync(templatePath, 'utf-8');
}

/**
 * Generate a complete website from Phantom template
 * CRITICAL: We completely replace the CSS, not try to override it
 */
export function generatePhantomWebsite(
  content: any,
  images: any[],
  logoUrl: string,
  colors: any
): string {
  console.log('🎨 === PHANTOM CLEAN GENERATION ===');
  console.log('📋 Business:', content.businessName);
  console.log('🖼️  Images:', images.length);
  console.log('🎨 Colors:', colors.primary, colors.secondary);

  // Step 1: Load raw template
  const rawHtml = loadPhantomTemplate();
  if (!rawHtml) {
    console.error('❌ Failed to load Phantom template');
    return '';
  }

  // Step 2: Parse with Cheerio
  const $ = cheerio.load(rawHtml);

  // Step 3: STRIP EVERYTHING - All external assets, scripts, original CSS links
  $('link[rel="stylesheet"]').remove();
  $('noscript').remove();
  $('script').remove();

  // Step 4: Extract business content
  const businessName = content.businessName || 'Business Name';
  const heroHeadline = content.hero?.headline || 'Welcome';
  const heroSubtitle = content.hero?.subtitle || content.tagline || 'Professional services you can trust';
  const ctaText = content.hero?.cta || 'Get Started';

  // Build feature data - ensure we have content
  const features = content.features || content.services || [];
  const featureTitles = features.length > 0
    ? features.map((f: any) => f.title)
    : ['Quality Service', 'Expert Team', 'Customer Focus', 'Innovation'];
  const featureDescriptions = features.length > 0
    ? features.map((f: any) => f.description)
    : [heroSubtitle, 'We deliver exceptional results.', 'Our team is dedicated to your success.', 'Always improving to serve you better.'];

  console.log(`📋 Features found: ${features.length}`);
  console.log(`📋 Feature titles: ${featureTitles.join(', ')}`);

  // Step 5: REPLACE CONTENT (Cheerio only - no regex mixing)

  // 5a. Logo/Brand
  console.log('🔧 Replacing logo...');
  $('.logo .symbol').remove();
  $('.logo .title').text(businessName);
  if (logoUrl) {
    $('.logo').prepend(`<img src="${logoUrl}" alt="${businessName}" style="height: 40px; margin-right: 10px; vertical-align: middle;">`);
  }

  // 5b. Title tag
  $('title').text(`${businessName} - ${heroSubtitle.substring(0, 50)}`);

  // 5c. Hero section (header inside #main > .inner)
  console.log('🔧 Replacing hero content...');
  $('#main > .inner > header h1').text(heroHeadline);
  $('#main > .inner > header p').text(heroSubtitle);

  // 5d. Menu navigation - Update both mobile menu AND add desktop nav
  console.log('🔧 Updating menu...');
  $('#menu h2').text('Menu');
  const menuItems = [
    { text: 'Home', href: '#home' },
    { text: 'Services', href: '#services' },
    { text: 'Contact', href: '#contact' }
  ];

  // Update mobile menu
  $('#menu ul').empty();
  menuItems.forEach(item => {
    $('#menu ul').append(`<li><a href="${item.href}">${item.text}</a></li>`);
  });

  // Add desktop navigation to header
  const desktopNav = `
    <nav class="desktop-nav">
      ${menuItems.map(item => `<a href="${item.href}">${item.text}</a>`).join('')}
    </nav>
  `;
  $('#header .inner').append(desktopNav);

  // 5e. Tiles - Replace content in each article
  // IMPORTANT: Only keep as many tiles as we have features (max 6 for clean layout)
  console.log('🔧 Replacing tile content...');
  const tileArticles = $('section.tiles article');
  console.log(`   Found ${tileArticles.length} tile articles`);

  const maxTiles = Math.min(featureTitles.length, 6); // Limit to 6 tiles max
  console.log(`   Using ${maxTiles} tiles (features: ${featureTitles.length})`);

  tileArticles.each((index, article) => {
    const $article = $(article);

    // Remove extra tiles beyond our feature count
    if (index >= maxTiles) {
      $article.remove();
      return;
    }

    // Get feature data for this tile
    const title = featureTitles[index] || `Service ${index + 1}`;
    const description = featureDescriptions[index] || heroSubtitle;

    // Get image (cycle through available images)
    const imageIndex = index % Math.max(images.length, 1);
    const imageUrl = images[imageIndex]?.url || 'https://via.placeholder.com/800x600';

    // Replace image
    $article.find('span.image img').attr('src', imageUrl);
    $article.find('span.image img').attr('alt', title);

    // Replace title and description
    $article.find('h2').text(title);
    $article.find('.content p').text(description);

    // Update link to prevent navigation to generic.html
    $article.find('a').attr('href', '#services');
  });

  console.log(`   Tiles after cleanup: ${$('section.tiles article').length}`);

  // 5f. Footer - Clean up completely
  console.log('🔧 Updating footer...');
  $('#footer h2').first().text('Get In Touch');
  $('#footer .icons').remove(); // Remove social icons
  $('#footer section').has('.icons').remove(); // Remove "Follow" section entirely
  $('section:contains("Follow")').remove(); // Remove any Follow section
  $('#footer h2:contains("Follow")').parent().remove(); // Remove Follow heading and parent
  $('#footer .copyright').html(`&copy; ${businessName}. All rights reserved.`);

  // 5g. Add hero background image
  console.log('🔧 Adding hero background...');
  if (images.length > 0) {
    const heroImageUrl = images[0]?.url;
    if (heroImageUrl) {
      $('#main > .inner > header').attr('style', `
        background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${heroImageUrl}');
        background-size: cover;
        background-position: center;
      `);
      // Update text colors for hero with image
      $('#main > .inner > header h1').attr('style', 'color: #ffffff !important;');
      $('#main > .inner > header p').attr('style', 'color: rgba(255,255,255,0.9) !important;');
    }
  }

  // Step 6: Add id attributes for navigation
  $('#main > .inner > header').attr('id', 'home');
  $('section.tiles').attr('id', 'services');
  $('#footer').attr('id', 'contact');

  // Step 7: Serialize HTML
  let finalHtml = $.html();

  // Step 8: Inject our clean CSS (completely replacing template CSS)
  const cleanCSS = generateCleanCSS(colors);
  const cleanJS = generateCleanJS();

  // Insert CSS before </head>
  finalHtml = finalHtml.replace('</head>', `<style>${cleanCSS}</style>\n</head>`);

  // Insert JS before </body>
  finalHtml = finalHtml.replace('</body>', `<script>${cleanJS}</script>\n</body>`);

  console.log('✅ === PHANTOM CLEAN GENERATION COMPLETE ===');
  console.log(`📦 Final size: ${Math.round(finalHtml.length / 1024)}KB`);

  return finalHtml;
}

/**
 * Generate completely fresh CSS that works with Phantom's HTML structure
 * NO fighting with template CSS - we replace it entirely
 */
function generateCleanCSS(colors: any): string {
  const primary = colors.primary || '#3B82F6';
  const secondary = colors.secondary || '#06B6D4';

  return `
/* ============================================ */
/* PHANTOM CLEAN CSS - Complete Replacement    */
/* No template CSS conflicts possible          */
/* ============================================ */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #ffffff;
  color: #1a1a2e;
  line-height: 1.6;
  overflow-x: hidden;
}

/* ============================================ */
/* WRAPPER                                     */
/* ============================================ */

#wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ============================================ */
/* HEADER                                      */
/* ============================================ */

#header {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 1000;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

#header .inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Logo */
#header .logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #1a1a2e;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
}

#header .logo img {
  height: 40px;
  margin-right: 12px;
  border-radius: 8px;
}

#header .logo .title {
  background: linear-gradient(135deg, ${primary}, ${secondary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Desktop Navigation */
.desktop-nav {
  display: flex !important;
  gap: 2rem !important;
  align-items: center !important;
}

.desktop-nav a {
  color: #64748b !important;
  text-decoration: none !important;
  font-weight: 500 !important;
  transition: color 0.2s !important;
  padding: 0.5rem 0 !important;
  font-size: 1rem !important;
}

.desktop-nav a:hover {
  color: ${primary} !important;
}

/* Hide original nav (mobile menu toggle) on desktop */
#header > .inner > nav {
  display: none !important;
}

@media (max-width: 768px) {
  .desktop-nav {
    display: none !important;
  }

  #header > .inner > nav {
    display: block !important;
  }
}

#header nav ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

#header nav ul li a {
  padding: 0.5rem 1rem;
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

#header nav ul li a:hover {
  color: ${primary};
}

/* ============================================ */
/* MOBILE MENU                                 */
/* ============================================ */

#menu {
  position: fixed;
  top: 0;
  right: -100%;
  width: 280px;
  height: 100vh;
  background: #1a1a2e;
  z-index: 2000;
  padding: 2rem;
  transition: right 0.3s ease;
}

#menu.active {
  right: 0;
}

#menu h2 {
  color: #ffffff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

#menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

#menu ul li {
  margin-bottom: 0.5rem;
}

#menu ul li a {
  display: block;
  color: #ffffff;
  text-decoration: none;
  padding: 1rem;
  border-radius: 8px;
  transition: background 0.2s;
}

#menu ul li a:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* ============================================ */
/* MAIN CONTENT                                */
/* ============================================ */

#main {
  flex: 1;
}

#main .inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* ============================================ */
/* HERO SECTION (header inside .inner)         */
/* ============================================ */

#main .inner > header,
#home {
  padding: 8rem 2rem !important;
  text-align: center !important;
  background: linear-gradient(135deg, ${primary}15, ${secondary}15) !important;
  margin: 0 -2rem 3rem -2rem !important;
  min-height: 50vh !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  align-items: center !important;
  background-size: cover !important;
  background-position: center !important;
}

#main .inner > header h1 {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-size: 3.5rem !important;
  font-weight: 800 !important;
  line-height: 1.2 !important;
  margin-bottom: 1.5rem !important;
  color: #1a1a2e !important;
}

#main .inner > header p {
  font-size: 1.25rem !important;
  color: #64748b !important;
  max-width: 600px !important;
  margin: 0 auto !important;
  line-height: 1.7 !important;
}

/* When hero has background image */
#main .inner > header[style*="background-image"] h1 {
  color: #ffffff !important;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5) !important;
}

#main .inner > header[style*="background-image"] p {
  color: rgba(255,255,255,0.9) !important;
  text-shadow: 0 1px 5px rgba(0,0,0,0.4) !important;
}

/* ============================================ */
/* TILES SECTION (service cards)               */
/* ============================================ */

section.tiles,
#services {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important; /* Always 2 columns for symmetry */
  gap: 1.5rem !important;
  padding: 0 0 4rem 0 !important;
  margin: 0 !important;
  width: 100% !important;
}

@media (min-width: 900px) {
  section.tiles,
  #services {
    grid-template-columns: repeat(3, 1fr) !important; /* 3 columns on larger screens */
  }
}

@media (max-width: 600px) {
  section.tiles,
  #services {
    grid-template-columns: 1fr !important; /* 1 column on mobile */
  }
}

/* Individual tile article */
section.tiles article {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 320px;
}

section.tiles article:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

/* Image container */
section.tiles article span.image {
  display: block;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

section.tiles article span.image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

section.tiles article:hover span.image img {
  transform: scale(1.05);
}

/* Link wrapper with overlay */
section.tiles article > a {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1.5rem;
  text-decoration: none;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.85) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    rgba(0, 0, 0, 0) 100%
  );
  z-index: 1;
}

/* Title on tile */
section.tiles article h2 {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Content/description */
section.tiles article .content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

section.tiles article:hover .content {
  max-height: 200px;
}

section.tiles article .content p {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

/* ============================================ */
/* FOOTER                                      */
/* ============================================ */

#footer,
#contact {
  background: #1a1a2e !important;
  color: #ffffff !important;
  padding: 4rem 2rem !important;
}

#footer .inner {
  max-width: 600px !important;
  margin: 0 auto !important;
  padding: 0 !important;
}

#footer h2 {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-size: 2rem !important;
  font-weight: 700 !important;
  margin-bottom: 2rem !important;
  text-align: center !important;
  color: #ffffff !important;
}

#footer section {
  margin-bottom: 2rem !important;
  width: 100% !important;
}

/* Contact form */
#footer form {
  max-width: 100%;
  margin: 0 auto;
  text-align: left;
}

#footer .fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

#footer .field {
  margin-bottom: 0;
  width: 100%;
}

#footer .field.half {
  width: 100%;
}

@media (min-width: 600px) {
  #footer .fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  #footer .field.half {
    grid-column: span 1;
  }

  #footer .field:not(.half) {
    grid-column: span 2;
  }
}

#footer input,
#footer textarea {
  width: 100% !important;
  padding: 1rem !important;
  border: none !important;
  border-radius: 8px !important;
  background: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
  font-family: 'Inter', sans-serif !important;
  font-size: 1rem !important;
  transition: background 0.2s !important;
  box-sizing: border-box !important;
}

#footer input::placeholder,
#footer textarea::placeholder {
  color: rgba(255, 255, 255, 0.5) !important;
}

#footer input:focus,
#footer textarea:focus {
  outline: none !important;
  background: rgba(255, 255, 255, 0.15) !important;
}

#footer textarea {
  min-height: 120px !important;
  resize: vertical !important;
}

/* Submit button */
#footer .actions {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: center;
}

#footer .actions li {
  display: inline-block;
}

#footer input[type="submit"] {
  background: linear-gradient(135deg, ${primary}, ${secondary});
  color: #ffffff;
  font-weight: 600;
  padding: 1rem 2.5rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

#footer input[type="submit"]:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

/* Copyright */
#footer .copyright {
  list-style: none;
  padding: 2rem 0 0;
  margin: 0;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 2rem;
}

#footer .copyright li {
  display: inline-block;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

/* ============================================ */
/* RESPONSIVE                                  */
/* ============================================ */

@media (max-width: 768px) {
  #header .inner {
    padding: 1rem;
  }

  #header .logo {
    font-size: 1.25rem;
  }

  #main .inner > header h1 {
    font-size: 2rem;
  }

  #main .inner > header p {
    font-size: 1rem;
  }

  section.tiles {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  section.tiles article {
    height: 280px;
  }

  #footer .fields {
    grid-template-columns: 1fr;
  }

  #footer .field.half {
    grid-column: span 1;
  }
}

/* ============================================ */
/* UTILITY - Remove any unwanted template stuff */
/* ============================================ */

.is-preload *, .is-preload *:before, .is-preload *:after {
  animation: none !important;
  transition: none !important;
}

/* Hide menu toggle on desktop */
@media (min-width: 769px) {
  #header nav ul li a[href="#menu"] {
    display: none;
  }
}
`;
}

/**
 * Generate minimal JavaScript for interactions
 */
function generateCleanJS(): string {
  return `
// Clean Phantom JS - Minimal interactions
(function() {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#menu') {
        // Toggle mobile menu
        e.preventDefault();
        document.getElementById('menu').classList.toggle('active');
        return;
      }

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Close mobile menu if open
        document.getElementById('menu').classList.remove('active');
      }
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    const menu = document.getElementById('menu');
    const menuToggle = document.querySelector('a[href="#menu"]');

    if (menu.classList.contains('active') &&
        !menu.contains(e.target) &&
        e.target !== menuToggle) {
      menu.classList.remove('active');
    }
  });

  // Form submission
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      alert('Thank you for your message! We will get back to you soon.');
      this.reset();
    });
  });

  // Remove preload class after page load
  window.addEventListener('load', function() {
    document.body.classList.remove('is-preload');
  });
})();
`;
}

// Export for use in route.ts
export default {
  generatePhantomWebsite,
  loadPhantomTemplate
};
