# WeVibeCode AI - Project Roadmap & Current Status

**Last Updated:** January 12, 2026
**Project:** AI-Powered Website Builder with Live Preview, Editing, and Publishing

---

## Project Overview

WeVibeCode AI is a Next.js application that allows users to generate websites using AI, preview them in real-time, edit text and colors, and publish to custom subdomains or domains.

### Core Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS
- **AI:** Claude API (for website generation)
- **Deployment:** Vercel

---

## Feature Status

### ✅ Phase 1: Core Website Generation (COMPLETE)
- [x] AI prompt input interface
- [x] Claude API integration for HTML/CSS/JS generation
- [x] Database storage of generated sites
- [x] User authentication and profiles
- [x] Credit system for generation limits

**Key Files:**
- `app/page.tsx` - Main generation interface
- `lib/analytics.ts` - Tracking and logging
- Database table: `previews` (stores generated HTML)

---

### ✅ Phase 2: Live Preview (COMPLETE)
- [x] IFrame-based preview system
- [x] Responsive viewport modes (Desktop/Tablet/Mobile)
- [x] Fullscreen mode
- [x] Refresh functionality
- [x] Performance optimizations (lazy loading, caching)
- [x] Loading skeletons

**Key Files:**
- `components/Preview.tsx` (main preview component)
- `components/LoadingSkeleton.tsx`
- `app/preview/[id]/page.tsx`

---

### ✅ Phase 3: Publishing System (COMPLETE)
- [x] Subdomain publishing (slug.wevibecode.ai)
- [x] Custom domain support
- [x] DNS verification for custom domains
- [x] Public routes for published sites
- [x] 404 handling for non-existent sites
- [x] Success modal with copy-to-clipboard
- [x] Persistent "View Live" button
- [x] Reset published sites endpoint

**Key Files:**
- `components/PublishModal.tsx` - Publishing interface
- `components/PublishSuccessModal.tsx` - Success feedback
- `app/api/publish-site/route.ts` - Publishing API
- `app/api/verify-domain/route.ts` - Domain verification
- `app/api/reset-published/route.ts` - Reset endpoint
- `app/s/[slug]/page.tsx` - Public site route
- `lib/publish.ts` - Publishing utilities

**Database Schema:**
```sql
previews table:
- slug (unique subdomain identifier)
- custom_domain (optional custom domain)
- published_url (full URL where site is live)
- is_published (boolean flag)
```

---

### ✅ Phase 4: Text Editing (COMPLETE - WORKING PERFECTLY)
- [x] Extract all editable text elements (h1-h6, p, button, a, span, li)
- [x] Modal interface for editing text
- [x] Apply button with confirmation
- [x] Save changes to database
- [x] Auto-refresh element list after edits
- [x] Works for all elements, not just first few
- [x] Reliable selector targeting

**Key Files:**
- `components/SiteEditor.tsx` - Main editor component
- `lib/publish.ts::extractEditableElements()` (lines 174-229) ✅ WORKING
- `lib/publish.ts::applyTextEdit()` (lines 231-272) ✅ WORKING

**How It Works:**
1. Parse HTML with DOMParser
2. Find all text elements
3. Create unique selectors (e.g., `div.hero > h1:nth-of-type(1)`)
4. User clicks element → modal opens
5. User edits text → clicks Apply
6. Find element by selector, replace textContent
7. Re-extract elements to keep list current
8. Save to database

**Success Metrics:**
- ✅ All text elements are editable
- ✅ Multiple elements can be edited in sequence
- ✅ Changes persist after save
- ✅ No conflicts or overwrites

---

### 🔴 Phase 5: Color Editing (IN PROGRESS - PARTIALLY WORKING)

#### What Works ✅
- [x] Color palette extraction
- [x] Friendly color names ("Primary Color", "Secondary Color", etc.)
- [x] Color picker UI (ChromePicker)
- [x] Apply and Cancel buttons
- [x] Modal interactions

#### What's Broken ❌
- [ ] Actual color replacement in HTML
- [ ] Preview update after color change
- [ ] Persistence of color changes

**Key Files:**
- `components/SiteEditor.tsx` - Editor UI (lines 68-85)
- `lib/publish.ts::extractColorPalette()` (lines 70-172) ✅ WORKING
- `lib/publish.ts::applyColorEdit()` (lines 274-361) ❌ BROKEN

**Current Issue:**
When user changes color:
1. ✅ Color picker opens
2. ✅ User selects new shade
3. ✅ Clicks Apply → Clicks Save
4. ❌ Color doesn't actually change

