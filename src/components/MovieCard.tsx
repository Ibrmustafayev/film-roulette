"use client";

import Image from "next/image";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, User, ExternalLink, Heart, Loader2,
  AlertCircle, RefreshCw, ChevronRight, X, Link2, Download, Check,
} from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import { getTranslations } from "@/lib/i18n";
import { useCallback, useEffect, useRef, useState } from "react";

// Modern working embed providers
const SOURCES = [
  {
    name: "Server 1 (VidLink)",
    url: (_: string, tmdbId: number) =>
      `https://vidlink.pro/movie/${tmdbId}?primaryColor=00e054&secondaryColor=0a5c25&icons=vid&autoplay=true`,
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

const EASE = [0.2, 0.8, 0.2, 1] as const;

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
  const [copied, setCopied] = useState(false);

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

  const ogUrl = `/api/og?title=${encodeURIComponent(movie.title)}&poster=${
    movie.poster_path ? encodeURIComponent(movie.poster_path) : ""
  }&rating=${movie.vote_average.toFixed(1)}&year=${releaseYear}&genres=${
    movie.genres
      ? encodeURIComponent(movie.genres.map((g) => g.name).join(", "))
      : ""
  }`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${ogUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard unavailable */
    }
  };

  /* The one authored moment: the result arriving. Stage children stagger in
     behind the poster; nothing else on the page has an entrance. */
  const step = (i: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.42, delay: i * 0.04, ease: EASE },
  });

  return (
    <AnimatePresence mode="wait">
      <article key={movie.id} className="stage-pad pt-10 sm:pt-16">
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-12">
          {/* Poster — columns 1–4 */}
          <motion.div {...step(0)} className="sm:col-span-4 lg:col-span-3">
            <div className="poster">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={movie.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 640px) 60vw, 260px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center p-3 text-center text-label uppercase tracking-[0.12em] text-ink-6">
                  {movie.title}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => toggleFavourite(movie)}
              aria-pressed={isFav}
              className={`ctl mt-3 w-full ${
                isFav
                  ? "border-flag-border bg-flag-subtle text-flag"
                  : "ctl-ghost"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isFav ? "fill-flag" : ""}`} />
              <span className="truncate">
                {isFav ? t("favourites.remove") : t("favourites.add")}
              </span>
            </button>
          </motion.div>

          {/* Detail — columns 5–12 */}
          <div className="sm:col-span-8 lg:col-span-9">
            <motion.header {...step(1)}>
              <h1 className="max-w-[16ch] text-title leading-[1.1] tracking-[-0.02em] text-ink-9 lg:text-display lg:leading-[1.02] lg:tracking-[-0.03em]">
                {movie.title}
              </h1>
              {movie.original_title !== movie.title && (
                <p className="mt-2 max-w-[40ch] font-prose text-h4 italic text-ink-6">
                  {movie.original_title}
                </p>
              )}
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-ink-7">
                <span data-num className="text-ink-8">
                  {releaseYear}
                </span>
                {runtimeText && (
                  <span data-num>{runtimeText}</span>
                )}
                <span className="inline-flex items-baseline gap-1.5">
                  <span data-num className="text-h4 text-live">
                    {movie.vote_average.toFixed(1)}
                  </span>
                  <span className="text-label uppercase tracking-[0.12em] text-ink-6">
                    {t("rating.tmdb")}
                  </span>
                </span>
                {imdbUrl && (
                  <a
                    href={imdbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-link transition-colors duration-[120ms] hover:text-link-hover"
                  >
                    {t("rating.imdb")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </p>
            </motion.header>

            {movie.genres && movie.genres.length > 0 && (
              <motion.ul {...step(2)} className="mt-5 flex flex-wrap gap-1.5">
                {movie.genres.map((g) => (
                  <li key={g.id} className="tag">
                    {t(`genres.${g.id}`)}
                  </li>
                ))}
              </motion.ul>
            )}

            <motion.p
              {...step(3)}
              className="mt-6 max-w-[68ch] font-prose text-[1.0625rem] leading-[1.65] text-ink-8"
            >
              {movie.overview || t("movie.noOverview")}
            </motion.p>

            <motion.div {...step(4)} className="mt-7 flex flex-wrap gap-2">
              {movie.imdb_id && (
                <button
                  type="button"
                  onClick={handleWatchMovie}
                  className={`ctl ${isPlayerOpen ? "ctl-ghost" : "ctl-live"}`}
                >
                  {phase.tag === "probing" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isPlayerOpen ? (
                    <X className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-current" />
                  )}
                  {isPlayerOpen ? t("menu.close") : t("movie.watchMovie")}
                </button>
              )}
              {movie.trailer_key && (
                <button
                  type="button"
                  onClick={() => setShowTrailer(!showTrailer)}
                  className="ctl ctl-ghost"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  {t("movie.watchTrailer")}
                </button>
              )}
              <button type="button" onClick={copyLink} className="ctl ctl-bare">
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-live" />
                ) : (
                  <Link2 className="h-3.5 w-3.5" />
                )}
                {copied ? t("share.copied") : t("share.copyLink")}
              </button>
              <a
                href={ogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ctl ctl-bare"
                title={t("share.download")}
              >
                <Download className="h-3.5 w-3.5" />
                <span className="sr-only">{t("share.download")}</span>
              </a>
            </motion.div>
          </div>
        </div>

        {/* Dense readout — the density counterweight to the open stage above */}
        <motion.div {...step(5)} className="mt-12 sm:grid sm:grid-cols-12">
          <div className="sm:col-span-9">
            <div className="stage-rule mb-4" />
            <table className="datatable">
              <tbody>
                <tr>
                  <th scope="row">{t("filters.year")}</th>
                  <td data-num>{releaseYear}</td>
                </tr>
                <tr>
                  <th scope="row">{t("filters.language")}</th>
                  <td className="uppercase">{movie.original_language}</td>
                </tr>
                <tr>
                  <th scope="row">{t("filters.rating")}</th>
                  <td>
                    <span data-num>{movie.vote_average.toFixed(1)}</span>
                    {movie.vote_count !== undefined && (
                      <span className="ml-2 text-ink-6">
                        <span data-num>{movie.vote_count.toLocaleString()}</span>{" "}
                        {t("movie.votes")}
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Cast */}
        {movie.cast && movie.cast.length > 0 && (
          <motion.section {...step(6)} className="mt-12">
            <h2 className="rail-heading mb-4 max-w-[42rem]">{t("movie.cast")}</h2>
            <ul className="flex gap-5 overflow-x-auto pb-2">
              {movie.cast.map((actor) => (
                <li key={actor.id} className="w-16 shrink-0">
                  <span className="relative block h-16 w-16 overflow-hidden rounded-full bg-ink-3">
                    {actor.profile_path ? (
                      <Image
                        src={getImageUrl(actor.profile_path, "w185")!}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-ink-6">
                        <User className="h-5 w-5" />
                      </span>
                    )}
                  </span>
                  <span className="mt-2 block text-label leading-tight text-ink-8">
                    {actor.name}
                  </span>
                  <span className="block text-label leading-tight text-ink-6">
                    {actor.character}
                  </span>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* Player — hard-cornered and ruled, so it never blends with the
            third-party iframe it hosts. */}
        <AnimatePresence>
          {(showTrailer || isPlayerOpen) && (
            <motion.section
              ref={playerRef}
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 48 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.24, ease: EASE }}
              className="scroll-mt-14 overflow-hidden border border-ink-4 bg-black"
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-ink-1">
                      <Loader2 className="h-5 w-5 animate-spin text-live" />
                      <div className="space-y-1.5 text-center">
                        <p className="text-small text-ink-8">
                          {t("movie.autoSearching")}
                        </p>
                        <p className="text-label uppercase tracking-[0.12em] text-ink-6">
                          {t("movie.testingServer", {
                            server: SOURCES[phase.sourceIndex].name,
                            current: phase.sourceIndex + 1,
                            total: SOURCES.length,
                          })}
                        </p>
                      </div>
                      <ol className="flex gap-1" aria-hidden="true">
                        {SOURCES.map((_, i) => (
                          <li
                            key={i}
                            className={`h-0.5 w-7 transition-colors duration-[240ms] ${
                              i < phase.sourceIndex
                                ? "bg-ink-5"
                                : i === phase.sourceIndex
                                  ? "bg-live"
                                  : "bg-ink-3"
                            }`}
                          />
                        ))}
                      </ol>
                    </div>
                  </>
                )}

                {!showTrailer && phase.tag === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink-1 p-6 text-center">
                    <AlertCircle className="h-6 w-6 text-alert" />
                    <div>
                      <p className="text-h4 text-ink-9">{t("errors.noSource")}</p>
                      <p className="mt-1 text-small text-ink-6">
                        {t("movie.allServersChecked", { total: SOURCES.length })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        abortRef.current = false;
                        trySource(0);
                      }}
                      className="ctl ctl-ghost"
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
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-4 bg-ink-2 px-4 py-2">
                  <span className="inline-flex items-center gap-2 text-label uppercase tracking-[0.12em] text-ink-6">
                    <span className="h-1.5 w-1.5 rounded-full bg-live" />
                    {t("movie.activeServer")}
                    <span className="text-ink-8" data-num>
                      {SOURCES[phase.sourceIndex].name}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleNextServerManual}
                    className="inline-flex items-center gap-1 text-label uppercase tracking-[0.12em] text-link transition-colors duration-[120ms] hover:text-link-hover"
                  >
                    {t("movie.nextServer")}
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}

              {!showTrailer &&
                phase.tag === "playing" &&
                lastTime &&
                lastTime > 10 && (
                  <div className="flex items-center justify-between border-t border-ink-4 bg-ink-2 px-4 py-1.5 text-label uppercase tracking-[0.12em] text-ink-6">
                    <span data-num>
                      {t("movie.lastWatched", {
                        time: `${Math.floor(lastTime / 60)}:${(lastTime % 60)
                          .toString()
                          .padStart(2, "0")}`,
                      })}
                    </span>
                    <span className="text-live">{t("movie.resuming")}</span>
                  </div>
                )}
            </motion.section>
          )}
        </AnimatePresence>
      </article>
    </AnimatePresence>
  );
}
