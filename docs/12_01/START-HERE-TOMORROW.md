# 🚀 Quick Start Guide - Resume Development Tomorrow

**Date:** January 12, 2026
**Status:** Color editing broken, everything else works
**Priority:** Fix color editing in SiteEditor

---

## 📚 Read These Files First (In Order)

1. **START-HERE-TOMORROW.md** ← You are here
2. **COLOR-EDITING-ISSUE.md** ← Detailed problem analysis
3. **PROJECT-ROADMAP.md** ← Full project context
4. **lib/publish.ts** ← The file with the bug (lines 274-361)

---

## 🔴 The Problem (In 30 Seconds)

**What's broken:** Color editing doesn't actually change colors in the HTML

**Why it's broken:**
- AI-generated HTML doesn't use CSS variables
- Just has direct colors like `background-color: #4F46E5;`
- Our replacement logic can't find/replace the old color value correctly

**What works:**
- ✅ Text editing - perfect!
- ✅ Publishing - perfect!
- ✅ Color picker UI - works
- ✅ Everything except the actual color replacement

---

## 🔍 Quick Debug Steps

### 1. Test the Issue
```bash
# Start dev server
npm run dev

# Open http://localhost:3000
# Generate a site
# Click Edit → Colors
# Change "Primary Color" to red
# Click Apply → Save
# ❌ Color doesn't change
```

### 2. Check Browser Console
Open F12 and look for:
```
Replacing color: #4F46E5 -> #ff0000
```

If you see this log, extraction is working but replacement is failing.
If you DON'T see this log, extraction is failing.

### 3. The Buggy Function
File: `lib/publish.ts` (lines 274-361)
```typescript
export function applyColorEdit(
  html: string,
  cssKey: string,    // "Primary Color"
  newColor: string   // "#ff0000"
): string {
  // This function should replace old color with new color
  // But it's not working...
}
```

---

## 💡 Recommended Solutions (Try in Order)

### Solution 1: Simplest Fix (Try This First!)

Replace the entire `applyColorEdit` function with:

```typescript
export function applyColorEdit(
  html: string,
  cssKey: string,
  newColor: string
): string {
  // Get current palette to find the old color value
  const palette = extractColorPalette(html);
  const oldColor = palette[cssKey];

  if (!oldColor) {
    console.error(`Color not found for key: ${cssKey}`);
    return html;
  }

  console.log(`Replacing ${oldColor} with ${newColor}`);

  // Escape special regex characters
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedOldColor = escapeRegex(oldColor);

  // Replace ALL occurrences of the old color (case insensitive)
  const regex = new RegExp(escapedOldColor, 'gi');
  const newHtml = html.replace(regex, newColor);

  return newHtml;
}
```

**Why this might work:**
- Simpler logic
- Uses the palette we already extracted
- Direct string replacement
- No complex mapping

**Test it:**
1. Make the change
2. Restart dev server
3. Try changing a color
4. Check console for "Replacing X with Y"
5. Check if color actually changes

---

### Solution 2: Force AI to Use CSS Variables

If Solution 1 doesn't work, modify the AI prompt to always generate CSS variables.

Find where the AI prompt is built (probably in generation API) and add:
```
IMPORTANT: Use CSS custom properties for all colors:
:root {
  --primary-color: #...;
  --secondary-color: #...;
}
Then use var(--primary-color) in your CSS.
```

---

### Solution 3: Store Color Mapping

If both above fail, maintain state mapping:

In `components/SiteEditor.tsx`:
```typescript
// Add this state
const [colorValueMap, setColorValueMap] = useState<Map<string, string>>(new Map());

// In useEffect when loading
useEffect(() => {
  const palette = extractColorPalette(htmlContent);
  const map = new Map();
  for (const [key, value] of Object.entries(palette)) {
    map.set(key, value);
  }
  setColorValueMap(map);
}, [htmlContent]);

// In applyColorChange
const applyColorChange = () => {
  if (!selectedColor || !tempColor) return;

  // Get the ORIGINAL color value from our map
  const originalColor = colorValueMap.get(selectedColor.key);

  if (!originalColor) return;

  // Replace the original color with new color
  const newHtml = editedHtml.replace(
    new RegExp(originalColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
    tempColor
  );

  setEditedHtml(newHtml);
  // ... rest of function
};
```

