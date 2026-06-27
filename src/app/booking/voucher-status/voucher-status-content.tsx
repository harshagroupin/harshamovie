"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle, Clock, RefreshCw, Home, Gift, Copy, Check, Printer, Info, UtensilsCrossed, QrCode, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/shared/page-transition";
import { getUserVoucherByOrderId, cancelPendingVoucher } from "@/actions/vouchers";
import type { UserVoucher } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

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
        // Fetch voucher details
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

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-white pt-[80px]">
        <div className="max-w-md mx-auto px-6 text-center">
          {/* Loading */}
          {status === "loading" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Loader2 className="w-16 h-16 text-[#0B70D5] mx-auto mb-6 animate-spin" />
              <h2 className="text-2xl font-bold text-[#131316] mb-2">Verifying Payment</h2>
              <p className="text-[#545459]">Please wait while we confirm your voucher purchase…</p>
            </motion.div>
          )}

          {/* Success */}
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
                <p className="text-[#545459] text-sm">Show this voucher ticket at the counter to redeem your items.</p>
              </div>

              {/* 🎫 PREMIUM PRINTABLE TICKET CARD 🎫 */}
              {userVoucher && (
                <div id="voucher-ticket-card" className="bg-white border border-[#E8E8EA] rounded-3xl overflow-hidden shadow-xl text-left flex flex-col relative print:border-0 print:shadow-none print:m-0">
                  
                  {/* Top section: Brand & Header */}
                  <div className="bg-[#131316] text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm tracking-widest text-[#E50914] uppercase">HARSHA A MOVIE</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/90 text-[9px] font-bold tracking-wider uppercase">
                      {userVoucher.voucher?.voucher_type === "food" ? "Food Voucher" : "Ticket Promo"}
                    </span>
                  </div>

                  {/* Banner Image */}
                  {userVoucher.voucher?.image_url && (
                    <div className="relative w-full aspect-[4/1] bg-[#F5F5F6] border-b border-[#E8E8EA] print:hidden">
                      <img
                        src={userVoucher.voucher.image_url}
                        alt={userVoucher.voucher_title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Main Details */}
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-base font-extrabold text-[#131316] leading-snug">{userVoucher.voucher_title}</h3>
                        <p className="text-[11px] text-[#8E8E93] mt-0.5">Purchased on {new Date(userVoucher.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[#8E8E93] text-[9px] font-bold uppercase tracking-wider block">Paid</span>
                        <span className="text-[#0B70D5] font-black text-base">{formatCurrency(userVoucher.price)}</span>
                      </div>
                    </div>

                    {/* Customer info: Simple inline list */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#545459] border-t border-b border-[#F0F0F2] py-2">
                      <div>
                        <span className="text-[#8E8E93] font-medium mr-1">Holder:</span>
                        <span className="text-[#131316] font-bold">{userVoucher.customer_name}</span>
                      </div>
                      <div>
                        <span className="text-[#8E8E93] font-medium mr-1">Phone:</span>
                        <span className="text-[#131316] font-bold">{userVoucher.phone}</span>
                      </div>
                    </div>

                    {/* Dotted Tear Line Divider */}
                    <div className="relative flex items-center justify-between py-1">
                      <div className="absolute left-[-21px] w-4 h-4 rounded-full bg-white border-r border-[#E8E8EA] print:hidden" />
                      <div className="w-full border-t border-dashed border-[#8E8E93]/30" />
                      <div className="absolute right-[-21px] w-4 h-4 rounded-full bg-white border-l border-[#E8E8EA] print:hidden" />
                    </div>

                    {/* Redeem Code & QR Section: side by side to save height! */}
                    <div className="flex items-center justify-between bg-[#FAFAFA] border border-[#E8E8EA] rounded-2xl p-4">
                      <div className="space-y-1">
                        <span className="text-[#8E8E93] text-[9px] font-bold uppercase tracking-wider block">REDEEM CODE</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg font-black text-[#0B70D5] tracking-wider">
                            {userVoucher.voucher_code}
                          </span>
                          <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-lg bg-white text-[#0B70D5] border border-[#0B70D5]/10 hover:bg-[#E2F1FE] transition-colors cursor-pointer print:hidden"
                            title="Copy Code"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center shrink-0 border-l border-[#E8E8EA] pl-4">
                        <QrCode className="w-10 h-10 text-[#131316]" />
                        <span className="text-[7px] text-[#8E8E93] font-bold mt-1 tracking-wider">SHOW AT COUNTER</span>
                      </div>
                    </div>

                    {/* Compact instruction note */}
                    <p className="text-[10px] text-[#8E8E93] leading-snug text-center italic">
                      * Present this voucher screen or code at the counter to redeem.
                    </p>

                  </div>
                </div>
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
                  <Button variant="outline" className="w-full gap-1.5 rounded-xl border-[#E8E8EA] text-[#545459] hover:bg-[#F5F5F6] text-sm">
                    <Gift className="w-4 h-4" />
                    My Vouchers
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full gap-1.5 rounded-xl border-[#E8E8EA] text-[#545459] hover:bg-[#F5F5F6] text-sm">
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
                    className="w-full gap-2 rounded-xl border-[#E8E8EA] text-[#545459] hover:bg-[#F5F5F6]"
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
