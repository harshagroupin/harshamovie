"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2, CheckCircle, XCircle, Clock, RefreshCw, Home, Gift, Copy, Check,
  Printer, UtensilsCrossed, QrCode, Ticket, Tag, MapPin, Calendar, ShieldCheck,
  ChevronRight, Heart, Store, Smartphone, CircleCheckBig,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/shared/page-transition";
import { getUserVoucherByOrderId, cancelPendingVoucher } from "@/actions/vouchers";
import type { UserVoucher } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { BUSINESS } from "@/lib/constants";

type Status = "loading" | "success" | "pending" | "failed";

export function VoucherStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const errorParam = searchParams.get("error");

  const [status, setStatus] = useState<Status>("loading");
  const [userVoucher, setUserVoucher] = useState<UserVoucher | null>(null);
  const [message, setMessage] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);

  const verifyPayment = useCallback(async () => {
    if (!orderId) {
      setStatus("failed");
      setMessage("No order ID provided.");
      return;
    }

    try {
      const res = await fetch("/api/paytm/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (data.status === "success") {
        setStatus("success");
        const voucher = await getUserVoucherByOrderId(orderId);
        setUserVoucher(voucher);
      } else if (data.status === "pending") {
        setStatus("pending");
        setMessage(data.message || "Payment is being processed.");
      } else {
        setStatus("failed");
        setMessage(data.message || "Payment failed.");
      }
    } catch {
      setStatus("failed");
      setMessage("Unable to verify payment. Please try again.");
    }
  }, [orderId]);

  useEffect(() => {
    if (errorParam) {
      setStatus("failed");
      setMessage(
        errorParam === "payment_failed"
          ? "Payment was not successful. No amount was charged."
          : "An error occurred during payment."
      );
      if (orderId) verifyPayment();
      return;
    }
    verifyPayment();
  }, [errorParam, orderId, verifyPayment]);

  const handleRetry = async () => {
    setRetrying(true);
    setStatus("loading");
    await verifyPayment();
    setRetrying(false);
  };

  const handleCancel = async () => {
    if (!orderId) return;
    setCancelling(true);
    try {
      const res = await cancelPendingVoucher(orderId);
      if (res.status === "success") {
        setStatus("success");
        const voucher = await getUserVoucherByOrderId(orderId);
        setUserVoucher(voucher);
      } else {
        setStatus("failed");
        setMessage(res.message || "Order was cancelled.");
      }
    } catch {
      setStatus("failed");
      setMessage("Unable to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    const element = document.getElementById("voucher-ticket-card");
    if (!element) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(element, {
        quality: 0.95,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 140;
      const rect = element.getBoundingClientRect();
      const imgHeight = (rect.height * imgWidth) / rect.width;
      const xOffset = (210 - imgWidth) / 2;
      const yOffset = 20;

      pdf.addImage(dataUrl, "PNG", xOffset, yOffset, imgWidth, imgHeight);
      pdf.save(`voucher-${userVoucher?.voucher_code || "code"}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = () => {
    if (userVoucher?.voucher_code) {
      navigator.clipboard.writeText(userVoucher.voucher_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isFood = userVoucher?.voucher?.voucher_type === "food";

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F6] pt-[80px] pb-12">
        <div className="max-w-[440px] mx-auto px-4 sm:px-6 text-center">
          {/* Loading */}
          {status === "loading" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Loader2 className="w-16 h-16 text-[#0B70D5] mx-auto mb-6 animate-spin" />
              <h2 className="text-2xl font-bold text-[#131316] mb-2">Verifying Payment</h2>
              <p className="text-[#545459]">Please wait while we confirm your voucher purchase…</p>
            </motion.div>
          )}

          {/* ========== SUCCESS ========== */}
          {status === "success" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="space-y-6 max-w-lg mx-auto print:space-y-0 print:max-w-none"
            >
              <div className="w-20 h-20 rounded-full bg-[#34C759]/10 flex items-center justify-center mx-auto print:hidden">
                <CheckCircle className="w-12 h-12 text-[#34C759]" />
              </div>
              <div className="print:hidden">
                <h2 className="text-2xl font-bold text-[#131316] mb-1">Voucher Purchased! 🎉</h2>
                <p className="text-[#545459] text-sm">Show this voucher at the counter to redeem.</p>
              </div>

              {/* 🎫 PREMIUM VOUCHER CARD */}
              {userVoucher && (
                <VoucherCard
                  userVoucher={userVoucher}
                  isFood={isFood}
                  copied={copied}
                  onCopy={handleCopy}
                />
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mt-4 print:hidden">
                <Button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="flex-1 gap-1.5 rounded-xl bg-[#131316] text-white hover:bg-[#2C2C30] text-sm disabled:opacity-60"
                >
                  {downloading ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4" />
                  )}
                  {downloading ? "Generating PDF..." : "Download PDF"}
                </Button>
                <Link href="/profile" className="flex-1">
                  <Button variant="outline" className="w-full gap-1.5 rounded-xl border-[#E8E8EA] text-[#545459] hover:bg-white text-sm">
                    <Gift className="w-4 h-4" />
                    My Vouchers
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full gap-1.5 rounded-xl border-[#E8E8EA] text-[#545459] hover:bg-white text-sm">
                    <Home className="w-4 h-4" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Pending */}
          {status === "pending" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="w-24 h-24 rounded-full bg-[#FF9500]/10 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-14 h-14 text-[#FF9500]" />
              </div>
              <h2 className="text-2xl font-bold text-[#131316] mb-2">Payment Processing</h2>
              <p className="text-[#545459] mb-6">{message}</p>
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <Button
                  onClick={handleRetry}
                  disabled={retrying || cancelling}
                  className="gap-2 rounded-xl bg-[#131316] text-white hover:bg-[#2C2C30]"
                >
                  <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
                  Check Again
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={retrying || cancelling}
                  variant="outline"
                  className="gap-2 rounded-xl border-[#E8E8EA] text-[#FF3B30] hover:bg-[#FF3B30]/5 hover:border-[#FF3B30]/20"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel & Go Back"
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Failed */}
          {status === "failed" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="w-24 h-24 rounded-full bg-[#FF3B30]/10 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-14 h-14 text-[#FF3B30]" />
              </div>
              <h2 className="text-2xl font-bold text-[#131316] mb-2">Payment Failed</h2>
              <p className="text-[#545459] mb-6">{message}</p>
              <div className="flex flex-col gap-3">
                {orderId && (
                  <Button
                    onClick={handleRetry}
                    disabled={retrying}
                    className="gap-2 rounded-xl bg-[#131316] text-white hover:bg-[#2C2C30]"
                  >
                    <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
                    Retry Verification
                  </Button>
                )}
                <Link href="/?tab=offers">
                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-xl border-[#E8E8EA] text-[#545459] hover:bg-white"
                  >
                    <Home className="w-4 h-4" />
                    Back to Offers
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

/* ===================================================================
   PREMIUM VOUCHER CARD — matches the reference food voucher design
   =================================================================== */

function VoucherCard({
  userVoucher,
  isFood,
  copied,
  onCopy,
}: {
  userVoucher: UserVoucher;
  isFood: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div
      id="voucher-ticket-card"
      className="bg-white rounded-3xl overflow-hidden shadow-xl text-left print:shadow-none print:break-inside-avoid"
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
          <div className="flex items-center gap-2">
            {isFood ? (
              <span className="text-2xl">🍿</span>
            ) : (
              <span className="text-2xl">🎬</span>
            )}
            <div>
              <p className="text-white font-bold text-[13px] tracking-wide">
                {isFood ? "FOOD VOUCHER" : "TICKET PROMO"}
              </p>
              <p className="text-white/50 text-[10px] font-medium">
                {isFood ? "Enjoy Your Snacks! 🎬" : "Enjoy Your Show! 🎬"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── VOUCHER ID SECTION ── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#E50914]/10 flex items-center justify-center shrink-0">
            {isFood ? (
              <UtensilsCrossed className="w-8 h-8 text-[#E50914]" />
            ) : (
              <Ticket className="w-8 h-8 text-[#E50914]" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 border-l-2 border-[#E8E8EA] pl-4">
            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-0.5">Voucher ID</p>
            <p className="text-xl font-black text-[#131316] tracking-wider font-mono mb-1">{userVoucher.voucher_code}</p>
            <p className="text-[12px] text-[#8E8E93] leading-relaxed">
              Valid for the items and quantity mentioned below.
            </p>
          </div>
        </div>
      </div>

      {/* ── DETAILS SECTION ── */}
      <div className="px-5 pb-4 space-y-3">
        {/* Voucher title / description */}
        <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E8E8EA]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E8EA] flex items-center justify-center shrink-0 mt-0.5">
              {isFood ? (
                <span className="text-lg">🍿</span>
              ) : (
                <Tag className="w-5 h-5 text-[#0B70D5]" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-bold text-[#131316] leading-snug">{userVoucher.voucher_title}</h3>
              {userVoucher.voucher?.description && (
                <p className="text-[12px] text-[#8E8E93] mt-1 leading-relaxed">{userVoucher.voucher.description}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider block">Paid</span>
              <span className="text-base font-black text-[#E50914]">{formatCurrency(userVoucher.price)}</span>
            </div>
          </div>
        </div>

        {/* Redeem At + Purchase Date row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E8E8EA]">
            <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1.5">Redeem At</p>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#E50914] shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-bold text-[#131316] leading-tight">Harsh A Movie</p>
                <p className="text-[10px] text-[#8E8E93] leading-tight mt-0.5">{BUSINESS.streetAddress}, {BUSINESS.city}, {BUSINESS.state}</p>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E8E8EA]">
            <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1.5">Purchased On</p>
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-[#E50914] shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-bold text-[#131316] leading-tight">
                  {new Date(userVoucher.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="text-[10px] text-[#8E8E93] leading-tight mt-0.5">
                  {new Date(userVoucher.created_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#545459] px-1">
          <div>
            <span className="text-[#8E8E93] font-medium mr-1">Holder:</span>
            <span className="text-[#131316] font-bold">{userVoucher.customer_name}</span>
          </div>
          <div>
            <span className="text-[#8E8E93] font-medium mr-1">Phone:</span>
            <span className="text-[#131316] font-bold">{userVoucher.phone}</span>
          </div>
        </div>
      </div>

      {/* ── DIVIDER (tear line) ── */}
      <div className="relative flex items-center mx-0">
        <div className="absolute left-0 w-4 h-8 bg-[#F5F5F6] rounded-r-full print:bg-white" />
        <div className="w-full border-t-2 border-dashed border-[#E8E8EA]" />
        <div className="absolute right-0 w-4 h-8 bg-[#F5F5F6] rounded-l-full print:bg-white" />
      </div>

      {/* ── HOW TO REDEEM ── */}
      <div className="px-5 py-4">
        <p className="text-[11px] font-bold text-[#E50914] uppercase tracking-wider mb-3">How to Redeem</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-[#E50914]/8 border border-[#E50914]/15 flex items-center justify-center">
              <Store className="w-5 h-5 text-[#E50914]" />
            </div>
            <p className="text-[10px] text-[#545459] leading-tight font-medium">
              Visit the {isFood ? "food" : ""} counter at Harsh A Movie
            </p>
          </div>
          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-[#E50914]/8 border border-[#E50914]/15 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-[#E50914]" />
            </div>
            <p className="text-[10px] text-[#545459] leading-tight font-medium">
              Show this voucher to the staff
            </p>
          </div>
          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-[#E50914]/8 border border-[#E50914]/15 flex items-center justify-center">
              <CircleCheckBig className="w-5 h-5 text-[#E50914]" />
            </div>
            <p className="text-[10px] text-[#545459] leading-tight font-medium">
              Collect your items and enjoy!
            </p>
          </div>
        </div>
      </div>

      {/* ── QR + BOOKING ID + BARCODE ── */}
      <div className="mx-5 mb-4 p-4 rounded-2xl bg-[#FAFAFA] border border-[#E8E8EA]">
        <div className="flex items-center gap-4">
          {/* Booking ID */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mb-0.5">Booking ID</p>
            <div className="flex items-center gap-2">
              <p className="text-base font-black text-[#E50914] tracking-wider font-mono truncate">{userVoucher.voucher_code}</p>
              <button
                onClick={onCopy}
                className="p-1.5 rounded-lg bg-white text-[#E50914] border border-[#E50914]/10 hover:bg-[#E50914]/5 transition-colors cursor-pointer print:hidden shrink-0"
                title="Copy Code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center shrink-0 border-l border-[#E8E8EA] pl-4">
            <div className="w-14 h-14 rounded-xl bg-white border border-[#E8E8EA] flex items-center justify-center mb-1">
              <QrCode className="w-9 h-9 text-[#131316]" />
            </div>
            <p className="text-[7px] text-[#8E8E93] font-mono tracking-wider">Show QR code</p>
            <p className="text-[7px] text-[#8E8E93] font-mono tracking-wider">at the {isFood ? "food" : ""} counter</p>
          </div>

          {/* Barcode */}
          <div className="flex flex-col items-center shrink-0 border-l border-[#E8E8EA] pl-4">
            <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Scan at Counter</p>
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
          </div>
        </div>
      </div>

      {/* ── TERMS & CONDITIONS ── */}
      <div className="px-5 pb-4">
        <p className="text-[11px] font-bold text-[#131316] uppercase tracking-wider mb-2">Terms & Conditions</p>
        <ul className="space-y-1">
          {[
            "This voucher is valid only for the items and quantity mentioned.",
            "Voucher can be redeemed only at Harsh A Movie cinema.",
            "This voucher is not exchangeable for cash.",
            "Harsh A Movie reserves the right to refuse service in case of misuse.",
          ].map((term, i) => (
            <li key={i} className="text-[10px] text-[#8E8E93] leading-relaxed flex items-start gap-1.5">
              <span className="text-[#8E8E93] mt-0.5">•</span>
              {term}
            </li>
          ))}
        </ul>
      </div>

      {/* ── FOOTER: Thank you strip ── */}
      <div className="bg-[#E50914] px-5 py-3 flex items-center justify-center gap-3">
        <Heart className="w-4 h-4 text-white fill-white" />
        <span className="text-white font-bold text-[13px] italic">Thank you!</span>
        <span className="text-white/70 text-[11px]">|</span>
        <span className="text-white/80 text-[11px] font-medium">
          We hope you enjoy your movie and snacks! 🎬
        </span>
      </div>
    </div>
  );
}
