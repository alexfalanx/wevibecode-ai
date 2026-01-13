# DOM-Based Template Injection Issues - Technical Analysis

## Project Context

**Project:** WeVibeCode.ai - AI Website Builder
**Tech Stack:**
- Next.js 15 (React framework with App Router)
- TypeScript
- Supabase (Database & Auth)
- OpenAI GPT-4o (Content generation)
- Pexels API (Stock images)
- HTML5 UP Templates (10 professional templates)
- **NEW: jsdom** (HTML parsing library)

**Architecture Flow:**
```
User Input → AI Content Generation → Template Selection →
Content Injection (DOM-based) → CSS Inlining → Final HTML
```

---

## The Evolution of the Problem

### Original Issue (Regex Approach - v5.1)
User reported seeing "ipse loru kinda stuff" - lorem ipsum text appearing in generated websites despite multiple fix attempts.

**Previous Approach:**
- Maintained arrays of 50+ lorem ipsum phrases
- Used regex pattern matching to find and replace
- Required knowing every single placeholder phrase
- Fragile - missed phrases would slip through

### Attempted Solution (DOM Approach - v6.0)
Rewrote the entire content injection system to use DOM parsing instead of regex.

**Commit:** `7699514` - "Fix: Systematic DOM-based content injection"

**Technical Changes:**
1. Added `jsdom` dependency for HTML parsing
2. Replaced regex-based `injectContent()` with DOM-based version
3. Systematically replaced ALL H1, H2, H3, P elements using `querySelectorAll`

---

## Current Problems with DOM Approach

### Problem 1: Blank Page Regression - Template Name Mapping

**Error Log:**
```
🎨 Using template: solid-state
❌ Template not found: C:\Users\aless\wevibecode-ai\templates\html5up\Solid-state\index.html
❌ CSS not found: C:\Users\aless\wevibecode-ai\templates\html5up\Solid-state\assets\css\main.css
❌ Failed to load template files
✅ Template website built: 0KB
```

**Root Cause:**
The template ID "solid-state" is being capitalized to "Solid-state" instead of "Solid State" (with space).

**Current Code (route.ts:114-127):**
```typescript
const templateNameMap: { [key: string]: string } = {
  'alpha': 'Alpha',
  'solid-state': 'Solid State', // Has space!
  // ... other mappings
};

const templateName = templateNameMap[templateId] ||
  templateId.charAt(0).toUpperCase() + templateId.slice(1);
```

**Why It's Failing:**
- The mapping exists and looks correct
- BUT the fallback is being used: `templateId.charAt(0).toUpperCase() + templateId.slice(1)`
- This converts "solid-state" to "Solid-state" (wrong)
- This suggests `templateId` is NOT matching the key 'solid-state' in the map
- Possible reasons:
  1. templateId is being transformed before reaching this code
  2. templateId has unexpected casing (e.g., 'Solid-state')
  3. templateId has whitespace or special characters
  4. Case-sensitive comparison issue

**Impact:**
- Solid State template returns blank page (0KB)
- User sees no content at all
- Worse than lorem ipsum issue

---

### Problem 2: DOM Parsing May Alter Template Structure

**Concern:**
Using jsdom to parse and serialize HTML might introduce unintended changes:

1. **HTML Entities:** May encode/decode differently
2. **Whitespace:** May normalize whitespace in unexpected ways
3. **Self-closing tags:** `<br>` vs `<br/>`
4. **Attribute order:** May reorder element attributes
5. **DOCTYPE:** May modify or remove DOCTYPE declarations
6. **Comments:** May strip or preserve HTML comments differently

**Evidence from Logs (Phantom template):**
```
✅ Template loaded: 8KB HTML, 58KB CSS
✅ v6.0 DOM-BASED INJECTION COMPLETE
📦 Final size: 68KB
```

The template grew from 8KB to 68KB, which is expected with CSS inlining, BUT we need to verify the HTML structure is preserved.

---

### Problem 3: Missing Template Elements

**From User Report:**
> "no menu no hero but images yes although not underneath the hero section"

**Analysis:**
The DOM-based approach might be:
1. **Removing elements** - The `querySelectorAll` might not find certain elements
2. **Misplacing images** - Images may not be in the correct sections
3. **Missing sections** - Hero section might not be recognized