**Root Cause:**
- AI-generated HTML often doesn't use CSS variables
- Direct color values (like `background-color: #4F46E5;`) have no unique identifiers
- Regex replacement logic is failing to find/replace the old color value

**See:** `COLOR-EDITING-ISSUE.md` for detailed troubleshooting

---

### 📋 Phase 6: Future Features (NOT STARTED)

#### A. Advanced Editing
- [ ] Image upload and replacement
- [ ] Font selection
- [ ] Layout adjustments
- [ ] Add/remove sections
- [ ] Undo/Redo functionality

#### B. Templates
- [ ] Pre-built templates library
- [ ] Template categories (landing page, portfolio, blog, etc.)
- [ ] Template preview before generation
- [ ] Save custom templates

#### C. Analytics
- [ ] Page view tracking for published sites
- [ ] Traffic analytics dashboard
- [ ] Referrer tracking
- [ ] Geographic data

#### D. Collaboration
- [ ] Share preview links
- [ ] Comments on previews
- [ ] Version history
- [ ] Team workspaces

#### E. Export/Import
- [ ] Download as ZIP
- [ ] Export to GitHub
- [ ] Import existing HTML
- [ ] Export to other platforms

#### F. SEO Tools
- [ ] Meta tags editor
- [ ] Sitemap generation
- [ ] robots.txt configuration
- [ ] OpenGraph preview

---

## File Structure

```
wevibecode-ai/
├── app/
│   ├── api/
│   │   ├── publish-site/route.ts        # Publishing API
│   │   ├── verify-domain/route.ts       # Domain verification
│   │   ├── reset-published/route.ts     # Reset published sites
│   │   └── public-preview/[slug]/route.ts # API route for previews
│   ├── s/[slug]/
│   │   ├── page.tsx                     # Public published sites
│   │   └── not-found.tsx                # 404 page
│   ├── preview/[id]/page.tsx            # Preview page
│   └── page.tsx                         # Main generation page
├── components/
│   ├── Preview.tsx                      # Preview component ✅
│   ├── SiteEditor.tsx                   # Edit text/colors
│   ├── PublishModal.tsx                 # Publishing UI
│   ├── PublishSuccessModal.tsx          # Success feedback
│   └── LoadingSkeleton.tsx              # Loading states
├── lib/
│   ├── publish.ts                       # Core editing logic ⚠️
│   │   ├── extractColorPalette()        # ✅ Working
│   │   ├── extractEditableElements()    # ✅ Working
│   │   ├── applyTextEdit()              # ✅ Working
│   │   └── applyColorEdit()             # ❌ Broken
│   └── analytics.ts                     # Tracking
├── types/
│   └── publish.ts                       # TypeScript types
└── Documentation/
    ├── COLOR-EDITING-ISSUE.md           # ⚠️ READ THIS
    ├── PROJECT-ROADMAP.md               # This file
    ├── LATEST-FIXES-SUMMARY.md          # Recent fixes
    ├── FIXES-SUMMARY.md                 # All fixes
    └── SESSION-SUMMARY-*.md             # Session notes
```

---

## Development Workflow

### Starting a New Session
1. Read `COLOR-EDITING-ISSUE.md` for current problem
2. Read `PROJECT-ROADMAP.md` (this file) for context
3. Check git status for uncommitted changes
4. Review relevant files mentioned above

### Making Changes
1. Update code
2. Test in browser (localhost:3000)
3. Check console for errors
4. Verify database changes if applicable
5. Update documentation if needed

### Testing Checklist
- [ ] Text editing still works
- [ ] Preview loads correctly
- [ ] Publishing works
- [ ] No console errors
- [ ] Database writes succeed
- [ ] UI is responsive

---

## Database Schema

### Main Tables

**profiles**
```sql
- id (UUID, primary key)
- email (text)
- credits_remaining (integer)
- subscription_tier (text) -- 'free' or 'pro'
- created_at (timestamp)
```

**previews**
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key to profiles)
- title (text)
- html_content (text) -- Full HTML document
- css_content (text) -- Separate CSS (if not inlined)
- js_content (text) -- Separate JS (if not inlined)
- slug (text, unique) -- Subdomain identifier
- custom_domain (text) -- Optional custom domain
- published_url (text) -- Full published URL
- is_published (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

**credits_log**
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key to profiles)
- credits_used (integer)
- action (text) -- 'generate_site', 'publish_site', etc.
- details (jsonb)
- created_at (timestamp)
```

---

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_BASE_URL=http://localhost:3000 # or production URL
```

