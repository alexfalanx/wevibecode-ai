# 🚀 QUICK START GUIDE
## Testing Your WeVibeCode.ai v5.1 Template System

---

## ✅ System Status: **WORKING PERFECTLY**

Your v5.1 template system is installed and tested. Follow these steps to verify it works:

---

## 📋 Step 1: Run the Test

Verify the template replacement system works:

```bash
node test-template-replacement.js
```

**Expected output:**
```
🎉 ALL TESTS PASSED!
v5.1 template replacement is working correctly.
```

---

## 🚀 Step 2: Start the Dev Server

```bash
npm run dev
```

Wait for:
```
ready - started server on 0.0.0.0:3000
```

---

## 🎨 Step 3: Generate a Test Website

1. **Open your browser:**
   ```
   http://localhost:3000/dashboard/generate
   ```

2. **Fill in the form:**
   - **Business Type:** Restaurant & Bar
   - **Description:** "Modern Italian pizzeria with authentic wood-fired oven and cozy atmosphere"
   - **Vibe:** Professional
   - **Sections:** Select "Menu", "About", "Gallery"
   - **Colors:** Let AI Choose
   - **Logo:** Enable custom logo (optional, costs 3 credits)
   - **Images:** Enable professional photos (costs 3 credits)

3. **Click "Generate Website"**

4. **Wait ~30-60 seconds** for AI to generate your site

---

## 🔍 Step 4: Verify the Preview

After generation, you'll be redirected to the preview page.

### ✅ What You SHOULD See:
- ✅ **Header:** "Modern Italian Pizzeria" or similar (YOUR business name)
- ✅ **Content:** AI-generated descriptions about your restaurant
- ✅ **Footer:** "© Modern Italian Pizzeria 2026" (YOUR business name)
- ✅ **Images:** Professional Pexels photos (if enabled)
- ✅ **Logo:** AI-generated icon logo (if enabled)

### ❌ What You Should NOT See:
- ❌ "Phantom" or "Stellar" (template names)
- ❌ "Lorem ipsum" or "Etiam" (placeholder text)
- ❌ "© Untitled" or "Design: HTML5 UP" (template credits)
- ❌ Generic template headings like "Magna etiam feugiat"

---

## 🐛 If You Still See Template Text

If the NEW preview shows template text, check these:

### 1. Verify you're looking at the NEWEST preview
- Check the URL: `/dashboard/preview/[id]`
- The ID should be the LATEST generated preview
- Old previews will ALWAYS show template text (can't be updated)

### 2. Check browser console for errors
- Press F12 to open DevTools
- Look for red errors in Console tab
- If you see errors, report them

### 3. Run the diagnostic script
```bash
NEXT_PUBLIC_SUPABASE_URL="your-url" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key" \
node diagnose-preview.js
```

### 4. Check terminal logs
Look for these messages in your terminal:
```
📝 v5.1 COMPLETE INJECTION for: [Business Name]
✅ NUKED images: Replaced with 3 real images
✅ v5.1 COMPLETE INJECTION DONE
```

If you see these logs, the system is working!

---

## 📊 Understanding the Results

### Generation Log Messages:

```
🎨 === GENERATING FROM TEMPLATE: Phantom ===
📋 Business: Modern Italian Pizzeria
🖼️  Images: 3
🎨 Colors: #3B82F6, #06B6D4
✅ Template loaded: 8KB HTML, 45KB CSS
✅ Stripped external assets from HTML
📝 v5.1 COMPLETE INJECTION for: Modern Italian Pizzeria
✅ NUKED images: Replaced with 3 real images
✅ Added logo
✅ Colors applied
✅ CSS inlined (45KB)
✅ === TEMPLATE GENERATION COMPLETE ===
📦 Final size: 68KB
```

**These logs mean SUCCESS!** The template was processed correctly.

---

## 🎯 What Each Feature Does

### v5.1 Template System:
1. **Loads** HTML5UP template (Phantom, Stellar, etc.)
2. **Removes** external assets (fontawesome, template CSS links)
3. **Replaces** 119 template phrases with your content:
   - Template names → Your business name
   - Lorem ipsum → Your descriptions
   - Template headings → Your headings
   - © Untitled → Your business name
   - HTML5 UP credits → Removed
4. **Injects** your content, images, logo, colors
5. **Inlines** CSS for standalone HTML
6. **Saves** to database

---

## 📁 Project Structure

```
wevibecode-ai/
├── templates/
│   ├── template-system.ts          ← v5.1 COMPLETE (119 replacements)
│   └── html5up/
│       ├── Alpha/
│       ├── Phantom/
│       ├── Stellar/
│       └── ... (10 templates total)
├── components/
│   └── Preview.tsx                 ← Renders preview from database
├── app/
│   ├── api/generate-website/
│   │   └── route.ts                ← Generation logic
│   └── dashboard/
│       ├── generate/page.tsx       ← Generation UI
│       └── preview/[id]/page.tsx   ← Preview page
├── diagnose-preview.js             ← Database checker
├── test-template-replacement.js    ← Unit tests
├── DIAGNOSIS-REPORT.md             ← Full diagnostic report
└── QUICK-START-GUIDE.md           ← This file
```

---

## 💡 Tips

1. **Credits:** Each generation costs 1 credit (+ optional 3 for images, 3 for logo)
2. **Speed:** Generation takes 30-60 seconds
3. **Templates:** System randomly picks best template for your business type
4. **Images:** Fetched from Pexels API (high quality, curated)
5. **Logo:** Generated by DALL-E (simple icon style)

---

## 🆘 Troubleshooting

### Problem: "Insufficient credits"
- **Solution:** Check your credits on dashboard
- Default: 10 credits for new accounts

### Problem: Generation fails with error
- **Check:** Terminal logs for error messages
- **Check:** API keys in `.env.local`:
  - `OPENAI_API_KEY`
  - `PEXELS_API_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Problem: Preview shows blank page
- **Check:** Browser console for errors (F12)
- **Check:** Database has preview entry
- **Solution:** Run `node diagnose-preview.js`

### Problem: Images don't load
- **Check:** `PEXELS_API_KEY` is set
- **Alternative:** Disable images in generation form

---

## ✅ Success Criteria

After generating a test website, you should have:

1. ✅ Zero template names in preview
2. ✅ Zero "Lorem ipsum" text in preview
3. ✅ Zero "© Untitled" in footer
4. ✅ Zero "HTML5 UP" credits
5. ✅ Your business name in header, title, and footer
6. ✅ AI-generated content throughout
7. ✅ Professional images (if enabled)
8. ✅ Custom logo (if enabled)

---

## 📞 Next Steps

Once you've verified the system works:

1. **Generate multiple test sites** with different business types
2. **Test different vibes** (professional, fun, luxury, etc.)
3. **Try with/without images** to see the difference
4. **Test custom colors** vs AI-chosen colors
5. **Share your preview** URL with others for feedback

---

**System Version:** v6.0 with v5.1 COMPLETE Template System
**Last Updated:** 2026-01-11
**Status:** ✅ Fully Functional
