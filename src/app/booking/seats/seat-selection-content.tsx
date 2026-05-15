"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Monitor, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/shared/page-transition";
import { useBookingStore } from "@/hooks/use-booking-store";
import { formatCurrency, formatDate, formatTime, getSeatId, getRowLabel } from "@/lib/utils";
import { ROWS, COLS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Showtime } from "@/lib/types";

export function SeatSelectionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showtimeId = searchParams.get("showtime");

  const {
    movieTitle, moviePoster, selectedSeats, price,
    showDate, showTime, screenName,
    toggleSeat, setMovie, setShowtime: setStoreShowtime,
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#0B70D5] border-t-transparent rounded-full animate-spin" />
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

  const subtotal = selectedSeats.length * price;

  return (
    <PageTransition>
      <div className="min-h-screen pt-20 pb-12 bg-white">
        <div className="container-app">
          {/* Back */}
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[#8E8E93] hover:text-[#131316] transition-colors mb-8 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Seat Map — 2 cols */}
            <div className="lg:col-span-2">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-[#F8F9FA] border border-[#E8E8EA] p-5 md:p-6 rounded-2xl mb-10 shadow-sm">
                {moviePoster && (
                  <div className="relative w-24 h-36 md:w-28 md:h-40 rounded-xl overflow-hidden shrink-0 shadow-md border border-[#E8E8EA]">
                    <Image src={moviePoster} alt={movieTitle || ""} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#131316] mb-4">{movieTitle || "Select Your Seats"}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[#545459]">
                    <span className="flex items-center gap-2 font-medium bg-white px-3.5 py-2 rounded-xl border border-[#E8E8EA] shadow-sm">
                      <Calendar className="w-4 h-4 text-[#0B70D5]" /> {showDate ? formatDate(showDate) : "Select Date"}
                    </span>
                    <span className="flex items-center gap-2 font-medium bg-white px-3.5 py-2 rounded-xl border border-[#E8E8EA] shadow-sm">
                      <Clock className="w-4 h-4 text-[#0B70D5]" /> {showTime ? formatTime(showTime) : "Select Time"}
                    </span>
                    <span className="flex items-center gap-2 font-medium bg-white px-3.5 py-2 rounded-xl border border-[#E8E8EA] shadow-sm">
                      <Monitor className="w-4 h-4 text-[#0B70D5]" /> {screenName || "Select Screen"}
                    </span>
                  </div>
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
              <div className="flex flex-col items-center gap-2 mb-10 overflow-x-auto px-4">
                {Array.from({ length: ROWS }).map((_, row) => (
                  <div key={row} className="flex items-center gap-2">
                    <span className="w-6 text-[11px] text-[#8E8E93] text-right font-mono">
                      {getRowLabel(row)}
                    </span>
                    <div className="flex gap-1.5">
                      {Array.from({ length: COLS }).map((_, col) => {
                        const seatId = getSeatId(row, col);
                        const isBooked = bookedSeats.includes(seatId);
                        const isSelected = selectedSeats.includes(seatId);

                        let seatClass = "seat seat-available";
                        if (isBooked) seatClass = "seat seat-booked";
                        else if (isSelected) seatClass = "seat seat-selected";

                        return (
                          <motion.button
                            key={seatId}
                            className={seatClass}
                            onClick={() => !isBooked && toggleSeat(seatId)}
                            whileTap={!isBooked ? { scale: 0.9 } : undefined}
                            disabled={isBooked}
                            title={isBooked ? "Already booked" : seatId}
                          >
                            {col + 1}
                          </motion.button>
                        );
                      })}
                    </div>
                    <span className="w-6 text-[11px] text-[#8E8E93] font-mono">
                      {getRowLabel(row)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-8 text-[12px] text-[#8E8E93]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded seat-available" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#0B70D5] shadow-[0_0_8px_rgba(11,112,213,0.3)]" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded seat-booked" />
                  <span>Booked</span>
                </div>
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-1">
              <div className="glass rounded-2xl p-6 sticky top-20">
                <h3 className="font-bold text-lg text-[#131316] mb-5">Booking Summary</h3>
                <div className="border-t border-[#E8E8EA] pt-4 mb-4" />

                {/* Movie info */}
                {moviePoster && (
                  <div className="flex gap-3 mb-5">
                    <div className="relative w-14 h-20 rounded-lg overflow-hidden shrink-0 border border-[#E8E8EA]">
                      <Image src={moviePoster} alt={movieTitle || ""} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#131316]">{movieTitle}</p>
                      <p className="text-[12px] text-[#8E8E93] mt-1">{showDate && formatDate(showDate)}</p>
                      <p className="text-[12px] text-[#8E8E93]">{showTime && formatTime(showTime)}</p>
                      <p className="text-[12px] text-[#0B70D5] mt-1 font-medium">{screenName}</p>
                    </div>
                  </div>
                )}

                <div className="border-t border-[#E8E8EA] pt-4 mb-4" />

                {/* Selected seats */}
                <div className="mb-5">
                  <p className="text-[12px] text-[#8E8E93] mb-2 uppercase tracking-wider font-semibold">
                    Seats ({selectedSeats.length})
                  </p>
                  {selectedSeats.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSeats.sort().map((seat) => (
                        <span key={seat} className="px-2.5 py-1 text-[11px] font-mono rounded-md bg-[#E2F1FE] text-[#0B70D5] border border-[#0B70D5]/20 font-semibold">
                          {seat}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-[#8E8E93]">Tap seats to select</p>
                  )}
                </div>

                <div className="border-t border-[#E8E8EA] pt-4 mb-5" />

                {/* Price */}
                <div className="space-y-2.5 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8E8E93]">Per seat</span>
                    <span className="text-[#545459]">{formatCurrency(price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8E8E93]">Seats</span>
                    <span className="text-[#545459]">× {selectedSeats.length}</span>
                  </div>
                  <div className="border-t border-[#E8E8EA] pt-2.5" />
                  <div className="flex justify-between font-bold">
                    <span className="text-[#131316]">Subtotal</span>
                    <span className="text-[#0B70D5] text-lg">{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                {/* CTA */}
                <Link href={selectedSeats.length > 0 ? "/booking/checkout" : "#"}>
                  <Button
                    size="lg"
                    className="w-full rounded-xl bg-[#131316] text-white font-bold text-[15px] py-6 hover:bg-[#2C2C30] transition-all"
                    disabled={selectedSeats.length === 0}
                  >
                    Proceed to Checkout
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
