# WeVibeCode.ai Implementation Package - Manifest

Version: 1.0.0
Created: January 9, 2026
Phases Included: 1-2 (Core Fixes + Language Persistence)

## 📦 Package Structure

```
wevibecode-implementation/
│
├── README.md                    # Complete documentation
├── QUICKSTART.md               # 15-minute setup guide
├── MANIFEST.md                 # This file
│
├── phase1/                     # Phase 1: Core Fixes
│   ├── useAuth.ts             # Authentication hook
│   ├── Header.tsx             # Header with login buttons
│   ├── signup-page.tsx        # Fixed signup page
│   ├── i18n.config.ts         # i18n config with German
│   ├── LanguageSwitcher.tsx   # Basic language switcher
│   ├── en-common.json         # English translations
│   └── de-common.json         # German translations
│
├── phase2/                     # Phase 2: Language Persistence
│   ├── LanguageSwitcher-persistent.tsx  # Enhanced switcher
│   └── middleware.ts          # Middleware with locale detection
│
├── phase3/                     # Phase 3: AI Images (coming soon)
│   └── (empty)
│
├── phase4/                     # Phase 4: Site Preview (coming soon)
│   └── (empty)
│
├── phase5/                     # Phase 5: Translations (coming soon)
│   └── (empty)
│
├── phase6/                     # Phase 6: Portfolio (coming soon)
│   └── (empty)
│
├── sql/                        # Database migrations
│   ├── 01-setup-profiles.sql  # Create profiles table + trigger
│   └── 02-add-language-column.sql  # Add preferred_language
│
└── scripts/                    # PowerShell automation
    ├── install-phase1.ps1     # Install Phase 1
    ├── install-phase2.ps1     # Install Phase 2
    └── install-all.ps1        # Install both phases
```

## 🎯 Implementation Timeline

### ✅ Phase 1: Core Fixes (1-2 days)
**Status:** Ready to install
**Files:** 7 code files + 1 SQL script
**Time to install:** ~10 minutes
**Time to test:** ~30 minutes

Fixes:
- Login button missing on homepage
- New user registration broken  
- German (DE) translation not working

### ✅ Phase 2: Language Persistence (2-3 days)
**Status:** Ready to install
**Files:** 2 code files + 1 SQL script
**Time to install:** ~5 minutes
**Time to test:** ~20 minutes

Adds:
- Cookie-based persistence for guests
- Database persistence for logged-in users
- Auto-redirect to preferred language
- Priority-based locale detection

### 🔜 Phase 3: AI Images (3-5 days)
**Status:** Coming in next update
**Features:**
- DALL-E 3 integration
- Image generation API
- Supabase Storage upload
- Credit deduction per image
- UI for image selection

### 🔜 Phase 4: Site Preview (2-3 days)
**Status:** Coming in next update
**Features:**
- Responsive preview component
- Desktop/tablet/mobile views
- Sandboxed iframe
- Image gallery

### 🔜 Phase 5: Supabase Translation (2-3 days)
**Status:** Coming in next update
**Features:**
- Error message mapping
- Localized Supabase errors
- Email template translation

### 🔜 Phase 6: Portfolio Gallery (1 week)
**Status:** Coming in next update
**Features:**
- 8+ example sites
- Category filtering
- Template selection
- Multilingual support

## 📋 File Mapping

Where each file goes in your project:

| Source File | Destination | Purpose |
|------------|-------------|---------|
| `phase1/useAuth.ts` | `lib/hooks/useAuth.ts` | Auth state management |
| `phase1/Header.tsx` | `components/Header.tsx` | Navigation with login buttons |
| `phase1/signup-page.tsx` | `app/[locale]/auth/signup/page.tsx` | Fixed signup form |
| `phase1/i18n.config.ts` | `i18n.config.ts` | Add German to locales |
| `phase1/LanguageSwitcher.tsx` | `components/LanguageSwitcher.tsx` | Language dropdown |
| `phase1/en-common.json` | `public/locales/en/common.json` | Merge into existing |
| `phase1/de-common.json` | `public/locales/de/common.json` | Replace or merge |
| `phase2/LanguageSwitcher-persistent.tsx` | `components/LanguageSwitcher.tsx` | Replace Phase 1 version |
| `phase2/middleware.ts` | `middleware.ts` | Replace existing |

## 🗄️ Database Changes

### Migration 1: `01-setup-profiles.sql`
- Creates `profiles` table
- Adds columns: id, email, credits, preferred_language
- Enables RLS policies
- Creates auto-profile trigger on user signup

### Migration 2: `02-add-language-column.sql`
- Adds `preferred_language` column (idempotent)
- Sets default to 'en' for existing users
- Creates index for performance

## 📦 NPM Dependencies Added

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

Existing dependencies required:
- `@supabase/auth-helpers-nextjs`
- `@supabase/supabase-js`
- `next-intl`
- `next` (14+)

## ✅ Pre-Installation Checklist

Before running scripts, ensure:

- [ ] Node.js 18+ installed
- [ ] PowerShell available
- [ ] Git repository cloned locally
- [ ] `package.json` exists in project root
- [ ] Supabase project created and accessible
- [ ] Vercel project connected
- [ ] Environment variables configured (.env.local)

## 🔐 Required Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

For Phase 3 (AI Images), you'll also need:
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## 🧪 Testing Matrix

After installation, test:

| Feature | Test Case | Expected Result |
|---------|-----------|-----------------|
| Login Button | Visit homepage logged out | Buttons visible |
| Signup | Create new account | User + profile created |
| German | Visit `/de` | All text in German |
| Language Switch | Select Italian | URL changes to `/it` |
| Cookie Persist | Refresh as guest | Language unchanged |
| DB Persist | Switch as user | Saved to profiles table |
| Auto-Redirect | Visit `/` | Redirects to preferred locale |

## 📊 Success Metrics

Installation is successful when:

1. **Zero console errors** on homepage
2. **New users can register** and see dashboard
3. **All 5 languages load** without fallbacks
4. **Language preference persists** across sessions
5. **Middleware redirects** work correctly
6. **Database has profiles** with credits and language

## 🚨 Rollback Plan

If something goes wrong:

1. **Restore from backup:**
   ```powershell
   git checkout HEAD -- components/LanguageSwitcher.tsx
   git checkout HEAD -- middleware.ts
   ```

2. **Revert database:**
   ```sql
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   DROP FUNCTION IF EXISTS handle_new_user();
   ```

3. **Reinstall dependencies:**
   ```powershell
   npm install
   ```

## 📞 Support Contacts

For issues:
1. Check README.md troubleshooting section
2. Review QUICKSTART.md for common problems
3. Check browser DevTools console
4. Check Supabase logs
5. Check Vercel deployment logs

## 📝 Version History

### v1.0.0 (January 9, 2026)
- Initial release
- Phase 1: Core Fixes
- Phase 2: Language Persistence
- PowerShell automation scripts
- Complete documentation

### Planned Updates

**v1.1.0** - Phase 3: AI Image Generation
**v1.2.0** - Phase 4: Site Preview
**v1.3.0** - Phase 5: Supabase Translation
**v1.4.0** - Phase 6: Portfolio Gallery

---

## 🎉 Ready to Install?

1. Read QUICKSTART.md for fastest setup (15 minutes)
2. Read README.md for detailed instructions
3. Run scripts from your project root
4. Test thoroughly before deploying
5. Commit and push to deploy

Good luck! 🚀
