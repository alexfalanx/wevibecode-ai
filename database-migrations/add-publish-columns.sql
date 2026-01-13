-- Migration: Add publishing columns to previews table
-- Date: January 12, 2026
-- Purpose: Support subdomain and custom domain publishing

-- Add columns for publishing functionality
ALTER TABLE previews
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255),
ADD COLUMN IF NOT EXISTS published_url VARCHAR(500);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_previews_slug ON previews(slug);

-- Create index on is_published for public preview queries
CREATE INDEX IF NOT EXISTS idx_previews_published ON previews(is_published);

-- Update RLS policy to allow public SELECT for published previews
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view published previews" ON previews;

-- Create new policy for public access to published previews
CREATE POLICY "Public can view published previews"
ON previews FOR SELECT
USING (is_published = true);

-- Ensure authenticated users can still manage their own previews
DROP POLICY IF EXISTS "Users can view their own previews" ON previews;

CREATE POLICY "Users can view their own previews"
ON previews FOR SELECT
USING (auth.uid() = user_id OR is_published = true);

-- Add comment to document the schema
COMMENT ON COLUMN previews.slug IS 'Unique slug for subdomain publishing (e.g., "my-site" for my-site.wevibecode.ai)';
COMMENT ON COLUMN previews.custom_domain IS 'Custom domain if user configures one (e.g., "example.com")';
COMMENT ON COLUMN previews.published_url IS 'Full URL where the site is published';
