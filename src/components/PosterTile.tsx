"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { X, Tv, Film } from "lucide-react";
import { getImageUrl, Movie } from "@/lib/tmdb";

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
  const posterUrl = getImageUrl(movie.poster_path, "w185");
  const isTv = movie.media_type === "tv" || !!movie.number_of_seasons;
  const year = (isTv ? movie.first_air_date : movie.release_date)?.split("-")[0] || "—";

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
        className="poster relative w-full"
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

        {/* Small corner media badge */}
        <span className="absolute bottom-1 right-1 bg-ink-0/80 px-1 py-0.5 text-[9px] font-medium text-ink-8 backdrop-blur-sm">
          {isTv ? <Tv className="h-2.5 w-2.5 text-live inline mr-0.5" /> : <Film className="h-2.5 w-2.5 text-link inline mr-0.5" />}
        </span>
      </button>

      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(movie)}
          title={removeLabel}
          aria-label={`${removeLabel}: ${movie.title}`}
          className="absolute right-1 top-1 bg-ink-0/85 p-1 text-ink-7 opacity-0 transition-[opacity,color] duration-[120ms] hover:text-alert focus-visible:opacity-100 group-hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <p className="mt-2 truncate text-small text-ink-8">{movie.title}</p>
      <p className="flex items-center gap-2 text-label text-ink-6">
        <span data-num>{year}</span>
        {typeof movie.vote_average === "number" && movie.vote_average > 0 && (
          <span data-num className="text-live">
            {movie.vote_average.toFixed(1)}
          </span>
        )}
      </p>
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
