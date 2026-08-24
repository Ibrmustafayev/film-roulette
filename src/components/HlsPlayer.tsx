"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  AlertCircle,
  Loader2,
  Gauge,
  PictureInPicture2,
  RotateCcw,
  RotateCw,
  SkipForward,
  Sun,
  Volume2,
} from "lucide-react";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
const SEEK_STEP = 10;
/** Show the next-episode prompt this many seconds before the end. */
const NEXT_EPISODE_LEAD = 75;
const NEXT_EPISODE_COUNTDOWN = 10;

interface HlsPlayerProps {
  src: string;
  poster?: string | null;
  initialTime?: number | null;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onError?: (error: Error) => void;
  className?: string;
  /** Present only for series with an episode after this one. */
  onNextEpisode?: () => void;
  nextEpisodeLabel?: string;
}

type Flash =
  | { kind: "seek"; direction: "back" | "forward"; at: number }
  | { kind: "volume"; value: number; at: number }
  | { kind: "brightness"; value: number; at: number }
  | null;

export function HlsPlayer({
  src,
  poster,
  initialTime,
  onTimeUpdate,
  onError,
  className = "",
  onNextEpisode,
  nextEpisodeLabel,
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [speed, setSpeed] = useState<number>(1);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [flash, setFlash] = useState<Flash>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Latest callbacks without re-running the stream effect.
  const callbacks = useRef({ onTimeUpdate, onError, onNextEpisode });
  useEffect(() => {
    callbacks.current = { onTimeUpdate, onError, onNextEpisode };
  });

  /* ---------------------------------------------------------------- stream */

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");

    let isDestroyed = false;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const startAt = () => {
      if (initialTime && initialTime > 5) video.currentTime = initialTime;
      video.play().catch(() => {
        // Autoplay blocked by policy; the user can press play.
      });
    };

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isDestroyed) return;
        setIsLoading(false);
        startAt();
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (isDestroyed || !data.fatal) return;
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            hls.destroy();
            setHasError(true);
            setErrorMessage("Fatal stream playback error.");
            callbacks.current.onError?.(new Error("HLS Fatal Error: " + data.details));
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        if (isDestroyed) return;
        setIsLoading(false);
        startAt();
      });
      video.addEventListener("error", () => {
        if (isDestroyed) return;
        setHasError(true);
        setErrorMessage("Native video playback error.");
        callbacks.current.onError?.(new Error("Native HLS Playback Error"));
      });
    } else {
      setHasError(true);
      setErrorMessage("HLS playback is not supported in this browser.");
      callbacks.current.onError?.(new Error("HLS not supported"));
    }

    return () => {
      isDestroyed = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src, initialTime]);

  /* -------------------------------------------------------------- controls */

  const showFlash = useCallback((next: NonNullable<Flash>) => {
    setFlash(next);
    window.setTimeout(() => {
      setFlash((current) => (current?.at === next.at ? null : current));
    }, 650);
  }, []);

  const seekBy = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.max(
        0,
        Math.min(video.duration || Infinity, video.currentTime + delta)
      );
      showFlash({
        kind: "seek",
        direction: delta < 0 ? "back" : "forward",
        at: Date.now(),
      });
    },
    [showFlash]
  );

  const nudgeVolume = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (!video) return;
      const value = Math.max(0, Math.min(1, video.volume + delta));
      video.volume = value;
      if (value > 0) video.muted = false;
      showFlash({ kind: "volume", value, at: Date.now() });
    },
    [showFlash]
  );

  const nudgeBrightness = useCallback(
    (delta: number) => {
      setBrightness((prev) => {
        const value = Math.max(0.25, Math.min(1.5, prev + delta));
        showFlash({ kind: "brightness", value, at: Date.now() });
        return value;
      });
    },
    [showFlash]
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }, []);

  const toggleFullscreen = useCallback(() => {
    const node = containerRef.current;
    if (!node) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else node.requestFullscreen?.().catch(() => {});
  }, []);

  const togglePip = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      // Browser refused (unsupported, or disablePictureInPicture); ignore.
    }
  }, []);

  const applySpeed = useCallback((value: number) => {
    const video = videoRef.current;
    if (video) video.playbackRate = value;
    setSpeed(value);
    setSpeedMenuOpen(false);
  }, []);

  /* Keyboard. Scoped to the player so it never hijacks typing elsewhere. */
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }

      switch (event.key) {
        case " ":
        case "k":
        case "K":
          event.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          event.preventDefault();
          seekBy(-SEEK_STEP);
          break;
        case "ArrowRight":
          event.preventDefault();
          seekBy(SEEK_STEP);
          break;
        case "ArrowUp":
          event.preventDefault();
          nudgeVolume(0.1);
          break;
        case "ArrowDown":
          event.preventDefault();
          nudgeVolume(-0.1);
          break;
        case "f":
        case "F":
          event.preventDefault();
          toggleFullscreen();
          break;
        case "m":
        case "M": {
          event.preventDefault();
          const video = videoRef.current;
          if (video) video.muted = !video.muted;
          break;
        }
        case "p":
        case "P":
          event.preventDefault();
          void togglePip();
          break;
        default:
          // 0-9 jump to that tenth of the runtime.
          if (/^[0-9]$/.test(event.key)) {
            const video = videoRef.current;
            if (video?.duration) {
              event.preventDefault();
              video.currentTime = (Number(event.key) / 10) * video.duration;
            }
          }
      }
    };

    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, [togglePlay, seekBy, nudgeVolume, toggleFullscreen, togglePip]);

  /* Touch: double-tap either half to seek, vertical drag for volume/brightness. */
  const touch = useRef({ x: 0, y: 0, side: "left" as "left" | "right", moved: false });
  const lastTap = useRef({ at: 0, side: "left" as "left" | "right" });

  const onTouchStart = (event: React.TouchEvent) => {
    const point = event.touches[0];
    const bounds = event.currentTarget.getBoundingClientRect();
    touch.current = {
      x: point.clientX,
      y: point.clientY,
      side: point.clientX - bounds.left < bounds.width / 2 ? "left" : "right",
      moved: false,
    };
  };

  const onTouchMove = (event: React.TouchEvent) => {
    const point = event.touches[0];
    const dy = touch.current.y - point.clientY;
    if (Math.abs(dy) < 12) return;
    touch.current.moved = true;
    touch.current.y = point.clientY;
    if (touch.current.side === "right") nudgeVolume(dy > 0 ? 0.05 : -0.05);
    else nudgeBrightness(dy > 0 ? 0.05 : -0.05);
  };

  const onTouchEnd = () => {
    if (touch.current.moved) return;
    const now = Date.now();
    const isDoubleTap =
      now - lastTap.current.at < 320 && lastTap.current.side === touch.current.side;

    if (isDoubleTap) {
      seekBy(touch.current.side === "left" ? -SEEK_STEP : SEEK_STEP);
      lastTap.current = { at: 0, side: touch.current.side };
    } else {
      lastTap.current = { at: now, side: touch.current.side };
    }
  };

  /* ------------------------------------------------- progress & next episode */

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const current = Math.floor(video.currentTime);
    const duration = Math.floor(video.duration) || 0;
    callbacks.current.onTimeUpdate?.(current, duration);

    if (!callbacks.current.onNextEpisode || !duration) {
      return;
    }

    const remaining = duration - current;
    if (remaining <= NEXT_EPISODE_LEAD && remaining > 0) {
      setCountdown(Math.min(NEXT_EPISODE_COUNTDOWN, remaining));
    } else {
      setCountdown(null);
    }
  };

  // One timer drives the countdown and fires the advance on the final tick, so
  // state is only ever set from the timer callback rather than during the effect.
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = window.setTimeout(() => {
      if (countdown <= 1) {
        callbacks.current.onNextEpisode?.();
        setCountdown(null);
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown]);

  /* ------------------------------------------------------------------ view */

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`group relative h-full w-full bg-black outline-none ${className}`}
    >
      <video
        ref={videoRef}
        poster={poster || undefined}
        controls
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        style={{ filter: brightness === 1 ? undefined : `brightness(${brightness})` }}
        className="h-full w-full object-contain"
      />

      {/* Gesture surface. Sits above the video but below the native control bar,
          which owns the bottom strip. */}
      <div
        className="absolute inset-x-0 top-0 bottom-16 z-10"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />

      {/* Speed and picture-in-picture. Native controls cover everything else. */}
      <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setSpeedMenuOpen((open) => !open)}
            aria-label="Playback speed"
            aria-expanded={speedMenuOpen}
            className="flex h-8 items-center gap-1.5 rounded-control bg-ink-0/70 px-2 text-label text-ink-8 backdrop-blur-sm transition-colors hover:text-ink-9"
          >
            <Gauge className="h-3.5 w-3.5" />
            <span data-num>{speed}x</span>
          </button>

          {speedMenuOpen && (
            <ul className="absolute right-0 top-full mt-1 overflow-hidden rounded-control border border-ink-4 bg-ink-1/95 backdrop-blur-sm">
              {SPEEDS.map((value) => (
                <li key={value}>
                  <button
                    type="button"
                    onClick={() => applySpeed(value)}
                    className={`block w-full px-3 py-1.5 text-left text-small transition-colors ${
                      value === speed
                        ? "bg-live-subtle text-live"
                        : "text-ink-7 hover:bg-ink-3 hover:text-ink-9"
                    }`}
                  >
                    <span data-num>{value}x</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={togglePip}
          aria-label="Picture in picture"
          className="flex h-8 w-8 items-center justify-center rounded-control bg-ink-0/70 text-ink-8 backdrop-blur-sm transition-colors hover:text-ink-9"
        >
          <PictureInPicture2 className="h-4 w-4" />
        </button>
      </div>

      {/* Gesture feedback */}
      {flash && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          {flash.kind === "seek" ? (
            <div
              className={`flex items-center gap-2 rounded-full bg-ink-0/75 px-4 py-3 text-ink-9 ${
                flash.direction === "back" ? "mr-auto ml-10" : "ml-auto mr-10"
              }`}
            >
              {flash.direction === "back" ? (
                <RotateCcw className="h-5 w-5" />
              ) : (
                <RotateCw className="h-5 w-5" />
              )}
              <span className="text-small" data-num>
                {SEEK_STEP}s
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-control bg-ink-0/75 px-4 py-3 text-ink-9">
              {flash.kind === "volume" ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span className="h-1 w-28 overflow-hidden rounded-full bg-ink-4">
                <span
                  className="block h-full bg-live"
                  style={{
                    width: `${
                      flash.kind === "volume"
                        ? flash.value * 100
                        : ((flash.value - 0.25) / 1.25) * 100
                    }%`,
                  }}
                />
              </span>
            </div>
          )}
        </div>
      )}

      {/* Next episode */}
      {countdown !== null && onNextEpisode && (
        <div className="absolute bottom-20 right-4 z-20 flex items-center gap-3 rounded-control border border-ink-4 bg-ink-1/95 px-4 py-3 backdrop-blur-sm">
          <div>
            <p className="text-label uppercase tracking-[0.12em] text-ink-6">
              {nextEpisodeLabel}
            </p>
            <p className="text-small text-ink-8">
              <span data-num>{countdown}</span>s
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCountdown(null);
              onNextEpisode();
            }}
            className="ctl ctl-live h-8 px-3"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCountdown(null)}
            aria-label="Dismiss"
            className="text-ink-6 transition-colors hover:text-ink-9"
          >
            ×
          </button>
        </div>
      )}

      {isLoading && !hasError && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <Loader2 className="h-8 w-8 animate-spin text-live" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-ink-1/95 p-6 text-center">
          <AlertCircle className="h-6 w-6 text-alert" />
          <p className="text-small text-ink-8">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
