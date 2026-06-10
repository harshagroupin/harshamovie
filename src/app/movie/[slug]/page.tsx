import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMovieBySlug, getMovies } from "@/actions/movies";
import { getShowtimesByMovie } from "@/actions/showtimes";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MovieDetailContent } from "./movie-detail-content";
import { APP_NAME, APP_URL, BUSINESS } from "@/lib/constants";
import {
  generateMovieSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateScreeningEventSchema,
} from "@/lib/schema";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

// Pre-render all movie pages at build time
export async function generateStaticParams() {
  try {
    const movies = await getMovies();
    return movies.map((movie) => ({ slug: movie.slug }));
  } catch {
    return [];
  }
}

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie) return { title: "Movie Not Found" };

  const movieUrl = `${APP_URL}/movie/${movie.slug}`;
  const durationText = movie.duration
    ? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m`
    : "";
  const genreText = movie.genre?.join(", ") || "";
  const description =
    `${movie.title} (${movie.language || "Hindi"}) — ${genreText}${durationText ? ` • ${durationText}` : ""}. ` +
    `Now showing at ${APP_NAME}, ${BUSINESS.city}. Book tickets online for showtimes and seat selection.`;

  return {
    title: `${movie.title} — Tickets & Showtimes`,
    description,
    keywords: [
      movie.title,
      `${movie.title} tickets`,
      `${movie.title} showtimes`,
      `${movie.title} ${BUSINESS.city}`,
      `${movie.title} booking`,
      ...(movie.genre || []),
      `${movie.title} ${movie.language || "Hindi"}`,
      APP_NAME,
    ],
    alternates: {
      canonical: movieUrl,
    },
    openGraph: {
      title: `${movie.title} — Now Showing at ${APP_NAME}`,
      description,
      url: movieUrl,
      images: movie.poster_url
        ? [
            {
              url: movie.poster_url,
              width: 800,
              height: 1200,
              alt: `${movie.title} movie poster`,
            },
          ]
        : [],
      type: "video.movie",
    },
    twitter: {
      card: "summary_large_image",
      title: `${movie.title} — ${APP_NAME}`,
      description,
      images: movie.poster_url ? [movie.poster_url] : [],
    },
  };
}

export default async function MovieDetailPage({ params }: Props) {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie) notFound();

  const showtimes = await getShowtimesByMovie(movie.id);

  // Server-rendered JSON-LD schemas
  const movieSchema = generateMovieSchema(movie);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: APP_URL },
    { name: "Movies", url: `${APP_URL}/#now-showing` },
    { name: movie.title, url: `${APP_URL}/movie/${movie.slug}` },
  ]);

  // Movie-specific FAQ data
  const faqData = [
    {
      question: `What is the release date of ${movie.title} at ${APP_NAME}?`,
      answer: `${movie.title} was officially released on ${formatDate(movie.release_date)}. You can view showtimes and book tickets at harshamovies.com.`,
    },
    {
      question: `In what language is ${movie.title} available at ${APP_NAME}?`,
      answer: `${movie.title} is currently screened in ${movie.language || "Hindi"} at ${APP_NAME}, ${BUSINESS.city}.`,
    },
    {
      question: `What is the duration of ${movie.title}?`,
      answer: `The running time of ${movie.title} is approximately ${movie.duration ? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m` : "2 hours and 15 minutes"}.`,
    },
    {
      question: `How can I book tickets for ${movie.title} online?`,
      answer: `Visit harshamovies.com/movie/${movie.slug}, select a showtime, choose your preferred seats (Premium, Gold, or Recliner), and complete the booking. Payment is accepted via cash at the counter.`,
    },
    {
      question: `What are the ticket prices for ${movie.title}?`,
      answer: `Ticket prices for ${movie.title} at ${APP_NAME} range from ₹150 (Premium) to ₹500 (Recliner). Gold seats are available at mid-range pricing.`,
    },
  ];

  const faqSchema = generateFAQSchema(
    faqData.map((f) => ({ question: f.question, answer: f.answer }))
  );

  // Generate screening event schemas for upcoming showtimes
  const screeningSchemas = showtimes.slice(0, 5).map((st) =>
    generateScreeningEventSchema(movie, st)
  );

  return (
    <>
      {/* All JSON-LD rendered server-side for AI crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(movieSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {screeningSchemas.map((schema, i) => (
        <script
          key={`screening-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <Navbar />
      <main className="min-h-screen">
        <MovieDetailContent movie={movie} showtimes={showtimes} faqData={faqData} />
      </main>
      <Footer />
    </>
  );
}
