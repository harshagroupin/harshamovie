"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieCard } from "./movie-card";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
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
      <section id="upcoming" className="container-app py-10 text-center">
        <div className="max-w-md mx-auto py-10 px-6 rounded-2xl bg-gradient-to-br from-[#FFF5F5] to-[#FFF0F0] border border-[#FFE0E0]">
          <div className="w-14 h-14 rounded-full bg-[#FFECEC] flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">🍿</span>
          </div>
          <p className="text-[#E50914] text-base font-semibold">No upcoming movies scheduled</p>
          <p className="text-[#8E8E93] text-sm mt-1">Stay tuned for exciting releases!</p>
        </div>
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
