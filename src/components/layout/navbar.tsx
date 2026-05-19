"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Menu, X, MapPin, User, LogOut } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

const NAV_TABS = [
  { label: "Hindi", href: "/?language=Hindi" },
  { label: "English", href: "/?language=English" },
  { label: "For You", href: "/?tab=foryou" },
  { label: "Offers", href: "/?tab=offers" },
];

export function Navbar() {
  return (
    <Suspense fallback={
      <header className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-[#ECECEE]">
        <div className="container-app flex items-center h-[72px] justify-between">
          <span className="font-bold text-[16px] text-[#131316]">{APP_NAME}</span>
        </div>
      </header>
    }>
      <NavbarContent />
    </Suspense>
  );
}

function NavbarContent() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync search input with URL search param
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

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

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(window.location.search);
    if (value.trim()) {
      params.set("search", value.trim());
      params.delete("language");
      params.delete("tab");
    } else {
      params.delete("search");
    }
    router.push(`/?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchChange(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    const params = new URLSearchParams(window.location.search);
    params.delete("search");
    router.push(`/?${params.toString()}`);
  };

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
          <Link href="/" className="flex items-center group shrink-0 no-underline">
            <div className="relative w-[140px] h-[52px]">
              <Image 
                src="/logo.png.png" 
                alt={APP_NAME} 
                fill 
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Divider */}
          <div className="hidden lg:block w-[1px] h-[28px] bg-[#D0D0D4]" />

          {/* Location Removed as per request */}

          {/* Nav Tabs (Desktop) */}
          <div className="hidden lg:flex items-center gap-4 flex-1 justify-center">
            {NAV_TABS.map((tab) => {
              const activeLang = searchParams.get("language");
              const activeTabParam = searchParams.get("tab");
              
              let isActive = false;
              if (tab.label === "Hindi" && activeLang === "Hindi") isActive = true;
              else if (tab.label === "English" && activeLang === "English") isActive = true;
              else if (tab.label === "For You" && activeTabParam === "foryou") isActive = true;
              else if (tab.label === "Offers" && activeTabParam === "offers") isActive = true;

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
            <form onSubmit={handleSearchSubmit} className="flex items-center h-[42px] px-3.5 border border-[#D0D0D4] bg-white rounded-xl w-[280px] gap-2.5 hover:border-[#B0B0B4] transition-colors">
              <Search className="w-[16px] h-[16px] text-[#6444E4] shrink-0" />
              <input
                type="text"
                placeholder="Search for movies..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[14px] text-[#131316] placeholder-[#8E8E93] p-0 font-normal leading-none"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={handleClearSearch}
                  className="p-0.5 hover:bg-[#F5F5F6] rounded-full text-[#8E8E93] cursor-pointer border-none bg-transparent"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Search icon (Tablet) */}
          <button 
            onClick={() => setMobileOpen(true)}
            className="xl:hidden flex w-9 h-9 items-center justify-center rounded-full text-[#545459] hover:bg-[#F5F5F6] transition-all shrink-0 border-none bg-transparent"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          {/* Profile */}
          <Link href={user ? "/profile" : "/login"} className="flex w-9 h-9 items-center justify-center rounded-full bg-[#F0F0F2] text-[#545459] hover:bg-[#E0E0E4] transition-all shrink-0 no-underline">
            <User className="w-[18px] h-[18px]" />
          </Link>

          {/* Mobile menu */}
          <button
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full text-[#545459] hover:bg-[#F5F5F6] transition-all shrink-0 border-none bg-transparent"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {/* Mobile tabs row */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[#E8E8EA] bg-white animate-fade-in">
            {/* Mobile search */}
            <div className="px-4 py-3 border-b border-[#F0F0F2]">
              <form onSubmit={handleSearchSubmit} className="flex items-center h-10 px-3 border border-[#D0D0D4] bg-white rounded-xl w-full gap-2.5">
                <Search className="w-4 h-4 text-[#6444E4] shrink-0" />
                <input
                  type="text"
                  placeholder="Search for movies..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[14px] text-[#131316] placeholder-[#8E8E93] p-0 font-normal"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={handleClearSearch}
                    className="p-0.5 hover:bg-[#F5F5F6] rounded-full text-[#8E8E93] cursor-pointer border-none bg-transparent"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>
            </div>

            {/* Nav items */}
            <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
              {NAV_TABS.map((tab) => {
                const activeLang = searchParams.get("language");
                const activeTabParam = searchParams.get("tab");
                
                let isActive = false;
                if (tab.label === "Hindi" && activeLang === "Hindi") isActive = true;
                else if (tab.label === "English" && activeLang === "English") isActive = true;
                else if (tab.label === "For You" && activeTabParam === "foryou") isActive = true;
                else if (tab.label === "Offers" && activeTabParam === "offers") isActive = true;

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
