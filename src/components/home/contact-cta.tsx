"use client";

import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { Phone, MessageCircle, MapPin, Clock, ArrowRight } from "lucide-react";
import { BUSINESS } from "@/lib/constants";

export function ContactCTA() {
  return (
    <section className="py-16 md:py-20">
      <div className="container-app">
        <ScrollReveal>
          <div
            className="relative overflow-hidden rounded-3xl p-8 md:p-12 lg:p-16"
            style={{
              background: "linear-gradient(135deg, #0a0a0f 0%, #1a0a0c 50%, #0a0a0f 100%)",
            }}
          >
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div
                className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[100px]"
                style={{
                  background: "radial-gradient(circle, #E50914 0%, transparent 70%)",
                  right: "-10%",
                  top: "-20%",
                }}
              />
              <div
                className="absolute w-[300px] h-[300px] rounded-full opacity-10 blur-[80px]"
                style={{
                  background: "radial-gradient(circle, #D4AF37 0%, transparent 70%)",
                  left: "20%",
                  bottom: "-15%",
                }}
              />
              {/* Grid pattern */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                  backgroundSize: "60px 60px",
                }}
              />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Left - Content */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.1] mb-4">
                    Ready for the{" "}
                    <span
                      style={{
                        background: "linear-gradient(135deg, #E50914, #D4AF37)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Ultimate
                    </span>
                    <br />
                    Movie Night?
                  </h2>
                  <p className="text-white/45 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
                    Book your seats now and experience Karnal&apos;s most premium cinema. Walk-in or book via WhatsApp — we&apos;re here for you!
                  </p>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`https://wa.me/${BUSINESS.whatsapp}?text=Hi! I'd like to book movie tickets.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2.5 px-7 py-3 rounded-xl text-white text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                        boxShadow: "0 8px 24px rgba(37,211,102,0.25)",
                      }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp Booking
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </a>
                    <a
                      href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-2.5 px-7 py-3 rounded-xl text-white/80 text-sm font-semibold transition-all hover:text-white hover:scale-[1.02]"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <Phone className="w-4 h-4" />
                      Call Us
                    </a>
                  </div>
                </motion.div>
              </div>

              {/* Right - Contact Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: MapPin,
                    label: "Visit Us",
                    value: BUSINESS.address,
                    color: "#E50914",
                  },
                  {
                    icon: Phone,
                    label: "Call Us",
                    value: BUSINESS.phone,
                    color: "#3B82F6",
                  },
                  {
                    icon: Clock,
                    label: "Box Office",
                    value: BUSINESS.hours,
                    color: "#D4AF37",
                  },
                  {
                    icon: MessageCircle,
                    label: "WhatsApp",
                    value: "Quick Booking",
                    color: "#25D366",
                  },
                ].map((info, i) => (
                  <motion.div
                    key={info.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="p-5 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                      style={{
                        background: `${info.color}15`,
                        border: `1px solid ${info.color}25`,
                      }}
                    >
                      <info.icon className="w-4 h-4" style={{ color: info.color }} />
                    </div>
                    <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-1">
                      {info.label}
                    </p>
                    <p className="text-sm text-white/70 font-medium leading-snug">
                      {info.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
