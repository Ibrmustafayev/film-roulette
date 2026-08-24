import { getGenres, getPopularMedia, getFullMovie, Genre, Movie, getImageUrl } from "@/lib/tmdb";
import { HomeContent } from "@/components/HomeContent";
import type { Metadata } from "next";
import { MediaJsonLd } from "@/components/JsonLd";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const movie = await getFullMovie(id, "en-US");
    if (!movie) {
      return {
        title: "Film Roulette",
        description: "Set your filters, roll once, and get one film to watch tonight.",
      };
    }

    const title = `${movie.title} - Watch on Film Roulette`;
    const description = movie.overview || `Watch ${movie.title} on Film Roulette. Instant streaming with zero ads.`;
    const posterUrl = getImageUrl(movie.backdrop_path || movie.poster_path, "original");

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "video.movie",
        images: posterUrl
          ? [
              {
                url: posterUrl,
                width: 1200,
                height: 630,
                alt: movie.title,
              },
            ]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: posterUrl ? [posterUrl] : [],
      },
    };
  } catch {
    return {
      title: "Film Roulette",
      description: "Set your filters, roll once, and get one film to watch tonight.",
    };
  }
}

export default async function MoviePage({ params }: PageProps) {
  const { id } = await params;

  const [genresResult, popularResult, movieResult] = await Promise.allSettled([
    getGenres("en-US"),
    getPopularMedia("all", "en-US", 18),
    getFullMovie(id, "en-US"),
  ]);

  const genres: Genre[] = genresResult.status === "fulfilled" ? genresResult.value : [];
  const popular: Movie[] = popularResult.status === "fulfilled" ? popularResult.value : [];
  const movie: Movie | null = movieResult.status === "fulfilled" ? movieResult.value : null;

  return (
    <>
      {movie && <MediaJsonLd media={movie} type="movie" />}
      <HomeContent genres={genres} popular={popular} initialMovie={movie || undefined} />
    </>
  );
}
