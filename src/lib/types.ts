/* ===== DATABASE TYPES ===== */

export interface Movie {
  id: string;
  title: string;
  slug: string;
  description: string;
  poster_url: string;
  banner_url: string;
  trailer_url: string;
  genre: string[];
  duration: number;
  language: string;
  rating: string;
  release_date: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Showtime {
  id: string;
  movie_id: string;
  screen_name: string;
  show_date: string;
  show_time: string;
  price: number;
  total_seats: number;
  booked_seats: string[];
  created_at: string;
  movie?: Movie;
}

export interface Booking {
  id: string;
  booking_id: string;
  showtime_id: string;
  customer_name: string;
  phone: string;
  email: string;
  selected_seats: string[];
  subtotal: number;
  discount: number;
  final_amount: number;
  promo_code_used: string | null;
  payment_mode: "cash";
  payment_status: "completed" | "pending";
  booking_status: "confirmed" | "cancelled";
  created_at: string;
  showtime?: Showtime & { movie?: Movie };
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  usage_limit: number;
  times_used: number;
  expiry_date: string | null;
  is_active: boolean;
}

export interface Admin {
  id: string;
  email: string;
  role: string;
}

export interface BookingState {
  movieId: string | null;
  movieTitle: string | null;
  moviePoster: string | null;
  showtimeId: string | null;
  showDate: string | null;
  showTime: string | null;
  screenName: string | null;
  price: number;
  selectedSeats: string[];
  customerName: string;
  phone: string;
  email: string;
  promoCode: string;
  discount: number;
  discountType: "percentage" | "fixed" | null;
  paymentMode: "cash";
}

export interface BookingActions {
  setMovie: (movie: Pick<Movie, "id" | "title" | "poster_url">) => void;
  setShowtime: (showtime: Showtime) => void;
  toggleSeat: (seatId: string) => void;
  setCustomerInfo: (info: { name: string; phone: string; email: string }) => void;
  setPromo: (code: string, discount: number, type: "percentage" | "fixed") => void;
  clearPromo: () => void;
  setPaymentMode: (mode: "cash") => void;
  getSubtotal: () => number;
  getFinalAmount: () => number;
  reset: () => void;
}

export interface DashboardStats {
  totalMovies: number;
  totalBookings: number;
  todayBookings: number;
  totalRevenue: number;
}

export interface MovieCardProps {
  movie: Movie;
  variant?: "poster" | "banner" | "compact";
}

export interface SeatProps {
  id: string;
  status: "available" | "selected" | "booked";
  onSelect: (id: string) => void;
}