---

## 🗂️ Key Files to Know

### Critical Files (Need to modify)
- **`lib/publish.ts`** - Line 274-361: `applyColorEdit()` ← THE BUG
- **`components/SiteEditor.tsx`** - Line 71-85: `applyColorChange()` ← Calls the buggy function

### Working Files (Don't touch!)
- **`lib/publish.ts`** - Line 70-172: `extractColorPalette()` ✅
- **`lib/publish.ts`** - Line 231-272: `applyTextEdit()` ✅
- **`components/Preview.tsx`** - Everything ✅

### Reference Files
- **`types/publish.ts`** - Type definitions
- **`components/PublishModal.tsx`** - Publishing UI (works fine)

---

## ✅ Test Checklist

After making changes, verify:

**Color Editing:**
- [ ] Can change "Primary Color"
- [ ] Can change "Secondary Color"
- [ ] Colors update in preview immediately after save
- [ ] After refresh, colors are still updated
- [ ] Published site shows updated colors

**Don't Break These:**
- [ ] Text editing still works
- [ ] Publishing still works
- [ ] Preview loads correctly
- [ ] No console errors

---

## 📊 Current Project Status

```
MVP Progress: ████████░░ 80%

✅ DONE:
- AI website generation
- Live preview (desktop/tablet/mobile)
- Text editing (all elements)
- Publishing (subdomain + custom domain)
- Success feedback
- User authentication

❌ BLOCKING:
- Color editing

🔜 NEXT:
- Image upload
- Templates
- Analytics
```

---

## 🛠️ Development Commands

```bash
# Start dev server
npm run dev

# Check types
npm run type-check

# View database
# Open Supabase dashboard at:
# https://supabase.com/dashboard

# Reset published sites (in browser console when logged in)
fetch('/api/reset-published', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

---

## 💬 Questions to Answer While Debugging

1. Is `extractColorPalette()` returning the correct colors?
   - Check: `console.log(extractColorPalette(htmlContent))`

2. Is the old color value being found correctly?
   - Check: Console log in `applyColorEdit()` at line 346

3. Is the regex replacement executing?
   - Add: `console.log('Regex:', regex, 'Matches:', html.match(regex))`

4. Does the HTML actually change?
   - Check: `console.log('Before:', html.substring(0, 500))`
   - Check: `console.log('After:', newHtml.substring(0, 500))`

5. Is the preview re-rendering?
   - Check: Does `editedHtml` state update in SiteEditor?

---

## 📞 If You Get Stuck

### Check These Common Issues:
1. **Regex not matching**: Old color format doesn't match (e.g., `rgb()` vs `#hex`)
2. **Case sensitivity**: Use `gi` flag, not just `g`
3. **Special characters**: Make sure to escape parentheses in `rgb()`
4. **State not updating**: React state might be stale
5. **HTML structure changed**: DOMParser might be restructuring HTML

### Debug Tools:
- Browser DevTools (F12)
- React DevTools extension
- Supabase dashboard for database
- Console.log everything!

---

## 🎯 Success Definition

You'll know it's fixed when:
1. User clicks Edit → Colors
2. User changes "Primary Color" to red
3. User clicks Apply → Save
4. **Preview immediately shows red**
5. After refresh, **color is still red**
6. After publishing, **live site has red**

That's it. That's the goal. 🎨✨

---

## 📝 When You Fix It

1. Update `COLOR-EDITING-ISSUE.md` with solution
2. Update `PROJECT-ROADMAP.md` status to ✅
3. Test thoroughly (all 6 test cases above)
4. Commit with message: "Fix: Color editing now works"
5. Celebrate! 🎉

---

**Good luck! You've got this.** 💪

The solution is probably simpler than you think. Start with Solution 1 - just replace all occurrences of the old color value with the new one. Don't overthink it.

**Remember:** Code that works > Code that's elegant
