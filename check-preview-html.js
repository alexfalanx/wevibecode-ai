// check-preview-html.js
// Check the actual HTML content of the generated preview

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gmifwnqpgmlitqtcogrb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtaWZ3bnFwZ21saXRxdGNvZ3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NzA0NDksImV4cCI6MjA4MzM0NjQ0OX0._Fho6oh-fr6RkvLJ3aPXK7jdpesTd9XZORZdJ-Bmqms';

const supabase = createClient(supabaseUrl, supabaseKey);

const PREVIEW_ID = '3389a43e-eb67-4360-a8fa-4109a993b42c';

async function checkPreview() {
  console.log('🔍 Checking Preview HTML Content\n');
  console.log('=' + '='.repeat(69));

  const { data, error } = await supabase
    .from('previews')
    .select('*')
    .eq('id', PREVIEW_ID)
    .maybeSingle();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!data) {
    console.log('❌ Preview not found');
    return;
  }

  const html = data.html_content || '';

  console.log('\n📊 PREVIEW METADATA:');
  console.log(`   ID: ${data.id}`);
  console.log(`   Title: ${data.title}`);
  console.log(`   Type: ${data.generation_type}`);
  console.log(`   Created: ${new Date(data.created_at).toLocaleString()}`);
  console.log(`   HTML Size: ${Math.round(html.length / 1024)}KB`);

  // Extract title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  console.log(`\n🏷️  Page Title: "${titleMatch ? titleMatch[1] : 'N/A'}"`);

  // Check for logo
  const logoMatches = html.match(/<img[^>]*alt="[^"]*"[^>]*class="logo-image"[^>]*>/g) || [];
  console.log(`\n🖼️  LOGO CHECK:`);
  if (logoMatches.length > 0) {
    logoMatches.forEach((match, i) => {
      const srcMatch = match.match(/src="([^"]+)"/);
      console.log(`   Logo ${i + 1}: ${srcMatch ? srcMatch[1].substring(0, 60) + '...' : 'N/A'}`);
    });
  } else {
    console.log(`   ❌ No logo image found in HTML`);
    const logoIconMatch = html.match(/<span class="logo-icon">([^<]+)<\/span>/);
    if (logoIconMatch) {
      console.log(`   ℹ️  Using icon fallback: ${logoIconMatch[1]}`);
    }
  }

  // Check logo text
  const logoTextMatch = html.match(/<span class="logo-text">([^<]+)<\/span>/);
  console.log(`\n📝 LOGO TEXT:`);
  if (logoTextMatch) {
    console.log(`   Text: "${logoTextMatch[1]}"`);
  } else {
    console.log(`   ❌ No logo text found`);
  }

  // Check hero section
  console.log(`\n🎨 HERO SECTION:`);
  const heroImageMatch = html.match(/<div class="hero-image">[\s\S]*?<img src="([^"]+)"[\s\S]*?<\/div>/);
  if (heroImageMatch) {
    console.log(`   ✅ Hero background image: ${heroImageMatch[1].substring(0, 60)}...`);
  } else {
    console.log(`   ❌ No hero background image found`);
    const heroGradientMatch = html.match(/<div class="hero-gradient"><\/div>/);
    if (heroGradientMatch) {
      console.log(`   ℹ️  Using gradient fallback`);
    }
  }

  const heroHeadlineMatch = html.match(/<section class="hero[^>]*>[\s\S]*?<h1>([^<]+)<\/h1>/);
  if (heroHeadlineMatch) {
    console.log(`   Headline: "${heroHeadlineMatch[1]}"`);
  }

  // Check menu section
  console.log(`\n🍽️  MENU SECTION:`);
  const menuSection = html.match(/<section[^>]*id="menu"[^>]*>[\s\S]*?<\/section>/);
  if (menuSection) {
    const menuCategories = (menuSection[0].match(/<div class="menu-category">/g) || []).length;
    const menuItems = (menuSection[0].match(/<div class="menu-item">/g) || []).length;
    console.log(`   ✅ Menu section found`);
    console.log(`   Categories: ${menuCategories}`);
    console.log(`   Total items: ${menuItems}`);

    // Extract category names
    const categoryMatches = menuSection[0].matchAll(/<h3 class="menu-category-title">([^<]+)<\/h3>/g);
    let catNum = 1;
    for (const match of categoryMatches) {
      console.log(`   ${catNum}. ${match[1]}`);
      catNum++;
    }
  } else {
    console.log(`   ❌ No menu section found`);
  }

  // Check about section
  console.log(`\n📖 ABOUT SECTION:`);
  const aboutSection = html.match(/<section[^>]*id="about"[^>]*>[\s\S]*?<\/section>/);
  if (aboutSection) {
    const paragraphs = (aboutSection[0].match(/<p>/g) || []).length;
    console.log(`   ✅ About section found`);
    console.log(`   Paragraphs: ${paragraphs}`);

    // Check for duplicates
    const aboutText = aboutSection[0];
    const allParagraphs = aboutText.matchAll(/<p>([^<]+)<\/p>/g);
    const paragraphTexts = Array.from(allParagraphs).map(m => m[1]);
    const uniqueParagraphs = new Set(paragraphTexts);

    if (paragraphTexts.length !== uniqueParagraphs.size) {
      console.log(`   ⚠️  DUPLICATES DETECTED: ${paragraphTexts.length} total, ${uniqueParagraphs.size} unique`);
    }
  } else {
    console.log(`   ❌ No about section found`);
  }

  // Check for unwanted elements
  console.log(`\n🚫 UNWANTED ELEMENTS:`);
  const signUpButton = html.includes('Sign up') || html.includes('sign up');
  const newsletterSection = html.includes('newsletter');

  if (signUpButton) {
    console.log(`   ⚠️  "Sign up" text found (should remove for restaurant)`);
  }
  if (newsletterSection) {
    console.log(`   ⚠️  Newsletter section found`);
  }

  // Check footer
  console.log(`\n🦶 FOOTER:`);
  const footerMatch = html.match(/<footer class="footer">[\s\S]*?<\/footer>/);
  if (footerMatch) {
    const footerText = footerMatch[0].replace(/<[^>]+>/g, '').trim();
    console.log(`   ✅ Footer found`);
    console.log(`   Content: "${footerText.substring(0, 150)}..."`);

    if (footerText.includes('Untitled')) {
      console.log(`   ❌ Still contains "Untitled"`);
    }
    if (footerText.includes('HTML5 UP')) {
      console.log(`   ❌ Still contains "HTML5 UP" credits`);
    }
  } else {
    console.log(`   ❌ No footer found`);
  }

  // Check for template text
  console.log(`\n🔍 TEMPLATE TEXT CHECK:`);
  const templateNames = ['Phantom', 'Stellar', 'Alpha', 'Spectral'];
  let foundTemplateText = false;
  templateNames.forEach(name => {
    const regex = new RegExp(`\\b${name}\\b`, 'i');
    if (regex.test(html)) {
      console.log(`   ❌ Found template name: "${name}"`);
      foundTemplateText = true;
    }
  });
  if (!foundTemplateText) {
    console.log(`   ✅ No template names found`);
  }

  // Check images
  console.log(`\n🖼️  IMAGES:`);
  const allImages = html.matchAll(/src="(https:\/\/[^"]+)"/g);
  const imageUrls = Array.from(allImages).map(m => m[1]);
  const pexelsImages = imageUrls.filter(url => url.includes('pexels'));
  const dalleImages = imageUrls.filter(url => url.includes('oaidalleapi') || url.includes('openai'));

  console.log(`   Total external images: ${imageUrls.length}`);
  console.log(`   Pexels images: ${pexelsImages.length}`);
  console.log(`   DALL-E images: ${dalleImages.length}`);

  if (dalleImages.length > 0) {
    console.log(`\n   DALL-E Logo URL:`);
    console.log(`   ${dalleImages[0]}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n💡 SUMMARY:');
  console.log(`   - Logo image: ${logoMatches.length > 0 ? '✅' : '❌'}`);
  console.log(`   - Hero background: ${heroImageMatch ? '✅' : '❌'}`);
  console.log(`   - Menu categories: ${menuSection ? (menuSection[0].match(/<div class="menu-category">/g) || []).length : 0}`);
  console.log(`   - Footer: ${footerMatch ? '✅' : '❌'}`);
  console.log(`   - Template text: ${foundTemplateText ? '❌ FOUND' : '✅ CLEAN'}`);
  console.log('\n');
}

checkPreview().catch(err => {
  console.error('❌ Error:', err);
});
