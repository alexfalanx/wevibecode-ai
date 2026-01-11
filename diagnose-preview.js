// diagnose-preview.js
// Diagnostic script to check if templates are being replaced correctly

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Need: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('🔍 DIAGNOSTIC REPORT - WeVibeCode.ai Template System\n');
  console.log('=' . repeat(70));

  // Get latest preview
  const { data: previews, error } = await supabase
    .from('previews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('❌ Database query error:', error.message);
    return;
  }

  if (!previews || previews.length === 0) {
    console.log('⚠️  No previews found in database');
    return;
  }

  console.log(`\n📊 Found ${previews.length} recent preview(s)\n`);

  previews.forEach((preview, idx) => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`PREVIEW #${idx + 1}`);
    console.log(`${'='.repeat(70)}`);
    console.log(`ID: ${preview.id}`);
    console.log(`Title: ${preview.title}`);
    console.log(`Type: ${preview.generation_type || 'N/A'}`);
    console.log(`Created: ${new Date(preview.created_at).toLocaleString()}`);
    console.log(`HTML Size: ${preview.html_content?.length || 0} characters (${Math.round((preview.html_content?.length || 0) / 1024)}KB)`);

    const html = preview.html_content || '';

    // Check for template names (should NOT appear)
    const templateNames = ['Alpha', 'Dimension', 'Spectral', 'Stellar', 'Phantom', 'Forty', 'Solid State', 'Story', 'Massively', 'Hyperspace'];
    const foundTemplateNames = [];
    templateNames.forEach(name => {
      // Use word boundary to avoid false positives
      const regex = new RegExp(`\\b${name}\\b`, 'i');
      if (regex.test(html)) {
        foundTemplateNames.push(name);
      }
    });

    // Check for lorem ipsum text (should NOT appear)
    const loremPhrases = [
      'Lorem ipsum',
      'Etiam quis viverra',
      'Magna etiam feugiat',
      'Sed ipsum dolor',
      'Nullam dignissim',
      'consectetur adipiscing elit'
    ];
    const foundLorem = [];
    loremPhrases.forEach(phrase => {
      if (html.includes(phrase)) {
        foundLorem.push(phrase);
      }
    });

    // Check for HTML5 UP credits (should NOT appear)
    const foundHTML5UP = html.includes('HTML5 UP') || html.includes('html5up');
    const foundUntitled = html.includes('© Untitled');

    // Check for v5.1 indicators
    const hasBusinessContent = html.length > 50000; // v5.1 generates larger HTML

    console.log('\n📋 TEMPLATE TEXT CHECK:');
    if (foundTemplateNames.length > 0) {
      console.log(`   ❌ Found template names: ${foundTemplateNames.join(', ')}`);
    } else {
      console.log(`   ✅ No template names found`);
    }

    if (foundLorem.length > 0) {
      console.log(`   ❌ Found lorem ipsum: ${foundLorem.slice(0, 3).join(', ')}${foundLorem.length > 3 ? '...' : ''}`);
    } else {
      console.log(`   ✅ No lorem ipsum found`);
    }

    if (foundHTML5UP) {
      console.log(`   ❌ Found "HTML5 UP" credits`);
    } else {
      console.log(`   ✅ No HTML5 UP credits`);
    }

    if (foundUntitled) {
      console.log(`   ❌ Found "© Untitled" in footer`);
    } else {
      console.log(`   ✅ No "© Untitled" found`);
    }

    // Extract title tag
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      console.log(`\n🏷️  Page Title: "${titleMatch[1]}"`);
    }

    // Count images
    const imageMatches = html.match(/src="https:\/\/[^"]+"/g) || [];
    const pexelsImages = imageMatches.filter(img => img.includes('pexels')).length;
    const unsplashImages = imageMatches.filter(img => img.includes('unsplash')).length;
    const dalleImages = imageMatches.filter(img => img.includes('oaidalleapiprodscus') || img.includes('openai')).length;

    console.log(`\n🖼️  Images Found:`);
    console.log(`   - Pexels: ${pexelsImages}`);
    console.log(`   - Unsplash: ${unsplashImages}`);
    console.log(`   - DALL-E: ${dalleImages}`);
    console.log(`   - Total external: ${imageMatches.length}`);

    // Version detection
    console.log(`\n🔬 VERSION ANALYSIS:`);
    if (foundTemplateNames.length === 0 && foundLorem.length === 0 && !foundHTML5UP && !foundUntitled) {
      console.log(`   ✅ LIKELY v5.1 COMPLETE - All template text replaced`);
    } else if (foundTemplateNames.length > 0 || foundLorem.length > 0) {
      console.log(`   ❌ LIKELY OLD VERSION - Template text still present`);
      console.log(`   👉 This preview was generated BEFORE v5.1 was installed`);
    } else {
      console.log(`   ⚠️  PARTIAL REPLACEMENT - Some issues remain`);
    }

    // Show first 500 chars of body
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
    if (bodyMatch) {
      const bodyText = bodyMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 300);
      console.log(`\n📄 Preview of body text (first 300 chars):`);
      console.log(`   "${bodyText}..."`);
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('   1. If latest preview shows template text, generate a NEW preview');
  console.log('   2. v5.1 is installed - new generations should work correctly');
  console.log('   3. Old previews will keep their template text (database entries)');
  console.log('   4. To fix: Generate a test website via /dashboard/generate');
  console.log('\n');
}

diagnose().catch(err => {
  console.error('❌ Script error:', err);
});
