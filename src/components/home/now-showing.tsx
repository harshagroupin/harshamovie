"use client";

import { MovieCard } from "./movie-card";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { Film, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { Movie } from "@/lib/types";

interface NowShowingProps {
  movies: Movie[];
}

export function NowShowing({ movies }: NowShowingProps) {
  if (!movies.length) {
    return (
      <section id="now-showing" className="container-app py-16">
        <ScrollReveal>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-7 rounded-full bg-[#E50914]" />
              <h2 className="font-display text-2xl md:text-3xl font-bold text-[#1A1A2E]">
                Now Showing
              </h2>
            </div>
            <p className="text-[#8E8E93] text-sm md:text-base mt-1 ml-[19px]">Currently playing at Harsh A Movie</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <motion.div
            className="relative overflow-hidden rounded-2xl p-10 md:p-14 text-center"
            style={{
              background: "linear-gradient(135deg, #fafafa 0%, #f5f5f7 50%, #fafafa 100%)",
              border: "1px solid #ECECEE",
            }}
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.3 }}
          >
            {/* Subtle decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-50 blur-[60px]"
              style={{ background: "radial-gradient(circle, #E50914 0%, transparent 70%)" }}
            />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-30 blur-[50px]"
              style={{ background: "radial-gradient(circle, #D4AF37 0%, transparent 70%)" }}
            />

            <div className="relative z-10 flex flex-col items-center text-center">
              <motion.div
                className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #E50914 0%, #B20710 100%)",
                  boxShadow: "0 8px 32px rgba(229,9,20,0.25)",
                }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Film className="w-9 h-9 text-white" />
              </motion.div>

              <h3 className="font-display text-xl md:text-2xl font-bold text-[#1A1A2E] mb-2">
                New Movies Coming Soon!
              </h3>
              <p className="text-[#8E8E93] text-sm md:text-base max-w-md mx-auto leading-relaxed mb-6">
                We&apos;re preparing an amazing lineup of movies for you. Stay tuned for the latest Bollywood and Hollywood blockbusters!
              </p>

              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E50914]/5 border border-[#E50914]/10">
                <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
                <span className="text-xs font-semibold text-[#E50914]">
                  Check back for updates
                </span>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      </section>
    );
  }

  return (
    <section id="now-showing" className="container-app pt-10 pb-14">
      <ScrollReveal>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-7 rounded-full bg-[#E50914]" />
            <h2 className="font-display text-2xl md:text-3xl font-bold text-[#1A1A2E]">
              Now Showing
            </h2>
          </div>
          <p className="text-[#8E8E93] text-sm md:text-base mt-1 ml-[19px]">Currently playing at Harsh A Movie</p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-6">
        {movies.map((movie, i) => (
          <ScrollReveal key={movie.id} delay={i * 0.05}>
            <MovieCard movie={movie} index={i} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
