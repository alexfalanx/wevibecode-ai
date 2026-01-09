-- Phase 3: AI Website Generation - Database Migration

-- Add generation fields to previews table
ALTER TABLE previews 
ADD COLUMN IF NOT EXISTS generation_prompt TEXT,
ADD COLUMN IF NOT EXISTS generation_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS credits_used INT DEFAULT 1;

-- Create credits_log table
CREATE TABLE IF NOT EXISTS credits_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credits_used INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on credits_log
ALTER TABLE credits_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own credit logs
CREATE POLICY "Users can view own credit logs"
  ON credits_log FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own credit logs
CREATE POLICY "Users can insert own credit logs"
  ON credits_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credits_log_user_id ON credits_log(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_log_created_at ON credits_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_previews_generation_type ON previews(generation_type);

-- Add comments
COMMENT ON COLUMN previews.generation_prompt IS 'User prompt used to generate this website';
COMMENT ON COLUMN previews.generation_type IS 'Type of website generated (landing, portfolio, business, etc)';
COMMENT ON COLUMN previews.credits_used IS 'Number of credits used for this generation';
COMMENT ON TABLE credits_log IS 'Log of all credit usage across the platform';
