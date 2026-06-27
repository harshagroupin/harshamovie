"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Gift, CreditCard, FileText, Loader2, ArrowLeft, Calendar, ShieldCheck, User, Phone, Mail } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { PageTransition } from "@/components/shared/page-transition";
import { getVoucherById } from "@/actions/vouchers";
import type { Voucher } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function VoucherDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchVoucherAndUser = async () => {
      try {
        const data = await getVoucherById(id);
        if (!data) {
          toast.error("Voucher not found");
          router.push("/?tab=offers");
          return;
        }
        setVoucher(data);

        // Fetch current user metadata to prefill form
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (user.email) setEmail(user.email);
          if (user.user_metadata?.full_name) setName(user.user_metadata.full_name);
          if (user.user_metadata?.phone) setPhone(user.user_metadata.phone);
        }
      } catch (err) {
        console.error("Voucher fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchVoucherAndUser();
  }, [id, router]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!phone.trim()) newErrors.phone = "Phone is required";
    else if (!/^\d{10}$/.test(phone.trim())) newErrors.phone = "Enter valid 10-digit phone";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Enter valid email";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !voucher) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/paytm/create-voucher-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voucherId: voucher.id,
          customerName: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          price: voucher.price,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      // Load Paytm Checkout
      const old = document.getElementById("paytm-checkout-js");
      if (old) old.remove();

      const script = document.createElement("script");
      script.id = "paytm-checkout-js";
      script.src = `https://secure.paytmpayments.com/merchantpgpui/checkoutjs/merchants/${data.mid}.js`;
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
              console.log("[Paytm Voucher] Transaction status:", paymentStatus);
              window.location.href = `/booking/voucher-status?orderId=${data.orderId}`;
            },
            notifyMerchant: function (eventName: string) {
              console.log("[Paytm Voucher] Event:", eventName);
              if (eventName === "APP_CLOSED") {
                window.location.href = `/booking/voucher-status?orderId=${data.orderId}`;
              }
            },
          },
        };

        const paytm = (window as any).Paytm;
        if (paytm && paytm.CheckoutJS) {
          const initCheckout = () => {
            if (typeof paytm.CheckoutJS.init === "function") {
              paytm.CheckoutJS.init(config)
                .then(() => {
                  if (typeof paytm.CheckoutJS.invoke === "function") {
                    paytm.CheckoutJS.invoke();
                  }
                })
                .catch((err: unknown) => {
                  console.error("[Paytm Voucher] Init error:", err);
                  toast.error("Failed to open payment gateway");
                  setSubmitting(false);
                });
            }
          };

          if (typeof paytm.CheckoutJS.onLoad === "function") {
            paytm.CheckoutJS.onLoad(() => initCheckout());
          } else {
            initCheckout();
          }
        } else {
          toast.error("Payment gateway not available");
          setSubmitting(false);
        }
      };

      script.onerror = () => {
        toast.error("Failed to load payment gateway.");
        setSubmitting(false);
      };

      document.body.appendChild(script);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment initiation failed.";
      toast.error(msg);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-[#0B70D5] animate-spin" />
      </div>
    );
  }

  if (!voucher) return null;

  // Expiry styling and checks
  const isExpired = voucher.expiry_date ? new Date(voucher.expiry_date) < new Date() : false;
  const isSoldOut = (voucher.usage_limit || 0) > 0 && (voucher.times_used || 0) >= (voucher.usage_limit || 0);

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="min-h-screen bg-[#F8F9FA] pt-[80px] pb-16">
          <div className="max-w-5xl mx-auto px-4">
            
            {/* Back Button */}
            <Link href="/?tab=offers" className="inline-flex items-center gap-2 text-sm text-[#545459] hover:text-[#131316] font-semibold mb-6 transition-colors no-underline">
              <ArrowLeft className="w-4 h-4" />
              Back to Offers
            </Link>

            {/* Main Details Card */}
            <div className="bg-white border border-[#E8E8EA] rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row">
              
              {/* Left Column: Image Banner and Details */}
              <div className="flex-1 border-b md:border-b-0 md:border-r border-[#E8E8EA]">
                <div className="relative w-full aspect-[16/9] bg-[#F5F5F6]">
                  <Image
                    src={voucher.image_url}
                    alt={voucher.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </div>
                <div className="p-6 md:p-8 space-y-6">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-[#131316] leading-tight mb-2">{voucher.title}</h1>
                    <p className="text-[#545459] text-sm leading-relaxed">{voucher.description}</p>
                  </div>

                  {/* Badges and Info */}
                  <div className="flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E2F1FE] border border-[#0B70D5]/20 text-[#0B70D5] text-xs font-bold">
                      <CreditCard className="w-3.5 h-3.5" />
                      Voucher Price: {formatCurrency(voucher.price)}
                    </div>
                    {voucher.expiry_date && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAFA] border border-[#E8E8EA] text-[#545459] text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        Expires on: {new Date(voucher.expiry_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    )}
                  </div>

                  {/* Terms & Conditions */}
                  {voucher.terms && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-[#131316] flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#8E8E93]" />
                        Terms & Conditions
                      </h4>
                      <div className="bg-[#FAFAFA] rounded-xl p-4 border border-[#E8E8EA]">
                        <p className="text-[#545459] text-xs leading-relaxed whitespace-pre-line">{voucher.terms}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Checkout/Purchase Form */}
              <div className="w-full md:w-[380px] p-6 md:p-8 bg-[#FAFAFA] flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#131316] mb-1 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-[#6444E4]" />
                    Purchase Voucher
                  </h3>
                  <p className="text-xs text-[#8E8E93] mb-6">Enter your details to pay securely via Paytm</p>

                  {isExpired ? (
                    <div className="p-4 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-center">
                      <p className="text-sm font-bold text-[#FF3B30]">This promo / voucher has expired</p>
                    </div>
                  ) : isSoldOut ? (
                    <div className="p-4 rounded-xl bg-[#FF9500]/10 border border-[#FF9500]/20 text-center">
                      <p className="text-sm font-bold text-[#FF9500]">Sold Out</p>
                      <p className="text-xs text-[#545459] mt-0.5 font-medium">This voucher has reached its usage limit.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[#545459] text-[11px] font-semibold block mb-1 uppercase tracking-wider">Full Name *</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
                          <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E8EA] text-sm bg-white focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 outline-none transition-all"
                          />
                        </div>
                        {errors.name && <p className="text-[11px] text-[#FF3B30] mt-1 font-semibold">{errors.name}</p>}
                      </div>

                      <div>
                        <label className="text-[#545459] text-[11px] font-semibold block mb-1 uppercase tracking-wider">Phone *</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
                          <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="10-digit number"
                            maxLength={10}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E8EA] text-sm bg-white focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 outline-none transition-all"
                          />
                        </div>
                        {errors.phone && <p className="text-[11px] text-[#FF3B30] mt-1 font-semibold">{errors.phone}</p>}
                      </div>

                      <div>
                        <label className="text-[#545459] text-[11px] font-semibold block mb-1 uppercase tracking-wider">Email (Optional)</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E8EA] text-sm bg-white focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 outline-none transition-all"
                          />
                        </div>
                        {errors.email && <p className="text-[11px] text-[#FF3B30] mt-1 font-semibold">{errors.email}</p>}
                      </div>
                    </div>
                  )}
                </div>

                {!isExpired && !isSoldOut && (
                  <div className="mt-8 space-y-3">
                    <div className="flex items-center justify-between border-t border-[#E8E8EA] pt-4 text-sm font-bold text-[#131316]">
                      <span>Amount Payable</span>
                      <span className="text-base text-[#0B70D5]">{formatCurrency(voucher.price)}</span>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full py-3.5 rounded-xl bg-[#131316] text-white font-bold text-[14px] hover:bg-[#2C2C30] transition-all cursor-pointer border-0 shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Initiating Paytm Payment...
                        </>
                      ) : (
                        `Pay ${formatCurrency(voucher.price)} via Paytm`
                      )}
                    </button>
                    <p className="text-[10px] text-center text-[#8E8E93] flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#34C759]" />
                      Paytm PG Secured Payment
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </PageTransition>
    </>
  );
}
