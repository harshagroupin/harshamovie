export const APP_NAME = "Harsh A Movie";
export const APP_TAGLINE = "Premium Cinema";
export const APP_DESCRIPTION =
  "Harsh A Movie is Karnal's premier cinema — 3 screens, Dolby Atmos sound, recliner seating. Book tickets online for the latest Bollywood, Hollywood & Punjabi movies now showing at GT Road, Sector 12, Karnal, Haryana.";
export const APP_URL = "https://harshamovies.com";

// Business Info (expanded for Local SEO schema)
export const BUSINESS = {
  name: "Harsh A Movie",
  legalName: "Harsh A Movie Cinema",
  address: "GT Road, Sector 12, Karnal, Haryana 132001",
  streetAddress: "GT Road, Sector 12",
  city: "Karnal",
  state: "Haryana",
  postalCode: "132001",
  country: "IN",
  phone: "+91 8595540725",
  email: "info@harshamovies.in",
  whatsapp: "918595540725",
  hours: "9:00 AM – 11:00 PM",
  tagline: "Karnal's Ultimate Cinema Destination",
  description:
    "Experience movies like never before at Karnal's most premium cinema. State-of-the-art screens, immersive Dolby Atmos sound, and luxury recliner seating — your ultimate movie experience awaits.",
  latitude: 29.6857,
  longitude: 76.9905,
  googleMapsUrl:
    "https://www.google.com/maps/place/Karnal,+Haryana+132001",
  screens: 3,
};

// Social links — fill in when available
export const SOCIAL_LINKS = {
  instagram: "", // e.g. "https://instagram.com/harshamovies"
  facebook: "", // e.g. "https://facebook.com/harshamovies"
  youtube: "", // e.g. "https://youtube.com/@harshamovies"
  twitter: "", // e.g. "https://twitter.com/harshamovies"
};

// SEO Keywords organized by intent
export const SEO_KEYWORDS = {
  primary: [
    "Harsh A Movie",
    "Harsha Movies Karnal",
    "movie theater Karnal",
    "cinema Karnal",
    "book movie tickets Karnal",
  ],
  secondary: [
    "Karnal cinema",
    "movie tickets online Karnal",
    "Dolby Atmos cinema Karnal",
    "recliner cinema Karnal",
    "premium cinema Haryana",
    "GT Road cinema Karnal",
  ],
  longTail: [
    "best cinema in Karnal",
    "latest movies showing in Karnal",
    "online movie ticket booking Karnal",
    "3D movies Karnal Haryana",
    "cinema near me Karnal",
    "movie showtimes Karnal today",
  ],
};

// Homepage FAQ data for AEO (server-rendered)
export const HOMEPAGE_FAQS = [
  {
    question: "What is Harsh A Movie?",
    answer:
      "Harsh A Movie is a premium movie theater located on GT Road, Sector 12, Karnal, Haryana. It features 3 screens with Dolby Atmos sound, luxury recliner seating, and the latest Bollywood, Hollywood, and Punjabi films.",
  },
  {
    question: "Where is Harsh A Movie located?",
    answer:
      "Harsh A Movie is located at GT Road, Sector 12, Karnal, Haryana 132001, India. It is easily accessible from all major areas of Karnal city.",
  },
  {
    question: "How can I book movie tickets at Harsh A Movie?",
    answer:
      "You can book movie tickets online at harshamovies.com. Simply browse the 'Now Showing' section, select your preferred movie and showtime, choose your seats (Premium, Gold, or Recliner), and complete the booking. Payment is accepted via cash at the counter.",
  },
  {
    question: "What are the ticket prices at Harsh A Movie Karnal?",
    answer:
      "Ticket prices at Harsh A Movie range from ₹150 to ₹500, depending on the seat category. Options include Premium seats, Gold seats, and luxury Recliner seating.",
  },
  {
    question: "What are the opening hours of Harsh A Movie?",
    answer:
      "Harsh A Movie is open every day from 9:00 AM to 11:00 PM. Showtimes vary by movie — check the website for the latest schedule.",
  },
  {
    question: "Does Harsh A Movie have Dolby Atmos sound?",
    answer:
      "Yes, Harsh A Movie features an immersive Dolby Atmos sound system across its screens, delivering crystal-clear, multi-dimensional audio for the ultimate cinema experience.",
  },
  {
    question: "What movies are currently showing at Harsh A Movie Karnal?",
    answer:
      "Visit harshamovies.com to see the latest 'Now Showing' movies with real-time showtimes and seat availability. The website is updated daily with the newest releases.",
  },
  {
    question: "Does Harsh A Movie offer recliner seats?",
    answer:
      "Yes, Harsh A Movie offers luxury recliner seats with extra legroom and comfort. Recliner seating is available in all 3 auditoriums at a premium price.",
  },
];

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
