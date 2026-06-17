-- ====================================================
-- PAYTM PAYMENT GATEWAY SUPPORT
-- Run this in Supabase SQL Editor
-- ====================================================

-- Payment transactions audit table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id TEXT NOT NULL,
  order_id TEXT UNIQUE NOT NULL,
  txn_id TEXT,
  txn_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'initiated'
    CHECK (status IN ('initiated', 'pending', 'success', 'failed', 'expired')),
  gateway_response JSONB DEFAULT '{}'::jsonb,
  checksum TEXT,
  ip_address TEXT,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pt_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_pt_booking_id ON payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_pt_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pt_idempotency ON payment_transactions(idempotency_key);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Add paytm_order_id to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paytm_order_id TEXT;
CREATE INDEX IF NOT EXISTS idx_bookings_paytm_order ON bookings(paytm_order_id);

-- Safe seat release function (concurrency-safe rollback)
CREATE OR REPLACE FUNCTION release_seats_safe(
  p_showtime_id UUID,
  p_seats TEXT[]
) RETURNS VOID AS $$
DECLARE
  v_current JSONB;
  v_current_arr TEXT[];
  v_new_arr TEXT[];
BEGIN
  SELECT booked_seats INTO v_current
  FROM showtimes
  WHERE id = p_showtime_id
  FOR UPDATE;

  IF v_current IS NULL THEN
    RETURN;
  END IF;

  -- Convert JSONB array to TEXT array
  SELECT ARRAY(SELECT jsonb_array_elements_text(v_current)) INTO v_current_arr;

  -- Remove the specified seats
  v_new_arr := ARRAY(
    SELECT unnest(v_current_arr)
    EXCEPT
    SELECT unnest(p_seats)
  );

  UPDATE showtimes
  SET booked_seats = to_jsonb(v_new_arr)
  WHERE id = p_showtime_id;
END;
$$ LANGUAGE plpgsql;
