# WeVibeCode.ai - Custom Implementation Package

**Created:** January 9, 2026  
**Version:** 1.0 - Custom for Your Project  
**Phases:** 1-2 (Core Fixes + Language Persistence)

---

## 📦 Package Contents

This is a **customized implementation package** built specifically for your WeVibeCode.ai project structure.

### What's Included:

```
wevibecode-custom-implementation/
│
├── 📖 docs/
│   ├── CUSTOM-QUICKSTART.md          # Your 10-minute setup guide
│   └── YOUR-LAYOUT-MODIFICATION.md    # How to update app/layout.tsx
│
├── 🔧 phase1/                         # Phase 1: Core Fixes
│   ├── useAuth.ts                     # Auth hook
│   ├── Header.tsx                     # Header with login buttons
│   ├── LanguageSwitcher.tsx           # Language dropdown
│   ├── signup-page.tsx                # Fixed signup form
│   ├── i18n.config.ts                 # i18n with German locale
│   ├── en-common.json                 # English translations
│   └── de-common.json                 # German translations
│
├── 🌍 phase2/                         # Phase 2: Language Persistence
│   ├── LanguageSwitcher-persistent.tsx # Enhanced switcher
│   └── middleware.ts                   # Locale detection
│
├── 🗄️ sql/                            # Database migrations
│   ├── 01-setup-profiles.sql          # Create profiles + trigger
│   └── 02-add-language-column.sql     # Add language preference
│
└── ⚡ scripts/                        # PowerShell automation
    ├── install-phase1-custom.ps1      # Phase 1 installer
    └── install-phase2-custom.ps1      # Phase 2 installer
```

---

## 🎯 Quick Start

### Prerequisites
- ✅ Node.js 18+ installed
- ✅ PowerShell available
- ✅ Supabase project access
- ✅ Project cloned locally

### Installation (10 Minutes)

#### 1. Extract Package (30 seconds)
Extract this folder to your project root:
```
C:\your\project\
├── app/
├── components/
├── wevibecode-custom-implementation/  ← HERE
└── package.json
```

#### 2. Run Phase 1 (3 minutes)
```powershell
.\wevibecode-custom-implementation\scripts\install-phase1-custom.ps1
```

#### 3. Update app/layout.tsx (2 minutes)
**MANUAL STEP - See `docs/YOUR-LAYOUT-MODIFICATION.md`**

Add these 2 lines to your existing `app/layout.tsx`:
```typescript
import Header from '@/components/Header';  // At the top

// In body:
<Header />  {/* First thing in body */}
```

#### 4. Run SQL Migration 1 (2 minutes)
Supabase Dashboard → SQL Editor → Run:
```
sql/01-setup-profiles.sql
```

#### 5. Test Phase 1 (3 minutes)
```powershell
npm run dev
```

Verify:
- [ ] Header appears
- [ ] Login/Signup buttons work
- [ ] Visit `/de` - German works
- [ ] Create account - profile created in Supabase

#### 6. Run Phase 2 (1 minute)
```powershell
.\wevibecode-custom-implementation\scripts\install-phase2-custom.ps1
```

#### 7. Run SQL Migration 2 (1 minute)
Supabase Dashboard → SQL Editor → Run:
```
sql/02-add-language-column.sql
```

#### 8. Test Phase 2 (2 minutes)
```powershell
npm run dev
```

Verify:
- [ ] Language persists on refresh (cookie)
- [ ] Language saves to database (logged-in users)
- [ ] Visit `/` redirects to preferred language

#### 9. Deploy (2 minutes)
```powershell
git add .
git commit -m "feat: Phase 1 & 2 implementation"
git push origin main
```

---

## 📂 File Destinations

Where each file goes in YOUR project:

| Source File | Your Destination | Action |
|-------------|------------------|--------|
| `phase1/useAuth.ts` | `lib/hooks/useAuth.ts` | Replace |
| `phase1/Header.tsx` | `components/Header.tsx` | Replace |
| `phase1/LanguageSwitcher.tsx` | `components/LanguageSwitcher.tsx` | Replace |
| `phase1/signup-page.tsx` | `app/[locale]/auth/signup/page.tsx` | Replace |
| `phase1/i18n.config.ts` | `i18n.config.ts` | Replace |
| `phase1/en-common.json` | `public/locales/en/common.json` | Merge |
| `phase1/de-common.json` | `public/locales/de/common.json` | Replace |
| `phase2/LanguageSwitcher-persistent.tsx` | `components/LanguageSwitcher.tsx` | Replace |
| `phase2/middleware.ts` | `middleware.ts` | Create/Replace |

**Note:** Scripts create `.backup` files before replacing!

---

## ✨ What Gets Fixed

### Phase 1: Core Fixes
**Problems Fixed:**
- ❌ Login button missing on homepage
- ❌ New user registration broken
- ❌ German (DE) translation not working

**After Phase 1:**
- ✅ Login/Signup buttons always visible
- ✅ New users get profile with 10 credits
- ✅ German fully translated
- ✅ Language switcher with 5 languages

### Phase 2: Language Persistence
**Problems Fixed:**
- ❌ Language resets on page refresh
- ❌ No user preference saved

**After Phase 2:**
- ✅ Guest preferences in cookie (365 days)
- ✅ User preferences in database
- ✅ Auto-redirect to preferred language
- ✅ Priority: DB → Cookie → Browser

---

## 🔧 What the Scripts Do

### install-phase1-custom.ps1

