-- ====================================================
-- FIX CRITICAL SECURITY AND CONCURRENCY ISSUES
-- ====================================================

-- 1. SEC-01: Remove Vulnerable RLS Policy on Bookings
-- Public inserts are no longer allowed. The server-side API routes bypass RLS using service_role.
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;

-- 2. SEC-02: Secure Promo Codes from Public Scraping
-- Remove public select and replace with admin-only select.
DROP POLICY IF EXISTS "Promo codes are viewable by everyone" ON promo_codes;
CREATE POLICY "Admins can view all promo codes" ON promo_codes
  FOR SELECT USING (auth.uid() IN (SELECT id FROM admins));

-- 3. REL-01: Create Missing increment_promo_usage Function
CREATE OR REPLACE FUNCTION increment_promo_usage(promo_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE promo_codes
  SET times_used = times_used + 1
  WHERE code = UPPER(promo_code);
END;
$$ LANGUAGE plpgsql;

-- 4. REL-02: Self-Healing Seat Reclamation inside book_seats_safe
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
