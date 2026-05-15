"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GENRES, LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onGenreFilter: (genre: string | null) => void;
  onLanguageFilter: (language: string | null) => void;
  activeGenre: string | null;
  activeLanguage: string | null;
}

export function SearchFilter({
  onSearch,
  onGenreFilter,
  onLanguageFilter,
  activeGenre,
  activeLanguage,
}: SearchFilterProps) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="bg-[#FAFAFA] border-b border-[#ECECEE]">
      <div className="container-app py-3">
        {/* Quick Filter Pills */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {/* Filter toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-[13px] font-semibold whitespace-nowrap transition-all",
              showSearch
                ? "bg-[#E50914] border-[#E50914] text-white shadow-sm"
                : "bg-white border-[#E5E5EA] text-[#636366] hover:border-[#C7C7CC] hover:shadow-sm"
            )}
          >
            {showSearch ? <X className="w-3.5 h-3.5" /> : <SlidersHorizontal className="w-3.5 h-3.5" />}
            Filters
          </button>

          {/* Language pills */}
          {["Hindi", "English", "Haryanvi"].map((l) => (
            <button
              key={l}
              onClick={() => onLanguageFilter(activeLanguage === l ? null : l)}
              className={cn(
                "px-4 py-2 rounded-lg border text-[13px] font-medium whitespace-nowrap transition-all",
                activeLanguage === l
                  ? "bg-[#1A1A2E] border-[#1A1A2E] text-white shadow-sm"
                  : "bg-white border-[#E5E5EA] text-[#636366] hover:border-[#C7C7CC] hover:shadow-sm"
              )}
            >
              {l}
            </button>
          ))}

          {/* Divider */}
          <div className="w-px h-5 bg-[#D5D5DA] mx-0.5 shrink-0" />

          {/* Genre pills */}
          {["Action", "Drama", "Comedy", "Thriller", "Sci-Fi", "Romance"].map((g) => (
            <button
              key={g}
              onClick={() => onGenreFilter(activeGenre === g ? null : g)}
              className={cn(
                "px-4 py-2 rounded-lg border text-[13px] font-medium whitespace-nowrap transition-all",
                activeGenre === g
                  ? "bg-[#1A1A2E] border-[#1A1A2E] text-white shadow-sm"
                  : "bg-white border-[#E5E5EA] text-[#636366] hover:border-[#C7C7CC] hover:shadow-sm"
              )}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Expanded Search & Advanced Filters */}
        {showSearch && (
          <div className="mt-3 p-5 bg-white rounded-xl border border-[#ECECEE] shadow-sm">
            <div className="relative mb-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
              <Input
                placeholder="Search movies, events, plays..."
                className="pl-11 py-5 bg-[#FAFAFA] rounded-xl border-[#E5E5EA] w-full text-[14px] focus-visible:ring-2 focus-visible:ring-[#E50914]/20 focus-visible:border-[#E50914]"
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[11px] font-bold text-[#AEAEB2] mb-2.5 uppercase tracking-wider">Languages</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l}
                      className={cn(
                        "px-3.5 py-1.5 rounded-lg border text-[13px] font-medium transition-all",
                        activeLanguage === l
                          ? "bg-[#1A1A2E] border-[#1A1A2E] text-white"
                          : "bg-white border-[#E5E5EA] text-[#636366] hover:border-[#C7C7CC]"
                      )}
                      onClick={() => onLanguageFilter(activeLanguage === l ? null : l)}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-[#AEAEB2] mb-2.5 uppercase tracking-wider">Genres</p>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      className={cn(
                        "px-3.5 py-1.5 rounded-lg border text-[13px] font-medium transition-all",
                        activeGenre === g
                          ? "bg-[#1A1A2E] border-[#1A1A2E] text-white"
                          : "bg-white border-[#E5E5EA] text-[#636366] hover:border-[#C7C7CC]"
                      )}
                      onClick={() => onGenreFilter(activeGenre === g ? null : g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
