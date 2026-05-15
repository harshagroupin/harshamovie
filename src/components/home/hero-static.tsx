"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Sparkles, Film, Star, Ticket } from "lucide-react";
import { APP_NAME, BUSINESS } from "@/lib/constants";

export function HeroStatic() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const [currentTagline, setCurrentTagline] = useState(0);

  const taglines = [
    "Karnal's Ultimate Cinema Destination",
    "Premium Screens • Dolby Atmos Sound",
    "Luxury Recliners • IMAX Experience",
    "Where Movies Come Alive",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section ref={heroRef} className="pt-[57px] relative overflow-hidden">
      <div className="relative w-full h-[85vh] min-h-[600px] max-h-[800px]">
        {/* Dynamic background */}
        <div className="absolute inset-0 bg-[#0a0a0f]">
          {/* Animated gradient orbs */}
          <div
            className="absolute w-[800px] h-[800px] rounded-full opacity-20 blur-[120px] transition-all duration-[2000ms]"
            style={{
              background: "radial-gradient(circle, #E50914 0%, transparent 70%)",
              left: `${mousePos.x - 20}%`,
              top: `${mousePos.y - 30}%`,
            }}
          />
          <div
            className="absolute w-[600px] h-[600px] rounded-full opacity-15 blur-[100px] animate-float"
            style={{
              background: "radial-gradient(circle, #ff6b35 0%, transparent 70%)",
              right: "10%",
              bottom: "10%",
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-10 blur-[80px]"
            style={{
              background: "radial-gradient(circle, #D4AF37 0%, transparent 70%)",
              left: "60%",
              top: "20%",
              animation: "float 5s ease-in-out infinite reverse",
            }}
          />

          {/* Cinema film strip pattern */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 48px,
                rgba(255,255,255,0.5) 48px,
                rgba(255,255,255,0.5) 50px
              )`,
            }}
          />

          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Floating cinema icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[Film, Star, Ticket, Sparkles, Play].map((Icon, i) => (
            <motion.div
              key={i}
              className="absolute text-white/[0.04]"
              initial={{ y: "100vh", rotate: 0 }}
              animate={{
                y: "-10vh",
                rotate: 360,
              }}
              transition={{
                duration: 15 + i * 3,
                repeat: Infinity,
                ease: "linear",
                delay: i * 2,
              }}
              style={{
                left: `${15 + i * 18}%`,
              }}
            >
              <Icon size={40 + i * 10} />
            </motion.div>
          ))}
        </div>

        {/* Content */}
        <div className="absolute inset-0 z-10 flex items-center">
          <div className="container-app w-full">
            <div className="max-w-3xl">
              {/* Premium badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
                style={{
                  background: "linear-gradient(135deg, rgba(229,9,20,0.15), rgba(212,175,55,0.1))",
                  border: "1px solid rgba(229,9,20,0.25)",
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/80">
                  Premium Cinema Experience
                </span>
              </motion.div>

              {/* Main heading */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight mb-8"
              >
                <span
                  style={{
                    background: "linear-gradient(135deg, #ffffff 0%, #e0e0e0 50%, #ffffff 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {APP_NAME}
                </span>
                <br />
                <span
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold"
                  style={{
                    background: "linear-gradient(135deg, #E50914 0%, #ff4d58 50%, #D4AF37 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Cinema
                </span>
              </motion.h1>

              {/* Animated tagline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="h-8 mb-10 overflow-hidden"
              >
                <motion.p
                  key={currentTagline}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-base sm:text-lg md:text-xl text-white/50 font-medium tracking-wide"
                >
                  {taglines[currentTagline]}
                </motion.p>
              </motion.div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap gap-8 md:gap-12 mb-12"
              >
                {[
                  { value: "4", label: "Screens" },
                  { value: "IMAX", label: "Available" },
                  { value: "Dolby", label: "Atmos Sound" },
                  { value: "500+", label: "Luxury Seats" },
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="font-display text-2xl md:text-3xl font-black text-white/90">{stat.value}</span>
                    <span className="text-[11px] md:text-xs text-white/35 font-medium tracking-wide uppercase">{stat.label}</span>
                  </div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-wrap gap-4"
              >
                <a
                  href="#now-showing"
                  className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-white text-sm md:text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #E50914 0%, #B20710 100%)",
                    boxShadow: "0 8px 32px rgba(229,9,20,0.35), 0 0 0 1px rgba(229,9,20,0.1)",
                  }}
                >
                  <Play className="w-4 h-4 fill-current" />
                  Explore Movies
                </a>
                <a
                  href={`https://wa.me/${BUSINESS.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-white/80 text-sm md:text-base font-semibold transition-all hover:text-white hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <Ticket className="w-4 h-4" />
                  Book on WhatsApp
                </a>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade to white */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent z-10" />
      </div>
    </section>
  );
}
