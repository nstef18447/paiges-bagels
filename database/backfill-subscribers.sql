-- One-time backfill: populate subscribers from existing orders
-- Run manually in Supabase SQL editor AFTER the enrichment migration

INSERT INTO subscribers (email, customer_name, customer_phone, source, updated_at)
SELECT DISTINCT ON (LOWER(TRIM(customer_email)))
  LOWER(TRIM(customer_email)) AS email,
  customer_name,
  customer_phone,
  'order' AS source,
  NOW() AS updated_at
FROM orders
ORDER BY LOWER(TRIM(customer_email)), created_at DESC
ON CONFLICT (email) DO UPDATE SET
  customer_name = COALESCE(EXCLUDED.customer_name, subscribers.customer_name),
  customer_phone = COALESCE(EXCLUDED.customer_phone, subscribers.customer_phone),
  source = CASE WHEN subscribers.source = 'signup' THEN 'signup' ELSE 'order' END,
  updated_at = NOW();
