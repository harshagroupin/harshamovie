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
      <div className="min-h-screen pt-8 pb-12 bg-white print:pt-0 print:pb-0 print:min-h-0 print:bg-transparent">
        <div className="max-w-md mx-auto px-4 sm:px-6 print:max-w-[380px] print:w-full print:p-0">
          {/* Success Animation - Hidden on print to save space */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-center mb-10 print:hidden"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-5 ${booking.booking_status === 'pending' ? 'bg-[#FF9500]/10' : 'bg-[#34C759]/10'}`}
            >
              {booking.booking_status === 'pending' ? (
                <Clock className="w-12 h-12 text-[#FF9500]" />
              ) : (
                <CheckCircle className="w-12 h-12 text-[#34C759]" />
              )}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl font-bold text-[#131316] mb-2"
            >
              {booking.booking_status === 'pending' ? 'Request Submitted! 🕒' : 'Booking Confirmed! 🎬'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-[#545459]"
            >
              {booking.booking_status === 'pending' ? 'Your ticket request is pending approval at the counter.' : 'Your tickets have been booked successfully'}
            </motion.p>
          </motion.div>

          {/* Ticket Card */}
          <motion.div
            id="ticket-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border-2 border-[#131316] print:border-2 print:border-black print:shadow-none print:break-inside-avoid"
          >
            {/* Header — Cinema Branding + Booking ID */}
            <div className="bg-[#131316] px-5 py-3 flex items-center justify-between rounded-t-xl print:bg-white print:border-b-2 print:border-black">
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-widest print:text-black/50">Harsh A Movie</p>
                <p className="text-white/70 text-[10px] print:text-black/50">{booking.booking_status === 'pending' ? 'Request ID' : 'Booking ID'}</p>
                <p className="text-white text-base font-black tracking-widest print:text-black">{booking.booking_id}</p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-[10px] uppercase tracking-widest print:text-black/50">Cinema Experience</p>
                <p className="text-white/70 text-[10px] print:text-black/50">Karnal, Haryana</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              {/* Movie Info Row */}
              <div className="flex gap-3 mb-3">
                {movie?.poster_url ? (
                  <div className="w-14 h-20 rounded-lg overflow-hidden shrink-0 shadow-sm border border-[#E8E8EA] print:border-black/20 bg-[#F5F5F6]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                ) : null}
                <div className="flex flex-col justify-center flex-1">
                  <p className="font-black text-base text-[#131316] leading-tight">{movie?.title || "Movie"}</p>
                  <p className="text-xs text-[#8E8E93] mt-0.5">{movie?.language} • {movie?.rating}</p>
                  <div className="flex gap-3 mt-2">
                    <div>
                      <p className="text-[9px] text-[#8E8E93] uppercase tracking-wider">Date</p>
                      <p className="text-xs font-bold text-[#131316]">{showtime?.show_date ? formatDate(showtime.show_date) : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[#8E8E93] uppercase tracking-wider">Time</p>
                      <p className="text-xs font-bold text-[#131316]">{showtime?.show_time ? formatTime(showtime.show_time) : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[#8E8E93] uppercase tracking-wider">Screen</p>
                      <p className="text-xs font-bold text-[#131316]">{showtime?.screen_name || "Screen 1"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-[#E8E8EA] my-2 print:border-black/30" />

              {/* Seats + Guest Info */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Seats</p>
                  <div className="flex flex-wrap gap-1">
                    {(booking.selected_seats as string[]).sort().map((seat) => (
                      <span
                        key={seat}
                        className="px-2 py-0.5 text-xs font-mono font-bold rounded border-2 border-[#131316] text-[#131316] print:border-black print:text-black"
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <div>
                    <p className="text-[9px] text-[#8E8E93] uppercase tracking-wider">Name</p>
                    <p className="text-xs font-bold text-[#131316]">{booking.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#8E8E93] uppercase tracking-wider">Phone</p>
                    <p className="text-xs font-bold text-[#131316]">{booking.phone}</p>
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-[#E8E8EA] pt-2 flex justify-between items-center print:border-black/30">
                <span className="text-sm font-black text-[#131316]">
                  {booking.booking_status === "pending" ? "Amount to Pay" : "Amount Paid"}
                </span>
                <span className="text-lg font-black text-[#131316]">{formatCurrency(booking.final_amount)}</span>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 mt-8 print:hidden"
          >
            {booking.booking_status === "confirmed" && (
              <Button
                variant="outline"
                size="lg"
                onClick={async () => {
                  const ticketElement = document.getElementById("ticket-card");
                  if (!ticketElement) return;
                  
                  try {
                    // Using html-to-image which supports modern CSS like oklab
                    const htmlToImage = await import("html-to-image");
                    const { jsPDF } = await import("jspdf");
                    
                    const imgData = await htmlToImage.toPng(ticketElement, { 
                      quality: 1,
                      backgroundColor: '#ffffff',
                      pixelRatio: 2
                    });
                    
                    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
                    
                    // A4 size is 210 x 297 mm
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    
                    // Get image dimensions to maintain aspect ratio
                    const imgProps = pdf.getImageProperties(imgData);
                    const margin = 20;
                    const printWidth = pdfWidth - (margin * 2);
                    const printHeight = (imgProps.height * printWidth) / imgProps.width;
                    
                    pdf.addImage(imgData, "PNG", margin, margin, printWidth, printHeight);
                    pdf.save(`HarshAMovie_Ticket_${booking.booking_id}.pdf`);
                  } catch (err: any) {
                    console.error("PDF generation failed:", err);
                    alert("Package missing! Please run 'npm install html-to-image' in terminal.");
                  }
                }}
                className="flex-1 rounded-xl gap-2 border-[#E8E8EA] text-[#545459] hover:bg-[#F5F5F6] hover:text-[#131316]"
              >
                <Download className="w-4 h-4" /> Download PDF Ticket
              </Button>
            )}
            <a
              href={`https://wa.me/${BUSINESS.whatsapp}?text=Hi, I have a booking query. My ${booking.booking_status === 'pending' ? 'Request' : 'Booking'} ID: ${booking.booking_id}`}
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
