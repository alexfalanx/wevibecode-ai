-- Phase 2: Add preferred_language column and index
-- Run this in Supabase SQL Editor

-- Add preferred_language column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- Update existing users to have default language
UPDATE profiles 
SET preferred_language = 'en' 
WHERE preferred_language IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language 
ON profiles(preferred_language);

-- Verify
SELECT 
  id, 
  email, 
  preferred_language, 
  credits,
  created_at
FROM profiles 
LIMIT 10;
