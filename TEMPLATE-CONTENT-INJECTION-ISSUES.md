# Template Content Injection Issues - Technical Documentation

## Project Context

**Project:** WeVibeCode.ai - AI Website Builder
**Tech Stack:**
- Next.js 15 (React framework)
- TypeScript
- Supabase (Database & Auth)
- OpenAI GPT-4o (Content generation)
- Pexels API (Images)
- HTML5 UP Templates (10 professional templates)

**Architecture:**
```
User Input → AI Content Generation → Template Selection → Content Injection → Final HTML
```

---

## Overview of Template System

### How It Should Work:
1. User selects a template (e.g., "Spectral", "Hyperspace", "Alpha")
2. AI generates business content (business name, hero headline, features, about text, etc.)
3. Template system loads the HTML5 UP template HTML & CSS
4. Content injection system replaces placeholder text with real business content
5. User receives a professional website with their content in the template layout

### Current Problem:
The content injection system is not successfully replacing all placeholder text, resulting in:
- Lorem ipsum text appearing in final output
- Template placeholder names (e.g., "Spectral", "Hyperspace") showing instead of business name
- Generic menu items (e.g., "Generic", "Elements") instead of real sections
- Inconsistent content across different sections

---

## Technical Details

### File Structure:
```
templates/
  ├── template-system.ts          # Content injection logic
  ├── template-index.json          # Template metadata
  └── html5up/
      ├── Alpha/
      │   ├── index.html
      │   └── assets/css/main.css
      ├── Spectral/
      │   ├── index.html
      │   └── assets/css/main.css
      └── [8 more templates...]

app/api/generate-website/route.ts  # API route that calls template system
```

### Content Injection Function:
Located in `templates/template-system.ts`, the `injectContent()` function attempts to replace:
1. Footer copyright text
2. Template names
3. H1, H2, H3 headings
4. Paragraph text (lorem ipsum)
5. Images
6. Logo
7. Menu items
8. CTA buttons

---

## Difficulties Encountered

### 1. **Template-Specific Placeholder Text**

**Problem:** Each of the 10 templates has different placeholder text that needs replacing.

**Examples:**
- **Spectral:** "Another fine responsive site template freebie crafted by HTML5 UP"
- **Hyperspace:** "Introducing the ultimate mobile app", "Sed ipsum dolor"
- **Alpha:** "Massa libero", "Feugiat consequat"
- **Solid State:** "This is Solid State", "Magna arcu feugiat"

**Challenge:** Need to maintain a comprehensive list of ALL placeholder phrases across ALL 10 templates.

**Current Approach:** Hardcoded array of ~50+ known phrases in `allH2Headings`, `allH3Headings`, `allLoremPhrases`.

**Limitation:** If we miss even one phrase, it shows up in the final output.

---

### 2. **H1 Tag Replacement Missing**

**Problem:** The H1 tags were not being replaced at all!

**Discovery:** After multiple tests showing "Spectral", "Hyperspace" as main headings.

**Root Cause:** The injectContent() function had replacements for H2, H3, and paragraphs, but completely missed H1.

**Fix Applied:**
```typescript
// Added this line:
result = result.replace(/<h1[^>]*>([^<]*)<\/h1>/gi, `<h1>${content.businessName}</h1>`);
```

**Commit:** `ea5ab7d` - "Fix: Add H1 replacement and more aggressive lorem ipsum cleanup"

---

### 3. **Multiline Placeholder Text**

**Problem:** Some placeholder text spans multiple lines with `<br>` tags.

**Example from Spectral:**
```html
<p>Another fine responsive<br />
site template freebie<br />
crafted by <a href="http://html5up.net">HTML5 UP</a>.</p>
```

**Challenge:** Simple regex patterns like `/<p[^>]*>lorem[^<]*<\/p>/` don't match across `<br>` tags.

**Fix Applied:**
```typescript
// Added multiline patterns:
result = result.replace(/<p[^>]*>[^<]*Aliquam ut ex[^<]*<br[^>]*>[^<]*fringilla[^<]*<\/p>/gi, heroSubtitle);
result = result.replace(/Another fine responsive<br \/>[^<]*site template[^<]*/gi, heroSubtitle);
```

**Commit:** `ea5ab7d`

---

### 4. **Repeating Same Content**

**Problem:** Initially, ALL H2 headings were replaced with the SAME text (hero headline).

**Example Bad Output:**
```
H2: "Transform Your Fitness Journey"
H2: "Transform Your Fitness Journey"
H2: "Transform Your Fitness Journey"
H2: "Transform Your Fitness Journey"
```

