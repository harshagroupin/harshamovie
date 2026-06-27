"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Ticket, Gift, CheckCircle, XCircle, Clock, Loader2, User, Phone, Mail, Calendar, CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { getBookingDetailsForVerification, getVoucherDetailsForVerification } from "@/actions/vouchers";
import type { Booking, UserVoucher } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type Tab = "ticket" | "voucher";

export default function TVCheckPage() {
  const [activeTab, setActiveTab] = useState<Tab>("ticket");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  
  // Results
  const [bookingResult, setBookingResult] = useState<Booking | null>(null);
  const [voucherResult, setVoucherResult] = useState<UserVoucher | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setSearching(true);
    setSearched(true);
    setBookingResult(null);
    setVoucherResult(null);

    try {
      if (activeTab === "ticket") {
        const res = await getBookingDetailsForVerification(query);
        if (res) {
          setBookingResult(res);
        } else {
          toast.error("No ticket found with this ID or Order ID");
        }
      } else {
        const res = await getVoucherDetailsForVerification(query);
        if (res) {
          setVoucherResult(res);
        } else {
          toast.error("No voucher found with this Code or Order ID");
        }
      }
    } catch (err) {
      toast.error("Verification failed");
      console.error(err);
    }
    setSearching(false);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setQuery("");
    setBookingResult(null);
    setVoucherResult(null);
    setSearched(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E50914] to-[#B20710] flex items-center justify-center shadow-lg shadow-red-500/20">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#131316]">T & V Check (Verification)</h1>
          <p className="text-sm text-[#8E8E93]">Verify movie tickets and purchased vouchers instantly</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-[#F5F5F6] rounded-2xl border border-[#E8E8EA] mb-8 max-w-md">
        <button
          onClick={() => handleTabChange("ticket")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all border-0 cursor-pointer ${
            activeTab === "ticket"
              ? "bg-white text-[#131316] shadow-sm"
              : "text-[#545459] hover:bg-white/40 bg-transparent"
          }`}
        >
          <Ticket className="w-4 h-4" />
          Ticket Verify
        </button>
        <button
          onClick={() => handleTabChange("voucher")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all border-0 cursor-pointer ${
            activeTab === "voucher"
              ? "bg-white text-[#131316] shadow-sm"
              : "text-[#545459] hover:bg-white/40 bg-transparent"
          }`}
        >
          <Gift className="w-4 h-4" />
          Voucher Verify
        </button>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white border border-[#E8E8EA] p-6 rounded-2xl shadow-sm mb-8">
        <h3 className="text-base font-bold text-[#131316] mb-3">
          {activeTab === "ticket" ? "Search Ticket Details" : "Search Voucher Details"}
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8E8E93]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === "ticket"
                  ? "Enter Booking ID or Paytm Order ID..."
                  : "Enter Voucher Code (e.g. WEEKEND50) or Paytm Order ID..."
              }
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#E8E8EA] text-sm bg-white focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3.5 rounded-xl bg-[#131316] hover:bg-[#2C2C30] text-white text-sm font-bold transition-all border-0 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 shrink-0"
          >
            {searching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              "Verify Now"
            )}
          </button>
        </div>
      </form>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {searched && !searching && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {/* 1. Ticket Verification Result */}
            {activeTab === "ticket" && bookingResult && (
              <div className="bg-white border border-[#E8E8EA] rounded-2xl overflow-hidden shadow-sm">
                {/* Status Banner */}
                <div className={`p-6 border-b border-[#E8E8EA] flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  bookingResult.payment_status === "completed" ? "bg-[#34C759]/5" : "bg-[#FF3B30]/5"
                }`}>
                  <div className="flex items-center gap-3">
                    {bookingResult.payment_status === "completed" ? (
                      <CheckCircle className="w-8 h-8 text-[#34C759]" />
                    ) : bookingResult.payment_status === "pending" ? (
                      <Clock className="w-8 h-8 text-[#FF9500]" />
                    ) : (
                      <XCircle className="w-8 h-8 text-[#FF3B30]" />
                    )}
                    <div>
                      <p className="text-xs text-[#8E8E93] font-semibold uppercase tracking-wider">Ticket Status</p>
                      <h4 className="text-lg font-bold text-[#131316]">
                        {bookingResult.payment_status === "completed" ? "Verified & Confirmed" : `Payment ${bookingResult.payment_status}`}
                      </h4>
                    </div>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-xl border border-[#E8E8EA]">
                    <span className="text-xs text-[#8E8E93] block">Booking ID</span>
                    <span className="font-mono font-bold text-sm text-[#131316]">{bookingResult.booking_id}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column - User Details */}
                  <div className="space-y-4">
                    <h5 className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider mb-2">Customer Details</h5>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAFA] border border-[#E8E8EA]">
                      <User className="w-5 h-5 text-[#8E8E93]" />
                      <div>
                        <span className="text-[10px] text-[#8E8E93] block">Name</span>
                        <span className="text-sm font-semibold text-[#131316]">{bookingResult.customer_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAFA] border border-[#E8E8EA]">
                      <Phone className="w-5 h-5 text-[#8E8E93]" />
                      <div>
                        <span className="text-[10px] text-[#8E8E93] block">Phone</span>
                        <span className="text-sm font-semibold text-[#131316]">{bookingResult.phone}</span>
                      </div>
                    </div>
                    {bookingResult.email && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAFA] border border-[#E8E8EA]">
                        <Mail className="w-5 h-5 text-[#8E8E93]" />
                        <div>
                          <span className="text-[10px] text-[#8E8E93] block">Email</span>
                          <span className="text-sm font-semibold text-[#131316] truncate max-w-[220px]">{bookingResult.email}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Booking Details */}
                  <div className="space-y-4">
                    <h5 className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider mb-2">Movie & Show Details</h5>
                    {bookingResult.showtime ? (
                      <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E8E8EA] space-y-3">
                        <div>
                          <span className="text-[10px] text-[#8E8E93] block">Movie Title</span>
                          <span className="text-sm font-bold text-[#131316]">
                            {(bookingResult.showtime as any).movie?.title || "N/A"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <span className="text-[10px] text-[#8E8E93] block">Screen</span>
                            <span className="text-sm font-semibold text-[#131316]">
                              {bookingResult.showtime.screen_name}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#8E8E93] block">Show Date & Time</span>
                            <span className="text-sm font-semibold text-[#131316]">
                              {bookingResult.showtime.show_date} at {bookingResult.showtime.show_time.slice(0, 5)}
                            </span>
                          </div>
                        </div>
                        <div className="border-t border-[#E8E8EA] pt-3">
                          <span className="text-[10px] text-[#8E8E93] block font-medium">Selected Seats</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {(bookingResult.selected_seats as string[]).map((seat) => (
                              <span key={seat} className="px-2 py-0.5 rounded bg-[#131316] text-white text-[11px] font-bold font-mono">
                                {seat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E8E8EA] text-sm text-[#8E8E93]">
                        Showtime details unavailable
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAFA] border border-[#E8E8EA]">
                      <div>
                        <span className="text-[10px] text-[#8E8E93] block">Payment Mode</span>
                        <span className="text-sm font-semibold text-[#131316] capitalize">{bookingResult.payment_mode}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#8E8E93] block">Amount Paid</span>
                        <span className="text-base font-bold text-[#34C759]">{formatCurrency(bookingResult.final_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Voucher Verification Result */}
            {activeTab === "voucher" && voucherResult && (
              <div className="bg-white border border-[#E8E8EA] rounded-2xl overflow-hidden shadow-sm">
                {/* Status Banner */}
                <div className={`p-6 border-b border-[#E8E8EA] flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  voucherResult.payment_status === "completed" ? "bg-[#34C759]/5" : "bg-[#FF3B30]/5"
                }`}>
                  <div className="flex items-center gap-3">
                    {voucherResult.payment_status === "completed" ? (
                      <CheckCircle className="w-8 h-8 text-[#34C759]" />
                    ) : voucherResult.payment_status === "pending" ? (
                      <Clock className="w-8 h-8 text-[#FF9500]" />
                    ) : (
                      <XCircle className="w-8 h-8 text-[#FF3B30]" />
                    )}
                    <div>
                      <p className="text-xs text-[#8E8E93] font-semibold uppercase tracking-wider">Voucher Status</p>
                      <h4 className="text-lg font-bold text-[#131316]">
                        {voucherResult.payment_status === "completed" ? "Verified & Active" : `Payment ${voucherResult.payment_status}`}
                      </h4>
                    </div>
                  </div>
                  <div className="bg-[#E2F1FE] px-4 py-2 rounded-xl border border-[#0B70D5]/20">
                    <span className="text-[10px] text-[#0B70D5] block font-bold uppercase tracking-wider">Voucher Code</span>
                    <span className="font-mono font-extrabold text-base text-[#0B70D5]">{voucherResult.voucher_code}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column - User Details */}
                  <div className="space-y-4">
                    <h5 className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider mb-2">Purchased By</h5>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAFA] border border-[#E8E8EA]">
                      <User className="w-5 h-5 text-[#8E8E93]" />
                      <div>
                        <span className="text-[10px] text-[#8E8E93] block">Name</span>
                        <span className="text-sm font-semibold text-[#131316]">{voucherResult.customer_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAFA] border border-[#E8E8EA]">
                      <Phone className="w-5 h-5 text-[#8E8E93]" />
                      <div>
                        <span className="text-[10px] text-[#8E8E93] block">Phone</span>
                        <span className="text-sm font-semibold text-[#131316]">{voucherResult.phone}</span>
                      </div>
                    </div>
                    {voucherResult.email && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAFA] border border-[#E8E8EA]">
                        <Mail className="w-5 h-5 text-[#8E8E93]" />
                        <div>
                          <span className="text-[10px] text-[#8E8E93] block">Email</span>
                          <span className="text-sm font-semibold text-[#131316] truncate max-w-[220px]">{voucherResult.email}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Voucher Info */}
                  <div className="space-y-4">
                    <h5 className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider mb-2">Voucher Details</h5>
                    <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E8E8EA] space-y-3">
                      <div>
                        <span className="text-[10px] text-[#8E8E93] block">Voucher Title</span>
                        <span className="text-sm font-bold text-[#131316]">
                          {voucherResult.voucher_title}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <span className="text-[10px] text-[#8E8E93] block">Paytm Order ID</span>
                          <span className="text-[11px] font-mono font-semibold text-[#131316] truncate max-w-[120px] block" title={voucherResult.paytm_order_id}>
                            {voucherResult.paytm_order_id}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#8E8E93] block">Purchased Date</span>
                          <span className="text-sm font-semibold text-[#131316]">
                            {new Date(voucherResult.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAFA] border border-[#E8E8EA]">
                      <div>
                        <span className="text-[10px] text-[#8E8E93] block">Payment Method</span>
                        <span className="text-sm font-semibold text-[#131316] capitalize">{voucherResult.payment_mode}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#8E8E93] block">Voucher Value</span>
                        <span className="text-base font-bold text-[#34C759]">{formatCurrency(voucherResult.price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
