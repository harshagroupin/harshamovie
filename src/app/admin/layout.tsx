"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film, LayoutDashboard, Clapperboard, Clock, Ticket,
  Tag, Image, LogOut, Menu, X, ChevronLeft, ChevronRight,
  Sparkles
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, badge: null },
  { label: "Movies", href: "/admin/movies", icon: Clapperboard, badge: null },
  { label: "Showtimes", href: "/admin/showtimes", icon: Clock, badge: null },
  { label: "Bookings", href: "/admin/bookings", icon: Ticket, badge: null },
  { label: "Promo Codes", href: "/admin/promos", icon: Tag, badge: null },
  { label: "Banners", href: "/admin/banners", icon: Sparkles, badge: null },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    router.push("/admin/login");
    router.refresh();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-white/10",
        collapsed && "justify-center px-2"
      )}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E50914] to-[#B20710] flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30">
          <Film className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <span className="font-bold text-[15px] text-white leading-tight block">{APP_NAME}</span>
            <span className="text-[11px] text-red-400 font-semibold tracking-widest uppercase">Admin Panel</span>
          </motion.div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 group relative",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-gradient-to-r from-[#E50914]/20 to-[#E50914]/5 text-white border border-[#E50914]/30"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#E50914] rounded-r-full" />
              )}
              <item.icon className={cn(
                "w-5 h-5 shrink-0 transition-colors",
                isActive ? "text-[#E50914]" : "text-white/40 group-hover:text-white/80"
              )} />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E50914]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="h-px bg-white/10 mx-3" />

      {/* Bottom Actions */}
      <div className={cn("p-3 space-y-1", collapsed && "flex flex-col items-center")}>
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <button className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all",
            collapsed && "justify-center px-2 w-10 h-10"
          )}>
            <ChevronLeft className="w-4 h-4 shrink-0" />
            {!collapsed && <span>View Site</span>}
          </button>
        </Link>
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all",
            collapsed && "justify-center px-2 w-10 h-10"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center h-10 border-t border-white/10 text-white/30 hover:text-white/70 transition-colors"
      >
        {collapsed
          ? <ChevronRight className="w-4 h-4" />
          : <ChevronLeft className="w-4 h-4" />
        }
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-[#0F1117] transition-all duration-300 shrink-0",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-[#0F1117] flex items-center justify-center shadow-lg"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/70 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 22 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[260px] bg-[#0F1117] z-50"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="p-5 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
