"use client";

import { MovieCard } from "./movie-card";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import type { Movie } from "@/lib/types";

interface NowShowingProps {
  movies: Movie[];
}

export function NowShowing({ movies }: NowShowingProps) {
  if (!movies.length) {
    return (
      <section id="now-showing" className="container-app py-16 text-center">
        <div className="max-w-md mx-auto py-12 px-6 rounded-2xl bg-[#F8F8FA] border border-[#E5E5EA]">
          <div className="w-16 h-16 rounded-full bg-[#F0F0F2] flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎬</span>
          </div>
          <p className="text-[#636366] text-base font-medium">No movies currently showing</p>
          <p className="text-[#8E8E93] text-sm mt-1">Please check back later!</p>
        </div>
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
