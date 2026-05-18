import Link from "next/link";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { APP_NAME, BUSINESS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="print:hidden bg-[#1C1C1E] border-t border-[#2C2C30]">
      <div className="container-app py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3 no-underline">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.7512 9.37508H9.29232L21.095 6.25899C21.2067 6.22955 21.3115 6.17828 21.4033 6.10813C21.4951 6.03799 21.5721 5.95036 21.6298 5.8503C21.6876 5.75024 21.725 5.63973 21.7398 5.52516C21.7546 5.41058 21.7466 5.2942 21.7162 5.18273L20.8237 1.90148C20.7009 1.46003 20.4091 1.08474 20.0115 0.856894C19.614 0.629044 19.1427 0.566979 18.6997 0.684141L2.04295 5.08102C1.82117 5.13859 1.6131 5.23983 1.43092 5.3788C1.24875 5.51778 1.09614 5.6917 0.982009 5.89039C0.867246 6.08664 0.7931 6.30396 0.763977 6.52943C0.734854 6.7549 0.751347 6.98392 0.812478 7.20289L1.62623 10.202V19.8751C1.62623 20.3392 1.8106 20.7843 2.13879 21.1125C2.46698 21.4407 2.9121 21.6251 3.37623 21.6251H20.8762C21.3404 21.6251 21.7855 21.4407 22.1137 21.1125C22.4419 20.7843 22.6262 20.3392 22.6262 19.8751V10.2501C22.6262 10.018 22.534 9.79545 22.3699 9.63136C22.2059 9.46727 21.9833 9.37508 21.7512 9.37508ZM20.8762 19.8751H3.37623V11.1251H20.8762V19.8751Z" fill="#131316"/>
                </svg>
              </div>
              <div>
                <span className="font-bold text-lg text-white">{APP_NAME}</span>
                <p className="text-[10px] text-[#0B70D5] tracking-[0.12em] uppercase font-semibold">Cinema Experience</p>
              </div>
            </Link>
            <p className="text-[13px] text-white/50 leading-relaxed max-w-xs">
              {BUSINESS.description}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 mb-4">Quick Links</h4>
            {[
              { label: "Now Showing", href: "/#now-showing" },
              { label: "Coming Soon", href: "/#upcoming" },
              { label: "About Us", href: "#" },
            ].map((link) => (
              <Link key={link.label} href={link.href} className="block text-[14px] text-white/60 hover:text-[#0B70D5] transition-colors no-underline">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 mb-4">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-[13px] text-white/60">
                <MapPin className="w-4 h-4 mt-0.5 text-[#0B70D5] shrink-0" />
                <span>{BUSINESS.address}</span>
              </div>
              <div className="flex items-center gap-3 text-[13px] text-white/60">
                <Phone className="w-4 h-4 text-[#0B70D5] shrink-0" />
                <span>{BUSINESS.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-[13px] text-white/60">
                <Mail className="w-4 h-4 text-[#0B70D5] shrink-0" />
                <span>{BUSINESS.email}</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 mb-4">Hours</h4>
            <div className="flex items-center gap-3 text-[13px] text-white/60">
              <Clock className="w-4 h-4 text-[#0B70D5] shrink-0" />
              <span>{BUSINESS.hours}</span>
            </div>
            <p className="text-[13px] text-white/60 pl-7">Open All Days</p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-white/30">
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <p>Made with <span className="text-[#0B70D5]">♥</span> for cinema lovers</p>
        </div>
      </div>
    </footer>
  );
}
