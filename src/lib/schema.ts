import { APP_NAME, APP_URL, BUSINESS, SOCIAL_LINKS } from "./constants";
import type { Movie, Showtime } from "./types";

// ─── Organization + MovieTheater (combined) ───────────────────────
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${APP_URL}/#organization`,
    name: APP_NAME,
    url: APP_URL,
    logo: {
      "@type": "ImageObject",
      url: `${APP_URL}/logo.png`,
      width: 512,
      height: 512,
    },
    description: BUSINESS.description,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.streetAddress,
      addressLocality: BUSINESS.city,
      addressRegion: BUSINESS.state,
      postalCode: BUSINESS.postalCode,
      addressCountry: "IN",
    },
    sameAs: Object.values(SOCIAL_LINKS).filter(Boolean),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: BUSINESS.phone,
      contactType: "customer service",
      availableLanguage: ["Hindi", "English"],
      areaServed: "IN",
    },
  };
}

// ─── WebSite Schema (with SearchAction for sitelinks) ─────────────
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${APP_URL}/#website`,
    name: APP_NAME,
    url: APP_URL,
    description: BUSINESS.description,
    publisher: {
      "@id": `${APP_URL}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${APP_URL}/?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ─── MovieTheater / LocalBusiness Schema ──────────────────────────
export function generateMovieTheaterSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "MovieTheater",
    "@id": `${APP_URL}/#movietheater`,
    name: APP_NAME,
    url: APP_URL,
    logo: `${APP_URL}/logo.png`,
    image: `${APP_URL}/og-image.jpg`,
    description: BUSINESS.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.streetAddress,
      addressLocality: BUSINESS.city,
      addressRegion: BUSINESS.state,
      postalCode: BUSINESS.postalCode,
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.latitude,
      longitude: BUSINESS.longitude,
    },
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    priceRange: "₹150-₹500",
    currenciesAccepted: "INR",
    paymentAccepted: "Online Payment (Paytm)",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday", "Tuesday", "Wednesday", "Thursday",
          "Friday", "Saturday", "Sunday",
        ],
        opens: "09:00",
        closes: "23:00",
      },
    ],
    screenCount: 3,
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Dolby Atmos Sound", value: true },
      { "@type": "LocationFeatureSpecification", name: "Recliner Seating", value: true },
      { "@type": "LocationFeatureSpecification", name: "3D Projection", value: true },
      { "@type": "LocationFeatureSpecification", name: "Online Booking", value: true },
      { "@type": "LocationFeatureSpecification", name: "Air Conditioning", value: true },
    ],
    hasMap: BUSINESS.googleMapsUrl,
    areaServed: {
      "@type": "City",
      name: BUSINESS.city,
    },
  };
}

// ─── BreadcrumbList Schema ────────────────────────────────────────
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ─── FAQPage Schema ───────────────────────────────────────────────
export function generateFAQSchema(
  faqs: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// ─── Movie Schema (enhanced for Google Rich Results) ──────────────
export function generateMovieSchema(movie: Movie) {
  const durationHours = movie.duration ? Math.floor(movie.duration / 60) : 2;
  const durationMinutes = movie.duration ? movie.duration % 60 : 15;
  const isoDuration = `PT${durationHours}H${durationMinutes}M`;

  return {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    description: movie.description,
    image: movie.poster_url,
    dateCreated: movie.release_date,
    genre: movie.genre,
    duration: isoDuration,
    inLanguage: movie.language || "Hindi",
    contentRating: movie.rating || "UA",
    url: `${APP_URL}/movie/${movie.slug}`,
    releasedEvent: {
      "@type": "PublicationEvent",
      startDate: movie.release_date,
      location: {
        "@type": "MovieTheater",
        name: APP_NAME,
        address: {
          "@type": "PostalAddress",
          addressLocality: BUSINESS.city,
          addressRegion: BUSINESS.state,
          addressCountry: "IN",
        },
      },
    },
    offers: {
      "@type": "AggregateOffer",
      url: `${APP_URL}/movie/${movie.slug}`,
      priceCurrency: "INR",
      lowPrice: "150",
      highPrice: "500",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: APP_NAME,
      },
    },
    provider: {
      "@type": "MovieTheater",
      name: APP_NAME,
      "@id": `${APP_URL}/#movietheater`,
    },
  };
}

// ─── ScreeningEvent Schema (for individual showtimes) ─────────────
export function generateScreeningEventSchema(
  movie: Movie,
  showtime: Showtime
) {
  const bookedCount = (showtime.booked_seats as string[])?.length || 0;
  const availableSeats = showtime.total_seats - bookedCount;
  const validPrices = [
    showtime.price_premium,
    showtime.price_gold,
    showtime.price_recliner,
    showtime.price,
  ].filter((p) => p > 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 150;

  return {
    "@context": "https://schema.org",
    "@type": "ScreeningEvent",
    name: `${movie.title} — ${showtime.screen_name}`,
    startDate: `${showtime.show_date}T${showtime.show_time}`,
    location: {
      "@type": "MovieTheater",
      name: `${APP_NAME} — ${showtime.screen_name}`,
      address: {
        "@type": "PostalAddress",
        streetAddress: BUSINESS.streetAddress,
        addressLocality: BUSINESS.city,
        addressRegion: BUSINESS.state,
        addressCountry: "IN",
      },
    },
    workPerformed: {
      "@type": "Movie",
      name: movie.title,
      image: movie.poster_url,
    },
    offers: {
      "@type": "Offer",
      url: `${APP_URL}/booking/seats?showtime=${showtime.id}`,
      priceCurrency: "INR",
      price: minPrice,
      availability:
        availableSeats > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
      validFrom: showtime.show_date,
    },
  };
}
