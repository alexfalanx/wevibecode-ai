# Template System - Roadmap & Developer Handoff
**Date:** 2026-01-25
**Project:** WeVibeCode.ai
**Status:** Templates disabled - seeking development path forward
**Purpose:** Developer handoff document for template system implementation

---

## Executive Summary

**Current State:** Simple website generator working reliably without templates.

**Goal:** Integrate 10 professional HTML5UP templates with AI-generated content while maintaining reliability.

**Challenge:** Multiple implementation attempts failed due to CSS conflicts, content visibility issues, and template structure mismatches.

**Next Step:** Need experienced developer to design robust template integration strategy.

---

## Table of Contents

1. [Current Working State](#current-working-state)
2. [Template System Goals](#template-system-goals)
3. [What We Have](#what-we-have)
4. [What We Tried (That Didn't Work)](#what-we-tried-that-didnt-work)
5. [Root Problems Identified](#root-problems-identified)
6. [Technical Assets Available](#technical-assets-available)
7. [Recommended Path Forward](#recommended-path-forward)
8. [Success Criteria](#success-criteria)
9. [Resources & References](#resources--references)

---

## 1. Current Working State

### ✅ What Works Now

**System:** `app/api/generate-website/route.ts` using `buildWebsite()` function

**Features:**
- AI-generated business content (OpenAI)
- Professional images (Pexels API)
- Logo generation (DALL-E)
- Custom color palettes
- Responsive design
- Clean, simple HTML/CSS/JS output

**User Flow:**
1. User enters business prompt + selects type/colors
2. OpenAI generates content structure
3. Pexels fetches relevant images
4. System builds custom HTML with inline CSS
5. Preview renders reliably
6. User can publish to custom domain

**Performance:**
- ✅ Generates in 30-40 seconds
- ✅ No CSS conflicts
- ✅ No 404 errors
- ✅ Content always visible
- ✅ Works across all business types

**Code Location:** `app/api/generate-website/route.ts` (lines 182-189)

```typescript
// Simple buildWebsite function - CURRENTLY ACTIVE
const { html, css, js } = buildWebsite(
  content,
  sections,
  colors,
  images,
  logoUrl,
  websiteType,
  vibe
);
```

---

## 2. Template System Goals

### Why Add Templates?

**Problem with Current System:**
- Simple, generic layout
- Not visually impressive
- Lacks professional design polish
- Difficult to customize layouts

**Desired Benefits:**
- ✨ Professional, polished designs
- 🎨 Variety of visual styles
- 📱 Better responsive behavior
- 🏆 Competitive with Wix/Squarespace quality

### Template Requirements

**Must Have:**
1. **Content Injection:** Replace template placeholder text with AI-generated content
2. **Image Replacement:** Swap template images with Pexels photos
3. **Color Customization:** Apply user's color palette to template
4. **Logo Integration:** Replace template logo with business name/logo
5. **Menu Customization:** Update navigation with business sections
6. **Responsive:** Must work on mobile/tablet/desktop
7. **No External Dependencies:** All CSS/JS must be inlined (Vercel serverless requirement)

**Nice to Have:**
8. Template selection by AI (matches template to business type)
9. Template preview before generation
10. Mix-and-match template sections

### Target Templates

**HTML5UP Templates Selected (10 total):**

| Template | Style | Best For | Theme |
|----------|-------|----------|-------|
| **Phantom** | Dark tiles/cards | Real estate, portfolio | Light |
| **Stellar** | Clean, spacious | Professional services | Light |
| **Alpha** | Landing page | Products, SaaS | Light |
| **Forty** | Image-heavy tiles | Creative, restaurants | Dark |
| **Spectral** | Modern, sleek | Tech, startups | Dark |
| **Solid State** | Minimalist | Corporate, consulting | Light |
| **Dimension** | Fullscreen cards | Portfolio, gallery | Dark |
| **Hyperspace** | Animated | Interactive, modern | Dark |
| **Massively** | Magazine-style | Blog, content-heavy | Light |
| **Story** | Narrative flow | Storytelling brands | Light |

**Template Characteristics:**
- License: Free for commercial use (CCA 3.0)
- Quality: Professional, production-ready
- File structure: `templates/html5up/[TemplateName]/index.html` + `assets/css/main.css`
- All templates have different HTML structures (not standardized)

---

## 3. What We Have

### Existing Code & Assets

#### ✅ Template Files
**Location:** `templates/html5up/`

All 10 templates downloaded and available:
```
templates/html5up/
├── Alpha/
│   ├── index.html
│   └── assets/css/main.css
├── Dimension/
├── Forty/
├── Hyperspace/
├── Massively/
├── Phantom/
├── Solid State/
├── Spectral/
├── Stellar/
└── Story/
```

#### ✅ Template Processing System
**Location:** `templates/template-system-cheerio.ts` (658 lines)

**Key Functions:**
```typescript
// Select best template for business type
selectTemplate(businessType: string): string

// Load template HTML and CSS from filesystem
loadTemplate(templateName: string): string
loadTemplateCSS(templateName: string): string

// Inject AI content into template
injectContent(html, content, images, logoUrl, colors): string

// Apply custom colors to template CSS
applyColors(css, colors): string

// Inline CSS into HTML (serverless requirement)
inlineCSS(html, css): string

// Main orchestration function
generateFromTemplate(templateName, content, images, logoUrl, colors): string
```

**Approach:** Uses **Cheerio** (jQuery-like DOM manipulation for Node.js) instead of jsdom (which had ES Module issues with Vercel).

#### ✅ Documentation
**Created During Implementation:**

1. **`docs/2026-01-25-TEMPLATE-IMPLEMENTATION-PLAN.md`** (368 lines)
   - Complete migration plan from jsdom to cheerio
   - Step-by-step implementation guide
   - API mapping and examples

2. **`docs/2026-01-25-TEMPLATE-SYSTEM-ISSUES-REPORT.md`** (1,196 lines)
   - Comprehensive technical analysis
   - All identified problems with code examples
   - 6 recommended solutions
   - Testing checklist
   - Developer handoff info

3. **`docs/2026-01-25-TEMPLATE-FIXES-ATTEMPTED.md`** (572 lines)
   - Chronological log of all 4 fix attempts
   - What was tried, why it failed
   - Technical analysis of each failure
   - Hypotheses and debugging data

#### ✅ Template Metadata
**Location:** `templates/template-index.json`

Maps business types to recommended templates:
```json
{
  "restaurant": ["Alpha", "Spectral", "Stellar"],
  "real_estate": ["Phantom", "Forty", "Stellar"],
  "professional": ["Solid State", "Alpha", "Dimension"],
  ...
}
```

---

## 4. What We Tried (That Didn't Work)

### Attempt Summary

**Total Attempts:** 4 major implementations + 1 revert
**Time Invested:** ~8 hours over 1 day
**Outcome:** All failed - templates disabled
**Current Status:** Back to simple working version

---

### Attempt #1: Initial Cheerio Migration
**Date:** 2026-01-25 (morning)
**Commit:** `ef48a34` - "Feat: Re-enable HTML5UP template system with cheerio"
**Goal:** Migrate from jsdom to cheerio to fix Vercel ES Module errors

**What We Did:**
- Created `templates/template-system-cheerio.ts` (500+ lines)
- Implemented content injection using Cheerio DOM manipulation
- Added color customization
- Added CSS inlining

**Technical Approach:**
```typescript
const $ = cheerio.load(html);
$('h1').text(content.hero.headline);  // Replace headings
$('p').text(content.about.text);      // Replace paragraphs
$('img').attr('src', images[0].url);  // Replace images
```

**Result:** ❌ **FAILED**
- Generated HTML but content not visible
- Only hero section displayed
- Everything else appeared blank/white

---

### Attempt #2: Developer Feedback Implementation (Steps 1-4)
**Date:** 2026-01-25 (afternoon)
**Commit:** `76efa45` - "Fix: Template rendering issues - Steps 1-4"
**Goal:** Fix visibility issues based on comprehensive developer feedback

**What We Did:**

1. **Added Extensive Logging**
   ```typescript
   console.log('=== BEFORE LOGO REPLACEMENT ===');
   console.log('Logo elements:', $('.logo').length);
   // ... detailed logging at each step
   ```

2. **Fixed Logo/Branding**
   - Decoupled logo from image replacements
   - Handled via Cheerio only (no regex)
   - Removed conflicting operations

3. **Improved CSS Inlining**
   - Changed to `lastIndexOf()` + `substring()` for safer insertion
   - Added error checking

4. **Generalized CSS Selectors**
   ```css
   /* Works for multiple templates */
   #main > .inner > header,
   #banner, #hero, section.banner, section#intro {
     text-align: center !important;
   }
   ```

5. **Added Visibility CSS**
   ```css
   body, #main, .inner, section, article {
     background-color: #ffffff !important;
     color: #333333 !important;
   }
   p, li, span, div {
     color: #333333 !important;
     visibility: visible !important;
     opacity: 1 !important;
   }
   ```

6. **Removed Catch-All Image Regex**
   - Was: `result.replace(/src="images\/[^"]+"/gi, ...)`
   - Prevented logo corruption

**Result:** ❌ **FAILED**
- User reported: "it still doesn't work bro"
- Content still not visible

---

### Attempt #3: Remove Template Asset References
**Date:** 2026-01-25 (afternoon)
**Commit:** `3dfaeff` - "Fix: Remove template asset references causing 404 errors"
**Goal:** Fix 404 errors for template images (overlay.png, bg.jpg, etc.)

**Problem Identified:**
```
GET https://www.wevibecode.ai/dashboard/preview/images/overlay.png 404 (Not Found)
```

Template CSS had references to local images that don't exist in preview context.

**What We Did:**
```typescript
// Remove problematic image references from CSS
result = result.replace(/background-image:\s*url\(["']?images\/[^"')]+["']?\);?/gi, '');
result = result.replace(/background:\s*url\(["']?images\/[^"')]+["']?\);?/gi, 'background: none;');
result = result.replace(/url\(["']?images\/[^"')]+["']?\)/gi, 'none');
```

**Result:** ✅ **PARTIAL SUCCESS**
- Removed some 404 errors
- But new 404s appeared for pic09-pic12.jpg

---

### Attempt #4: Extended Image Replacements (pic01-pic20)
**Date:** 2026-01-25 (late afternoon)
**Agent:** Opus 4.5
**Goal:** Cover all template image placeholders

**What We Did:**
- Extended image replacements from pic01-pic08 to pic01-pic20
- Added cycling pattern using modulo
```typescript
const getImage = (index: number) =>
  images[index % images.length]?.url || images[0]?.url || fallback;

result = result.replace(/images\/pic01\.jpg/gi, getImage(0));
result = result.replace(/images\/pic02\.jpg/gi, getImage(1));
// ... through pic20
```

**Result:** ✅ **PARTIAL SUCCESS**
- 404 errors eliminated
- But content still not visible

---

### Attempt #5: Critical @import Fix
**Date:** 2026-01-25 (evening)
**Commit:** `c81fb8e` - "CRITICAL FIX: Remove @import statements from CSS"
**Goal:** Fix content that "magically appeared then disappeared"

**Root Cause Discovered:**
User reported: "I see things...then they are gone"

This revealed the real problem:
```css
/* At top of template CSS */
@import url(fontawesome-all.min.css);
@import url("https://fonts.googleapis.com/css?family=Source+Sans+Pro...");
```

**Sequence:**
1. Page loads with our custom CSS → Content visible ✅
2. External CSS files finish loading → Override our CSS ❌
3. Content becomes invisible

**What We Did:**
```typescript
// Remove ALL @import statements before inlining
result = result.replace(/@import\s+url\([^)]+\);?/gi, '');
```

**Result:** ❌ **MADE THINGS WORSE**
- Fonts broke
- CSS partially corrupted
- Even less visible than before

---

### Attempt #6: Force Phantom Template
**Date:** 2026-01-25 (evening)
**Commit:** `a6165af` - "TEMP: Force Phantom template for testing"
**Goal:** Isolate issue by using single template

**Problem Identified:**
User got "Forty" template (dark theme) but our CSS was designed for "Phantom" (light theme).

**What We Did:**
```typescript
const TEMPLATE_MAPPING = {
  restaurant: ['Phantom'],  // Force single template
  real_estate: ['Phantom'],
  // ... all forced to Phantom
};
```

**Result:** ❌ **STILL FAILED**
- User: "no menu no name no nothing then a bunch of pictures"
- Worse than ever

---

### Final Decision: Revert to Simple Version
**Date:** 2026-01-25 (evening)
**Commits:** `89d8a43`, `92ef6f2`
**Decision:** User gave up - "lets get back to the vercel version without template"

**What We Did:**
- Commented out template imports
- Removed template generation code
- Forced all requests to use simple `buildWebsite()`
- System back to working state

**Result:** ✅ **SUCCESS**
- Simple generator working again
- No errors
- Reliable generation

---

## 5. Root Problems Identified

### Problem #1: CSS Specificity Wars

**Issue:** Template CSS vs. Our Custom CSS

Templates have complex CSS with high specificity:
```css
/* Template CSS (original) */
html body #wrapper #main section.tiles article .content h2 {
  color: #ffffff;
  text-shadow: ...;
}
```

Our override CSS:
```css
/* Our CSS (attempted override) */
.tiles article h2 {
  color: #333333 !important;
}
```

**Even with `!important`, template CSS often won** due to higher specificity or source order.

---

### Problem #2: Template Structure Mismatch

**Issue:** Different templates use different HTML structures

**Phantom:**
```html
<section class="tiles">
  <article class="style1">
    <div class="content">
      <h2>Title</h2>
      <p>Description</p>
    </div>
  </article>
</section>
```

**Forty:**
```html
<section id="two" class="spotlights">
  <section>
    <div class="content">
      <div class="inner">
        <h2>Title</h2>
        <p>Description</p>
      </div>
    </div>
  </section>
</section>
```

Our CSS targeted Phantom's structure, so Forty template broke.

---

### Problem #3: Light vs Dark Theme Conflict

**Issue:** Some templates are dark themes, some are light themes

**Dark Templates (Forty, Spectral, Dimension):**
- Background: Dark (#242943, #1e1e1e)
- Text: White (#ffffff)
- Designed for dark backgrounds

**Light Templates (Phantom, Alpha, Stellar):**
- Background: White (#ffffff)
- Text: Dark (#333333)
- Designed for light backgrounds

**Our CSS forced white backgrounds globally:**
```css
body, section {
  background-color: #ffffff !important;
  color: #333333 !important;
}
```

This worked for light templates but **broke dark templates** (dark text on dark background after images removed).

---

### Problem #4: Order of Operations

**Issue:** Mixing DOM manipulation (Cheerio) with Regex replacements caused conflicts

**Sequence:**
```
1. Cheerio loads HTML
2. DOM manipulations (remove logo, replace text) ✅
3. Serialize to string: $.html()
4. Regex replacements (images, backgrounds) ✅
5. Regex may undo Cheerio changes ❌
```

**Example:**
```typescript
// Step 2: Cheerio removes logo
$('.logo img').remove();

// Step 4: Regex adds it back
result.replace(/<span.*fa-gem.*>/, `<img src="${logoUrl}">`);

// Result: Logo appears again (conflict!)
```

---

### Problem #5: @import External CSS

**Issue:** External stylesheets loading AFTER our custom CSS

**Timeline:**
```
0.0s: Page loads
0.1s: Our custom CSS applied → Content visible
1.5s: @import CSS finishes loading → Overrides ours
2.0s: Content invisible again
```

User described it perfectly: "magically I see things...then they are gone"

---

### Problem #6: Template Asset References

**Issue:** Templates reference local files that don't exist

```css
/* Template CSS */
background-image: url(images/overlay.png);
background: url(images/bg.jpg);
```

Browser tries to load:
```
https://www.wevibecode.ai/dashboard/preview/images/overlay.png
→ 404 Not Found
```

Without these background images, template layout breaks.

---

### Problem #7: Catch-All Regex

**Issue:** Overly broad replacements

```typescript
// This replaced EVERY image, including logo
result.replace(/src="images\/[^"]+"/gi, `src="${images[0]?.url}"`);
```

**Effect:**
- Hero image: ✅ Replaced correctly
- Section images: ✅ Replaced correctly
- Logo: ❌ Also replaced (now shows Pexels photo)
- Icons: ❌ Also replaced

---

## 6. Technical Assets Available

### Codebase

**Git Repository:**
- All template code preserved in git history
- Can recover any version instantly
- Full commit history of attempts

**Key Branches/Commits:**
- `main` (current): Templates disabled, simple version working
- `ef48a34`: Initial cheerio implementation
- `76efa45`: Developer feedback fixes
- `c81fb8e`: @import removal attempt

### Template System Code

**File:** `templates/template-system-cheerio.ts` (658 lines)

**Status:** Complete but not used (disabled)

**What Works:**
- ✅ Template loading from filesystem
- ✅ CSS loading and color customization
- ✅ Content injection via Cheerio
- ✅ Image path replacements
- ✅ Menu link updates
- ✅ Logo replacement logic
- ✅ CSS inlining

**What Doesn't Work:**
- ❌ Content visibility (CSS conflicts)
- ❌ Multi-template support (structure differences)
- ❌ Dark theme templates
- ❌ Reliable rendering

### Documentation

**Technical Analysis:**
1. **Template Implementation Plan** - Complete migration guide
2. **Issues Report** - 1,196 lines of technical analysis
3. **Fixes Attempted Log** - Chronological attempt history
4. **This Document** - Roadmap for next developer

### Test Infrastructure

**Manual Testing Done:**
- Generated 10+ test websites
- Tested with different business types
- Tested with/without logos
- Tested with different color palettes
- Inspected with DevTools
- Verified in Vercel logs

**What We Don't Have:**
- Automated test suite
- Template unit tests
- Visual regression tests
- CI/CD testing

---

## 7. Recommended Path Forward

### Option A: Pure Template Approach (Ambitious)

**Goal:** Full template integration with dynamic content

**Strategy:**
1. **Template Preprocessing**
   - Pre-process each template's HTML/CSS
   - Create "clean" versions with standardized structure
   - Map all templates to common selector patterns

2. **Content Mapping System**
   - Define universal content slots: hero, about, features, contact
   - Map each template's HTML to these slots
   - Create template-specific adapters

3. **CSS Isolation**
   - Use CSS scoping/namespacing
   - Shadow DOM for complete isolation
   - Or completely rewrite template CSS

4. **Testing Framework**
   - Visual regression testing
   - Content injection tests for each template
   - Cross-browser testing

**Pros:**
- ✨ Beautiful professional templates
- 🎨 Maximum variety
- 🏆 Best user experience

**Cons:**
- ⏰ High development time (40-80 hours)
- 🐛 Complex debugging
- 📦 Large technical debt
- 🔧 Requires expert front-end developer

**Recommended For:** If you have budget for experienced React/CSS developer

---

### Option B: Hybrid Approach (Balanced)

**Goal:** Simple templates + Custom builder for complex cases

**Strategy:**
1. **Pick 2-3 Best Templates**
   - Start with Phantom and Alpha only
   - Master these completely
   - Add more later if successful

2. **Create Template "Variants"**
   - Light variant: Phantom, Alpha
   - Dark variant: Manually create dark versions
   - Don't try to adapt all 10

3. **Fallback to Simple**
   - If template fails, auto-fallback to simple builder
   - User never sees errors
   - Gradual rollout

4. **Section-Based Building**
   - Use template sections as "components"
   - Mix template header + custom body
   - Best of both worlds

**Pros:**
- ⚡ Faster implementation (20-30 hours)
- 🛡️ Safer (has fallback)
- 📈 Incremental improvement
- ✅ Can launch partially

**Cons:**
- 🎨 Less variety initially
- 🔨 Still requires skilled developer
- 📊 May not justify effort for limited templates

**Recommended For:** If you want balance of quality and speed

---

### Option C: Component Library Approach (Modern)

**Goal:** Build from scratch with component library (shadcn/ui, Chakra, etc.)

**Strategy:**
1. **Drop HTML5UP Templates**
   - Don't try to adapt old templates
   - Too much technical debt

2. **Use Modern Component Library**
   - shadcn/ui (Tailwind-based)
   - Chakra UI
   - Material UI
   - Mantine

3. **Build Template "Recipes"**
   - Combine components into layouts
   - Hero + Features + Contact = Template
   - AI generates component props

4. **Full Control**
   - You own all the code
   - Easy to customize
   - Modern stack

**Pros:**
- 🚀 Modern, maintainable code
- 🎯 Full control over output
- 🔧 Easy to modify
- 📱 Built-in responsive
- 🎨 Can look just as good as HTML5UP

**Cons:**
- 🏗️ Starting from scratch (30-50 hours)
- 💰 Higher initial cost
- 🎓 Requires modern React knowledge
- ⏰ Longer before launch

**Recommended For:** If you're willing to invest in long-term maintainability

---

### Option D: Keep Simple (Pragmatic)

**Goal:** Improve current simple builder instead of adding templates

**Strategy:**
1. **Enhance Simple Builder**
   - Add 3-4 layout variations
   - Improve styling with better CSS
   - Add animations/transitions

2. **Focus on Content Quality**
   - Better AI prompts for content
   - Better image selection
   - Better color palettes

3. **Add Customization Options**
   - Layout picker (grid vs stack vs cards)
   - Font picker
   - Section reordering

4. **Polish What Works**
   - Improve responsive design
   - Add smooth scrolling
   - Better form styling

**Pros:**
- ⚡ Fastest (5-10 hours)
- 💰 Cheapest
- 🛡️ Safest (no risk)
- ✅ Already working

**Cons:**
- 📉 Less impressive than competitors
- 🎨 Limited visual variety
- 🏆 May not match Wix/Squarespace

**Recommended For:** If you want to ship fast and iterate later

---

## 8. Success Criteria

### Minimum Viable Template System

**Must Have:**
1. ✅ Content is ALWAYS visible (no blank pages)
2. ✅ Works reliably (95%+ success rate)
3. ✅ No 404 errors
4. ✅ Responsive on mobile/tablet/desktop
5. ✅ Business name/logo displays correctly
6. ✅ Images load correctly
7. ✅ Colors apply to template
8. ✅ Builds in <60 seconds
9. ✅ Works in Vercel serverless environment
10. ✅ No regressions (each fix doesn't break previous fixes)

### Nice to Have

11. Multiple template options (3-5 templates)
12. AI auto-selects best template for business type
13. Template preview before generation
14. Smooth animations/transitions
15. Advanced customization (fonts, spacing, etc.)

### Testing Requirements

**Before Launching Template System:**

1. **Automated Tests**
   - Unit tests for each template
   - Integration tests for content injection
   - Visual regression tests

2. **Manual Testing**
   - Generate 20+ test websites
   - Test all business types
   - Test with/without logos
   - Test with different image counts
   - Test across browsers (Chrome, Safari, Firefox)

3. **Performance Testing**
   - Load time under 3 seconds
   - Build time under 60 seconds
   - No memory leaks in generation

4. **Accessibility**
   - WCAG AA compliance
   - Screen reader friendly
   - Keyboard navigation

---

## 9. Resources & References

### Project Files

**Core System:**
```
app/api/generate-website/route.ts       - Main API endpoint (working)
templates/template-system-cheerio.ts    - Template system (disabled)
templates/html5up/                      - 10 HTML5UP templates
templates/template-index.json           - Template metadata
```

**Documentation:**
```
docs/2026-01-25-TEMPLATE-IMPLEMENTATION-PLAN.md        - Migration guide (368 lines)
docs/2026-01-25-TEMPLATE-SYSTEM-ISSUES-REPORT.md       - Technical analysis (1,196 lines)
docs/2026-01-25-TEMPLATE-FIXES-ATTEMPTED.md            - Attempt log (572 lines)
docs/2026-01-25-TEMPLATE-ROADMAP-FOR-DEVELOPER.md      - This document
```

### Git History

**Key Commits:**
```bash
# Working simple version (current)
git checkout main

# Initial cheerio implementation
git show ef48a34

# Developer feedback fixes
git show 76efa45

# @import removal attempt
git show c81fb8e

# View full attempt history
git log --oneline --grep="template\|Template" -20
```

### External Resources

**HTML5UP:**
- Website: https://html5up.net
- License: CCA 3.0 (free for commercial use)
- Templates: 40+ available (we selected 10)

**Cheerio Documentation:**
- Website: https://cheerio.js.org/
- GitHub: https://github.com/cheeriojs/cheerio
- Version used: 1.0.0-rc.12

**Similar Projects:**
- Carrd.co (simple site builder)
- Landen (startup landing pages)
- Unicorn Platform (no-code builder)

### Debugging Tools

**Vercel Logs:**
```bash
# View latest deployment logs
vercel logs https://www.wevibecode.ai --output raw

# Filter for template errors
vercel logs | grep "template\|Template\|ERROR"
```

**Local Testing:**
```bash
# Build project
npm run build

# Run dev server
npm run dev

# Test template system locally
npx tsx templates/template-system-cheerio.ts
```

---

## 10. Questions for Developer

### Technical Questions

1. **Architecture:** Which approach (A/B/C/D) do you recommend given our constraints?

2. **Timeline:** Realistic estimate for Option A vs B vs C?

3. **CSS Strategy:** Best way to handle template CSS conflicts?
   - Complete CSS rewrite?
   - CSS-in-JS?
   - Shadow DOM?
   - Scoped CSS?

4. **Testing:** What test framework would you use?
   - Jest + React Testing Library?
   - Playwright for visual regression?
   - Cypress?

5. **Template Processing:** Should we:
   - Pre-process templates at build time?
   - Process on-demand during generation?
   - Create template "snapshots"?

6. **Fallback Strategy:** How to handle template failures gracefully?

7. **Performance:** How to keep generation under 60 seconds with templates?

### Business Questions

8. **ROI:** Is template system worth the development cost vs improving simple builder?

9. **Differentiation:** Can we compete with Wix/Squarespace using templates?

10. **Maintenance:** Ongoing effort to maintain template system?

---

## 11. Developer Onboarding

### Getting Started

**1. Clone Repository**
```bash
git clone <repository-url>
cd wevibecode-ai
npm install
```

**2. Environment Setup**
```bash
cp .env.example .env.local
# Add your API keys:
# - OPENAI_API_KEY
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - PEXELS_API_KEY
```

**3. Run Development Server**
```bash
npm run dev
# Open http://localhost:3000
```

**4. Test Simple Generator (Current)**
- Go to /dashboard/generate
- Fill in business details
- Generate website
- Should work perfectly

**5. Review Template Code**
```bash
# Read template system (disabled but complete)
code templates/template-system-cheerio.ts

# Read attempt history
code docs/2026-01-25-TEMPLATE-FIXES-ATTEMPTED.md

# Read technical analysis
code docs/2026-01-25-TEMPLATE-SYSTEM-ISSUES-REPORT.md
```

**6. Test Template Locally**
```bash
# Uncomment import in route.ts (line 10)
# Uncomment template code (lines 110-180)
npm run build
# If build fails, you've found the issue!
```

### Key Files to Understand

**Priority 1 (Must Read):**
1. `app/api/generate-website/route.ts` - Main generation logic
2. `templates/template-system-cheerio.ts` - Template processing
3. This document - Full context

**Priority 2 (Helpful):**
4. `docs/2026-01-25-TEMPLATE-SYSTEM-ISSUES-REPORT.md` - Technical deep dive
5. `docs/2026-01-25-TEMPLATE-FIXES-ATTEMPTED.md` - What didn't work
6. `components/Preview.tsx` - How websites are previewed

**Priority 3 (Reference):**
7. Template files in `templates/html5up/`
8. Git history of attempts
9. Other documentation

---

## 12. Contact & Support

**Project Owner:** Alessandro
**Current Status:** Templates disabled, seeking development help
**Priority:** Medium (simple builder working, templates would be enhancement)
**Budget:** To be discussed with developer
**Timeline:** Flexible, quality over speed

**Repository:** [Provide Git URL]
**Production Site:** https://www.wevibecode.ai
**Vercel Project:** wevibecode-ai

---

## Appendix: Code Snippets

### Current Working Simple Builder

```typescript
// app/api/generate-website/route.ts (lines 182-189)
// This is what's CURRENTLY WORKING

{
  // Use custom AI-generated layout
  console.log(`🏗️  Building custom website for ${websiteType}...`);
  const { html, css, js } = buildWebsite(
    content,
    sections,
    colors,
    images,
    logoUrl,
    websiteType,
    vibe
  );

  if (!html) {
    throw new Error('Website generation failed');
  }

  finalHtml = html;
}
```

### Template System (Disabled)

```typescript
// templates/template-system-cheerio.ts
// Complete but not working

export function generateFromTemplate(
  templateName: string,
  content: any,
  images: any[],
  logoUrl: string,
  colors: any
): string {
  // 1. Load template files
  const html = loadTemplate(templateName);
  const css = loadTemplateCSS(templateName);

  // 2. Strip external dependencies
  let result = stripExternalAssets(html);

  // 3. Inject content via Cheerio
  result = injectContent(result, content, images, logoUrl, colors);

  // 4. Apply colors and inline CSS
  const styledCSS = applyColors(css, colors);
  result = inlineCSS(result, styledCSS);

  return result;
}
```

### Problem Example: CSS Conflict

```html
<!-- Template HTML -->
<section class="tiles">
  <article class="style1">
    <div class="content">
      <h2>Title</h2>
    </div>
  </article>
</section>
```

```css
/* Template CSS (high specificity) */
html body #wrapper section.tiles article.style1 .content h2 {
  color: #ffffff;  /* White text for dark background */
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}

/* Our CSS (attempted override) */
.tiles h2 {
  color: #333333 !important;  /* Dark text - often loses */
}
```

**Result:** Template CSS wins, text stays white, but we removed dark background, so white text on white background = invisible.

---

**END OF DOCUMENT**

---

*This document contains complete context for a developer to understand the template system challenge and propose a path forward. All code, attempts, and analysis are preserved for reference.*

*Created: 2026-01-25*
*Author: Claude Sonnet 4.5*
*Purpose: Developer handoff*
