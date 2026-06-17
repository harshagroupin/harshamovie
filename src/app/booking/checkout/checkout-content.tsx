"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Tag, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/shared/page-transition";
import { useBookingStore } from "@/hooks/use-booking-store";
import { createBooking } from "@/actions/bookings";
import { validatePromoCode } from "@/actions/promos";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useBookingStore();
  const {
    movieTitle, moviePoster, selectedSeats, price,
    showDate, showTime, screenName, showtimeId,
    promoCode, discount, discountType,
    paymentMode,
    setCustomerInfo, setPromo, clearPromo, setPaymentMode,
    getSubtotal, getFinalAmount
  } = store;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle error redirects from Paytm callback
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "payment_failed") toast.error("Payment failed. Please try again.");
    else if (error === "callback_error") toast.error("Payment processing error. Please contact support.");
    else if (error === "transaction_not_found") toast.error("Transaction not found.");
    else if (error === "invalid_callback") toast.error("Invalid payment response.");
  }, [searchParams]);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (user.email) setEmail(user.email);
        if (user.user_metadata?.full_name) setName(user.user_metadata.full_name);
        if (user.user_metadata?.phone) setPhone(user.user_metadata.phone);
      }
    };
    fetchUser();
  }, []);

  const subtotal = getSubtotal();
  const finalAmount = getFinalAmount();
  let discountAmount = subtotal - finalAmount;

  if (!showtimeId || selectedSeats.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <p className="text-[#545459]">No booking in progress. Please select a movie and seats first.</p>
        <Link href="/"><Button>Back to Home</Button></Link>
      </div>
    );
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!phone.trim()) newErrors.phone = "Phone is required";
    else if (!/^\d{10}$/.test(phone.trim())) newErrors.phone = "Enter a valid 10-digit phone number";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Enter a valid email";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    try {
      const result = await validatePromoCode(promoInput.trim());
      if (result.valid) {
        setPromo(promoInput.trim().toUpperCase(), result.discount, result.type);
        setPromoMessage({ text: result.message, success: true });
      } else {
        clearPromo();
        setPromoMessage({ text: result.message, success: false });
      }
    } catch {
      setPromoMessage({ text: "Error validating promo code", success: false });
    }
    setPromoLoading(false);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      setCustomerInfo({ name, phone, email });

      const res = await fetch("/api/paytm/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showtimeId: showtimeId!,
          selectedSeats,
          customerName: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          subtotal,
          discount: discountAmount,
          finalAmount,
          promoCode: promoCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      loadPaytmCheckout(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment initiation failed.";
      toast.error(msg);
      setSubmitting(false);
    }
  };

  /** Load Paytm JS Checkout and invoke payment overlay */
  const loadPaytmCheckout = (data: {
    txnToken: string;
    orderId: string;
    mid: string;
    amount: string;
  }) => {
    // Remove previous script if any
    const old = document.getElementById("paytm-checkout-js");
    if (old) old.remove();

    const script = document.createElement("script");
    script.id = "paytm-checkout-js";
    script.src = `https://securegw.paytm.in/merchantpgpui/checkoutjs/merchants/${data.mid}.js`;
    script.crossOrigin = "anonymous";

    script.onload = () => {
      const config = {
        root: "",
        flow: "DEFAULT",
        data: {
          orderId: data.orderId,
          token: data.txnToken,
          tokenType: "TXN_TOKEN",
          amount: data.amount,
        },
        handler: {
          transactionStatus: function (paymentStatus: Record<string, unknown>) {
            console.log("[Paytm] Transaction status:", paymentStatus);
            window.location.href = `/booking/payment-status?orderId=${data.orderId}`;
          },
          notifyMerchant: function (eventName: string) {
            console.log("[Paytm] Event:", eventName);
            if (eventName === "APP_CLOSED") {
              // User closed overlay — verify if payment went through
              window.location.href = `/booking/payment-status?orderId=${data.orderId}`;
            }
          },
        },
      };

      const w = window as unknown as Record<string, Record<string, { init: (c: unknown) => Promise<void>; invoke: () => void }>>;
      if (w.Paytm?.CheckoutJS) {
        w.Paytm.CheckoutJS.init(config)
          .then(() => w.Paytm.CheckoutJS.invoke())
          .catch((err: unknown) => {
            console.error("[Paytm] Init error:", err);
            toast.error("Failed to open payment gateway");
            setSubmitting(false);
          });
      } else {
        toast.error("Payment gateway not available");
        setSubmitting(false);
      }
    };

    script.onerror = () => {
      toast.error("Failed to load payment gateway. Please try again.");
      setSubmitting(false);
    };

    document.body.appendChild(script);
  };

  return (
    <PageTransition>
      <div className="min-h-screen pt-4 pb-12 bg-white">
        <div className="container-app">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[#8E8E93] hover:text-[#131316] transition-colors mb-8 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Seats
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form — 2 cols */}
            <div className="lg:col-span-2 space-y-6">
              <h1 className="text-2xl md:text-3xl font-bold text-[#131316]">Checkout</h1>

              {/* Guest Details */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-lg text-[#131316] mb-5">Guest Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#545459] text-[13px]">Full Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="bg-white border-[#E8E8EA] text-[#131316] placeholder:text-[#8E8E93] focus:border-[#0B70D5] focus:ring-[#0B70D5]/20"
                    />
                    {errors.name && <p className="text-xs text-[#FF3B30]">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[#545459] text-[13px]">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit number"
                      maxLength={10}
                      className="bg-white border-[#E8E8EA] text-[#131316] placeholder:text-[#8E8E93] focus:border-[#0B70D5] focus:ring-[#0B70D5]/20"
                    />
                    {errors.phone && <p className="text-xs text-[#FF3B30]">{errors.phone}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email" className="text-[#545459] text-[13px]">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="bg-white border-[#E8E8EA] text-[#131316] placeholder:text-[#8E8E93] focus:border-[#0B70D5] focus:ring-[#0B70D5]/20"
                    />
                    {errors.email && <p className="text-xs text-[#FF3B30]">{errors.email}</p>}
                  </div>
                </div>
              </div>

              {/* Promo Code */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-lg text-[#131316] mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#0B70D5]" /> Promo Code
                </h3>
                <div className="flex gap-3">
                  <Input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="uppercase bg-white border-[#E8E8EA] text-[#131316] placeholder:text-[#8E8E93] focus:border-[#0B70D5]"
                  />
                  <Button
                    onClick={handleApplyPromo}
                    disabled={promoLoading}
                    variant="outline"
                    className="border-[#E8E8EA] text-[#545459] hover:bg-[#F5F5F6] hover:text-[#131316]"
                  >
                    {promoLoading ? "..." : "Apply"}
                  </Button>
                </div>
                {promoMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-2 mt-3 text-sm ${promoMessage.success ? "text-[#34C759]" : "text-[#FF3B30]"}`}
                  >
                    {promoMessage.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {promoMessage.text}
                  </motion.div>
                )}
                <p className="text-[11px] text-[#8E8E93] mt-2">Enter a valid promo code to get discounts.</p>
              </div>

              {/* Payment Mode */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-lg text-[#131316] mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#0B70D5]" /> Payment Method
                </h3>
                <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#0B70D5] bg-[#E2F1FE] text-[#0B70D5]">
                  <CreditCard className="w-6 h-6" />
                  <div>
                    <span className="text-[14px] font-semibold">Pay Online (Paytm)</span>
                    <p className="text-[11px] text-[#0B70D5]/70 mt-0.5">You will be redirected to Paytm to complete payment securely.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="glass rounded-2xl p-6 sticky top-20">
                <h3 className="font-bold text-lg text-[#131316] mb-5">Order Summary</h3>
                <div className="border-t border-[#E8E8EA] pt-4 mb-4" />

                {moviePoster && (
                  <div className="flex gap-3 mb-5">
                    <div className="relative w-14 h-20 rounded-lg overflow-hidden shrink-0 border border-[#E8E8EA]">
                      <Image src={moviePoster} alt={movieTitle || ""} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#131316]">{movieTitle}</p>
                      <p className="text-[12px] text-[#8E8E93] mt-1">{showDate && formatDate(showDate)}</p>
                      <p className="text-[12px] text-[#8E8E93]">{showTime && formatTime(showTime)}</p>
                      <p className="text-[12px] text-[#0B70D5] mt-1 font-medium">{screenName}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedSeats.sort().map((seat) => (
                    <span key={seat} className="px-2.5 py-1 text-[11px] font-mono rounded-md bg-[#E2F1FE] text-[#0B70D5] border border-[#0B70D5]/20 font-semibold">
                      {seat}
                    </span>
                  ))}
                </div>

                <div className="border-t border-[#E8E8EA] pt-4 mb-5" />

                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8E8E93]">Subtotal ({selectedSeats.length} seats)</span>
                    <span className="text-[#545459]">{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-[#34C759]">
                      <span>Discount ({promoCode})</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t border-[#E8E8EA] pt-2.5" />
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-[#131316]">Total</span>
                    <span className="text-[#0B70D5]">{formatCurrency(finalAmount)}</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full rounded-xl bg-[#131316] text-white font-bold text-[15px] py-6 mt-6 hover:bg-[#2C2C30] transition-all"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    `Pay ${formatCurrency(finalAmount)}`
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
