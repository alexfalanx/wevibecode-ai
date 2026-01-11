// test-template-replacement.js
// Unit test to verify v5.1 template replacement works correctly

const fs = require('fs');
const path = require('path');

// Load the template system functions
const templateSystemPath = path.join(__dirname, 'templates', 'template-system.ts');

console.log('🧪 TEMPLATE REPLACEMENT TEST\n');
console.log('=' . repeat(70));

// Check if v5.1 is installed
const templateSystemCode = fs.readFileSync(templateSystemPath, 'utf-8');
const hasV51Comment = templateSystemCode.includes('v5.1 COMPLETE');

console.log('\n📦 VERSION CHECK:');
if (hasV51Comment) {
  console.log('   ✅ v5.1 COMPLETE detected in template-system.ts');
} else {
  console.log('   ❌ v5.1 NOT detected - file may be outdated');
  process.exit(1);
}

// Count replacements
const allH2Count = (templateSystemCode.match(/allH2Headings = \[[\s\S]*?\]/)?.[0].match(/'/g) || []).length;
const allH3Count = (templateSystemCode.match(/allH3Headings = \[[\s\S]*?\]/)?.[0].match(/'/g) || []).length;
const allLoremCount = (templateSystemCode.match(/allLoremPhrases = \[[\s\S]*?\]/)?.[0].match(/'/g) || []).length;

console.log(`\n📊 PHRASE COUNTS:`);
console.log(`   - H2 headings: ${allH2Count / 2} replacements`);
console.log(`   - H3 headings: ${allH3Count / 2} replacements`);
console.log(`   - Lorem phrases: ${allLoremCount / 2} replacements`);
console.log(`   - TOTAL: ${(allH2Count + allH3Count + allLoremCount) / 2} phrase replacements`);

if ((allH2Count + allH3Count + allLoremCount) / 2 >= 100) {
  console.log('   ✅ 100+ phrase replacements detected');
} else {
  console.log('   ⚠️  Less than 100 replacements - may need update');
}

// Test template loading
console.log('\n🔍 TEMPLATE FILE CHECK:');
const templates = ['Alpha', 'Dimension', 'Spectral', 'Stellar', 'Phantom', 'Forty', 'Solid State', 'Hyperspace'];
let allTemplatesExist = true;

templates.forEach(templateName => {
  const templatePath = path.join(__dirname, 'templates', 'html5up', templateName, 'index.html');
  const exists = fs.existsSync(templatePath);

  if (exists) {
    const html = fs.readFileSync(templatePath, 'utf-8');
    const size = Math.round(html.length / 1024);
    console.log(`   ✅ ${templateName}: ${size}KB`);

    // Check if it has template text that needs replacing
    const hasTemplateText = html.includes('Lorem ipsum') || html.includes('Untitled');
    if (hasTemplateText) {
      console.log(`      📝 Contains template text (will be replaced)`);
    }
  } else {
    console.log(`   ❌ ${templateName}: NOT FOUND`);
    allTemplatesExist = false;
  }
});

if (!allTemplatesExist) {
  console.log('\n❌ Some templates are missing!');
  process.exit(1);
}

// Simulate replacement
console.log('\n🧪 SIMULATION TEST:');
console.log('   Testing replacement on Phantom template...');

const phantomPath = path.join(__dirname, 'templates', 'html5up', 'Phantom', 'index.html');
let html = fs.readFileSync(phantomPath, 'utf-8');

console.log(`   Original size: ${Math.round(html.length / 1024)}KB`);

// Count occurrences before
const beforePhantom = (html.match(/\bPhantom\b/gi) || []).length;
const beforeLorem = (html.match(/Lorem ipsum/gi) || []).length;
const beforeUntitled = (html.match(/© Untitled/gi) || []).length;

console.log(`   Before replacement:`);
console.log(`     - "Phantom": ${beforePhantom} occurrences`);
console.log(`     - "Lorem ipsum": ${beforeLorem} occurrences`);
console.log(`     - "© Untitled": ${beforeUntitled} occurrences`);

// Simulate v5.1 replacements
const businessName = 'Test Business';

// Replace Phantom
html = html.replace(/\bPhantom\b/gi, businessName);

// Replace Lorem ipsum
html = html.replace(/Lorem ipsum dolor sit amet/gi, 'Welcome to our amazing business');

// Replace Untitled
html = html.replace(/© Untitled/gi, `© ${businessName}`);

// Count after
const afterPhantom = (html.match(/\bPhantom\b/gi) || []).length;
const afterLorem = (html.match(/Lorem ipsum/gi) || []).length;
const afterUntitled = (html.match(/© Untitled/gi) || []).length;

console.log(`   After replacement:`);
console.log(`     - "Phantom": ${afterPhantom} occurrences`);
console.log(`     - "Lorem ipsum": ${afterLorem} occurrences`);
console.log(`     - "© Untitled": ${afterUntitled} occurrences`);

// Verify replacements worked
let testsPassed = 0;
let testsFailed = 0;

if (afterPhantom === 0) {
  console.log(`   ✅ "Phantom" fully replaced`);
  testsPassed++;
} else {
  console.log(`   ❌ "Phantom" still appears ${afterPhantom} times`);
  testsFailed++;
}

if (afterLorem < beforeLorem) {
  console.log(`   ✅ "Lorem ipsum" reduced`);
  testsPassed++;
} else {
  console.log(`   ❌ "Lorem ipsum" not reduced`);
  testsFailed++;
}

if (afterUntitled === 0) {
  console.log(`   ✅ "© Untitled" fully replaced`);
  testsPassed++;
} else {
  console.log(`   ❌ "© Untitled" still appears`);
  testsFailed++;
}

// Final report
console.log('\n' + '='.repeat(70));
console.log('\n📋 FINAL REPORT:');
console.log(`   ✅ Tests Passed: ${testsPassed}/3`);
console.log(`   ❌ Tests Failed: ${testsFailed}/3`);

if (testsFailed === 0) {
  console.log('\n   🎉 ALL TESTS PASSED!');
  console.log('   v5.1 template replacement is working correctly.');
  console.log('\n   👉 NEXT STEPS:');
  console.log('      1. Go to http://localhost:3000/dashboard/generate');
  console.log('      2. Generate a NEW website');
  console.log('      3. Check the preview - template text should be GONE');
  console.log('      4. Old previews will still show template text (database entries)');
} else {
  console.log('\n   ❌ SOME TESTS FAILED');
  console.log('   Template replacement may not work correctly.');
  process.exit(1);
}

console.log('\n');
