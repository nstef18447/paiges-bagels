-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  cost_per_unit DECIMAL(10, 4) NOT NULL DEFAULT 0,
  units_per_bagel DECIMAL(10, 4) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update ingredients updated_at timestamp
CREATE OR REPLACE FUNCTION update_ingredients_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ingredients updates
DROP TRIGGER IF EXISTS update_ingredients_timestamp_trigger ON ingredients;
CREATE TRIGGER update_ingredients_timestamp_trigger
BEFORE UPDATE ON ingredients
FOR EACH ROW
EXECUTE FUNCTION update_ingredients_timestamp();

-- Enable RLS
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on ingredients"
  ON ingredients FOR SELECT
  USING (true);

-- Allow all operations for service role
CREATE POLICY "Allow service role full access on ingredients"
  ON ingredients FOR ALL
  USING (true)
  WITH CHECK (true);
