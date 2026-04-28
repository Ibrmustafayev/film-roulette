import { getGenres } from "@/lib/tmdb";
import { HomeContent } from "@/components/HomeContent";

export default async function Home() {
  let genres = [];
  try {
    genres = await getGenres("en-US");
  } catch (error) {
    console.error("Failed to load genres", error);
  }

  return <HomeContent genres={genres} />;
}
