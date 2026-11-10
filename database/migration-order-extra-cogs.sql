-- One-off cost entered on a custom order (e.g. cream cheese for a corporate
-- order). Financials adds it to that day's COGS.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS extra_cogs numeric(10, 2) NOT NULL DEFAULT 0;
