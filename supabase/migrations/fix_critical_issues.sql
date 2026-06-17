-- ====================================================
-- MIGRATION: FIX CRITICAL SECURITY AND CONCURRENCY ISSUES
-- ====================================================

-- ─── 1. SEC-01: Remove Vulnerable RLS Policy on Bookings ───
-- Public inserts are no longer allowed. The server-side API routes bypass RLS using service_role.
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;


-- ─── 2. SEC-02: Secure Promo Codes from Public Scraping ───
-- Remove public select and replace with admin-only select.
DROP POLICY IF EXISTS "Promo codes are viewable by everyone" ON promo_codes;

CREATE POLICY "Admins can view all promo codes" ON promo_codes
  FOR SELECT USING (auth.uid() IN (SELECT id FROM admins));


-- ─── 3. REL-01: Create Missing increment_promo_usage Function ───
CREATE OR REPLACE FUNCTION increment_promo_usage(promo_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE promo_codes
  SET times_used = times_used + 1
  WHERE code = UPPER(promo_code);
END;
$$ LANGUAGE plpgsql;


-- ─── 4. REL-02: Self-Healing Seat Reclamation inside book_seats_safe ───
CREATE OR REPLACE FUNCTION book_seats_safe(
  p_showtime_id UUID,
  p_seats TEXT[]
) RETURNS VOID AS $$
DECLARE
  v_current JSONB;
  v_current_seats TEXT[];
  v_new_seats TEXT[];
  v_abandoned_booking RECORD;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT booked_seats INTO v_current
  FROM showtimes
  WHERE id = p_showtime_id
  FOR UPDATE;

  IF v_current IS NULL THEN
    v_current_seats := ARRAY[]::TEXT[];
  ELSE
    SELECT ARRAY(SELECT jsonb_array_elements_text(v_current)) INTO v_current_seats;
  END IF;

  -- Self-healing: Find and cancel abandoned bookings (>10m old) and reclaim their seats
  FOR v_abandoned_booking IN 
    SELECT id, selected_seats, booking_id
    FROM bookings 
    WHERE showtime_id = p_showtime_id 
      AND (booking_status = 'pending' OR payment_status = 'initiated' OR payment_status = 'pending')
      AND created_at < (now() - INTERVAL '10 minutes')
  LOOP
    -- Remove abandoned seats from active list
    SELECT ARRAY(
      SELECT unnest(v_current_seats)
      EXCEPT
      SELECT unnest(ARRAY(SELECT jsonb_array_elements_text(v_abandoned_booking.selected_seats)))
    ) INTO v_current_seats;

    -- Update booking status to cancelled/failed
    UPDATE bookings 
    SET booking_status = 'cancelled', payment_status = 'failed' 
    WHERE id = v_abandoned_booking.id;

    -- Update payment transaction to expired
    UPDATE payment_transactions 
    SET status = 'expired', updated_at = now() 
    WHERE booking_id = v_abandoned_booking.booking_id;
  END LOOP;

  -- Check if any of the requested seats are already booked
  IF p_seats && v_current_seats THEN
    RAISE EXCEPTION 'One or more selected seats are already booked.';
  END IF;

  -- Append the new seats (deduplicated)
  v_new_seats := ARRAY(
    SELECT DISTINCT unnest(v_current_seats || p_seats)
  );

  -- Update the showtime
  UPDATE showtimes
  SET booked_seats = to_jsonb(v_new_seats)
  WHERE id = p_showtime_id;

END;
$$ LANGUAGE plpgsql;


-- ====================================================
-- ROLLBACK SCRIPTS (To revert these changes if needed)
-- ====================================================
/*
-- 1. Rollback SEC-01: Re-enable anonymous bookings inserts
CREATE POLICY "Anyone can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- 2. Rollback SEC-02: Re-enable public promo code view
DROP POLICY IF EXISTS "Admins can view all promo codes" ON promo_codes;
CREATE POLICY "Promo codes are viewable by everyone" ON promo_codes
  FOR SELECT USING (true);

-- 3. Rollback REL-01: Drop the promo usage function
DROP FUNCTION IF EXISTS increment_promo_usage(text);

-- 4. Rollback REL-02: Revert book_seats_safe to original (without self-healing)
CREATE OR REPLACE FUNCTION book_seats_safe(
  p_showtime_id UUID,
  p_seats TEXT[]
) RETURNS VOID AS $$
DECLARE
  v_current JSONB;
  v_current_seats TEXT[];
  v_new_seats TEXT[];
BEGIN
  SELECT booked_seats INTO v_current
  FROM showtimes
  WHERE id = p_showtime_id
  FOR UPDATE;

  IF v_current IS NULL THEN
    v_current_seats := ARRAY[]::TEXT[];
  ELSE
    SELECT ARRAY(SELECT jsonb_array_elements_text(v_current)) INTO v_current_seats;
  END IF;

  IF p_seats && v_current_seats THEN
    RAISE EXCEPTION 'One or more selected seats are already booked.';
  END IF;

  v_new_seats := ARRAY(
    SELECT DISTINCT unnest(v_current_seats || p_seats)
  );

  UPDATE showtimes
  SET booked_seats = to_jsonb(v_new_seats)
  WHERE id = p_showtime_id;
END;
$$ LANGUAGE plpgsql;
*/


-- ====================================================
-- SQL VERIFICATION QUERIES (Run to prove fixes worked)
-- ====================================================

-- Query 1: Verify bookings RLS policy (Must NOT return "Anyone can create bookings")
-- Expected: 0 rows returned.
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'bookings' AND cmd = 'INSERT';

-- Query 2: Verify promo_codes RLS policy (Must return "Admins can view all promo codes")
-- Expected: 1 row returned.
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'promo_codes' AND policyname = 'Admins can view all promo codes';

-- Query 3: Verify existence of increment_promo_usage function
-- Expected: 1 row returned.
SELECT proname, proargtypes::regtype[] 
FROM pg_proc 
WHERE proname = 'increment_promo_usage';

-- Query 4: Verify definition of self-healing book_seats_safe function
-- Expected: 1 row returned.
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'book_seats_safe' AND prosrc LIKE '%v_abandoned_booking%';
