# 🎯 YOUR CUSTOM IMPLEMENTATION GUIDE

## Based on Your Actual Project Structure

I've analyzed your project and created **custom installation scripts** specifically for your setup.

---

## 📁 Your Project Structure (Confirmed)

✅ **app/layout.tsx** - Root layout (exists)
✅ **components/Header.tsx** - Exists (will be replaced)
✅ **components/LanguageSwitcher.tsx** - Exists (will be replaced)
✅ **lib/hooks/useAuth.ts** - Exists (will be replaced)
✅ **app/[locale]/auth/signup/page.tsx** - Signup page (exists)
✅ **public/locales/{en,it,pl,es,de}/common.json** - Translation files (exist)

---

## 🚀 Installation Steps (10 Minutes)

### Step 1: Extract Package (30 seconds)

Extract `wevibecode-implementation.tar.gz` to your project root.

You should have:
```
C:\your\project\
├── app/
├── components/
├── wevibecode-implementation/  ← NEW
├── package.json
└── ...
```

### Step 2: Run Phase 1 Installation (3 minutes)

Open PowerShell in your project root:

```powershell
# Run the custom Phase 1 installer
.\wevibecode-implementation\scripts\install-phase1-custom.ps1
```

This will:
- ✅ Install `js-cookie` and `@types/js-cookie`
- ✅ Replace `lib/hooks/useAuth.ts` (backed up as `.backup`)
- ✅ Replace `components/Header.tsx` (backed up as `.backup`)
- ✅ Replace `components/LanguageSwitcher.tsx` (backed up as `.backup`)
- ✅ Replace `app/[locale]/auth/signup/page.tsx` (backed up as `.backup`)
- ✅ Update `i18n.config.ts` to include German
- ✅ Merge new translations into `public/locales/en/common.json`
- ✅ Update `public/locales/de/common.json` with German translations
- ✅ Add missing translation keys to IT, PL, ES files

### Step 3: Update app/layout.tsx MANUALLY (2 minutes)

**This is the ONLY manual step!**

Open `app/layout.tsx` and make these two changes:

**Add import at top:**
```typescript
import Header from '@/components/Header';
```

**Add component in body:**
```tsx
<body>
  <Header />  {/* ← Add this */}
  {children}
</body>
```

See `YOUR-LAYOUT-MODIFICATION.md` for detailed examples.

### Step 4: Run SQL Migration 1 (2 minutes)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy entire contents of: `wevibecode-implementation/sql/01-setup-profiles.sql`
4. Paste and click **Run**
5. Should see: "Success. No rows returned"

This creates:
- `profiles` table
- Trigger to auto-create profiles on signup
- RLS policies

### Step 5: Test Phase 1 (3 minutes)

```powershell
npm run dev
```

Visit `http://localhost:3000`

**Verify:**
- [ ] Header visible at top with "WeVibeCode.ai" logo
- [ ] Login and Signup buttons visible (if not logged in)
- [ ] Language switcher dropdown works
- [ ] Visit `/de` - all text in German
- [ ] Create new account - check Supabase profiles table - profile created with 10 credits

### Step 6: Run Phase 2 Installation (1 minute)

```powershell
.\wevibecode-implementation\scripts\install-phase2-custom.ps1
```

This will:
- ✅ Update `components/LanguageSwitcher.tsx` with persistence (backed up as `.phase2.backup`)
- ✅ Create/update `middleware.ts` (backed up as `.phase2.backup`)

### Step 7: Run SQL Migration 2 (1 minute)

1. Supabase Dashboard → SQL Editor → New Query
2. Copy contents of: `wevibecode-implementation/sql/02-add-language-column.sql`
3. Paste and Run

This adds `preferred_language` column to profiles.

### Step 8: Test Phase 2 (3 minutes)

```powershell
npm run dev
```

**Verify:**
- [ ] As guest: Switch to Italian → Refresh → Still Italian
- [ ] Check DevTools → Application → Cookies → `preferred_locale=it`
- [ ] As logged-in user: Switch to Spanish
- [ ] Check Supabase → profiles table → `preferred_language='es'`
- [ ] Logout and login → Automatically Spanish
- [ ] Visit `/` → Redirects to `/es/`

### Step 9: Deploy (2 minutes)

```powershell
git add .
git commit -m "feat: Phase 1 & 2 - Core fixes and language persistence"
git push origin main
```

Then in Vercel Dashboard: Manually trigger **Redeploy**

---

## 📋 What Each Script Does

### install-phase1-custom.ps1

**Installs:**
- npm packages (js-cookie)
- Updated useAuth hook
- Fixed Header component
- Enhanced LanguageSwitcher
- Fixed signup page
- i18n config with German
- Translation updates

**Creates backups with `.backup` extension**

### install-phase2-custom.ps1

**Updates:**
- LanguageSwitcher with cookie + database persistence
- middleware.ts with locale detection

**Creates backups with `.phase2.backup` extension**

---

## 🔄 Rollback Instructions

If something breaks:

```powershell
# Restore Phase 1 files
Copy-Item lib/hooks/useAuth.ts.backup lib/hooks/useAuth.ts -Force
Copy-Item components/Header.tsx.backup components/Header.tsx -Force
Copy-Item components/LanguageSwitcher.tsx.backup components/LanguageSwitcher.tsx -Force

# Restore Phase 2 files
Copy-Item components/LanguageSwitcher.tsx.phase2.backup components/LanguageSwitcher.tsx -Force
Copy-Item middleware.ts.phase2.backup middleware.ts -Force

# Restart dev server
npm run dev
```

---

## 🐛 Troubleshooting

### "Cannot find module @/components/Header"

**Solution:**
Check that `tsconfig.json` has this:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Language switcher doesn't save

**Solution:**
```powershell
# Verify js-cookie is installed
npm list js-cookie

# If not found:
npm install js-cookie @types/js-cookie
```

### Middleware not running

**Solution:**
- Ensure `middleware.ts` is in project root (not in `app/` or `src/`)
- Restart dev server after middleware changes
- Check Next.js version is 13+

### SQL fails in Supabase

**Solution:**
- Use SQL Editor, not Table Editor
- Run scripts one at a time
- Scripts are idempotent (safe to run multiple times)

---

## ✅ Success Checklist

After installation, you should have:

**Phase 1:**
- [x] Login/Signup buttons on homepage
- [x] New user signup creates profile with 10 credits
- [x] German language fully functional
- [x] All 5 languages working (EN, IT, PL, ES, DE)
- [x] Language switcher dropdown

**Phase 2:**
- [x] Guest language preference saved in cookie
- [x] Logged-in user preference saved in database
- [x] Auto-redirect to preferred language
- [x] Language persists across sessions

---

## 📞 Need Help?

1. Check `YOUR-LAYOUT-MODIFICATION.md` for layout file help
2. Check browser console for errors
3. Check Supabase logs
4. Check Vercel deployment logs

---

## 🎉 You're Done!

Your WeVibeCode.ai now has:
- ✨ Fixed authentication flow
- 🌍 Complete multilingual support
- 💾 Persistent language preferences
- 🗄️ Proper database structure

Time to test and deploy! 🚀
