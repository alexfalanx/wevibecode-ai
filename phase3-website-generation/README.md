# Phase 3: AI Website Generation 🤖✨

Generate complete, professional websites from text prompts using GPT-4!

---

## 🎯 What This Does

Users describe their website in plain English, and AI generates:
- Complete HTML structure
- Professional CSS styling
- Interactive JavaScript
- Responsive design (mobile/tablet/desktop)
- Modern, clean aesthetics

**Then automatically opens in the Phase 4 Preview System!**

---

## ✨ Features

### 1. Smart Prompt Engineering
- Optimized system prompts for each website type
- Structured output parsing
- Professional, production-ready code generation

### 2. Multiple Website Types
- 🚀 **Landing Page** - Conversion-focused pages
- 💼 **Portfolio** - Personal project showcases
- 🏢 **Business** - Professional company sites
- 🍽️ **Restaurant** - Menus and reservations
- 📝 **Blog** - Content and articles
- 🛒 **E-commerce** - Product showcases

### 3. Color Scheme Selection
- Blue Modern
- Purple Elegant
- Green Fresh
- Orange Warm
- Dark Professional
- Minimal Light

### 4. Credits System
- Integrated with existing profiles.credits_remaining
- 1 credit = 1 website generation
- Automatic credit deduction
- Credit usage logging

### 5. Generation History
- View all past generations
- Re-open any generation in preview
- Delete unwanted generations
- Track credits used per generation

---

## 📦 What's Included

```
phase3-website-generation/
├── app/
│   ├── api/
│   │   └── generate-website/
│   │       └── route.ts              # GPT-4 generation API
│   └── dashboard/
│       ├── generate/
│       │   └── page.tsx              # Generation form
│       └── history/
│           └── page.tsx              # Generation history
├── sql/
│   └── phase3-migration.sql          # Database migration
└── scripts/
    └── install-phase3.ps1            # Installation script
```

---

## 🚀 Installation

### Prerequisites

✅ Phase 4 (Preview System) already installed
✅ OpenAI API key ready

### Step 1: Extract Package

```powershell
# Extract to project root
tar -xzf phase3-website-generation.tar.gz
```

### Step 2: Run Installation Script

```powershell
PowerShell -ExecutionPolicy Bypass -File phase3-website-generation\scripts\install-phase3.ps1
```

This will:
- Install `openai` package
- Create directories
- Copy all files to correct locations

### Step 3: Run SQL Migration

1. Open Supabase Dashboard → SQL Editor
2. Open `phase3-website-generation/sql/phase3-migration.sql`
3. Copy entire SQL and paste in SQL Editor
4. Click "Run"
5. Verify: "Success. No rows returned"

This creates:
- `credits_log` table
- Additional columns in `previews` table
- RLS policies and indexes

### Step 4: Verify OpenAI API Key

Check `.env.local` has:

```env
OPENAI_API_KEY=sk-your-key-here
```

### Step 5: Restart Dev Server

```powershell
npm run dev
```

---

## 🧪 Testing

### Test 1: Generate Website

1. Visit: http://localhost:3000/dashboard/generate
2. Enter prompt: "A landing page for a fitness app with hero, features, and pricing"
3. Select type: "Landing Page"
4. Select color: "Blue Modern"
5. Click "Generate Website"
6. Should open preview automatically!

### Test 2: View History

1. Visit: http://localhost:3000/dashboard/history
2. See your generated website listed
3. Click eye icon to view
4. Click trash icon to delete

### Test 3: Credits System

1. Generate a website (uses 1 credit)
2. Check your credits decreased
3. Try generating when credits = 0
4. Should show "Insufficient credits" error

---

## 📖 Usage Guide

### Basic Website Generation

```typescript
// User visits /dashboard/generate
// Fills form:
{
  prompt: "A modern portfolio for a photographer",
  websiteType: "portfolio",
  colorScheme: "minimal-light"
}

// Clicks "Generate Website (1 Credit)"

// API does:
1. Check user authentication
2. Check user has >= 1 credit
3. Call GPT-4 with optimized prompt
4. Parse generated HTML/CSS/JS
5. Save to previews table
6. Deduct 1 credit
7. Log credit usage
8. Return preview ID

// User automatically redirected to:
/dashboard/preview/{preview-id}
```

### Example Prompts

**Landing Page:**
```
A landing page for a SaaS project management tool with hero section, 
features grid showing collaboration tools, pricing table with 3 tiers, 
and testimonials from happy customers. Modern, professional design.
```

**Portfolio:**
```
A portfolio website for a freelance graphic designer showcasing 6 recent 
projects in a masonry grid layout. Include an about section and contact form. 
Creative, colorful design with smooth animations.
```

**Restaurant:**
```
A website for an Italian restaurant called "Bella Cucina" with a hero 
image of pasta, menu highlights showing signature dishes, location map, 
hours of operation, and online reservation form. Warm, inviting colors.
```

---

## 🔧 API Reference

### POST /api/generate-website

Generate a new website using AI.

