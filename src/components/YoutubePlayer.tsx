"use client";

import { useEffect, useRef } from "react";

export const extractYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const clean = url.trim();
  if (clean.length === 11 && !clean.includes("/") && !clean.includes(".") && !clean.includes("?")) {
    return clean;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = clean.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

interface YoutubePlayerProps {
  videoId: string;
  autoplay?: boolean;
  onReady?: (player: any) => void;
  onStateChange?: (state: number) => void;
}

export function YoutubePlayer({
  videoId,
  autoplay = true,
  onReady,
  onStateChange,
}: YoutubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  const cleanId = extractYoutubeId(videoId) || videoId;

  useEffect(() => {
    if (!cleanId) return;

    let isMounted = true;

    const initPlayer = () => {
      const win = typeof window !== "undefined" ? (window as any) : null;
      if (!isMounted || !win || !win.YT || !win.YT.Player) return;

      try {
        if (playerRef.current && playerRef.current.destroy) {
          playerRef.current.destroy();
        }

        playerRef.current = new win.YT.Player(`yt-player-${cleanId}`, {
          videoId: cleanId,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
          },
          events: {
            onReady: (event: any) => {
              if (onReady) onReady(event.target);
            },
            onStateChange: (event: any) => {
              if (onStateChange) onStateChange(event.data);
            },
          },
        });
      } catch (err) {
        console.warn("YouTube API init fallback:", err);
      }
    };

    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      const prevCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    } else if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    }

    return () => {
      isMounted = false;
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    };
  }, [cleanId, autoplay, onReady, onStateChange]);

  return (
    <div ref={containerRef} className="h-full w-full aspect-video bg-black flex items-center justify-center">
      <iframe
        id={`yt-player-${cleanId}`}
        src={`https://www.youtube.com/embed/${cleanId}?enablejsapi=1&autoplay=${autoplay ? 1 : 0}&rel=0`}
        className="h-full w-full border-0"
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
