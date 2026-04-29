"use client";

import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Calendar, Clock, Play, Globe, User, ExternalLink } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import { ShareButton } from "./ShareButton";
import { getTranslations } from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";

export function MovieCard() {
  const { movie, isLoading, locale } = useStore();
  const [showTrailer, setShowTrailer] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const t = getTranslations(locale);
  const playerRef = useRef<HTMLDivElement>(null);

  // Scroll to player when trailer or movie starts
  useEffect(() => {
    if ((showTrailer || showPlayer) && playerRef.current) {
      setTimeout(() => {
        playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [showTrailer, showPlayer]);

  // Reset states when a new movie is loaded
  useEffect(() => {
    setShowTrailer(false);
    setShowPlayer(false);
  }, [movie?.id]);

  if (isLoading || !movie) return null;

  const posterUrl = getImageUrl(movie.poster_path, "w500");
  const backdropUrl = getImageUrl(movie.backdrop_path, "w780");
  const releaseYear = movie.release_date
    ? movie.release_date.split("-")[0]
    : t("movie.unknown");

  const runtimeText = movie.runtime
    ? t("movie.runtime", {
        h: Math.floor(movie.runtime / 60),
        m: movie.runtime % 60,
      })
    : null;

  const imdbUrl = movie.imdb_id
    ? `https://www.imdb.com/title/${movie.imdb_id}/`
    : null;

  const playUrl = movie.imdb_id
    ? `https://www.playimdb.com/title/${movie.imdb_id}/`
    : null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={movie.id}
        initial={{ opacity: 0, y: 60, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ type: "spring", stiffness: 180, damping: 22 }}
        className="w-full max-w-4xl mx-auto mt-12"
      >
        {/* Backdrop */}
        {backdropUrl && (
          <div className="relative w-full h-48 md:h-64 rounded-t-2xl overflow-hidden">
            <img src={backdropUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4">
              {movie.trailer_key && (
                <button
                  onClick={() => {
                    setShowTrailer(!showTrailer);
                    setShowPlayer(false);
                  }}
                  className="bg-red-600/90 hover:bg-red-600 text-white rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center shadow-2xl transition-transform hover:scale-110"
                  title={t("movie.watchTrailer")}
                >
                  <Play className="w-6 h-6 md:w-7 md:h-7 ml-1 fill-current" />
                </button>
              )}
              
              {playUrl && (
                <button
                  onClick={() => {
                    setShowPlayer(!showPlayer);
                    setShowTrailer(false);
                  }}
                  className="bg-amber-500/90 hover:bg-amber-500 text-white rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center shadow-2xl transition-transform hover:scale-110"
                  title={t("movie.watchMovie")}
                >
                  <ExternalLink className="w-6 h-6 md:w-7 md:h-7" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Trailer/Player Section */}
        <AnimatePresence>
          {(showTrailer || showPlayer) && (
            <motion.div
              ref={playerRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-black"
            >
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                {showTrailer ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${movie.trailer_key}?autoplay=1`}
                    title="Trailer"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  <iframe
                    src={playUrl!}
                    title="Movie Player"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts"
                    className="absolute inset-0 w-full h-full"
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card */}
        <div
          className={`bg-card text-card-foreground ${
            backdropUrl ? "rounded-b-2xl" : "rounded-2xl"
          } shadow-xl border border-border overflow-hidden flex flex-col md:flex-row`}
        >
          {posterUrl && (
            <div className="w-full md:w-72 shrink-0 relative">
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover md:min-h-[420px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
            </div>
          )}

          <div className="p-6 md:p-8 flex flex-col justify-between flex-1 min-w-0">
            <div>
              {/* Title + Rating */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-2xl md:text-3xl font-bold leading-tight truncate">
                    {movie.title}
                  </h2>
                  {movie.original_title !== movie.title && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {movie.original_title}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {/* TMDB Rating */}
                  <div className="flex items-center gap-1.5 bg-yellow-500/15 text-yellow-500 px-3 py-1.5 rounded-full font-bold text-sm">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{movie.vote_average.toFixed(1)}</span>
                    <span className="text-[10px] opacity-70 font-normal">{t("rating.tmdb")}</span>
                  </div>
                  {/* IMDB Link */}
                  {imdbUrl && (
                    <a
                      href={imdbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 bg-amber-600/15 text-amber-500 px-3 py-1 rounded-full text-xs font-semibold hover:bg-amber-600/25 transition-colors"
                    >
                      <span>{t("rating.imdb")}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {releaseYear}
                </span>
                {runtimeText && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {runtimeText}
                  </span>
                )}
                {movie.original_language && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    {movie.original_language.toUpperCase()}
                  </span>
                )}
                {movie.vote_count !== undefined && (
                  <span className="text-xs opacity-70">
                    ({movie.vote_count.toLocaleString()} {t("movie.votes")})
                  </span>
                )}
              </div>

              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {movie.genres.map((g) => (
                    <span
                      key={g.id}
                      className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"
                    >
                      {t(`genres.${g.id}`)}
                    </span>
                  ))}
                </div>
              )}

              {/* Overview */}
              <p className="mt-4 text-muted-foreground leading-relaxed text-sm line-clamp-4">
                {movie.overview || t("movie.noOverview")}
              </p>

              {/* Cast */}
              {movie.cast && movie.cast.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {t("movie.cast")}
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                    {movie.cast.map((actor) => (
                      <div key={actor.id} className="flex flex-col items-center shrink-0 w-16">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted border-2 border-border">
                          {actor.profile_path ? (
                            <img
                              src={getImageUrl(actor.profile_path, "w185")!}
                              alt={actor.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-center mt-1 font-medium leading-tight line-clamp-2">
                          {actor.name}
                        </span>
                        <span className="text-[9px] text-muted-foreground text-center leading-tight line-clamp-1">
                          {actor.character}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3">
              {playUrl && (
                <button
                  onClick={() => {
                    setShowPlayer(!showPlayer);
                    setShowTrailer(false);
                  }}
                  className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-xl transition-colors font-bold text-sm shadow-lg shadow-amber-900/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {t("movie.watchMovie")}
                </button>
              )}
              {movie.trailer_key && !backdropUrl && (
                <button
                  onClick={() => {
                    setShowTrailer(!showTrailer);
                    setShowPlayer(false);
                  }}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl transition-colors font-medium text-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {t("movie.watchTrailer")}
                </button>
              )}
              <ShareButton movie={movie} />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
