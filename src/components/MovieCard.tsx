"use client";

import Image from "next/image";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Calendar, Clock, Play, Globe, User, ExternalLink, Heart, Loader2, AlertCircle, Wifi } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import { ShareButton } from "./ShareButton";
import { getTranslations } from "@/lib/i18n";
import { useEffect, useRef, useState, useCallback } from "react";

// All servers ordered by reliability. No sandbox attribute — embed providers reject it.
const SOURCES = [
  { name: "VidLink",     url: (_imdbId: string, tmdbId: number) => `https://vidlink.pro/movie/${tmdbId}?primaryColor=d97706&secondaryColor=b45309&icons=vid&autoplay=true` },
  { name: "VidSrc",      url: (_imdbId: string, tmdbId: number) => `https://vidsrc.su/embed/movie/${tmdbId}` },
  { name: "2Embed",      url: (_imdbId: string, tmdbId: number) => `https://www.2embed.cc/embed/${tmdbId}` },
  { name: "MultiEmbed",  url: (imdbId: string, _tmdbId: number) => `https://multiembed.mov/?video_id=${imdbId}&tmdb=1` },
];

type PlayerState =
  | { phase: "idle" }
  | { phase: "searching"; tried: number }
  | { phase: "playing"; sourceIndex: number }
  | { phase: "error" };

