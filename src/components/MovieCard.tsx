"use client";

import Image from "next/image";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Play, User, ExternalLink, Heart, Loader2,
  AlertCircle, RefreshCw, ChevronRight, Server, X,
} from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import { ShareButton } from "./ShareButton";
import { getTranslations } from "@/lib/i18n";
import { useCallback, useEffect, useRef, useState } from "react";

// Modern working embed providers
const SOURCES = [
  {
    name: "Server 1 (VidLink)",
    url: (_: string, tmdbId: number) =>
      `https://vidlink.pro/movie/${tmdbId}?primaryColor=00e054&secondaryColor=00ac1c&icons=vid&autoplay=true`,
  },
  {
    name: "Server 2 (VidSrc)",
    url: (_: string, tmdbId: number) => `https://vidsrc.su/embed/movie/${tmdbId}`,
  },
  {
    name: "Server 3 (2Embed)",
    url: (_: string, tmdbId: number) => `https://www.2embed.cc/embed/${tmdbId}`,
  },
  {
    name: "Server 4 (AutoEmbed)",
    url: (_: string, tmdbId: number) =>
      `https://player.autoembed.cc/embed/movie/${tmdbId}`,
  },
  {
    name: "Server 5 (MultiEmbed)",
    url: (imdbId: string, _: number) =>
      `https://multiembed.mov/?video_id=${imdbId}&tmdb=1`,
  },
  {
    name: "Server 6 (EmbedSu)",
    url: (_: string, tmdbId: number) => `https://embed.su/embed/movie/${tmdbId}`,
  },
];

type PlayerPhase =
  | { tag: "idle" }
  | { tag: "probing"; sourceIndex: number }
  | { tag: "playing"; sourceIndex: number }
  | { tag: "error" };

const EASE = [0.19, 1, 0.22, 1] as const;

