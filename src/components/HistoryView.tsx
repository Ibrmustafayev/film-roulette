"use client";

import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { Movie } from "@/lib/tmdb";
import { PosterTile, PosterWall, EmptyState } from "./PosterTile";

export function HistoryView() {
  const { history, locale, setMovie, setActiveView } = useStore();
  const t = getTranslations(locale);

  const handleSelect = (movie: Movie) => {
    setMovie(movie);
    setActiveView("random");
  };

  return (
    <section
      aria-label={t("history.title")}
      className="mx-auto w-full max-w-[960px] px-6 pt-10"
    >
      <h2 className="label-rule">
        {t("history.title")}
        {history.length > 0 && (
          <span className="font-serif text-body-sm tracking-normal" data-numeric>
            {history.length}
          </span>
        )}
      </h2>
      <p className="mb-6 font-serif text-body text-meta">
        {t("history.subtitle")}
      </p>

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
