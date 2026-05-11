"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Movie } from "@/lib/types";

interface HeroCarouselProps {
  movies: Movie[];
}

export function HeroCarousel({ movies }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % movies.length);
  }, [movies.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + movies.length) % movies.length);
  }, [movies.length]);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  if (!movies.length) return null;

  const movie = movies[current];

  return (
    <section className="pt-[72px]">
      <div className="relative w-full h-[340px] sm:h-[420px] md:h-[500px] lg:h-[560px] overflow-hidden">
        {/* Background Image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <Image
              src={movie.banner_url || movie.poster_url || "/images/placeholder-banner.jpg"}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            {/* Layered gradient overlays for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FFFFFF] to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={prev}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110 border border-white/10"
          style={{ opacity: 1 }}
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button
          onClick={next}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110 border border-white/10"
          style={{ opacity: 1 }}
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Content overlay */}
        <div className="absolute inset-0 z-10 flex items-end">
          <div className="container-app w-full pb-12 md:pb-16 lg:pb-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl"
              >
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-3 md:mb-4 drop-shadow-xl">
                  {movie.title}
                </h2>

                <div className="flex flex-wrap items-center gap-2.5 md:gap-3 text-sm md:text-base text-white/85 mb-5 md:mb-7">
                  <span className="px-3 py-1 rounded-md bg-white/20 text-white text-xs md:text-sm font-bold backdrop-blur-sm border border-white/10">
                    {movie.rating}
                  </span>
                  <span className="text-white/50">•</span>
                  <span className="font-medium">{movie.language}</span>
                  <span className="text-white/50">•</span>
                  <span className="font-medium">{movie.genre?.join(", ")}</span>
                </div>

                <Link href={`/movie/${movie.slug}`}>
                  <button className="px-8 py-3 md:px-10 md:py-3.5 rounded-xl bg-[#E50914] hover:bg-[#CC0812] text-white text-sm md:text-base font-bold transition-all shadow-xl shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98]">
                    Book Tickets
                  </button>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-6 right-6 md:bottom-8 md:right-12 flex gap-2 z-20">
          {movies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 h-2.5 bg-white shadow-lg"
                  : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
