"use client";

import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { Movie } from "@/lib/tmdb";
import { PosterTile, PosterWall, EmptyState } from "./PosterTile";
import { StageHeading } from "./StageHeading";

export function HistoryView() {
  const { history, locale, setMovie, setActiveView } = useStore();
  const t = getTranslations(locale);

  const handleSelect = (movie: Movie) => {
    setMovie(movie);
    setActiveView("random");
  };

  return (
    <section aria-label={t("history.title")} className="stage-pad pt-10 sm:pt-16">
      <StageHeading
        title={t("history.title")}
        subtitle={t("history.subtitle")}
        count={history.length}
      />

      {history.length === 0 ? (
        <EmptyState message={t("history.empty")} />
      ) : (
        <PosterWall>
          {history.map((movie, i) => (
            <PosterTile
              key={movie.id}
              movie={movie}
              index={i}
              onSelect={handleSelect}
            />
          ))}
        </PosterWall>
      )}
    </section>
  );
}
