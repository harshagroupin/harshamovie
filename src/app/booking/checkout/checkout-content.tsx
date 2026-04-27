"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Tag, CreditCard, Banknote, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageTransition } from "@/components/shared/page-transition";
import { useBookingStore } from "@/hooks/use-booking-store";
import { createBooking } from "@/actions/bookings";
import { validatePromoCode } from "@/actions/promos";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { toast } from "sonner";

export function CheckoutContent() {
  const router = useRouter();
  const store = useBookingStore();
  const {
    movieTitle, moviePoster, selectedSeats, price,
    showDate, showTime, screenName, showtimeId,
    promoCode, discount, discountType,
    paymentMode,
    setCustomerInfo, setPromo, clearPromo, setPaymentMode,
  } = store;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = selectedSeats.length * price;
  let discountAmount = 0;
  if (discount && discountType === "percentage") {
    discountAmount = (subtotal * discount) / 100;
  } else if (discount && discountType === "fixed") {
    discountAmount = discount;
  }
  const finalAmount = Math.max(0, subtotal - discountAmount);

  if (!showtimeId || selectedSeats.length === 0) {
    return (
      <div className="container-app py-20 text-center">
        <p className="text-muted mb-4">No booking in progress. Please select a movie and seats first.</p>
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

      const booking = await createBooking({
        showtimeId: showtimeId!,
        customerName: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        selectedSeats,
        subtotal,
        discount: discountAmount,
        finalAmount,
        promoCodeUsed: promoCode || null,
        paymentMode,
      });

      toast.success("Booking confirmed!");
      router.push(`/booking/confirmation?id=${booking.booking_id}`);
    } catch (err: any) {
      toast.error(err.message || "Booking failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="container-app py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Seats
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form — 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            <h1 className="font-display text-2xl font-bold">Checkout</h1>

            {/* Guest Details */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-display font-semibold text-lg mb-4">Guest Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
                  {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" maxLength={10} />
                  {errors.phone && <p className="text-xs text-danger">{errors.phone}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
                  {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* Promo Code */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-gold" /> Promo Code
              </h3>
              <div className="flex gap-3">
                <Input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="uppercase"
                />
                <Button onClick={handleApplyPromo} disabled={promoLoading} variant="outline">
                  {promoLoading ? "..." : "Apply"}
                </Button>
              </div>
              {promoMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-2 mt-3 text-sm ${promoMessage.success ? "text-success" : "text-danger"}`}
                >
                  {promoMessage.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {promoMessage.text}
                </motion.div>
              )}
              <p className="text-xs text-muted-dark mt-2">Enter a valid promo code to get discounts on your tickets.</p>
            </div>

            {/* Payment Mode */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gold" /> Payment Mode
              </h3>
              <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as "cash")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <span className="flex items-center gap-2"><Banknote className="w-4 h-4" /> Cash At Counter</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-dark mt-2">Razorpay integration coming soon. Pay at the counter to confirm your seats.</p>
            </div>
          </div>

          {/* Price Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass rounded-xl p-6 sticky top-24">
              <h3 className="font-display font-bold text-lg mb-4">Order Summary</h3>
              <Separator className="mb-4" />

              {moviePoster && (
                <div className="flex gap-3 mb-4">
                  <div className="relative w-14 h-20 rounded-lg overflow-hidden shrink-0">
                    <Image src={moviePoster} alt={movieTitle || ""} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{movieTitle}</p>
                    <p className="text-xs text-muted mt-1">{showDate && formatDate(showDate)}</p>
                    <p className="text-xs text-muted">{showTime && formatTime(showTime)}</p>
                    <p className="text-xs text-gold mt-1">{screenName}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 mb-4">
                {selectedSeats.sort().map((seat) => (
                  <span key={seat} className="px-2 py-1 text-xs font-mono rounded bg-accent/20 text-accent border border-accent/30">
                    {seat}
                  </span>
                ))}
              </div>

              <Separator className="mb-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal ({selectedSeats.length} seats)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount ({promoCode})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-accent">{formatCurrency(finalAmount)}</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full rounded-xl mt-6"
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
    </PageTransition>
  );
}
