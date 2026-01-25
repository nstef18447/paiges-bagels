-- Add label column to pricing table for custom display text
ALTER TABLE pricing ADD COLUMN IF NOT EXISTS label TEXT;

-- Update existing rows to have default labels
UPDATE pricing SET label = bagel_quantity || ' Bagel' WHERE bagel_quantity = 1 AND label IS NULL;
UPDATE pricing SET label = bagel_quantity || ' Bagels' WHERE bagel_quantity > 1 AND label IS NULL;
