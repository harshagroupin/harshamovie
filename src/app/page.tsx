import { getMovies, getFeaturedMovies } from "@/actions/movies";
import { getActivePromoCodes } from "@/actions/promos";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HomeContent } from "./home-content";

export default async function HomePage() {
  const [movies, featured, promoCodes] = await Promise.all([
    getMovies(),
    getFeaturedMovies(),
    getActivePromoCodes(),
  ]);

  return (
    <>
      <Navbar />
      <main>
        <HomeContent movies={movies} featuredMovies={featured} promoCodes={promoCodes} />
      </main>
      <Footer />
    </>
  );
}
