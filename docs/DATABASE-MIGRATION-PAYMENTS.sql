-- Database Migration: Add Payment System
-- Run this in Supabase SQL Editor

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preview_id UUID NOT NULL REFERENCES previews(id) ON DELETE CASCADE,

  -- Payment details
  amount_gbp DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded

  -- Stripe details
  stripe_payment_intent_id VARCHAR(255),
  stripe_checkout_session_id VARCHAR(255),

  -- Metadata
  payment_method VARCHAR(50), -- card, bank_transfer, etc
  receipt_url TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT unique_payment_per_preview UNIQUE(preview_id)
);

-- Add payment_status to previews table
ALTER TABLE previews
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid';
-- Values: 'unpaid', 'paid', 'free_preview'

-- Add generation_count to track attempts
ALTER TABLE previews
ADD COLUMN IF NOT EXISTS generation_count INTEGER DEFAULT 1;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_preview_id ON payments(preview_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_previews_payment_status ON previews(payment_status);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments for their previews"
  ON payments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM previews
      WHERE previews.id = preview_id
      AND previews.user_id = auth.uid()
    )
  );

-- Update RLS for previews (allow unpaid previews for free tier)
DROP POLICY IF EXISTS "Users can view their own previews" ON previews;
CREATE POLICY "Users can view their own previews"
  ON previews FOR SELECT
  USING (auth.uid() = user_id);

-- Function to mark preview as paid after successful payment
CREATE OR REPLACE FUNCTION mark_preview_as_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE previews
    SET payment_status = 'paid'
    WHERE id = NEW.preview_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update preview when payment completes
DROP TRIGGER IF EXISTS payment_completed_trigger ON payments;
CREATE TRIGGER payment_completed_trigger
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION mark_preview_as_paid();

-- Insert test data (optional - for development only)
-- UPDATE previews SET payment_status = 'free_preview' WHERE payment_status IS NULL;

COMMENT ON TABLE payments IS 'Stores one-time payment records for website purchases';
COMMENT ON COLUMN payments.status IS 'Payment status: pending, completed, failed, refunded';
COMMENT ON COLUMN previews.payment_status IS 'Website payment status: unpaid, paid, free_preview';
COMMENT ON COLUMN previews.generation_count IS 'Number of AI generation attempts for this website';
