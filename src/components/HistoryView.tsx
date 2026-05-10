"use client";

import Image from "next/image";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { getImageUrl, Movie } from "@/lib/tmdb";
import { motion } from "framer-motion";
import { Clock, Star, Calendar, Trash2 } from "lucide-react";

function MiniMovieCard({
  movie,
  index,
  onSelect,
}: {
  movie: Movie;
  index: number;
  onSelect: (movie: Movie) => void;
}) {
  const posterUrl = getImageUrl(movie.poster_path, "w185");
  const year = movie.release_date?.split("-")[0] || "—";

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      onClick={() => onSelect(movie)}
      className="w-full flex gap-3 p-3 bg-card hover:bg-muted/60 border border-border rounded-xl transition-all text-left group hover:shadow-md hover:border-primary/20"
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
            <Clock className="w-5 h-5" />
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
    </motion.button>
  );
}

export function HistoryView() {
  const { history, locale, setMovie, setActiveView } = useStore();
  const t = getTranslations(locale);

  const handleSelect = (movie: Movie) => {
    setMovie(movie);
    setActiveView("random");
  };

  return (
    <div aria-label="History View" className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-500 px-4 py-1.5 rounded-full text-sm font-medium mb-3">
          <Clock className="w-4 h-4" />
          <span>{t("history.title")}</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">{t("history.title")}</h2>
        <p className="text-muted-foreground mt-2">{t("history.subtitle")}</p>
      </div>

      {history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 px-6"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg">{t("history.empty")}</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {history.map((movie, i) => (
            <MiniMovieCard
              key={movie.id}
              movie={movie}
              index={i}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
