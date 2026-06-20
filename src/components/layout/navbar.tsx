"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X, User } from "lucide-react";
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
        {/* ===== TOP ROW: Logo + Search + Login ===== */}
        <nav className="container-app flex items-center h-[64px] lg:h-[72px] gap-3 lg:gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center group shrink-0 no-underline">
            <div className="relative w-[100px] h-[40px] lg:w-[140px] lg:h-[52px]">
              <Image 
                src="/logo.png" 
                alt={APP_NAME} 
                fill 
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Divider (Desktop) */}
          <div className="hidden lg:block w-[1px] h-[28px] bg-[#D0D0D4]" />

          {/* Nav Tabs (Desktop only) */}
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

          {/* Search Bar (Mobile inline compact + Desktop full) */}
          <div className="flex-1 lg:flex-none lg:w-auto">
            <form onSubmit={handleSearchSubmit} className="flex items-center h-[36px] lg:h-[42px] px-3 lg:px-3.5 border border-[#D0D0D4] bg-white rounded-xl w-full lg:w-[280px] gap-2 hover:border-[#B0B0B4] transition-colors">
              <Search className="w-4 h-4 text-[#6444E4] shrink-0" />
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-[13px] lg:text-[14px] text-[#131316] placeholder-[#8E8E93] p-0 font-normal leading-none"
                style={{ outline: 'none', boxShadow: 'none' }}
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

          {/* Profile */}
          <Link href={user ? "/profile" : "/login"} className="flex w-9 h-9 items-center justify-center rounded-full bg-[#F0F0F2] text-[#545459] hover:bg-[#E0E0E4] transition-all shrink-0 no-underline">
            <User className="w-[18px] h-[18px]" />
          </Link>
        </nav>

        {/* ===== TABS ROW (Always visible on mobile, hidden on desktop since tabs are in nav) ===== */}
        <div className="lg:hidden border-t border-[#F0F0F2]">
          <div className="container-app flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-hide">
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
                  className={`flex items-center px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all no-underline ${
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
      </header>
    </>
  );
}
