"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle, Clock, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/shared/page-transition";
import { useBookingStore } from "@/hooks/use-booking-store";
import { cancelPendingBooking } from "@/actions/bookings";

type Status = "loading" | "success" | "pending" | "failed";

export function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const errorParam = searchParams.get("error");

  const [status, setStatus] = useState<Status>("loading");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showtimeId, setShowtimeId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { reset } = useBookingStore();

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
      if (data.showtimeId) {
        setShowtimeId(data.showtimeId);
      }

      if (data.status === "success") {
        setStatus("success");
        setBookingId(data.bookingId);
        reset();
        setTimeout(() => {
          if (data.isVoucher) {
            router.push(`/booking/voucher-status?orderId=${orderId}`);
          } else {
            router.push(`/booking/confirmation?id=${data.bookingId}`);
          }
        }, 2000);
      } else if (data.status === "pending") {
        setStatus("pending");
        setBookingId(data.bookingId);
        setMessage(data.message || "Payment is being processed.");
        if (data.isVoucher) {
          setTimeout(() => {
            router.push(`/booking/voucher-status?orderId=${orderId}`);
          }, 2000);
        }
      } else {
        setStatus("failed");
        setMessage(data.message || "Payment failed.");
      }
    } catch {
      setStatus("failed");
      setMessage("Unable to verify payment. Please try again.");
    }
  }, [orderId, reset, router]);

  useEffect(() => {
    if (errorParam) {
      setStatus("failed");
      setMessage(
        errorParam === "payment_failed"
          ? "Payment was not successful. No amount was charged."
          : errorParam === "invalid_signature"
            ? "Security verification failed. Please contact support."
            : "An error occurred during payment."
      );
      // Still try to verify in case the error was a redirect issue
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

  const handleCancelBooking = async () => {
    if (!orderId) return;
    setCancelling(true);
    try {
      const res = await cancelPendingBooking(orderId);
      if (res.showtimeId) {
        setShowtimeId(res.showtimeId);
      }

      if (res.status === "success") {
        setStatus("success");
        setBookingId(res.bookingId);
        reset();
        setTimeout(() => {
          router.push(`/booking/confirmation?id=${res.bookingId}`);
        }, 2000);
      } else {
        setStatus("failed");
        setMessage(res.message || "Booking was cancelled.");
      }
    } catch {
      setStatus("failed");
      setMessage("Unable to cancel booking. Please contact support.");
    } finally {
      setCancelling(false);
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
              <p className="text-[#545459]">Please wait while we confirm your payment…</p>
            </motion.div>
          )}

          {/* Success */}
          {status === "success" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <div className="w-24 h-24 rounded-full bg-[#34C759]/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-14 h-14 text-[#34C759]" />
              </div>
              <h2 className="text-2xl font-bold text-[#131316] mb-2">Payment Successful! 🎉</h2>
              <p className="text-[#545459] mb-6">Redirecting to your ticket…</p>
              <div className="w-6 h-6 border-2 border-[#0B70D5] border-t-transparent rounded-full animate-spin mx-auto" />
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
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleRetry}
                  disabled={retrying || cancelling}
                  className="gap-2 rounded-xl bg-[#131316] text-white hover:bg-[#2C2C30]"
                >
                  <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
                  Check Again
                </Button>
                <Button
                  onClick={handleCancelBooking}
                  disabled={retrying || cancelling}
                  variant="outline"
                  className="gap-2 rounded-xl border-[#FF3B30]/30 text-[#FF3B30] hover:bg-[#FF3B30]/10 hover:text-[#FF3B30]"
                >
                  {cancelling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Cancel Booking & Release Seats
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
                {showtimeId ? (
                  <Link href={`/booking/seats?showtime=${showtimeId}`}>
                    <Button
                      className="w-full gap-2 rounded-xl bg-[#0B70D5] text-white hover:bg-[#095eb5]"
                    >
                      Select Seats Again
                    </Button>
                  </Link>
                ) : (
                  orderId && (
                    <Button
                      onClick={handleRetry}
                      disabled={retrying}
                      className="gap-2 rounded-xl bg-[#131316] text-white hover:bg-[#2C2C30]"
                    >
                      <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
                      Retry Verification
                    </Button>
                  )
                )}
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
        </div>
      </div>
    </PageTransition>
  );
}
