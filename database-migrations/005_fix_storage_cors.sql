-- Fix CORS and public access for user-images bucket
-- Run this in Supabase SQL Editor if images aren't loading

-- Ensure bucket is public
UPDATE storage.buckets
SET public = true,
    avif_autodetection = false
WHERE id = 'user-images';

-- Update CORS settings (you may need to do this in Supabase Dashboard)
-- Go to Storage Settings → CORS and add:
-- Allowed Origins: *
-- Allowed Methods: GET, HEAD
-- Allowed Headers: authorization, x-client-info, apikey, content-type

-- Verify bucket settings
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'user-images';
