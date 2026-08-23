import { getGenres, getPopularMedia, getFullTV, Genre, Movie, getImageUrl } from "@/lib/tmdb";
import { HomeContent } from "@/components/HomeContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string; episode?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { season, episode } = await searchParams;

  try {
    const tv = await getFullTV(id, "en-US");
    if (!tv) {
      return {
        title: "Film Roulette",
        description: "Set your filters, roll once, and get one film to watch tonight.",
      };
    }

    const seasonNum = season ? parseInt(season, 10) : 1;
    const episodeNum = episode ? parseInt(episode, 10) : 1;
    const epSuffix = season && episode ? ` (S${seasonNum} E${episodeNum})` : "";

    const title = `${tv.title}${epSuffix} - Watch on Film Roulette`;
    const description = tv.overview || `Watch ${tv.title} on Film Roulette. Instant streaming with zero ads.`;
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

export default async function TVPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { season, episode } = await searchParams;

  const [genresResult, popularResult, tvResult] = await Promise.allSettled([
    getGenres("en-US"),
    getPopularMedia("all", "en-US", 18),
    getFullTV(id, "en-US"),
  ]);

  const genres: Genre[] = genresResult.status === "fulfilled" ? genresResult.value : [];
  const popular: Movie[] = popularResult.status === "fulfilled" ? popularResult.value : [];
  const tv: Movie | null = tvResult.status === "fulfilled" ? tvResult.value : null;

  const initialSeason = season ? parseInt(season, 10) : undefined;
  const initialEpisode = episode ? parseInt(episode, 10) : undefined;

  return (
    <HomeContent
      genres={genres}
      popular={popular}
      initialMovie={tv || undefined}
      initialSeason={initialSeason}
      initialEpisode={initialEpisode}
    />
  );
}
