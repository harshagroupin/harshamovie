import { getMovies, getFeaturedMovies } from "@/actions/movies";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HomeContent } from "./home-content";

export default async function HomePage() {
  const [movies, featured] = await Promise.all([
    getMovies(),
    getFeaturedMovies(),
  ]);

  return (
    <>
      <Navbar />
      <main>
        <HomeContent movies={movies} featuredMovies={featured} />
      </main>
      <Footer />
    </>
  );
}
