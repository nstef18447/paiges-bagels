-- Enrich subscribers table with name, phone, source tracking
-- Run manually in Supabase SQL editor

-- Add new columns (all nullable so existing rows are fine)
ALTER TABLE subscribers
  ADD COLUMN customer_name TEXT,
  ADD COLUMN customer_phone TEXT,
  ADD COLUMN source TEXT DEFAULT 'signup',
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Allow upserts from anon key (needed for order-based subscriber creation)
CREATE POLICY "Anyone can update subscribers" ON subscribers
  FOR UPDATE USING (true) WITH CHECK (true);
