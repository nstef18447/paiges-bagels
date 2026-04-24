-- Enforce bite capacity atomically on order creation
-- Adds p_bite_pack_size param to create_order_atomic. Locks the slot, sums
-- active bite pack sizes (excluding fake orders), and raises if the new pack
-- would exceed bite_capacity. Bagel check is unchanged.

-- Drop the old signature so the new one with the extra param replaces it
DROP FUNCTION IF EXISTS create_order_atomic(UUID, TEXT, TEXT, TEXT, INTEGER, DECIMAL, TEXT);

CREATE OR REPLACE FUNCTION create_order_atomic(
  p_time_slot_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_total_bagels INTEGER,
  p_total_price DECIMAL,
  p_venmo_note TEXT DEFAULT '',
  p_bite_pack_size INTEGER DEFAULT 0
)
RETURNS UUID
SECURITY DEFINER
AS $$
DECLARE
  v_capacity INTEGER;
  v_bite_capacity INTEGER;
  v_bagels_used INTEGER;
  v_bites_used INTEGER;
  v_order_id UUID;
BEGIN
  -- Lock the slot row so concurrent orders serialize through the capacity check
  SELECT ts.capacity, COALESCE(ts.bite_capacity, 0)
    INTO v_capacity, v_bite_capacity
  FROM time_slots ts
  WHERE ts.id = p_time_slot_id
  FOR UPDATE;

  IF v_capacity IS NULL THEN
    RAISE EXCEPTION 'Time slot not found';
  END IF;

  -- Bagel capacity
  SELECT COALESCE(SUM(o.total_bagels), 0)::INTEGER INTO v_bagels_used
  FROM orders o
  WHERE o.time_slot_id = p_time_slot_id
    AND o.status IN ('pending', 'confirmed')
    AND o.is_fake = false;

  IF (v_capacity - v_bagels_used) < p_total_bagels THEN
    RAISE EXCEPTION 'Not enough capacity remaining for this time slot';
  END IF;

  -- Bite capacity (only when this order contains a bite pack)
  IF p_bite_pack_size > 0 THEN
    SELECT COALESCE(SUM((o.bites->>'pack_size')::INTEGER), 0) INTO v_bites_used
    FROM orders o
    WHERE o.time_slot_id = p_time_slot_id
      AND o.status IN ('pending', 'confirmed')
      AND o.is_fake = false
      AND o.bites IS NOT NULL;

    IF (v_bite_capacity - v_bites_used) < p_bite_pack_size THEN
      RAISE EXCEPTION 'Not enough bite capacity remaining for this time slot';
    END IF;
  END IF;

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
