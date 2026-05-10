"use client";

import Image from "next/image";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Calendar, Clock, Play, Globe, User, ExternalLink, Heart, Loader2, AlertCircle } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import { ShareButton } from "./ShareButton";
import { getTranslations } from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";

const SOURCES = [
  { name: "Server 1", url: (imdbId: string, tmdbId: number) => `https://www.playimdb.com/title/${imdbId}/` },
  { name: "Server 2", url: (imdbId: string, tmdbId: number) => `https://vidsrc.to/embed/movie/${tmdbId}` },
  { name: "Server 3", url: (imdbId: string, tmdbId: number) => `https://vidsrc.me/embed/movie?imdb=${imdbId}` },
  { name: "Server 4", url: (imdbId: string, tmdbId: number) => `https://embed.su/embed/movie/${tmdbId}` },
];

export function MovieCard() {
  const { movie, isLoading, locale, toggleFavourite, isFavourite } = useStore();
  const [showTrailer, setShowTrailer] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedSource, setSelectedSource] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [sourceError, setSourceError] = useState(false);
  const [favAnim, setFavAnim] = useState(false);
  const t = getTranslations(locale);
  const playerRef = useRef<HTMLDivElement>(null);

  const isFav = movie ? isFavourite(movie.id) : false;

  // Scroll to player when trailer or movie starts
  useEffect(() => {
    if ((showTrailer || showPlayer || isChecking || sourceError) && playerRef.current) {
      setTimeout(() => {
        playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [showTrailer, showPlayer, isChecking, sourceError]);

  // Reset states when a new movie is loaded
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowTrailer(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowPlayer(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSource(0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsChecking(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSourceError(false);
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

  const currentPlayUrl = movie.imdb_id
    ? SOURCES[selectedSource].url(movie.imdb_id, movie.id)
    : null;

  const handleToggleFavourite = () => {
    toggleFavourite(movie);
    setFavAnim(true);
    setTimeout(() => setFavAnim(false), 600);
  };

  const handleWatchMovie = async () => {
    if (showPlayer) {
      setShowPlayer(false);
      return;
    }
    
    setShowTrailer(false);
    setSourceError(false);
    
    if (!movie.imdb_id) {
      setSourceError(true);
      return;
    }

    setIsChecking(true);

    for (let i = 0; i < SOURCES.length; i++) {
      const url = SOURCES[i].url(movie.imdb_id, movie.id);
      try {
        const res = await fetch(`/api/check-source?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (data.ok) {
          setSelectedSource(i);
          setShowPlayer(true);
          setIsChecking(false);
          return;
        }
      } catch (err) {
        console.error("Source check failed:", err);
      }
    }

    setIsChecking(false);
    setSourceError(true);
  };

  return (
    <AnimatePresence mode="wait">
      <label className="hidden">Movie</label>
      <motion.div
        aria-label="Movie Card"
        key={movie.id}
        initial={{ opacity: 0, y: 60, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ type: "spring", stiffness: 180, damping: 22 }}
        className="w-full max-w-4xl mx-auto mt-12"
      >
        {/* Card */}
        <div className="bg-card text-card-foreground rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col md:flex-row">
          {movie.poster_path && (
            <div className="w-full md:w-72 shrink-0 relative min-h-[420px] bg-muted">
              <Image
                src={getImageUrl(movie.poster_path, "w500")!}
                alt={movie.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 288px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
            </div>
          )}

          <div className="p-6 md:p-8 flex flex-col justify-between flex-1 min-w-0">
            <div>
              {/* Title + Rating + Favourite */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl md:text-3xl font-bold leading-tight truncate">
                      {movie.title}
                    </h2>
                    {/* Favourite Button */}
                    <motion.button
                      onClick={handleToggleFavourite}
                      animate={favAnim ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.4 }}
                      className={`shrink-0 p-2 rounded-full transition-all ${
                        isFav
                          ? "bg-red-500/15 text-red-500 hover:bg-red-500/25"
                          : "bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                      }`}
                      title={isFav ? t("favourites.remove") : t("favourites.add")}
                    >
                      <Heart
                        className={`w-5 h-5 transition-all ${isFav ? "fill-current" : ""}`}
                      />
                    </motion.button>
                  </div>
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
                            <Image
                              src={getImageUrl(actor.profile_path, "w185")!}
                              alt={actor.name}
                              width={48}
                              height={48}
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
              <div className="flex gap-3">
                {movie.imdb_id && (
                  <button
                    onClick={handleWatchMovie}
                    disabled={isChecking}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-colors font-bold text-sm shadow-lg shadow-amber-900/20"
                  >
                    {isChecking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                    {t("movie.watchMovie")}
                  </button>
                )}
                {movie.trailer_key && (
                  <button
                    onClick={() => {
                      setShowTrailer(!showTrailer);
                      setShowPlayer(false);
                      setSourceError(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl transition-colors font-bold text-sm shadow-lg shadow-red-900/20"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {t("movie.watchTrailer")}
                  </button>
                )}
              </div>
              <ShareButton movie={movie} />
            </div>
          </div>
        </div>

        {/* Trailer/Player Section - NOW BELOW THE CARD */}
        <AnimatePresence>
          {(showTrailer || showPlayer || isChecking || sourceError) && (
            <motion.div
              ref={playerRef}
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 24 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden bg-black rounded-2xl shadow-2xl border border-border"
            >
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                {isChecking ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm font-medium animate-pulse">{t("errors.checking")}</p>
                  </div>
                ) : sourceError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card p-6 text-center">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                    <p className="text-lg font-bold text-red-500">{t("errors.noSource")}</p>
                    <button 
                      onClick={() => setSourceError(false)}
                      className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                    >
                      {t("menu.close")}
                    </button>
                  </div>
                ) : showTrailer ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${movie.trailer_key}?autoplay=1`}
                    title="Trailer"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                ) : showPlayer ? (
                  <iframe
                    src={currentPlayUrl!}
                    title="Movie Player"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts"
                    className="absolute inset-0 w-full h-full"
                  />
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
