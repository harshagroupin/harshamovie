"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getMovies } from "@/actions/movies";
import { getShowtimesByMovie } from "@/actions/showtimes";
import { createBooking } from "@/actions/bookings";
import { calculateSubtotal, SCREEN_LAYOUTS, AUDI_1 } from "@/lib/seat-layouts";
import { toast } from "sonner";
import { ArrowLeft, Ticket } from "lucide-react";
import Link from "next/link";
import type { Movie, Showtime } from "@/lib/types";

export default function AdminNewBookingPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  
  const [selectedMovie, setSelectedMovie] = useState("");
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  
  const [selectedTier, setSelectedTier] = useState<"premium" | "gold" | "recliner" | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  useEffect(() => {
    async function fetchMovies() {
      try {
        const data = await getMovies();
        setMovies(data.filter(m => m.is_active));
      } catch {
        toast.error("Failed to load movies");
      }
    }
    fetchMovies();
  }, []);

  useEffect(() => {
    if (!selectedMovie) {
      setShowtimes([]);
      setSelectedShowtime(null);
      setSelectedTier(null);
      setSelectedSeats([]);
      return;
    }
    async function fetchShowtimes() {
      try {
        const data = await getShowtimesByMovie(selectedMovie);
        setShowtimes(data);
      } catch {
        toast.error("Failed to load showtimes");
      }
    }
    fetchShowtimes();
  }, [selectedMovie]);

  // When showtime changes, reset seats
  useEffect(() => {
    setSelectedTier(null);
    setSelectedSeats([]);
  }, [selectedShowtime]);

  useEffect(() => {
    if (!selectedShowtime || selectedSeats.length === 0) {
      setCalculatedPrice(0);
      return;
    }
    const price = calculateSubtotal(selectedSeats, selectedShowtime.screen_name, {
      premium: selectedShowtime.price_premium,
      gold: selectedShowtime.price_gold,
      recliner: selectedShowtime.price_recliner,
      base: selectedShowtime.price
    });
    setCalculatedPrice(price);
  }, [selectedSeats, selectedShowtime]);

  const toggleSeat = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShowtime) return toast.error("Please select a showtime");
    if (selectedSeats.length === 0) return toast.error("Please select at least one seat");
    if (!name || !phone) return toast.error("Name and Phone are required");

    setLoading(true);
    try {
      await createBooking({
        showtimeId: selectedShowtime.id,
        customerName: name,
        phone,
        email,
        selectedSeats,
        subtotal: calculatedPrice,
        discount: 0,
        finalAmount: calculatedPrice,
        promoCodeUsed: null,
        paymentMode: "cash"
      });
      toast.success("Ticket generated and confirmed successfully!");
      router.push("/admin/bookings");
    } catch (err: any) {
      toast.error(err.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get available seats for a tier
  const getAvailableSeats = (tier: "premium" | "gold" | "recliner") => {
    if (!selectedShowtime) return [];
    const layout = SCREEN_LAYOUTS[selectedShowtime.screen_name || "Audi 1"] || AUDI_1;
    const booked = (selectedShowtime.booked_seats as string[]) || [];
    
    const available: string[] = [];
    layout.forEach(row => {
      if (row.tier === tier) {
        row.seats.forEach(seat => {
          if (seat !== null && !booked.includes(seat)) {
            available.push(seat);
          }
        });
      }
    });
    return available;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6 pb-12">
      <Link href="/admin/bookings" className="inline-flex items-center gap-2 text-[#6B7280] hover:text-[#111827] font-medium transition-colors mb-2">
        <ArrowLeft className="w-4 h-4" /> Back to Bookings
      </Link>

      <form onSubmit={handleSubmit} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        
        {/* Movie & Showtime Selection */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-2">Movie Details</h2>
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Select Movie</label>
            <select 
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-[#111827] text-sm focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-all"
              value={selectedMovie}
              onChange={(e) => setSelectedMovie(e.target.value)}
            >
              <option value="">-- Choose Movie --</option>
              {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>

          {selectedMovie && (
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Select Showtime</label>
              <select 
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-[#111827] text-sm focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-all"
                value={selectedShowtime?.id || ""}
                onChange={(e) => {
                  const st = showtimes.find(s => s.id === e.target.value);
                  setSelectedShowtime(st || null);
                }}
              >
                <option value="">-- Choose Showtime --</option>
                {showtimes.map(st => (
                  <option key={st.id} value={st.id}>
                    {new Date(st.show_date).toLocaleDateString()} @ {st.show_time.substring(0, 5)} - {st.screen_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {selectedShowtime && (
          <>
            <div className="border-t border-[#E5E7EB]" />
            
            {/* Tier & Seat Selection */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-2">Select Seats</h2>
              
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "premium", label: "Premium", price: selectedShowtime.price_premium },
                  { id: "gold", label: "Gold", price: selectedShowtime.price_gold },
                  { id: "recliner", label: "Recliner", price: selectedShowtime.price_recliner }
                ].map(tier => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedTier(tier.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedTier === tier.id 
                        ? "border-[#E50914] bg-[#E50914]/5 ring-1 ring-[#E50914]" 
                        : "border-[#E5E7EB] hover:border-[#E50914]/50"
                    }`}
                  >
                    <p className={`text-xs font-bold uppercase ${selectedTier === tier.id ? "text-[#E50914]" : "text-[#374151]"}`}>
                      {tier.label}
                    </p>
                    <p className="text-lg font-black text-[#111827]">₹{tier.price}</p>
                    <p className="text-[10px] text-[#6B7280] mt-1">{getAvailableSeats(tier.id as any).length} available</p>
                  </button>
                ))}
              </div>

              {selectedTier && (
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-4 rounded-xl">
                  <p className="text-xs font-bold text-[#374151] mb-3 uppercase">Available {selectedTier} Seats</p>
                  <div className="flex flex-wrap gap-2">
                    {getAvailableSeats(selectedTier).length > 0 ? (
                      getAvailableSeats(selectedTier).map(seat => {
                        const isSelected = selectedSeats.includes(seat);
                        return (
                          <button
                            key={seat}
                            type="button"
                            onClick={() => toggleSeat(seat)}
                            className={`px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-colors ${
                              isSelected
                                ? "bg-[#E50914] text-white"
                                : "bg-white text-[#374151] border border-[#E5E7EB] hover:border-[#E50914] hover:text-[#E50914]"
                            }`}
                          >
                            {seat}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-sm text-[#6B7280]">No seats available in this tier.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#E5E7EB]" />

            {/* Guest Details */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-2">Guest Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Guest Name</label>
                  <input 
                    type="text" required
                    placeholder="e.g. Rahul Kumar"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-[#111827] text-sm focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-all"
                    value={name} onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Mobile Number</label>
                  <input 
                    type="tel" required
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-[#111827] text-sm focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-all"
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">Email Address (Optional)</label>
                <input 
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-[#111827] text-sm focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-all"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Summary & Submit */}
            {selectedSeats.length > 0 && (
              <div className="bg-[#FFF1F2] rounded-xl p-4 border border-[#FFE4E6]">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#E50914] font-bold">Selected Seats: {selectedSeats.length}</span>
                  <span className="text-xl font-black text-[#E50914]">₹{calculatedPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || selectedSeats.length === 0}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                selectedSeats.length === 0 
                  ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed" 
                  : "bg-[#E50914] hover:bg-red-700 text-white"
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Ticket className="w-4 h-4" />
                  Generate Ticket
                </>
              )}
            </button>
          </>
        )}
      </form>
    </motion.div>
  );
}
