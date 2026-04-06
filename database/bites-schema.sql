-- Paige's Bites tables

-- Bite flavors (e.g., Everything, Flaky Salt, Plain, etc.)
CREATE TABLE IF NOT EXISTS bite_flavors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bite pack pricing (3-pack, 6-pack, 12-pack)
CREATE TABLE IF NOT EXISTS bite_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_size INTEGER NOT NULL UNIQUE,
  price NUMERIC(10, 2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);

-- Add bites JSONB column to orders (nullable — null means no bites ordered)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bites JSONB;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bite_flavors_active ON bite_flavors(active);
CREATE INDEX IF NOT EXISTS idx_bite_flavors_sort_order ON bite_flavors(sort_order);

-- Enable RLS
ALTER TABLE bite_flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bite_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bite_flavors
CREATE POLICY "Public can view bite flavors"
  ON bite_flavors FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage bite flavors"
  ON bite_flavors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for bite_pricing
CREATE POLICY "Public can view bite pricing"
  ON bite_pricing FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage bite pricing"
  ON bite_pricing FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed default pack pricing
INSERT INTO bite_pricing (pack_size, price) VALUES
  (3, 6.00),
  (6, 11.00),
  (12, 20.00)
ON CONFLICT (pack_size) DO NOTHING;

-- Enable realtime for bite tables (for admin dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE bite_flavors;
ALTER PUBLICATION supabase_realtime ADD TABLE bite_pricing;

-- Create Supabase Storage bucket for bite images (run in Supabase dashboard SQL editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('bites', 'bites', true) ON CONFLICT DO NOTHING;
-- CREATE POLICY "Public can view bite images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'bites');
-- CREATE POLICY "Service role can manage bite images" ON storage.objects FOR ALL TO service_role USING (bucket_id = 'bites') WITH CHECK (bucket_id = 'bites');
