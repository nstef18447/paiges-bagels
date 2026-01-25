-- Create time_slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  plain_count INTEGER NOT NULL DEFAULT 0,
  everything_count INTEGER NOT NULL DEFAULT 0,
  sesame_count INTEGER NOT NULL DEFAULT 0,
  total_bagels INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ready')),
  venmo_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_time_slot_id ON orders(time_slot_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(date);

-- Create function to calculate remaining capacity for a time slot
CREATE OR REPLACE FUNCTION get_slot_capacity(slot_id UUID)
RETURNS TABLE (
  capacity INTEGER,
  remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ts.capacity,
    ts.capacity - COALESCE(SUM(o.total_bagels), 0)::INTEGER AS remaining
  FROM time_slots ts
  LEFT JOIN orders o ON o.time_slot_id = ts.id
    AND o.status IN ('pending', 'confirmed')
  WHERE ts.id = slot_id
  GROUP BY ts.id, ts.capacity;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for time_slots
-- Allow public read access to time slots
CREATE POLICY "Public can view time slots"
  ON time_slots FOR SELECT
  TO public
  USING (true);

-- Allow service role to manage time slots
CREATE POLICY "Service role can manage time slots"
  ON time_slots FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for orders
-- Allow public to insert orders
CREATE POLICY "Public can create orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to view their own orders (optional - you can remove this if not needed)
CREATE POLICY "Public can view orders"
  ON orders FOR SELECT
  TO public
  USING (true);

-- Allow service role to manage orders
CREATE POLICY "Service role can manage orders"
  ON orders FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable realtime for orders table (for admin dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
