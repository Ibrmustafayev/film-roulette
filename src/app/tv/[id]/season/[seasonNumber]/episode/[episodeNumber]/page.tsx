import { getGenres, getPopularMedia, getFullTV, Genre, Movie, getImageUrl } from "@/lib/tmdb";
import { HomeContent } from "@/components/HomeContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    id: string;
    seasonNumber: string;
    episodeNumber: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, seasonNumber, episodeNumber } = await params;

  try {
    const tv = await getFullTV(id, "en-US");
    if (!tv) {
      return {
        title: "Film Roulette",
        description: "Set your filters, roll once, and get one film to watch tonight.",
      };
    }

    const title = `${tv.title} (S${seasonNumber} E${episodeNumber}) - Watch on Film Roulette`;
    const description = tv.overview || `Watch ${tv.title} Season ${seasonNumber} Episode ${episodeNumber} on Film Roulette. Instant streaming with zero ads.`;
    const posterUrl = getImageUrl(tv.backdrop_path || tv.poster_path, "original");

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "video.tv_show",
        images: posterUrl
          ? [
              {
                url: posterUrl,
                width: 1200,
                height: 630,
                alt: tv.title,
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

export default async function TVEpisodePage({ params }: PageProps) {
  const { id, seasonNumber, episodeNumber } = await params;

  const [genresResult, popularResult, tvResult] = await Promise.allSettled([
    getGenres("en-US"),
    getPopularMedia("all", "en-US", 18),
    getFullTV(id, "en-US"),
  ]);

  const genres: Genre[] = genresResult.status === "fulfilled" ? genresResult.value : [];
  const popular: Movie[] = popularResult.status === "fulfilled" ? popularResult.value : [];
  const tv: Movie | null = tvResult.status === "fulfilled" ? tvResult.value : null;

  const sNum = parseInt(seasonNumber, 10);
  const eNum = parseInt(episodeNumber, 10);

  return (
    <HomeContent
      genres={genres}
      popular={popular}
      initialMovie={tv || undefined}
      initialSeason={!isNaN(sNum) ? sNum : 1}
      initialEpisode={!isNaN(eNum) ? eNum : 1}
    />
  );
}
