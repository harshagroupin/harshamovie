import { MetadataRoute } from "next";
import { getMovies } from "@/actions/movies";
import { APP_URL } from "@/lib/constants";

export const revalidate = 3600; // Cache and revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = APP_URL;

  // Base routes
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
  ];

  try {
    const movies = await getMovies();
    const movieUrls = movies.map((movie) => ({
      url: `${baseUrl}/movie/${movie.slug}`,
      lastModified: new Date(movie.release_date || movie.created_at || new Date()),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...routes, ...movieUrls];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return routes;
  }
}
