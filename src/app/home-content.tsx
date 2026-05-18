"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Film, Calendar, SlidersHorizontal, ChevronDown } from "lucide-react";
import type { Movie } from "@/lib/types";
import { LANGUAGES } from "@/lib/constants";

interface HomeContentProps {
  movies: Movie[];
  featuredMovies: Movie[];
}

export function HomeContent({ movies, featuredMovies }: HomeContentProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nowShowing = useMemo(
    () =>
      movies.filter((m) => {
        const rel = new Date(m.release_date);
        rel.setHours(0, 0, 0, 0);
        return rel <= today;
      }),
    [movies]
  );

  const upcoming = useMemo(
    () => movies.filter((m) => new Date(m.release_date) > new Date()),
    [movies]
  );

  // Get this week's releases (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekReleases = useMemo(
    () =>
      nowShowing.filter((m) => {
        const rel = new Date(m.release_date);
        return rel >= weekAgo;
      }).slice(0, 9),
    [nowShowing]
  );

  // Carousel movies — use featured or first 6 showing
  const carouselMovies = useMemo(
    () => (featuredMovies.length > 0 ? featuredMovies : nowShowing).slice(0, 6),
    [featuredMovies, nowShowing]
  );

  return (
    <div className="min-h-screen bg-white">
      {/* ===== HERO CAROUSEL ===== */}
      {carouselMovies.length > 0 && (
        <HeroCarousel movies={carouselMovies} />
      )}

      {/* ===== CONTENT ===== */}
      <div className="flex flex-col items-center gap-10 md:gap-[68px] w-full pt-8 md:pt-12 pb-16 md:pb-24">
        {/* ===== NEW RELEASES ===== */}
        {thisWeekReleases.length > 0 && (
          <section className="w-full max-w-[1264px] mx-auto px-3 sm:px-0">
            <div className="mb-10 md:mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-[#131316]">
                New Releases
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 px-3 sm:px-0">
              {thisWeekReleases.map((movie, i) => (
                <MovieCard key={movie.id} movie={movie} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* ===== ONLY IN THEATRES (Now Showing) ===== */}
        <section className="w-full max-w-[1264px] mx-auto px-3 sm:px-0">


          {/* Filter bar */}
          <FilterBar />

          {nowShowing.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 px-3 sm:px-0">
              {nowShowing.map((movie, i) => (
                <MovieCard key={movie.id} movie={movie} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Film className="w-8 h-8 text-[#0B70D5]" />}
              title="Coming Soon"
              description="New blockbusters arriving soon. Stay tuned for the latest releases."
            />
          )}
        </section>

        {/* ===== COMING SOON ===== */}
        {upcoming.length > 0 && (
          <section className="w-full max-w-[1264px] mx-auto px-3 sm:px-0 pb-16">
            <div className="mb-10 md:mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-[#131316]">
                Coming Soon
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 px-3 sm:px-0">
              {upcoming.map((movie, i) => (
                <MovieCard key={movie.id} movie={movie} index={i} variant="upcoming" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ===== HERO CAROUSEL ===== */
function HeroCarousel({ movies }: { movies: Movie[] }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % movies.length);
    }, 5000);
  }, [movies.length]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const goTo = (idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
    resetTimer();
  };

  const prev = () => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + movies.length) % movies.length);
    resetTimer();
  };

  const next = () => {
    setDirection(1);
    setCurrent((c) => (c + 1) % movies.length);
    resetTimer();
  };

  const movie = movies[current];  return (
    <section className="relative w-full overflow-hidden bg-[#F8F9FA] md:bg-transparent">
      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="hidden md:flex relative px-4 md:px-12 pt-[32px] pb-2 items-center justify-center w-full min-h-[500px] lg:min-h-[550px] overflow-hidden">
        {/* Blurred Background */}
        <div
          className="absolute inset-0 w-full h-full z-0 transition-opacity duration-700"
          style={{
            backgroundImage: `url(${movie.banner_url || movie.poster_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(24px)",
            transform: "scale(1.1)",
          }}
          aria-hidden="true"
        />
        {/* White gradient overlay for seamless blending */}
        <div
          className="absolute inset-0 w-full h-full z-[1]"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.8) 50%, #FFFFFF 100%)",
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-[3] flex flex-row items-center justify-between w-full max-w-[1200px] gap-10">
          {/* Text Side */}
          <motion.div
            key={`desktop-text-${movie.id}`}
            initial={{ opacity: 0, x: direction >= 0 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -40 : 40 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-6 flex-1 pr-8"
          >
            <h2 className="text-5xl lg:text-6xl font-extrabold text-[#131316] tracking-tight leading-[1.1] my-0">
              {movie.title}
            </h2>
            <span className="text-2xl font-bold text-[#131316]">
              {movie.rating} | {movie.genre?.slice(0, 3).join(", ")}
            </span>
            <p className="text-lg text-[#131316] max-w-[700px] line-clamp-3 leading-relaxed">
              {movie.description || "A cinematic experience that will keep you on the edge of your seat. Grab your tickets now to witness the magic on the big screen."}
            </p>
            <div>
              <Link href={`/movie/${movie.slug}`}>
                <button className="btn-book text-lg font-bold px-10 py-4 h-auto rounded-2xl">
                  Book now
                </button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            key={`desktop-poster-${movie.id}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-6 shrink-0"
          >
            <div className="relative w-[288px] h-[432px] rounded-xl overflow-hidden shadow-xl shrink-0">
              <div className="w-full h-full">
                <Image
                  src={movie.poster_url || "/images/placeholder-poster.svg"}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="288px"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prev}
          className="absolute left-[5vw] top-[40%] z-[4] w-10 h-10 flex items-center justify-center cursor-pointer bg-transparent border-0"
          aria-label="Previous movie"
        >
          <ChevronLeft className="w-6 h-6 text-[#131316]/60 hover:text-[#131316]" />
        </button>
        <button
          onClick={next}
          className="absolute right-[5vw] top-[40%] z-[4] w-10 h-10 flex items-center justify-center cursor-pointer bg-transparent border-0"
          aria-label="Next movie"
        >
          <ChevronRight className="w-6 h-6 text-[#131316]/60 hover:text-[#131316]" />
        </button>
      </div>

      {/* ===== MOBILE LAYOUT ===== */}
      <div className="flex md:hidden flex-col w-full px-4 pt-6 pb-2">
        <Link href={`/movie/${movie.slug}`} className="block no-underline">
          <motion.div
            key={`mobile-${movie.id}`}
            initial={{ opacity: 0, x: direction >= 0 ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -20 : 20 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-white rounded-2xl border border-[#E8E8EA] shadow-sm overflow-hidden"
          >
            {/* Banner Image */}
            <div className="relative w-full aspect-[16/9]">
              <Image
                src={movie.banner_url || movie.poster_url || "/images/placeholder-banner.jpg"}
                alt={movie.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            </div>
            {/* Text Content */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-[#131316] mb-1 leading-tight">{movie.title}</h3>
              <p className="text-sm text-[#8E8E93] font-medium">{movie.rating || "UA16+"}</p>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-2 pb-0 mt-4 md:mt-0 md:-mt-8 relative z-[5]">
        {movies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`rounded-full transition-all duration-300 border-0 cursor-pointer ${idx === current
              ? "w-6 h-1.5 md:h-2 bg-[#131316]"
              : "w-1.5 md:w-2 h-1.5 md:h-2 bg-[#D0D0D4] hover:bg-[#A0A0A4]"
              }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

/* ===== FILTER BAR ===== */
function FilterBar() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const filters = ["English", "Hindi", "New Releases", "Re-Releases"];

  return (
    <div className="w-full py-3 mb-6">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {/* Filters button */}
        <button className="filter-pill gap-1.5 pl-2.5 ml-3 sm:ml-0">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          <ChevronDown className="w-4 h-4 rotate-180" />
        </button>

        {/* Language filters */}
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(activeFilter === filter ? null : filter)}
            className={`filter-pill ${activeFilter === filter ? "active" : ""}`}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===== MOVIE CARD ===== */
function MovieCard({ movie, index, variant = "default" }: { movie: Movie; index: number; variant?: "default" | "upcoming" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03 }}
    >
      <Link href={`/movie/${movie.slug}`} className="block no-underline">
        <div className="movie-card h-full">
          {/* Poster */}
          <div className="poster-wrap">
            <Image
              src={movie.poster_url || "/images/placeholder-poster.svg"}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 16vw"
            />
          </div>

          {/* Info */}
          <div className="card-info">
            <h5 className="card-title title-case">{movie.title}</h5>
            <span className="card-meta">
              {movie.rating} | {movie.language}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ===== EMPTY STATE ===== */
function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 rounded-2xl border border-[#E8E8EA] bg-[#F5F5F6]"
    >
      <div className="w-16 h-16 rounded-2xl bg-[#E2F1FE] flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[#131316] mb-1.5">{title}</h3>
      <p className="text-[#545459] text-sm max-w-sm text-center leading-relaxed">{description}</p>
    </motion.div>
  );
}
