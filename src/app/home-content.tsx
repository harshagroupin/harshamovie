"use client";

import { useMemo, useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Film, Calendar, SlidersHorizontal, ChevronDown, X, Check, Ticket, Gift, Sparkles, CreditCard } from "lucide-react";
import type { Movie, PromoCode } from "@/lib/types";
import { LANGUAGES } from "@/lib/constants";

const ALL_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Devotional", "Documentary",
  "Drama", "Family", "Fantasy", "Historical", "Horror", "Music", "Musical",
  "Mystery", "Political", "Romance", "Sci-Fi", "Sport", "Supernatural", "Thriller"
];

const ALL_LANGUAGES = [
  "English", "Hindi", "Punjabi", "Malayalam", "Bengali", "Haryanvi", "Bhojpuri", "Tamil", "Odia"
];

const ALL_FORMATS = [
  "2D", "4DX-2D", "ICE 2D", "3D", "IMAX 2D", "SCREEN X"
];

interface HomeContentProps {
  movies: Movie[];
  featuredMovies: Movie[];
  promoCodes?: PromoCode[];
}

export function HomeContent(props: HomeContentProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-2 border-[#131316] animate-spin" />
      </div>
    }>
      <HomeContentInner {...props} />
    </Suspense>
  );
}

function HomeContentInner({ movies, featuredMovies, promoCodes = [] }: HomeContentProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const searchParams = useSearchParams();
  const router = useRouter();

  // URL State parameters
  const urlSearch = searchParams.get("search") || "";
  const urlLanguage = searchParams.get("language") || "";
  const urlTab = searchParams.get("tab") || "";

  // Filter States
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Temporary/Local states for the filter modal
  const [tempGenres, setTempGenres] = useState<string[]>([]);
  const [tempLanguages, setTempLanguages] = useState<string[]>([]);
  const [tempFormats, setTempFormats] = useState<string[]>([]);
  const [activeFilterTab, setActiveFilterTab] = useState<"genre" | "language" | "format">("genre");

  // Sync temp state when opening the modal
  useEffect(() => {
    if (isFilterModalOpen) {
      setTempGenres(selectedGenres);
      setTempLanguages(selectedLanguages);
      setTempFormats(selectedFormats);
    }
  }, [isFilterModalOpen, selectedGenres, selectedLanguages, selectedFormats]);

  // Generic filter function combining modal and URL filters
  const filterMovie = useCallback((movie: Movie) => {
    // 1. URL search query filter (case-insensitive in title/desc/genres)
    if (urlSearch.trim()) {
      const q = urlSearch.toLowerCase();
      const titleMatch = movie.title?.toLowerCase().includes(q);
      const descMatch = movie.description?.toLowerCase().includes(q);
      const genreMatch = movie.genre?.some(g => g.toLowerCase().includes(q));
      if (!titleMatch && !descMatch && !genreMatch) {
        return false;
      }
    }

    // 2. URL language tab filter
    if (urlLanguage) {
      if (movie.language?.toLowerCase() !== urlLanguage.toLowerCase()) {
        return false;
      }
    }

    // 3. URL active Tab filters
    if (urlTab === "foryou") {
      const isFeatured = movie.is_featured || false;
      const isHighRating = movie.rating && (movie.rating.includes("13") || movie.rating.includes("16") || movie.rating.includes("18") || movie.rating.includes("A"));
      if (!isFeatured && !isHighRating) {
        return false;
      }
    }

    // 4. Modal Genre filter
    if (selectedGenres.length > 0) {
      if (!movie.genre || !movie.genre.some(g => selectedGenres.includes(g))) {
        return false;
      }
    }

    // 5. Modal Language filter
    if (selectedLanguages.length > 0) {
      if (!selectedLanguages.includes(movie.language)) {
        return false;
      }
    }

    // 6. Modal Format filter (smart title/desc matching)
    if (selectedFormats.length > 0) {
      const hasMatch = selectedFormats.some(f => {
        const lFormat = f.toLowerCase();
        if (lFormat === "2d") return true; // default 2D fits all
        return movie.title?.toLowerCase().includes(lFormat) || 
               movie.description?.toLowerCase().includes(lFormat);
      });
      if (!hasMatch) return false;
    }

    return true;
  }, [selectedGenres, selectedLanguages, selectedFormats, urlSearch, urlLanguage, urlTab]);

  const nowShowing = useMemo(
    () =>
      movies.filter((m) => {
        const rel = new Date(m.release_date);
        rel.setHours(0, 0, 0, 0);
        return rel <= today;
      }),
    [movies, today]
  );

  const upcoming = useMemo(
    () =>
      movies.filter((m) => {
        const rel = new Date(m.release_date);
        rel.setHours(0, 0, 0, 0);
        return rel > today;
      }),
    [movies, today]
  );

  const thisWeekReleases = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    return movies.filter((m) => {
      const rel = new Date(m.release_date);
      rel.setHours(0, 0, 0, 0);
      return rel >= oneWeekAgo && rel <= today;
    });
  }, [movies, today]);

  // Apply unified filter logic to compute reactive movie sections
  const filteredNowShowing = useMemo(() => nowShowing.filter(filterMovie), [nowShowing, filterMovie]);
  const filteredThisWeekReleases = useMemo(() => thisWeekReleases.filter(filterMovie), [thisWeekReleases, filterMovie]);
  const filteredUpcoming = useMemo(() => upcoming.filter(filterMovie), [upcoming, filterMovie]);
  const carouselMovies = useMemo(() => featuredMovies.filter(filterMovie), [featuredMovies, filterMovie]);

  const hasActiveFilters = selectedGenres.length > 0 || selectedLanguages.length > 0 || selectedFormats.length > 0 || urlSearch || urlLanguage || urlTab;
  const activeFiltersCount = selectedGenres.length + selectedLanguages.length + selectedFormats.length;

  const clearAllFilters = () => {
    setSelectedGenres([]);
    setSelectedLanguages([]);
    setSelectedFormats([]);
    router.push("/");
  };

  const handleToggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleApplyFilters = () => {
    setSelectedGenres(tempGenres);
    setSelectedLanguages(tempLanguages);
    setSelectedFormats(tempFormats);
    setIsFilterModalOpen(false);
  };

  const handleClearModalFilters = () => {
    setTempGenres([]);
    setTempLanguages([]);
    setTempFormats([]);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ===== HERO CAROUSEL ===== */}
      {urlTab !== "offers" && carouselMovies.length > 0 && (
        <HeroCarousel movies={carouselMovies} />
      )}

      {/* ===== CONTENT ===== */}
      <div className="flex flex-col items-center gap-10 md:gap-[68px] w-full pt-8 md:pt-12 pb-16 md:pb-24">
        
        {/* ===== OFFERS DASHBOARD ===== */}
        {urlTab === "offers" && (
          <section className="w-full max-w-[1264px] mx-auto px-3 sm:px-0 animate-fade-in">
            <div className="mb-8 flex items-center gap-3">
              <Gift className="w-6 h-6 text-[#E50914]" />
              <h2 className="text-xl md:text-2xl font-bold text-[#131316]">
                Exclusive Offers & Promo Codes
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-3 sm:px-0">
              {(!promoCodes || promoCodes.length === 0) ? (
                <div className="col-span-1 md:col-span-2 py-12 text-center text-[#545459]">
                  No exclusive offers available at the moment. Please check back later!
                </div>
              ) : (
                promoCodes.map((promo, index) => {
                  const colors = [
                    "from-[#1A1A2E] to-[#16213E]", // Dark Blue
                    "from-[#511F5C] to-[#380E3F]", // Purple
                    "from-[#0B3C5D] to-[#328CC1]", // Bright Blue
                    "from-[#131316] to-[#252529]", // Dark Gray
                  ];
                  const gradient = colors[index % colors.length];

                  return (
                    <div key={promo.id} className={`bg-gradient-to-br ${gradient} text-white p-6 rounded-[24px] border border-white/10 shadow-lg flex flex-col justify-between h-[200px] relative overflow-hidden group hover:scale-[1.01] transition-all`}>
                      <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-all">
                        <Gift className="w-[180px] h-[180px] text-white" />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-[12px] font-extrabold uppercase tracking-wider mb-3">
                          <Sparkles className="w-3.5 h-3.5" />
                          Special Offer
                        </div>
                        <h3 className="text-lg font-bold">
                          {promo.discount_type === "percentage" 
                            ? `Get Flat ${promo.discount_value}% Off` 
                            : `Get Flat ₹${promo.discount_value} Off`}
                        </h3>
                        <p className="text-sm text-[#D0D0D4] mt-1">Book your tickets now and enjoy amazing discounts on your checkout.</p>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-auto relative z-10">
                        <div className="flex items-center gap-1">
                          <span className="text-[12px] text-[#A0A0A4]">Use Code:</span>
                          <span className="text-[14px] font-mono font-extrabold text-[#0B70D5] bg-white px-2 py-0.5 rounded">{promo.code}</span>
                        </div>
                        <button 
                          className="text-[13px] font-bold text-white hover:underline bg-transparent border-0 cursor-pointer" 
                          onClick={() => {
                            navigator.clipboard.writeText(promo.code);
                            alert(`Promo code ${promo.code} copied!`);
                          }}
                        >
                          Copy Code
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* ===== REGULAR MOVIE SECTIONS ===== */}
        {urlTab !== "offers" && (
          <>
            {/* ===== NEW RELEASES ===== */}
            {filteredThisWeekReleases.length > 0 && (
          <section className="w-full max-w-[1264px] mx-auto px-3 sm:px-0">
            <div className="mb-10 md:mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-[#131316]">
                New Releases
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 px-3 sm:px-0">
              {filteredThisWeekReleases.map((movie, i) => (
                <MovieCard key={movie.id} movie={movie} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* ===== ONLY IN THEATRES (Now Showing) ===== */}
        <section className="w-full max-w-[1264px] mx-auto px-3 sm:px-0">
          <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-semibold text-[#131316]">
              Only in Theatres
            </h2>
          </div>

          {/* Filter bar */}
          <FilterBar 
            selectedGenres={selectedGenres}
            selectedLanguages={selectedLanguages}
            selectedFormats={selectedFormats}
            activeFiltersCount={activeFiltersCount}
            onToggleLanguage={handleToggleLanguage}
            onOpenModal={() => setIsFilterModalOpen(true)}
          />

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-6 animate-fade-in px-3 sm:px-0">
              {/* URL Search Query Badge */}
              {urlSearch && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E2F1FE] border border-[#0B70D5]/20 text-[13px] font-bold text-[#0B70D5]">
                  <span>Search: "{urlSearch}"</span>
                  <button 
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.delete("search");
                      router.push(`/?${params.toString()}`);
                    }} 
                    className="p-0.5 hover:bg-[#0B70D5]/10 rounded-full transition-colors ml-1 cursor-pointer border-none bg-transparent"
                  >
                    <X className="w-3 h-3 text-[#0B70D5]" />
                  </button>
                </div>
              )}

              {/* URL Language Tab Badge */}
              {urlLanguage && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E2F1FE] border border-[#0B70D5]/20 text-[13px] font-bold text-[#0B70D5]">
                  <span>Language: {urlLanguage}</span>
                  <button 
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.delete("language");
                      router.push(`/?${params.toString()}`);
                    }} 
                    className="p-0.5 hover:bg-[#0B70D5]/10 rounded-full transition-colors ml-1 cursor-pointer border-none bg-transparent"
                  >
                    <X className="w-3 h-3 text-[#0B70D5]" />
                  </button>
                </div>
              )}

              {/* URL active Tab Badge */}
              {urlTab && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E2F1FE] border border-[#0B70D5]/20 text-[13px] font-bold text-[#0B70D5]">
                  <span>{urlTab === "foryou" ? "For You" : "Offers"}</span>
                  <button 
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.delete("tab");
                      router.push(`/?${params.toString()}`);
                    }} 
                    className="p-0.5 hover:bg-[#0B70D5]/10 rounded-full transition-colors ml-1 cursor-pointer border-none bg-transparent"
                  >
                    <X className="w-3 h-3 text-[#0B70D5]" />
                  </button>
                </div>
              )}

              {selectedGenres.map(g => (
                <div key={g} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F5F6] border border-[#E8E8EA] text-[13px] font-medium text-[#131316]">
                  <span>{g}</span>
                  <button 
                    onClick={() => setSelectedGenres(selectedGenres.filter(x => x !== g))} 
                    className="p-0.5 hover:bg-[#E8E8EA] rounded-full transition-colors ml-1 cursor-pointer border-none bg-transparent"
                  >
                    <X className="w-3 h-3 text-[#545459]" />
                  </button>
                </div>
              ))}
              {selectedLanguages.map(l => (
                <div key={l} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F5F6] border border-[#E8E8EA] text-[13px] font-medium text-[#131316]">
                  <span>{l}</span>
                  <button 
                    onClick={() => setSelectedLanguages(selectedLanguages.filter(x => x !== l))} 
                    className="p-0.5 hover:bg-[#E8E8EA] rounded-full transition-colors ml-1 cursor-pointer border-none bg-transparent"
                  >
                    <X className="w-3 h-3 text-[#545459]" />
                  </button>
                </div>
              ))}
              {selectedFormats.map(f => (
                <div key={f} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F5F6] border border-[#E8E8EA] text-[13px] font-medium text-[#131316]">
                  <span>{f}</span>
                  <button 
                    onClick={() => setSelectedFormats(selectedFormats.filter(x => x !== f))} 
                    className="p-0.5 hover:bg-[#E8E8EA] rounded-full transition-colors ml-1 cursor-pointer border-none bg-transparent"
                  >
                    <X className="w-3 h-3 text-[#545459]" />
                  </button>
                </div>
              ))}
              <button 
                onClick={clearAllFilters}
                className="text-[13px] font-bold text-[#E50914] hover:text-[#B20710] ml-2 transition-colors cursor-pointer border-none bg-transparent"
              >
                Clear All
              </button>
            </div>
          )}

          {filteredNowShowing.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 px-3 sm:px-0">
              {filteredNowShowing.map((movie, i) => (
                <MovieCard key={movie.id} movie={movie} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Film className="w-8 h-8 text-[#0B70D5]" />}
              title="No Movies Found"
              description="No movies match the selected filters. Try broadening your criteria."
            />
          )}
        </section>

        {/* ===== COMING SOON ===== */}
        {filteredUpcoming.length > 0 && (
          <section className="w-full max-w-[1264px] mx-auto px-3 sm:px-0 pb-16">
            <div className="mb-10 md:mb-12">
              <h2 className="text-xl md:text-2xl font-semibold text-[#131316]">
                Coming Soon
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 px-3 sm:px-0">
              {filteredUpcoming.map((movie, i) => (
                <MovieCard key={movie.id} movie={movie} index={i} variant="upcoming" />
              ))}
            </div>
          </section>
        )}
          </>
        )}

        {/* ===== LOCAL SEO TEXT SECTION ===== */}
        <section className="w-full max-w-[1264px] mx-auto px-6 sm:px-0 border-t border-[#E8E8EA] pt-12 mt-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-base font-bold text-[#131316] mb-3">Premium Cinema Experience in Karnal</h4>
              <p className="text-[13px] text-[#545459] leading-relaxed">
                Welcome to <strong>Harsh A Movie</strong>, Karnal's ultimate cinema destination. Located on GT Road, Sector 12, our theater offers a premium entertainment experience with state-of-the-art projection technology, crystal-clear screens, and immersive 3D capabilities.
              </p>
            </div>
            <div>
              <h4 className="text-base font-bold text-[#131316] mb-3">Immersive Dolby Atmos Sound & Comfort</h4>
              <p className="text-[13px] text-[#545459] leading-relaxed">
                Experience sound like never before with our multi-channel Dolby Atmos sound system that brings every movie to life. Relax in our premium seating arrangements, including ultra-luxurious Recliners, spacious Gold seats, and comfortable Premium seating rows.
              </p>
            </div>
            <div>
              <h4 className="text-base font-bold text-[#131316] mb-3">Easy Online Ticket Booking & Deals</h4>
              <p className="text-[13px] text-[#545459] leading-relaxed">
                Check dynamic showtimes, browse coming soon movies, and secure your tickets online. Enjoy flat discounts and promotional offers by copying active discount codes during the reservation flow. Pay at our box office counters via cash.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ===== FILTER MODAL POPUP ===== */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="relative w-full max-w-[640px] h-[520px] bg-white rounded-[24px] shadow-2xl flex flex-col overflow-hidden z-10"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-[#ECECEE] flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#131316] tracking-tight">Filter by</h3>
                <button 
                  onClick={() => setIsFilterModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F5F5F6] flex items-center justify-center text-[#545459] hover:bg-[#E8E8EA] hover:text-[#131316] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex flex-1 overflow-hidden">
                {/* Left Tabs */}
                <div className="w-[160px] border-r border-[#ECECEE] bg-[#FAFAFA] flex flex-col py-2 shrink-0">
                  <button
                    onClick={() => setActiveFilterTab("genre")}
                    className={`px-6 py-4 text-left text-[14px] font-semibold transition-all relative ${
                      activeFilterTab === "genre" 
                        ? "text-[#6444E4] bg-white border-l-[3px] border-[#6444E4]" 
                        : "text-[#636366] hover:bg-[#F0F0F2]"
                    }`}
                  >
                    Genre
                  </button>
                  <button
                    onClick={() => setActiveFilterTab("language")}
                    className={`px-6 py-4 text-left text-[14px] font-semibold transition-all relative ${
                      activeFilterTab === "language" 
                        ? "text-[#6444E4] bg-white border-l-[3px] border-[#6444E4]" 
                        : "text-[#636366] hover:bg-[#F0F0F2]"
                    }`}
                  >
                    Language
                  </button>
                  <button
                    onClick={() => setActiveFilterTab("format")}
                    className={`px-6 py-4 text-left text-[14px] font-semibold transition-all relative ${
                      activeFilterTab === "format" 
                        ? "text-[#6444E4] bg-white border-l-[3px] border-[#6444E4]" 
                        : "text-[#636366] hover:bg-[#F0F0F2]"
                    }`}
                  >
                    Format
                  </button>
                </div>

                {/* Right Options List */}
                <div className="flex-1 p-6 overflow-y-auto bg-white">
                  {activeFilterTab === "genre" && (
                    <div className="flex flex-col gap-1.5">
                      {ALL_GENRES.map((genre) => {
                        const isChecked = tempGenres.includes(genre);
                        return (
                          <div
                            key={genre}
                            onClick={() => {
                              setTempGenres(prev => 
                                prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
                              );
                            }}
                            className="flex items-center gap-3.5 py-3 px-3.5 rounded-xl hover:bg-[#FAFAFA] cursor-pointer transition-colors"
                          >
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                              isChecked 
                                ? "bg-[#131316] border-[#131316]" 
                                : "border-[#C7C7CC] bg-white"
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                            </div>
                            <span className="text-[14px] font-semibold text-[#131316] capitalize">{genre}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeFilterTab === "language" && (
                    <div className="flex flex-col gap-1.5">
                      {ALL_LANGUAGES.map((lang) => {
                        const isChecked = tempLanguages.includes(lang);
                        return (
                          <div
                            key={lang}
                            onClick={() => {
                              setTempLanguages(prev => 
                                prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
                              );
                            }}
                            className="flex items-center gap-3.5 py-3 px-3.5 rounded-xl hover:bg-[#FAFAFA] cursor-pointer transition-colors"
                          >
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                              isChecked 
                                ? "bg-[#131316] border-[#131316]" 
                                : "border-[#C7C7CC] bg-white"
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                            </div>
                            <span className="text-[14px] font-semibold text-[#131316] capitalize">{lang}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeFilterTab === "format" && (
                    <div className="flex flex-col gap-1.5">
                      {ALL_FORMATS.map((fmt) => {
                        const isChecked = tempFormats.includes(fmt);
                        return (
                          <div
                            key={fmt}
                            onClick={() => {
                              setTempFormats(prev => 
                                prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]
                              );
                            }}
                            className="flex items-center gap-3.5 py-3 px-3.5 rounded-xl hover:bg-[#FAFAFA] cursor-pointer transition-colors"
                          >
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                              isChecked 
                                ? "bg-[#131316] border-[#131316]" 
                                : "border-[#C7C7CC] bg-white"
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                            </div>
                            <span className="text-[14px] font-semibold text-[#131316] uppercase">{fmt}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="px-6 py-4 border-t border-[#ECECEE] flex items-center justify-between bg-white shrink-0">
                <button
                  onClick={handleClearModalFilters}
                  className="text-[14px] font-semibold text-[#8E8E93] hover:text-[#E50914] hover:underline transition-colors cursor-pointer bg-transparent border-0"
                >
                  Clear filters
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="bg-[#131316] text-white text-[14px] font-semibold py-3 px-10 rounded-xl hover:bg-black active:scale-[0.98] transition-all cursor-pointer border-0 shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ===== HERO CAROUSEL ===== */
function HeroCarousel({ movies }: { movies: Movie[] }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (!movies || movies.length === 0) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % movies.length);
    }, 5000);
  }, [movies.length]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const goTo = (idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
    resetTimer();
  };

  const prev = () => {
    if (!movies || movies.length === 0) return;
    setDirection(-1);
    setCurrent((c) => (c - 1 + movies.length) % movies.length);
    resetTimer();
  };

  const next = () => {
    if (!movies || movies.length === 0) return;
    setDirection(1);
    setCurrent((c) => (c + 1) % movies.length);
    resetTimer();
  };

  if (!movies || movies.length === 0) {
    return null;
  }

  // Ensure current index is within bounds (if movies array length changes due to filtering)
  const safeCurrent = current >= movies.length ? 0 : current;
  const movie = movies[safeCurrent];  return (
    <section className="relative w-full overflow-hidden bg-[#F8F9FA] md:bg-transparent">
      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="hidden md:flex relative px-4 md:px-12 pt-[32px] pb-2 items-center justify-center w-full min-h-[500px] lg:min-h-[550px] overflow-hidden">
        {/* Blurred Background */}
        <div
          className="absolute inset-0 w-full h-full z-0 transition-opacity duration-700"
          style={{
            backgroundImage: `url(${movie.banner_url || movie.poster_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(24px)",
            transform: "scale(1.1)",
          }}
          aria-hidden="true"
        />
        {/* White gradient overlay for seamless blending */}
        <div
          className="absolute inset-0 w-full h-full z-[1]"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.8) 50%, #FFFFFF 100%)",
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-[3] flex flex-row items-center justify-between w-full max-w-[1200px] gap-10">
          {/* Text Side */}
          <motion.div
            key={`desktop-text-${movie.id}`}
            initial={{ opacity: 0, x: direction >= 0 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -40 : 40 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-4 lg:gap-5 flex-1 pr-8"
          >
            <h2 className="text-4xl lg:text-[42px] font-bold text-[#131316] tracking-tight leading-[1.2] my-0">
              {movie.title}
            </h2>
            <span className="text-lg lg:text-xl font-bold text-[#131316]">
              {movie.rating} | {movie.genre?.slice(0, 3).join(", ")}
            </span>
            {movie.description && (
              <p className="text-[15px] lg:text-base text-[#131316] max-w-[700px] line-clamp-3 leading-relaxed">
                {movie.description}
              </p>
            )}
            <div className="mt-2">
              <Link href={`/movie/${movie.slug}`}>
                <button className="btn-book text-base font-bold px-8 py-3.5 h-auto rounded-xl">
                  Book now
                </button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            key={`desktop-poster-${movie.id}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-6 shrink-0"
          >
            <div className="relative w-[288px] h-[432px] rounded-xl overflow-hidden shadow-xl shrink-0">
              <div className="w-full h-full">
                <Image
                  src={movie.poster_url || "/images/placeholder-poster.svg"}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="288px"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prev}
          className="absolute left-[5vw] top-[40%] z-[4] w-10 h-10 flex items-center justify-center cursor-pointer bg-transparent border-0"
          aria-label="Previous movie"
        >
          <ChevronLeft className="w-6 h-6 text-[#131316]/60 hover:text-[#131316]" />
        </button>
        <button
          onClick={next}
          className="absolute right-[5vw] top-[40%] z-[4] w-10 h-10 flex items-center justify-center cursor-pointer bg-transparent border-0"
          aria-label="Next movie"
        >
          <ChevronRight className="w-6 h-6 text-[#131316]/60 hover:text-[#131316]" />
        </button>
      </div>

      {/* ===== MOBILE LAYOUT ===== */}
      <div className="flex md:hidden flex-col w-full px-4 pt-6 pb-2">
        <Link href={`/movie/${movie.slug}`} className="block no-underline">
          <motion.div
            key={`mobile-${movie.id}`}
            initial={{ opacity: 0, x: direction >= 0 ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -20 : 20 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-white rounded-2xl border border-[#E8E8EA] shadow-sm overflow-hidden"
          >
            {/* Banner Image */}
            <div className="relative w-full aspect-[16/9]">
              <Image
                src={movie.banner_url || movie.poster_url || "/images/placeholder-banner.jpg"}
                alt={movie.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            </div>
            {/* Text Content */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-[#131316] mb-1 leading-tight">{movie.title}</h3>
              <p className="text-sm text-[#8E8E93] font-medium">{movie.rating || "UA16+"}</p>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-2 pb-0 mt-4 md:mt-0 md:-mt-8 relative z-[5]">
        {movies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`rounded-full transition-all duration-300 border-0 cursor-pointer ${idx === current
              ? "w-6 h-1.5 md:h-2 bg-[#131316]"
              : "w-1.5 md:w-2 h-1.5 md:h-2 bg-[#D0D0D4] hover:bg-[#A0A0A4]"
              }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

/* ===== FILTER BAR ===== */
interface FilterBarProps {
  selectedGenres: string[];
  selectedLanguages: string[];
  selectedFormats: string[];
  activeFiltersCount: number;
  onToggleLanguage: (lang: string) => void;
  onOpenModal: () => void;
}

function FilterBar({
  selectedGenres,
  selectedLanguages,
  selectedFormats,
  activeFiltersCount,
  onToggleLanguage,
  onOpenModal,
}: FilterBarProps) {
  const quickLanguages = ["English", "Hindi", "Punjabi", "Haryanvi"];

  return (
    <div className="w-full py-3 mb-6">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {/* Filters button */}
        <button 
          onClick={onOpenModal}
          className={`filter-pill gap-1.5 pl-2.5 ml-3 sm:ml-0 transition-all ${
            activeFiltersCount > 0 
              ? "bg-[#6444E4] border-[#6444E4] text-white font-bold" 
              : ""
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="ml-1 w-5 h-5 rounded-full bg-white text-[#6444E4] flex items-center justify-center text-[10px] font-extrabold">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Quick Language filters */}
        {quickLanguages.map((lang) => {
          const isActive = selectedLanguages.includes(lang);
          return (
            <button
              key={lang}
              onClick={() => onToggleLanguage(lang)}
              className={`filter-pill ${isActive ? "active font-bold" : ""}`}
            >
              {lang}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===== MOVIE CARD ===== */
function MovieCard({ movie, index, variant = "default" }: { movie: Movie; index: number; variant?: "default" | "upcoming" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03 }}
    >
      <Link href={`/movie/${movie.slug}`} className="block no-underline">
        <div className="movie-card h-full">
          {/* Poster */}
          <div className="poster-wrap">
            <Image
              src={movie.poster_url || "/images/placeholder-poster.svg"}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 16vw"
            />
          </div>

          {/* Info */}
          <div className="card-info">
            <h5 className="card-title title-case">{movie.title}</h5>
            <span className="card-meta">
              {movie.rating} | {movie.language}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ===== EMPTY STATE ===== */
function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 rounded-2xl border border-[#E8E8EA] bg-[#F5F5F6]"
    >
      <div className="w-16 h-16 rounded-2xl bg-[#E2F1FE] flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[#131316] mb-1.5">{title}</h3>
      <p className="text-[#545459] text-sm max-w-sm text-center leading-relaxed">{description}</p>
    </motion.div>
  );
}
