import Link from "next/link";
import { Film, MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter } from "lucide-react";
import { APP_NAME, BUSINESS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-[#1A1A2E] text-white mt-10">
      <div className="container-app py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-red-500/30">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display font-bold text-lg">{APP_NAME}</span>
                <p className="text-[10px] text-[#E50914] tracking-[0.14em] uppercase font-semibold">{BUSINESS.tagline}</p>
              </div>
            </Link>
            <p className="text-[15px] text-white/55 leading-relaxed">
              {BUSINESS.description}
            </p>
            <div className="flex gap-2.5">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all hover:scale-105">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-white/35">Quick Links</h4>
            {[
              { label: "Now Showing", href: "/#now-showing" },
              { label: "Coming Soon", href: "/#upcoming" },
              { label: "Offers", href: "/#offers" },
              { label: "About Us", href: "#" },
              { label: "Terms & Conditions", href: "#" },
            ].map((link) => (
              <Link key={link.label} href={link.href} className="block text-[15px] text-white/55 hover:text-white transition-colors hover:translate-x-1 transform duration-200">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-white/35">Contact Us</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-[15px] text-white/55">
                <MapPin className="w-5 h-5 mt-0.5 text-[#E50914] shrink-0" />
                <span>{BUSINESS.address}</span>
              </div>
              <div className="flex items-center gap-3 text-[15px] text-white/55">
                <Phone className="w-5 h-5 text-[#E50914] shrink-0" />
                <span>{BUSINESS.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-[15px] text-white/55">
                <Mail className="w-5 h-5 text-[#E50914] shrink-0" />
                <span>{BUSINESS.email}</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-white/35">Operating Hours</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[15px] text-white/55">
                <Clock className="w-5 h-5 text-[#E50914] shrink-0" />
                <span>Box Office: {BUSINESS.hours}</span>
              </div>
              <div className="text-[15px] text-white/55 pl-8">
                <p>Monday – Sunday</p>
                <p className="text-[#E50914] mt-1.5 font-semibold text-base">🎬 Open All Days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/35">
            <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              Made with <span className="text-[#E50914]">♥</span> for cinema lovers
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
