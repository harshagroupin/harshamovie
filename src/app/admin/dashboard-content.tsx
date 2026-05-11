"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Film, Ticket, Calendar, DollarSign, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { PageTransition } from "@/components/shared/page-transition";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import type { DashboardStats, Booking } from "@/lib/types";

interface Props {
  stats: DashboardStats;
  recentBookings: Booking[];
}

const kpiCards = [
  { label: "Total Movies", icon: Film, color: "text-accent", bg: "bg-accent/10", key: "totalMovies" as const },
  { label: "Total Bookings", icon: Ticket, color: "text-gold", bg: "bg-gold/10", key: "totalBookings" as const },
  { label: "Today's Bookings", icon: Calendar, color: "text-success", bg: "bg-success/10", key: "todayBookings" as const },
  { label: "Revenue", icon: DollarSign, color: "text-blue-400", bg: "bg-blue-400/10", key: "totalRevenue" as const, isCurrency: true },
];

export function DashboardContent({ stats, recentBookings }: Props) {
  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-black">Dashboard</h1>
            <p className="text-muted text-base mt-1.5">Welcome to Harsh A Movie admin panel</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/movies/new">
              <Button size="default" className="gap-2 rounded-xl text-[15px] font-bold px-6 shadow-lg shadow-accent/20">
                <Plus className="w-4 h-4" /> Add Movie
              </Button>
            </Link>
            <Link href="/admin/showtimes">
              <Button size="default" variant="outline" className="gap-2 rounded-xl text-[15px] font-medium px-6">
                <Clock className="w-4 h-4" /> Showtimes
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {kpiCards.map((kpi, i) => (
            <motion.div
              key={kpi.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-surface border-border hover:border-accent/20 transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted uppercase tracking-wider font-semibold">{kpi.label}</p>
                      <div className="mt-3">
                        <AnimatedCounter
                          value={stats[kpi.key]}
                          prefix={kpi.isCurrency ? "₹" : ""}
                          className={`font-display text-4xl font-black ${kpi.color}`}
                        />
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                      <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Bookings */}
        <Card className="bg-surface border-border">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold">Recent Bookings</CardTitle>
            <Link href="/admin/bookings">
              <Button variant="ghost" size="sm" className="text-[15px]">View All →</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mx-auto mb-4">
                  <Ticket className="w-7 h-7 text-muted" />
                </div>
                <p className="text-muted text-base">No bookings yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[15px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-3 text-muted font-semibold text-sm">Booking ID</th>
                      <th className="text-left py-4 px-3 text-muted font-semibold text-sm">Customer</th>
                      <th className="text-left py-4 px-3 text-muted font-semibold text-sm hidden md:table-cell">Movie</th>
                      <th className="text-left py-4 px-3 text-muted font-semibold text-sm hidden sm:table-cell">Seats</th>
                      <th className="text-left py-4 px-3 text-muted font-semibold text-sm">Amount</th>
                      <th className="text-left py-4 px-3 text-muted font-semibold text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-border/50 hover:bg-surface-light/50 transition-colors">
                        <td className="py-4 px-3 font-mono text-xs text-accent font-bold">{booking.booking_id}</td>
                        <td className="py-4 px-3 font-medium">{booking.customer_name}</td>
                        <td className="py-4 px-3 hidden md:table-cell text-muted">
                          {(booking.showtime as any)?.movie?.title || "N/A"}
                        </td>
                        <td className="py-4 px-3 hidden sm:table-cell font-semibold">
                          {(booking.selected_seats as string[])?.length || 0}
                        </td>
                        <td className="py-4 px-3 font-bold">{formatCurrency(booking.final_amount)}</td>
                        <td className="py-4 px-3">
                          <Badge variant={booking.booking_status === "confirmed" ? "success" : "destructive"}>
                            {booking.booking_status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
