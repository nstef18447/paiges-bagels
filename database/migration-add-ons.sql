-- Migration: Add add-on types support (e.g., Schmear)
-- Run this AFTER the dynamic bagels migration

-- Create add_on_types table
CREATE TABLE IF NOT EXISTS add_on_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_add_ons junction table
CREATE TABLE IF NOT EXISTS order_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  add_on_type_id UUID NOT NULL REFERENCES add_on_types(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_add_ons_order_id ON order_add_ons(order_id);
CREATE INDEX IF NOT EXISTS idx_order_add_ons_add_on_type_id ON order_add_ons(add_on_type_id);
CREATE INDEX IF NOT EXISTS idx_add_on_types_active ON add_on_types(active);
CREATE INDEX IF NOT EXISTS idx_add_on_types_display_order ON add_on_types(display_order);

-- Enable RLS for new tables
ALTER TABLE add_on_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_add_ons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for add_on_types
CREATE POLICY "Public can view active add-on types"
  ON add_on_types FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Service role can manage add-on types"
  ON add_on_types FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for order_add_ons
CREATE POLICY "Public can view order add-ons"
  ON order_add_ons FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create order add-ons"
  ON order_add_ons FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Service role can manage order add-ons"
  ON order_add_ons FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
