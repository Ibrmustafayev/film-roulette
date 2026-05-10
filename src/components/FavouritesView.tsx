"use client";

import Image from "next/image";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { getImageUrl, Movie } from "@/lib/tmdb";
import { motion } from "framer-motion";
import { Heart, Star, Calendar, HeartOff } from "lucide-react";

function FavouriteMovieCard({
  movie,
  index,
  onSelect,
  onRemove,
}: {
  movie: Movie;
  index: number;
  onSelect: (movie: Movie) => void;
  onRemove: (movie: Movie) => void;
}) {
  const posterUrl = getImageUrl(movie.poster_path, "w185");
  const year = movie.release_date?.split("-")[0] || "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="w-full flex gap-3 p-3 bg-card hover:bg-muted/60 border border-border rounded-xl transition-all text-left group hover:shadow-md hover:border-red-500/20"
    >
      <button
        onClick={() => onSelect(movie)}
        className="flex gap-3 flex-1 min-w-0 text-left"
      >
        <div className="w-14 h-20 shrink-0 rounded-lg overflow-hidden bg-muted border border-border relative">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Heart className="w-5 h-5" />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
            {movie.title}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {year}
            </span>
            <span className="text-xs text-yellow-500 flex items-center gap-1 font-medium">
              <Star className="w-3 h-3 fill-current" />
              {movie.vote_average?.toFixed(1)}
            </span>
          </div>
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {movie.genres.slice(0, 2).map((g) => (
                <span
                  key={g.id}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/8 text-primary/70 font-medium"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(movie);
        }}
        className="shrink-0 self-center p-2 hover:bg-red-500/10 rounded-lg transition-colors group/remove"
        title="Remove"
      >
        <HeartOff className="w-4 h-4 text-muted-foreground group-hover/remove:text-red-500 transition-colors" />
      </button>
    </motion.div>
  );
}

export function FavouritesView() {
  const { favourites, locale, setMovie, setActiveView, toggleFavourite } =
    useStore();
  const t = getTranslations(locale);

  const handleSelect = (movie: Movie) => {
    setMovie(movie);
    setActiveView("random");
  };

  return (
    <div aria-label="Favourites View" className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-1.5 rounded-full text-sm font-medium mb-3">
          <Heart className="w-4 h-4 fill-current" />
          <span>{t("favourites.title")}</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">
          {t("favourites.title")}
        </h2>
        <p className="text-muted-foreground mt-2">{t("favourites.subtitle")}</p>
      </div>

      {favourites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 px-6"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg">
            {t("favourites.empty")}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {favourites.map((movie, i) => (
            <FavouriteMovieCard
              key={movie.id}
              movie={movie}
              index={i}
              onSelect={handleSelect}
              onRemove={toggleFavourite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
