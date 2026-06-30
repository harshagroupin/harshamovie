"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle, Download, MessageCircle, Home, Clock, MapPin, Film,
  Calendar, Monitor, QrCode, Ticket, AlertTriangle, Loader2, ShieldCheck, Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/shared/page-transition";
import { useBookingStore } from "@/hooks/use-booking-store";
import { getBookingById } from "@/actions/bookings";
import { getUserVoucherById } from "@/actions/vouchers";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { BUSINESS } from "@/lib/constants";
import type { Booking, Movie, Showtime } from "@/lib/types";

/* ===== COUNTDOWN HOOK ===== */
function useCountdown(showDate?: string, showTime?: string) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0, expired: true });

  useEffect(() => {
    if (!showDate || !showTime) return;

    const tick = () => {
      try {
        const [hours, minutes] = showTime.split(":").map(Number);
        const target = new Date(showDate);
        target.setHours(hours, minutes, 0, 0);
        const diff = target.getTime() - Date.now();
        if (diff <= 0) {
          setTimeLeft({ h: 0, m: 0, s: 0, expired: true });
        } else {
          setTimeLeft({
            h: Math.floor(diff / 3600000),
            m: Math.floor((diff % 3600000) / 60000),
            s: Math.floor((diff % 60000) / 1000),
            expired: false,
          });
        }
      } catch {
        setTimeLeft({ h: 0, m: 0, s: 0, expired: true });
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [showDate, showTime]);

  return timeLeft;
}

export function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("id");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const { reset } = useBookingStore();

  useEffect(() => {
    async function fetchBooking() {
      if (!bookingId) { setLoading(false); return; }
      const data = await getBookingById(bookingId);
      if (data) {
        setBooking(data);
        setLoading(false);
        reset();
      } else {
        try {
          const voucher = await getUserVoucherById(bookingId);
          if (voucher) {
            router.replace(`/booking/voucher-status?orderId=${voucher.paytm_order_id}`);
            return;
          }
        } catch (e) {
          console.error("Voucher fallback check failed:", e);
        }
        setBooking(null);
        setLoading(false);
      }
    }
    fetchBooking();
  }, [bookingId, reset, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-14 h-14 rounded-2xl bg-[#131316] flex items-center justify-center animate-pulse">
          <Film className="w-7 h-7 text-white" />
        </div>
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
  const isPending = booking.booking_status === "pending";

  return (
    <PageTransition>
      <div className="min-h-screen pt-8 pb-12 bg-[#F5F5F6] print:pt-0 print:pb-0 print:min-h-0 print:bg-transparent">
        <div className="max-w-[440px] mx-auto px-4 sm:px-6 print:max-w-[400px] print:w-full print:p-0">

          {/* Success Animation — hidden on print */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-center mb-8 print:hidden"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${isPending ? "bg-[#FF9500]/10" : "bg-[#34C759]/10"}`}
            >
              {isPending ? (
                <Clock className="w-10 h-10 text-[#FF9500]" />
              ) : (
                <CheckCircle className="w-10 h-10 text-[#34C759]" />
              )}
            </motion.div>
            <h1 className="text-2xl font-bold text-[#131316] mb-1">
              {isPending ? "Request Submitted! 🕒" : "Booking Confirmed! 🎬"}
            </h1>
            <p className="text-[#545459] text-sm">
              {isPending ? "Your ticket request is pending approval." : "Your tickets have been booked successfully"}
            </p>
          </motion.div>

          {/* ========== PREMIUM TICKET CARD ========== */}
          <TicketCard booking={booking} movie={movie} showtime={showtime} isPending={isPending} />

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 mt-6 print:hidden"
          >
            {booking.booking_status === "confirmed" && (
              <Button
                variant="outline"
                size="lg"
                onClick={async () => {
                  const ticketElement = document.getElementById("ticket-card");
                  if (!ticketElement) return;
                  try {
                    const htmlToImage = await import("html-to-image");
                    const { jsPDF } = await import("jspdf");
                    const imgData = await htmlToImage.toPng(ticketElement, {
                      quality: 1,
                      backgroundColor: "#ffffff",
                      pixelRatio: 2,
                    });
                    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const imgProps = pdf.getImageProperties(imgData);
                    const margin = 20;
                    const printWidth = pdfWidth - margin * 2;
                    const printHeight = (imgProps.height * printWidth) / imgProps.width;
                    pdf.addImage(imgData, "PNG", margin, margin, printWidth, printHeight);
                    pdf.save(`HarshAMovie_Ticket_${booking.booking_id}.pdf`);
                  } catch (err: any) {
                    console.error("PDF generation failed:", err);
                    alert("Package missing! Please run 'npm install html-to-image' in terminal.");
                  }
                }}
                className="flex-1 rounded-xl gap-2 border-[#E8E8EA] text-[#545459] hover:bg-white hover:text-[#131316]"
              >
                <Download className="w-4 h-4" /> Download PDF
              </Button>
            )}
            <a
              href={`https://wa.me/${BUSINESS.whatsapp}?text=Hi, I have a booking query. My ${isPending ? "Request" : "Booking"} ID: ${booking.booking_id}`}
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
                className="w-full rounded-xl gap-2 text-[#545459] hover:text-[#131316] hover:bg-white"
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

/* ===================================================================
   PREMIUM TICKET CARD — matches the reference design exactly
   =================================================================== */

function TicketCard({
  booking,
  movie,
  showtime,
  isPending,
}: {
  booking: Booking;
  movie?: Movie;
  showtime?: Showtime;
  isPending: boolean;
}) {
  const countdown = useCountdown(showtime?.show_date, showtime?.show_time);

  const seats = (booking.selected_seats as string[]).sort();
  const seatCount = seats.length;
  const perSeatPrice = seatCount > 0 ? booking.subtotal / seatCount : 0;
  const convenienceFee = 0; // adjust if you track this separately
  const totalAmount = booking.final_amount;

  return (
    <motion.div
      id="ticket-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-3xl overflow-hidden shadow-xl print:shadow-none print:break-inside-avoid"
      style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}
    >
      {/* ── HEADER: Dark branded strip ── */}
      <div className="bg-[#1a1a2e] px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-white font-extrabold text-lg tracking-wider leading-none" style={{ fontFamily: "'Georgia', serif" }}>
            HARSHA
          </p>
          <p className="text-white/60 text-[10px] font-bold tracking-[0.25em] uppercase -mt-0.5">MOVIES</p>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          {!isPending ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-[#34C759] text-[#34C759] text-[11px] font-bold tracking-wide">
              <CheckCircle className="w-3.5 h-3.5" /> CONFIRMED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-[#FF9500] text-[#FF9500] text-[11px] font-bold tracking-wide">
              <Clock className="w-3.5 h-3.5" /> PENDING
            </span>
          )}
          <p className="text-white/50 text-[10px] font-medium">
            Enjoy Your Show! 🎬
          </p>
        </div>
      </div>

      {/* ── MOVIE INFO ── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex gap-4">
          {/* Poster */}
          {movie?.poster_url && (
            <div className="w-[110px] h-[160px] rounded-2xl overflow-hidden shrink-0 shadow-lg border border-[#E8E8EA] bg-[#F5F5F6]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            </div>
          )}

          {/* Details */}
          <div className="flex flex-col justify-center flex-1 min-w-0">
            <h2 className="font-extrabold text-xl text-[#131316] leading-tight mb-1 truncate">
              {movie?.title || "Movie"}
            </h2>
            <p className="text-[13px] text-[#8E8E93] mb-3">
              {movie?.language}{movie?.rating ? ` • ${movie.rating}` : ""}
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-[#E50914] shrink-0" />
                <span className="text-[13px] font-semibold text-[#131316]">
                  {showtime?.show_date ? formatDate(showtime.show_date) : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#E50914] shrink-0" />
                <span className="text-[13px] font-bold text-[#131316]">
                  {showtime?.show_time ? formatTime(showtime.show_time) : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#E50914] shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-[#131316] leading-tight">Harsh A Movie</p>
                  <p className="text-[11px] text-[#8E8E93] leading-tight">{BUSINESS.streetAddress}, {BUSINESS.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Monitor className="w-4 h-4 text-[#E50914] shrink-0" />
                <span className="text-[13px] font-bold text-[#131316]">
                  {showtime?.screen_name || "Screen 1"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── COUNTDOWN TIMER ── */}
      {!isPending && !countdown.expired && (
        <div className="mx-5 mb-4 px-4 py-3 rounded-2xl bg-[#F0FFF4] border border-[#34C759]/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-[#34C759]/20 flex items-center justify-center shrink-0">
            <Timer className="w-5 h-5 text-[#34C759]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#34C759] uppercase tracking-wider">Show Starts In</p>
            <p className="text-xl font-black text-[#131316] tracking-tight">
              {String(countdown.h).padStart(2, "0")}h{" "}
              {String(countdown.m).padStart(2, "0")}m{" "}
              {String(countdown.s).padStart(2, "0")}s
            </p>
          </div>
        </div>
      )}

      {/* ── DIVIDER (tear line) ── */}
      <div className="relative flex items-center mx-0">
        <div className="absolute left-0 w-4 h-8 bg-[#F5F5F6] rounded-r-full print:bg-white" />
        <div className="w-full border-t-2 border-dashed border-[#E8E8EA]" />
        <div className="absolute right-0 w-4 h-8 bg-[#F5F5F6] rounded-l-full print:bg-white" />
      </div>

      {/* ── SEATS + PRICING ── */}
      <div className="px-5 py-4">
        <div className="flex gap-4">
          {/* Seats */}
          <div className="shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#E50914]/10 flex items-center justify-center">
                <Ticket className="w-4 h-4 text-[#E50914]" />
              </div>
              <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Seats</span>
            </div>
            <p className="text-2xl font-black text-[#131316] tracking-wide">
              {seats.join(", ")}
            </p>
            <p className="text-[12px] text-[#8E8E93] font-medium">{seatCount} {seatCount === 1 ? "Seat" : "Seats"}</p>
          </div>

          {/* Pricing */}
          <div className="flex-1 border-l border-[#E8E8EA] pl-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[13px]">
                <span className="text-[#545459]">Ticket Price ({seatCount} × {formatCurrency(perSeatPrice)})</span>
                <span className="font-semibold text-[#131316]">{formatCurrency(booking.subtotal)}</span>
              </div>
              {booking.discount > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#34C759]">Discount{booking.promo_code_used ? ` (${booking.promo_code_used})` : ""}</span>
                  <span className="font-semibold text-[#34C759]">-{formatCurrency(booking.discount)}</span>
                </div>
              )}
              {convenienceFee > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#545459]">Convenience Fee</span>
                  <span className="font-semibold text-[#131316]">{formatCurrency(convenienceFee)}</span>
                </div>
              )}
              <div className="border-t border-[#E8E8EA] pt-1.5 mt-1.5 flex justify-between">
                <span className="text-[14px] font-bold text-[#131316]">TOTAL AMOUNT</span>
                <span className="text-lg font-black text-[#E50914]">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── QR + BOOKING ID + BARCODE ── */}
      <div className="mx-5 mb-4 p-4 rounded-2xl bg-[#FAFAFA] border border-[#E8E8EA]">
        <div className="flex items-center gap-4">
          {/* Booking ID */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-0.5">Booking ID</p>
            <p className="text-base font-black text-[#E50914] tracking-wider font-mono truncate">{booking.booking_id}</p>
            <p className="text-[10px] text-[#8E8E93] mt-1">
              Booked on {new Date(booking.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              {", "}
              {new Date(booking.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center shrink-0 border-l border-[#E8E8EA] pl-4">
            <div className="w-14 h-14 rounded-xl bg-white border border-[#E8E8EA] flex items-center justify-center mb-1">
              <QrCode className="w-9 h-9 text-[#131316]" />
            </div>
          </div>

          {/* Barcode */}
          <div className="flex flex-col items-center shrink-0 border-l border-[#E8E8EA] pl-4">
            <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Scan at Cinema</p>
            {/* Barcode visual */}
            <div className="flex gap-[1px] h-8 items-end">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-[#131316] rounded-[0.5px]"
                  style={{
                    width: i % 3 === 0 ? "2px" : "1px",
                    height: `${20 + (i % 5) * 3}px`,
                  }}
                />
              ))}
            </div>
            <p className="text-[7px] text-[#8E8E93] font-mono mt-0.5 tracking-wider">
              Show this QR code
            </p>
            <p className="text-[7px] text-[#8E8E93] font-mono tracking-wider">
              at the time of entry
            </p>
          </div>
        </div>
      </div>

      {/* ── FOOTER STRIP — 3 info icons ── */}
      <div className="bg-[#FAFAFA] border-t border-[#E8E8EA] px-5 py-3 grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center text-center gap-1">
          <div className="w-8 h-8 rounded-full bg-white border border-[#E8E8EA] flex items-center justify-center">
            <Ticket className="w-4 h-4 text-[#131316]" />
          </div>
          <p className="text-[10px] font-bold text-[#131316] uppercase">E-Ticket</p>
          <p className="text-[8px] text-[#8E8E93] leading-tight">Keep your ticket ready for scanning</p>
        </div>
        <div className="flex flex-col items-center text-center gap-1">
          <div className="w-8 h-8 rounded-full bg-white border border-[#E8E8EA] flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-[#E50914]" />
          </div>
          <p className="text-[10px] font-bold text-[#131316] uppercase">No Refund</p>
          <p className="text-[8px] text-[#8E8E93] leading-tight">Tickets once booked cannot be refunded</p>
        </div>
        <div className="flex flex-col items-center text-center gap-1">
          <div className="w-8 h-8 rounded-full bg-white border border-[#E8E8EA] flex items-center justify-center">
            <Clock className="w-4 h-4 text-[#FF9500]" />
          </div>
          <p className="text-[10px] font-bold text-[#131316] uppercase">Arrive Early</p>
          <p className="text-[8px] text-[#8E8E93] leading-tight">Reach at least 15 mins before show time</p>
        </div>
      </div>
    </motion.div>
  );
}
