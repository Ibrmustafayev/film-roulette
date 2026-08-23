"use client";

import Image from "next/image";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, User, ExternalLink, Heart, Loader2,
  AlertCircle, RefreshCw, ChevronRight, X, Link2, Download, Check,
  Tv, Film, ListFilter, ShieldCheck, ShieldAlert, Maximize, Minimize,
  Clock, RotateCcw,
} from "lucide-react";
import { getImageUrl, getSeasonDetails, SeasonDetails } from "@/lib/tmdb";
import { getTranslations } from "@/lib/i18n";
import { resolveStreamSources } from "@/lib/providers";
import {
  saveWatchProgress,
  getMediaProgress,
  formatTime,
  removeHistoryItem,
} from "@/lib/history";
import { HlsPlayer } from "./HlsPlayer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PlayerPhase =
  | { tag: "idle" }
  | { tag: "extracting" }
  | { tag: "hls"; streamUrl: string }
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
  const [resumePrompt, setResumePrompt] = useState<{ visible: boolean; time: number; formatted: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [shieldActive, setShieldActive] = useState(true);
  const [firstClickDismissed, setFirstClickDismissed] = useState(false);
  const [useDirectEmbed, setUseDirectEmbed] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const t = getTranslations(locale);
  const playerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  const abortRef = useRef(false);

  const stopPlayer = useCallback(() => {
    abortRef.current = true;
    setPhase({ tag: "idle" });
    setShowPlayer(false);
    setIframeLoading(false);
    setFirstClickDismissed(false);
    setUseDirectEmbed(false);
  }, [setShowPlayer]);

  // Check saved watch progress on load
  useEffect(() => {
    if (!movie) {
      setResumePrompt(null);
      return;
    }

    const saved = getMediaProgress(movie.id, isTv ? selectedSeason : undefined, isTv ? selectedEpisode : undefined);
    if (saved && saved.currentTime > 10 && saved.progressPercent < 95) {
      setResumePrompt({
        visible: true,
        time: saved.currentTime,
        formatted: formatTime(saved.currentTime),
      });
      setLastTime(saved.currentTime);
    } else {
      setResumePrompt(null);
      const storeTime = watchProgress[currentEpisodeKey];
      setLastTime(storeTime || null);
    }
  }, [movie?.id, isTv, selectedSeason, selectedEpisode, currentEpisodeKey, watchProgress]);

  // Fullscreen change listener across vendor prefixes
  useEffect(() => {
    const onFullscreenChange = () => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const doc = document as any;
      const isFull = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("mozfullscreenchange", onFullscreenChange);
    document.addEventListener("MSFullscreenChange", onFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      document.removeEventListener("mozfullscreenchange", onFullscreenChange);
      document.removeEventListener("MSFullscreenChange", onFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const iframeEl = iframeRef.current as any;
    const containerEl = playerRef.current as any;
    const doc = document as any;

    const isCurrentFull = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (!isCurrentFull) {
      const targetEl = iframeEl || containerEl;
      if (targetEl) {
        if (targetEl.requestFullscreen) {
          targetEl.requestFullscreen().catch(() => {
            if (containerEl && containerEl !== targetEl && containerEl.requestFullscreen) {
              containerEl.requestFullscreen().catch(() => {});
            }
          });
        } else if (targetEl.webkitRequestFullscreen) {
          targetEl.webkitRequestFullscreen();
        } else if (targetEl.mozRequestFullScreen) {
          targetEl.mozRequestFullScreen();
        } else if (targetEl.msRequestFullscreen) {
          targetEl.msRequestFullscreen();
        }
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  }, []);

  // Fetch season breakdown when TV series or season changes
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

  // Handle postMessage media progress from embedded players
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      try {
        const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (d?.type === "MEDIA_DATA" && d?.progress && movie) {
          const time = Math.floor(d.progress.time);
          const duration = Math.floor(d.progress.duration) || (movie.runtime ? movie.runtime * 60 : 7200);
          if (time > 0) {
            setWatchProgress(currentEpisodeKey, time);
            saveWatchProgress({
              id: movie.id,
              mediaType: isTv ? "tv" : "movie",
              title: movie.title,
              posterPath: movie.poster_path,
              backdropPath: movie.backdrop_path,
              currentTime: time,
              duration,
              season: isTv ? selectedSeason : undefined,
              episode: isTv ? selectedEpisode : undefined,
            });
          }
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, [movie, currentEpisodeKey, isTv, selectedSeason, selectedEpisode, setWatchProgress]);

  // Anti-ad-popup focus protection for fallback iframes
  useEffect(() => {
    if (phase.tag !== "playing" || !shieldActive) return;
    const refocus = () => {
      setTimeout(() => window.focus(), 150);
    };
    window.addEventListener("blur", refocus);
    return () => window.removeEventListener("blur", refocus);
  }, [phase.tag, shieldActive]);

  // Pointer click-shield on player container to intercept rogue redirects
  useEffect(() => {
    const el = playerRef.current;
    if (!el) return;

    const handlePlayerClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (anchor && anchor.href) {
        const href = anchor.href.toLowerCase();
        if (
          !href.includes("imdb.com") &&
          !href.includes("youtube.com") &&
          !href.includes("themoviedb.org") &&
          !href.startsWith("/") &&
          !href.startsWith(window.location.origin)
        ) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      }
    };

    el.addEventListener("click", handlePlayerClick, { capture: true });
    el.addEventListener("auxclick", handlePlayerClick, { capture: true });
    return () => {
      el.removeEventListener("click", handlePlayerClick, { capture: true });
      el.removeEventListener("auxclick", handlePlayerClick, { capture: true });
    };
  }, [phase.tag]);

  // Fast Auto-Fallback to direct embed URL if proxy stalls (2.5s)
  useEffect(() => {
    if (phase.tag !== "playing" || useDirectEmbed) return;

    const timer = setTimeout(() => {
      console.warn("[Player] Fast proxy 2.5s fallback triggered, switching to direct embed URL");
      setUseDirectEmbed(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [phase, useDirectEmbed]);

  // Active watch progress tracking ticker while player is active
  useEffect(() => {
    if ((phase.tag !== "playing" && phase.tag !== "hls") || !movie) return;

    const interval = setInterval(() => {
      setLastTime((prev) => {
        const cur = (prev || 30) + 3;
        const dur = movie.runtime ? movie.runtime * 60 : 7200;
        setWatchProgress(currentEpisodeKey, cur);
        saveWatchProgress({
          id: movie.id,
          mediaType: isTv ? "tv" : "movie",
          title: movie.title,
          posterPath: movie.poster_path,
          backdropPath: movie.backdrop_path,
          currentTime: cur,
          duration: dur,
          season: isTv ? selectedSeason : undefined,
          episode: isTv ? selectedEpisode : undefined,
        });
        return cur;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [phase.tag, movie, isTv, selectedSeason, selectedEpisode, currentEpisodeKey, setWatchProgress]);

  const switchToServer = useCallback(
    (index: number) => {
      if (abortRef.current) return;
      if (!sources.length || index >= sources.length) {
        setPhase({ tag: "error" });
        return;
      }
      setIframeLoading(true);
      setFirstClickDismissed(false);
      setUseDirectEmbed(false);
      setPhase({ tag: "playing", sourceIndex: index });
    },
    [sources.length]
  );

  /**
   * 2-Tier Strategy Execution:
   * Tier 1: Direct HLS Extraction (with fast timeout)
   * Tier 2: Instant Iframe Embed Fallback via Local Server-Side Proxy
   */
  const handleWatchContent = async () => {
    if (phase.tag !== "idle") {
      stopPlayer();
      return;
    }
    if (!movie) return;

    // Immediately record watch initiation
    const initTime = lastTime && lastTime > 10 ? lastTime : 30;
    saveWatchProgress({
      id: movie.id,
      mediaType: isTv ? "tv" : "movie",
      title: movie.title,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      currentTime: initTime,
      duration: movie.runtime ? movie.runtime * 60 : 7200,
      season: isTv ? selectedSeason : undefined,
      episode: isTv ? selectedEpisode : undefined,
    });

    abortRef.current = false;
    setShowTrailer(false);
    setShowPlayer(true);
    setPhase({ tag: "extracting" });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);

      const extractUrl = `/api/extract?tmdbId=${movie.id}&imdbId=${movie.imdb_id || ""}&mediaType=${isTv ? "tv" : "movie"}&season=${selectedSeason}&episode=${selectedEpisode}`;
      const res = await fetch(extractUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));

      if (!abortRef.current && data.success && data.streamUrl) {
        setPhase({ tag: "hls", streamUrl: data.streamUrl });
        return;
      }
    } catch {
      // Direct extraction timed out or failed -> immediately load Tier 2
    }

    if (!abortRef.current) {
      switchToServer(0);
    }
  };

  const handleIframeLoad = useCallback(
    (e: React.SyntheticEvent<HTMLIFrameElement>) => {
      setIframeLoading(false);
      const savedTime = lastTime || watchProgress[currentEpisodeKey];
      if (savedTime && savedTime > 10) {
        const iframe = e.currentTarget;
        setTimeout(() => {
          iframe.contentWindow?.postMessage({ type: "seek", time: savedTime }, "*");
          iframe.contentWindow?.postMessage({ command: "seek", time: savedTime }, "*");
          iframe.contentWindow?.postMessage(
            JSON.stringify({ type: "seek", time: savedTime }),
            "*"
          );
        }, 1500);
      }
    },
    [lastTime, watchProgress, currentEpisodeKey]
  );

  const handleNextServerManual = () => {
    if (phase.tag === "playing" && sources.length > 0) {
      const nextIdx = (phase.sourceIndex + 1) % sources.length;
      switchToServer(nextIdx);
    }
  };

  const handleSelectEpisode = (epNum: number) => {
    setSelectedEpisode(epNum);
    if (phase.tag !== "idle") {
      abortRef.current = false;
      handleWatchContent();
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

  const activeSourceIndex = phase.tag === "playing" ? phase.sourceIndex : 0;
  const rawPlayUrl = sources[activeSourceIndex]?.url ?? null;
  // Proxy the embed URL server-side to strip ad scripts, or fallback to direct embed URL on stall
  const currentPlayUrl = rawPlayUrl
    ? useDirectEmbed
      ? rawPlayUrl
      : `/api/embed-proxy?url=${encodeURIComponent(rawPlayUrl)}`
    : null;

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

              {/* YouTube-Style Progress Bar on main poster */}
              {lastTime && lastTime > 5 && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/80 z-20 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, (lastTime / (movie.runtime ? movie.runtime * 60 : 7200)) * 100)
                      )}%`,
                    }}
                  />
                </div>
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

            {/* Auto-Resume Prompt Banner */}
            {resumePrompt?.visible && !isPlayerOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-live/40 bg-live/10 p-3 text-xs rounded-sm"
              >
                <div className="flex items-center gap-2 text-ink-9">
                  <Clock className="h-4 w-4 text-live shrink-0" />
                  <span>
                    {locale === "az"
                      ? `${resumePrompt.formatted} dəqiqəsindən davam edilsin?`
                      : locale === "ru"
                        ? `Продолжить с ${resumePrompt.formatted}?`
                        : `Resume playback from ${resumePrompt.formatted}?`}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    id="resume-playback-btn"
                    onClick={() => {
                      setResumePrompt(null);
                      setLastTime(resumePrompt.time);
                      handleWatchContent();
                    }}
                    className="ctl ctl-live h-7 px-3 text-xs"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>{locale === "az" ? "Davam et" : locale === "ru" ? "Продолжить" : "Resume"}</span>
                  </button>

                  <button
                    type="button"
                    id="start-over-btn"
                    onClick={() => {
                      setResumePrompt(null);
                      setLastTime(null);
                      removeHistoryItem(movie.id, isTv ? selectedSeason : undefined, isTv ? selectedEpisode : undefined);
                      handleWatchContent();
                    }}
                    className="ctl ctl-ghost h-7 px-2.5 text-xs text-ink-6 hover:text-ink-8"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{locale === "az" ? "Yenidən başla" : locale === "ru" ? "С начала" : "Start Over"}</span>
                  </button>
                </div>
              </motion.div>
            )}

            <motion.div {...step(4)} className="mt-7 flex flex-wrap gap-2">
              <button
                type="button"
                id="watch-content-btn"
                onClick={handleWatchContent}
                className={`ctl ${isPlayerOpen ? "ctl-ghost" : "ctl-live"}`}
              >
                {phase.tag === "extracting" ? (
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
                  id="watch-trailer-btn"
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

        {/* Video Player Frame with Aspect-Video Scaling */}
        <AnimatePresence>
          {(showTrailer || isPlayerOpen) && (
            <motion.section
              ref={playerRef}
              id="video-player-container"
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 48 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.24, ease: EASE }}
              className={`scroll-mt-14 overflow-hidden border border-ink-4 bg-black rounded-lg ${
                isFullscreen ? "fixed inset-0 z-50 m-0 h-screen w-screen border-none rounded-none" : ""
              }`}
            >
              <div
                className={`relative w-full bg-black overflow-hidden flex items-center justify-center ${
                  isFullscreen ? "h-screen w-screen" : "aspect-video"
                }`}
              >
                {showTrailer && (
                  <iframe
                    src={`https://www.youtube.com/embed/${movie.trailer_key}?autoplay=1`}
                    title="Trailer"
                    allow="fullscreen; autoplay; encrypted-media; picture-in-picture; accelerometer; gyroscope"
                    allowFullScreen={true}
                    {...{ webkitallowfullscreen: "true", mozallowfullscreen: "true" }}
                    className="absolute inset-0 h-full w-full border-0 z-10"
                  />
                )}

                {/* Direct HLS Stream Player (Tier 1) */}
                {!showTrailer && phase.tag === "hls" && (
                  <div className="absolute inset-0 h-full w-full z-10">
                    <HlsPlayer
                      src={phase.streamUrl}
                      poster={getImageUrl(movie.backdrop_path || movie.poster_path, "original")}
                      initialTime={lastTime}
                      onTimeUpdate={(time, duration) => {
                        setWatchProgress(currentEpisodeKey, time);
                        saveWatchProgress({
                          id: movie.id,
                          mediaType: isTv ? "tv" : "movie",
                          title: movie.title,
                          posterPath: movie.poster_path,
                          backdropPath: movie.backdrop_path,
                          currentTime: time,
                          duration: duration || (movie.runtime ? movie.runtime * 60 : 7200),
                          season: isTv ? selectedSeason : undefined,
                          episode: isTv ? selectedEpisode : undefined,
                        });
                      }}
                      onError={() => switchToServer(0)}
                    />
                  </div>
                )}

                {/* Extracting Loader */}
                {!showTrailer && phase.tag === "extracting" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-ink-1 z-10">
                    <Loader2 className="h-6 w-6 animate-spin text-live" />
                    <p className="text-small text-ink-8">
                      {t("movie.autoSearching") || "Initializing stream provider..."}
                    </p>
                  </div>
                )}

                {/* Error State */}
                {!showTrailer && phase.tag === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink-1 p-6 text-center z-10">
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
                        handleWatchContent();
                      }}
                      className="ctl ctl-ghost"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {t("movie.retry")}
                    </button>
                  </div>
                )}

                {/* Fallback Embed Iframe Player with Aspect-Video Sizing */}
                {!showTrailer && phase.tag === "playing" && currentPlayUrl && (
                  <div className="absolute inset-0 h-full w-full">
                    {/* Transparent Click-Shield Layer for 1st click */}
                    {!firstClickDismissed && shieldActive && (
                      <div
                        id="transparent-click-shield"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFirstClickDismissed(true);
                        }}
                        className="absolute inset-0 z-30 cursor-pointer bg-transparent"
                        title="Click to play"
                      />
                    )}

                    <iframe
                      ref={iframeRef}
                      key={`play-${currentEpisodeKey}-${phase.sourceIndex}-${useDirectEmbed ? "direct" : "proxied"}`}
                      id="stream-iframe"
                      src={currentPlayUrl}
                      title="Player"
                      onLoad={handleIframeLoad}
                      onError={() => setUseDirectEmbed(true)}
                      allow="fullscreen; autoplay; encrypted-media; picture-in-picture; accelerometer; gyroscope"
                      allowFullScreen={true}
                      {...{ webkitallowfullscreen: "true", mozallowfullscreen: "true" }}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 h-full w-full border-0 object-cover pointer-events-auto z-10"
                    />

                    {/* Non-blocking Ad Shield visual indicator */}
                    {shieldActive && !isFullscreen && (
                      <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-3 select-none z-20">
                        <span className="pointer-events-auto inline-flex items-center gap-1.5 border border-ink-4/80 bg-ink-1/90 px-2.5 py-1 text-[11px] font-medium text-ink-8 backdrop-blur-sm shadow-md transition-opacity duration-200">
                          <ShieldCheck className="h-3 w-3 text-live shrink-0" />
                          <span>Ad Shield Active</span>
                        </span>
                      </div>
                    )}

                    {/* Subtle inline loader during provider initial connection */}
                    {iframeLoading && !isFullscreen && (
                      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 bg-ink-1/80 px-2.5 py-1 text-xs text-ink-7 backdrop-blur-sm z-20">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-live" />
                        <span>Connecting to {sources[phase.sourceIndex]?.name}...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Player Status & Control Bar — Fully hidden in fullscreen mode */}
              {!showTrailer && !isFullscreen && (phase.tag === "playing" || phase.tag === "hls") && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-4 bg-ink-2 px-4 py-2 min-h-[42px] [:fullscreen_&]:hidden [:-webkit-full-screen_&]:hidden [:-moz-full-screen_&]:hidden [:-ms-fullscreen_&]:hidden">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="inline-flex items-center gap-2 text-label uppercase tracking-[0.12em] text-ink-6 whitespace-nowrap">
                      <span className="h-1.5 w-1.5 rounded-full bg-live shrink-0" />
                      {phase.tag === "hls" ? (
                        <span className="text-live font-semibold">Direct Native Player (Ad-Free)</span>
                      ) : (
                        <>
                          <span>{t("movie.activeServer")}</span>
                          <span className="text-ink-8 font-medium" data-num>
                            {sources[phase.sourceIndex]?.name}
                          </span>
                        </>
                      )}
                    </span>
                    {isTv && (
                      <span className="border-l border-ink-4 pl-2 text-label text-ink-7 whitespace-nowrap">
                        S{selectedSeason} E{selectedEpisode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {phase.tag === "playing" && (
                      <button
                        type="button"
                        id="shield-toggle-btn"
                        onClick={() => setShieldActive(!shieldActive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-label font-medium border transition-colors rounded-xs shrink-0 whitespace-nowrap ${
                          shieldActive
                            ? "border-live/40 bg-live/10 text-live hover:bg-live/20"
                            : "border-ink-4 bg-ink-3/40 text-ink-6 hover:text-ink-8 hover:border-ink-5"
                        }`}
                      >
                        {shieldActive ? (
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-live" />
                        ) : (
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-ink-6" />
                        )}
                        <span>{shieldActive ? "Shield: ON" : "Shield: OFF"}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      id="next-server-btn"
                      onClick={handleNextServerManual}
                      className="inline-flex items-center gap-1 px-2 py-1 text-label uppercase tracking-[0.12em] text-link transition-colors duration-[120ms] hover:text-link-hover shrink-0 whitespace-nowrap"
                    >
                      <span>{t("movie.nextServer")}</span>
                      <ChevronRight className="h-3 w-3 shrink-0" />
                    </button>

                    {/* Container-level Fullscreen Fallback Button */}
                    <button
                      type="button"
                      id="fullscreen-toggle-btn"
                      onClick={handleToggleFullscreen}
                      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-label font-medium border border-ink-4 bg-ink-3/40 text-ink-7 hover:border-ink-5 hover:text-ink-9 rounded-xs transition-colors shrink-0 whitespace-nowrap"
                    >
                      {isFullscreen ? (
                        <>
                          <Minimize className="h-3.5 w-3.5 shrink-0" />
                          <span>Exit Fullscreen</span>
                        </>
                      ) : (
                        <>
                          <Maximize className="h-3.5 w-3.5 shrink-0" />
                          <span>Fullscreen</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {!showTrailer &&
                !isFullscreen &&
                (phase.tag === "playing" || phase.tag === "hls") &&
                lastTime &&
                lastTime > 10 && (
                  <div className="flex items-center justify-between border-t border-ink-4 bg-ink-2 px-4 py-1.5 text-label uppercase tracking-[0.12em] text-ink-6 [:fullscreen_&]:hidden [:-webkit-full-screen_&]:hidden [:-moz-full-screen_&]:hidden [:-ms-fullscreen_&]:hidden">
                    <span data-num>
                      {t("movie.lastWatched", {
                        time: formatTime(lastTime),
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
