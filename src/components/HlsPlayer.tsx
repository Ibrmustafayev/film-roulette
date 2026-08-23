"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { AlertCircle, Loader2 } from "lucide-react";

interface HlsPlayerProps {
  src: string;
  poster?: string | null;
  initialTime?: number | null;
  onTimeUpdate?: (currentTime: number) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function HlsPlayer({
  src,
  poster,
  initialTime,
  onTimeUpdate,
  onError,
  className = "",
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");

    let isDestroyed = false;

    // Clean up previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

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
        if (initialTime && initialTime > 5) {
          video.currentTime = initialTime;
        }
        video.play().catch(() => {
          // Autoplay blocked by browser policy — user can click play
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (isDestroyed) return;
        if (data.fatal) {
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
              if (onError) onError(new Error("HLS Fatal Error: " + data.details));
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari / iOS)
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        if (isDestroyed) return;
        setIsLoading(false);
        if (initialTime && initialTime > 5) {
          video.currentTime = initialTime;
        }
        video.play().catch(() => {});
      });

      video.addEventListener("error", () => {
        if (isDestroyed) return;
        setHasError(true);
        setErrorMessage("Native video playback error.");
        if (onError) onError(new Error("Native HLS Playback Error"));
      });
    } else {
      setHasError(true);
      setErrorMessage("HLS playback is not supported in this browser.");
      if (onError) onError(new Error("HLS not supported"));
    }

    return () => {
      isDestroyed = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, initialTime, onError]);

  const handleTimeUpdate = () => {
    if (videoRef.current && onTimeUpdate) {
      onTimeUpdate(Math.floor(videoRef.current.currentTime));
    }
  };

  return (
    <div className={`relative h-full w-full bg-black ${className}`}>
      <video
        ref={videoRef}
        poster={poster || undefined}
        controls
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        className="h-full w-full object-contain"
      />

      {isLoading && !hasError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <Loader2 className="h-8 w-8 animate-spin text-live" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-1/95 p-6 text-center">
          <AlertCircle className="h-6 w-6 text-alert" />
          <p className="text-small text-ink-8">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
