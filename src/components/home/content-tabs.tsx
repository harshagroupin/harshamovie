"use client";

import { motion } from "framer-motion";
import { Film, Clock, Tag, SlidersHorizontal } from "lucide-react";

type ContentTab = "now-showing" | "coming-soon" | "offers";

interface ContentTabsProps {
  activeTab: ContentTab;
  onTabChange: (tab: ContentTab) => void;
}

const TABS = [
  { id: "now-showing" as ContentTab, label: "Now Showing", icon: Film },
  { id: "coming-soon" as ContentTab, label: "Coming Soon", icon: Clock },
  { id: "offers" as ContentTab, label: "Offers", icon: Tag },
];

export function ContentTabs({ activeTab, onTabChange }: ContentTabsProps) {
  return (
    <div className="bg-white border-b border-[#ECECEE] sticky top-[65px] z-30">
      <div className="container-app">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center gap-2.5 px-6 py-4 text-[14px] font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? "text-[#E50914]"
                    : "text-[#8E8E93] hover:text-[#636366]"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {active && (
                  <motion.div
                    layoutId="content-tab-underline"
                    className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full bg-[#E50914]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
