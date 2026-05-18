"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Film, Ticket, Calendar, IndianRupee, Plus, Clock, ArrowUpRight } from "lucide-react";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { PageTransition } from "@/components/shared/page-transition";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import type { DashboardStats, Booking } from "@/lib/types";

interface Props {
  stats: DashboardStats;
  recentBookings: Booking[];
}

const kpiCards = [
  {
    label: "Total Movies",
    icon: Film,
    key: "totalMovies" as const,
    gradient: "from-[#667eea] to-[#764ba2]",
    shadow: "shadow-purple-500/20",
    isCurrency: false,
  },
  {
    label: "Total Bookings",
    icon: Ticket,
    key: "totalBookings" as const,
    gradient: "from-[#f093fb] to-[#f5576c]",
    shadow: "shadow-pink-500/20",
    isCurrency: false,
  },
  {
    label: "Today's Bookings",
    icon: Calendar,
    key: "todayBookings" as const,
    gradient: "from-[#4facfe] to-[#00f2fe]",
    shadow: "shadow-cyan-500/20",
    isCurrency: false,
  },
  {
    label: "Total Revenue",
    icon: IndianRupee,
    key: "totalRevenue" as const,
    gradient: "from-[#43e97b] to-[#38f9d7]",
    shadow: "shadow-green-500/20",
    isCurrency: true,
  },
];

export function DashboardContent({ stats, recentBookings }: Props) {
  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#0F1117] tracking-tight">Dashboard</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">Welcome back to <span className="font-semibold text-[#0F1117]">Harsha Movies</span></p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/admin/movies/new">
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E50914] hover:bg-[#CC0812] text-white text-sm font-bold transition-all shadow-lg shadow-red-500/20">
                <Plus className="w-4 h-4" /> Add Movie
              </button>
            </Link>
            <Link href="/admin/showtimes">
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-[#374151] text-sm font-semibold hover:bg-[#F9FAFB] transition-all">
                <Clock className="w-4 h-4" /> Showtimes
              </button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpiCards.map((kpi, i) => (
            <motion.div
              key={kpi.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <div className={`relative rounded-2xl bg-gradient-to-br ${kpi.gradient} p-5 shadow-lg ${kpi.shadow} overflow-hidden`}>
                <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-white/10 -translate-y-6 translate-x-6" />
                <div className="relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                    <kpi.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-white/70 text-[11px] font-semibold uppercase tracking-wider">{kpi.label}</p>
                  <AnimatedCounter
                    value={stats[kpi.key]}
                    prefix={kpi.isCurrency ? "₹" : ""}
                    className="text-2xl font-black text-white mt-1"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Bookings Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#FEF2F2] flex items-center justify-center">
                <Ticket className="w-3.5 h-3.5 text-[#E50914]" />
              </div>
              <h2 className="font-bold text-[#111827] text-sm">Recent Bookings</h2>
            </div>
            <Link href="/admin/bookings">
              <button className="text-xs text-[#E50914] font-semibold hover:underline flex items-center gap-1">
                View All <ArrowUpRight className="w-3 h-3" />
              </button>
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-12 h-12 rounded-full bg-[#F9FAFB] flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-5 h-5 text-[#D1D5DB]" />
              </div>
              <p className="text-[#9CA3AF] text-sm font-medium">No bookings yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="text-left py-2.5 px-4 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Booking ID</th>
                    <th className="text-left py-2.5 px-4 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Customer</th>
                    <th className="text-left py-2.5 px-4 text-[#6B7280] font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Movie</th>
                    <th className="text-left py-2.5 px-4 text-[#6B7280] font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Seats</th>
                    <th className="text-left py-2.5 px-4 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Amount</th>
                    <th className="text-left py-2.5 px-4 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-t border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-[#E50914] font-bold">{booking.booking_id}</td>
                      <td className="py-3 px-4 font-medium text-[#111827] text-[13px]">{booking.customer_name}</td>
                      <td className="py-3 px-4 hidden md:table-cell text-[#6B7280] text-[13px] capitalize">
                        {(booking.showtime as any)?.movie?.title || "N/A"}
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#374151] text-xs font-bold">
                          {(booking.selected_seats as string[])?.length || 0} seats
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#111827]">{formatCurrency(booking.final_amount)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold ${
                          booking.booking_status === "confirmed"
                            ? "bg-green-50 text-green-700 border border-green-100"
                            : "bg-red-50 text-red-600 border border-red-100"
                        }`}>
                          {booking.booking_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
