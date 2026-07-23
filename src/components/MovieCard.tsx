"use client";

import Image from "next/image";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Calendar, Clock, Play, Globe, User,
  ExternalLink, Heart, Loader2, AlertCircle, RefreshCw, ChevronRight, Server
} from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import { ShareButton } from "./ShareButton";
import { getTranslations } from "@/lib/i18n";
import { useCallback, useEffect, useRef, useState } from "react";

// Modern working embed providers
const SOURCES = [
  {
    name: "Server 1 (VidLink - High Speed)",
    url: (_: string, tmdbId: number) =>
      `https://vidlink.pro/movie/${tmdbId}?primaryColor=d97706&secondaryColor=b45309&icons=vid&autoplay=true`,
  },
  {
    name: "Server 2 (VidSrc - Primary)",
    url: (_: string, tmdbId: number) =>
      `https://vidsrc.su/embed/movie/${tmdbId}`,
  },
  {
    name: "Server 3 (2Embed - Backup)",
    url: (_: string, tmdbId: number) =>
      `https://www.2embed.cc/embed/${tmdbId}`,
  },
  {
    name: "Server 4 (AutoEmbed - Fast)",
    url: (_: string, tmdbId: number) =>
      `https://player.autoembed.cc/embed/movie/${tmdbId}`,
  },
  {
    name: "Server 5 (MultiEmbed - Universal)",
    url: (imdbId: string, _: number) =>
      `https://multiembed.mov/?video_id=${imdbId}&tmdb=1`,
  },
  {
    name: "Server 6 (EmbedSu - Alternative)",
    url: (_: string, tmdbId: number) =>
      `https://embed.su/embed/movie/${tmdbId}`,
  },
];

type PlayerPhase =
  | { tag: "idle" }
  | { tag: "probing"; sourceIndex: number }
  | { tag: "playing"; sourceIndex: number }
  | { tag: "error" };

