"use client";

import { motion } from "framer-motion";
import { Tag, Copy, Check, Sparkles, Gift, Percent, Star } from "lucide-react";
import { useState } from "react";

interface Offer {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  validTill: string;
  color: string;
  icon: typeof Tag;
}

const OFFERS: Offer[] = [
  {
    id: "1",
    code: "FIRST50",
    title: "First Movie, Half Price!",
    description: "Get 50% OFF on your first booking at Harsh A Movie. New customers only.",
    discount: "50% OFF",
    validTill: "Valid till supplies last",
    color: "#E50914",
    icon: Star,
  },
  {
    id: "2",
    code: "FLAT100",
    title: "Flat ₹100 OFF",
    description: "Get flat ₹100 discount on any movie ticket. No minimum booking required.",
    discount: "₹100 OFF",
    validTill: "Limited period offer",
    color: "#FF9500",
    icon: Tag,
  },
  {
    id: "3",
    code: "WELCOME",
    title: "Welcome Offer",
    description: "25% OFF for all new members! Sign up and get instant discount on bookings.",
    discount: "25% OFF",
    validTill: "For new users",
    color: "#34C759",
    icon: Gift,
  },
  {
    id: "4",
    code: "WEEKEND",
    title: "Weekend Special",
    description: "Extra 15% OFF on all weekend shows. Friday, Saturday & Sunday only.",
    discount: "15% OFF",
    validTill: "Weekends only",
    color: "#5856D6",
    icon: Percent,
  },
];

function OfferCard({ offer, index }: { offer: Offer; index: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(offer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className="relative overflow-hidden rounded-2xl border border-[#ECECEE] bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1"
    >
      {/* Top colored strip */}
      <div className="h-1.5 w-full" style={{ background: offer.color }} />

      <div className="p-5 md:p-6">
        {/* Icon + Discount badge */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: `${offer.color}12`,
              border: `1px solid ${offer.color}25`,
            }}
          >
            <offer.icon className="w-5 h-5" style={{ color: offer.color }} />
          </div>
          <span
            className="px-3 py-1 rounded-lg text-[12px] font-bold text-white"
            style={{ background: offer.color }}
          >
            {offer.discount}
          </span>
        </div>

        {/* Content */}
        <h3 className="font-display text-[16px] font-bold text-[#1A1A2E] mb-1.5">
          {offer.title}
        </h3>
        <p className="text-[13px] text-[#8E8E93] leading-relaxed mb-4">
          {offer.description}
        </p>

        {/* Code + Copy */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAFA] border border-dashed border-[#D5D5DA]">
          <div>
            <p className="text-[10px] text-[#8E8E93] font-medium uppercase tracking-wider mb-0.5">
              Promo Code
            </p>
            <p className="text-[14px] font-bold text-[#1A1A2E] tracking-wider font-mono">
              {offer.code}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={{
              background: copied ? "#34C75915" : `${offer.color}10`,
              color: copied ? "#34C759" : offer.color,
              border: `1px solid ${copied ? "#34C75925" : `${offer.color}20`}`,
            }}
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

        {/* Validity */}
        <p className="text-[11px] text-[#AEAEB2] mt-3 font-medium">
          {offer.validTill}
        </p>
      </div>
    </motion.div>
  );
}

export function OffersSection() {
  return (
    <section className="py-8 md:py-10">
      <div className="container-app">
        {/* Section header */}
        <div className="mb-6 md:mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[#1A1A2E] mb-1">
            Offers & Deals
          </h2>
          <p className="text-[#8E8E93] text-sm">
            Save more on your movie experience with exclusive offers
          </p>
        </div>

        {/* Offers grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {OFFERS.map((offer, i) => (
            <OfferCard key={offer.id} offer={offer} index={i} />
          ))}
        </div>

        {/* Bottom banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 md:p-8 rounded-2xl text-center"
          style={{
            background: "linear-gradient(135deg, #FFF8F0 0%, #FFF5F5 50%, #F5F0FF 100%)",
            border: "1px solid #F0E8E0",
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[12px] font-bold text-[#D4AF37] uppercase tracking-wider">
              Exclusive
            </span>
          </div>
          <h3 className="font-display text-lg md:text-xl font-bold text-[#1A1A2E] mb-1">
            More Offers Coming Soon!
          </h3>
          <p className="text-[13px] text-[#8E8E93] max-w-lg mx-auto">
            Follow us on social media to get notified about flash sales, combo deals, and special screening offers.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