**Specific Issues:**
- Menu navigation may be getting removed instead of updated
- Hero section might not have the ID/class we're searching for
- Images might be replaced globally instead of by section

---

## Detailed Technical Analysis

### File: `templates/template-system.ts` (v6.0)

**Lines 77-290: New DOM-based injectContent() function**

**Step-by-step breakdown:**

```typescript
// 1. Parse HTML
const dom = new JSDOM(html);
const document = dom.window.document;
```
**Risk:** JSDOM might not perfectly replicate browser behavior. Some templates might have browser-specific quirks.

```typescript
// 2. Replace ALL H1 tags
const h1Elements = document.querySelectorAll('h1');
h1Elements.forEach((h1) => {
  const links = h1.querySelectorAll('a');
  if (links.length > 0) {
    links.forEach(link => {
      link.textContent = businessName;
    });
  } else {
    h1.textContent = businessName;
  }
});
```
**Issue:** Setting `textContent` completely replaces inner HTML, removing any nested elements like `<span>`, `<strong>`, etc.

```typescript
// 5. Replace menu items
const menuLinks = document.querySelectorAll('nav a, #nav a, .menu a');
menuLinks.forEach(link => {
  const text = link.textContent?.trim().toLowerCase() || '';
  if (text.includes('generic') || text.includes('dropdown')) {
    link.textContent = 'About';
    link.setAttribute('href', '#about');
  }
  // ... more replacements
  else if (text.includes('log in') || text.includes('login')) {
    link.remove(); // REMOVES the element!
  }
});
```
**Problem:**
- `link.remove()` might break menu structure
- Different templates have different selectors (nav, #nav, .menu)
- Some templates might use different menu structures entirely

```typescript
// 8. Clean footer
const footerElements = document.querySelectorAll('footer, #footer, .copyright');
footerElements.forEach(footer => {
  const copyrightText = footer.textContent || '';
  if (copyrightText.includes('Untitled') || copyrightText.includes('HTML5 UP')) {
    footer.innerHTML = `<p class="copyright">&copy; ${businessName}. All rights reserved.</p>`;
  }
});
```
**Problem:** Replacing entire `footer.innerHTML` destroys all footer structure and styling classes.

---

## What's Working vs What's Broken

### Working (Phantom Template Test):
✅ Template loading (HTML + CSS)
✅ H1 replacement (1 replaced)
✅ H2 replacement (15 replaced)
✅ Paragraph replacement (13 replaced)
✅ Image replacement (3 real images)
✅ CSS inlining (68KB final)
✅ File generation (not blank)

### Broken:
❌ Solid State template (blank page - 0KB)
❌ Menu navigation (reported missing)
❌ Hero section (reported missing)
❌ Image positioning (not in correct sections)
❌ Template name mapping (fallback being used)

---

## Root Cause Analysis

### Why the Template Mapping Fails

**Hypothesis 1: Case Sensitivity**
```typescript
// If templateId comes in as 'Solid-state' or 'SOLID-STATE'
templateNameMap['solid-state'] !== 'Solid-state'  // Fails to match
```

**Hypothesis 2: Template ID Source**
The templateId might be getting transformed before it reaches the API:
- In the UI (TemplateGallery component)
- In the API request body parsing
- In URL encoding/decoding

**How to Debug:**
```typescript
// Add this logging:
console.log(`🔍 DEBUG templateId: "${templateId}" (type: ${typeof templateId})`);
console.log(`🔍 Keys in map:`, Object.keys(templateNameMap));
console.log(`🔍 Match found:`, templateNameMap[templateId]);
console.log(`🔍 Fallback would be:`, templateId.charAt(0).toUpperCase() + templateId.slice(1));
```

### Why Menu/Hero Sections Might Be Missing

**Hypothesis:** The DOM manipulation is too aggressive.

**Evidence:**
```typescript
// This removes elements:
link.remove();

// This replaces entire innerHTML:
footer.innerHTML = `<p class="copyright">...</p>`;
```

**Templates might have:**
- Menu inside `<header>` instead of `<nav>`
- Hero as `<div class="hero">` instead of `<section id="banner">`
- Different class naming conventions

---

## Potential Solutions

### Option 1: Fix Template Name Mapping (Immediate)

**Add case-insensitive lookup:**
```typescript
const templateId = body.templateId?.toLowerCase() || null;  // Normalize

const templateNameMap: { [key: string]: string } = {
  'alpha': 'Alpha',
  'solid-state': 'Solid State',
  // ... rest
};

const templateName = templateNameMap[templateId] ||
  templateNameMap[templateId?.toLowerCase()] ||  // Try lowercase
  templateId.charAt(0).toUpperCase() + templateId.slice(1);
```

### Option 2: Less Aggressive DOM Manipulation

**Preserve more structure:**
```typescript
// Instead of:
h1.textContent = businessName;  // Destroys inner HTML

// Use:
const firstTextNode = Array.from(h1.childNodes).find(n => n.nodeType === 3);
if (firstTextNode) {
  firstTextNode.textContent = businessName;
} else {
  h1.textContent = businessName;
}
```

### Option 3: Hybrid Approach

**Use DOM for structure, regex for text:**
1. Parse with JSDOM to find elements
2. Get element positions/selectors
3. Use regex to replace text while preserving HTML structure
4. Avoid serialization issues

### Option 4: Add Template-Specific Handlers

**Different logic per template:**
```typescript
switch (templateName) {
  case 'Solid State':
    return injectContentSolidState(dom, content);
  case 'Phantom':
    return injectContentPhantom(dom, content);
  default:
    return injectContentGeneric(dom, content);
}
```

---

## Testing Matrix

| Template | Loads | H1 | H2 | H3 | P | Menu | Hero | Images | Size |
|----------|-------|----|----|----|----|------|------|--------|------|
| Phantom | ✅ | ✅ | ✅ | ✅ | ✅ | ❓ | ❓ | ✅ | 68KB |
| Solid State | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 0KB |
| Spectral | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |
| Alpha | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |
| Hyperspace | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |

**Legend:**
- ✅ Working as expected
- ❌ Confirmed broken
- ❓ Not yet tested

---

## Recommended Next Steps

### Immediate (Fix Blank Page):
1. Add debug logging to template name mapping
2. Normalize templateId to lowercase before lookup
3. Add fallback that handles "Solid State" case
4. Test Solid State template specifically

### Short-term (Fix Missing Elements):
1. Inspect generated HTML of working template (Phantom)
2. Compare to original template to see what's missing
3. Adjust DOM selectors for menu/hero sections
4. Make element removal less aggressive (hide instead of remove)

### Long-term (Systematic Solution):
1. Create template-specific handlers for unique structures
2. Add comprehensive test suite for all 10 templates
3. Consider hybrid DOM + regex approach
4. Document each template's quirks and requirements

---

## Questions for Developer

1. **Priority:** Should we fix the blank page issue first, or address the missing menu/hero issue?
2. **Approach:** Stick with DOM parsing or revert to improved regex?
3. **Testing:** Can we test all 10 templates systematically before declaring success?
4. **Acceptable tradeoffs:** Is it okay if some template-specific features are lost?

---

## Files to Investigate

### Primary:
- `templates/template-system.ts` (lines 77-290) - DOM injection logic
- `app/api/generate-website/route.ts` (lines 109-130) - Template name mapping
- `components/TemplateGallery.tsx` - Template ID source

### Secondary:
- `templates/html5up/Solid State/index.html` - Template structure
- `templates/html5up/Phantom/index.html` - Working template comparison

---

## Conclusion

**The DOM-based approach introduced a new critical regression:**
- Solid State template now returns blank page (0KB)
- Menu and hero sections may be missing from other templates
- The improvement eliminated lorem ipsum but broke core functionality

**This is worse than the original problem** because:
- Original issue: Some lorem ipsum text visible
- Current issue: Complete blank page (no content at all)

**Recommendation:**
Fix the template name mapping immediately as a hotfix, then carefully test all templates before proceeding with DOM approach, or consider reverting to improved regex approach with better placeholder coverage.

---

*Last Updated: 2026-01-13*
*Session: DOM-based approach regression analysis*
*Status: CRITICAL - Blank page regression*
*Previous Documentation: TEMPLATE-CONTENT-INJECTION-ISSUES.md*