**Actions:**
1. Installs `js-cookie` and `@types/js-cookie`
2. Backs up existing files (`.backup` extension)
3. Copies Phase 1 files to correct locations
4. Merges new translation keys into existing files
5. Updates all language files (EN, IT, PL, ES, DE)

**Safe:** Creates backups before replacing any files

### install-phase2-custom.ps1

**Actions:**
1. Verifies `js-cookie` is installed
2. Backs up files (`.phase2.backup` extension)
3. Updates LanguageSwitcher with persistence
4. Creates/updates middleware.ts

**Safe:** Creates backups before modifying

---

## 🗄️ Database Changes

### SQL Script 1: Setup Profiles
**File:** `sql/01-setup-profiles.sql`

Creates:
- `profiles` table (id, email, credits, preferred_language)
- RLS policies (users can read/update own profile)
- Trigger (auto-creates profile on signup with 10 credits)

### SQL Script 2: Add Language Column
**File:** `sql/02-add-language-column.sql`

Adds:
- `preferred_language` column (if not exists)
- Sets default to 'en' for existing users
- Creates index for performance

---

## 📦 NPM Dependencies

**Added by scripts:**
```json
{
  "dependencies": {
    "js-cookie": "^3.0.5"
  },
  "devDependencies": {
    "@types/js-cookie": "^3.0.6"
  }
}
```

**Already required (assumed installed):**
- `@supabase/auth-helpers-nextjs`
- `@supabase/supabase-js`
- `next-intl`
- `next` 14+

---

## 🔄 Rollback Instructions

### Rollback Phase 1
```powershell
Copy-Item lib/hooks/useAuth.ts.backup lib/hooks/useAuth.ts -Force
Copy-Item components/Header.tsx.backup components/Header.tsx -Force
Copy-Item components/LanguageSwitcher.tsx.backup components/LanguageSwitcher.tsx -Force
Copy-Item app/[locale]/auth/signup/page.tsx.backup app/[locale]/auth/signup/page.tsx -Force
Copy-Item i18n.config.ts.backup i18n.config.ts -Force
```

### Rollback Phase 2
```powershell
Copy-Item components/LanguageSwitcher.tsx.phase2.backup components/LanguageSwitcher.tsx -Force
Copy-Item middleware.ts.phase2.backup middleware.ts -Force
```

### Rollback Database
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP TABLE IF EXISTS profiles;
```

---

## 🧪 Testing Checklist

### Phase 1 Tests
- [ ] Homepage shows Login & Signup buttons (logged out)
- [ ] Create new account → check Supabase users table
- [ ] Check profiles table → new profile with 10 credits
- [ ] Visit `/de` → all text in German
- [ ] Language switcher shows all 5 languages
- [ ] No console errors

### Phase 2 Tests
- [ ] As guest: Switch to Italian → refresh → still Italian
- [ ] DevTools → Cookies → `preferred_locale=it`
- [ ] As user: Switch to Spanish → check Supabase → `preferred_language='es'`
- [ ] Logout & login → automatically Spanish
- [ ] Visit `/` → redirects to `/es/`
- [ ] Middleware runs without errors

---

## 🐛 Troubleshooting

### "Cannot find module @/components/Header"

**Check tsconfig.json:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Scripts won't run

**Enable PowerShell scripts:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### js-cookie not saving

**Reinstall:**
```powershell
npm uninstall js-cookie @types/js-cookie
npm install js-cookie @types/js-cookie
```

### Middleware not running

- Ensure `middleware.ts` is in project root (not `/app`)
- Restart dev server
- Check Next.js version (must be 13+)

### SQL errors

- Use SQL Editor, not Table Editor
- Run scripts one at a time
- Scripts are idempotent (safe to re-run)

---

## 📊 Success Metrics

Installation successful when:
- ✅ Zero console errors
- ✅ New users can register and see dashboard
- ✅ All 5 languages load without fallbacks
- ✅ Language preference persists across sessions
- ✅ Middleware redirects work correctly
- ✅ Database has profiles with credits and language

---

## 📚 Documentation Files

- **CUSTOM-QUICKSTART.md** - Your personalized setup guide
- **YOUR-LAYOUT-MODIFICATION.md** - How to update app/layout.tsx
- **README.md** - This file

---

## 🎉 After Installation

You'll have:
- ✨ Fixed authentication flow
- 🌍 Complete multilingual support (5 languages)
- 💾 Persistent language preferences
- 🗄️ Proper database structure
- 📱 Mobile-responsive header
- 🔐 Secure RLS policies

---

## 📞 Support

For issues:
1. Check `docs/CUSTOM-QUICKSTART.md`
2. Check `docs/YOUR-LAYOUT-MODIFICATION.md`
3. Review browser console for errors
4. Check Supabase logs
5. Check Vercel deployment logs

---

## 🚀 Next Steps

After Phase 1 & 2 work perfectly:

**Future phases** (coming in next updates):
- Phase 3: AI Image Generation with DALL-E 3
- Phase 4: Site Preview with responsive views
- Phase 5: Supabase error translation
- Phase 6: Portfolio gallery

---

## 📝 Version History

**v1.0 - Custom** (January 9, 2026)
- Customized for your exact project structure
- Phase 1: Core fixes
- Phase 2: Language persistence
- Custom PowerShell scripts
- Comprehensive documentation

---

**Ready to install? Start with `docs/CUSTOM-QUICKSTART.md`!** 🚀
