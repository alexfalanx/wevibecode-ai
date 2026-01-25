# Template System Implementation Plan - 2026-01-25

**Status:** 📋 Planning Phase
**Goal:** Re-enable HTML5UP template system with cheerio (replacing jsdom)
**Priority:** High
**Estimated Time:** 2-3 hours

---

## 🎯 Objective

Restore the HTML5UP template system that was disabled due to jsdom ES Module incompatibility by migrating to cheerio, a serverless-compatible alternative.

---

## 📊 Current State Analysis

### What We Have ✅

1. **10 Professional HTML5UP Templates:**
   - Alpha, Dimension, Forty, Hyperspace, Massively
   - Phantom, Solid State, Spectral, Stellar, Story
   - Templates are stored in `templates/html5up/`

2. **Complete Template System (Disabled):**
   - File: `templates/template-system.ts`
   - Uses jsdom for DOM manipulation
   - Functions:
     - `selectTemplate()` - Picks template based on business type
     - `loadTemplate()` - Loads HTML file
     - `loadTemplateCSS()` - Loads CSS file
     - `injectContent()` - Replaces content with AI-generated data
     - `applyColors()` - Replaces template colors with brand colors
     - `inlineCSS()` - Inlines CSS into HTML
     - `generateFromTemplate()` - Main orchestration function

3. **Template Metadata:**
   - File: `templates/template-index.json`
   - Includes vibe, bestFor, layout, colorScheme for each template

4. **Business Type Mapping:**
   ```typescript
   restaurant: ['Alpha', 'Spectral', 'Stellar']
   real_estate: ['Phantom', 'Forty', 'Stellar']
   professional: ['Solid State', 'Alpha', 'Dimension']
   healthcare: ['Alpha', 'Solid State', 'Stellar']
   salon: ['Phantom', 'Spectral', 'Forty']
   business: ['Alpha', 'Solid State', 'Hyperspace']
   ecommerce: ['Forty', 'Phantom', 'Spectral']
   landing: ['Dimension', 'Spectral', 'Hyperspace']
   ```

### Why It Was Disabled ❌

**Problem:** jsdom uses ES Module dependencies that can't be loaded with `require()` in Vercel serverless functions.

**Error:**
```
Error: Failed to load external module jsdom
require() of ES Module encoding-lite.js not supported
```

**Date Disabled:** January 15, 2026 (documented in `docs/2026-01-15-405-ERROR-FIX-SUMMARY.md`)

**Temporary Solution:** API route generates custom AI layouts instead of using templates

---

## 🛠️ Implementation Strategy

### Phase 1: Install & Setup Cheerio (30 mins)

**Steps:**
1. Install cheerio package
   ```bash
   npm install cheerio
   npm install --save-dev @types/cheerio
   ```

2. Create new file: `templates/template-system-cheerio.ts`
   - Keep old jsdom version as backup
   - Migrate functions one by one

### Phase 2: Migrate DOM Manipulation Code (1-2 hours)

**Key Changes Needed:**

#### jsdom → cheerio API Mapping

| jsdom (Current) | cheerio (New) |
|----------------|---------------|
| `new JSDOM(html)` | `cheerio.load(html)` |
| `dom.window.document` | `$` (jQuery-like) |
| `document.querySelectorAll('h1')` | `$('h1')` |
| `element.textContent = 'text'` | `$(element).text('text')` |
| `element.setAttribute('href', '#')` | `$(element).attr('href', '#')` |
| `element.style.display = 'none'` | `$(element).css('display', 'none')` |
| `dom.serialize()` | `$.html()` |

#### Functions to Migrate:

1. **`injectContent()` - MOST COMPLEX**
   - Replace all `document.querySelectorAll()` with `$()`
   - Replace `textContent` with `.text()`
   - Replace `setAttribute()` with `.attr()`
   - Replace `element.style.x` with `.css()`
   - Handle text node manipulation differently (cheerio is simpler)

2. **Other functions (minimal changes):**
   - `stripExternalAssets()` - Already uses regex (no changes)
   - `replaceIcons()` - Already uses regex (no changes)
   - `applyColors()` - Already uses regex (no changes)
   - `inlineCSS()` - Already uses regex (no changes)

### Phase 3: Testing (30 mins)

**Test Cases:**
1. ✅ Test template loading
2. ✅ Test content injection
3. ✅ Test color replacement
4. ✅ Test image replacement
5. ✅ Test with different business types
6. ✅ Test final HTML output validity

**Test Command:**
```typescript
// Create test script: test-template.ts
import { generateFromTemplate } from './templates/template-system-cheerio';

const testContent = {
  businessName: 'Test Restaurant',
  hero: { headline: 'Welcome', subtitle: 'Best food in town' },
  features: [{ title: 'Quality', description: 'Fresh ingredients' }]
};

const result = generateFromTemplate('Alpha', testContent, [], '', { primary: '#3B82F6', secondary: '#06B6D4' });
console.log(result.length); // Should output HTML
```

### Phase 4: Integration with API (30 mins)

**File:** `app/api/generate-website/route.ts`

1. Uncomment template system import:
   ```typescript
   import { selectTemplate, generateFromTemplate } from '@/templates/template-system-cheerio';
   ```

2. Re-enable template-based generation logic (currently commented out)

3. Add template selection logic:
   ```typescript
   const template = selectTemplate(websiteType);
   const { html, css, js } = templateId
     ? generateFromTemplate(templateId, content, images, logoUrl, colors)
     : buildWebsite(content, sections, colors, images, logoUrl, websiteType, vibe);
   ```

### Phase 5: Deploy & Verify (15 mins)

