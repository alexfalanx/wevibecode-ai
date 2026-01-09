# WeVibeCode.ai - Implementation Package

## 📦 Package Contents

This package contains all necessary files and scripts to implement the WeVibeCode.ai improvement plan in 6 phases.

### Directory Structure
```
wevibecode-implementation/
├── phase1/              # Core Fixes (Login, Signup, German)
├── phase2/              # Language Persistence
├── phase3/              # AI Image Generation (coming)
├── phase4/              # Site Preview (coming)
├── phase5/              # Supabase Translation (coming)
├── phase6/              # Portfolio Gallery (coming)
├── sql/                 # Database migration scripts
└── scripts/             # PowerShell automation scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PowerShell (Windows) or PowerShell Core (Mac/Linux)
- Git repository cloned locally
- Supabase project access
- Admin access to your Vercel deployment

### Installation Steps

#### Phase 1: Core Fixes (1-2 days)

**What it fixes:**
- ✅ Login button missing on homepage
- ✅ New user registration broken
- ✅ German (DE) translation not working

**Steps:**

1. **Extract this package to your project root:**
   ```powershell
   # Navigate to your project
   cd C:\path\to\wevibecode-ai
   
   # Extract the implementation package here
   # You should see a folder called "wevibecode-implementation"
   ```

2. **Run the Phase 1 installation script:**
   ```powershell
   .\wevibecode-implementation\scripts\install-phase1.ps1
   ```

3. **Update your layout file manually:**
   
   Edit `app/[locale]/layout.tsx`:
   ```tsx
   import Header from '@/components/Header';
   
   export default function RootLayout({ children, params }) {
     return (
       <html lang={params.locale}>
         <body>
           <Header />  {/* Add this line */}
           {children}
         </body>
       </html>
     );
   }
   ```

4. **Run the SQL migration in Supabase:**
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of `wevibecode-implementation/sql/01-setup-profiles.sql`
   - Paste and execute

5. **Test locally:**
   ```powershell
   npm run dev
   ```
   
   **Verify:**
   - [ ] Login button visible on homepage for non-logged-in users
   - [ ] New user signup creates profile with 10 credits
   - [ ] German language works (visit `/de`)
   - [ ] Language switcher shows all 5 languages

6. **Commit and deploy:**
   ```powershell
   git add .
   git commit -m "Phase 1: Fix login button, signup, and German translation"
   git push origin main
   ```
   
   Then manually trigger redeploy in Vercel dashboard if auto-deploy doesn't work.

---

#### Phase 2: Language Persistence (2-3 days)

**What it adds:**
- ✅ Language preference saved in cookie (guests)
- ✅ Language preference saved in database (logged-in users)
- ✅ Auto-redirect to preferred language on first visit
- ✅ Language persists across sessions

**Steps:**

1. **Run the Phase 2 installation script:**
   ```powershell
   .\wevibecode-implementation\scripts\install-phase2.ps1
   ```

2. **Run the SQL migration in Supabase:**
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of `wevibecode-implementation/sql/02-add-language-column.sql`
   - Paste and execute

3. **Test locally:**
   ```powershell
   npm run dev
   ```
   
   **Verify:**
   - [ ] As guest: Switch language, refresh page → language persists
   - [ ] As logged-in user: Switch language → check Supabase profiles table → preferred_language updated
   - [ ] Login → automatically redirects to saved language
   - [ ] First visit to `/` → redirects to `/en/` (or browser language)

4. **Commit and deploy:**
   ```powershell
   git add .
   git commit -m "Phase 2: Add language persistence with cookie and database"
   git push origin main
   ```

---

## 📝 Manual File Placement Guide

If the scripts don't work or you prefer manual installation:

### Phase 1 Files

1. **lib/hooks/useAuth.ts**
   - Copy from: `phase1/useAuth.ts`
   - Creates custom hook for authentication state

2. **components/Header.tsx**
   - Copy from: `phase1/Header.tsx`
   - Replace or create this file

3. **components/LanguageSwitcher.tsx**
   - Copy from: `phase1/LanguageSwitcher.tsx`
   - Creates language dropdown menu

4. **app/[locale]/auth/signup/page.tsx**
   - Copy from: `phase1/signup-page.tsx`
   - Replace existing signup page

5. **i18n.config.ts**
   - Copy from: `phase1/i18n.config.ts`
   - Add 'de' to locales array

6. **public/locales/en/common.json**
   - Merge from: `phase1/en-common.json`
   - Add new translation keys

7. **public/locales/de/common.json**
   - Copy from: `phase1/de-common.json`
   - Complete German translations

### Phase 2 Files

1. **components/LanguageSwitcher.tsx**
   - Copy from: `phase2/LanguageSwitcher-persistent.tsx`
   - Replace the Phase 1 version

2. **middleware.ts**
   - Copy from: `phase2/middleware.ts`
   - Replace existing middleware

---

## 🗄️ Database Migrations

### SQL Script 1: Setup Profiles Table
**File:** `sql/01-setup-profiles.sql`

Run this in Supabase SQL Editor to:
- Create profiles table with credits and language fields
- Enable Row Level Security (RLS)
- Create trigger to auto-create profile on user signup

### SQL Script 2: Add Language Column
**File:** `sql/02-add-language-column.sql`

Run this in Supabase SQL Editor to:
- Add preferred_language column (if not exists)
- Set default to 'en' for existing users
- Create index for performance

---

## 🧪 Testing Checklist

### Phase 1 Testing

**Login Button:**
- [ ] Visit homepage while logged out
- [ ] Login button is visible
- [ ] Signup button is visible
- [ ] Clicking login → navigates to `/[locale]/auth/login`
- [ ] Test in all 5 languages (en, it, pl, es, de)

**Signup:**
- [ ] Fill signup form with new email
- [ ] Submit form
- [ ] Check browser console for errors
- [ ] Check Supabase → Authentication → Users → new user exists
- [ ] Check Supabase → Table Editor → profiles → profile created with 10 credits
- [ ] User is redirected to dashboard (or sees confirmation message)

**German Translation:**
- [ ] Visit `/de` or `/de/dashboard`
- [ ] All text displays in German
- [ ] Language switcher shows "Deutsch"
- [ ] No English fallbacks

### Phase 2 Testing

**Cookie Persistence (Guest):**
- [ ] As guest, switch to Italian
- [ ] Refresh page → still Italian
- [ ] Close browser, reopen → still Italian
- [ ] Check browser DevTools → Application → Cookies → `preferred_locale` exists

**Database Persistence (Logged-in):**
- [ ] Login as user
- [ ] Switch to Spanish
- [ ] Check Supabase → profiles table → preferred_language = 'es'
- [ ] Logout and login again → automatically Spanish

**Auto-Redirect:**
- [ ] Clear cookies
- [ ] Visit root `/` → redirects to `/en/` (or browser language)
- [ ] Set cookie to 'it', visit `/` → redirects to `/it/`
- [ ] Login as user with preferred_language='de', visit `/` → redirects to `/de/`

---

## 🐛 Troubleshooting

### "Cannot find module" errors
```powershell
npm install
npm install @supabase/auth-helpers-nextjs @supabase/supabase-js
npm install js-cookie @types/js-cookie
```

### Middleware not working
- Ensure middleware.ts is in project root (not in app/ or src/)
- Check Next.js version (must be 13+)
- Restart dev server after middleware changes

### SQL errors in Supabase
- Make sure you're running scripts in SQL Editor, not in Table Editor
- Check if tables already exist (some commands use IF NOT EXISTS)
- Verify you have admin permissions

### Language not persisting
- Check browser console for errors
- Verify js-cookie is installed
- Check Supabase RLS policies allow updates
- Ensure middleware.ts is being executed

### Vercel deployment not updating
- Check GitHub → Actions tab for workflow status
- Manually trigger redeploy in Vercel dashboard
- Check Vercel deployment logs for errors

---

## 📞 Support

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Check Vercel deployment logs
3. Check Supabase logs (Logs & Reports)
4. Verify all files are in correct locations
5. Ensure all npm packages are installed

---

## 🎯 Next Phases (Coming Soon)

**Phase 3:** AI Image Generation with DALL-E 3
**Phase 4:** Site Preview with responsive views
**Phase 5:** Supabase error translation
**Phase 6:** Portfolio gallery with examples

---

## 📄 License

This implementation package is provided for WeVibeCode.ai project use.
