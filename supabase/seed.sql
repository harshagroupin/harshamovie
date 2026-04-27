-- ====================================================
-- HARSH A MOVIE — Seed Data
-- Run AFTER schema.sql in Supabase SQL Editor
-- ====================================================

-- ====================================================
-- SEED MOVIES
-- ====================================================
INSERT INTO movies (title, slug, description, poster_url, banner_url, trailer_url, genre, duration, language, rating, release_date, is_featured, is_active) VALUES
(
  'Pushpa 2: The Rule',
  'pushpa-2-the-rule',
  'Pushpa Raj returns with a vengeance in this high-octane sequel. As he rises in the smuggling syndicate, his enemies grow stronger and more dangerous. With jaw-dropping action sequences and a gripping storyline, Pushpa must navigate treacherous alliances while protecting his family and legacy.',
  '/images/placeholder-poster.svg',
  '/images/placeholder-banner.svg',
  'https://www.youtube.com/watch?v=Q1NKMPhP8PY',
  ARRAY['Action', 'Drama', 'Thriller'],
  179,
  'Telugu',
  'UA',
  '2025-12-05',
  true,
  true
),
(
  'Singham Again',
  'singham-again',
  'Bajirao Singham embarks on his most ambitious mission yet. When a global threat emerges that endangers national security, Singham assembles an elite team of officers to take on the challenge. Packed with intense action, patriotic fervor, and a stellar ensemble cast.',
  '/images/placeholder-poster.svg',
  '/images/placeholder-banner.svg',
  'https://www.youtube.com/watch?v=singham-trailer',
  ARRAY['Action', 'Drama'],
  162,
  'Hindi',
  'UA',
  '2025-11-01',
  true,
  true
),
(
  'Inception: Reloaded',
  'inception-reloaded',
  'A team of dream infiltrators takes on their most complex assignment — planting an idea within the subconscious of a powerful CEO. As they navigate deeper layers of dreams within dreams, the line between reality and illusion blurs dangerously. A mind-bending thriller that will keep you questioning everything.',
  '/images/placeholder-poster.svg',
  '/images/placeholder-banner.svg',
  'https://www.youtube.com/watch?v=inception-trailer',
  ARRAY['Sci-Fi', 'Thriller', 'Action'],
  148,
  'English',
  'UA',
  '2025-10-15',
  true,
  true
),
(
  'Stree 3',
  'stree-3',
  'Chanderi is haunted once again — but this time the threat is far more terrifying than anyone imagined. The gang reunites with new allies to face an ancient evil that has awakened. Blending horror with signature humor, this sequel raises the stakes with spectacular visual effects and hilarious twists.',
  '/images/placeholder-poster.svg',
  '/images/placeholder-banner.svg',
  'https://www.youtube.com/watch?v=stree3-trailer',
  ARRAY['Horror', 'Comedy'],
  145,
  'Hindi',
  'UA',
  '2025-08-15',
  false,
  true
),
(
  'RRR 2: Rise Again',
  'rrr-2-rise-again',
  'The legendary warriors return in an epic saga set against the backdrop of India''s freedom struggle. With groundbreaking action choreography and an emotional storyline that bridges history and fiction, this sequel promises to surpass the original in every way. A visual spectacle not to be missed on the big screen.',
  '/images/placeholder-poster.svg',
  '/images/placeholder-banner.svg',
  'https://www.youtube.com/watch?v=rrr2-trailer',
  ARRAY['Action', 'Drama', 'Adventure'],
  195,
  'Telugu',
  'UA',
  '2026-01-26',
  true,
  true
),
(
  'The Dark Knight Returns',
  'the-dark-knight-returns',
  'Gotham City faces its darkest hour as a new breed of criminal threatens to unravel everything Batman has built. Forced out of retirement, Bruce Wayne must confront both his past demons and a formidable adversary who knows all his secrets. A gritty, character-driven thriller.',
  '/images/placeholder-poster.svg',
  '/images/placeholder-banner.svg',
  'https://www.youtube.com/watch?v=dark-knight-trailer',
  ARRAY['Action', 'Thriller', 'Crime'],
  165,
  'English',
  'A',
  '2026-03-20',
  false,
  true
);

-- ====================================================
-- SEED SHOWTIMES (Multiple per movie, spanning next 7 days)
-- ====================================================
DO $$
DECLARE
  m_record RECORD;
  d INTEGER;
BEGIN
  FOR m_record IN SELECT id FROM movies WHERE is_active = true LOOP
    FOR d IN 0..6 LOOP
      INSERT INTO showtimes (movie_id, screen_name, show_date, show_time, price, total_seats) VALUES
      (m_record.id, 'Screen 1', CURRENT_DATE + d, '10:00', 150, 100),
      (m_record.id, 'Screen 1', CURRENT_DATE + d, '14:00', 200, 100),
      (m_record.id, 'Screen 1', CURRENT_DATE + d, '18:00', 250, 100),
      (m_record.id, 'IMAX', CURRENT_DATE + d, '21:00', 350, 100);
    END LOOP;
  END LOOP;
END $$;

-- ====================================================
-- SEED PROMO CODES
-- ====================================================
INSERT INTO promo_codes (code, discount_type, discount_value, usage_limit, is_active) VALUES
('FIRST50', 'percentage', 50, 100, true),
('FLAT100', 'fixed', 100, 50, true),
('WELCOME', 'percentage', 25, 200, true);
