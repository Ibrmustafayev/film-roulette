"use client";

import Image from "next/image";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, User, ExternalLink, Heart, Loader2,
  AlertCircle, RefreshCw, ChevronRight, X, Link2, Download, Check,
  Tv, Film, ListFilter,
} from "lucide-react";
import { getImageUrl, getSeasonDetails, SeasonDetails } from "@/lib/tmdb";
import { getTranslations } from "@/lib/i18n";
import { resolveStreamSources } from "@/lib/providers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
    selectedSeason, setSelectedSeason,
    selectedEpisode, setSelectedEpisode,
    seasonCache, setSeasonDetails,
    isLoadingSeason, setIsLoadingSeason,
  } = useStore();

  const [phase, setPhase] = useState<PlayerPhase>({ tag: "idle" });
  const [lastTime, setLastTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const t = getTranslations(locale);
  const playerRef = useRef<HTMLDivElement>(null);

  const isTv = movie?.media_type === "tv" || !!movie?.number_of_seasons;

  const currentEpisodeKey = useMemo(() => {
    if (!movie) return "";
    return isTv ? `${movie.id}_s${selectedSeason}_e${selectedEpisode}` : `${movie.id}`;
  }, [movie, isTv, selectedSeason, selectedEpisode]);

  const sources = useMemo(() => {
    if (!movie) return [];
    return resolveStreamSources({
      tmdbId: movie.id,
      imdbId: movie.imdb_id,
      mediaType: isTv ? "tv" : "movie",
      season: selectedSeason,
      episode: selectedEpisode,
    });
  }, [movie, isTv, selectedSeason, selectedEpisode]);

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

  // Fetch season breakdown when a TV show or season changes
  useEffect(() => {
    if (!movie || !isTv) return;

    const cacheKey = `${movie.id}_${selectedSeason}`;
    if (seasonCache[cacheKey]) return;

    let isMounted = true;
    setIsLoadingSeason(true);

    getSeasonDetails(movie.id, selectedSeason, locale === "az" ? "az-AZ" : locale === "ru" ? "ru-RU" : "en-US")
      .then((details: SeasonDetails) => {
        if (isMounted) {
          setSeasonDetails(movie.id, selectedSeason, details);
        }
      })
      .catch((err) => {
        console.error("Failed to load season details:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSeason(false);
      });

    return () => {
      isMounted = false;
    };
  }, [movie?.id, isTv, selectedSeason, locale, seasonCache, setSeasonDetails, setIsLoadingSeason]);

  useEffect(() => {
    stopPlayer();
    setLastTime(movie ? watchProgress[currentEpisodeKey] || null : null);
    setTimeout(() => {
      abortRef.current = false;
    }, 0);
  }, [movie?.id, currentEpisodeKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
          if (time > 0) setWatchProgress(currentEpisodeKey, time);
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, [movie, currentEpisodeKey, setWatchProgress]);

  // Anti-ad-popup focus protection
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
      if (!sources.length || index >= sources.length) {
        setPhase({ tag: "error" });
        return;
      }

      setPhase({ tag: "probing", sourceIndex: index });
      clearProbeTimer();

      // Give server 5.5s to resolve iframe or auto-switch
      probeTimerRef.current = setTimeout(() => {
        if (!abortRef.current) trySource(index + 1);
      }, 5500);
    },
    [clearProbeTimer, sources.length]
  );

  const handleWatchContent = () => {
    if (phase.tag !== "idle") {
      stopPlayer();
      return;
    }
    if (!sources.length) {
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

      const savedTime = watchProgress[currentEpisodeKey];
      if (savedTime && savedTime > 10) {
        const iframe = e.currentTarget;
        setTimeout(() => {
          iframe.contentWindow?.postMessage({ type: "seek", time: savedTime }, "*");
          iframe.contentWindow?.postMessage({ command: "seek", time: savedTime }, "*");
          iframe.contentWindow?.postMessage(
            JSON.stringify({ type: "seek", time: savedTime }),
            "*"
          );
        }, 2000);
      }
    },
    [clearProbeTimer, watchProgress, currentEpisodeKey]
  );

  const handleNextServerManual = () => {
    if ((phase.tag === "playing" || phase.tag === "probing") && sources.length > 0) {
      const nextIdx = (phase.sourceIndex + 1) % sources.length;
      trySource(nextIdx);
    }
  };

  const handleSelectEpisode = (epNum: number) => {
    setSelectedEpisode(epNum);
    if (phase.tag !== "idle") {
      abortRef.current = false;
      trySource(0);
    }
  };

  if (isLoading || !movie) return null;

  const releaseYear =
    (isTv ? movie.first_air_date : movie.release_date)?.split("-")[0] ??
    t("movie.unknown");

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
  const currentPlayUrl = sources[activeSourceIndex]?.url ?? null;

  const isPlayerOpen = phase.tag !== "idle";
  const isFav = isFavourite(movie.id);
  const posterUrl = getImageUrl(movie.poster_path, "w500");

  const activeSeasonData = isTv ? seasonCache[`${movie.id}_${selectedSeason}`] : null;

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
            <div className="poster relative">
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
              {/* Type Badge */}
              <div className="absolute right-2 top-2 z-10 flex items-center gap-1 bg-ink-0/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-9 backdrop-blur-sm">
                {isTv ? <Tv className="h-3 w-3 text-live" /> : <Film className="h-3 w-3 text-link" />}
                <span>{isTv ? t("tv.badge") : t("tv.movieBadge")}</span>
              </div>
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
              <h1 className="max-w-[18ch] text-title leading-[1.1] tracking-[-0.02em] text-ink-9 lg:text-display lg:leading-[1.02] lg:tracking-[-0.03em]">
                {movie.title}
              </h1>
              {movie.original_title && movie.original_title !== movie.title && (
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
                {isTv && movie.number_of_seasons && (
                  <span data-num className="text-ink-8">
                    {movie.number_of_seasons} {t("tv.seasons")}
                    {movie.number_of_episodes ? ` (${movie.number_of_episodes} ${t("tv.episodes")})` : ""}
                  </span>
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
                    {t(`genres.${g.id}`) || g.name}
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

            {/* TV Show Season & Episode Navigation Bar */}
            {isTv && movie.seasons && movie.seasons.length > 0 && (
              <motion.div {...step(3.5)} className="mt-6 border border-ink-4 bg-ink-2/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ListFilter className="h-3.5 w-3.5 text-live" />
                    <span className="rail-label">{t("tv.selectSeason")}:</span>
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(Number(e.target.value))}
                      className="inp h-8 w-auto min-w-[130px] font-sans text-xs"
                    >
                      {movie.seasons.map((s) => (
                        <option key={s.id} value={s.season_number}>
                          {s.name || t("tv.seasonFormat", { season: s.season_number })} ({s.episode_count} {t("tv.episodes")})
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeSeasonData?.episodes && (
                    <div className="flex items-center gap-2">
                      <span className="rail-label">{t("tv.selectEpisode")}:</span>
                      <select
                        value={selectedEpisode}
                        onChange={(e) => handleSelectEpisode(Number(e.target.value))}
                        className="inp h-8 w-auto min-w-[130px] font-sans text-xs"
                      >
                        {activeSeasonData.episodes.map((ep) => (
                          <option key={ep.id} value={ep.episode_number}>
                            EP {ep.episode_number} - {ep.name || `Episode ${ep.episode_number}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Quick horizontal episode pills */}
                {isLoadingSeason ? (
                  <div className="mt-3 flex items-center gap-2 text-label text-ink-6">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Loading episodes...</span>
                  </div>
                ) : activeSeasonData?.episodes && activeSeasonData.episodes.length > 0 ? (
                  <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                    {activeSeasonData.episodes.map((ep) => {
                      const active = selectedEpisode === ep.episode_number;
                      return (
                        <button
                          key={ep.id}
                          type="button"
                          onClick={() => handleSelectEpisode(ep.episode_number)}
                          className={`flex h-7 shrink-0 items-center gap-1 px-2.5 text-xs transition-colors duration-[120ms] ${
                            active
                              ? "border border-live/60 bg-live/20 font-bold text-live"
                              : "border border-ink-4 bg-ink-3/60 text-ink-7 hover:border-ink-5 hover:text-ink-9"
                          }`}
                        >
                          <span>E{ep.episode_number}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </motion.div>
            )}

            <motion.div {...step(4)} className="mt-7 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleWatchContent}
                className={`ctl ${isPlayerOpen ? "ctl-ghost" : "ctl-live"}`}
              >
                {phase.tag === "probing" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isPlayerOpen ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current" />
                )}
                {isPlayerOpen
                  ? t("menu.close")
                  : isTv
                    ? t("movie.watchEpisode", { season: selectedSeason, episode: selectedEpisode })
                    : t("movie.watchMovie")}
              </button>

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

        {/* Readout stats */}
        <motion.div {...step(5)} className="mt-12 sm:grid sm:grid-cols-12">
          <div className="sm:col-span-9">
            <div className="stage-rule mb-4" />
            <table className="datatable">
              <tbody>
                <tr>
                  <th scope="row">{t("filters.contentType")}</th>
                  <td>{isTv ? t("tv.badge") : t("tv.movieBadge")}</td>
                </tr>
                <tr>
                  <th scope="row">{isTv ? t("tv.firstAirDate") : t("filters.year")}</th>
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

        {/* Video Player Frame with Automatic Failover */}
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
                      key={`probe-${currentEpisodeKey}-${phase.sourceIndex}`}
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
                            server: sources[phase.sourceIndex]?.name || `Server ${phase.sourceIndex + 1}`,
                            current: phase.sourceIndex + 1,
                            total: sources.length,
                          })}
                        </p>
                      </div>
                      <ol className="flex gap-1" aria-hidden="true">
                        {sources.map((_, i) => (
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
                        {t("movie.allServersChecked", { total: sources.length })}
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
                    key={`play-${currentEpisodeKey}-${phase.sourceIndex}`}
                    src={currentPlayUrl}
                    title="Player"
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
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 text-label uppercase tracking-[0.12em] text-ink-6">
                      <span className="h-1.5 w-1.5 rounded-full bg-live" />
                      {t("movie.activeServer")}
                      <span className="text-ink-8" data-num>
                        {sources[phase.sourceIndex]?.name}
                      </span>
                    </span>
                    {isTv && (
                      <span className="border-l border-ink-4 pl-2 text-label text-ink-7">
                        S{selectedSeason} E{selectedEpisode}
                      </span>
                    )}
                  </div>
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
