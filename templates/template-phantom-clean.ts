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

  // 5a. Title tag
  $('title').text(`${businessName} - ${heroSubtitle.substring(0, 50)}`);

  // 5c. Hero section (header inside #main > .inner)
  console.log('🔧 Replacing hero content...');
  $('#main > .inner > header h1').text(heroHeadline);
  $('#main > .inner > header p').text(heroSubtitle);

  // 5d. Navigation - REBUILD header completely
  console.log('🔧 Rebuilding header with navigation...');
  const menuItems = [
    { text: 'Home', href: '#home' },
    { text: 'Services', href: '#services' },
    { text: 'Contact', href: '#footer' }
  ];

  // Remove old menu
  $('#menu').remove();

  // Replace header with clean version
  const newHeaderHtml = `
    <header id="header">
      <div class="header-inner">
        <a href="#home" class="logo">
          ${logoUrl ? `<img src="${logoUrl}" alt="${businessName}" class="logo-img" />` : ''}
          <span class="logo-text">${businessName}</span>
        </a>
        <nav class="main-nav">
          ${menuItems.map(item => `<a href="${item.href}">${item.text}</a>`).join('')}
        </nav>
      </div>
    </header>
  `;
  $('#header').replaceWith(newHeaderHtml);

  // 5e. Tiles - Replace content in each article
  // IMPORTANT: Only keep as many tiles as we have features (max 6 for clean layout)
  console.log('🔧 Replacing tile content...');
  const tileArticles = $('section.tiles article');
  console.log(`   Found ${tileArticles.length} tile articles`);

  const maxTiles = Math.min(featureTitles.length, 3); // Limit to 3 tiles for clean row
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

  // 5f. Footer - COMPLETELY REPLACE with our own HTML
  console.log('🔧 Rebuilding footer...');
  const newFooterHtml = `
    <footer id="footer">
      <div class="footer-inner">
        <h2>Get In Touch</h2>
        <form class="contact-form">
          <input type="text" name="name" placeholder="Your Name" required />
          <input type="email" name="email" placeholder="Your Email" required />
          <textarea name="message" placeholder="Your Message" rows="4" required></textarea>
          <button type="submit">Send Message</button>
        </form>
        <p class="copyright">&copy; ${businessName}. All rights reserved.</p>
      </div>
    </footer>
  `;
  $('#footer').replaceWith(newFooterHtml);

  // 5g. Add hero background image
  console.log('🔧 Adding hero background...');
  console.log(`   Images available: ${images.length}`);
  if (images.length > 0) {
    const heroImageUrl = images[0]?.url;
    console.log(`   Hero image URL: ${heroImageUrl}`);
    if (heroImageUrl) {
      const heroStyle = `background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${heroImageUrl}') !important; background-size: cover !important; background-position: center !important; min-height: 50vh !important;`;
      $('#main > .inner > header').attr('style', heroStyle);
      console.log(`   Applied hero style to ${$('#main > .inner > header').length} elements`);

      // Update text colors for hero with image
      $('#main > .inner > header h1').attr('style', 'color: #ffffff !important; text-shadow: 0 2px 10px rgba(0,0,0,0.5) !important;');
      $('#main > .inner > header p').attr('style', 'color: rgba(255,255,255,0.9) !important; text-shadow: 0 1px 5px rgba(0,0,0,0.4) !important;');
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

  // Add version marker to HTML for debugging
  finalHtml = finalHtml.replace('</body>', `
<!-- PHANTOM CLEAN TEMPLATE v2.0 - ${new Date().toISOString()} -->
</body>`);

  console.log('✅ === PHANTOM CLEAN GENERATION COMPLETE v2.0 ===');
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
/* HEADER (completely custom)                  */
/* ============================================ */

#header {
  position: sticky !important;
  top: 0 !important;
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(10px) !important;
  z-index: 1000 !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
  padding: 0 !important;
}

#header .header-inner,
.header-inner {
  max-width: 1200px !important;
  margin: 0 auto !important;
  padding: 1rem 2rem !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}

/* Logo */
#header .logo,
.header-inner .logo {
  display: flex !important;
  align-items: center !important;
  text-decoration: none !important;
  gap: 12px !important;
}

#header .logo-img,
.logo-img {
  height: 40px !important;
  border-radius: 8px !important;
}

#header .logo-text,
.logo-text {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-size: 1.5rem !important;
  font-weight: 700 !important;
  background: linear-gradient(135deg, ${primary}, ${secondary}) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
}

/* Main Navigation */
#header .main-nav,
.main-nav {
  display: flex !important;
  gap: 2rem !important;
  align-items: center !important;
}

#header .main-nav a,
.main-nav a {
  color: #64748b !important;
  text-decoration: none !important;
  font-weight: 500 !important;
  font-size: 1rem !important;
  transition: color 0.2s !important;
}

#header .main-nav a:hover,
.main-nav a:hover {
  color: ${primary} !important;
}

@media (max-width: 768px) {
  #header .main-nav,
  .main-nav {
    display: none !important;
  }
}

/* Mobile menu removed - using simplified navigation */

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
/* FOOTER (completely custom)                  */
/* ============================================ */

#footer {
  background: #1a1a2e !important;
  color: #ffffff !important;
  padding: 4rem 2rem !important;
}

#footer .footer-inner,
.footer-inner {
  max-width: 500px !important;
  margin: 0 auto !important;
  text-align: center !important;
}

#footer h2 {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-size: 2rem !important;
  font-weight: 700 !important;
  margin-bottom: 2rem !important;
  text-align: center !important;
  color: #ffffff !important;
}

#footer .contact-form,
.contact-form {
  display: flex !important;
  flex-direction: column !important;
  gap: 1rem !important;
  width: 100% !important;
}

#footer .contact-form input,
#footer .contact-form textarea,
.contact-form input,
.contact-form textarea {
  width: 100% !important;
  padding: 1rem !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 8px !important;
  background: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
  font-family: 'Inter', sans-serif !important;
  font-size: 1rem !important;
  box-sizing: border-box !important;
}

#footer .contact-form input:focus,
#footer .contact-form textarea:focus,
.contact-form input:focus,
.contact-form textarea:focus {
  outline: none !important;
  border-color: ${primary} !important;
  background: rgba(255, 255, 255, 0.15) !important;
}

#footer .contact-form input::placeholder,
#footer .contact-form textarea::placeholder,
.contact-form input::placeholder,
.contact-form textarea::placeholder {
  color: rgba(255, 255, 255, 0.5) !important;
}

#footer .contact-form button,
.contact-form button {
  background: linear-gradient(135deg, ${primary}, ${secondary}) !important;
  color: #ffffff !important;
  border: none !important;
  padding: 1rem 2rem !important;
  border-radius: 8px !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: transform 0.2s, box-shadow 0.2s !important;
}

#footer .contact-form button:hover,
.contact-form button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 20px rgba(0,0,0,0.3) !important;
}

#footer .copyright,
.copyright {
  margin-top: 2rem !important;
  padding-top: 2rem !important;
  border-top: 1px solid rgba(255,255,255,0.1) !important;
  color: rgba(255,255,255,0.6) !important;
  font-size: 0.9rem !important;
}

/* Old footer form CSS removed - using new contact-form class */

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
