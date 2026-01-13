# Database Migrations

## How to Apply Migrations

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Open the migration file (e.g., `add-publish-columns.sql`)
5. Copy the SQL content
6. Paste into the SQL Editor
7. Click **Run** to execute

## Migrations

### add-publish-columns.sql
**Date**: January 12, 2026
**Status**: ⏳ Pending

**Purpose**: Add publishing functionality to support subdomain and custom domain publishing

**Changes**:
- Adds `slug` column (VARCHAR, UNIQUE) for subdomain slugs
- Adds `custom_domain` column (VARCHAR) for custom domains
- Adds `published_url` column (VARCHAR) for full published URLs
- Creates indexes on `slug` and `is_published` for performance
- Updates RLS policies to allow public access to published previews

**After Running**:
- Mark this migration as ✅ Complete in this README
- Verify columns exist: `SELECT column_name FROM information_schema.columns WHERE table_name = 'previews';`
