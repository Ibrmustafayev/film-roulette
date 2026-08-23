"use client";

import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { Movie, getMovieDetails, getTVDetails } from "@/lib/tmdb";
import { PosterTile, PosterWall, EmptyState } from "./PosterTile";
import { StageHeading } from "./StageHeading";
import { ContinueWatching } from "./WatchHistory";

export function HistoryView() {
  const { history, locale, setMovie, setActiveView, setIsLoading } = useStore();
  const t = getTranslations(locale);

  const handleSelect = async (movie: Movie) => {
    setActiveView("random");
    setIsLoading(true);
    try {
      const isTv = movie.media_type === "tv" || !!movie.number_of_seasons;
      const lang = locale === "az" ? "az-AZ" : locale === "ru" ? "ru-RU" : "en-US";
      const details = isTv
        ? await getTVDetails(movie.id, lang)
        : await getMovieDetails(movie.id, lang);
      setMovie({ ...movie, ...details });
    } catch {
      setMovie(movie);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section aria-label={t("history.title")} className="stage-pad pt-10 sm:pt-16">
      <StageHeading
        title={t("history.title")}
        subtitle={t("history.subtitle")}
        count={history.length}
      />

      {/* Continue Watching Section */}
      <ContinueWatching />

      <div className="mt-12">
        <h2 className="rail-heading mb-5">
          {locale === "az" ? "Bütün Baxış Tarixçəsi" : locale === "ru" ? "Вся история просмотров" : "All Watch History"}
        </h2>

        {history.length === 0 ? (
          <EmptyState message={t("history.empty")} />
        ) : (
          <PosterWall>
            {history.map((movie, i) => (
              <PosterTile
                key={`${movie.media_type || "item"}-${movie.id}`}
                movie={movie}
                index={i}
                onSelect={handleSelect}
              />
            ))}
          </PosterWall>
        )}
      </div>
    </section>
  );
}