1. Test locally first: `npm run dev`
2. Generate test website
3. Deploy to Vercel: `vercel --prod`
4. Verify production works

---

## 📝 Detailed Migration Guide

### Example: Migrating `injectContent()`

**Before (jsdom):**
```typescript
const dom = new JSDOM(html);
const document = dom.window.document;

const h1Elements = document.querySelectorAll('h1');
h1Elements.forEach((h1) => {
  h1.textContent = businessName;
});

return dom.serialize();
```

**After (cheerio):**
```typescript
const $ = cheerio.load(html);

$('h1').each((i, elem) => {
  $(elem).text(businessName);
});

return $.html();
```

### Handling Complex Cases

**Text nodes in jsdom:**
```typescript
const textNodes = Array.from(h1.childNodes).filter(node => node.nodeType === 3);
textNodes[0].textContent = businessName;
```

**Text nodes in cheerio (simpler):**
```typescript
// Cheerio automatically handles text nodes
$(h1).text(businessName); // Just replaces all text content
```

**Preserving nested elements:**
```typescript
// If you need to preserve <a> tags inside <h1>:
$('h1 a').text(businessName); // Updates text inside link
```

---

## ⚠️ Potential Issues & Solutions

### Issue 1: Text Node Manipulation
**Problem:** Current code manipulates text nodes directly (jsdom feature)
**Solution:** Cheerio handles this automatically - simplify the code

### Issue 2: Style Attribute Setting
**Problem:** `element.style.display = 'none'`
**Solution:** Use `$(element).css('display', 'none')`

### Issue 3: Nested Element Preservation
**Problem:** Code tries to preserve `<a>` tags inside `<h1>`
**Solution:** Use more specific selectors: `$('h1 a').text(...)` instead of `$('h1').text(...)`

### Issue 4: DOM Serialization
**Problem:** `dom.serialize()` returns full document
**Solution:** `$.html()` returns full HTML string (same behavior)

---

## 🎯 Success Criteria

Template system is considered successfully migrated when:

1. ✅ All 10 templates can be loaded without errors
2. ✅ Content injection works correctly (no Lorem Ipsum remaining)
3. ✅ Brand colors are applied to templates
4. ✅ Images are replaced with Pexels/user images
5. ✅ Logo is added to header
6. ✅ Footer credits are removed/replaced
7. ✅ Generated websites work on production (Vercel)
8. ✅ No jsdom-related errors in deployment logs
9. ✅ Template selection works based on business type
10. ✅ Users can generate websites using templates

---

## 📦 Dependencies to Install

```json
{
  "dependencies": {
    "cheerio": "^1.0.0-rc.12"
  },
  "devDependencies": {
    "@types/cheerio": "^0.22.35"
  }
}
```

---

## 🚀 Implementation Checklist

### Pre-Implementation
- [x] Review current template system code
- [x] Review cheerio documentation
- [x] Create implementation plan
- [ ] Backup current working state

### Implementation
- [ ] Install cheerio package
- [ ] Create `template-system-cheerio.ts`
- [ ] Migrate `injectContent()` function
- [ ] Migrate helper functions if needed
- [ ] Test template loading locally
- [ ] Test content injection locally
- [ ] Test with all 10 templates
- [ ] Fix any bugs found during testing

### Integration
- [ ] Update API route to use new template system
- [ ] Add template selection UI (if not already present)
- [ ] Test full generation flow locally
- [ ] Verify all business types work

### Deployment
- [ ] Deploy to Vercel production
- [ ] Test on production URL
- [ ] Monitor error logs
- [ ] Generate test website in production
- [ ] Verify no jsdom errors

### Documentation
- [ ] Update this document with results
- [ ] Document any issues encountered
- [ ] Update main README if needed
- [ ] Add migration notes for future reference

---

## 📚 Reference Documentation

### Cheerio Docs
- Official: https://cheerio.js.org/
- API Reference: https://cheerio.js.org/docs/api/traversing

### jsdom → cheerio Migration
- Key difference: Cheerio doesn't create a full browser environment
- Cheerio is jQuery-like selector and manipulation
- No window/document/global objects in cheerio

### Current Files to Reference
- `templates/template-system.ts` - Current jsdom implementation
- `docs/2026-01-15-405-ERROR-FIX-SUMMARY.md` - Why jsdom was disabled
- `app/api/generate-website/route.ts` - Where templates are used

---

## 🎓 Key Insights

### Why Cheerio Over Other Options

**vs. linkedom:**
- Cheerio is lighter and faster
- jQuery-like API (familiar to most developers)
- Better documentation and community support

**vs. Edge Runtime:**
- Cheerio works in Node.js runtime (our current setup)
- No 1MB bundle size limit
- More flexible

**vs. Pre-processing at Build Time:**
- Dynamic content generation (can't pre-process)
- Need runtime flexibility for AI content

### Benefits of Template System

1. **Professional Designs:** HTML5UP templates are high-quality
2. **Variety:** 10 different layouts/styles
3. **Responsive:** All templates are mobile-friendly
4. **Consistent Structure:** Easier to inject content systematically
5. **Better Results:** Users get proven, professional designs

---

## 💡 Next Steps After Implementation

1. **Re-enable Template Gallery UI** (currently disabled in generate page)
2. **Add template previews** to help users choose
3. **Create template recommendation system** based on business type + vibe
4. **Add more templates** if needed
5. **Optimize template loading** (cache parsed templates)

---

**Created:** 2026-01-25
**Author:** Development Team
**Status:** Ready to implement
**Next Action:** Install cheerio and begin migration
