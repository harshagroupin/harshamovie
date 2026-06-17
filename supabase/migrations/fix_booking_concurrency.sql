-- RPC for safely booking seats (Concurrency safe with self-healing cleanup)
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
