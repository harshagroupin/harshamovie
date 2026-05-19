"use client";

import { useEffect, useState } from "react";
import { Search, XCircle, Eye, Ticket, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/shared/page-transition";
import { getBookings, cancelBooking, approveBooking } from "@/actions/bookings";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import type { Booking } from "@/lib/types";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";

const STATUS_TABS = ["all", "pending", "confirmed", "cancelled"];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    try { setBookings(await getBookings()); } catch { toast.error("Failed to load bookings"); }
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, []);

  const filtered = bookings.filter((b) => {
    const matchSearch = !search ||
      b.booking_id.toLowerCase().includes(search.toLowerCase()) ||
      b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      b.phone.includes(search) ||
      (b.email && b.email.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || b.booking_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this booking? Seats will be freed.")) return;
    try {
      await cancelBooking(id);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, booking_status: "cancelled" as const } : b));
      setSelected(null);
      toast.success("Booking cancelled");
    } catch { toast.error("Failed to cancel"); }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this booking? Payment status will be marked as completed.")) return;
    try {
      await approveBooking(id);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, booking_status: "confirmed" as const, payment_status: "completed" as const } : b));
      setSelected(null);
      toast.success("Booking approved");
    } catch { toast.error("Failed to approve"); }
  };

  const pending = bookings.filter(b => b.booking_status === "pending").length;
  const confirmed = bookings.filter(b => b.booking_status === "confirmed").length;
  const cancelled = bookings.filter(b => b.booking_status === "cancelled").length;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#0F1117] tracking-tight">Bookings</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">{bookings.length} total bookings</p>
          </div>
          <Link href="/admin/bookings/new" className="bg-[#E50914] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-red-700 transition-colors inline-flex items-center gap-2 w-fit">
            <Ticket className="w-4 h-4" />
            Create Ticket
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Pending", count: pending, textColor: "text-amber-600", bg: "bg-white border border-[#E5E7EB]" },
            { label: "Confirmed", count: confirmed, textColor: "text-green-700", bg: "bg-white border border-[#E5E7EB]" },
            { label: "Cancelled", count: cancelled, textColor: "text-red-600", bg: "bg-white border border-[#E5E7EB]" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 ${s.bg}`}>
              <p className="text-xs text-[#6B7280] font-medium">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.textColor}`}>{s.count}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by ID, Name, Phone or Email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#E50914]/40 focus:ring-2 focus:ring-[#E50914]/10 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 bg-white rounded-xl border border-[#E5E7EB] p-1">
            {STATUS_TABS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === s
                    ? "bg-[#E50914] text-white shadow-sm"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#9CA3AF] text-sm">Loading bookings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] py-20 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] flex items-center justify-center mb-4">
              <Ticket className="w-7 h-7 text-[#E50914]" />
            </div>
            <h3 className="font-bold text-[#111827] text-base mb-1">No bookings found</h3>
            <p className="text-[#9CA3AF] text-sm">
              {search ? `No results for "${search}"` : "Bookings will appear here once made"}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                    <th className="text-left py-3 px-4 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Booking ID</th>
                    <th className="text-left py-3 px-4 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Customer</th>
                    <th className="text-left py-3 px-4 text-[#6B7280] font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Movie</th>
                    <th className="text-left py-3 px-4 text-[#6B7280] font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Seats</th>
                    <th className="text-left py-3 px-4 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Amount</th>
                    <th className="text-left py-3 px-4 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b, i) => (
                    <tr key={b.id} className="border-t border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-[#E50914] font-bold">{b.booking_id}</td>
                      <td className="py-3.5 px-4 font-medium text-[#111827] text-[13px]">{b.customer_name}</td>
                      <td className="py-3.5 px-4 hidden md:table-cell text-[#6B7280] text-[13px] capitalize">{((b.showtime as unknown) as { movie?: { title: string } })?.movie?.title || "N/A"}</td>
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <span className="px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#374151] text-xs font-bold">
                          {(b.selected_seats as string[])?.length || 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#111827]">{formatCurrency(b.final_amount)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          b.booking_status === "confirmed"
                            ? "bg-green-50 text-green-700 border border-green-100"
                            : b.booking_status === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-red-50 text-red-600 border border-red-100"
                        }`}>
                          {b.booking_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setSelected(b)}
                            className="w-8 h-8 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#374151]" />
                          </button>
                          {b.booking_status === "confirmed" && (
                            <button
                              onClick={() => handleCancel(b.id)}
                              className="w-8 h-8 rounded-lg bg-[#F3F4F6] hover:bg-red-50 flex items-center justify-center transition-colors group"
                              title="Cancel Booking"
                            >
                              <XCircle className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#E50914]" />
                            </button>
                          )}
                          {b.booking_status === "pending" && (
                            <button
                              onClick={() => handleApprove(b.id)}
                              className="w-8 h-8 rounded-lg bg-[#F3F4F6] hover:bg-green-50 flex items-center justify-center transition-colors group"
                              title="Approve Booking"
                            >
                              <Ticket className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-green-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Booking Detail Dialog */}
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-[#0F1117]">Booking Details</DialogTitle>
              <DialogDescription className="font-mono text-[#E50914] font-bold text-sm">{selected?.booking_id}</DialogDescription>
            </DialogHeader>
            {selected && (
              <div className="space-y-1 text-sm">
                <div className="bg-[#F9FAFB] rounded-xl p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Customer Info</p>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Name</span>
                    <span className="font-semibold text-[#111827]">{selected.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Phone</span>
                    <span className="text-[#111827]">{selected.phone}</span>
                  </div>
                  {selected.email && (
                    <div className="flex justify-between">
                      <span className="text-[#9CA3AF]">Email</span>
                      <span className="text-[#111827] text-xs">{selected.email}</span>
                    </div>
                  )}
                </div>

                <div className="bg-[#F9FAFB] rounded-xl p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Show Info</p>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Movie</span>
                    <span className="font-semibold text-[#111827] capitalize">{((selected.showtime as unknown) as { movie?: { title: string } })?.movie?.title || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Date</span>
                    <span className="text-[#111827]">{selected.showtime?.show_date ? formatDate(selected.showtime.show_date) : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Time</span>
                    <span className="text-[#111827]">{selected.showtime?.show_time ? formatTime(selected.showtime.show_time) : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Seats</span>
                    <span className="text-[#111827] font-mono text-xs">{(selected.selected_seats as string[]).join(", ")}</span>
                  </div>
                </div>

                <div className="bg-[#F9FAFB] rounded-xl p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Payment</p>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Subtotal</span>
                    <span className="text-[#111827]">{formatCurrency(selected.subtotal)}</span>
                  </div>
                  {selected.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(selected.discount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-black text-base">
                    <span className="text-[#111827]">Total</span>
                    <span className="text-[#E50914]">{formatCurrency(selected.final_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Mode</span>
                    <span className="capitalize text-[#111827]">{selected.payment_mode}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#9CA3AF]">Status</span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      selected.booking_status === "confirmed"
                        ? "bg-green-50 text-green-700 border border-green-100"
                        : selected.booking_status === "pending"
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : "bg-red-50 text-red-600 border border-red-100"
                    }`}>
                      {selected.booking_status}
                    </span>
                  </div>
                </div>

                {selected.booking_status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleApprove(selected.id)}
                      className="flex-1 py-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-bold text-sm border border-green-100 transition-all"
                    >
                      Approve Booking
                    </button>
                    <button
                      onClick={() => handleCancel(selected.id)}
                      className="flex-1 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm border border-red-100 transition-all"
                    >
                      Cancel / Reject
                    </button>
                  </div>
                )}
                {selected.booking_status === "confirmed" && (
                  <button
                    onClick={() => handleCancel(selected.id)}
                    className="w-full py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm border border-red-100 transition-all mt-2"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
