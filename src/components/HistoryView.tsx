"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { Movie, getMovieDetails, getTVDetails } from "@/lib/tmdb";
import { PosterTile, PosterWall, EmptyState } from "./PosterTile";
import { StageHeading } from "./StageHeading";
import { ContinueWatching } from "./WatchHistory";
import { removeHistoryItem, clearHistory as clearLocalStorageHistory } from "@/lib/history";

export function HistoryView() {
  const { history, locale, setMovie, setActiveView, setIsLoading, removeFromHistory, clearHistory } = useStore();
  const [, setTick] = useState(0);
  const t = getTranslations(locale);

  useEffect(() => {
    const handleUpdate = () => setTick((prev) => prev + 1);
    window.addEventListener("film_roulette_history_updated", handleUpdate);
    return () => window.removeEventListener("film_roulette_history_updated", handleUpdate);
  }, []);

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

  const handleRemove = (movie: Movie) => {
    removeFromHistory(movie.id);
    removeHistoryItem(movie.id);
  };

  const handleClearAll = () => {
    clearHistory();
    clearLocalStorageHistory();
  };

  const removeLabel = locale === "az" ? "Tarixçədən sil" : locale === "ru" ? "Удалить из истории" : "Remove from history";

  return (
    <section aria-label={t("history.title")} className="stage-pad pt-10 sm:pt-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <StageHeading
          title={t("history.title")}
          subtitle={t("history.subtitle")}
          count={history.length}
        />

        {history.length > 0 && (
          <button
            type="button"
            id="clear-all-history-btn"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 border border-ink-4 bg-ink-2 px-3 py-1.5 text-xs text-ink-7 hover:border-alert hover:text-alert transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{locale === "az" ? "Tarixçəni Təmizlə" : locale === "ru" ? "Очистить историю" : "Clear All History"}</span>
          </button>
        )}
      </div>

      {/* Continue Watching Section */}
      <ContinueWatching />

      <div className="mt-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="rail-heading">
            {locale === "az" ? "Bütün Baxış Tarixçəsi" : locale === "ru" ? "Вся история просмотров" : "All Watch History"}
          </h2>
        </div>

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
                onRemove={handleRemove}
                removeLabel={removeLabel}
              />
            ))}
          </PosterWall>
        )}
      </div>
    </section>
  );
}
