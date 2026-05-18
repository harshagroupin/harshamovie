"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Movie } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MovieCardProps {
  movie: Movie;
  variant?: "poster" | "compact";
  index?: number;
}

export function MovieCard({ movie, variant = "poster", index = 0 }: MovieCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/movie/${movie.slug}`} className="group block">
        {/* Card Container with shadow & hover */}
        <div className="rounded-xl md:rounded-2xl overflow-hidden bg-white shadow-[0_2px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all duration-400 hover:-translate-y-1">
          {/* Poster Image */}
          <div className={cn(
            "relative w-full overflow-hidden bg-[#F0F0F2]",
            variant === "poster" ? "aspect-[2/3]" : "aspect-[16/9]"
          )}>
            <Image
              src={movie.poster_url || "/images/placeholder-poster.jpg"}
              alt={movie.title}
              fill
              className="object-cover transition-transform duration-600 group-hover:scale-105"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Rating badge top-right */}
            {movie.rating && (
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[11px] font-bold border border-white/10">
                {movie.rating}
              </div>
            )}

            {/* Book Now on hover */}
            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <div className="w-full py-2 rounded-lg bg-[#E50914] text-white text-xs md:text-sm font-bold text-center shadow-lg">
                Book Now
              </div>
            </div>
          </div>

          {/* Info below poster */}
          <div className="px-3 py-3 md:px-4 md:py-3.5">
            <h3 className="font-semibold text-[14px] md:text-[15px] text-[#1A1A2E] leading-snug truncate group-hover:text-[#E50914] transition-colors capitalize">
              {movie.title}
            </h3>
            <p className="text-xs md:text-[13px] text-[#545459] mt-1 truncate">
              {movie.genre?.join(" • ") || movie.language}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
