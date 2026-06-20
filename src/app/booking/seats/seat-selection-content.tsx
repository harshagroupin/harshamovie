"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Monitor, Calendar, Clock, Info, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/shared/page-transition";
import { useBookingStore } from "@/hooks/use-booking-store";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Showtime } from "@/lib/types";

import { SCREEN_LAYOUTS, AUDI_1 } from "@/lib/seat-layouts";

export function SeatSelectionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showtimeId = searchParams.get("showtime");

  const {
    movieTitle, moviePoster, selectedSeats, price_premium, price_gold, price_recliner,
    showDate, showTime, screenName,
    toggleSeat, setMovie, setShowtime: setStoreShowtime, getSubtotal
  } = useBookingStore();

  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShowtime() {
      if (!showtimeId) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("showtimes")
        .select("*, movie:movies(*)")
        .eq("id", showtimeId)
        .single();

      if (data) {
        const st = data as Showtime & { movie: any };
        setBookedSeats((st.booked_seats as string[]) || []);

        // Set store if navigated directly
        if (!movieTitle && st.movie) {
          setMovie({ id: st.movie.id, title: st.movie.title, poster_url: st.movie.poster_url });
          setStoreShowtime(st);
        }
      }
      setLoading(false);
    }
    fetchShowtime();
  }, [showtimeId, movieTitle, setMovie, setStoreShowtime]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-14 h-14 rounded-2xl bg-[#131316] flex items-center justify-center animate-pulse">
          <Film className="w-7 h-7 text-white" />
        </div>
      </div>
    );
  }

  if (!showtimeId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <p className="text-[#545459]">No showtime selected.</p>
        <Link href="/"><Button>Back to Home</Button></Link>
      </div>
    );
  }

  const layout = SCREEN_LAYOUTS[screenName || "Audi 1"] || AUDI_1;

  const subtotalValue = getSubtotal();

  // Group layout by tiers for visual separation
  const tiers = [
    { tier: 'premium', label: 'Premium', price: price_premium },
    { tier: 'gold', label: 'Gold', price: price_gold },
    { tier: 'recliner', label: 'Recliner', price: price_recliner }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen pt-4 pb-12 bg-white">
        <div className="container-app">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between bg-[#F8F9FA] border border-[#E8E8EA] p-5 md:p-6 rounded-2xl mb-10 shadow-sm">
            {/* Left: Movie Info */}
            <div className="flex gap-5 items-center">
              {moviePoster && (
                <div className="relative w-20 h-28 rounded-xl overflow-hidden shrink-0 shadow-md border border-[#E8E8EA]">
                  <Image src={moviePoster} alt={movieTitle || ""} fill className="object-cover" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-[#131316] mb-3">{movieTitle || "Select Your Seats"}</h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-[#545459]">
                  <span className="flex items-center gap-1.5 font-medium bg-white px-3 py-1.5 rounded-lg border border-[#E8E8EA] shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-[#0B70D5]" /> {showDate ? formatDate(showDate) : "Select Date"}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium bg-white px-3 py-1.5 rounded-lg border border-[#E8E8EA] shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-[#0B70D5]" /> {showTime ? formatTime(showTime) : "Select Time"}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium bg-white px-3 py-1.5 rounded-lg border border-[#E8E8EA] shadow-sm">
                    <Monitor className="w-3.5 h-3.5 text-[#0B70D5]" /> {screenName || "Select Screen"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Booking Summary inline */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-4 lg:gap-6 bg-white p-4 rounded-xl border border-[#E8E8EA] shadow-sm">
              <div className="w-full sm:w-auto flex flex-col gap-1 min-w-[120px]">
                <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Seats ({selectedSeats.length})</span>
                <div className="flex flex-wrap gap-1 min-h-[24px] items-center">
                  {selectedSeats.length > 0 ? (
                    selectedSeats.sort().map((seat) => (
                      <span key={seat} className="px-1.5 py-0.5 text-[11px] font-mono rounded bg-[#E2F1FE] text-[#0B70D5] font-semibold border border-[#0B70D5]/20">
                        {seat}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#8E8E93]">None</span>
                  )}
                </div>
              </div>
              
              <div className="w-full sm:w-auto flex flex-col gap-1 sm:pl-4 sm:border-l border-[#E8E8EA]">
                <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Subtotal</span>
                <span className="text-lg font-bold text-[#0B70D5]">{formatCurrency(subtotalValue)}</span>
              </div>

              <Link href={selectedSeats.length > 0 ? "/booking/checkout" : "#"} className="w-full sm:w-auto">
                <Button
                  className="w-full sm:w-auto rounded-xl bg-[#131316] text-white font-bold py-5 hover:bg-[#2C2C30] transition-all px-8"
                  disabled={selectedSeats.length === 0}
                >
                  Checkout
                </Button>
              </Link>
            </div>
          </div>

              {/* Screen */}
              <div className="text-center mb-10">
                <div className="screen-curve" />
                <div className="flex items-center justify-center gap-2 text-[11px] text-[#8E8E93] uppercase tracking-wider font-semibold">
                  <Monitor className="w-4 h-4" />
                  <span>Screen</span>
                </div>
              </div>

              {/* Seat Grid */}
              <div className="w-full overflow-x-auto pb-4 mb-10">
                <div className="min-w-max flex flex-col items-center px-4">
                  {tiers.map(({ tier, label, price }) => {
                    const tierRows = layout.filter(r => r.tier === tier);
                    if (tierRows.length === 0) return null;

                    return (
                      <div key={tier} className="mb-6 w-full flex flex-col items-center">
                        <div className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest mb-4 border-b border-[#E8E8EA] pb-1">
                          {label} - {formatCurrency(price)}
                        </div>
                        
                        {tierRows.map((row) => (
                          <div key={row.id} className="flex items-center gap-1.5 sm:gap-3 mb-1.5 sm:mb-2">
                            <span className="w-4 text-[11px] text-[#131316] text-right font-mono font-bold">
                              {row.id}
                            </span>
                            
                            <div className="flex gap-1 sm:gap-1.5 justify-center">
                              {row.seats.map((seatId, idx) => {
                                if (seatId === null) {
                                  return <div key={`gap-${row.id}-${idx}`} className="w-4 h-4 sm:w-7 sm:h-7" />;
                                }

                                const isBooked = bookedSeats.includes(seatId);
                                const isSelected = selectedSeats.includes(seatId);

                                let seatClass = "seat seat-available flex items-center justify-center text-[10px] font-mono transition-all duration-200";
                                if (isBooked) seatClass = "seat seat-booked flex items-center justify-center text-[10px] font-mono text-[#8E8E93]";
                                else if (isSelected) seatClass = "seat seat-selected flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-md transform scale-110";
                                
                                if (tier === "recliner" && !isSelected && !isBooked) {
                                  seatClass += " border-[#0B70D5]/40 text-[#0B70D5]";
                                }

                                const seatNum = seatId.split('-')[1];

                                return (
                                  <motion.button
                                    key={seatId}
                                    className={seatClass}
                                    onClick={() => !isBooked && toggleSeat(seatId)}
                                    whileHover={!isBooked && !isSelected ? { scale: 1.1 } : undefined}
                                    whileTap={!isBooked ? { scale: 0.95 } : undefined}
                                    disabled={isBooked}
                                    title={isBooked ? "Already booked" : `${seatId} - ${formatCurrency(price)}`}
                                  >
                                    {isBooked ? "×" : seatNum}
                                  </motion.button>
                                );
                              })}
                            </div>
                            
                            <span className="w-4 text-[11px] text-[#131316] font-mono font-bold">
                              {row.id}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-4 sm:gap-8 text-[11px] sm:text-[12px] text-[#8E8E93]">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded seat-available" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-[#0B70D5] shadow-[0_0_8px_rgba(11,112,213,0.3)]" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded seat-booked" />
                  <span>Booked</span>
                </div>
              </div>

              {/* Booking Instructions */}
              <div className="mt-8 mx-auto w-full max-w-xl">
                <div className="bg-[#F8F9FA] border border-[#E8E8EA] rounded-2xl p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-[#0B70D5] shrink-0" />
                    <h3 className="text-sm font-bold text-[#131316]">Booking Instructions</h3>
                  </div>
                  <ul className="text-[12px] sm:text-[13px] text-[#545459] space-y-2 list-none p-0 m-0">
                    <li className="flex items-start gap-2">
                      <span className="text-[#0B70D5] font-bold mt-0.5">1.</span>
                      <span>Tap on available seats to select them. Selected seats will turn <strong className="text-[#0B70D5]">blue</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#0B70D5] font-bold mt-0.5">2.</span>
                      <span>You can select multiple seats. Tap again to deselect a seat.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#0B70D5] font-bold mt-0.5">3.</span>
                      <span>Greyed out seats are already booked and cannot be selected.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#0B70D5] font-bold mt-0.5">4.</span>
                      <span>After selecting seats, click <strong>Checkout</strong> to proceed with payment.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#0B70D5] font-bold mt-0.5">5.</span>
                      <span>Seats are held for 10 minutes after booking. Please complete payment within that time.</span>
                    </li>
                  </ul>
                </div>
              </div>
        </div>
      </div>
    </PageTransition>
  );
}