**User Expectation:** Different headings for different sections (About Us, Our Services, Contact).

**Root Cause:** Simple forEach loop replacing all H2s with same value:
```typescript
// BAD - Old approach:
allH2Headings.forEach(heading => {
  result = result.replace(regex, `<h2>${heroHeadline}</h2>`);
});
```

**Fix Applied:** Smart replacement with section-specific content:
```typescript
// GOOD - New approach:
const h2Replacements = [heroHeadline, aboutTitle, servicesTitle, contactTitle];
let h2Index = 0;
allH2Headings.forEach(heading => {
  const replacement = h2Replacements[Math.min(h2Index, h2Replacements.length - 1)];
  result = result.replace(regex, `$1${replacement}$2`);
  if (result.match(regex)) h2Index++;
});
```

**Commit:** `e5e5f20` - "Fix: Improve template content injection with smarter replacements"

---

### 5. **Template Name Capitalization Bug**

**Problem:** Template ID "solid-state" → capitalized to "Solid-state" → file not found (folder is "Solid State" with space).

**Error:**
```
❌ Template not found: C:\...\templates\html5up\Solid-state\index.html
```

**Result:** Blank page generated (0KB HTML).

**Root Cause:** Simple capitalization logic didn't account for "Solid State" having a space:
```typescript
// BAD:
const templateName = templateId.charAt(0).toUpperCase() + templateId.slice(1);
// "solid-state" → "Solid-state" ❌
```

**Fix Applied:** Template ID → folder name mapping:
```typescript
// GOOD:
const templateNameMap: { [key: string]: string } = {
  'alpha': 'Alpha',
  'solid-state': 'Solid State',  // Correct!
  // ... all 10 templates
};
```

**Commit:** `6ac460c` - "Fix: Critical bug - map template IDs to actual folder names"

---

### 6. **Menu Navigation Not Working**

**Problem:** Menu showed placeholder links: "Generic", "Elements", "Sign Up", "Log In".

**User Expectation:** Links to actual business sections: "About", "Services", "Contact".

**Fix Applied:**
```typescript
result = result.replace(/<a[^>]*>Generic<\/a>/gi, '<a href="#about">About</a>');
result = result.replace(/<a[^>]*>Elements<\/a>/gi, '<a href="#services">Services</a>');
result = result.replace(/<a[^>]*>Sign Up<\/a>/gi, '<a href="#contact">Contact</a>');
result = result.replace(/<a[^>]*>Log In<\/a>/gi, ''); // Remove
```

**Commit:** `872bfef` - "Fix: Replace menu items and CTA buttons with actual content"

---

### 7. **CTA Button Placeholder Text**

**Problem:** Buttons showed "Activate" instead of business-specific CTA.

**Fix Applied:**
```typescript
const ctaText = content.hero?.cta || 'Get Started';
result = result.replace(/Activate/gi, ctaText);
result = result.replace(/Learn More/gi, 'Discover More');
```

**Commit:** `872bfef`

---

## Attempted Fixes Summary

### Commit Timeline (Most Recent Session):

1. **`e5e5f20`** - Improve template content injection with smarter replacements
   - Smart H2/H3 replacement with varied content
   - Cycling through feature titles for H3s
   - Building array of replacement texts for paragraphs

2. **`ea5ab7d`** - Add H1 replacement and more aggressive lorem ipsum cleanup
   - Added missing H1 replacement
   - 10+ new lorem ipsum patterns
   - Multiline paragraph patterns with `<br>` tags

3. **`872bfef`** - Replace menu items and CTA buttons with actual content
   - Menu links updated to real sections
   - CTA buttons use business content

4. **`6ac460c`** - Critical bug - map template IDs to actual folder names
   - Fixed "Solid State" folder name issue
   - Prevented blank page error

---

## Current State

### What's Working:
✅ Template selection UI
✅ Template loading (HTML + CSS)
✅ Image injection (3 Pexels images)
✅ Color customization
✅ Business name in footer
✅ Title tag replacement

### What's Still Problematic:
❌ Some lorem ipsum text still appearing (template-specific phrases)
❌ Hero section may not be visible (background image vs. content)
❌ Inconsistent content across different templates
❌ Some H2/H3 headings still showing placeholder text

---

## Root Cause Analysis

### Fundamental Issue:
**The problem is a "whack-a-mole" approach.**

We're manually listing every placeholder phrase from every template and trying to replace them. This is:
1. **Fragile:** Misses phrases we haven't encountered yet
2. **Template-specific:** Different templates have different placeholders
3. **Hard to maintain:** Need to check all 10 templates' HTML files
4. **Error-prone:** Regex escaping, multiline patterns, nested tags

