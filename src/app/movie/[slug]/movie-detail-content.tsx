"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Globe, Star, Calendar, Play, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageTransition } from "@/components/shared/page-transition";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { useBookingStore } from "@/hooks/use-booking-store";
import { formatDate, formatTime, formatCurrency, getGenreColor, getRatingBadge } from "@/lib/utils";
import type { Movie, Showtime } from "@/lib/types";

interface Props {
  movie: Movie;
  showtimes: Showtime[];
}

export function MovieDetailContent({ movie, showtimes }: Props) {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { setMovie, setShowtime } = useBookingStore();

  // Group showtimes by date
  const dateGroups = showtimes.reduce((acc, st) => {
    const date = st.show_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(st);
    return acc;
  }, {} as Record<string, Showtime[]>);

  const dates = Object.keys(dateGroups).sort();
  const activeDate = selectedDate || dates[0] || null;

  const handleSelectShowtime = (st: Showtime) => {
    setMovie({ id: movie.id, title: movie.title, poster_url: movie.poster_url });
    setShowtime(st);
  };

  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&\s?]+)/);
    return match?.[1];
  };

  return (
    <PageTransition>
      {/* Banner Hero — with light gradient */}
      <div className="relative w-full h-[350px] md:h-[450px] lg:h-[520px] overflow-hidden">
        <Image
          src={movie.banner_url || movie.poster_url || "/images/placeholder-banner.jpg"}
          alt={movie.title}
          fill
          className="object-cover"
          priority
        />
        {/* Blurred background effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-white/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-white/20" />

        {/* Back button */}
        <div className="absolute top-20 left-0 right-0 z-10">
          <div className="container-app">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#131316]/60 hover:text-[#131316] text-sm transition-colors no-underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </div>
      </div>

      {/* Movie Info */}
      <div className="container-app -mt-44 md:-mt-52 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 md:gap-10">
          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-52 md:w-72 shrink-0"
          >
            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-[#E8E8EA]">
              <Image
                src={movie.poster_url || "/images/placeholder-poster.jpg"}
                alt={movie.title}
                fill
                className="object-cover"
              />
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-1 pt-4 md:pt-8"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#131316] mb-5 leading-tight">
              {movie.title}
            </h1>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-5">
              <span className="px-3 py-1 rounded-md text-sm font-bold bg-[#131316] text-white">{movie.rating}</span>
              <span className="flex items-center gap-2 text-[14px] text-[#545459]">
                <Clock className="w-4 h-4" /> {movie.duration} min
              </span>
              <span className="flex items-center gap-2 text-[14px] text-[#545459]">
                <Globe className="w-4 h-4" /> {movie.language}
              </span>
              <span className="flex items-center gap-2 text-[14px] text-[#545459]">
                <Calendar className="w-4 h-4" /> {formatDate(movie.release_date)}
              </span>
            </div>

            {/* Genre chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genre?.map((g) => (
                <span key={g} className="px-3 py-1 rounded-full text-sm font-medium border border-[#E8E8EA] text-[#545459] bg-[#F5F5F6]">
                  {g}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-[#545459] text-[15px] md:text-base leading-relaxed mb-7 max-w-2xl">
              {movie.description}
            </p>

            {/* Trailer + Book Now buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="#showtimes">
                <button className="btn-book">
                  Book Now
                </button>
              </Link>
              {movie.trailer_url && (
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl gap-2.5 text-[15px] px-8 py-6 border-[#D0D0D4] text-[#545459] hover:bg-[#F5F5F6] hover:text-[#131316] hover:border-[#131316] transition-all"
                  onClick={() => setTrailerOpen(true)}
                >
                  <Play className="w-5 h-5 fill-current" />
                  Watch Trailer
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Showtimes Section */}
      <ScrollReveal>
        <div id="showtimes" className="container-app py-14">
          <div className="border-t border-[#E8E8EA] pt-10 mb-8" />
          <h2 className="text-2xl md:text-3xl font-bold text-[#131316] mb-8 flex items-center gap-3">
            <Star className="w-6 h-6 text-[#0B70D5]" />
            Select Showtime
          </h2>

          {dates.length === 0 ? (
            <div className="rounded-2xl p-10 text-center border border-[#E8E8EA] bg-[#F5F5F6]">
              <div className="w-16 h-16 rounded-full bg-[#E2F1FE] flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7 text-[#0B70D5]" />
              </div>
              <p className="text-[#545459] text-base">No showtimes available for this movie.</p>
            </div>
          ) : (
            <>
              {/* Date Selector */}
              <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {dates.map((date) => {
                  const d = new Date(date);
                  const isActive = date === activeDate;
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`shrink-0 flex flex-col items-center px-6 py-4 rounded-xl border transition-all ${
                        isActive
                          ? "bg-[#E2F1FE] border-[#0B70D5] text-[#0B70D5] shadow-sm"
                          : "bg-white border-[#E8E8EA] text-[#545459] hover:border-[#D0D0D4] hover:text-[#131316]"
                      }`}
                    >
                      <span className="text-[11px] uppercase tracking-wider font-semibold">
                        {d.toLocaleDateString("en-IN", { weekday: "short" })}
                      </span>
                      <span className="text-xl font-bold mt-0.5">{d.getDate()}</span>
                      <span className="text-[11px]">
                        {d.toLocaleDateString("en-IN", { month: "short" })}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Time Slots */}
              {activeDate && dateGroups[activeDate] && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {dateGroups[activeDate].map((st) => {
                    const bookedCount = (st.booked_seats as string[])?.length || 0;
                    const availableSeats = st.total_seats - bookedCount;
                    const isFull = availableSeats <= 0;

                    return (
                      <Link
                        key={st.id}
                        href={isFull ? "#" : `/booking/seats?showtime=${st.id}`}
                        onClick={() => !isFull && handleSelectShowtime(st)}
                        className={`group relative rounded-2xl p-5 border transition-all no-underline ${
                          isFull
                            ? "opacity-40 cursor-not-allowed border-[#E8E8EA] bg-[#F5F5F6]"
                            : "border-[#E8E8EA] bg-white hover:border-[#0B70D5] cursor-pointer hover:shadow-md"
                        }`}
                      >
                        <div className="text-center">
                          <p className="font-bold text-xl text-[#131316]">{formatTime(st.show_time)}</p>
                          <p className="text-sm text-[#8E8E93] mt-1.5">{st.screen_name}</p>
                          <p className="text-sm text-[#0B70D5] mt-1 font-semibold">{formatCurrency(st.price)}</p>
                          <p className={`text-xs mt-2.5 font-medium ${isFull ? "text-[#FF3B30]" : "text-[#34C759]"}`}>
                            {isFull ? "Housefull" : `${availableSeats} seats left`}
                          </p>
                        </div>
                        {!isFull && (
                          <div className="absolute inset-0 rounded-2xl bg-[#0B70D5]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollReveal>

      {/* Trailer Modal */}
      <Dialog open={trailerOpen} onOpenChange={setTrailerOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-[#2C2C30]">
          <DialogTitle className="sr-only">Trailer - {movie.title}</DialogTitle>
          <div className="aspect-video">
            {movie.trailer_url && getYouTubeId(movie.trailer_url) ? (
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(movie.trailer_url)}?autoplay=1`}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30">
                Trailer not available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
