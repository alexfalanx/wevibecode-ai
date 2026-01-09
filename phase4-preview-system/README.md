# Phase 4: Live Preview System

## Overview

A complete live preview system that allows users to preview generated websites and apps in real-time with responsive device views (desktop, tablet, mobile).

---

## Features

✅ **Responsive Preview Controls**
- Desktop view (full width)
- Tablet view (768x1024)
- Mobile view (375x667)

✅ **Interactive Controls**
- Refresh preview
- Fullscreen mode
- Device size toggles

✅ **Secure Iframe Rendering**
- Sandboxed iframe for safety
- Content Security Policy
- Same-origin policy

✅ **Database Integration**
- Store HTML, CSS, JS content
- User-specific previews
- Row Level Security (RLS)

✅ **Preview Management**
- Create previews
- Update previews
- Delete previews
- List user previews

---

## Installation

### Prerequisites

✅ Database migration already completed (previews table created)

### Quick Install

```powershell
# Run installation script
PowerShell -ExecutionPolicy Bypass -File phase4-preview-system/scripts/install-phase4.ps1
```

### Manual Install

If script fails, copy these files manually:

```powershell
# 1. Preview component
Copy-Item phase4-preview-system/components/Preview.tsx components/Preview.tsx -Force

# 2. API route
New-Item -ItemType Directory -Path "app/api/preview/[id]" -Force
Copy-Item "phase4-preview-system/app/api/preview/[id]/route.ts" "app/api/preview/[id]/route.ts" -Force

# 3. Preview page
New-Item -ItemType Directory -Path "app/dashboard/preview/[id]" -Force
Copy-Item "phase4-preview-system/app/dashboard/preview/[id]/page.tsx" "app/dashboard/preview/[id]/page.tsx" -Force

# 4. Test page
New-Item -ItemType Directory -Path "app/dashboard/test-preview" -Force
Copy-Item "phase4-preview-system/app/dashboard/test-preview/page.tsx" "app/dashboard/test-preview/page.tsx" -Force

# 5. Utilities
Copy-Item phase4-preview-system/lib/preview.ts lib/preview.ts -Force
```

---

## Testing

### 1. Start Dev Server

```powershell
npm run dev
```

### 2. Visit Test Page

Open: http://localhost:3000/dashboard/test-preview

### 3. Create Sample Preview

Click **"Create Sample Preview"** button

This will:
- Generate a sample website with HTML/CSS/JS
- Save it to the database
- Redirect to preview page

### 4. Test Preview Controls

- **Device toggles**: Click 💻 (desktop), 📱 (tablet), or 📱 (mobile)
- **Refresh**: Click refresh button to reload preview
- **Fullscreen**: Click maximize button for fullscreen view
- **Close**: Click X to close preview

---

## Usage

### Creating a Preview Programmatically

```typescript
import { createPreview } from '@/lib/preview';

const preview = await createPreview({
  title: 'My Website',
  html_content: '<h1>Hello World</h1>',
  css_content: 'h1 { color: blue; }',
  js_content: 'console.log("loaded");',
  preview_type: 'website',
});

// Redirect to preview
router.push(`/dashboard/preview/${preview.id}`);
```

### Updating a Preview

```typescript
import { updatePreview } from '@/lib/preview';

await updatePreview(previewId, {
  html_content: '<h1>Updated Content</h1>',
});
```

### Getting User Previews

```typescript
import { getUserPreviews } from '@/lib/preview';

const previews = await getUserPreviews();
```

### Deleting a Preview

```typescript
import { deletePreview } from '@/lib/preview';

await deletePreview(previewId);
```

---

## API Routes

### GET /api/preview/[id]

Returns the full HTML document for a preview.

**Parameters:**
- `id`: Preview UUID

**Response:**
- HTML document with embedded CSS and JS
- Content-Type: text/html

**Security:**
- X-Frame-Options: SAMEORIGIN
- Content-Security-Policy applied
- Sandboxed iframe

---

## Component Reference

### Preview Component

```typescript
import Preview from '@/components/Preview';

<Preview 
  previewId="uuid-here" 
  onClose={() => console.log('closed')} 
/>
```

**Props:**
- `previewId` (string, required): UUID of preview to display
- `onClose` (function, optional): Callback when close button clicked

**Features:**
- Responsive device toggles
- Refresh button
- Fullscreen mode
- Loading states

---

## Database Schema

### previews table

```sql
CREATE TABLE previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  html_content TEXT NOT NULL,
  css_content TEXT,
  js_content TEXT,
  preview_type VARCHAR(50) DEFAULT 'website',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
- Users can only view/edit/delete their own previews
- All operations require authentication

---

## File Structure

```
phase4-preview-system/
├── components/
│   └── Preview.tsx                    # Main preview component
├── app/
│   ├── api/
│   │   └── preview/
│   │       └── [id]/
│   │           └── route.ts          # Preview API route
│   └── dashboard/
│       ├── preview/
│       │   └── [id]/
│       │       └── page.tsx          # Preview page
│       └── test-preview/
│           └── page.tsx              # Test page
├── lib/
│   └── preview.ts                    # Preview utilities
└── scripts/
    └── install-phase4.ps1            # Installation script
```

---

## Troubleshooting

### Preview not loading

**Check:**
1. Preview exists in database: `SELECT * FROM previews WHERE id = 'uuid';`
2. User has permission (RLS policies)
3. Browser console for errors (F12)

### Iframe shows blank

**Check:**
1. HTML content is valid
2. No console errors
3. CSP not blocking resources

### Device sizes not working

**Check:**
1. Browser zoom is at 100%
2. Preview container has enough space
3. Try fullscreen mode

---

## Next Steps

### Integration with AI Generation (Phase 3)

When AI generates websites, save them as previews:

```typescript
// After AI generates HTML
const aiHtml = await generateWithAI(userPrompt);

const preview = await createPreview({
  title: userPrompt,
  html_content: aiHtml,
  css_content: '', // AI-generated CSS
  preview_type: 'website',
});

router.push(`/dashboard/preview/${preview.id}`);
```

### Publishing Feature

Add a publish button to convert previews to live sites:

```typescript
await updatePreview(previewId, {
  is_published: true,
});

// Deploy to custom domain
// Add to user portfolio
```

---

## Support

For issues or questions:
1. Check this README
2. Review console errors (F12)
3. Check Supabase logs
4. Verify database schema

---

## Version

Phase 4.0 - Live Preview System
Last Updated: January 2026
