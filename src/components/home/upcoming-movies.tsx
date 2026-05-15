"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Clock, Sparkles } from "lucide-react";
import { MovieCard } from "./movie-card";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { motion } from "framer-motion";
import type { Movie } from "@/lib/types";

interface UpcomingMoviesProps {
  movies: Movie[];
}

export function UpcomingMovies({ movies }: UpcomingMoviesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!movies.length) {
    return (
      <section id="upcoming" className="container-app py-10">
        <ScrollReveal>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-7 rounded-full bg-[#E50914]" />
              <h2 className="font-display text-2xl md:text-3xl font-bold text-[#1A1A2E]">
                Coming Soon
              </h2>
            </div>
            <p className="text-[#8E8E93] text-sm md:text-base mt-1 ml-[19px]">Upcoming releases you don&apos;t want to miss</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <motion.div
            className="relative overflow-hidden rounded-2xl p-8 md:p-12 text-center"
            style={{
              background: "linear-gradient(135deg, #FFF8F0 0%, #FFF5F5 50%, #FFF8F0 100%)",
              border: "1px solid #FFE8D6",
            }}
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.3 }}
          >
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-40 blur-[50px]"
              style={{ background: "radial-gradient(circle, #FF9500 0%, transparent 70%)" }}
            />

            <div className="relative z-10 flex flex-col items-center text-center">
              <motion.div
                className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)",
                  boxShadow: "0 8px 24px rgba(255,149,0,0.25)",
                }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Clock className="w-7 h-7 text-white" />
              </motion.div>

              <h3 className="font-display text-lg md:text-xl font-bold text-[#1A1A2E] mb-2">
                Exciting Releases Loading...
              </h3>
              <p className="text-[#8E8E93] text-sm max-w-sm mx-auto leading-relaxed mb-5">
                We&apos;re curating the hottest upcoming movies for you. Big releases are on the way!
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF9500]/8 border border-[#FF9500]/15">
                <Sparkles className="w-3 h-3 text-[#FF9500]" />
                <span className="text-xs font-semibold text-[#FF9500]">
                  Stay tuned for updates
                </span>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      </section>
    );
  }

  return (
    <section id="upcoming" className="pb-16">
      <div className="container-app">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-1 h-7 rounded-full bg-[#E50914]" />
                <h2 className="font-display text-2xl md:text-3xl font-bold text-[#1A1A2E]">
                  Coming Soon
                </h2>
              </div>
              <p className="text-[#8E8E93] text-sm md:text-base mt-1 ml-[19px]">Upcoming releases you don&apos;t want to miss</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => scroll("left")}
                className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center hover:bg-[#ECECEE] transition-all text-[#636366] hover:text-[#1A1A2E] hover:shadow-md active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center hover:bg-[#ECECEE] transition-all text-[#636366] hover:text-[#1A1A2E] hover:shadow-md active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        >
          {movies.map((movie, i) => (
            <div key={movie.id} className="min-w-[180px] md:min-w-[220px] snap-start">
              <MovieCard movie={movie} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
