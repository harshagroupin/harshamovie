import { create } from "zustand";
import type { BookingState, BookingActions, Movie, Showtime } from "@/lib/types";
import { calculateSubtotal } from "@/lib/seat-layouts";

const initialState: BookingState = {
  movieId: null,
  movieTitle: null,
  moviePoster: null,
  showtimeId: null,
  showDate: null,
  showTime: null,
  screenName: null,
  price: 0,
  price_premium: 0,
  price_gold: 0,
  price_recliner: 0,
  selectedSeats: [],
  customerName: "",
  phone: "",
  email: "",
  promoCode: "",
  discount: 0,
  discountType: null,
  paymentMode: "cash",
};

export const useBookingStore = create<BookingState & BookingActions>(
  (set, get) => ({
    ...initialState,

    setMovie: (movie: Pick<Movie, "id" | "title" | "poster_url">) =>
      set({
        movieId: movie.id,
        movieTitle: movie.title,
        moviePoster: movie.poster_url,
      }),

    setShowtime: (showtime: Showtime) =>
      set({
        showtimeId: showtime.id,
        showDate: showtime.show_date,
        showTime: showtime.show_time,
        screenName: showtime.screen_name,
        price: showtime.price,
        price_premium: showtime.price_premium || showtime.price,
        price_gold: showtime.price_gold || showtime.price,
        price_recliner: showtime.price_recliner || showtime.price,
        selectedSeats: [],
      }),

    toggleSeat: (seatId: string) =>
      set((state) => {
        const seats = state.selectedSeats.includes(seatId)
          ? state.selectedSeats.filter((s) => s !== seatId)
          : [...state.selectedSeats, seatId];
        return { selectedSeats: seats };
      }),

    setCustomerInfo: (info) =>
      set({
        customerName: info.name,
        phone: info.phone,
        email: info.email,
      }),

    setPromo: (code, discount, type) =>
      set({ promoCode: code, discount, discountType: type }),

    clearPromo: () =>
      set({ promoCode: "", discount: 0, discountType: null }),

    setPaymentMode: (mode) => set({ paymentMode: mode }),

    getSubtotal: () => {
      const state = get();
      return calculateSubtotal(state.selectedSeats, state.screenName, {
        premium: state.price_premium,
        gold: state.price_gold,
        recliner: state.price_recliner,
        base: state.price
      });
    },

    getFinalAmount: () => {
      const state = get();
      const subtotal = state.getSubtotal();
      if (!state.discount || !state.discountType) return subtotal;
      if (state.discountType === "percentage") {
        return Math.max(0, subtotal - (subtotal * state.discount) / 100);
      }
      return Math.max(0, subtotal - state.discount);
    },

    reset: () => set(initialState),
  })
);