### Why It's Hard:
- Templates have 50-100+ placeholder phrases each
- Phrases are in different formats (simple text, with `<br>`, inside `<a>`, etc.)
- Some templates use semantic placeholders (e.g., "What we do")
- Others use nonsense placeholders (e.g., "Massa libero")

---

## Potential Solutions

### Option 1: Manual Audit (Current Approach)
**Process:**
1. Generate a site with each template
2. Manually identify all remaining lorem ipsum text
3. Add those specific phrases to replacement arrays
4. Repeat for all 10 templates

**Pros:** Works eventually
**Cons:** Time-consuming, requires testing every template, brittle

---

### Option 2: Aggressive Global Replacement
**Approach:** Instead of targeting specific phrases, replace ALL text in certain sections.

```typescript
// Replace ALL paragraphs in #banner section:
result = result.replace(
  /(<section[^>]*id="banner"[^>]*>[\s\S]*?<p[^>]*>)[\s\S]*?(<\/p>[\s\S]*?<\/section>)/gi,
  `$1${heroSubtitle}$2`
);
```

**Pros:** More reliable, less brittle
**Cons:** Might replace wanted content, harder to debug

---

### Option 3: DOM Parsing Instead of Regex
**Approach:** Use proper HTML parser instead of regex.

```typescript
import { JSDOM } from 'jsdom';

const dom = new JSDOM(html);
const h2Elements = dom.window.document.querySelectorAll('h2');
h2Elements.forEach((h2, index) => {
  h2.textContent = h2Replacements[index] || h2Replacements[0];
});
```

**Pros:** More reliable, easier to reason about
**Cons:** Requires additional dependency, may have performance impact

---

### Option 4: Template Pre-Processing
**Approach:** Pre-process templates once, adding special markers where content should go.

```html
<!-- Original Template: -->
<h1>Spectral</h1>

<!-- Pre-processed Template: -->
<h1>{{BUSINESS_NAME}}</h1>
```

Then simple replacement:
```typescript
result = result.replace(/\{\{BUSINESS_NAME\}\}/g, content.businessName);
```

**Pros:** Most reliable, clean separation
**Cons:** Requires one-time template modification

---

## Recommended Next Steps

### Immediate (Debug Current Issue):
1. Test each template individually
2. Document all remaining lorem ipsum phrases
3. Add missing phrases to replacement arrays
4. Test again

### Short-term (Improve Reliability):
1. Consider DOM parsing approach for headings
2. Add comprehensive logging to see what's being replaced
3. Create test suite with expected vs. actual output

### Long-term (Systematic Fix):
1. Pre-process all templates with markers
2. OR: Build templates from scratch with proper injection points
3. OR: Use a proper templating engine (Handlebars, Mustache, etc.)

---

## Testing Guide

### How to Test a Fix:
1. Select a specific template (e.g., "Spectral")
2. Fill in prompt: "Modern Japanese ramen restaurant"
3. Generate website
4. Check for:
   - Business name in H1
   - Real content in H2/H3
   - No lorem ipsum in paragraphs
   - Working menu links
   - Real CTA button text

### Templates to Test (Priority Order):
1. **Spectral** - Most commonly tested, single-page scroll
2. **Hyperspace** - Sidebar layout, different structure
3. **Alpha** - Multi-page template
4. **Solid State** - Name has space (edge case)
5. All others

---

## Questions for Third-Party Developer

1. Should we continue with regex approach or switch to DOM parsing?
2. Is pre-processing templates (adding markers) acceptable?
3. What's acceptable level of lorem ipsum in output? (0% or <5%?)
4. Should we prioritize getting 1-2 templates perfect vs. all 10 working okay?
5. Performance vs. reliability trade-off?

---

## Contact / Handoff Notes

**Current Status:** Template system partially working
- Most content replaced successfully
- Some template-specific phrases still appearing
- Critical bugs fixed (blank page, H1 missing)

**Next Person Should:**
1. Run a test generation with each template
2. Document all lorem ipsum text that appears
3. Decide on approach (continue regex vs. switch to DOM/markers)
4. Implement systematic fix for chosen approach

**Files to Focus On:**
- `templates/template-system.ts` - Main injection logic (lines 76-410)
- `app/api/generate-website/route.ts` - API integration (lines 109-130)
- `templates/html5up/*/index.html` - Source templates to audit

---

*Last Updated: 2026-01-13*
*Session: Template content injection debugging*
