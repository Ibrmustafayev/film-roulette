"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star, X } from "lucide-react";
import { getImageUrl, Movie } from "@/lib/tmdb";

const EASE = [0.19, 1, 0.22, 1] as const;

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
  const year = movie.release_date?.split("-")[0] || "—";

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      // Stagger caps out so a long wall does not crawl in.
      transition={{ delay: Math.min(index, 12) * 0.025, duration: 0.333, ease: EASE }}
      className="group relative"
    >
      <button
        type="button"
        onClick={() => onSelect(movie)}
        className="poster w-full"
        aria-label={`${movie.title} (${year})`}
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 33vw, 125px"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center p-2 text-center text-tiny text-meta">
            {movie.title}
          </span>
        )}
      </button>

      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(movie)}
          title={removeLabel}
          aria-label={`${removeLabel}: ${movie.title}`}
          className="absolute right-1 top-1 rounded-full bg-bg/80 p-1 text-meta opacity-0 transition-[opacity,color] duration-150 hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="mt-1.5 space-y-0.5">
        <p className="truncate text-body-sm font-medium text-ink-high">
          {movie.title}
        </p>
        <p className="flex items-center gap-2 text-tiny text-meta">
          <span className="font-serif" data-numeric>
            {year}
          </span>
          {typeof movie.vote_average === "number" && movie.vote_average > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 fill-green-hover text-green-hover" />
              <span className="font-serif" data-numeric>
                {movie.vote_average.toFixed(1)}
              </span>
            </span>
          )}
        </p>
      </div>
    </motion.li>
  );
}

export function PosterWall({ children }: { children: React.ReactNode }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-x-[10px] gap-y-5 sm:grid-cols-[repeat(auto-fill,minmax(125px,1fr))]">
      {children}
    </ul>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-surface-alt px-6 py-16 text-center">
      <p className="font-serif text-body-lg text-meta">{message}</p>
    </div>
  );
}
