"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Download, MessageCircle, Home, Ticket, Calendar, Clock, MapPin, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/shared/page-transition";
import { useBookingStore } from "@/hooks/use-booking-store";
import { getBookingById } from "@/actions/bookings";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { BUSINESS } from "@/lib/constants";
import type { Booking } from "@/lib/types";

export function ConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const { reset } = useBookingStore();

  useEffect(() => {
    async function fetchBooking() {
      if (!bookingId) { setLoading(false); return; }
      const data = await getBookingById(bookingId);
      setBooking(data);
      setLoading(false);
      reset(); // Clear booking store after confirmation
    }
    fetchBooking();
  }, [bookingId, reset]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#0B70D5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <p className="text-[#545459]">Booking not found.</p>
        <Link href="/"><Button>Back to Home</Button></Link>
      </div>
    );
  }

  const showtime = booking.showtime;
  const movie = showtime?.movie;

  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-12 bg-white">
        <div className="container-app max-w-2xl mx-auto">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-center mb-10"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-[#34C759]/10 mx-auto flex items-center justify-center mb-5"
            >
              <CheckCircle className="w-12 h-12 text-[#34C759]" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl font-bold text-[#131316] mb-2"
            >
              Booking Confirmed! 🎬
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-[#545459]"
            >
              Your tickets have been booked successfully
            </motion.p>
          </motion.div>

          {/* Booking Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-2xl overflow-hidden"
          >
            {/* Header — Booking ID */}
            <div className="bg-[#131316] p-6 text-center">
              <p className="text-white/60 text-sm mb-1">Booking ID</p>
              <p className="text-white text-2xl font-bold tracking-wider">{booking.booking_id}</p>
            </div>

            {/* Details */}
            <div className="p-6 space-y-5">
              {/* Movie */}
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-[#0B70D5] shrink-0" />
                <div>
                  <p className="font-semibold text-[#131316]">{movie?.title || "Movie"}</p>
                  <p className="text-[12px] text-[#8E8E93]">{movie?.language} • {movie?.rating}</p>
                </div>
              </div>

              <div className="border-t border-[#E8E8EA]" />

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-[#0B70D5] shrink-0" />
                  <div>
                    <p className="text-[11px] text-[#8E8E93] uppercase tracking-wider">Date</p>
                    <p className="text-sm font-medium text-[#131316]">{showtime?.show_date ? formatDate(showtime.show_date) : "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[#0B70D5] shrink-0" />
                  <div>
                    <p className="text-[11px] text-[#8E8E93] uppercase tracking-wider">Time</p>
                    <p className="text-sm font-medium text-[#131316]">{showtime?.show_time ? formatTime(showtime.show_time) : "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Screen */}
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#0B70D5] shrink-0" />
                <div>
                  <p className="text-[11px] text-[#8E8E93] uppercase tracking-wider">Screen</p>
                  <p className="text-sm font-medium text-[#131316]">{showtime?.screen_name || "Screen 1"}</p>
                </div>
              </div>

              {/* Seats */}
              <div>
                <p className="text-[11px] text-[#8E8E93] uppercase tracking-wider mb-2">Seats</p>
                <div className="flex flex-wrap gap-1.5">
                  {(booking.selected_seats as string[]).sort().map((seat) => (
                    <span key={seat} className="px-3 py-1.5 text-sm font-mono rounded-lg bg-[#E2F1FE] text-[#0B70D5] border border-[#0B70D5]/20 font-semibold">
                      {seat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#E8E8EA]" />

              {/* Guest Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-[#8E8E93] shrink-0" />
                  <div>
                    <p className="text-[11px] text-[#8E8E93] uppercase tracking-wider">Name</p>
                    <p className="text-sm font-medium text-[#131316]">{booking.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#8E8E93] shrink-0" />
                  <div>
                    <p className="text-[11px] text-[#8E8E93] uppercase tracking-wider">Phone</p>
                    <p className="text-sm font-medium text-[#131316]">{booking.phone}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E8E8EA]" />

              {/* Payment */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8E8E93]">Subtotal</span>
                  <span className="text-[#545459]">{formatCurrency(booking.subtotal)}</span>
                </div>
                {booking.discount > 0 && (
                  <div className="flex justify-between text-sm text-[#34C759]">
                    <span>Discount {booking.promo_code_used && `(${booking.promo_code_used})`}</span>
                    <span>-{formatCurrency(booking.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-3 border-t border-[#E8E8EA]">
                  <span className="text-[#131316]">Amount Paid</span>
                  <span className="text-[#0B70D5]">{formatCurrency(booking.final_amount)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 mt-8"
          >
            <Button
              variant="outline"
              size="lg"
              className="flex-1 rounded-xl gap-2 border-[#E8E8EA] text-[#545459] hover:bg-[#F5F5F6] hover:text-[#131316]"
            >
              <Download className="w-4 h-4" /> Download Ticket
            </Button>
            <a
              href={`https://wa.me/${BUSINESS.whatsapp}?text=Hi, I have a booking query. My Booking ID: ${booking.booking_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button
                variant="outline"
                size="lg"
                className="w-full rounded-xl gap-2 border-[#34C759]/30 text-[#34C759] hover:bg-[#34C759]/10"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </Button>
            </a>
            <Link href="/" className="flex-1">
              <Button
                variant="ghost"
                size="lg"
                className="w-full rounded-xl gap-2 text-[#545459] hover:text-[#131316] hover:bg-[#F5F5F6]"
              >
                <Home className="w-4 h-4" /> Home
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
