# 🚀 Quick Start Guide - WeVibeCode.ai Implementation

## ⏱️ 15-Minute Setup (Phase 1 & 2)

This guide will get you up and running with the core fixes and language persistence in about 15 minutes.

---

## Step 1: Extract the Package (1 min)

1. Download/receive the `wevibecode-implementation.zip` file
2. Extract it to your project root directory
3. You should see this structure:

```
your-project/
├── app/
├── components/
├── public/
├── package.json
└── wevibecode-implementation/  ← New folder
    ├── phase1/
    ├── phase2/
    ├── sql/
    ├── scripts/
    └── README.md
```

---

## Step 2: Run Installation Script (3 min)

Open PowerShell in your project root and run:

```powershell
# Option A: Install Phase 1 & 2 together (recommended)
.\wevibecode-implementation\scripts\install-all.ps1

# Option B: Install phases individually
.\wevibecode-implementation\scripts\install-phase1.ps1
# Test, then:
.\wevibecode-implementation\scripts\install-phase2.ps1
```

The script will:
- ✅ Create necessary directories
- ✅ Install npm packages (js-cookie)
- ✅ Copy all code files to correct locations
- ✅ Merge translation files

---

## Step 3: Update Layout File (2 min)

**Manually edit:** `app/[locale]/layout.tsx`

Add the Header component import and usage:

```tsx
import Header from '@/components/Header';
import { NextIntlClientProvider } from 'next-intl';

export default function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={params.locale}>
      <body>
        <Header />  {/* ← ADD THIS LINE */}
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
```

---

## Step 4: Run Database Migrations (3 min)

### Migration 1: Setup Profiles Table

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy contents of: `wevibecode-implementation/sql/01-setup-profiles.sql`
5. Paste and click **Run**
6. Should see: "Success. No rows returned"

### Migration 2: Add Language Column

1. Still in SQL Editor
2. Click **New Query**
3. Copy contents of: `wevibecode-implementation/sql/02-add-language-column.sql`
4. Paste and click **Run**
5. Should see results showing existing profiles

---

## Step 5: Test Locally (5 min)

```powershell
npm run dev
```

Visit: `http://localhost:3000`

### ✅ Phase 1 Checklist:

- [ ] **Homepage:** Login and Signup buttons visible (when not logged in)
- [ ] **Signup:** Create new account → check Supabase users table → new user exists
- [ ] **Profile:** Check Supabase profiles table → profile created with 10 credits
- [ ] **German:** Visit `/de` → all text in German
- [ ] **Language Switcher:** Dropdown shows 5 languages

### ✅ Phase 2 Checklist:

- [ ] **As Guest:** Switch to Italian → refresh page → still Italian
- [ ] **As Guest:** Check DevTools → Application → Cookies → `preferred_locale` exists
- [ ] **As User:** Login → switch to Spanish → check Supabase profiles → `preferred_language='es'`
- [ ] **Auto-Redirect:** Clear cookies, visit `/` → redirects to `/en/`
- [ ] **Persistence:** Logout, login → automatically loads saved language

---

## Step 6: Deploy (1 min)

```powershell
git add .
git commit -m "feat: Implement Phase 1 & 2 - Core fixes and language persistence"
git push origin main
```

Then:
- Open **Vercel Dashboard**
- Manually trigger **Redeploy** (since auto-deploy is inconsistent)
- Wait ~2 minutes for deployment
- Test on live site

---

## 🎯 Success Metrics

After deployment, you should have:

✅ **Working login/signup flow**
- Users can create accounts
- Profiles auto-created with 10 credits
- No console errors

✅ **Complete multilingual support**
- All 5 languages work (EN, IT, PL, ES, DE)
- Language switcher functional
- German fully translated

✅ **Language persistence**
- Guest preferences saved in cookies
- User preferences saved in database
- Auto-redirect to preferred language

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module @/lib/hooks/useAuth"

**Fix:**
```powershell
# Make sure the file was copied
ls lib/hooks/useAuth.ts

# If not, copy manually:
Copy-Item wevibecode-implementation/phase1/useAuth.ts lib/hooks/useAuth.ts
```

### Issue: Language switcher doesn't save to database

**Fix:**
```powershell
# Check if js-cookie is installed
npm list js-cookie

# If not:
npm install js-cookie @types/js-cookie
```

### Issue: SQL script fails in Supabase

**Fix:**
- Make sure you're in **SQL Editor**, not Table Editor
- Run scripts one at a time
- Check if tables already exist (scripts use `IF NOT EXISTS`)

### Issue: Vercel deployment not updating

**Fix:**
1. Check GitHub Actions tab (workflow may have failed)
2. Manually redeploy in Vercel dashboard
3. Check deployment logs for errors

---

## 📚 What's Next?

After Phase 1 & 2 are working:

**Phase 3:** AI Image Generation with DALL-E 3 *(3-5 days)*
**Phase 4:** Site Preview with responsive views *(2-3 days)*
**Phase 5:** Supabase error translation *(2-3 days)*
**Phase 6:** Portfolio gallery *(1 week)*

Each phase builds on the previous ones. Make sure Phase 1 & 2 are stable before continuing.

---

## 💬 Need Help?

1. Check `README.md` for detailed troubleshooting
2. Review browser console for JavaScript errors
3. Check Supabase logs (Dashboard → Logs & Reports)
4. Check Vercel deployment logs

---

## 🎉 Congratulations!

You've successfully implemented the core improvements to WeVibeCode.ai!

Your site now has:
- ✨ Fixed authentication flow
- 🌍 Complete multilingual support (5 languages)
- 💾 Persistent language preferences
- 🗄️ Proper database structure with auto-created profiles

Enjoy building! 🚀
