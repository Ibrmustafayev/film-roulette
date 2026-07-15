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
  { name: "Server 1", url: (_imdbId: string, tmdbId: number) => `https://vidlink.pro/movie/${tmdbId}?primaryColor=d97706&secondaryColor=b45309&icons=vid` },
  { name: "Server 2", url: (_imdbId: string, tmdbId: number) => `https://vidsrc.su/embed/movie/${tmdbId}` },
  { name: "Server 3", url: (_imdbId: string, tmdbId: number) => `https://www.2embed.cc/embed/${tmdbId}` },
  { name: "Server 4", url: (imdbId: string, _tmdbId: number) => `https://multiembed.mov/?video_id=${imdbId}&tmdb=1` },
];

export function MovieCard() {
  const { 
    movie, isLoading, locale, toggleFavourite, isFavourite, 
    showPlayer, setShowPlayer, showTrailer, setShowTrailer,
    watchProgress, setWatchProgress
  } = useStore();
  const [selectedSource, setSelectedSource] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [sourceError, setSourceError] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [iframeSlow, setIframeSlow] = useState(false);
  const [favAnim, setFavAnim] = useState(false);
  const [lastTime, setLastTime] = useState<number | null>(null);
  const t = getTranslations(locale);
  const playerRef = useRef<HTMLDivElement>(null);
  const iframeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFav = movie ? isFavourite(movie.id) : false;

  // Scroll to player when trailer or movie starts
  useEffect(() => {
    if ((showTrailer || showPlayer || isChecking || sourceError) && playerRef.current) {
      setTimeout(() => {
        playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [showTrailer, showPlayer, isChecking, sourceError]);

  // Reset sources and errors when a new movie is loaded
  useEffect(() => {
    setSelectedSource(0);
    setIsChecking(false);
    setSourceError(false);
    setIframeLoading(false);
    setIframeSlow(false);
    setLastTime(movie ? watchProgress[movie.id] || null : null);
  }, [movie?.id, watchProgress]);

  // When source changes, reset slow-load warning
  useEffect(() => {
    if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);
    setIframeSlow(false);
    if (showPlayer) {
      setIframeLoading(true);
      // Show "try next server" hint after 10 seconds of loading
      iframeTimeoutRef.current = setTimeout(() => setIframeSlow(true), 10000);
    }
    return () => {
      if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);
    };
  }, [selectedSource, showPlayer]);

  // Listen for progress from player (vidsrc support)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: we should ideally check event.origin, but these embeds use various subdomains
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // vidsrc specific progress event
        if (data.type === 'MEDIA_DATA' && data.progress && movie) {
          const currentTime = Math.floor(data.progress.time);
          if (currentTime > 0) {
            setWatchProgress(movie.id, currentTime);
          }
        }
      } catch (e) {
        // Not JSON or irrelevant message
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [movie, setWatchProgress]);

  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    // Clear the slow-load timeout — it loaded
    if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);
    setIframeLoading(false);
    setIframeSlow(false);

    if (movie && watchProgress[movie.id]) {
      const time = watchProgress[movie.id];
      const iframe = e.currentTarget;
      setTimeout(() => {
        iframe.contentWindow?.postMessage({ type: 'seek', time: time }, '*');
        iframe.contentWindow?.postMessage({ command: 'seek', time: time }, '*');
        iframe.contentWindow?.postMessage(JSON.stringify({ type: 'seek', time: time }), '*');
      }, 2000);
    }
  };

  const handleTryNextSource = () => {
    const next = (selectedSource + 1) % SOURCES.length;
    setSelectedSource(next);
    setIframeSlow(false);
  };

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

  const handleWatchMovie = () => {
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

    setShowPlayer(true);
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
                  <>
                    <iframe
                      key={`${movie.id}-${selectedSource}`}
                      src={currentPlayUrl!}
                      title="Movie Player"
                      onLoad={handleIframeLoad}
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                      sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-popups"
                      className="absolute inset-0 w-full h-full"
                    />
                    {/* Initial loading overlay — disappears once iframe fires onLoad */}
                    {iframeLoading && !iframeSlow && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 backdrop-blur-sm pointer-events-none">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                        <p className="text-xs text-white/60 font-medium">Loading {SOURCES[selectedSource].name}...</p>
                      </div>
                    )}
                    {/* Slow-load overlay: shown after 10s without a load event */}
                    {iframeSlow && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 shadow-xl">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <p className="text-xs text-white/80 whitespace-nowrap">This server seems slow.</p>
                        <button
                          onClick={handleTryNextSource}
                          className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap underline underline-offset-2"
                        >
                          Try Next Server →
                        </button>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
              {showPlayer && (
                <div className="px-5 py-4 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {t("movie.changeSource")}
                      </p>
                      <p className="text-xs text-muted-foreground/80 mt-0.5">
                        {selectedSource === 0 ? "Server 1 (Default)" : `Server ${selectedSource + 1}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {SOURCES.map((src, index) => {
                      const isActive = selectedSource === index;
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedSource(index)}
                          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                            isActive
                              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                              : "bg-muted/40 hover:bg-muted/65 text-muted-foreground hover:text-foreground border-border/40"
                          }`}
                        >
                          {src.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {lastTime && lastTime > 10 && (
                <div className="px-5 py-3 bg-muted/30 border-t border-border flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">
                    Last watched at: {Math.floor(lastTime / 60)}:{(lastTime % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="text-primary/70 animate-pulse font-medium">Resuming...</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
