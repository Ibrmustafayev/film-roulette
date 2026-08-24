"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  LogIn,
  X,
  Lock,
  Globe,
  Sliders,
  Film,
  Tv,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { supabase, WatchRoom } from "@/lib/supabaseClient";

function YoutubeIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function extractYouTubeId(urlOrId: string): string {
  if (!urlOrId) return "";
  const clean = urlOrId.trim();
  if (clean.length === 11 && !clean.includes("/") && !clean.includes(".")) {
    return clean;
  }
  const match = clean.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : clean;
}

export function WatchPartyModal() {
  const router = useRouter();
  const {
    locale,
    user,
    profile,
    movie,
    watchPartyModalOpen,
    setWatchPartyModalOpen,
    setAuthModalOpen,
  } = useStore();
  const t = getTranslations(locale);

  const [tab, setTab] = useState<"create" | "join">("create");
  const [mediaType, setMediaType] = useState<"movie" | "tv" | "youtube">(
    movie?.media_type === "tv" ? "tv" : movie ? "movie" : "movie"
  );
  const [roomTitle, setRoomTitle] = useState(
    movie?.title || (locale === "az" ? "Kino Gecəsi" : "Movie Night")
  );
  const [youtubeInput, setYoutubeInput] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [hostOnlyControl, setHostOnlyControl] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!watchPartyModalOpen) return null;

  const handleClose = () => {
    setErrorMsg(null);
    setWatchPartyModalOpen(false);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // If user not authenticated, open auth modal
    if (!user) {
      setWatchPartyModalOpen(false);
      setAuthModalOpen(true);
      return;
    }

    let resolvedMediaId = "";
    if (mediaType === "youtube") {
      resolvedMediaId = extractYouTubeId(youtubeInput);
      if (!resolvedMediaId || resolvedMediaId.length !== 11) {
        setErrorMsg(
          locale === "az"
            ? "Düzgün YouTube video linki və ya ID daxil edin."
            : locale === "ru"
            ? "Введите действительную ссылку или ID видео YouTube."
            : "Please enter a valid YouTube video URL or ID."
        );
        return;
      }
    } else {
      if (!movie?.id) {
        setErrorMsg(
          locale === "az"
            ? "Zəhmət olmasa əvvəlcə bir film/serial seçin və ya YouTube linki daxil edin."
            : locale === "ru"
            ? "Пожалуйста, сначала выберите фильм/сериал или введите ссылку YouTube."
            : "Please select a movie/show first or enter a YouTube URL."
        );
        return;
      }
      resolvedMediaId = String(movie.id);
    }

    setLoading(true);
    const code = generateRoomCode();

    try {
      const roomPayload = {
        code,
        host_id: user.id,
        title: roomTitle.trim() || (locale === "az" ? "Kino Otağı" : "Watch Room"),
        media_type: mediaType,
        media_id: resolvedMediaId,
        season: 1,
        episode: 1,
        is_private: isPrivate,
        host_only_control: hostOnlyControl,
        max_participants: Math.min(4, Math.max(2, maxParticipants)),
      };

      const { data, error } = await supabase.from("rooms").insert(roomPayload).select().single();

      if (error) {
        console.warn("Room insert warning:", error.message);
      }

      setWatchPartyModalOpen(false);
      router.push(`/room/${code}`);
    } catch (err: any) {
      setErrorMsg(err?.message || "Otaq yaradılarkən xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMsg(
        locale === "az"
          ? "6 simvollu otaq kodunu düzgün daxil edin."
          : locale === "ru"
          ? "Введите правильный 6-значный код комнаты."
          : "Please enter a valid 6-character room code."
      );
      return;
    }

    setLoading(true);

    try {
      const { data: room, error } = await supabase
        .from("rooms")
        .select("id, code, max_participants")
        .eq("code", cleanCode)
        .single();

      if (error && !error.message.includes("schema cache")) {
        setErrorMsg(
          locale === "az"
            ? "Otaq tapılmadı. Kodu yoxlayın."
            : locale === "ru"
            ? "Комната не найдена. Проверьте код."
            : "Room not found. Check code."
        );
        setLoading(false);
        return;
      }

      setWatchPartyModalOpen(false);
      router.push(`/room/${cleanCode}`);
    } catch {
      setWatchPartyModalOpen(false);
      router.push(`/room/${cleanCode}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.95, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 16 }}
          className="relative w-full max-w-md bg-ink-2 border border-ink-4 shadow-lifted rounded-xs p-6 space-y-5 text-ink-9"
          id="watch-party-modal"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink-4 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-live" />
              <h3 className="text-body-lg font-semibold">
                {locale === "az"
                  ? "Birlikdə İzlə (Watch Party)"
                  : locale === "ru"
                  ? "Совместный Просмотр"
                  : "Watch Party Room"}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="ctl ctl-ghost h-8 w-8 px-0 text-ink-6 hover:text-ink-9"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-ink-1 border border-ink-4 rounded-xs text-xs font-medium">
            <button
              type="button"
              id="watch-tab-create"
              onClick={() => {
                setTab("create");
                setErrorMsg(null);
              }}
              className={`py-1.5 rounded-xs transition-colors flex items-center justify-center gap-1.5 ${
                tab === "create"
                  ? "bg-ink-3 text-ink-9 font-semibold shadow-xs"
                  : "text-ink-6 hover:text-ink-8"
              }`}
            >
              <Plus className="h-3.5 w-3.5 text-live" />
              <span>{locale === "az" ? "Otaq Yarat" : locale === "ru" ? "Создать" : "Create Room"}</span>
            </button>
            <button
              type="button"
              id="watch-tab-join"
              onClick={() => {
                setTab("join");
                setErrorMsg(null);
              }}
              className={`py-1.5 rounded-xs transition-colors flex items-center justify-center gap-1.5 ${
                tab === "join"
                  ? "bg-ink-3 text-ink-9 font-semibold shadow-xs"
                  : "text-ink-6 hover:text-ink-8"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>{locale === "az" ? "Koda Görə Qoşul" : locale === "ru" ? "Войти по Коду" : "Join Code"}</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 rounded-xs border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* CREATE ROOM FORM */}
          {tab === "create" && (
            <form onSubmit={handleCreateRoom} className="space-y-4" id="create-room-form">
              {/* Media Selection Pills */}
              <div className="space-y-1.5">
                <label className="block text-label text-ink-7">
                  {locale === "az" ? "Məzmun Növü" : locale === "ru" ? "Тип Контента" : "Media Type"}
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setMediaType("movie")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 border rounded-xs transition-colors ${
                      mediaType === "movie"
                        ? "border-live/40 bg-live/10 text-live font-semibold"
                        : "border-ink-4 bg-ink-1 text-ink-7 hover:text-ink-9"
                    }`}
                  >
                    <Film className="h-3.5 w-3.5" />
                    <span>Film</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType("tv")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 border rounded-xs transition-colors ${
                      mediaType === "tv"
                        ? "border-live/40 bg-live/10 text-live font-semibold"
                        : "border-ink-4 bg-ink-1 text-ink-7 hover:text-ink-9"
                    }`}
                  >
                    <Tv className="h-3.5 w-3.5" />
                    <span>Serial</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType("youtube")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 border rounded-xs transition-colors ${
                      mediaType === "youtube"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-300 font-semibold"
                        : "border-ink-4 bg-ink-1 text-ink-7 hover:text-ink-9"
                    }`}
                  >
                    <YoutubeIcon className="h-3.5 w-3.5 text-red-500" />
                    <span>YouTube</span>
                  </button>
                </div>
              </div>

              {/* YouTube Input or Selected Movie Info */}
              {mediaType === "youtube" ? (
                <div className="space-y-1">
                  <label className="block text-label text-ink-7" htmlFor="room-yt-url">
                    YouTube URL / Video ID
                  </label>
                  <input
                    id="room-yt-url"
                    type="text"
                    required
                    value={youtubeInput}
                    onChange={(e) => setYoutubeInput(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="inp w-full text-xs font-mono"
                  />
                </div>
              ) : (
                <div className="p-3 bg-ink-1 border border-ink-4 rounded-xs space-y-1">
                  <span className="text-label text-ink-6">
                    {locale === "az" ? "Seçilmiş Məzmun:" : "Selected Media:"}
                  </span>
                  <p className="text-small font-medium text-ink-9 truncate">
                    {movie ? movie.title : locale === "az" ? "Film seçilməyib (Zərləri atın)" : "No movie selected"}
                  </p>
                </div>
              )}

              {/* Room Title */}
              <div className="space-y-1">
                <label className="block text-label text-ink-7" htmlFor="room-title">
                  {locale === "az" ? "Otaq Adı" : locale === "ru" ? "Название Комнаты" : "Room Title"}
                </label>
                <input
                  id="room-title"
                  type="text"
                  required
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                  className="inp w-full text-xs"
                />
              </div>

              {/* Room Controls (Private & Host-Only Controls) */}
              <div className="space-y-2 pt-1 border-t border-ink-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium text-ink-9">
                      {locale === "az" ? "Yalnız Host İdarə Edə Bilsin" : "Host-Only Playback Control"}
                    </span>
                    <p className="text-label text-ink-6">
                      {locale === "az" ? "Yalnız otaq sahibi dayandıra və irəli çəkə bilər" : "Only room host can play, pause, seek"}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hostOnlyControl}
                    onChange={(e) => setHostOnlyControl(e.target.checked)}
                    className="cursor-pointer accent-live h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium text-ink-9">
                      {locale === "az" ? "Maksimum İştirakçı (Max 4)" : "Max Participants (Max 4)"}
                    </span>
                  </div>
                  <select
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Number(e.target.value))}
                    className="inp text-xs py-0.5 px-2 cursor-pointer"
                  >
                    <option value={2}>2 Nəfər</option>
                    <option value={3}>3 Nəfər</option>
                    <option value={4}>4 Nəfər (Maksimum)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                id="create-room-submit-btn"
                className="ctl ctl-primary w-full h-9 text-xs font-semibold mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{locale === "az" ? "Otaq yaradılır..." : "Creating room..."}</span>
                  </>
                ) : (
                  <>
                    <Users className="h-3.5 w-3.5" />
                    <span>{locale === "az" ? "Otağı Başlat (Start Room)" : "Start Watch Party"}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* JOIN ROOM FORM */}
          {tab === "join" && (
            <form onSubmit={handleJoinRoom} className="space-y-4" id="join-room-form">
              <div className="space-y-1.5 text-center py-2">
                <label className="block text-small font-medium text-ink-8" htmlFor="join-room-code">
                  {locale === "az" ? "6-Rəqəmli Otaq Kodunu Daxil Edin" : "Enter 6-Character Room Code"}
                </label>
                <input
                  id="join-room-code"
                  type="text"
                  required
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="X7K9P2"
                  className="inp w-full text-center font-mono text-body-lg font-bold tracking-[0.25em] uppercase py-2"
                />
              </div>

              <button
                type="submit"
                disabled={loading || joinCode.length !== 6}
                id="join-room-submit-btn"
                className="ctl ctl-primary w-full h-9 text-xs font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LogIn className="h-3.5 w-3.5" />
                )}
                <span>{locale === "az" ? "Otağa Daxil Ol" : "Join Party"}</span>
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
