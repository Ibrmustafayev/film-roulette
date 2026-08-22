import { getGenres, getPopularMovies, Genre, Movie } from "@/lib/tmdb";
import { HomeContent } from "@/components/HomeContent";

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Both calls are independent, and either failing must not take the page down.
  const [genresResult, popularResult] = await Promise.allSettled([
    getGenres("en-US"),
    getPopularMovies("en-US", 18),
  ]);

  const genres: Genre[] =
    genresResult.status === "fulfilled" ? genresResult.value : [];
  const popular: Movie[] =
    popularResult.status === "fulfilled" ? popularResult.value : [];

  if (genresResult.status === "rejected") {
    console.error("Failed to load genres", genresResult.reason);
  }
  if (popularResult.status === "rejected") {
    console.error("Failed to load popular movies", popularResult.reason);
  }

  return <HomeContent genres={genres} popular={popular} />;
}