export function MovieCard() {
  const {
    movie, isLoading, locale,
    toggleFavourite, isFavourite,
    showPlayer, setShowPlayer,
    showTrailer, setShowTrailer,
    watchProgress, setWatchProgress,
  } = useStore();

  const [phase, setPhase] = useState<PlayerPhase>({ tag: "idle" });
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
    setTimeout(() => {
      abortRef.current = false;
    }, 0);
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
      } catch {
        /* ignore */
      }
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

  const trySource = useCallback(
    (index: number) => {
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
    },
    [clearProbeTimer]
  );

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

  const handleIframeLoad = useCallback(
    (e: React.SyntheticEvent<HTMLIFrameElement>, sourceIndex: number) => {
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
          iframe.contentWindow?.postMessage(
            JSON.stringify({ type: "seek", time }),
            "*"
          );
        }, 2500);
      }
    },
    [clearProbeTimer, movie, watchProgress]
  );

  const handleNextServerManual = () => {
    if (phase.tag === "playing" || phase.tag === "probing") {
      const nextIdx = (phase.sourceIndex + 1) % SOURCES.length;
      trySource(nextIdx);
    }
  };

  if (isLoading || !movie) return null;

  const releaseYear = movie.release_date?.split("-")[0] ?? t("movie.unknown");
  const runtimeText = movie.runtime
    ? t("movie.runtime", {
        h: Math.floor(movie.runtime / 60),
        m: movie.runtime % 60,
      })
    : null;
  const imdbUrl = movie.imdb_id
    ? `https://www.imdb.com/title/${movie.imdb_id}/`
    : null;

  const activeSourceIndex =
    phase.tag === "probing" || phase.tag === "playing" ? phase.sourceIndex : 0;
  const currentPlayUrl = movie.imdb_id
    ? SOURCES[activeSourceIndex].url(movie.imdb_id, movie.id)
    : null;

  const isPlayerOpen = phase.tag !== "idle";
  const isFav = isFavourite(movie.id);
  const posterUrl = getImageUrl(movie.poster_path, "w500");

  return (
    <AnimatePresence mode="wait">
      <motion.article
        key={movie.id}
        aria-label={movie.title}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mx-auto w-full max-w-[960px] px-6 pb-12"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mx-auto w-[180px] shrink-0 sm:mx-0 sm:w-[230px]"
          >
            <div className="poster">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={movie.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 640px) 180px, 230px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center p-3 text-center text-tiny text-meta">
                  {movie.title}
                </span>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => toggleFavourite(movie)}
                aria-pressed={isFav}
                className={`btn flex-1 ${isFav ? "btn-default" : "btn-quiet"}`}
                title={isFav ? t("favourites.remove") : t("favourites.add")}
              >
                <Heart
                  className={`h-4 w-4 ${isFav ? "fill-orange text-orange" : ""}`}
                />
                <span className="truncate">
                  {isFav ? t("favourites.remove") : t("favourites.add")}
                </span>
              </button>
            </div>
          </motion.div>

          {/* Detail */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06, ease: EASE }}
            className="min-w-0 flex-1"
          >
            <h2 className="text-h3 font-semibold leading-[1.15] text-heading sm:text-h2">
              {movie.title}{" "}
              <span
                className="font-serif text-h4 font-normal text-meta"
                data-numeric
              >
                {releaseYear}
              </span>
            </h2>

            {movie.original_title !== movie.title && (
              <p className="mt-1 truncate font-serif text-body-sm italic text-meta">
                {movie.original_title}
              </p>
            )}

            {/* Metadata row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-meta">
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-green-hover text-green-hover" />
                <span
                  className="font-serif text-body-lg font-semibold text-ink-higher"
                  data-numeric
                >
                  {movie.vote_average.toFixed(1)}
                </span>
                <span className="text-tiny uppercase tracking-[0.075em]">
                  {t("rating.tmdb")}
                </span>
              </span>

              {movie.vote_count !== undefined && (
                <span className="text-tiny" data-numeric>
                  {movie.vote_count.toLocaleString()} {t("movie.votes")}
                </span>
              )}

              {runtimeText && (
                <span className="text-body-sm" data-numeric>
                  {runtimeText}
                </span>
              )}

              {movie.original_language && (
                <span className="text-body-sm uppercase">
                  {movie.original_language}
                </span>
              )}

              {imdbUrl && (
                <a
                  href={imdbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-body-sm text-blue transition-colors hover:text-blue-surface"
                >
                  {t("rating.imdb")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-x-1 gap-y-1.5">
                {movie.genres.map((g) => (
                  <li key={g.id} className="chip">
                    {t(`genres.${g.id}`)}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-5 max-w-[68ch] font-serif text-[16px] leading-[1.667] text-ink-high">
              {movie.overview || t("movie.noOverview")}
            </p>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-2">
              {movie.imdb_id && (
                <button
                  type="button"
                  onClick={handleWatchMovie}
                  className={`btn ${isPlayerOpen ? "btn-default" : "btn-primary"}`}
                >
                  {phase.tag === "probing" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPlayerOpen ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 fill-current" />
                  )}
                  {isPlayerOpen ? t("menu.close") : t("movie.watchMovie")}
                </button>
              )}
              {movie.trailer_key && (
                <button
                  type="button"
                  onClick={() => setShowTrailer(!showTrailer)}
                  className="btn btn-default"
                >
                  <Play className="h-4 w-4 fill-current" />
                  {t("movie.watchTrailer")}
                </button>
              )}
              <ShareButton movie={movie} />
            </div>

            {/* Cast */}
            {movie.cast && movie.cast.length > 0 && (
              <section className="mt-8">
                <h3 className="label-rule">{t("movie.cast")}</h3>
                <ul className="flex gap-4 overflow-x-auto pb-2">
                  {movie.cast.map((actor) => (
                    <li
                      key={actor.id}
                      className="flex w-16 shrink-0 flex-col items-center text-center"
                    >
                      <span className="relative block h-14 w-14 overflow-hidden rounded-full bg-poster-inset">
                        {actor.profile_path ? (
                          <Image
                            src={getImageUrl(actor.profile_path, "w185")!}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-meta">
                            <User className="h-5 w-5" />
                          </span>
                        )}
                      </span>
                      <span className="mt-1.5 text-tiny font-medium leading-tight text-ink-high">
                        {actor.name}
                      </span>
                      <span className="text-tiny leading-tight text-meta">
                        {actor.character}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </motion.div>
        </div>

        {/* Player — fenced off from the third-party iframe it hosts. */}
        <AnimatePresence>
          {(showTrailer || isPlayerOpen) && (
            <motion.section
              ref={playerRef}
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 32 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.333, ease: EASE }}
              className="scroll-mt-[72px] overflow-hidden rounded-panel border border-surface-alt bg-black"
            >
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                {showTrailer && (
                  <iframe
                    src={`https://www.youtube.com/embed/${movie.trailer_key}?autoplay=1`}
                    title="Trailer"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
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
                      className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
                      aria-hidden
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg">
                      <Loader2 className="h-6 w-6 animate-spin text-green" />
                      <div className="space-y-1 text-center">
                        <p className="text-body-sm text-ink-high">
                          {t("movie.autoSearching")}
                        </p>
                        <p className="text-tiny text-meta">
                          {t("movie.testingServer", {
                            server: SOURCES[phase.sourceIndex].name,
                            current: phase.sourceIndex + 1,
                            total: SOURCES.length,
                          })}
                        </p>
                      </div>
                      {/* Progress through the failover chain */}
                      <ol className="flex gap-1" aria-hidden="true">
                        {SOURCES.map((_, i) => (
                          <li
                            key={i}
                            className={`h-[3px] w-6 rounded-full transition-colors duration-300 ${
                              i < phase.sourceIndex
                                ? "bg-meta-low"
                                : i === phase.sourceIndex
                                  ? "bg-green"
                                  : "bg-surface"
                            }`}
                          />
                        ))}
                      </ol>
                    </div>
                  </>
                )}

                {!showTrailer && phase.tag === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-danger" />
                    <div>
                      <p className="text-h5 font-semibold text-heading">
                        {t("errors.noSource")}
                      </p>
                      <p className="mt-1 text-body-sm text-meta">
                        {t("movie.allServersChecked", { total: SOURCES.length })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        abortRef.current = false;
                        trySource(0);
                      }}
                      className="btn btn-default"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {t("movie.retry")}
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
                    className="absolute inset-0 h-full w-full"
                  />
                )}
              </div>

              {!showTrailer && phase.tag === "playing" && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-alt bg-surface px-4 py-2.5 text-tiny">
                  <span className="inline-flex items-center gap-2 text-meta">
                    <Server className="h-3.5 w-3.5 text-green" />
                    {t("movie.activeServer")}{" "}
                    <strong className="font-medium text-ink-high">
                      {SOURCES[phase.sourceIndex].name}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleNextServerManual}
                    className="inline-flex items-center gap-1 text-blue transition-colors hover:text-blue-surface"
                  >
                    {t("movie.nextServer")}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {!showTrailer &&
                phase.tag === "playing" &&
                lastTime &&
                lastTime > 10 && (
                  <div className="flex items-center justify-between border-t border-surface-alt bg-surface px-4 py-2 text-tiny text-meta">
                    <span data-numeric>
                      {t("movie.lastWatched", {
                        time: `${Math.floor(lastTime / 60)}:${(lastTime % 60)
                          .toString()
                          .padStart(2, "0")}`,
                      })}
                    </span>
                    <span className="text-green">{t("movie.resuming")}</span>
                  </div>
                )}
            </motion.section>
          )}
        </AnimatePresence>
      </motion.article>
    </AnimatePresence>
  );
}
