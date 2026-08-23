"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { X, Tv, Film } from "lucide-react";
import { getImageUrl, Movie } from "@/lib/tmdb";
import { getMediaProgress, formatTime, WatchHistoryItem } from "@/lib/history";

const EASE = [0.2, 0.8, 0.2, 1] as const;

export function PosterTile({
  movie,
  index,
  onSelect,
  onRemove,
  removeLabel,
}: {
  movie: Movie;
  index: number;
  onSelect: (movie: Movie) => void;
  onRemove?: (movie: Movie) => void;
  removeLabel?: string;
}) {
  const [progress, setProgress] = useState<WatchHistoryItem | null>(null);

  const posterUrl = getImageUrl(movie.poster_path, "w185");
  const isTv = movie.media_type === "tv" || !!movie.number_of_seasons;
  const year = (isTv ? movie.first_air_date : movie.release_date)?.split("-")[0] || "—";

  useEffect(() => {
    const updateProgress = () => {
      const p = getMediaProgress(movie.id);
      setProgress(p);
    };

    updateProgress();
    window.addEventListener("film_roulette_history_updated", updateProgress);
    return () => window.removeEventListener("film_roulette_history_updated", updateProgress);
  }, [movie.id]);

  const hasProgress = !!(progress && progress.progressPercent > 0);

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      // Stagger caps out so a long wall does not crawl in.
      transition={{ delay: Math.min(index, 10) * 0.02, duration: 0.24, ease: EASE }}
      className="group relative"
    >
      <button
        type="button"
        onClick={() => onSelect(movie)}
        className="poster relative w-full overflow-hidden"
        aria-label={`${movie.title} (${year})`}
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 33vw, 150px"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center p-2 text-center text-label uppercase tracking-[0.12em] text-ink-6">
            {movie.title}
          </span>
        )}

        {/* Progress & Episode Badge (Top Left) */}
        {hasProgress && (
          <div className="pointer-events-none absolute top-1 left-1 z-30 flex items-center gap-1 bg-black/85 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 backdrop-blur-xs shadow-xs">
            <span>
              {progress.mediaType === "tv" && progress.season
                ? `S${progress.season} E${progress.episode}`
                : `${Math.round(progress.progressPercent)}%`}
            </span>
          </div>
        )}

        {/* Small corner media badge (Bottom Right) */}
        <span className="absolute bottom-2 right-1 z-20 bg-ink-0/85 px-1 py-0.5 text-[9px] font-medium text-ink-8 backdrop-blur-sm">
          {isTv ? <Tv className="h-2.5 w-2.5 text-live inline mr-0.5" /> : <Film className="h-2.5 w-2.5 text-link inline mr-0.5" />}
        </span>

        {/* YouTube-Style Emerald / Red Progress Bar at the bottom of the thumbnail */}
        {hasProgress && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/80 z-30 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress.progressPercent))}%` }}
            />
          </div>
        )}
      </button>

      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(movie)}
          title={removeLabel}
          aria-label={`${removeLabel}: ${movie.title}`}
          className="absolute right-1 top-1 z-30 bg-ink-0/85 p-1 text-ink-7 opacity-0 transition-[opacity,color] duration-[120ms] hover:text-alert focus-visible:opacity-100 group-hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <p className="mt-2 truncate text-small text-ink-8">{movie.title}</p>
      
      {/* Progress Timestamp Text */}
      {hasProgress ? (
        <p className="flex items-center justify-between text-[11px] text-emerald-400 font-medium">
          <span>{formatTime(progress.currentTime)} / {formatTime(progress.duration)}</span>
          <span className="text-ink-6 text-label">{year}</span>
        </p>
      ) : (
        <p className="flex items-center gap-2 text-label text-ink-6">
          <span data-num>{year}</span>
          {typeof movie.vote_average === "number" && movie.vote_average > 0 && (
            <span data-num className="text-live">
              {movie.vote_average.toFixed(1)}
            </span>
          )}
        </p>
      )}
    </motion.li>
  );
}

/** Fixed-width tracks, tight gutter — a wall, not a card grid. */
export function PosterWall({ children }: { children: React.ReactNode }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-x-3 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(132px,1fr))]">
      {children}
    </ul>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="max-w-[46ch] font-prose text-h4 leading-[1.5] text-ink-6">
      {message}
    </p>
  );
}
