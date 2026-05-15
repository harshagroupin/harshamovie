"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film, LayoutDashboard, Clapperboard, Clock, Ticket,
  Tag, Image, LogOut, Menu, X, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-5 h-5" />,
  Film: <Clapperboard className="w-5 h-5" />,
  Clock: <Clock className="w-5 h-5" />,
  Ticket: <Ticket className="w-5 h-5" />,
  Tag: <Tag className="w-5 h-5" />,
  Image: <Image className="w-5 h-5" />,
};

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "Movies", href: "/admin/movies", icon: "Film" },
  { label: "Showtimes", href: "/admin/showtimes", icon: "Clock" },
  { label: "Bookings", href: "/admin/bookings", icon: "Ticket" },
  { label: "Promo Codes", href: "/admin/promos", icon: "Tag" },
  { label: "Banners", href: "/admin/banners", icon: "Image" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Don't show sidebar on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

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
      <div className="p-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shrink-0 shadow-lg shadow-accent/20">
          <Film className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="font-display font-bold text-base text-foreground">{APP_NAME}</span>
            <p className="text-[11px] text-accent font-semibold tracking-wide uppercase">Admin Panel</p>
          </motion.div>
        )}
      </div>

      <Separator className="mx-4 mb-2 bg-border-subtle" />

      {/* Nav Items */}
      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              )}
            >
              <div className={cn("transition-colors", isActive ? "text-accent" : "text-muted")}>
                {iconMap[item.icon]}
              </div>
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 space-y-2 border-t border-border">
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted hover:text-foreground hover:bg-surface-hover">
            <ChevronLeft className="w-4 h-4" /> {!collapsed && "View Site"}
          </Button>
        </Link>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted hover:text-danger hover:bg-red-50" onClick={handleLogout}>
          <LogOut className="w-4 h-4" /> {!collapsed && "Logout"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-surface transition-all duration-300",
          collapsed ? "w-[70px]" : "w-[240px]"
        )}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center p-2 border-t border-border text-muted hover:text-foreground"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 20 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[260px] bg-surface border-r border-border z-50"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