---

## Known Issues

### Critical 🔴
1. **Color editing doesn't work** - See COLOR-EDITING-ISSUE.md
   - Impact: Users can't change colors
   - Workaround: None currently
   - Priority: HIGH

### Minor 🟡
1. **No undo/redo** - Once edited, can't undo
   - Impact: Users must be careful with edits
   - Workaround: Refresh page to reset to saved version
   - Priority: MEDIUM

2. **No real-time preview** - Must click Save to see changes
   - Impact: Slower editing workflow
   - Workaround: None
   - Priority: LOW

---

## Performance Metrics

### Current Performance
- **Generation time:** 10-30 seconds (depends on Claude API)
- **Preview load time:** < 1 second
- **Edit operations:** < 500ms
- **Save operations:** 1-2 seconds

### Optimization Opportunities
- [ ] Cache generated HTML in localStorage
- [ ] Debounce edit operations
- [ ] Lazy load color picker
- [ ] Use Web Workers for HTML parsing
- [ ] Implement preview thumbnails

---

## Next Steps (Priority Order)

### Immediate (This Session)
1. 🔴 **Fix color editing** (see COLOR-EDITING-ISSUE.md)
   - Follow debugging steps
   - Try Solution D or Solution B
   - Test thoroughly

### Short Term (Next 1-2 Sessions)
2. 🟡 **Add image upload capability**
   - Allow users to replace images in generated sites
   - Store in Supabase Storage
   - Update HTML with new image URLs

3. 🟡 **Template library**
   - Create 5-10 pre-built templates
   - Allow users to start from template
   - Faster than AI generation

### Medium Term (Next Week)
4. 🟢 **Version history**
   - Save snapshots of edits
   - Allow rollback to previous versions
   - Show diff between versions

5. 🟢 **Export to GitHub**
   - One-click export to GitHub repo
   - Automatic deployment to Vercel/Netlify
   - Keep sites in sync

### Long Term (Next Month)
6. 🔵 **Advanced layout editor**
   - Drag-and-drop sections
   - Visual layout builder
   - Component library

7. 🔵 **Analytics dashboard**
   - Track page views
   - See traffic sources
   - User behavior tracking

---

## Success Criteria

### MVP (Minimum Viable Product) ✅
- [x] Users can generate websites with AI
- [x] Users can preview generated sites
- [x] Users can publish to subdomain
- [x] Users can edit text ✅
- [ ] Users can edit colors ❌ (BLOCKING)

### V1.0 (First Public Release)
- [ ] Fix color editing
- [ ] Add image upload
- [ ] Create 10 templates
- [ ] Analytics dashboard
- [ ] Export to GitHub

### V2.0 (Enhanced Features)
- [ ] Team collaboration
- [ ] Advanced layout editor
- [ ] SEO tools
- [ ] Custom code injection
- [ ] A/B testing

---

## Resources & Documentation

### External Documentation
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Docs](https://supabase.com/docs)
- [Claude API Docs](https://docs.anthropic.com)
- [react-color Docs](https://casesandberg.github.io/react-color/)

### Internal Documentation
- `COLOR-EDITING-ISSUE.md` - Current blocker
- `LATEST-FIXES-SUMMARY.md` - Recent changes
- `FIXES-SUMMARY.md` - All fixes applied
- `SESSION-SUMMARY-*.md` - Session notes

### Code Comments
Most functions in `lib/publish.ts` have detailed JSDoc comments explaining:
- What the function does
- What parameters it takes
- What it returns
- Known issues or limitations

---

## Team Notes

### For Future AI Assistants
- **Read COLOR-EDITING-ISSUE.md first**
- Don't break text editing (it works perfectly)
- Test changes in browser before committing
- Update documentation after significant changes
- Ask user to check console for errors

### For Human Developer
- Browser console (F12) has debug logs
- Check Network tab for API failures
- Database changes are in Supabase dashboard
- Vercel deployment is automatic on git push

---

## Version History

### Current Version: 0.9.0 (Almost MVP)
- ✅ All features except color editing
- ✅ Text editing works perfectly
- ❌ Color editing needs fix

### Previous Versions
- 0.8.0 - Added publishing system
- 0.7.0 - Added text editing
- 0.6.0 - Added live preview
- 0.5.0 - Basic generation working

---

**Remember:** The goal is to make website creation accessible to everyone. Keep it simple, keep it working, and improve incrementally. 🚀

**Current blocker:** Color editing - see COLOR-EDITING-ISSUE.md for details.
