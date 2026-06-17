-- RPC for safely booking seats (Concurrency safe)
CREATE OR REPLACE FUNCTION book_seats_safe(
  p_showtime_id UUID,
  p_seats TEXT[]
) RETURNS VOID AS $$
DECLARE
  v_current JSONB;
  v_current_seats TEXT[];
  v_new_seats TEXT[];
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