export function MovieCard() {
  const {
    movie, isLoading, locale,
    toggleFavourite, isFavourite,
    showPlayer, setShowPlayer,
    showTrailer, setShowTrailer,
    watchProgress, setWatchProgress,
  } = useStore();

  const [phase, setPhase] = useState<PlayerPhase>({ tag: "idle" });
  const [favAnim, setFavAnim] = useState(false);
  const [lastTime, setLastTime] = useState<number | null>(null);

  const t = getTranslations(locale);
  const playerRef = useRef<HTMLDivElement>(null);

  const probeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  const clearProbeTimer = useCallback(() => {
    if (probeTimerRef.current) {
      clearTimeout(probeTimerRef.current);
      probeTimerRef.current = null;
    }
  }, []);

  const stopPlayer = useCallback(() => {
    abortRef.current = true;
    clearProbeTimer();
    setPhase({ tag: "idle" });
    setShowPlayer(false);
  }, [clearProbeTimer, setShowPlayer]);

  useEffect(() => {
    stopPlayer();
    setLastTime(movie ? watchProgress[movie.id] || null : null);
    setTimeout(() => { abortRef.current = false; }, 0);
  }, [movie?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if ((showTrailer || phase.tag !== "idle") && playerRef.current) {
      setTimeout(() => {
        playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }, [showTrailer, phase.tag]);

  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      try {
        const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (d?.type === "MEDIA_DATA" && d?.progress && movie) {
          const time = Math.floor(d.progress.time);
          if (time > 0) setWatchProgress(movie.id, time);
        }
      } catch { /* ignore */ }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, [movie, setWatchProgress]);

  // Anti-ad-popup helper
  useEffect(() => {
    if (phase.tag !== "playing" && phase.tag !== "probing") return;
    const refocus = () => {
      setTimeout(() => window.focus(), 100);
    };
    window.addEventListener("blur", refocus);
    return () => window.removeEventListener("blur", refocus);
  }, [phase.tag]);

  const trySource = useCallback((index: number) => {
    if (abortRef.current) return;
    if (index >= SOURCES.length) {
      setPhase({ tag: "error" });
      return;
    }

    setPhase({ tag: "probing", sourceIndex: index });
    clearProbeTimer();

    // Give each server 5 seconds to load html or auto-switch
    probeTimerRef.current = setTimeout(() => {
      if (!abortRef.current) trySource(index + 1);
    }, 5500);
  }, [clearProbeTimer]);

  const handleWatchMovie = () => {
    if (phase.tag !== "idle") {
      stopPlayer();
      return;
    }
    if (!movie?.imdb_id) {
      setPhase({ tag: "error" });
      return;
    }

    abortRef.current = false;
    setShowTrailer(false);
    setShowPlayer(true);
    trySource(0);
  };

  const handleIframeLoad = useCallback((
    e: React.SyntheticEvent<HTMLIFrameElement>,
    sourceIndex: number,
  ) => {
    clearProbeTimer();
    if (!abortRef.current) {
      setPhase({ tag: "playing", sourceIndex });
    }

    if (movie && watchProgress[movie.id]) {
      const time = watchProgress[movie.id];
      const iframe = e.currentTarget;
      setTimeout(() => {
        iframe.contentWindow?.postMessage({ type: "seek", time }, "*");
        iframe.contentWindow?.postMessage({ command: "seek", time }, "*");
        iframe.contentWindow?.postMessage(JSON.stringify({ type: "seek", time }), "*");
      }, 2500);
    }
  }, [clearProbeTimer, movie, watchProgress]);

  const handleNextServerManual = () => {
    if (phase.tag === "playing" || phase.tag === "probing") {
      const nextIdx = (phase.sourceIndex + 1) % SOURCES.length;
      trySource(nextIdx);
    }
  };

  const handleToggleFavourite = () => {
    if (!movie) return;
    toggleFavourite(movie);
    setFavAnim(true);
    setTimeout(() => setFavAnim(false), 600);
  };

  if (isLoading || !movie) return null;

  const releaseYear = movie.release_date?.split("-")[0] ?? t("movie.unknown");
  const runtimeText = movie.runtime
    ? t("movie.runtime", { h: Math.floor(movie.runtime / 60), m: movie.runtime % 60 })
    : null;
  const imdbUrl = movie.imdb_id ? `https://www.imdb.com/title/${movie.imdb_id}/` : null;

  const activeSourceIndex =
    phase.tag === "probing" || phase.tag === "playing" ? phase.sourceIndex : 0;
  const currentPlayUrl = movie.imdb_id
    ? SOURCES[activeSourceIndex].url(movie.imdb_id, movie.id)
    : null;

  const isPlayerOpen = phase.tag !== "idle";
  const isFav = isFavourite(movie.id);

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
                fill priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 288px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
            </div>
          )}

          <div className="p-6 md:p-8 flex flex-col justify-between flex-1 min-w-0">
            <div>
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

              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />{releaseYear}
                </span>
                {runtimeText && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />{runtimeText}
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

              <p className="mt-4 text-muted-foreground leading-relaxed text-sm line-clamp-4">
                {movie.overview || t("movie.noOverview")}
              </p>

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
                              width={48} height={48}
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
                    {phase.tag === "probing" ? (
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

        {/* Player Section */}
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

                {showTrailer && (
                  <iframe
                    src={`https://www.youtube.com/embed/${movie.trailer_key}?autoplay=1`}
                    title="Trailer"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                )}

                {!showTrailer && phase.tag === "probing" && (
                  <>
                    <iframe
                      key={`probe-${movie.id}-${phase.sourceIndex}`}
                      src={currentPlayUrl!}
                      title="probe"
                      allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                      allowFullScreen
                      referrerPolicy="no-referrer"
                      onLoad={(e) => handleIframeLoad(e, phase.sourceIndex)}
                      className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                      aria-hidden
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[#08080f]">
                      <div className="relative flex items-center justify-center w-20 h-20">
                        <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping" />
                        <div className="absolute inset-2 rounded-full border-2 border-amber-500/30 animate-ping" style={{ animationDelay: "0.4s" }} />
                        <Loader2 className="w-8 h-8 text-amber-400 animate-spin relative z-10" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-white font-semibold text-sm">
                          Avtomatik server tapılır...
                        </p>
                        <p className="text-white/40 text-xs">
                          {SOURCES[phase.sourceIndex].name} test edilir ({phase.sourceIndex + 1}/{SOURCES.length})
                        </p>
                        <div className="flex justify-center gap-1.5 mt-3">
                          {SOURCES.map((_, i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                i < phase.sourceIndex
                                  ? "bg-red-500/60"
                                  : i === phase.sourceIndex
                                  ? "bg-amber-400 scale-125"
                                  : "bg-white/10"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {!showTrailer && phase.tag === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card p-6 text-center">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                    <div>
                      <p className="text-lg font-bold text-red-500">{t("errors.noSource")}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Bütün {SOURCES.length} server yoxlanıldı. Bu film üçün video tapılmadı.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        abortRef.current = false;
                        trySource(0);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600/15 text-amber-500 hover:bg-amber-600/25 text-sm font-semibold transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Yenidən cəhd et
                    </button>
                  </div>
                )}

                {!showTrailer && phase.tag === "playing" && currentPlayUrl && (
                  <iframe
                    key={`play-${movie.id}-${phase.sourceIndex}`}
                    src={currentPlayUrl}
                    title="Movie Player"
                    onLoad={(e) => handleIframeLoad(e, phase.sourceIndex)}
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full"
                  />
                )}
              </div>

              {/* Sub-bar for quiet status & optional manual next server fallback */}
              {!showTrailer && phase.tag === "playing" && (
                <div className="px-5 py-3 bg-muted/20 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Server className="w-3.5 h-3.5 text-amber-500" />
                    <span>Aktiv Server: <strong className="text-foreground">{SOURCES[phase.sourceIndex].name}</strong></span>
                  </div>
                  <button
                    onClick={handleNextServerManual}
                    className="flex items-center gap-1 text-amber-500 hover:text-amber-400 font-medium transition-colors"
                  >
                    <span>Növbəti serverə keç</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {!showTrailer && phase.tag === "playing" && lastTime && lastTime > 10 && (
                <div className="px-5 py-2.5 bg-muted/30 border-t border-border flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">
                    Son izlənilən vaxt: {Math.floor(lastTime / 60)}:{(lastTime % 60).toString().padStart(2, "0")}
                  </span>
                  <span className="text-primary/70 animate-pulse font-medium">Davam etdirilir…</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
