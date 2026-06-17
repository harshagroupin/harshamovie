"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Edit, Trash2, Star, Film, ArrowUpRight, FileSpreadsheet } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/shared/page-transition";
import { getAllMoviesAdmin, toggleMovieActive, toggleMovieFeatured, deleteMovie } from "@/actions/movies";
import { formatDate } from "@/lib/utils";
import type { Movie } from "@/lib/types";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchMovies = async () => {
    try {
      const data = await getAllMoviesAdmin();
      setMovies(data);
    } catch {
      toast.error("Failed to load movies");
    }
    setLoading(false);
  };

  useEffect(() => { fetchMovies(); }, []);

  const filtered = movies.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleActive = async (id: string, current: boolean) => {
    await toggleMovieActive(id, !current);
    setMovies((prev) => prev.map((m) => m.id === id ? { ...m, is_active: !current } : m));
    toast.success(!current ? "Movie activated" : "Movie deactivated");
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    await toggleMovieFeatured(id, !current);
    setMovies((prev) => prev.map((m) => m.id === id ? { ...m, is_featured: !current } : m));
    toast.success(!current ? "Added to featured" : "Removed from featured");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this movie? This will also delete all its showtimes.")) return;
    try {
      await deleteMovie(id);
      setMovies((prev) => prev.filter((m) => m.id !== id));
      toast.success("Movie deleted");
    } catch {
      toast.error("Failed to delete movie");
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#0F1117] tracking-tight">Movies</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">{movies.length} movies in database</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/movies/bulk-upload">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-[#374151] text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                <FileSpreadsheet className="w-4 h-4" />
                Bulk Upload
              </button>
            </Link>
            <Link href="/admin/movies/new">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#CC0812] text-white text-sm font-bold transition-all shadow-lg shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="w-4 h-4" />
                Add Movie
              </button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search movies..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#E50914]/40 focus:ring-2 focus:ring-[#E50914]/10 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#9CA3AF] text-sm">Loading movies...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] py-20 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] flex items-center justify-center mb-4">
              <Film className="w-7 h-7 text-[#E50914]" />
            </div>
            <h3 className="font-bold text-[#111827] text-base mb-1">No movies found</h3>
            <p className="text-[#9CA3AF] text-sm">
              {search ? `No results for "${search}"` : "Add your first movie to get started"}
            </p>
            {!search && (
              <Link href="/admin/movies/new" className="mt-4">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] text-white text-sm font-bold hover:bg-[#CC0812] transition-all">
                  <Plus className="w-4 h-4" /> Add Movie
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[80px_1fr_140px_120px_100px_100px] gap-4 px-5 py-3 bg-[#F9FAFB] border-b border-[#F3F4F6]">
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Poster</span>
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Movie</span>
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Details</span>
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Active</span>
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Featured</span>
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Actions</span>
            </div>

            <div className="divide-y divide-[#F3F4F6]">
              {filtered.map((movie, i) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex flex-col md:grid md:grid-cols-[80px_1fr_140px_120px_100px_100px] gap-3 md:gap-4 p-4 md:p-5 items-start md:items-center hover:bg-[#FAFAFA] transition-colors"
                >
                  {/* Poster */}
                  <div className="relative w-14 h-20 md:w-14 md:h-20 rounded-xl overflow-hidden shrink-0 bg-[#F3F4F6]">
                    {movie.poster_url ? (
                      <Image src={movie.poster_url} alt={movie.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-5 h-5 text-[#D1D5DB]" />
                      </div>
                    )}
                  </div>

                  {/* Movie info */}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[#111827] text-[14px] capitalize truncate">{movie.title}</h3>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {movie.genre?.slice(0, 3).map((g) => (
                        <span key={g} className="px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#6B7280] text-[10px] font-medium">{g}</span>
                      ))}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-[#6B7280]">{movie.language} · {movie.duration}m</span>
                    <span className="text-xs text-[#6B7280]">{movie.rating} · {formatDate(movie.release_date)}</span>
                  </div>

                  {/* Active toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={movie.is_active}
                      onCheckedChange={() => handleToggleActive(movie.id, movie.is_active)}
                    />
                    <span className={`text-xs font-medium ${movie.is_active ? "text-green-600" : "text-[#9CA3AF]"}`}>
                      {movie.is_active ? "Active" : "Hidden"}
                    </span>
                  </div>

                  {/* Featured toggle */}
                  <div>
                    <button
                      onClick={() => handleToggleFeatured(movie.id, movie.is_featured)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        movie.is_featured
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-[#F9FAFB] border-[#E5E7EB] text-[#9CA3AF] hover:border-amber-200 hover:text-amber-600"
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${movie.is_featured ? "fill-amber-500 text-amber-500" : ""}`} />
                      {movie.is_featured ? "Featured" : "Feature"}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/movies/${movie.id}`}>
                      <button className="w-8 h-8 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors" title="Edit">
                        <Edit className="w-3.5 h-3.5 text-[#374151]" />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(movie.id)}
                      className="w-8 h-8 rounded-lg bg-[#F3F4F6] hover:bg-red-50 flex items-center justify-center transition-colors group"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#E50914]" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
