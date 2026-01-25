# Image Management System - Implementation Guide

## Overview

Complete image management system for WeVibeCode.ai, allowing users to upload, store, manage, and replace images in their generated websites.

**Status:** ✅ Core functionality complete, ready for final integration into SiteEditor

---

## Features Implemented

### 1. ✅ Image Upload System
- **Drag & drop interface** with visual feedback
- **File picker fallback** for traditional upload
- **File validation:**
  - Allowed types: JPEG, JPG, PNG, GIF, WebP
  - Max size: 5MB
  - Type and size checked client-side and server-side
- **Upload progress indication**
- **Success/error feedback**

### 2. ✅ Image Storage (Supabase)
- **Dedicated bucket:** `user-images`
- **User-specific folders:** `{user_id}/{filename}`
- **Automatic cleanup** on user deletion
- **Public access** for serving images
- **RLS policies** for security

### 3. ✅ Image Gallery
- **Grid layout** (responsive 2-4 columns)
- **Image metadata display:**
  - Filename
  - File size
  - Upload date
- **Select functionality** for choosing images
- **Delete functionality** with confirmation
- **Refresh capability**
- **Empty state** when no images

### 4. ✅ Database Tracking
- **user_images table** stores metadata
- **Automatic timestamps** (created_at, updated_at)
- **Full CRUD operations:**
  - Create (on upload)
  - Read (fetch user's images)
  - Delete (remove from storage + DB)

### 5. ✅ Image Replacement Functions
- **extractImages()** - Find all `<img>` tags in HTML
- **replaceImage()** - Swap image src by selector
- **Selector generation** for precise targeting

---

## Architecture

### File Structure

```
database-migrations/
  └── 004_image_storage.sql          # Storage bucket + tables + RLS

app/api/upload-image/
  └── route.ts                        # POST (upload), GET (fetch), DELETE

components/
  ├── ImageUploader.tsx               # Drag & drop upload UI
  └── ImageGallery.tsx                # Gallery grid view

lib/
  └── publish.ts                      # extractImages(), replaceImage()
```

### Data Flow

```
User Action → ImageUploader Component → API Endpoint → Supabase Storage
                                                     ↓
                                            Database Record Created
                                                     ↓
                                            ImageGallery Refreshes
                                                     ↓
                                            User Selects Image
                                                     ↓
                                      replaceImage() Updates HTML
```

---

## Setup Instructions

### Step 1: Run Database Migration

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste content from `database-migrations/004_image_storage.sql`
3. Click "Run"

This creates:
- ✅ `user-images` storage bucket
- ✅ Storage RLS policies
- ✅ `user_images` table
- ✅ Table indexes and RLS

### Step 2: Verify Setup

Check in Supabase Dashboard:
- **Storage** → Should see `user-images` bucket
- **Table Editor** → Should see `user_images` table
- **Policies** → Should see RLS policies for both

### Step 3: Test Upload

```typescript
// In your component
import ImageUploader from '@/components/ImageUploader';

<ImageUploader
  onUploadComplete={(image) => {
    console.log('Uploaded:', image.url);
  }}
  onError={(error) => {
    console.error('Error:', error);
  }}
/>
```

---

## API Reference

### POST /api/upload-image

Upload a new image.

**Request:**
```typescript
FormData {
  file: File // Image file
}
```

**Response (Success):**
```json
{
  "success": true,
  "image": {
    "id": "uuid",
    "url": "https://...supabase.co/.../image.jpg",
    "fileName": "original-name.jpg",
    "fileSize": 123456,
    "mimeType": "image/jpeg",
    "createdAt": "2026-01-13T..."
  }
}
```

**Response (Error):**
```json
{
  "error": "File too large. Maximum size: 5MB"
}
```

### GET /api/upload-image

Fetch all images for authenticated user.

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "id": "uuid",
      "url": "https://...",
      "file_name": "image.jpg",
      "file_size": 123456,
      "mime_type": "image/jpeg",
      "created_at": "2026-01-13T..."
    }
  ]
}
```

### DELETE /api/upload-image

Delete an image.

**Request:**
```json
{
  "imageId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

---

## Component Usage

### ImageUploader

```typescript
import ImageUploader from '@/components/ImageUploader';

<ImageUploader
  onUploadComplete={(image) => {
    // Handle successful upload
    console.log('Image URL:', image.url);
  }}
  onError={(error) => {
    // Handle error
    console.error(error);
  }}
  maxSizeMB={5} // Optional, default: 5
/>
```

### ImageGallery

```typescript
import ImageGallery from '@/components/ImageGallery';
import { useState } from 'react';

const [refreshTrigger, setRefreshTrigger] = useState(0);

<ImageGallery
  selectable={true}
  onSelectImage={(url) => {
    // Handle image selection
    console.log('Selected:', url);
  }}
  refreshTrigger={refreshTrigger} // Increment to refresh
/>
```

---

## Integration with SiteEditor (Next Step)

The final step is integrating into `components/SiteEditor.tsx`:

### Planned UI

```
┌─────────────────────────────────────┐
│ Site Editor                         │
├─────────────────────────────────────┤
│ [Text] [Colors] [Images] ← New Tab │
├─────────────────────────────────────┤
│                                     │
│ Current Images in Site:             │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │ img1 │ │ img2 │ │ img3 │         │
│ └──────┘ └──────┘ └──────┘         │
│  [Replace]  [Replace]  [Replace]   │
│                                     │
│ ───────────────────────────────    │
│                                     │
│ Upload New Image:                   │
│ [Drag & Drop Area]                  │
│                                     │
│ ───────────────────────────────    │
│                                     │
│ Your Uploaded Images:               │
│ [ImageGallery Component]            │
│                                     │
└─────────────────────────────────────┘
```

### Implementation Steps

1. **Add "Images" tab** to SiteEditor
2. **Extract images** from current HTML using `extractImages()`
3. **Show current images** with "Replace" buttons
4. **On Replace click:**
   - Show modal with ImageGallery
   - User selects uploaded image
   - Call `replaceImage(html, selector, newUrl)`
   - Update preview + save
5. **Add ImageUploader** for new uploads
6. **Refresh gallery** after upload

### Code Skeleton

```typescript
// In SiteEditor.tsx
import { extractImages, replaceImage } from '@/lib/publish';
import ImageGallery from '@/components/ImageGallery';
import ImageUploader from '@/components/ImageUploader';

// Extract images
const [siteImages, setSiteImages] = useState<SiteImage[]>([]);

useEffect(() => {
  const images = extractImages(editedHtml);
  setSiteImages(images);
}, [editedHtml]);

// Replace image
const handleReplaceImage = (selector: string, newUrl: string) => {
  const newHtml = replaceImage(editedHtml, selector, newUrl);
  setEditedHtml(newHtml);

  // Re-extract images
  const images = extractImages(newHtml);
  setSiteImages(images);
};
```

---

## Testing Checklist

### Manual Testing

1. **Upload:**
   - ✅ Drag and drop image
   - ✅ Click to select file
   - ✅ Upload progress shows
   - ✅ Success message appears
   - ✅ Image appears in gallery

2. **Validation:**
   - ✅ Upload too large file (>5MB) → Error shown
   - ✅ Upload wrong type (.txt) → Error shown
   - ✅ Upload valid image → Success

3. **Gallery:**
   - ✅ All images load
   - ✅ Correct metadata shown
   - ✅ Click image selects it
   - ✅ Delete button works
   - ✅ Refresh button works

4. **Database:**
   - ✅ Check Supabase Storage for files
   - ✅ Check user_images table for records
   - ✅ Verify user can only see their own images

### Security Testing

1. **RLS Policies:**
   - ✅ User A cannot see User B's images
   - ✅ User A cannot delete User B's images
   - ✅ Unauthenticated users cannot upload

2. **File Validation:**
   - ✅ Server rejects invalid file types
   - ✅ Server rejects oversized files

---

## Database Schema

### user_images Table

```sql
CREATE TABLE user_images (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path    TEXT NOT NULL,       -- user_id/filename.jpg
  file_name       TEXT NOT NULL,       -- original-name.jpg
  file_size       INTEGER NOT NULL,    -- bytes
  mime_type       TEXT NOT NULL,       -- image/jpeg
  url             TEXT NOT NULL,       -- public URL
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `user_id` (for fast user queries)
- `created_at DESC` (for chronological ordering)

---

## Performance Considerations

1. **Image Optimization:**
   - Client-side: Consider adding compression before upload
   - Server-side: Consider automatic WebP conversion
   - CDN: Supabase Storage has built-in CDN

2. **Loading:**
   - ImageGallery uses lazy loading (`loading="lazy"`)
   - Pagination could be added for users with many images

3. **Caching:**
   - Set appropriate cache headers (already done: 3600s)
   - Browser caches images after first load

---

## Future Enhancements

### Potential Additions

1. **Image Editing:**
   - Crop/resize before upload
   - Filters and adjustments
   - Integration with image editing library

2. **Bulk Operations:**
   - Upload multiple images at once
   - Select multiple images to delete
   - Batch replace

3. **Organization:**
   - Folders/categories
   - Tags for images
   - Search functionality

4. **Advanced Features:**
   - Image optimization (auto-compress)
   - Different sizes (thumbnail, medium, large)
   - Cloudinary or Imgix integration

---

## Troubleshooting

### Images not uploading

1. Check browser console for errors
2. Verify Supabase Storage bucket exists
3. Confirm RLS policies are active
4. Check network tab for 401/403 errors

### Images not appearing in gallery

1. Verify user is authenticated
2. Check `user_images` table in Supabase
3. Confirm RLS policies allow SELECT
4. Check browser console for errors

### Delete not working

1. Verify RLS policy allows DELETE
2. Check if file exists in Storage
3. Confirm imageId is correct

---

## Summary

**What's Complete:**
- ✅ Full upload system with validation
- ✅ Supabase Storage integration
- ✅ Image gallery with CRUD operations
- ✅ Image extraction and replacement functions
- ✅ Database schema and RLS policies
- ✅ Responsive UI components

**What's Next:**
- ⏳ Integrate into SiteEditor.tsx
- ⏳ Add "Images" tab to editor UI
- ⏳ Connect replacement logic
- ⏳ Test end-to-end workflow

**Time to Complete Integration:** ~1-2 hours

---

*Implementation Date: 2026-01-13*
*Status: Core Complete - Ready for Editor Integration*
*Commit: b3229e9*
