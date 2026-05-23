import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMovieBySlug } from "@/actions/movies";
import { getShowtimesByMovie } from "@/actions/showtimes";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MovieDetailContent } from "./movie-detail-content";
import { APP_URL } from "@/lib/constants";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie) return { title: "Movie Not Found" };

  const movieUrl = `${APP_URL}/movie/${movie.slug}`;

  return {
    title: movie.title,
    description: movie.description || `${movie.title} tickets and showtimes at Harsh A Movie, Karnal.`,
    keywords: [movie.title, ...(movie.genre || []), `${movie.title} booking`, `${movie.title} showtime Karnal`, "Harsha Movies"],
    alternates: {
      canonical: movieUrl,
    },
    openGraph: {
      title: movie.title,
      description: movie.description,
      url: movieUrl,
      images: [movie.poster_url],
      type: "video.movie",
    },
    twitter: {
      card: "summary_large_image",
      title: movie.title,
      description: movie.description,
      images: [movie.poster_url],
    },
  };
}

export default async function MovieDetailPage({ params }: Props) {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie) notFound();

  const showtimes = await getShowtimesByMovie(movie.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": movie.title,
    "description": movie.description,
    "image": movie.poster_url,
    "dateCreated": movie.release_date,
    "genre": movie.genre,
    "duration": movie.duration ? `PT${Math.floor(movie.duration / 60)}H${movie.duration % 60}M` : "PT2H15M",
    "inLanguage": movie.language,
    "releasedEvent": {
      "@type": "PublicationEvent",
      "startDate": movie.release_date,
      "location": {
        "@type": "Place",
        "name": "Harsh A Movie, Karnal"
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="min-h-screen">
        <MovieDetailContent movie={movie} showtimes={showtimes} />
      </main>
      <Footer />
    </>
  );
}
