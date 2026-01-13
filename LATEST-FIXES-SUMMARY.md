# Latest Fixes Summary - Color Names & Text Editing

## Issues Fixed

### 1. Color Palette Names Now Descriptive ✅

**Problem:** Colors were labeled as "color-1", "color-2", which didn't tell users what they were changing.

**Solution:**
- Color palettes now have user-friendly names:
  - "Primary Color" - The main brand color
  - "Secondary Color" - Secondary accent color
  - "Accent Color" - Tertiary accent color
  - "Background Color" - Background colors
  - "Text Color" - Text colors
  - "Button Color" - Button colors
  - "Heading Color" - Heading colors

**How it works:**
1. If CSS variables exist (like `--primary-color`), they're renamed to friendly names
2. If no CSS variables, unique colors are extracted and named "Primary/Secondary/Accent Color"
3. The mapping is maintained when applying color changes

**Files changed:**
- `lib/publish.ts` (lines 94-171 for extraction, 245-316 for application)

### 2. Text Editing Now Works for All Elements ✅

**Problem:** Only the first H1, H2, and first P could be edited. Other text elements couldn't be changed.

**Root Causes:**
1. The `applyTextEdit` function was comparing `element.textContent === oldText`, which failed after the first edit because oldText was stale
2. Element selectors weren't specific enough
3. The element list wasn't being refreshed after edits

**Solutions:**

#### A. Improved Element Extraction (lib/publish.ts:174-229)
- Added more element types: `h1-h6, p, button, a, span, li`
- Created more specific selectors using parent context
- Example: `div.hero > h1:nth-of-type(1)` instead of just `h1:nth-of-type(1)`
- Skip container elements (elements that contain other block elements)
- Skip empty elements

#### B. Fixed Text Application (lib/publish.ts:231-272)
- **Removed the oldText comparison** - this was the main bug!
- Now uses the selector to find the element and updates it directly
- Has fallback logic: tries specific selector first, then simpler version
- More reliable across multiple edits

#### C. Auto-Refresh Element List (components/SiteEditor.tsx:45-63)
- After each text edit, re-extract elements from the updated HTML
- Keeps the element list in sync with actual content
- Ensures selectors always match the current HTML structure

#### D. Auto-Refresh Color Palette (components/SiteEditor.tsx:71-85)
- After each color edit, re-extract colors from the updated HTML
- Keeps the color palette showing the current colors
- Ensures color names stay accurate

## How to Reset Published Sites

To free up your 5 published site slots, use one of these methods:

### Option 1: Browser Console (Easiest)
1. Open your app while logged in
2. Press F12 to open console
3. Paste this:
```javascript
fetch('/api/reset-published', { method: 'POST' })
  .then(r => r.json())
  .then(d => alert(`Unpublished ${d.count} sites!`))
```

### Option 2: Direct Database (If you have access)
```sql
UPDATE previews SET is_published = false WHERE is_published = true;
```

**New API Endpoint Created:**
- `POST /api/reset-published` - Unpublishes all sites for the authenticated user
- File: `app/api/reset-published/route.ts`

## Testing Guide

### Color Editing Test:
1. ✅ Generate a new site
2. ✅ Click Edit → Colors tab
3. ✅ Should see 2-3 colors with descriptive names (Primary Color, Secondary Color, etc.)
4. ✅ Click on a color → Color picker opens
5. ✅ Change color → Click Apply
6. ✅ Click Save
7. ✅ Reopen editor → Colors should show the updated values with same names

### Text Editing Test:
1. ✅ Generate a site with multiple H1, H2, P elements
2. ✅ Click Edit → Text tab
3. ✅ Should see ALL text elements listed (not just the first few)
4. ✅ Edit the first H1 → Apply → Should update
5. ✅ Edit the second H1 → Apply → Should update independently
6. ✅ Edit any P element → Apply → Should update
7. ✅ Edit multiple elements in sequence → All should work
8. ✅ Click Save → All changes should persist
9. ✅ Reopen editor → Should see all the updated text

## Summary of Changes

**Files Modified:**
1. `lib/publish.ts`
   - Lines 94-171: Color extraction with friendly names
   - Lines 174-229: Improved element extraction
   - Lines 231-272: Fixed text edit application
   - Lines 245-316: Color edit application with name mapping

2. `components/SiteEditor.tsx`
   - Lines 45-63: Auto-refresh elements after text edit
   - Lines 71-85: Auto-refresh palette after color edit

**Files Created:**
1. `app/api/reset-published/route.ts` - Endpoint to unpublish all sites

**Key Improvements:**
- 🎨 User-friendly color names instead of "color-1", "color-2"
- ✏️ All text elements are now editable, not just first few
- 🔄 Element and color lists auto-refresh after edits
- 🎯 More specific selectors for reliable element targeting
- 🛠️ Removed buggy oldText comparison that was breaking edits
