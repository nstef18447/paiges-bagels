-- Migration: Add dynamic bagel types support
-- Run this AFTER the initial schema.sql

-- Create bagel_types table
CREATE TABLE IF NOT EXISTS bagel_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items junction table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  bagel_type_id UUID NOT NULL REFERENCES bagel_types(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_bagel_type_id ON order_items(bagel_type_id);
CREATE INDEX IF NOT EXISTS idx_bagel_types_active ON bagel_types(active);
CREATE INDEX IF NOT EXISTS idx_bagel_types_display_order ON bagel_types(display_order);

-- Enable RLS for new tables
ALTER TABLE bagel_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bagel_types
CREATE POLICY "Public can view active bagel types"
  ON bagel_types FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Service role can manage bagel types"
  ON bagel_types FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for order_items
CREATE POLICY "Public can view order items"
  ON order_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create order items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Service role can manage order items"
  ON order_items FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert default bagel types (Plain, Everything, Sesame)
INSERT INTO bagel_types (name, display_order) VALUES
  ('Plain', 1),
  ('Everything', 2),
  ('Sesame', 3)
ON CONFLICT (name) DO NOTHING;

-- Note: We're keeping the old columns in the orders table for backward compatibility
-- New orders will use order_items, but old column data remains for existing orders
-- You can drop these columns later after migrating all old data:
-- ALTER TABLE orders DROP COLUMN IF EXISTS plain_count;
-- ALTER TABLE orders DROP COLUMN IF EXISTS everything_count;
-- ALTER TABLE orders DROP COLUMN IF EXISTS sesame_count;
