"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDown, Film, Sparkles } from "lucide-react";
import type { Movie } from "@/lib/types";

interface MovieGridProps {
  movies: Movie[];
  title: string;
  subtitle: string;
  emptyIcon?: "film" | "clock";
  emptyTitle?: string;
  emptyDescription?: string;
  initialCount?: number;
}

export function MovieGrid({
  movies,
  title,
  subtitle,
  emptyIcon = "film",
  emptyTitle = "No movies available",
  emptyDescription = "Check back soon for updates!",
  initialCount = 12,
}: MovieGridProps) {
  const [showAll, setShowAll] = useState(false);
  const displayMovies = showAll ? movies : movies.slice(0, initialCount);
  const hasMore = movies.length > initialCount;

  if (!movies.length) {
    return (
      <section className="py-10">
        <div className="container-app">
          {/* Section header */}
          <div className="mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-[#1A1A2E] mb-1">
              {title}
            </h2>
            <p className="text-[#8E8E93] text-sm">{subtitle}</p>
          </div>

          {/* Empty state */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl bg-[#FAFAFA] border border-[#ECECEE]"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: emptyIcon === "film"
                  ? "linear-gradient(135deg, #E50914 0%, #B20710 100%)"
                  : "linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)",
                boxShadow: emptyIcon === "film"
                  ? "0 6px 20px rgba(229,9,20,0.2)"
                  : "0 6px 20px rgba(255,149,0,0.2)",
              }}
            >
              <Film className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#1A1A2E] mb-1.5">
              {emptyTitle}
            </h3>
            <p className="text-[#8E8E93] text-sm max-w-sm text-center leading-relaxed">
              {emptyDescription}
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-10">
      <div className="container-app">
        {/* Section header */}
        <div className="mb-6 md:mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[#1A1A2E] mb-1">
            {title}
          </h2>
          <p className="text-[#8E8E93] text-sm">{subtitle}</p>
        </div>

        {/* Movie grid — 6 per row on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
          {displayMovies.map((movie, i) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.03 }}
            >
              <Link href={`/movie/${movie.slug}`} className="group block">
                <div className="rounded-xl overflow-hidden bg-white border border-[#ECECEE] hover:border-[#D0D0D5] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:-translate-y-1">
                  {/* Poster */}
                  <div className="relative w-full aspect-[2/3] overflow-hidden bg-[#F0F0F2]">
                    <Image
                      src={movie.poster_url || "/images/placeholder-poster.svg"}
                      alt={movie.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 16vw"
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Book Now on hover */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <div className="w-full py-2 rounded-lg bg-[#E50914] text-white text-xs font-bold text-center shadow-lg">
                        Book Now
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="px-3 py-3">
                    <h3 className="font-semibold text-[13px] md:text-[14px] text-[#1A1A2E] leading-snug truncate group-hover:text-[#E50914] transition-colors">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {movie.rating && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F0F0F2] text-[#636366] border border-[#E5E5EA]">
                          {movie.rating}
                        </span>
                      )}
                      <span className="text-[11px] text-[#8E8E93] truncate">
                        {movie.language}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Show More button */}
        {hasMore && !showAll && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-[#E5E5EA] text-[#636366] text-[14px] font-semibold hover:border-[#C7C7CC] hover:text-[#1A1A2E] hover:bg-[#F5F5F7] transition-all hover:shadow-sm active:scale-[0.98]"
            >
              Show More
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {showAll && hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowAll(false)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-[#E5E5EA] text-[#636366] text-[14px] font-semibold hover:border-[#C7C7CC] hover:text-[#1A1A2E] hover:bg-[#F5F5F7] transition-all hover:shadow-sm active:scale-[0.98]"
            >
              Show Less
              <ChevronDown className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
