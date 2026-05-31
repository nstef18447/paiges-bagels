-- Add market column to track which city a customer belongs to
-- Run manually in Supabase SQL editor

ALTER TABLE subscribers
  ADD COLUMN market TEXT DEFAULT 'chicago';

-- Tag all existing subscribers as chicago (they all signed up during Chicago era)
UPDATE subscribers SET market = 'chicago' WHERE market IS NULL;
