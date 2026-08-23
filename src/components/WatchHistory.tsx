"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Play, X, Clock, Trash2, Film, Tv } from "lucide-react";
import { getImageUrl, getMovieDetails, getTVDetails, Movie } from "@/lib/tmdb";
import {
  getWatchHistory,
  removeHistoryItem,
  clearHistory,
  formatTime,
  formatRemaining,
  WatchHistoryItem,
} from "@/lib/history";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";

export function ContinueWatching() {
  const [items, setItems] = useState<WatchHistoryItem[]>([]);
  const {
    setMovie,
    setIsLoading,
    locale,
    setSelectedSeason,
    setSelectedEpisode,
    setShowPlayer,
    setActiveView,
  } = useStore();
  const t = getTranslations(locale);

  const refreshHistory = () => {
    setItems(getWatchHistory());
  };

  useEffect(() => {
    refreshHistory();

    const handleUpdate = () => refreshHistory();
    window.addEventListener("film_roulette_history_updated", handleUpdate);
    return () => window.removeEventListener("film_roulette_history_updated", handleUpdate);
  }, []);

  if (items.length === 0) return null;

  const handleResume = async (item: WatchHistoryItem) => {
    setActiveView("random");
    setIsLoading(true);
    try {
      const isTv = item.mediaType === "tv";
      const lang = locale === "az" ? "az-AZ" : locale === "ru" ? "ru-RU" : "en-US";
      const details = isTv
        ? await getTVDetails(item.id, lang)
        : await getMovieDetails(item.id, lang);

      if (isTv && item.season) {
        setSelectedSeason(item.season);
        if (item.episode) {
          setSelectedEpisode(item.episode);
        }
      }

      setMovie(
        {
          id: item.id,
          title: item.title,
          poster_path: item.posterPath,
          backdrop_path: item.backdropPath,
          vote_average: 0,
          overview: "",
          ...details,
          media_type: item.mediaType,
        } as Movie,
        true
      );
      setShowPlayer(true);
    } catch (err) {
      console.error("Failed to load continue watching item:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mt-12 sm:mt-14" id="continue-watching-section">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-live" />
          <h2 className="rail-heading">
            {locale === "az" ? "İzləməyə Davam Et" : locale === "ru" ? "Продолжить просмотр" : "Continue Watching"}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => clearHistory()}
          title="Clear Watch History"
          className="inline-flex items-center gap-1 text-label uppercase tracking-wider text-ink-6 hover:text-alert transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          <span>{locale === "az" ? "Təmizlə" : locale === "ru" ? "Очистить" : "Clear"}</span>
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin">
        {items.map((item) => {
          const posterUrl = getImageUrl(item.backdropPath || item.posterPath, "w500");
          const isTv = item.mediaType === "tv";
          const remainingText = formatRemaining(item.currentTime, item.duration);

          return (
            <div
              key={`${item.mediaType}-${item.id}-s${item.season || 0}-e${item.episode || 0}`}
              onClick={() => handleResume(item)}
              className="group relative flex-none w-[220px] sm:w-[260px] border border-ink-4 bg-ink-2/90 overflow-hidden transition-all duration-200 hover:border-ink-6 cursor-pointer"
            >
              {/* Thumbnail with YouTube-Style Progress Bar */}
              <div
                onClick={() => handleResume(item)}
                className="relative aspect-video w-full cursor-pointer bg-ink-3 overflow-hidden"
              >
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="260px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-ink-6">
                    {item.title}
                  </div>
                )}

                {/* Play hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-live/90 text-black shadow-lg">
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Media Type Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-ink-0/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-ink-9 backdrop-blur-xs">
                  {isTv ? <Tv className="h-2.5 w-2.5 text-live" /> : <Film className="h-2.5 w-2.5 text-link" />}
                  <span>{isTv ? (item.season ? `S${item.season} E${item.episode}` : "TV") : "Movie"}</span>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeHistoryItem(item.id, item.season, item.episode);
                  }}
                  className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center bg-ink-0/80 text-ink-7 hover:text-alert backdrop-blur-xs transition-colors"
                  title="Remove from history"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* YouTube-Style Red/Accent Progress Bar at bottom of thumbnail */}
                <div className="absolute bottom-0 inset-x-0 h-1 bg-ink-4/80">
                  <div
                    className="h-full bg-live transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, item.progressPercent))}%` }}
                  />
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-3 flex items-center justify-between gap-2">
                <h3
                  onClick={() => handleResume(item)}
                  className="truncate text-xs font-medium text-ink-9 cursor-pointer hover:text-live transition-colors"
                  title={item.title}
                >
                  {item.title}
                </h3>
                <span className="text-[10px] uppercase tracking-wider text-live shrink-0 font-semibold">
                  {locale === "az" ? "Davam et" : locale === "ru" ? "Продолжить" : "Resume"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
