"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Search, Menu, X } from "lucide-react";
import { APP_NAME, NAV_LINKS, BUSINESS } from "@/lib/constants";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
            : "bg-white"
        }`}
      >
        <nav className="container-app flex items-center justify-between h-[68px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-red-500/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-[17px] leading-tight tracking-tight text-[#1A1A2E]">
                {APP_NAME}
              </span>
              <span className="text-[10px] text-[#E50914] font-semibold tracking-[0.14em] uppercase leading-none">
                {BUSINESS.tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Nav — centered */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-xl text-[15px] font-medium text-[#636366] hover:text-[#1A1A2E] hover:bg-[#F5F5F7] transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <button className="hidden md:flex w-10 h-10 items-center justify-center rounded-xl text-[#8E8E93] hover:text-[#1A1A2E] hover:bg-[#F5F5F7] transition-all">
              <Search className="w-5 h-5" />
            </button>

            <Link href="/#now-showing" className="hidden md:block">
              <button className="px-6 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#CC0812] text-white text-[15px] font-bold transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98]">
                Book Now
              </button>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-[#636366] hover:bg-[#F5F5F7] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-40 bg-white md:hidden"
          >
            <div className="flex flex-col items-center justify-center h-full gap-8">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-2xl font-display font-bold text-[#1A1A2E] hover:text-[#E50914] transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: NAV_LINKS.length * 0.1 }}
              >
                <Link href="/#now-showing" onClick={() => setMobileOpen(false)}>
                  <button className="px-10 py-3.5 rounded-xl bg-[#E50914] hover:bg-[#CC0812] text-white text-lg font-bold transition-all shadow-lg mt-4">
                    Book Now
                  </button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
