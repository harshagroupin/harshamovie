-- ====================================================
-- HARSH A MOVIE — COMPLETE DATABASE SETUP
-- Run this ONCE in Supabase SQL Editor
-- This includes: Schema + Indexes + RLS + Storage + Seed Data
-- ====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================
-- 1. MOVIES TABLE
-- ====================================================
CREATE TABLE IF NOT EXISTS movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  poster_url TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  trailer_url TEXT DEFAULT '',
  genre TEXT[] DEFAULT '{}',
  duration INTEGER DEFAULT 120,
  language TEXT DEFAULT 'Hindi',
  rating TEXT DEFAULT 'UA',
  release_date DATE DEFAULT CURRENT_DATE,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movies_slug ON movies(slug);
CREATE INDEX IF NOT EXISTS idx_movies_active ON movies(is_active);
CREATE INDEX IF NOT EXISTS idx_movies_featured ON movies(is_featured);

-- ====================================================
-- 2. SHOWTIMES TABLE
-- ====================================================
CREATE TABLE IF NOT EXISTS showtimes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE NOT NULL,
  screen_name TEXT DEFAULT 'Screen 1',
  show_date DATE NOT NULL,
  show_time TIME NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 200,
  total_seats INTEGER DEFAULT 100,
  booked_seats JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_showtimes_movie ON showtimes(movie_id);
CREATE INDEX IF NOT EXISTS idx_showtimes_date ON showtimes(show_date);

-- ====================================================
-- 3. BOOKINGS TABLE
-- ====================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id TEXT UNIQUE NOT NULL,
  showtime_id UUID REFERENCES showtimes(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  selected_seats JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  promo_code_used TEXT,
  payment_mode TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'completed',
  booking_status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_booking_id ON bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_showtime ON bookings(showtime_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);

-- ====================================================
-- 4. PROMO CODES TABLE
-- ====================================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  usage_limit INTEGER DEFAULT 0,
  times_used INTEGER DEFAULT 0,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_promo_code ON promo_codes(code);

-- ====================================================
-- 5. ADMINS TABLE
-- ====================================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'admin'
);

-- ====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ====================================================

ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE showtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Movies: public read, admin write
CREATE POLICY "Movies are viewable by everyone" ON movies
  FOR SELECT USING (true);
CREATE POLICY "Movies are editable by admins" ON movies
  FOR ALL USING (auth.uid() IN (SELECT id FROM admins));

-- Showtimes: public read, admin write
CREATE POLICY "Showtimes are viewable by everyone" ON showtimes
  FOR SELECT USING (true);
CREATE POLICY "Showtimes are editable by admins" ON showtimes
  FOR ALL USING (auth.uid() IN (SELECT id FROM admins));

-- Bookings: public insert, admin read/update
CREATE POLICY "Anyone can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (auth.uid() IN (SELECT id FROM admins));
CREATE POLICY "Admins can update bookings" ON bookings
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM admins));

-- Promo codes: public read, admin write
CREATE POLICY "Promo codes are viewable by everyone" ON promo_codes
  FOR SELECT USING (true);
CREATE POLICY "Promo codes are editable by admins" ON promo_codes
  FOR ALL USING (auth.uid() IN (SELECT id FROM admins));

-- Admins: self-read only
CREATE POLICY "Admins can view admin table" ON admins
  FOR SELECT USING (auth.uid() = id);

-- ====================================================
-- 7. STORAGE BUCKETS (for image uploads)
-- ====================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('movie-posters', 'movie-posters', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('movie-banners', 'movie-banners', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public poster access" ON storage.objects
  FOR SELECT USING (bucket_id = 'movie-posters');
CREATE POLICY "Admin poster upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'movie-posters' AND auth.uid() IN (SELECT id FROM admins));

CREATE POLICY "Public banner access" ON storage.objects
  FOR SELECT USING (bucket_id = 'movie-banners');
CREATE POLICY "Admin banner upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'movie-banners' AND auth.uid() IN (SELECT id FROM admins));

-- ====================================================
-- 8. SEED PROMO CODES
-- ====================================================
INSERT INTO promo_codes (code, discount_type, discount_value, usage_limit, is_active) VALUES
('FIRST50', 'percentage', 50, 100, true),
('FLAT100', 'fixed', 100, 50, true),
('WELCOME', 'percentage', 25, 200, true)
ON CONFLICT (code) DO NOTHING;

-- ====================================================
-- DONE! Ab admin user Supabase Dashboard se manually banao:
-- 1. Supabase > Authentication > Users > Add User
-- 2. User ka UUID copy karo
-- 3. SQL Editor me ye run karo (apna UUID aur email daalke):
--
--    INSERT INTO admins (id, email, role) 
--    VALUES ('UUID-HERE', 'EMAIL-HERE', 'admin');
--
-- ====================================================
