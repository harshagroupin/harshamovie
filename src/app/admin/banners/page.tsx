"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Sparkles, Film, Star, Check, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { PageTransition } from "@/components/shared/page-transition";
import { getAllMoviesAdmin, toggleMovieFeatured } from "@/actions/movies";
import type { Movie } from "@/lib/types";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AdminBannersPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getAllMoviesAdmin();
        setMovies(data);
      } catch { toast.error("Failed to load"); }
      setLoading(false);
    }
    fetch();
  }, []);

  const featuredMovies = movies.filter((m) => m.is_featured);
  const otherMovies = movies.filter((m) => !m.is_featured && m.is_active);

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleMovieFeatured(id, !current);
      setMovies((prev) => prev.map((m) => m.id === id ? { ...m, is_featured: !current } : m));
      toast.success(!current ? "Added to hero banner" : "Removed from hero banner");
    } catch { toast.error("Failed to update"); }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-[#0F1117] tracking-tight">Hero Banners</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">Manage movies shown in the homepage hero carousel</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#9CA3AF] text-sm">Loading movies...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Featured / Active Banners */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <div>
                  <h2 className="font-bold text-[#111827] text-sm">Active Banners</h2>
                  <p className="text-[#9CA3AF] text-xs">{featuredMovies.length} movies in carousel</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                {featuredMovies.length === 0 ? (
                  <div className="py-14 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-[#F9FAFB] flex items-center justify-center mb-3">
                      <Sparkles className="w-6 h-6 text-[#D1D5DB]" />
                    </div>
                    <p className="text-[#9CA3AF] text-sm font-medium">No featured banners</p>
                    <p className="text-[#D1D5DB] text-xs mt-1">Toggle movies below to add them</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F3F4F6]">
                    {featuredMovies.map((movie, i) => (
                      <motion.div
                        key={movie.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#FAFAFA] transition-colors"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-24 h-14 rounded-xl overflow-hidden shrink-0 bg-[#F3F4F6]">
                          {movie.banner_url ? (
                            <Image src={movie.banner_url} alt={movie.title} fill className="object-cover" />
                          ) : movie.poster_url ? (
                            <Image src={movie.poster_url} alt={movie.title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-5 h-5 text-[#D1D5DB]" />
                            </div>
                          )}
                          {/* Featured badge overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#111827] text-sm truncate capitalize">{movie.title}</p>
                          <p className="text-xs text-[#9CA3AF] truncate mt-0.5">{movie.language} · {movie.genre?.slice(0, 2).join(", ")}</p>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                            Featured
                          </span>
                          <Switch
                            checked={true}
                            onCheckedChange={() => handleToggle(movie.id, true)}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Available Movies to Feature */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center border border-[#E5E7EB]">
                  <Film className="w-4 h-4 text-[#6B7280]" />
                </div>
                <div>
                  <h2 className="font-bold text-[#111827] text-sm">Available Movies</h2>
                  <p className="text-[#9CA3AF] text-xs">{otherMovies.length} movies available</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                {otherMovies.length === 0 ? (
                  <div className="py-14 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-[#F9FAFB] flex items-center justify-center mb-3">
                      <Check className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-[#9CA3AF] text-sm font-medium">All active movies are featured</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F3F4F6]">
                    {otherMovies.map((movie, i) => (
                      <motion.div
                        key={movie.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#FAFAFA] transition-colors group"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-24 h-14 rounded-xl overflow-hidden shrink-0 bg-[#F3F4F6]">
                          {movie.poster_url ? (
                            <Image src={movie.poster_url} alt={movie.title} fill className="object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-5 h-5 text-[#D1D5DB]" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#374151] text-sm truncate capitalize">{movie.title}</p>
                          <p className="text-xs text-[#9CA3AF] mt-0.5">{movie.language}</p>
                        </div>

                        {/* Add button */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleToggle(movie.id, false)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E5E7EB] text-[#6B7280] hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all"
                          >
                            <Plus className="w-3 h-3" /> Feature
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">How banners work</p>
            <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
              Featured movies appear in the hero carousel on the homepage. Toggle any active movie to add or remove it from the banner rotation.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
