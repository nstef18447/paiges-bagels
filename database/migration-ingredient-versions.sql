-- Version ingredient costs by pickup date so recipe/price changes don't
-- rewrite COGS on past orders. Financials uses the row whose
-- [effective_from, effective_to) range covers each order's pickup date.
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS effective_from date;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS effective_to date;

-- Recipe 2.1 (from pickup date 2026-11-10):
--   starter 100g -> 131g (starter flour 50g -> 65.5g per batch), add 29g honey,
--   8 bagels per batch. Bread flour stays 500g / 8 = 62.5g per bagel.
UPDATE ingredients
SET effective_to = '2026-11-10'
WHERE name = 'Starter' AND cost_type = 'per_bagel' AND effective_to IS NULL;

INSERT INTO ingredients (name, unit, cost_per_unit, units_per_bagel, cost_type, effective_from)
VALUES
  -- same $/g as the old Starter row, 65.5g / 8 bagels
  ('Regular Flour', 'g', 0.0016, 8.1875, 'per_bagel', '2026-11-10'),
  -- $31.05 for 80 oz (2267.96g) = $0.01369/g, 29g / 8 bagels
  ('Honey', 'g', 0.0137, 3.625, 'per_bagel', '2026-11-10');
