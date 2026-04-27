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
      <section id="upcoming" className="container-app py-16 text-center">
        <p className="text-muted italic">No upcoming movies scheduled. Stay tuned!</p>
      </section>
    );
  }

  return (
    <section id="upcoming" className="py-16">
      <div className="container-app">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold">
                Coming Soon
              </h2>
              <p className="text-muted text-sm mt-1">Upcoming releases you don&apos;t want to miss</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => scroll("left")}
                className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center hover:bg-surface-lighter transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center hover:bg-surface-lighter transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
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
