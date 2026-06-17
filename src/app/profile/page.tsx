"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  LogOut, Ticket, Calendar, Clock, Monitor, User,
  ChevronRight, Film, CreditCard, MapPin
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getUserBookings } from "@/actions/bookings";
import { Navbar } from "@/components/layout/navbar";
import { PageTransition } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import type { Booking } from "@/lib/types";

function getInitial(user: SupabaseUser | null): string {
  if (!user) return "?";
  const name = user.user_metadata?.full_name;
  if (name) return name.charAt(0).toUpperCase();
  if (user.email) return user.email.charAt(0).toUpperCase();
  return "?";
}

function getDisplayName(user: SupabaseUser | null): string {
  if (!user) return "User";
  return user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
}

function getMemberSince(user: SupabaseUser | null): string {
  if (!user?.created_at) return "";
  const d = new Date(user.created_at);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function getStatusBadge(booking: Booking) {
  const status = booking.booking_status;
  const payment = booking.payment_status;

  if (status === "confirmed" && (payment === "completed" || payment === "initiated")) {
    return { label: "Confirmed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (status === "pending" || payment === "pending" || payment === "initiated") {
    return { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (status === "cancelled" || payment === "failed") {
    return { label: "Cancelled", color: "bg-red-50 text-red-600 border-red-200" };
  }
  return { label: "Confirmed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndBookings = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      try {
        if (session.user.email) {
          const userBookings = await getUserBookings(session.user.email);
          setBookings(userBookings);
        }
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndBookings();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#0B70D5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initial = getInitial(user);
  const displayName = getDisplayName(user);
  const memberSince = getMemberSince(user);

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="min-h-screen bg-[#F8F9FA]">
          {/* ===== HERO HEADER ===== */}
          <div className="relative overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F1117] via-[#1A1D2B] to-[#0F1117]" />
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: "radial-gradient(circle at 20% 50%, #0B70D5 0%, transparent 50%), radial-gradient(circle at 80% 50%, #6444E4 0%, transparent 50%)"
            }} />

            <div className="relative container-app max-w-4xl mx-auto pt-12 pb-16 md:pt-16 md:pb-20 px-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6">
                {/* Avatar */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="relative"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#0B70D5] to-[#6444E4] flex items-center justify-center shadow-xl shadow-blue-500/20 border-2 border-white/10">
                    <span className="text-3xl sm:text-4xl font-black text-white">{initial}</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 border-[#0F1117] flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </div>
                </motion.div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{displayName}</h1>
                  <p className="text-white/50 text-sm mt-1">{user?.email}</p>
                  {memberSince && (
                    <p className="text-white/30 text-xs mt-1.5 flex items-center gap-1.5 justify-center sm:justify-start">
                      <Calendar className="w-3 h-3" /> Member since {memberSince}
                    </p>
                  )}
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-3 sm:gap-6 mt-8 justify-center sm:justify-start">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                  <Ticket className="w-4 h-4 text-[#0B70D5]" />
                  <span className="text-white font-bold text-sm">{bookings.length}</span>
                  <span className="text-white/40 text-xs">Bookings</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                  <Film className="w-4 h-4 text-[#6444E4]" />
                  <span className="text-white font-bold text-sm">
                    {new Set(bookings.map(b => b.showtime?.movie?.title).filter(Boolean)).size}
                  </span>
                  <span className="text-white/40 text-xs">Movies</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== BOOKINGS ===== */}
          <div className="container-app max-w-4xl mx-auto px-4 -mt-6 pb-16">
            <div className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center justify-between px-1 pt-2">
                <h2 className="text-lg font-bold text-[#131316] flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-[#0B70D5]" />
                  My Tickets
                </h2>
                <span className="text-xs font-medium text-[#8E8E93]">{bookings.length} booking{bookings.length !== 1 ? "s" : ""}</span>
              </div>

              {bookings.length === 0 ? (
                /* ===== EMPTY STATE ===== */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-10 md:p-14 text-center shadow-sm border border-[#E5E7EB]"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-[#E2F1FE] to-[#F0E8FF] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                    <Ticket className="w-10 h-10 text-[#0B70D5]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#131316] mb-2">No bookings yet</h3>
                  <p className="text-[#8E8E93] text-sm mb-8 max-w-xs mx-auto">
                    Your movie tickets will appear here once you book your first show.
                  </p>
                  <Link href="/">
                    <Button className="bg-[#131316] hover:bg-[#2C2C30] rounded-xl px-8 py-5 font-bold">
                      Browse Movies
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                /* ===== TICKET LIST ===== */
                <div className="space-y-3">
                  {bookings.map((booking, idx) => {
                    const movie = booking.showtime?.movie;
                    const badge = getStatusBadge(booking);

                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Link href={`/booking/confirmation?id=${booking.booking_id}`} className="no-underline group block">
                          <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8EA] hover:border-[#0B70D5]/20 hover:shadow-md transition-all overflow-hidden">
                            <div className="flex flex-col sm:flex-row">
                              {/* Poster */}
                              <div className="relative w-full sm:w-28 h-40 sm:h-auto shrink-0 bg-gradient-to-br from-[#E8E8EA] to-[#F5F5F6]">
                                {movie?.poster_url ? (
                                  <Image
                                    src={movie.poster_url}
                                    alt={movie.title || "Movie"}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 100vw, 112px"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Film className="w-10 h-10 text-[#D1D5DB]" />
                                  </div>
                                )}
                                {/* Status badge (mobile - overlaid on poster) */}
                                <div className="absolute top-3 left-3 sm:hidden">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.color}`}>
                                    {badge.label}
                                  </span>
                                </div>
                              </div>

                              {/* Ticket Divider - dashed line */}
                              <div className="hidden sm:flex flex-col items-center justify-center px-0 relative">
                                <div className="absolute -top-3 w-6 h-6 bg-[#F8F9FA] rounded-full" />
                                <div className="w-px h-full border-l border-dashed border-[#D0D0D4]" />
                                <div className="absolute -bottom-3 w-6 h-6 bg-[#F8F9FA] rounded-full" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between gap-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h3 className="font-bold text-[15px] sm:text-base text-[#131316] group-hover:text-[#0B70D5] transition-colors truncate">
                                      {movie?.title || "Movie"}
                                    </h3>
                                    <p className="text-xs text-[#8E8E93] mt-0.5 font-mono">
                                      {booking.booking_id}
                                    </p>
                                  </div>
                                  {/* Status badge (desktop) */}
                                  <div className="hidden sm:block shrink-0">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.color}`}>
                                      {badge.label}
                                    </span>
                                  </div>
                                </div>

                                {/* Meta row */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#545459]">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-[#0B70D5]" />
                                    {booking.showtime?.show_date ? formatDate(booking.showtime.show_date) : "—"}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-[#0B70D5]" />
                                    {booking.showtime?.show_time ? formatTime(booking.showtime.show_time) : "—"}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <Monitor className="w-3.5 h-3.5 text-[#0B70D5]" />
                                    {booking.showtime?.screen_name || "—"}
                                  </span>
                                </div>

                                {/* Bottom: Seats + Amount */}
                                <div className="flex items-end justify-between gap-4 pt-1 border-t border-[#F0F0F2]">
                                  <div className="flex flex-wrap gap-1.5 items-center min-w-0">
                                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase mr-1">Seats</span>
                                    {(booking.selected_seats as string[]).slice(0, 6).map(seat => (
                                      <span key={seat} className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-[#E2F1FE] text-[#0B70D5] border border-[#0B70D5]/15">
                                        {seat}
                                      </span>
                                    ))}
                                    {(booking.selected_seats as string[]).length > 6 && (
                                      <span className="text-[10px] text-[#8E8E93]">
                                        +{(booking.selected_seats as string[]).length - 6}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-sm font-bold text-[#131316]">
                                      {formatCurrency(booking.final_amount)}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-[#D0D0D4] group-hover:text-[#0B70D5] transition-colors" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    </>
  );
}
