-- Migration: Hangover Bagels
-- Adds is_hangover flag to time_slots and pricing_type to pricing

-- 1. Hangover flag on time_slots
ALTER TABLE time_slots ADD COLUMN is_hangover BOOLEAN NOT NULL DEFAULT false;

-- 2. Pricing type column + hangover pricing tiers
ALTER TABLE pricing DROP CONSTRAINT IF EXISTS pricing_bagel_quantity_key;
ALTER TABLE pricing ADD COLUMN pricing_type TEXT NOT NULL DEFAULT 'regular';
ALTER TABLE pricing ADD CONSTRAINT pricing_quantity_type_unique UNIQUE (bagel_quantity, pricing_type);

-- Insert hangover pricing rows (admin adjusts prices later)
INSERT INTO pricing (bagel_quantity, price, label, pricing_type) VALUES
  (1, 4.00, '1 Bagel', 'hangover'),
  (3, 10.00, '3 Bagels', 'hangover'),
  (6, 18.00, '6 Bagels', 'hangover')
ON CONFLICT (bagel_quantity, pricing_type) DO NOTHING;
