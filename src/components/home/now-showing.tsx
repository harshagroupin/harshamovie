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
        <p className="text-muted italic">No movies currently showing. Please check back later!</p>
      </section>
    );
  }

  return (
    <section id="now-showing" className="container-app py-16">
      <ScrollReveal>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold">
              Now Showing
            </h2>
            <p className="text-muted text-sm mt-1">Currently playing at Harsh A Movie</p>
          </div>
          <div className="h-1 w-20 gradient-accent rounded-full hidden md:block" />
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {movies.map((movie, i) => (
          <ScrollReveal key={movie.id} delay={i * 0.05}>
            <MovieCard movie={movie} index={i} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
