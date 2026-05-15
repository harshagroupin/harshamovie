"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import {
  Monitor,
  Volume2,
  Sofa,
  Popcorn,
  Car,
  Wifi,
  Shield,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Monitor,
    title: "4K Laser Projection",
    description: "Crystal clear picture with state-of-the-art 4K laser projectors on all screens",
    color: "#E50914",
    gradient: "from-red-500/10 to-red-600/5",
  },
  {
    icon: Volume2,
    title: "Dolby Atmos Sound",
    description: "Immerse yourself in sound that flows all around you with 128 speakers",
    color: "#3B82F6",
    gradient: "from-blue-500/10 to-blue-600/5",
  },
  {
    icon: Sofa,
    title: "Luxury Recliners",
    description: "Premium heated recliners with USB charging and personal table",
    color: "#D4AF37",
    gradient: "from-amber-500/10 to-amber-600/5",
  },
  {
    icon: Popcorn,
    title: "Gourmet F&B",
    description: "From classic popcorn to gourmet meals — served right to your seat",
    color: "#F97316",
    gradient: "from-orange-500/10 to-orange-600/5",
  },
  {
    icon: Car,
    title: "Free Parking",
    description: "Ample underground parking with 200+ spaces and valet service",
    color: "#10B981",
    gradient: "from-emerald-500/10 to-emerald-600/5",
  },
  {
    icon: Shield,
    title: "Safe & Hygienic",
    description: "Automated sanitization, contactless ticketing and HEPA air filtration",
    color: "#8B5CF6",
    gradient: "from-violet-500/10 to-violet-600/5",
  },
];

export function CinemaFeatures() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03] blur-[100px]"
          style={{ background: "radial-gradient(circle, #E50914 0%, transparent 70%)" }}
        />
      </div>

      <div className="container-app relative z-10">
        <ScrollReveal>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E50914]/5 border border-[#E50914]/10 mb-5">
              <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
              <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#E50914]">
                World-Class Amenities
              </span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-black text-[#1A1A2E] mb-4">
              The Ultimate Cinema
              <span className="text-gradient-accent"> Experience</span>
            </h2>
            <p className="text-[#8E8E93] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Every detail crafted for your comfort. From the moment you walk in, you know this isn&apos;t just a cinema — it&apos;s an experience.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ duration: 0.3 }}
                className="group relative p-6 md:p-7 rounded-2xl bg-white border border-[#E5E5EA] hover:border-[#D0D0D5] transition-all duration-300 cursor-default"
                style={{
                  boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px rgba(0,0,0,0.08), 0 0 0 1px ${feature.color}15`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 8px rgba(0,0,0,0.04)";
                }}
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `${feature.color}12`,
                    border: `1px solid ${feature.color}20`,
                  }}
                >
                  <feature.icon
                    className="w-5 h-5 transition-colors duration-300"
                    style={{ color: feature.color }}
                  />
                </div>

                <h3 className="font-display font-bold text-lg text-[#1A1A2E] mb-2 group-hover:text-[#E50914] transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  {feature.description}
                </p>

                {/* Corner accent on hover */}
                <div
                  className="absolute top-0 right-0 w-20 h-20 rounded-bl-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${feature.color}08, transparent)`,
                  }}
                />
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
