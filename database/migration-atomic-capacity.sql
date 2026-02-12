-- Atomic order creation with capacity check
-- Prevents race condition where two orders slip through simultaneously
-- Also fixes: excludes fake orders from capacity calculation

-- First, fix the existing get_slot_capacity to exclude fake orders
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
    AND o.is_fake = false
  WHERE ts.id = slot_id
  GROUP BY ts.id, ts.capacity;
END;
$$ LANGUAGE plpgsql;

-- Create atomic order insertion function
-- Locks the time slot row, checks capacity, and inserts in one transaction
CREATE OR REPLACE FUNCTION create_order_atomic(
  p_time_slot_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_total_bagels INTEGER,
  p_total_price DECIMAL,
  p_venmo_note TEXT DEFAULT ''
)
RETURNS UUID AS $$
DECLARE
  v_capacity INTEGER;
  v_used INTEGER;
  v_remaining INTEGER;
  v_order_id UUID;
BEGIN
  -- Lock the time slot row so no other order can check capacity simultaneously
  SELECT ts.capacity INTO v_capacity
  FROM time_slots ts
  WHERE ts.id = p_time_slot_id
  FOR UPDATE;

  IF v_capacity IS NULL THEN
    RAISE EXCEPTION 'Time slot not found';
  END IF;

  -- Count current non-fake bagels booked for this slot
  SELECT COALESCE(SUM(o.total_bagels), 0)::INTEGER INTO v_used
  FROM orders o
  WHERE o.time_slot_id = p_time_slot_id
    AND o.status IN ('pending', 'confirmed')
    AND o.is_fake = false;

  v_remaining := v_capacity - v_used;

  IF v_remaining < p_total_bagels THEN
    RAISE EXCEPTION 'Not enough capacity remaining for this time slot';
  END IF;

  -- Insert the order
  INSERT INTO orders (
    time_slot_id, customer_name, customer_email, customer_phone,
    plain_count, everything_count, sesame_count,
    total_bagels, total_price, status, venmo_note
  ) VALUES (
    p_time_slot_id, p_customer_name, p_customer_email, p_customer_phone,
    0, 0, 0,
    p_total_bagels, p_total_price, 'pending', p_venmo_note
  )
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;
