"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Copy,
  Check,
  Send,
  Lock,
  Crown,
  Play,
  Pause,
  ArrowLeft,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ShieldCheck,
  Film,
  Tv,
  MessageSquare,
  Sparkles,
  RefreshCw,
  ExternalLink,
  UserX,
  Power,
  LogOut,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { WatchRoom } from "@/lib/supabaseClient";
import { useRoomSync, FloatingEmoji } from "@/lib/useRoomSync";
import { extractYoutubeId } from "@/components/YoutubePlayer";

function YoutubeIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const EMOJI_LIST = ["🔥", "❤️", "😂", "👏", "🍿", "😱", "👍", "🎉"];

export function WatchPartyRoom({ initialRoom }: { initialRoom: WatchRoom }) {
  const { locale, user, profile } = useStore();
  const t = getTranslations(locale);

  const [copiedLink, setCopiedLink] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "users">("chat");
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [proxyError, setProxyError] = useState(false);

  const ytPlayerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if media is YouTube
  const youtubeVideoId =
    initialRoom.media_type === "youtube"
      ? extractYoutubeId(initialRoom.media_id) || initialRoom.media_id
      : extractYoutubeId(initialRoom.media_id);

  const isYouTube = Boolean(youtubeVideoId);

  // Raw provider stream URL
  const rawProviderUrl =
    initialRoom.media_type === "tv"
      ? `https://vidsrc.cc/v2/embed/tv/${initialRoom.media_id}/${initialRoom.season || 1}/${initialRoom.episode || 1}`
      : `https://vidsrc.cc/v2/embed/movie/${initialRoom.media_id}`;

  // Safe Embed Proxy URL to prevent "vidsrc.cc Refused to Connect"
  const embedStreamUrl = proxyError
    ? rawProviderUrl
    : `/api/embed-proxy?url=${encodeURIComponent(rawProviderUrl)}`;

  // YouTube player initialization via Iframe API
  useEffect(() => {
    if (!isYouTube || !youtubeVideoId) return;

    let isMounted = true;

    const initYt = () => {
      if (!isMounted || !(window as any).YT || !(window as any).YT.Player) return;

      try {
        if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
          ytPlayerRef.current.destroy();
        }

        ytPlayerRef.current = new (window as any).YT.Player(`yt-room-player-${youtubeVideoId}`, {
          videoId: youtubeVideoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
          },
          events: {
            onStateChange: (event: any) => {
              if (event.data === 1) setIsPlaying(true);
              if (event.data === 2) setIsPlaying(false);
            },
          },
        });
      } catch (err) {
        console.warn("YouTube player init error:", err);
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
        initYt();
      };
    } else {
      initYt();
    }

    return () => {
      isMounted = false;
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
      }
    };
  }, [isYouTube, youtubeVideoId]);

  // Stable Hook sync bindings
  const getCurrentTime = useCallback(() => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === "function") {
      return ytPlayerRef.current.getCurrentTime() || 0;
    }
    return currentTime;
  }, [currentTime]);

  const seekTo = useCallback((time: number) => {
    setCurrentTime(time);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      ytPlayerRef.current.seekTo(time, true);
    }
  }, []);

  const playMedia = useCallback(() => {
    setIsPlaying(true);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === "function") {
      ytPlayerRef.current.playVideo();
    }
  }, []);

  const pauseMedia = useCallback(() => {
    setIsPlaying(false);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
      ytPlayerRef.current.pauseVideo();
    }
  }, []);

  const {
    participants,
    messages,
    floatingEmojis,
    isConnected,
    isRoomFull,
    isHost,
    sendSeek,
    sendPlay,
    sendPause,
    kickUser,
    closeRoom,
    sendMessage,
    sendEmojiReaction,
  } = useRoomSync({
    room: initialRoom,
    currentUser: user,
    currentProfile: profile,
    getCurrentTime,
    seekTo,
    playMedia,
    pauseMedia,
  });

  // Auto scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyRoomLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput("");
  };

  const handleKick = (targetId: string, targetName: string) => {
    if (confirm(t("room.confirmKick", { name: targetName }))) {
      kickUser(targetId, targetName);
    }
  };

  const handleCloseRoom = () => {
    if (confirm(t("room.confirmClose"))) {
      closeRoom();
    }
  };

  if (isRoomFull) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-1 p-6 text-center text-ink-9">
        <div className="max-w-md space-y-4 rounded-xs border border-amber-500/30 bg-ink-2 p-8 shadow-lifted">
          <Users className="mx-auto h-12 w-12 text-amber-400" />
          <h2 className="text-h3 font-semibold">
            {locale === "az" ? "Otaq Doludur" : "Room is Full"}
          </h2>
          <p className="text-small text-ink-6">
            {locale === "az"
              ? `Bu otaq maksimum ${initialRoom.max_participants} nəfərlik tutuma çatıb. Zəhmət olmasa başqa bir otaq yaradın və ya daha sonra qoşulun.`
              : `This room has reached the maximum limit of ${initialRoom.max_participants} participants.`}
          </p>
          <Link href="/rooms" className="ctl ctl-primary inline-flex h-9 items-center gap-2 text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>{locale === "az" ? "Otaqlar Mərkəzinə Qayıt" : "Back to Room Hub"}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink-1 text-ink-9">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-4 bg-ink-2/95 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/rooms"
            className="ctl ctl-ghost h-8 w-8 px-0 text-ink-6 hover:text-ink-9"
            title="Leave Room"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-small font-semibold text-ink-9 truncate max-w-[180px] sm:max-w-[340px]">
                {initialRoom.title}
              </h1>
              {isHost && (
                <span className="inline-flex items-center gap-1 rounded-xs border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-amber-300">
                  <Crown className="h-2.5 w-2.5" />
                  <span>Host</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-6 font-mono">Code: {initialRoom.code}</p>
          </div>
        </div>

        {/* Room Tools, Close Room, Copy Link */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xs bg-ink-1 px-2.5 py-1 border border-ink-4 text-xs">
            <Users className="h-3.5 w-3.5 text-live" />
            <span className="font-semibold text-ink-9" id="room-participant-count">
              {Math.max(1, participants.length)}/{initialRoom.max_participants}
            </span>
          </div>

          <button
            type="button"
            onClick={copyRoomLink}
            id="room-copy-link-btn"
            className="ctl ctl-ghost h-8 gap-1.5 px-2.5 text-xs border border-ink-4 hover:border-live-border/40 hover:text-live transition-colors"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-live" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? "Kopyalandı!" : "Linki Kopyala"}</span>
          </button>

          {isHost ? (
            <button
              type="button"
              onClick={handleCloseRoom}
              id="room-close-btn"
              className="ctl ctl-ghost h-8 gap-1.5 px-2.5 text-xs border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              title="Close Room"
            >
              <Power className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{locale === "az" ? "Otağı Bağla" : "Close"}</span>
            </button>
          ) : (
            <Link
              href="/rooms"
              className="ctl ctl-ghost h-8 gap-1.5 px-2.5 text-xs border border-ink-4 text-ink-7 hover:text-ink-9"
              title="Leave Room"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{locale === "az" ? "Çıx" : "Leave"}</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Grid: Player Left, Live Chat Right */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* PLAYER AREA */}
        <div className="relative flex flex-col bg-black lg:col-span-8 xl:col-span-9">
          <div className="relative flex-1 min-h-[320px] sm:min-h-[480px] lg:min-h-[600px] flex items-center justify-center overflow-hidden">
            {/* FLOATING EMOJIS OVERLAY */}
            <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
              <AnimatePresence>
                {floatingEmojis.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 50, scale: 0.5 }}
                    animate={{ opacity: 1, y: -260, scale: [1, 1.4, 1.1] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.2, ease: "easeOut" }}
                    style={{ left: `${item.x}%`, position: "absolute", bottom: "15%" }}
                    className="flex flex-col items-center select-none"
                  >
                    <span className="text-3xl drop-shadow-md">{item.emoji}</span>
                    <span className="text-[10px] text-white/80 font-medium px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs">
                      {item.senderName}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Video Player Display: YouTube vs Proxied Movie/TV */}
            {isYouTube && youtubeVideoId ? (
              <div className="h-full w-full aspect-video">
                <iframe
                  id={`yt-room-player-${youtubeVideoId}`}
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&autoplay=1&rel=0`}
                  className="h-full w-full border-0"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                />
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                src={embedStreamUrl}
                allowFullScreen
                allow="autoplay; fullscreen; encrypted-media"
                className="h-full w-full border-0"
              />
            )}
          </div>

          {/* Player Synchronizer Bar */}
          <div className="flex items-center justify-between border-t border-ink-4 bg-ink-2 px-4 py-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-[11px] text-live font-semibold">
                <span className="h-2 w-2 rounded-full bg-live animate-pulse" />
                <span>Live Sync Active</span>
              </span>

              {initialRoom.host_only_control && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-amber-400">
                  <Lock className="h-3 w-3" />
                  <span>Host Control Only</span>
                </span>
              )}
            </div>

            {/* Emojis Quick React Row */}
            <div className="flex items-center gap-1">
              {EMOJI_LIST.slice(0, 6).map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => sendEmojiReaction(emoji)}
                  className="rounded-xs p-1 text-sm hover:bg-ink-3 transition-transform active:scale-125"
                  title="React"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR: CHAT & PARTICIPANTS */}
        <div className="flex flex-col border-t border-ink-4 bg-ink-2 lg:col-span-4 lg:border-t-0 lg:border-l xl:col-span-3 min-h-[400px]">
          {/* Sidebar Tab Header */}
          <div className="grid grid-cols-2 border-b border-ink-4 text-xs font-medium bg-ink-1/60">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex items-center justify-center gap-1.5 py-3 border-b-2 transition-colors ${
                activeTab === "chat"
                  ? "border-live text-live font-semibold bg-ink-2"
                  : "border-transparent text-ink-6 hover:text-ink-9"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Chat ({messages.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`flex items-center justify-center gap-1.5 py-3 border-b-2 transition-colors ${
                activeTab === "users"
                  ? "border-live text-live font-semibold bg-ink-2"
                  : "border-transparent text-ink-6 hover:text-ink-9"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>İştirakçılar ({Math.max(1, participants.length)})</span>
            </button>
          </div>

          {/* Tab 1: Chat Messages */}
          {activeTab === "chat" && (
            <div className="flex flex-1 flex-col justify-between min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[500px]">
                {messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-ink-6">
                    <Sparkles className="mx-auto h-6 w-6 text-live/60 mb-2" />
                    <p>Otaq yaradıldı! Mesaj yazın və ya dostlarınızla film haqqında danışın.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    return (
                      <div key={msg.id} className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-ink-6">
                          <span className="font-semibold text-ink-8">
                            {msg.profile?.username || "Guest"}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="rounded-xs bg-ink-3/60 px-3 py-2 text-xs text-ink-9 leading-relaxed border border-ink-4/40">
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-ink-4 p-3 bg-ink-1 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="inp flex-1 text-xs"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="ctl ctl-primary h-8 px-3 text-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: Participants List with Host Kick Controls */}
          {activeTab === "users" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {(participants.length > 0
                ? participants
                : [
                    {
                      id: "current",
                      username: profile?.username || user?.email?.split("@")[0] || "Guest",
                      avatar_url: "",
                      isHost: true,
                      joinedAt: new Date().toISOString(),
                    },
                  ]
              ).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xs bg-ink-1 border border-ink-4"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-ink-3 flex items-center justify-center text-xs font-bold text-live overflow-hidden">
                      {p.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-ink-9 truncate">{p.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.isHost && (
                      <span className="inline-flex items-center gap-1 rounded-xs border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                        <Crown className="h-2.5 w-2.5" />
                        <span>Host</span>
                      </span>
                    )}

                    {/* Host Kick Action Button */}
                    {isHost && !p.isHost && (
                      <button
                        type="button"
                        onClick={() => handleKick(p.id, p.username)}
                        className="ctl ctl-ghost h-6 w-6 px-0 text-ink-6 hover:text-red-400"
                        title="Kick Participant"
                      >
                        <UserX className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
