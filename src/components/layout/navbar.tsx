"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X, MapPin, User, LogOut } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

const NAV_TABS = [
  { label: "Hindi", href: "/", active: true },
  { label: "English", href: "#", active: false },
  { label: "For You", href: "#", active: false },
  { label: "Offers", href: "#", active: false },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <header
        className={`print:hidden sticky top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${
          scrolled
            ? "shadow-[0px_1px_4px_0px_rgba(0,0,0,0.08)]"
            : ""
        }`}
      >
        <nav className="container-app flex items-center h-[72px] gap-6 lg:gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0 no-underline">
            <div className="w-[34px] h-[34px] rounded-lg bg-[#131316] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.7512 9.37508H9.29232L21.095 6.25899C21.2067 6.22955 21.3115 6.17828 21.4033 6.10813C21.4951 6.03799 21.5721 5.95036 21.6298 5.8503C21.6876 5.75024 21.725 5.63973 21.7398 5.52516C21.7546 5.41058 21.7466 5.2942 21.7162 5.18273L20.8237 1.90148C20.7009 1.46003 20.4091 1.08474 20.0115 0.856894C19.614 0.629044 19.1427 0.566979 18.6997 0.684141L2.04295 5.08102C1.82117 5.13859 1.6131 5.23983 1.43092 5.3788C1.24875 5.51778 1.09614 5.6917 0.982009 5.89039C0.867246 6.08664 0.7931 6.30396 0.763977 6.52943C0.734854 6.7549 0.751347 6.98392 0.812478 7.20289L1.62623 10.202V19.8751C1.62623 20.3392 1.8106 20.7843 2.13879 21.1125C2.46698 21.4407 2.9121 21.6251 3.37623 21.6251H20.8762C21.3404 21.6251 21.7855 21.4407 22.1137 21.1125C22.4419 20.7843 22.6262 20.3392 22.6262 19.8751V10.2501C22.6262 10.018 22.534 9.79545 22.3699 9.63136C22.2059 9.46727 21.9833 9.37508 21.7512 9.37508ZM20.8762 19.8751H3.37623V11.1251H20.8762V19.8751Z" fill="white"/>
              </svg>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-[16px] text-[#131316] leading-tight tracking-tight">
                {APP_NAME}
              </span>
            </div>
          </Link>

          {/* Divider */}
          <div className="hidden lg:block w-[1px] h-[28px] bg-[#D0D0D4]" />

          {/* Location Removed as per request */}

          {/* Nav Tabs (Desktop) */}
          <div className="hidden lg:flex items-center gap-4 flex-1 justify-center">
            {NAV_TABS.map((tab) => {
              const isActive = tab.href === "/" ? pathname === "/" : false;
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={`flex items-center px-5 py-2.5 rounded-full text-[17px] font-semibold transition-all duration-200 no-underline whitespace-nowrap ${
                    isActive
                      ? "bg-[#E2F1FE] text-[#0B70D5]"
                      : "text-[#545459] hover:bg-[#F5F5F6]"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Spacer for mobile */}
          <div className="flex-1 lg:hidden" />

          {/* Search Bar (Desktop) */}
          <div className="hidden xl:flex shrink-0">
            <div className="flex items-center h-[42px] px-3.5 border border-[#D0D0D4] bg-white rounded-xl w-[280px] gap-2.5 cursor-pointer hover:border-[#B0B0B4] transition-colors">
              <Search className="w-[16px] h-[16px] text-[#6444E4] shrink-0" />
              <span className="text-[14px] text-[#8E8E93] font-normal leading-none truncate">
                Search for movies...
              </span>
            </div>
          </div>

          {/* Search icon (Tablet) */}
          <button className="xl:hidden flex w-9 h-9 items-center justify-center rounded-full text-[#545459] hover:bg-[#F5F5F6] transition-all shrink-0">
            <Search className="w-[18px] h-[18px]" />
          </button>

          {/* Profile */}
          <Link href={user ? "/profile" : "/login"} className="flex w-9 h-9 items-center justify-center rounded-full bg-[#F0F0F2] text-[#545459] hover:bg-[#E0E0E4] transition-all shrink-0 no-underline">
            <User className="w-[18px] h-[18px]" />
          </Link>

          {/* Mobile menu */}
          <button
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full text-[#545459] hover:bg-[#F5F5F6] transition-all shrink-0"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {/* Mobile tabs row */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[#E8E8EA] bg-white">
            {/* Mobile Location Removed */}

            {/* Mobile search */}
            <div className="px-4 py-3 border-b border-[#F0F0F2]">
              <div className="flex items-center h-10 px-3 border border-[#D0D0D4] bg-white rounded-xl w-full gap-2.5">
                <Search className="w-4 h-4 text-[#6444E4] shrink-0" />
                <span className="text-[14px] text-[#8E8E93]">Search for movies...</span>
              </div>
            </div>

            {/* Nav items */}
            <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
              {NAV_TABS.map((tab) => {
                const isActive = tab.href === "/" ? pathname === "/" : false;
                return (
                  <Link
                    key={tab.label}
                    href={tab.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-full text-[14px] font-semibold whitespace-nowrap transition-all no-underline ${
                      isActive
                        ? "bg-[#E2F1FE] text-[#0B70D5]"
                        : "text-[#545459] hover:bg-[#F5F5F6]"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