export function MovieCard() {
  const {
    movie, isLoading, locale, toggleFavourite, isFavourite,
    showPlayer, setShowPlayer, showTrailer, setShowTrailer,
    watchProgress, setWatchProgress,
  } = useStore();

  const [playerState, setPlayerState] = useState<PlayerState>({ phase: "idle" });
  const [favAnim, setFavAnim] = useState(false);
  const [lastTime, setLastTime] = useState<number | null>(null);
  const t = getTranslations(locale);
  const playerRef = useRef<HTMLDivElement>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  const isFav = movie ? isFavourite(movie.id) : false;

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      abortRef.current = true;
    };
  }, []);

  // Reset everything when movie changes
  useEffect(() => {
    abortRef.current = true;
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    setPlayerState({ phase: "idle" });
    setLastTime(movie ? watchProgress[movie.id] || null : null);
    // Allow new searches after reset
    setTimeout(() => { abortRef.current = false; }, 50);
  }, [movie?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to player when it opens
  useEffect(() => {
    if ((showTrailer || playerState.phase !== "idle") && playerRef.current) {
      setTimeout(() => {
        playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [showTrailer, playerState.phase]);

  // Listen for postMessage progress events from embed providers
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data.type === "MEDIA_DATA" && data.progress && movie) {
          const currentTime = Math.floor(data.progress.time);
          if (currentTime > 0) setWatchProgress(movie.id, currentTime);
        }
      } catch {
        // ignore non-JSON messages
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [movie, setWatchProgress]);

  // ─── Auto-failover engine ──────────────────────────────────────────────────
  // Probes each source via the backend check-source API and loads the first
  // that responds ok. Falls back to trying them all sequentially if backend
  // checks all fail (since HEAD requests are often blocked by embed providers).
  const startAutoSearch = useCallback(async (imdbId: string, tmdbId: number) => {
    abortRef.current = false;
    setPlayerState({ phase: "searching", tried: 0 });

    // Build all URLs upfront
    const urls = SOURCES.map(s => s.url(imdbId, tmdbId));

    // Probe all sources in parallel via our backend (avoids CORS issues)
    const probeResults = await Promise.allSettled(
      urls.map((url) =>
        fetch(`/api/check-source?url=${encodeURIComponent(url)}`)
          .then(r => r.json())
          .then(data => ({ url, ok: !!data.ok }))
          .catch(() => ({ url, ok: false }))
      )
    );

    if (abortRef.current) return;

    // Find the first server that passed the backend check
    const passing = probeResults.findIndex(
      r => r.status === "fulfilled" && r.value.ok
    );

    if (passing !== -1) {
      setPlayerState({ phase: "playing", sourceIndex: passing });
      return;
    }

    // If all backend checks failed (HEAD requests often blocked),
    // just try server 0 directly — vidlink.pro is the most reliable
    setPlayerState({ phase: "playing", sourceIndex: 0 });
  }, []);

  const handleWatchMovie = () => {
    if (playerState.phase !== "idle") {
      // Toggle player off
      setShowPlayer(false);
      setPlayerState({ phase: "idle" });
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      return;
    }

    setShowTrailer(false);

    if (!movie?.imdb_id) {
      setPlayerState({ phase: "error" });
      return;
    }

    setShowPlayer(true);
    startAutoSearch(movie.imdb_id, movie.id);
  };

  // When iframe loads, send seek position if user was watching before
  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);

    if (movie && watchProgress[movie.id]) {
      const time = watchProgress[movie.id];
      const iframe = e.currentTarget;
      setTimeout(() => {
        iframe.contentWindow?.postMessage({ type: "seek", time }, "*");
        iframe.contentWindow?.postMessage({ command: "seek", time }, "*");
        iframe.contentWindow?.postMessage(JSON.stringify({ type: "seek", time }), "*");
      }, 2000);
    }
  };

  const handleToggleFavourite = () => {
    if (!movie) return;
    toggleFavourite(movie);
    setFavAnim(true);
    setTimeout(() => setFavAnim(false), 600);
  };

  if (isLoading || !movie) return null;

  const releaseYear = movie.release_date ? movie.release_date.split("-")[0] : t("movie.unknown");
  const runtimeText = movie.runtime
    ? t("movie.runtime", { h: Math.floor(movie.runtime / 60), m: movie.runtime % 60 })
    : null;
  const imdbUrl = movie.imdb_id ? `https://www.imdb.com/title/${movie.imdb_id}/` : null;

  const currentSourceIndex = playerState.phase === "playing" ? playerState.sourceIndex : 0;
  const currentPlayUrl = movie.imdb_id
    ? SOURCES[currentSourceIndex].url(movie.imdb_id, movie.id)
    : null;

  const isPlayerOpen = playerState.phase !== "idle";

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
                      <Heart className={`w-5 h-5 transition-all ${isFav ? "fill-current" : ""}`} />
                    </motion.button>
                  </div>
                  {movie.original_title !== movie.title && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {movie.original_title}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <div className="flex items-center gap-1.5 bg-yellow-500/15 text-yellow-500 px-3 py-1.5 rounded-full font-bold text-sm">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{movie.vote_average.toFixed(1)}</span>
                    <span className="text-[10px] opacity-70 font-normal">{t("rating.tmdb")}</span>
                  </div>
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
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all font-bold text-sm shadow-lg ${
                      isPlayerOpen
                        ? "bg-muted text-muted-foreground hover:bg-muted/80 shadow-none"
                        : "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/20"
                    }`}
                  >
                    {playerState.phase === "searching" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                    {isPlayerOpen ? t("menu.close") : t("movie.watchMovie")}
                  </button>
                )}
                {movie.trailer_key && (
                  <button
                    onClick={() => setShowTrailer(!showTrailer)}
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

        {/* Player / Trailer section */}
        <AnimatePresence>
          {(showTrailer || isPlayerOpen) && (
            <motion.div
              ref={playerRef}
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 24 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden bg-black rounded-2xl shadow-2xl border border-border"
            >
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>

                {/* ── Trailer ── */}
                {showTrailer && (
                  <iframe
                    src={`https://www.youtube.com/embed/${movie.trailer_key}?autoplay=1`}
                    title="Trailer"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                )}

                {/* ── Searching for stream ── */}
                {!showTrailer && playerState.phase === "searching" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#0a0a0f]">
                    <div className="relative flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full border-2 border-amber-500/20 animate-ping absolute" />
                      <div className="w-12 h-12 rounded-full border-2 border-amber-500/40 animate-ping absolute" style={{ animationDelay: "0.3s" }} />
                      <Wifi className="w-7 h-7 text-amber-400 relative z-10" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold text-sm">Finding best stream…</p>
                      <p className="text-white/40 text-xs mt-1">Checking available servers</p>
                    </div>
                  </div>
                )}

                {/* ── No stream found ── */}
                {!showTrailer && playerState.phase === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card p-6 text-center">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                    <p className="text-lg font-bold text-red-500">{t("errors.noSource")}</p>
                    <button
                      onClick={() => setPlayerState({ phase: "idle" })}
                      className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                    >
                      {t("menu.close")}
                    </button>
                  </div>
                )}

                {/* ── Playing ── */}
                {!showTrailer && playerState.phase === "playing" && currentPlayUrl && (
                  <iframe
                    key={`${movie.id}-${currentSourceIndex}`}
                    src={currentPlayUrl}
                    title="Movie Player"
                    onLoad={handleIframeLoad}
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full"
                  />
                )}
              </div>

              {/* Resume banner */}
              {!showTrailer && playerState.phase === "playing" && lastTime && lastTime > 10 && (
                <div className="px-5 py-3 bg-muted/30 border-t border-border flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">
                    Last watched at: {Math.floor(lastTime / 60)}:{(lastTime % 60).toString().padStart(2, "0")}
                  </span>
                  <span className="text-primary/70 animate-pulse font-medium">Resuming…</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
