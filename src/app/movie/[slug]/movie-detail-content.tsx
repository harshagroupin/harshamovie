"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Globe, Star, Calendar, Play, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageTransition } from "@/components/shared/page-transition";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { useBookingStore } from "@/hooks/use-booking-store";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import type { Movie, Showtime } from "@/lib/types";

interface Props {
  movie: Movie;
  showtimes: Showtime[];
  faqData: { question: string; answer: string }[];
}

export function MovieDetailContent({ movie, showtimes, faqData }: Props) {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
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

  // faqData is now passed from server component (page.tsx) with JSON-LD

  return (
    <PageTransition>
      {/* ===== HERO BANNER ===== */}
      <div className="relative w-full bg-[#1A1A1A] pt-[80px]">
        <div className="absolute inset-0 z-0">
          <Image
            src={movie.banner_url || movie.poster_url || "/images/placeholder-banner.jpg"}
            alt={`${movie.title} movie banner — now showing at Harsh A Movie Karnal`}
            fill
            className="object-cover opacity-60"
            priority
          />
          {/* Gradient overlays to match the dark cinematic look */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19]/95 via-[#0B0F19]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent" />
        </div>

        <div className="container-app relative z-10 pt-6 pb-12 md:pb-16 h-full flex flex-col justify-center min-h-[420px]">


          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            {/* Left Content */}
            <div className="flex-1 max-w-2xl text-white">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl lg:text-[48px] font-bold mb-4 leading-tight tracking-tight"
              >
                {movie.title}
              </motion.h1>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 text-[15px] text-white/90 mb-4 font-medium"
              >
                <span>{movie.rating || "UA16+"}</span>
                <span className="text-white/40">|</span>
                <span>{movie.language || "Hindi"}</span>
                <span className="text-white/40">|</span>
                <span>{movie.duration ? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m` : "2h 15m"}</span>
              </motion.div>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white/80 text-[14px] md:text-[15px] leading-[1.6] mb-5 max-w-[540px]"
              >
                {movie.description}
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-2 mb-5"
              >
                {movie.genre?.length ? movie.genre.map((g) => (
                  <span key={g} className="px-3.5 py-1 rounded-full bg-white/10 text-white/90 text-[12px] font-medium backdrop-blur-sm">
                    {g}
                  </span>
                )) : (
                  <>
                    <span className="px-3.5 py-1 rounded-full bg-white/10 text-white/90 text-[12px] font-medium backdrop-blur-sm">Drama</span>
                    <span className="px-3.5 py-1 rounded-full bg-white/10 text-white/90 text-[12px] font-medium backdrop-blur-sm">Action</span>
                  </>
                )}
              </motion.div>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/70 text-[13px] mb-6 font-medium"
              >
                Released {formatDate(movie.release_date)}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link href="https://www.district.in/movies/harsh-a-movies-karnal-in-karnal-CD1102359">
                  <button className="bg-white text-[#131316] font-bold text-[15px] px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors">
                    Book Tickets
                  </button>
                </Link>
              </motion.div>
            </div>

            {/* Right Poster */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="hidden md:block shrink-0 z-20 cursor-pointer group md:-translate-y-9"
              onClick={() => movie.trailer_url && setTrailerOpen(true)}
            >
              <div className="relative w-[220px] lg:w-[260px] aspect-[2/3] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 bg-[#1A1A1A]">
                <Image
                  src={movie.poster_url || "/images/placeholder-poster.svg"}
                  alt={`${movie.title} official movie poster`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  priority
                  sizes="(max-width: 1024px) 220px, 260px"
                />
                
                {/* Play Icon Overlay */}
                {movie.trailer_url && (
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-lg">
                      <Play className="w-5 h-5 ml-1 fill-white" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ===== WHITE CONTENT AREA ===== */}
      <div className="bg-white pt-16 pb-20 w-full min-h-screen relative z-10">
        <div className="container-app">
          
          {/* Trailers & Videos Section */}
          {movie.trailer_url && (
            <section className="mb-14">
              <h3 className="text-[20px] font-bold text-[#131316] mb-6">Trailers & Videos</h3>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                <div className="min-w-[280px] md:min-w-[320px] cursor-pointer group" onClick={() => setTrailerOpen(true)}>
                  <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-3 border border-[#E8E8EA]">
                    <Image
                      src={movie.banner_url || movie.poster_url || "/images/placeholder-banner.jpg"}
                      alt={`${movie.title} official trailer thumbnail`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                        <Play className="w-5 h-5 ml-1 fill-white" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#545459] leading-snug line-clamp-2 uppercase font-medium">
                    {movie.title} (Trailer) | Official Video
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Posters & Wallpapers Section */}
          <section className="mb-14">
            <h3 className="text-[20px] font-bold text-[#131316] mb-6">Posters & Wallpapers</h3>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              <div className="min-w-[140px] md:min-w-[160px]">
                <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden border border-[#E8E8EA]">
                  <Image
                    src={movie.poster_url || "/images/placeholder-poster.svg"}
                    alt={`${movie.title} movie poster — high resolution`}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              {movie.banner_url && movie.banner_url !== movie.poster_url && (
                <div className="min-w-[240px] md:min-w-[280px]">
                  <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-[#E8E8EA]">
                    <Image
                      src={movie.banner_url}
                      alt={`${movie.title} movie wallpaper — banner image`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* FAQ JSON-LD is now rendered server-side in page.tsx */}

          {/* FAQs Section */}
          <section className="mb-14">
            <h3 className="text-[20px] font-bold text-[#131316] mb-6">Frequently Asked Questions</h3>
            <div className="flex flex-col gap-4">
              {faqData.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div key={idx} className="border border-[#E8E8EA] rounded-xl overflow-hidden bg-[#FAFAFA]">
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left font-bold text-[#131316] hover:bg-[#F5F5F6] transition-colors cursor-pointer border-none bg-transparent"
                    >
                      <span className="text-[14px] md:text-[15px]">{faq.question}</span>
                      <span className="text-[18px] text-[#8E8E93] ml-2 shrink-0">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && (
                      <div className="p-4 pt-0 border-t border-[#E8E8EA] text-[13px] md:text-[14px] text-[#545459] leading-relaxed bg-white">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="w-full h-px bg-[#E8E8EA] my-10" />

          {/* Showtimes Section */}
          <ScrollReveal>
            <div id="showtimes" className="pt-4">
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
                          className={`shrink-0 flex flex-col items-center px-4 py-2.5 rounded-lg border transition-all ${
                            isActive
                              ? "bg-[#E2F1FE] border-[#0B70D5] text-[#0B70D5] shadow-sm"
                              : "bg-white border-[#E8E8EA] text-[#545459] hover:border-[#D0D0D4] hover:text-[#131316]"
                          }`}
                        >
                          <span className="text-[10px] uppercase tracking-wider font-semibold">
                            {d.toLocaleDateString("en-IN", { weekday: "short" })}
                          </span>
                          <span className="text-lg font-bold mt-0.5">{d.getDate()}</span>
                          <span className="text-[10px]">
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
                        const validPrices = [st.price_premium, st.price_gold, st.price_recliner, st.price].filter(p => p > 0);
                        const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

                        return (
                          <Link
                            key={st.id}
                            href={isFull ? "#" : "https://www.district.in/movies/harsh-a-movies-karnal-in-karnal-CD1102359"}
                            className={`group relative rounded-xl p-3 border transition-all no-underline ${
                              isFull
                                ? "opacity-40 cursor-not-allowed border-[#E8E8EA] bg-[#F5F5F6]"
                                : "border-[#E8E8EA] bg-white hover:border-[#0B70D5] cursor-pointer hover:shadow-sm"
                            }`}
                          >
                            <div className="text-center">
                              <p className="font-bold text-base text-[#131316]">{formatTime(st.show_time)}</p>
                              <p className="text-xs text-[#8E8E93] mt-1">{st.screen_name}</p>
                              <p className="text-xs text-[#0B70D5] mt-0.5 font-semibold">{formatCurrency(minPrice)}</p>
                              <p className={`text-[11px] mt-1.5 font-medium ${isFull ? "text-[#FF3B30]" : "text-[#34C759]"}`}>
                                {isFull ? "Housefull" : `${availableSeats} seats left`}
                              </p>
                            </div>
                            {!isFull && (
                              <div className="absolute inset-0 rounded-xl bg-[#0B70D5]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
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
        </div>
      </div>

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

