-- Create pricing table
CREATE TABLE IF NOT EXISTS pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bagel_quantity INTEGER NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default pricing
INSERT INTO pricing (bagel_quantity, price) VALUES
  (1, 4.00),
  (3, 10.00),
  (6, 18.00)
ON CONFLICT (bagel_quantity) DO NOTHING;

-- Create function to update pricing updated_at timestamp
CREATE OR REPLACE FUNCTION update_pricing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for pricing updates
DROP TRIGGER IF EXISTS update_pricing_timestamp_trigger ON pricing;
CREATE TRIGGER update_pricing_timestamp_trigger
BEFORE UPDATE ON pricing
FOR EACH ROW
EXECUTE FUNCTION update_pricing_timestamp();
