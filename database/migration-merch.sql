-- Migration: Merch tables for Stripe Checkout
-- Run this in the Supabase SQL editor

-- ============================================
-- 1. merch_items — products for sale
-- ============================================
CREATE TABLE merch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INT, -- null = unlimited
  image_url TEXT,
  needs_size BOOLEAN DEFAULT false,
  sizes TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE merch_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active merch items"
  ON merch_items FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage merch items"
  ON merch_items FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 2. merch_settings — single-row config
-- ============================================
CREATE TABLE merch_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_cost DECIMAL(10,2) DEFAULT 5.00,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE merch_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read merch settings"
  ON merch_settings FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage merch settings"
  ON merch_settings FOR ALL
  USING (auth.role() = 'service_role');

-- Seed with one row
INSERT INTO merch_settings (shipping_cost) VALUES (5.00);

-- ============================================
-- 3. merch_orders — customer orders
-- ============================================
CREATE TABLE merch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_zip TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  shipping_cost DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'paid', 'shipped', 'cancelled')),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_merch_orders_status ON merch_orders(status);
CREATE INDEX idx_merch_orders_stripe_session ON merch_orders(stripe_session_id);

ALTER TABLE merch_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert merch orders"
  ON merch_orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can read merch orders"
  ON merch_orders FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage merch orders"
  ON merch_orders FOR ALL
  USING (auth.role() = 'service_role');
