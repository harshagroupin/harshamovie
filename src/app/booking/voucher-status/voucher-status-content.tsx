"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle, Clock, RefreshCw, Home, Gift, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/shared/page-transition";
import { getUserVoucherByOrderId, cancelPendingVoucher } from "@/actions/vouchers";
import type { UserVoucher } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

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
              className="space-y-6"
            >
              <div className="w-24 h-24 rounded-full bg-[#34C759]/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-14 h-14 text-[#34C759]" />
              </div>
              <h2 className="text-2xl font-bold text-[#131316]">Voucher Purchased! 🎉</h2>
              <p className="text-[#545459]">Your voucher has been saved to your profile.</p>

              {/* Voucher Card */}
              {userVoucher && (
                <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-2xl p-6 text-left text-white shadow-xl mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="w-5 h-5 text-[#0B70D5]" />
                    <span className="text-sm font-bold text-white/60">Voucher</span>
                  </div>
                  <h3 className="text-lg font-bold mb-1">{userVoucher.voucher_title}</h3>
                  <p className="text-sm text-white/50 mb-4">
                    Amount Paid: {formatCurrency(userVoucher.price)}
                  </p>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/20">
                    <div>
                      <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider mb-0.5">
                        Voucher Code
                      </p>
                      <p className="text-base font-bold font-mono tracking-wider">
                        {userVoucher.voucher_code}
                      </p>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-white/15 hover:bg-white/25 text-white transition-all border-0 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 mt-4">
                <Link href="/profile">
                  <Button className="w-full gap-2 rounded-xl bg-[#131316] text-white hover:bg-[#2C2C30]">
                    <Gift className="w-4 h-4" />
                    View in Profile
                  </Button>
                </Link>
                <Link href="/">
                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-xl border-[#E8E8EA] text-[#545459] hover:bg-[#F5F5F6]"
                  >
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
