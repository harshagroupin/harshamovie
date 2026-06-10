import { MetadataRoute } from "next";
import { getMovies } from "@/actions/movies";
import { APP_URL } from "@/lib/constants";

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = APP_URL;

  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  try {
    const movies = await getMovies();
    const movieUrls: MetadataRoute.Sitemap = movies.map((movie) => ({
      url: `${baseUrl}/movie/${movie.slug}`,
      lastModified: new Date(movie.release_date || movie.created_at || new Date()),
      changeFrequency: "weekly",
      priority: 0.8,
      images: movie.poster_url ? [movie.poster_url] : undefined,
    }));

    return [...routes, ...movieUrls];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return routes;
  }
}
