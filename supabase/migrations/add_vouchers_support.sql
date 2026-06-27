-- ====================================================
-- VOUCHERS & USER VOUCHERS — SEPARATE TABLES
-- Movie Tickets = bookings table (already exists)
-- Voucher Details = vouchers + user_vouchers tables (NEW)
-- Run this in Supabase SQL Editor
-- ====================================================

-- ====================================================
-- 1. VOUCHERS TABLE (Admin creates vouchers here)
-- ====================================================
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT NOT NULL,
  terms TEXT DEFAULT '',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expiry_date TIMESTAMPTZ,
  usage_limit INTEGER DEFAULT 0,
  times_used INTEGER DEFAULT 0,
  limit_per_user INTEGER DEFAULT 0,
  voucher_type TEXT NOT NULL DEFAULT 'ticket',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vouchers_active ON vouchers(is_active);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_expiry ON vouchers(expiry_date);

-- Ensure columns exist in case the table was created before this migration
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS usage_limit INTEGER DEFAULT 0;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS limit_per_user INTEGER DEFAULT 0;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS voucher_type TEXT NOT NULL DEFAULT 'ticket';

-- ====================================================
-- 2. USER_VOUCHERS TABLE (User purchased vouchers)
--    This is SEPARATE from bookings table
--    bookings = movie tickets
--    user_vouchers = voucher purchases
-- ====================================================
CREATE TABLE IF NOT EXISTS user_vouchers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL,
  voucher_code TEXT NOT NULL,
  voucher_title TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'initiated' 
    CHECK (payment_status IN ('initiated', 'pending', 'completed', 'failed')),
  payment_mode TEXT DEFAULT 'paytm',
  paytm_order_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_uv_email ON user_vouchers(email);
CREATE INDEX IF NOT EXISTS idx_uv_order_id ON user_vouchers(paytm_order_id);
CREATE INDEX IF NOT EXISTS idx_uv_phone ON user_vouchers(phone);
CREATE INDEX IF NOT EXISTS idx_uv_code ON user_vouchers(voucher_code);
CREATE INDEX IF NOT EXISTS idx_uv_status ON user_vouchers(payment_status);

-- ====================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ====================================================
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vouchers ENABLE ROW LEVEL SECURITY;

-- Drop if re-running
DROP POLICY IF EXISTS "Admins can manage vouchers" ON vouchers;
DROP POLICY IF EXISTS "Public can view active vouchers" ON vouchers;
DROP POLICY IF EXISTS "Admins can view all user vouchers" ON user_vouchers;
DROP POLICY IF EXISTS "Admins can update user vouchers" ON user_vouchers;
DROP POLICY IF EXISTS "Admins can insert user vouchers" ON user_vouchers;
DROP POLICY IF EXISTS "Service role can manage user vouchers" ON user_vouchers;

-- Vouchers: Admins full access, public can view active only
CREATE POLICY "Admins can manage vouchers" ON vouchers
  FOR ALL USING (auth.uid() IN (SELECT id FROM admins));

CREATE POLICY "Public can view active vouchers" ON vouchers
  FOR SELECT USING (is_active = true);

-- User Vouchers: Admins can view & update
CREATE POLICY "Admins can view all user vouchers" ON user_vouchers
  FOR SELECT USING (auth.uid() IN (SELECT id FROM admins));

CREATE POLICY "Admins can update user vouchers" ON user_vouchers
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM admins));

CREATE POLICY "Admins can insert user vouchers" ON user_vouchers
  FOR INSERT WITH CHECK (true);

-- ====================================================
-- 4. STORAGE BUCKETS (Separate folders)
--    movie-posters = Movie poster images (already exists)
--    movie-banners = Movie banner images (already exists)  
--    vouchers      = Voucher banner images (NEW)
-- ====================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vouchers', 'vouchers', true) 
ON CONFLICT DO NOTHING;

-- Storage policies for vouchers bucket
DROP POLICY IF EXISTS "Public vouchers access" ON storage.objects;
DROP POLICY IF EXISTS "Admin vouchers upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin vouchers delete" ON storage.objects;

CREATE POLICY "Public vouchers access" ON storage.objects
  FOR SELECT USING (bucket_id = 'vouchers');

CREATE POLICY "Admin vouchers upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vouchers' 
    AND auth.uid() IN (SELECT id FROM admins)
  );

CREATE POLICY "Admin vouchers delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'vouchers' 
    AND auth.uid() IN (SELECT id FROM admins)
  );

-- ====================================================
-- 5. FUNCTION TO INCREMENT VOUCHER USAGE
-- ====================================================
CREATE OR REPLACE FUNCTION increment_voucher_usage(p_voucher_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE vouchers
  SET times_used = times_used + 1
  WHERE id = p_voucher_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================
-- 6. FUNCTION TO RELEASE EXPIRED BOOKINGS/SEATS (> 15 MINS)
-- ====================================================
CREATE OR REPLACE FUNCTION release_expired_bookings()
RETURNS VOID AS $$
DECLARE
  r RECORD;
  seat_text_array TEXT[];
BEGIN
  -- Find all pending bookings created more than 15 minutes ago
  FOR r IN 
    SELECT id, booking_id, showtime_id, selected_seats 
    FROM bookings 
    WHERE booking_status = 'pending' 
      AND created_at < NOW() - INTERVAL '15 minutes'
  LOOP
    -- Convert jsonb array of seats to TEXT[]
    SELECT ARRAY(SELECT jsonb_array_elements_text(r.selected_seats)) INTO seat_text_array;
    
    -- Release seats using existing safe function
    PERFORM release_seats_safe(r.showtime_id, seat_text_array);
    
    -- Cancel booking
    UPDATE bookings 
    SET booking_status = 'cancelled', payment_status = 'failed' 
    WHERE id = r.id;
    
    -- Mark transaction as expired
    UPDATE payment_transactions
    SET status = 'expired'
    WHERE booking_id = r.booking_id AND status IN ('initiated', 'pending');
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


