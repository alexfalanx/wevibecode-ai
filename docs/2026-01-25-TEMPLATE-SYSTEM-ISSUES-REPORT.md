# Template System Issues - Technical Report
**Date:** 2026-01-25
**Project:** WeVibeCode.ai
**Issue:** HTML5UP Template Rendering Problems
**Status:** Critical - Templates not rendering correctly in production

---

## Executive Summary

The HTML5UP template system was successfully migrated from `jsdom` to `cheerio` to resolve ES Module compatibility issues with Vercel serverless functions. However, the generated websites are experiencing significant rendering problems:

1. **Content not visible** - Most of the page appears white/blank
2. **Hero text not centered** - Main headline is left-aligned instead of centered
3. **Logo/branding issues** - Business name not displaying correctly in header
4. **CSS not applying** - Template styles are not being applied properly

This document provides a complete technical analysis for a developer to diagnose and fix these issues.

---

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Current Implementation](#current-implementation)
3. [Identified Problems](#identified-problems)
4. [Code Analysis](#code-analysis)
5. [Root Cause Analysis](#root-cause-analysis)
6. [Recommended Solutions](#recommended-solutions)
7. [Testing Checklist](#testing-checklist)
8. [Reference Materials](#reference-materials)

---

## 1. System Architecture

### Overview
```
User Input (Generate Page)
    ↓
API Route: app/api/generate-website/route.ts
    ↓
Template System: templates/template-system-cheerio.ts
    ↓
Template Files: templates/html5up/[TemplateName]/
    ↓
Generated HTML (saved to Supabase)
    ↓
Preview Page: app/dashboard/preview/[id]/page.tsx
```

### Key Components

**1. API Route** (`app/api/generate-website/route.ts`)
- Handles website generation requests
- Calls OpenAI for content generation
- Calls Pexels API for images
- Calls DALL-E for logo generation (optional)
- Uses template system to build final HTML

**2. Template System** (`templates/template-system-cheerio.ts`)
- Loads HTML5UP templates
- Injects AI-generated content into templates
- Replaces colors, images, and text
- Inlines CSS
- Returns complete HTML document

**3. Templates** (`templates/html5up/`)
- 10 professional HTML5UP templates
- Each template has its own structure (different selectors, layouts)
- Templates tested: Phantom, Stellar, Alpha

---

## 2. Current Implementation

### Template System Functions

```typescript
// Main function that orchestrates template generation
export function generateFromTemplate(
  templateName: string,
  content: any,
  images: any[],
  logoUrl: string,
  colors: any
): string

// Key sub-functions:
selectTemplate(businessType: string): string
loadTemplate(templateName: string): string
loadTemplateCSS(templateName: string): string
injectContent(html, content, images, logoUrl, colors): string
applyColors(css, colors): string
inlineCSS(html, css): string
```

### Content Injection Process (injectContent)

The function performs these replacements in order:

```typescript
// 0. Replace logo/brand name
$('.logo, span.title, .brand').each(...)

// 1. Replace H1 tags with business name/headline
$('h1').each(...)

// 2. Replace H2 tags with section titles
$('h2').each(...)

// 3. Replace H3 tags with feature titles
$('h3').each(...)

// 4. Replace paragraph text
$('p').each(...)

// 5. Replace menu navigation links
$('nav a, #menu a').each(...)

// 5b. Replace template page links (generic.html)
$('a').each(...)

// 6. Replace CTA buttons
$('button, .button').each(...)

// 7. Replace title tag
$('title').text(...)

// 8. Clean footer
$('footer p').each(...)

// 9. Replace images (regex-based)
result.replace(/images\/pic01\.jpg/, images[0].url)

// 10. Add logo (regex-based)
result.replace(/<span.*fa-gem.*>/, logoHtml)

// 11. Add hero background (regex-based)
result.replace(/(<section.*banner.*>)/, addBackground)
```

### CSS Inlining

Custom CSS is added at the end of `<head>`:

```typescript
const customCSS = `
/* Phantom template specific */
#main > .inner > header {
  background: linear-gradient(...);
  text-align: center !important;
}
/* ... more CSS ... */
`;

html.replace('</head>', `<style>${templateCSS}${customCSS}</style></head>`)
```

---

## 3. Identified Problems

### Problem 1: Content Not Visible (White Page)
**Symptom:** Most of the page appears white/blank after scrolling past hero section
**Screenshot Evidence:** `template test 3.jpg` - shows "Our Story" section with very light/invisible text
**Potential Causes:**
- CSS not being applied (styles stripped or not inlined correctly)
- Text color is white on white background
- Template structure mismatch (selectors not matching actual HTML)

### Problem 2: Hero Text Not Centered
**Symptom:** Hero headline "Your Gateway to Waterfront Elegance" is left-aligned
**Screenshot Evidence:** `template test 2.jpg`
**Code Location:** `inlineCSS()` function, lines 390-415
**Current CSS:**
```css
#main > .inner > header {
  text-align: center !important;
}
#main > .inner > header h1 {
  text-align: center !important;
}
```
**Issue:** Either CSS not applying, or template structure doesn't match selector

### Problem 3: Logo/Branding Display
**Symptom:** Pexels image appearing instead of business name text
**Screenshot Evidence:** `inspect of purple page.jpg` - shows `<img src="https://images.pexels.com/...">` in logo area
**Code Location:** Lines 118-131 (logo replacement)
**Current Code:**
```typescript
$('.logo img, .logo .symbol, span.symbol').each((i, elem) => {
  $(elem).remove();
});
```
**Issue:** Logo images not being removed, or being added back later

### Problem 4: Menu Navigation
**Symptom:** Menu items may still show template names
**Code Location:** Lines 194-268 (menu replacement)
**Status:** Partially fixed, needs verification

### Problem 5: Regressions
**Symptom:** Each fix seems to break something else (going backwards)
**Root Cause:** Multiple competing replacements, order of operations issues, CSS specificity conflicts

---

## 4. Code Analysis

### Current State of Key Functions

#### injectContent() - Logo Replacement
```typescript
// Lines 118-131
// CURRENT IMPLEMENTATION
$('.logo img, .logo .symbol, span.symbol').each((i, elem) => {
  $(elem).remove();
});

$('span.title, .logo .title, .brand, #logo .title, .logo, a.logo').each((i, elem) => {
  const $elem = $(elem);
  if ($elem.is('a')) {
    $elem.html(businessName);
  } else {
    $elem.text(businessName);
  }
});

// PROBLEM: Images are removed but may be re-added by later code
// See line 337: Logo insertion via regex
result.replace(
  /<span[^>]*class="icon[^"]*fa-gem[^"]*"[^>]*><\/span>/gi,
  `<img src="${logoUrl}" alt="${businessName}" ...>`
);
```

**Issue:** Two competing operations:
1. DOM manipulation removes logo images
2. Regex replacement adds logo images back
3. Result: Pexels logo image appears instead of business name

#### injectContent() - Image Replacement
```typescript
// Lines 323-336
// Uses REGEX instead of DOM manipulation
if (images.length > 0) {
  result = result.replace(/images\/pic01\.jpg/gi, images[0]?.url);
  result = result.replace(/images\/pic02\.jpg/gi, images[1]?.url);
  // ... more replacements
  result = result.replace(/src="images\/[^"]+"/gi, `src="${images[0]?.url}"`);
}
```

**Issue:** Last line is a catch-all that replaces ALL image sources with the first image, including the logo

#### inlineCSS() - Custom Styles
```typescript
// Lines 385-494
const customCSS = `
/* Phantom template specific */
#main > .inner > header {
  background: linear-gradient(135deg, rgba(30, 30, 40, 0.95) 0%, rgba(50, 50, 70, 0.90) 100%);
  padding: 4em 3em;
  border-radius: 12px;
  margin-bottom: 2em;
  text-align: center !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

#main > .inner > header h1 {
  color: #ffffff !important;
  font-size: 2.5em !important;
  font-weight: 700 !important;
  line-height: 1.3 !important;
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.5) !important;
  margin-bottom: 0.5em !important;
  text-align: center !important;
}

/* Logo/Brand name styling */
.logo img,
.logo .symbol,
span.symbol {
  display: none !important;
}
`;

result = result.replace('</head>', `<style>${css}${customCSS}</style></head>`);
```

**Issues:**
1. CSS is template-specific (only works for Phantom)
2. May be overridden by template's inline styles
3. Selector specificity might be too low
4. The "hide logo images" CSS conflicts with earlier DOM removal

---

## 5. Root Cause Analysis

### Primary Issues

#### Issue 1: Order of Operations Conflict
**Problem:** DOM manipulation happens first, then regex replacements undo the changes

**Sequence:**
```
1. Load HTML template
2. Parse with Cheerio → Creates DOM
3. DOM manipulations:
   - Remove logo images ✓
   - Replace text content ✓
4. Serialize DOM → Back to HTML string
5. Regex replacements:
   - Replace image paths → May add logo back ✗
   - Add background images → Works ✓
6. CSS inlining:
   - Add custom styles → May not apply ✗
```

**Solution:** Either use DOM manipulation for everything OR regex for everything. Don't mix.

#### Issue 2: Template Structure Mismatch
**Problem:** CSS selectors assume specific HTML structure that varies by template

**Example - Phantom Template:**
```html
<!-- Actual structure -->
<header id="header">
  <div class="inner">
    <a href="index.html" class="logo">
      <span class="symbol"><img src="images/logo.svg" /></span>
      <span class="title">Phantom</span>
    </a>
  </div>
</header>

<div id="main">
  <div class="inner">
    <header>
      <h1>Hero Headline</h1>
      <p>Hero subtitle</p>
    </header>
  </div>
</div>
```

**Our CSS targets:** `#main > .inner > header`
**Applies to:** The inner header (hero section) ✓
**Doesn't apply to:** Other sections that use different structure ✗

#### Issue 3: CSS Specificity & Overrides
**Problem:** Template's original CSS may override our custom CSS

**Template CSS:**
```css
/* From main.css (high specificity) */
#main > .inner > header {
  text-align: left; /* Original template style */
}
```

**Our CSS:**
```css
/* Added at end (should override) */
#main > .inner > header {
  text-align: center !important; /* With !important */
}
```

**Should work, but:** Order matters, and there might be even more specific selectors in the template CSS.

#### Issue 4: Catch-All Regex
**Problem:** This line replaces ALL images with the first image:
```typescript
result.replace(/src="images\/[^"]+"/gi, `src="${images[0]?.url}"`)
```

**Effect:**
- Hero image: ✓ Correct
- Section images: ✓ Correct
- Logo image: ✗ Also replaced with first photo
- Icon images: ✗ Also replaced

#### Issue 5: Content Not Visible (White on White)
**Problem:** The page content below the hero section appears white/blank

**Hypothesis 1:** Text color is white on white background
- Template CSS might set text to white (for dark backgrounds)
- Our content sections might have white backgrounds
- Result: White text on white background = invisible

**Hypothesis 2:** CSS not being applied at all
- The `stripExternalAssets()` function removes `<link>` tags
- CSS is supposed to be inlined, but might be failing
- Result: No styles at all = default browser rendering

**Hypothesis 3:** Content actually missing
- Paragraph replacement might be too aggressive
- Might be removing content instead of replacing
- Result: Empty sections

**To Test:**
```typescript
// Check what's actually in the HTML
console.log('Paragraph count:', $('p').length);
$('p').each((i, elem) => {
  console.log(`P ${i}:`, $(elem).text().substring(0, 50));
});
```

---

## 6. Recommended Solutions

### Solution 1: Comprehensive Audit (Immediate)
**Priority:** Critical
**Effort:** 2-3 hours

**Steps:**
1. **Add detailed logging to every replacement function**
   ```typescript
   console.log('=== BEFORE H1 REPLACEMENT ===');
   console.log('H1 count:', $('h1').length);
   $('h1').each((i, elem) => {
     console.log(`H1 ${i} before:`, $(elem).html());
   });

   // Do replacement

   console.log('=== AFTER H1 REPLACEMENT ===');
   $('h1').each((i, elem) => {
     console.log(`H1 ${i} after:`, $(elem).html());
   });
   ```

2. **Log the final HTML structure**
   ```typescript
   // Before returning
   console.log('=== FINAL HTML STATS ===');
   console.log('Total length:', result.length);
   console.log('Contains business name:', result.includes(businessName));
   console.log('Style tag count:', (result.match(/<style>/g) || []).length);
   console.log('Image count:', (result.match(/<img/g) || []).length);
   ```

3. **Deploy and test with logging enabled**
4. **Review Vercel logs after generation**
5. **Identify where things go wrong**

### Solution 2: Separate Logo from Images (High Priority)
**Priority:** High
**Effort:** 1 hour

**Problem:** Logo URL and Pexels images are both being used interchangeably

**Current Code:**
```typescript
// Line 337 - This adds logo
if (logoUrl) {
  result = result.replace(
    /<span[^>]*class="icon[^"]*fa-gem[^"]*"[^>]*><\/span>/gi,
    `<img src="${logoUrl}" alt="${businessName}" ...>`
  );
}

// Line 333 - But this replaces ALL images (including logo just added)
result = result.replace(/src="images\/[^"]+"/gi, `src="${images[0]?.url}"`);
```

**Solution:**
```typescript
// 1. Do specific image replacements FIRST (before logo)
if (images.length > 0) {
  result = result.replace(/images\/pic01\.jpg/gi, images[0]?.url);
  result = result.replace(/images\/pic02\.jpg/gi, images[1]?.url || images[0]?.url);
  result = result.replace(/images\/pic03\.jpg/gi, images[2]?.url || images[0]?.url);
  // DO NOT use catch-all replacement
}

// 2. Then add logo (won't be affected by image replacements)
if (logoUrl) {
  // Only replace template logo placeholders
  result = result.replace(/images\/logo\.svg/gi, logoUrl);
  result = result.replace(/src="images\/logo\.[^"]+"/gi, `src="${logoUrl}"`);
}

// 3. OR better: Don't use logoUrl at all if no logo requested
//    Instead, just show business name as text
if (!logoUrl) {
  // Remove logo image containers completely
  result = result.replace(/<span class="symbol">.*?<\/span>/gi, '');
}
```

### Solution 3: Fix CSS Application (High Priority)
**Priority:** High
**Effort:** 2 hours

**Problem:** CSS might not be applying correctly

**Debugging Steps:**
```typescript
// In inlineCSS() function
console.log('=== CSS INLINING ===');
console.log('Template CSS size:', Math.round(css.length / 1024), 'KB');
console.log('Custom CSS size:', customCSS.length, 'bytes');
console.log('CSS contains hero styles:', customCSS.includes('#main > .inner > header'));

// After replacement
console.log('HTML contains style tag:', result.includes('<style>'));
console.log('Style tag position:', result.indexOf('<style>'));
console.log('Head tag position:', result.indexOf('</head>'));
```

**Potential Fix:**
```typescript
// Instead of replacing </head>
result = result.replace('</head>', `<style>${css}${customCSS}</style></head>`);

// Use this more robust approach
const headCloseTag = result.lastIndexOf('</head>');
if (headCloseTag === -1) {
  console.error('❌ No </head> tag found!');
  return result;
}

const beforeHead = result.substring(0, headCloseTag);
const afterHead = result.substring(headCloseTag);

result = beforeHead + `<style>${css}\n\n${customCSS}</style>\n` + afterHead;
console.log('✅ CSS inlined successfully');
```

### Solution 4: Template-Agnostic CSS (Medium Priority)
**Priority:** Medium
**Effort:** 2-3 hours

**Problem:** CSS is Phantom-specific, won't work for other templates

**Solution:** Add CSS that works for all common template structures
```css
/* Instead of just #main > .inner > header */

/* Hero section - multiple possible structures */
#main > .inner > header,
#banner,
#hero,
section.banner,
section#intro,
.hero-section,
header.major {
  text-align: center !important;
  background: linear-gradient(135deg, rgba(30, 30, 40, 0.95), rgba(50, 50, 70, 0.90)) !important;
  padding: 3em !important;
}

/* Hero headings - all possible locations */
#main > .inner > header h1,
#main > .inner > header h2,
#banner h1,
#banner h2,
#hero h1,
#hero h2,
section.banner h1,
section.banner h2 {
  color: #ffffff !important;
  text-align: center !important;
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.5) !important;
}

/* Regular content - ensure it's visible */
#main p,
.inner p,
section p {
  color: #333333 !important; /* Dark grey, visible on white */
}

/* Headings - ensure they're visible */
#main h2,
#main h3,
.inner h2,
.inner h3 {
  color: #1a1a1a !important; /* Near black */
}
```

### Solution 5: Simplify Content Injection (Low Priority)
**Priority:** Low (fix after above issues resolved)
**Effort:** 4-6 hours

**Recommendation:** Rewrite to use consistent approach

**Option A: Pure DOM Manipulation**
```typescript
// Do EVERYTHING with Cheerio DOM manipulation
// No regex replacements after serialization
function injectContent(html, content, images, logoUrl, colors) {
  const $ = cheerio.load(html);

  // Replace all content using $
  replaceText($, content);
  replaceImages($, images);
  replaceLogo($, logoUrl, businessName);
  replaceColors($, colors);

  // Return serialized HTML (no regex after this)
  return $.html();
}
```

**Option B: Pure Regex**
```typescript
// Do EVERYTHING with regex replacements
// No Cheerio parsing at all
function injectContent(html, content, images, logoUrl, colors) {
  let result = html;

  // All replacements via regex
  result = result.replace(/<h1[^>]*>.*?<\/h1>/gi, `<h1>${content.hero.headline}</h1>`);
  result = result.replace(/images\/pic01\.jpg/gi, images[0].url);
  // etc.

  return result;
}
```

**Option C: Hybrid (Current Approach) - Document What Goes Where**
```typescript
// PHASE 1: DOM Manipulation (Cheerio)
const $ = cheerio.load(html);
// - Replace text content (H1, H2, H3, P)
// - Replace menu links
// - Remove unwanted elements
let result = $.html();

// PHASE 2: Regex Replacements (String)
// - Replace images (specific paths only, no catch-all)
// - Add background styles
// - DO NOT touch anything already modified by Phase 1
result = result.replace(/images\/pic01\.jpg/gi, images[0].url);

return result;
```

### Solution 6: Add Test Suite (Medium Priority)
**Priority:** Medium
**Effort:** 4-6 hours

**Create:** `templates/test-template-system.ts`

```typescript
import { generateFromTemplate } from './template-system-cheerio';
import * as cheerio from 'cheerio';

interface TestCase {
  name: string;
  template: string;
  content: any;
  images: any[];
  logoUrl: string;
  colors: any;
  assertions: ((html: string) => boolean)[];
}

const testCases: TestCase[] = [
  {
    name: 'Phantom - Business name appears in header',
    template: 'Phantom',
    content: { businessName: 'Test Restaurant', /* ... */ },
    images: [{ url: 'https://example.com/image.jpg' }],
    logoUrl: '',
    colors: { primary: '#3B82F6', secondary: '#06B6D4' },
    assertions: [
      (html) => html.includes('Test Restaurant'),
      (html) => !html.includes('Phantom'),
      (html) => !html.includes('HTML5 UP'),
    ]
  },
  {
    name: 'Phantom - Hero text is centered',
    template: 'Phantom',
    content: { /* ... */ },
    images: [],
    logoUrl: '',
    colors: { primary: '#3B82F6', secondary: '#06B6D4' },
    assertions: [
      (html) => {
        const $ = cheerio.load(html);
        const heroHeader = $('#main > .inner > header');
        // Check if CSS contains text-align: center
        return html.includes('#main > .inner > header') &&
               html.includes('text-align: center');
      }
    ]
  },
  {
    name: 'Phantom - Images are replaced',
    template: 'Phantom',
    content: { /* ... */ },
    images: [
      { url: 'https://pexels.com/photo1.jpg' },
      { url: 'https://pexels.com/photo2.jpg' }
    ],
    logoUrl: '',
    colors: { primary: '#3B82F6', secondary: '#06B6D4' },
    assertions: [
      (html) => html.includes('pexels.com/photo1.jpg'),
      (html) => !html.includes('images/pic01.jpg'),
    ]
  },
  {
    name: 'Phantom - No lorem ipsum text',
    template: 'Phantom',
    content: { /* ... */ },
    images: [],
    logoUrl: '',
    colors: { primary: '#3B82F6', secondary: '#06B6D4' },
    assertions: [
      (html) => !html.toLowerCase().includes('lorem'),
      (html) => !html.toLowerCase().includes('ipsum'),
    ]
  }
];

function runTests() {
  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    console.log(`\nRunning: ${test.name}`);

    try {
      const html = generateFromTemplate(
        test.template,
        test.content,
        test.images,
        test.logoUrl,
        test.colors
      );

      let testPassed = true;
      for (let i = 0; i < test.assertions.length; i++) {
        const assertion = test.assertions[i];
        if (!assertion(html)) {
          console.log(`  ❌ Assertion ${i + 1} failed`);
          testPassed = false;
        }
      }

      if (testPassed) {
        console.log(`  ✅ PASSED`);
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ ERROR:`, error);
      failed++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Tests Passed: ${passed}`);
  console.log(`Tests Failed: ${failed}`);
  console.log(`Total: ${testCases.length}`);
}

runTests();
```

**Run tests:**
```bash
npx tsx templates/test-template-system.ts
```

---

## 7. Testing Checklist

### Before Deploying Any Fix:

- [ ] **Build succeeds locally**
  ```bash
  npm run build
  ```

- [ ] **No TypeScript errors**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Test with sample data locally** (if possible)
  ```bash
  npx tsx templates/test-template-system.ts
  ```

### After Deploying:

- [ ] **Generate test website in production**
  - Business type: Real Estate
  - Prompt: "Luxury real estate agent specializing in waterfront properties"
  - Template: Let AI choose (should pick Phantom, Forty, or Stellar)

- [ ] **Check hero section**
  - [ ] Business name visible in top left
  - [ ] Hero headline is centered
  - [ ] Hero text is readable (white on dark background)
  - [ ] Background image is visible

- [ ] **Check content sections**
  - [ ] "Our Story" section has visible text
  - [ ] Service/feature cards have visible text
  - [ ] Images are loaded correctly
  - [ ] Text is not white on white

- [ ] **Check navigation**
  - [ ] Menu shows: Home, About, Services, Contact
  - [ ] Clicking menu items doesn't open new pages
  - [ ] Menu links navigate to sections (smooth scroll)

- [ ] **Check footer**
  - [ ] Copyright shows business name
  - [ ] No "HTML5 UP" credits visible

- [ ] **Check browser console**
  - [ ] No JavaScript errors
  - [ ] No 404 errors for images/css
  - [ ] No mixed content warnings

### Inspect Generated HTML:

- [ ] **View source of preview page**
  - [ ] `<style>` tag exists in `<head>`
  - [ ] Style tag contains template CSS (large block)
  - [ ] Style tag contains custom CSS (`#main > .inner > header`)
  - [ ] Business name appears in H1
  - [ ] Image URLs are Pexels URLs (not template placeholders)
  - [ ] No "lorem" or "ipsum" text in body

- [ ] **Check computed styles** (DevTools)
  - Hero header: `text-align: center`
  - Hero header: `background: linear-gradient(...)`
  - Hero H1: `color: rgb(255, 255, 255)`
  - Hero H1: `text-shadow: ...`

---

## 8. Reference Materials

### File Locations

```
wevibecode-ai/
├── app/
│   └── api/
│       └── generate-website/
│           └── route.ts              # Main API endpoint
├── templates/
│   ├── template-system-cheerio.ts    # Template processing (MAIN FILE)
│   ├── template-index.json           # Template metadata
│   └── html5up/                      # Template files
│       ├── Phantom/
│       │   ├── index.html
│       │   └── assets/css/main.css
│       ├── Stellar/
│       ├── Alpha/
│       └── ... (7 more templates)
└── docs/
    ├── 2026-01-25-TEMPLATE-IMPLEMENTATION-PLAN.md
    └── 2026-01-25-TEMPLATE-SYSTEM-ISSUES-REPORT.md (this file)
```

### Key Git Commits

```
ef48a34 - Feat: Re-enable HTML5UP template system with cheerio (Initial migration)
9ba6484 - Fix: Complete Phantom template rendering issues (Opus fixes)
d2304f6 - Fix: Logo display and hero text centering (Latest attempt)
```

### Deployment Information

- **Platform:** Vercel
- **Runtime:** Node.js (serverless functions)
- **Build Command:** `npm run build`
- **Production URL:** https://www.wevibecode.ai
- **Latest Deployment:** https://wevibecode-27lj9nkzj-alexfalanxs-projects.vercel.app

### Dependencies

```json
{
  "cheerio": "^1.0.0-rc.12",
  "openai": "^4.x",
  "@supabase/ssr": "^x.x.x",
  "next": "16.1.1"
}
```

### Relevant Documentation

- **Cheerio API:** https://cheerio.js.org/docs/api
- **HTML5UP Templates:** https://html5up.net
- **Next.js Serverless:** https://nextjs.org/docs/pages/building-your-application/rendering/api-routes

### Sample Content Object

```typescript
{
  businessName: "Luxury Waterfront Properties",
  tagline: "Your Gateway to Waterfront Elegance",
  hero: {
    headline: "Luxury real estate agent specializing in waterfront properties",
    subtitle: "At Luxury Waterfront Properties, we are passionate about matching discerning buyers with their waterfront properties...",
    cta: "Get Started"
  },
  about: {
    title: "Our Story",
    text: "With a decade of experience in luxury real estate..."
  },
  features: [
    {
      title: "Exclusive Listings",
      description: "Gain access to an exclusive portfolio of breathtaking waterfront properties..."
    },
    {
      title: "Expert Market Analysis",
      description: "Our in-depth market insights ensure you make informed decisions..."
    },
    {
      title: "Staging Consultation",
      description: "Our expert staging consultation transforms spaces..."
    }
  ],
  imageSearchTerms: ["luxury waterfront property", "ocean view real estate"]
}
```

### Sample Images Array

```typescript
[
  {
    url: "https://images.pexels.com/photos/2598638/pexels-photo-2598638.jpeg",
    photographer: "John Doe",
    alt: "Luxury waterfront property"
  },
  {
    url: "https://images.pexels.com/photos/1234567/pexels-photo-1234567.jpeg",
    photographer: "Jane Smith",
    alt: "Ocean view"
  }
]
```

### Sample Colors Object

```typescript
{
  primary: "#8B4789",    // Purple (from color picker)
  secondary: "#D4AF37"   // Gold
}
```

---

## 9. Debugging Commands

### Check Vercel Logs
```bash
# Get recent logs
vercel logs https://www.wevibecode.ai --output raw

# Filter for template system logs
vercel logs https://www.wevibecode.ai --output raw | grep "CHEERIO\|Template\|businessName"

# Get logs for specific deployment
vercel logs wevibecode-27lj9nkzj-alexfalanxs-projects.vercel.app --output raw
```

### Local Testing
```bash
# Build the project
npm run build

# Run development server
npm run dev

# Test template system
npx tsx templates/test-template-system.ts
```

### Git History
```bash
# See recent commits
git log --oneline -10

# See changes in template file
git diff ef48a34..HEAD templates/template-system-cheerio.ts

# Restore to previous version (if needed)
git checkout ef48a34 -- templates/template-system-cheerio.ts
```

---

## 10. Immediate Action Items for Developer

### Step 1: Add Comprehensive Logging (30 minutes)
1. Open `templates/template-system-cheerio.ts`
2. Add detailed console.log statements as shown in Solution 1
3. Deploy to Vercel
4. Generate a test website
5. Review logs: `vercel logs https://www.wevibecode.ai --output raw`
6. Identify exactly where content disappears

### Step 2: Fix Image/Logo Conflict (1 hour)
1. Implement Solution 2 (separate logo from images)
2. Test locally if possible
3. Deploy and test

### Step 3: Verify CSS Application (1 hour)
1. Implement Solution 3 (robust CSS inlining)
2. Add logging to verify CSS is in HTML
3. Deploy and test
4. Check browser DevTools to see if styles are applied

### Step 4: Fix Content Visibility (2 hours)
1. Investigate why content appears white/blank
2. Add CSS for regular content sections (not just hero)
3. Ensure text colors are visible on backgrounds
4. Test all sections of generated website

### Step 5: Create Test Suite (Optional, 4 hours)
1. Implement Solution 6
2. Run tests before each deployment
3. Build regression test suite

---

## 11. Success Criteria

A fix is considered successful when:

1. **Hero Section**
   - ✅ Business name visible in top left corner (text, not image)
   - ✅ Hero headline is centered
   - ✅ Hero text is white with shadow (readable on background)
   - ✅ Background image is visible

2. **Content Sections**
   - ✅ All text is visible (not white on white)
   - ✅ Text is replaced with actual content (no Lorem Ipsum)
   - ✅ Sections are properly formatted with correct alignment
   - ✅ Feature cards show business features

3. **Navigation**
   - ✅ Menu shows: Home, About, Services, Contact
   - ✅ Menu links work (no "double view" issue)
   - ✅ Menu items styled correctly

4. **Images**
   - ✅ Hero background image loads
   - ✅ Section images load (Pexels photos)
   - ✅ No broken image links

5. **Overall**
   - ✅ No regressions (new fixes don't break existing features)
   - ✅ Works for all 10 templates (not just Phantom)
   - ✅ No console errors in browser
   - ✅ Professional appearance

---

## 12. Contact & Questions

For questions about this document or the issues described:

**Project:** WeVibeCode.ai
**Template System File:** `templates/template-system-cheerio.ts`
**API Route:** `app/api/generate-website/route.ts`
**Production URL:** https://www.wevibecode.ai

**Deployment Platform:** Vercel
**Repository:** (provide Git repository URL)

---

## Appendix A: Complete Current Code

### templates/template-system-cheerio.ts (Simplified Overview)

```typescript
// v7.0 - CHEERIO-BASED SYSTEMATIC REPLACEMENT

import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

// Template selection by business type
const TEMPLATE_MAPPING = {
  restaurant: ['Alpha', 'Spectral', 'Stellar'],
  real_estate: ['Phantom', 'Forty', 'Stellar'],
  // ... more mappings
};

export function selectTemplate(businessType: string): string {
  // Randomly select from mapped templates
}

export function loadTemplate(templateName: string): string {
  // Load HTML file from templates/html5up/[name]/index.html
}

export function loadTemplateCSS(templateName: string): string {
  // Load CSS from templates/html5up/[name]/assets/css/main.css
}

function stripExternalAssets(html: string): string {
  // Remove <script>, <link>, <noscript> tags via regex
  // Remove unwanted sections (CTA, social icons)
}

function replaceIcons(html: string): string {
  // Replace Font Awesome icons with bullets
}

export function injectContent(
  html: string,
  content: any,
  images: any[],
  logoUrl: string,
  colors: any
): string {
  // PHASE 1: Cheerio DOM manipulation
  const $ = cheerio.load(html);

  // Replace logo/brand
  // Replace H1, H2, H3
  // Replace paragraphs
  // Replace menu
  // Replace buttons
  // Clean footer

  let result = $.html();

  // PHASE 2: Regex replacements
  // Replace images
  // Add logo
  // Add hero background

  return result;
}

export function applyColors(css: string, colors: any): string {
  // Replace template colors with brand colors via regex
}

export function inlineCSS(html: string, css: string): string {
  // Remove external <link> tags
  // Add <style> tag before </head>
  // Include template CSS + custom CSS
}

export function generateFromTemplate(
  templateName: string,
  content: any,
  images: any[],
  logoUrl: string,
  colors: any
): string {
  // Orchestrate all the above functions
  const html = loadTemplate(templateName);
  const css = loadTemplateCSS(templateName);

  let result = stripExternalAssets(html);
  result = replaceIcons(result);
  result = injectContent(result, content, images, logoUrl, colors);

  const styledCSS = applyColors(css, colors);
  result = inlineCSS(result, styledCSS);

  return result;
}
```

---

**END OF REPORT**

---

*This document can be shared with any developer to understand the complete context of the template system issues and implement proper fixes.*
