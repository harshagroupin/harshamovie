"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Clock, Calendar, Search, Edit2, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { PageTransition } from "@/components/shared/page-transition";
import { getAllShowtimes, createShowtime, deleteShowtime, updateShowtime } from "@/actions/showtimes";
import { getAllMoviesAdmin } from "@/actions/movies";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { SCREENS } from "@/lib/constants";
import { toast } from "sonner";
import type { Movie, Showtime } from "@/lib/types";
import { motion } from "framer-motion";

export default function AdminShowtimesPage() {
  const [showtimes, setShowtimes] = useState<(Showtime & { movie: { title: string } })[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [entries, setEntries] = useState([{ date: new Date().toISOString().split("T")[0], time: "14:00" }]);

  const SCREEN_SEATS = {
    "Audi 1": { premium: 161, gold: 95, recliner: 27 },
    "Audi 2": { premium: 32, gold: 118, recliner: 17 },
    "Audi 3": { premium: 0, gold: 116, recliner: 0 },
  };
  const [form, setForm] = useState({
    movie_id: "",
    screen_name: "Audi 1",
    price: "0",
    price_premium: "",
    price_gold: "",
    price_recliner: "",
    total_seats: "100",
    seats_premium: "",
    seats_gold: "",
    seats_recliner: "",
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    const defaultSeats = SCREEN_SEATS["Audi 1"];
    setForm({ 
      movie_id: "", 
      screen_name: "Audi 1", 
      price: "0", 
      price_premium: "", 
      price_gold: "", 
      price_recliner: "", 
      total_seats: (defaultSeats.premium + defaultSeats.gold + defaultSeats.recliner).toString(), 
      seats_premium: defaultSeats.premium.toString(), 
      seats_gold: defaultSeats.gold.toString(), 
      seats_recliner: defaultSeats.recliner.toString() 
    });
    setEntries([{ date: new Date().toISOString().split("T")[0], time: "14:00" }]);
    setDialogOpen(true);
  };

  const handleEdit = (st: Showtime) => {
    setEditingId(st.id);
    setForm({
      movie_id: st.movie_id,
      screen_name: st.screen_name,
      price: st.price ? st.price.toString() : "0",
      price_premium: st.price_premium ? st.price_premium.toString() : "",
      price_gold: st.price_gold ? st.price_gold.toString() : "",
      price_recliner: st.price_recliner ? st.price_recliner.toString() : "",
      total_seats: st.total_seats.toString(),
      seats_premium: st.seats_premium ? st.seats_premium.toString() : "",
      seats_gold: st.seats_gold ? st.seats_gold.toString() : "",
      seats_recliner: st.seats_recliner ? st.seats_recliner.toString() : "",
    });
    setEntries([{ date: st.show_date, time: st.show_time }]);
    setDialogOpen(true);
  };

  useEffect(() => {
    const p = parseInt(form.seats_premium) || 0;
    const g = parseInt(form.seats_gold) || 0;
    const r = parseInt(form.seats_recliner) || 0;
    const total = p + g + r;
    if (form.seats_premium !== "" || form.seats_gold !== "" || form.seats_recliner !== "") {
      setForm((prev) => {
        if (prev.total_seats !== total.toString()) {
          return { ...prev, total_seats: total.toString() };
        }
        return prev;
      });
    }
  }, [form.seats_premium, form.seats_gold, form.seats_recliner]);

  const fetchData = async () => {
    try {
      const [st, mv] = await Promise.all([getAllShowtimes(), getAllMoviesAdmin()]);
      setShowtimes(st);
      setMovies(mv);
    } catch { toast.error("Failed to load data"); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = showtimes.filter(st =>
    !search ||
    st.movie?.title?.toLowerCase().includes(search.toLowerCase()) ||
    st.screen_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!form.movie_id) { toast.error("Select a movie"); return; }
    if (entries.length === 0) { toast.error("Please add at least one date and time"); return; }
    
    const pSeats = parseInt(form.seats_premium) || 0;
    const gSeats = parseInt(form.seats_gold) || 0;
    const rSeats = parseInt(form.seats_recliner) || 0;

    if (pSeats > 0 && !form.price_premium) { toast.error("Please fill Premium price"); return; }
    if (gSeats > 0 && !form.price_gold) { toast.error("Please fill Gold price"); return; }
    if (rSeats > 0 && !form.price_recliner) { toast.error("Please fill Recliner price"); return; }
    
    for (const e of entries) {
      if (!e.date || !e.time) { toast.error("All date and time fields must be filled"); return; }
    }
    
    setCreating(true);
    try {
      if (editingId) {
        await updateShowtime(editingId, {
          movie_id: form.movie_id,
          screen_name: form.screen_name,
          show_date: entries[0].date,
          show_time: entries[0].time,
          price: 0,
          price_premium: pSeats > 0 ? parseFloat(form.price_premium) : 0,
          price_gold: gSeats > 0 ? parseFloat(form.price_gold) : 0,
          price_recliner: rSeats > 0 ? parseFloat(form.price_recliner) : 0,
          total_seats: parseInt(form.total_seats) || 0,
          seats_premium: pSeats,
          seats_gold: gSeats,
          seats_recliner: rSeats,
        });
        toast.success("Showtime updated!");
      } else {
        const promises = entries.map(e => createShowtime({
          movie_id: form.movie_id,
          screen_name: form.screen_name,
          show_date: e.date,
          show_time: e.time,
          price: 0,
          price_premium: pSeats > 0 ? parseFloat(form.price_premium) : 0,
          price_gold: gSeats > 0 ? parseFloat(form.price_gold) : 0,
          price_recliner: rSeats > 0 ? parseFloat(form.price_recliner) : 0,
          total_seats: parseInt(form.total_seats) || 0,
          seats_premium: pSeats,
          seats_gold: gSeats,
          seats_recliner: rSeats,
        }));
        await Promise.all(promises);
        toast.success(`Created ${promises.length} showtimes!`);
      }
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this showtime?")) return;
    try {
      await deleteShowtime(id);
      setShowtimes((prev) => prev.filter((s) => s.id !== id));
      toast.success("Showtime deleted");
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#0F1117] tracking-tight">Showtimes</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">{showtimes.length} showtimes total</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#CC0812] text-white text-sm font-bold transition-all shadow-lg shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Showtime
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search by movie or screen..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#E50914]/40 focus:ring-2 focus:ring-[#E50914]/10 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#9CA3AF] text-sm">Loading showtimes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] py-20 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] flex items-center justify-center mb-4">
              <Clock className="w-7 h-7 text-[#E50914]" />
            </div>
            <h3 className="font-bold text-[#111827] text-base mb-1">No showtimes found</h3>
            <p className="text-[#9CA3AF] text-sm mb-4">
              {search ? `No results for "${search}"` : "Add your first showtime to get started"}
            </p>
            {!search && (
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] text-white text-sm font-bold hover:bg-[#CC0812] transition-all"
              >
                <Plus className="w-4 h-4" /> Add Showtime
              </button>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                    <th className="text-left py-3 px-5 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Movie</th>
                    <th className="text-left py-3 px-5 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-5 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Time</th>
                    <th className="text-left py-3 px-5 text-[#6B7280] font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Screen</th>
                    <th className="text-left py-3 px-5 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Prices</th>
                    <th className="text-left py-3 px-5 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Seats</th>
                    <th className="text-left py-3 px-5 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((st, i) => {
                    const bookedCount = (st.booked_seats as any)?.length || 0;
                    const isSoldOut = bookedCount >= st.total_seats;
                    const fillPct = Math.round((bookedCount / st.total_seats) * 100);
                    return (
                      <tr key={st.id} className="border-t border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors">
                        <td className="py-3.5 px-5 font-bold text-[#111827] capitalize">{st.movie?.title || "N/A"}</td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
                            <span className="text-[#374151]">{formatDate(st.show_date)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                            <span className="font-semibold text-[#111827]">{formatTime(st.show_time)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 hidden sm:table-cell text-[#6B7280]">{st.screen_name}</td>
                        <td className="py-3.5 px-5 font-bold text-[#111827]">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="text-amber-600">G: {formatCurrency(st.price_gold)}</span>
                            <span className="text-[#0B70D5]">P: {formatCurrency(st.price_premium)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${isSoldOut ? "bg-red-400" : fillPct > 70 ? "bg-amber-400" : "bg-green-400"}`}
                                style={{ width: `${fillPct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${isSoldOut ? "text-red-500" : "text-[#6B7280]"}`}>
                              {bookedCount}/{st.total_seats}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(st)}
                              className="w-8 h-8 rounded-lg bg-[#F3F4F6] hover:bg-[#E2F1FE] flex items-center justify-center transition-colors group"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#0B70D5]" />
                            </button>
                            <button
                              onClick={() => handleDelete(st.id)}
                              className="w-8 h-8 rounded-lg bg-[#F3F4F6] hover:bg-red-50 flex items-center justify-center transition-colors group"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#E50914]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Create Showtime Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-[#0F1117]">
                {editingId ? "Edit Showtime" : "Add Showtimes"}
              </DialogTitle>
              <DialogDescription className="text-[#6B7280] text-sm">
                {editingId ? "Modify this showtime" : "Create one or multiple showtimes"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 pb-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#374151] uppercase tracking-wider">Movie *</Label>
                <Select value={form.movie_id} onValueChange={(v) => setForm((p) => ({ ...p, movie_id: v }))}>
                  <SelectTrigger className="border-[#E5E7EB]"><SelectValue placeholder="Select movie" /></SelectTrigger>
                  <SelectContent>
                    {movies.filter((m) => m.is_active).map((m) => (
                      <SelectItem key={m.id} value={m.id} className="capitalize">{m.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dates & Times */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-[#374151] uppercase tracking-wider">
                    {editingId ? "Date & Time" : "Date & Time Entries"}
                  </Label>
                  {!editingId && (
                    <button
                      onClick={() => setEntries(prev => [...prev, { date: new Date().toISOString().split("T")[0], time: "14:00" }])}
                      className="text-xs font-bold text-[#E50914] hover:text-[#CC0812] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Entry
                    </button>
                  )}
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {entries.map((entry, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        type="date"
                        value={entry.date}
                        onChange={(e) => {
                          const newEntries = [...entries];
                          newEntries[idx].date = e.target.value;
                          setEntries(newEntries);
                        }}
                        className="border-[#E5E7EB]"
                      />
                      <Input
                        type="time"
                        value={entry.time}
                        onChange={(e) => {
                          const newEntries = [...entries];
                          newEntries[idx].time = e.target.value;
                          setEntries(newEntries);
                        }}
                        className="border-[#E5E7EB]"
                      />
                      {!editingId && entries.length > 1 && (
                        <button
                          onClick={() => setEntries(prev => prev.filter((_, i) => i !== idx))}
                          className="p-2 hover:bg-red-50 rounded-lg text-[#9CA3AF] hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#374151] uppercase tracking-wider">Screen</Label>
                  <Select value={form.screen_name} onValueChange={(v) => {
                    const seats = SCREEN_SEATS[v as keyof typeof SCREEN_SEATS] || { premium: 0, gold: 0, recliner: 0 };
                    setForm((p) => ({ 
                      ...p, 
                      screen_name: v,
                      seats_premium: seats.premium.toString(),
                      seats_gold: seats.gold.toString(),
                      seats_recliner: seats.recliner.toString()
                    }));
                  }}>
                    <SelectTrigger className="border-[#E5E7EB]"><SelectValue /></SelectTrigger>
                    <SelectContent>{SCREENS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(parseInt(form.seats_premium) || 0) > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#374151] uppercase tracking-wider">Premium (₹)</Label>
                    <Input type="number" value={form.price_premium} onChange={(e) => setForm((p) => ({ ...p, price_premium: e.target.value }))} className="border-[#E5E7EB]" />
                  </div>
                )}
                {(parseInt(form.seats_gold) || 0) > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#374151] uppercase tracking-wider">Gold (₹)</Label>
                    <Input type="number" value={form.price_gold} onChange={(e) => setForm((p) => ({ ...p, price_gold: e.target.value }))} className="border-[#E5E7EB]" />
                  </div>
                )}
                {(parseInt(form.seats_recliner) || 0) > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#374151] uppercase tracking-wider">Recliner (₹)</Label>
                    <Input type="number" value={form.price_recliner} onChange={(e) => setForm((p) => ({ ...p, price_recliner: e.target.value }))} className="border-[#E5E7EB]" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#374151] uppercase tracking-wider" title="Total Seats">Total</Label>
                  <Input type="number" value={form.total_seats} readOnly className="border-[#E5E7EB] bg-[#F9FAFB] cursor-not-allowed" />
                </div>
                {(parseInt(form.seats_premium) || 0) > 0 ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#374151] uppercase tracking-wider" title="Premium Seats">Premium</Label>
                    <Input type="number" value={form.seats_premium} readOnly className="border-[#E5E7EB] bg-[#F9FAFB] cursor-not-allowed" />
                  </div>
                ) : <div />}
                {(parseInt(form.seats_gold) || 0) > 0 ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#374151] uppercase tracking-wider" title="Gold Seats">Gold</Label>
                    <Input type="number" value={form.seats_gold} readOnly className="border-[#E5E7EB] bg-[#F9FAFB] cursor-not-allowed" />
                  </div>
                ) : <div />}
                {(parseInt(form.seats_recliner) || 0) > 0 ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#374151] uppercase tracking-wider" title="Recliner Seats">Recliner</Label>
                    <Input type="number" value={form.seats_recliner} readOnly className="border-[#E5E7EB] bg-[#F9FAFB] cursor-not-allowed" />
                  </div>
                ) : <div />}
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <button
                onClick={() => setDialogOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-[#E5E7EB] text-[#374151] text-sm font-semibold hover:bg-[#F9FAFB] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={creating}
                className="px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#CC0812] text-white text-sm font-bold transition-all disabled:opacity-60"
              >
                {creating ? "Saving..." : editingId ? "Save Changes" : "Create Showtimes"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
