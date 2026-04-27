"use client";

import { useState, useMemo } from "react";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { NowShowing } from "@/components/home/now-showing";
import { UpcomingMovies } from "@/components/home/upcoming-movies";
import { SearchFilter } from "@/components/home/search-filter";
import { PageTransition } from "@/components/shared/page-transition";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { APP_NAME } from "@/lib/constants";
import type { Movie } from "@/lib/types";

interface HomeContentProps {
  movies: Movie[];
  featuredMovies: Movie[];
}

export function HomeContent({ movies, featuredMovies }: HomeContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);

  // Compare only the date portion (strip time) to avoid timezone-induced
  // misclassification where e.g. "2026-04-26" parses as midnight UTC and
  // ends up "in the future" for users in UTC+5:30 earlier in the day.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nowShowing = useMemo(() => {
    let filtered = movies.filter((m) => {
      const rel = new Date(m.release_date);
      rel.setHours(0, 0, 0, 0);
      return rel <= today;
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.genre.some((g) => g.toLowerCase().includes(q)) ||
          m.language.toLowerCase().includes(q)
      );
    }

    if (activeGenre) {
      filtered = filtered.filter((m) => m.genre.includes(activeGenre));
    }

    if (activeLanguage) {
      filtered = filtered.filter((m) => m.language === activeLanguage);
    }

    return filtered;
  }, [movies, searchQuery, activeGenre, activeLanguage]);

  const upcoming = useMemo(
    () => movies.filter((m) => new Date(m.release_date) > new Date()),
    [movies]
  );

  return (
    <PageTransition>
      {/* Hero Carousel — always renders with data */}
      <HeroCarousel movies={featuredMovies} />

      {/* Search & Filter */}
      <SearchFilter
        onSearch={setSearchQuery}
        onGenreFilter={setActiveGenre}
        onLanguageFilter={setActiveLanguage}
        activeGenre={activeGenre}
        activeLanguage={activeLanguage}
      />

      {/* Now Showing */}
      <NowShowing movies={nowShowing} />

      {/* Upcoming */}
      <UpcomingMovies movies={upcoming} />

    </PageTransition>
  );
}