**Request Body:**
```json
{
  "prompt": "string (required)",
  "websiteType": "landing|portfolio|business|restaurant|blog|ecommerce",
  "colorScheme": "string (optional)"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "previewId": "uuid",
  "creditsRemaining": 9
}
```

**Response (Error):**
```json
{
  "error": "Error message"
}
```

**Error Codes:**
- `400` - Missing required fields
- `401` - Unauthorized (not logged in)
- `402` - Insufficient credits
- `500` - Generation failed

---

## 💰 Cost & Credits

### OpenAI API Costs

- **GPT-4o**: ~$0.03-0.10 per website
- Depends on complexity and output length

### Credit System

- 1 credit = 1 website generation
- New users get 10 free credits
- Cost: ~$0.30-1.00 of API usage for 10 credits

### Optimization Tips

To reduce costs:
- Use shorter, more specific prompts
- Limit to essential sections
- Choose simpler website types

---

## 🗄️ Database Schema

### previews table (additions)

```sql
generation_prompt TEXT           -- User's original prompt
generation_type VARCHAR(50)      -- Type selected (landing, portfolio, etc)
credits_used INT DEFAULT 1       -- Credits used for this generation
```

### credits_log table (new)

```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users(id)
credits_used INT NOT NULL
action VARCHAR(100)              -- 'generate_website'
details JSONB                    -- {preview_id, prompt}
created_at TIMESTAMPTZ
```

---

## 🔍 Troubleshooting

### "Failed to generate website"

**Check:**
1. OpenAI API key is correct in `.env.local`
2. API key has credits/billing enabled
3. Terminal logs for detailed error

### "Insufficient credits"

**Solution:**
Update user credits in Supabase:
```sql
UPDATE profiles SET credits_remaining = 10 WHERE id = 'user-id';
```

### Generation takes too long

**Normal behavior:**
- GPT-4 takes 10-30 seconds
- Shows loading spinner during generation
- Don't refresh the page!

### Generated code looks broken

**Check:**
1. View in preview system (Phase 4)
2. Try different device views
3. Regenerate with more specific prompt

### RLS policy errors

**Solution:**
Make sure SQL migration ran successfully:
```sql
SELECT * FROM credits_log LIMIT 1;
```

---

## 🎨 Customization

### Add New Website Type

Edit `app/dashboard/generate/page.tsx`:

```typescript
const WEBSITE_TYPES = [
  // ... existing types
  { 
    value: 'custom', 
    label: 'Custom Type', 
    description: 'Your description' 
  },
];
```

Edit `app/api/generate-website/route.ts`:

```typescript
const typeSpecific: Record<string, string> = {
  // ... existing types
  custom: `
TYPE: Custom Type
Create a custom website with:
- Your requirements
  `,
};
```

### Modify System Prompt

Edit `buildSystemPrompt()` in `app/api/generate-website/route.ts` to customize AI behavior.

### Adjust Credit Cost

Change credits_used in API route:

```typescript
credits_used: 2,  // Make it cost 2 credits
```

---

## 📊 Analytics Ideas

Track generation metrics:

```sql
-- Most popular website types
SELECT generation_type, COUNT(*) as count 
FROM previews 
WHERE generation_type IS NOT NULL 
GROUP BY generation_type 
ORDER BY count DESC;

-- Total credits used
SELECT SUM(credits_used) as total_credits 
FROM credits_log 
WHERE action = 'generate_website';

-- Generations per user
SELECT user_id, COUNT(*) as generations 
FROM previews 
WHERE generation_prompt IS NOT NULL 
GROUP BY user_id 
ORDER BY generations DESC;
```

---

## 🚀 Next Steps

### Immediate Improvements

1. **Add more website types** - E-learning, Event, Music, etc.
2. **Custom colors** - Let users pick exact hex colors
3. **Template library** - Pre-made starting points
4. **Regenerate button** - Try again with same prompt

### Advanced Features

1. **Edit generated code** - Code editor with live preview
2. **Export to files** - Download HTML/CSS/JS separately
3. **Publish to domain** - Deploy to custom domain
4. **Version history** - Track iterations of same website
5. **AI improvements** - Fine-tune prompts, add examples

---

## 📝 Testing Checklist

After installation, verify:

- [ ] /dashboard/generate page loads
- [ ] Can see credits remaining
- [ ] All 6 website types selectable
- [ ] All 6 color schemes selectable
- [ ] Can enter prompt text
- [ ] Generate button works
- [ ] Loading spinner shows during generation
- [ ] Redirects to preview after generation
- [ ] Preview displays generated website
- [ ] Credits decrease after generation
- [ ] /dashboard/history shows generated site
- [ ] Can delete from history
- [ ] Insufficient credits error works

---

## 🎉 Success!

You now have a complete AI website generation system!

Users can:
✅ Describe any website in plain English
✅ Generate professional, modern websites in seconds
✅ Preview across desktop/tablet/mobile
✅ View and manage generation history
✅ Track credit usage

---

**Built with ❤️ for WeVibeCode.ai**
