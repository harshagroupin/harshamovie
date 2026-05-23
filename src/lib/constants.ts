export const APP_NAME = "Harsh A Movie";
export const APP_TAGLINE = "Premium Cinema";
export const APP_DESCRIPTION = "Karnal's premier movie theater — Premium screens, Dolby sound, luxury seating. Book your tickets now.";
export const APP_URL = "https://harshamovies.com";

// Business Info
export const BUSINESS = {
  name: "Harsh A Movie",
  address: "GT Road, Sector 12, Karnal, Haryana 132001",
  phone: "+91 8595540725",
  email: "info@harshamovies.in",
  whatsapp: "918595540725",
  hours: "9:00 AM – 11:00 PM",
  tagline: "Karnal's Ultimate Cinema Destination",
  description: "Experience movies like never before at Karnal's most premium cinema. State-of-the-art screens, immersive Dolby Atmos sound, and luxury recliner seating — your ultimate movie experience awaits.",
};

export const ROWS = 10;
export const COLS = 10;

export const SEAT_ROWS = Array.from({ length: ROWS }, (_, i) =>
  String.fromCharCode(65 + i)
);

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Now Showing", href: "/#now-showing" },
  { label: "Coming Soon", href: "/#upcoming" },
];

export const ADMIN_NAV_LINKS = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "Movies", href: "/admin/movies", icon: "Film" },
  { label: "Showtimes", href: "/admin/showtimes", icon: "Clock" },
  { label: "Bookings", href: "/admin/bookings", icon: "Ticket" },
  { label: "Promo Codes", href: "/admin/promos", icon: "Tag" },
  { label: "Banners", href: "/admin/banners", icon: "Image" },
];

export const PAYMENT_MODES = [
  { value: "cash", label: "Cash At Counter" },
];

export const GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime",
  "Documentary", "Drama", "Fantasy", "Horror", "Mystery",
  "Romance", "Sci-Fi", "Thriller", "War", "Western",
];

export const LANGUAGES = [
  "Hindi", "English", "Tamil", "Telugu", "Kannada",
  "Malayalam", "Bengali", "Marathi", "Punjabi", "Gujarati",
];

export const RATINGS = ["U", "UA", "A", "S"];

export const SCREENS = ["Audi 1", "Audi 2", "Audi 3"];
