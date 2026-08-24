"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  LogIn,
  Film,
  Tv,
  Crown,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
  Lock,
  Globe,
  Home,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { supabase, WatchRoom } from "@/lib/supabaseClient";
import { WatchPartyModal } from "@/components/WatchPartyModal";
import { AuthModal } from "@/components/AuthModal";

function YoutubeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export default function RoomsHubPage() {
  const { locale, user, profile, setWatchPartyModalOpen, setAuthModalOpen } = useStore();
  const t = getTranslations(locale);

  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [publicRooms, setPublicRooms] = useState<WatchRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "movie" | "tv" | "youtube">("all");

  /**
   * Why a participant landed back here. useRoomSync redirects with ?notice=
   * instead of firing a blocking alert(), so the reason can be rendered in the
   * viewer's own language.
   *
   * Read after mount rather than with useSearchParams(), which would require a
   * Suspense boundary on this prerendered page.
   */
  const [notice, setNotice] = useState<"kicked" | "closed" | null>(null);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("notice");
    if (value === "kicked" || value === "closed") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of a browser-only value
      setNotice(value);
      // Drop the query so a refresh does not resurrect the banner.
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("active_room_code");
        if (stored) setActiveCode(stored);
      }

      const { data, error } = await supabase
        .from("rooms")
        .select(`
          id,
          code,
          host_id,
          title,
          media_type,
          media_id,
          season,
          episode,
          is_private,
          host_only_control,
          max_participants,
          is_closed,
          created_at
        `)
        .eq("is_closed", false)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && !error) {
        setPublicRooms(data as WatchRoom[]);
      } else {
        // Sample starter public demo rooms if DB is empty
        setPublicRooms([
          {
            id: "demo-room-1",
            code: "DEMO01",
            host_id: "host-1",
            title: "Fight Club (1999) — Müzakirəli İzləmə",
            media_type: "movie",
            media_id: "550",
            is_private: false,
            host_only_control: false,
            max_participants: 4,
            created_at: new Date().toISOString(),
          },
          {
            id: "demo-room-2",
            code: "YTDEMO",
            host_id: "host-2",
            title: "Cyberpunk 2077 Anime Trailer & Soundtracks",
            media_type: "youtube",
            media_id: "dQw4w9WgXcQ",
            is_private: false,
            host_only_control: true,
            max_participants: 4,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const filteredRooms = publicRooms.filter((r) => {
    if (filterType !== "all" && r.media_type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-ink-1 text-ink-9">
      {/* Hub Top Bar */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink-4 bg-ink-2/95 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/" className="ctl ctl-ghost h-9 w-9 px-0 text-ink-7 hover:text-ink-9">
            <Home className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-live" />
            <h1 className="text-body-lg font-bold text-ink-9">
              {locale === "az"
                ? "Birlikdə İzlə Otaqları"
                : locale === "ru"
                ? "Комнаты Совместного Просмотра"
                : "Watch Party Hub"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setWatchPartyModalOpen(true)}
            id="hub-create-room-btn"
            className="ctl ctl-primary h-9 px-4 text-xs font-semibold flex items-center gap-2"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t("rooms.createRoom")}</span>
          </button>
        </div>
      </header>

      {notice && (
        <div className="border-b border-amber-500/30 bg-amber-500/10">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3">
            <p className="flex-1 text-small text-amber-200">
              {notice === "kicked" ? t("room.kickedByHost") : t("room.closedByHost")}
            </p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="ctl ctl-ghost h-8 px-3 text-xs"
            >
              {t("room.dismiss")}
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Active Room Reconnect Card (if user has active session) */}
        {activeCode && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-live/40 bg-live/10 backdrop-blur-xs shadow-lifted">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-live/20 text-live flex items-center justify-center">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-small font-bold text-ink-9">
                  {t("rooms.activeTitle")}
                </h4>
                <p className="text-label text-ink-7">
                  {t("rooms.activeHint", { code: activeCode ?? "" })}
                </p>
              </div>
            </div>

            <Link
              href={`/room/${activeCode}`}
              className="ctl ctl-primary h-8 px-4 text-xs font-semibold flex items-center gap-1.5"
            >
              <span>{t("rooms.rejoin")}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Filter and Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Media filter tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-ink-2 border border-ink-4 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded-md transition-colors ${
                filterType === "all"
                  ? "bg-ink-4 text-ink-9 font-semibold"
                  : "text-ink-6 hover:text-ink-8"
              }`}
            >
              {t("rooms.all")}
            </button>
            <button
              type="button"
              onClick={() => setFilterType("movie")}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                filterType === "movie"
                  ? "bg-live/15 text-live font-semibold"
                  : "text-ink-6 hover:text-ink-8"
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              <span>Film</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("tv")}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                filterType === "tv"
                  ? "bg-live/15 text-live font-semibold"
                  : "text-ink-6 hover:text-ink-8"
              }`}
            >
              <Tv className="h-3.5 w-3.5" />
              <span>Serial</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("youtube")}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                filterType === "youtube"
                  ? "bg-red-500/15 text-red-400 font-semibold"
                  : "text-ink-6 hover:text-ink-8"
              }`}
            >
              <YoutubeIcon className="h-3.5 w-3.5 text-red-500" />
              <span>YouTube</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-6" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("rooms.searchPlaceholder")}
              className="inp w-full pl-9 text-xs"
            />
          </div>
        </div>

        {/* Public Rooms Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-small font-bold text-ink-9 uppercase tracking-[0.1em]">
              {t("rooms.liveTitle")}
            </h2>
            <button
              type="button"
              onClick={loadRooms}
              className="ctl ctl-ghost h-7 gap-1 px-2 text-[11px] text-ink-6 hover:text-ink-9"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              <span>{t("rooms.refresh")}</span>
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-ink-6">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-live mb-2" />
              <span>{t("rooms.loading")}</span>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="py-16 text-center text-xs text-ink-6 border border-dashed border-ink-4 rounded-xl p-8 bg-ink-2/40">
              <Users className="mx-auto h-8 w-8 text-live/60 mb-3" />
              <p className="font-semibold text-ink-9 mb-1 text-small">
                {t("rooms.emptyTitle")}
              </p>
              <p className="text-label text-ink-6 mb-4">
                {t("rooms.emptyHint")}
              </p>
              <button
                type="button"
                onClick={() => setWatchPartyModalOpen(true)}
                className="ctl ctl-primary h-8 px-4 text-xs font-semibold"
              >
                {t("rooms.createNow")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex flex-col justify-between p-5 rounded-xl border border-ink-4 bg-ink-2/70 hover:border-ink-5 transition-all shadow-xs space-y-4"
                >
                  <div className="space-y-2.5">
                    {/* Media Type & Room Code Badge */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-semibold text-[11px] border border-ink-4 bg-ink-1">
                        {room.media_type === "youtube" ? (
                          <>
                            <YoutubeIcon className="h-3 w-3 text-red-500" />
                            <span className="text-red-400">YouTube</span>
                          </>
                        ) : room.media_type === "tv" ? (
                          <>
                            <Tv className="h-3 w-3 text-live" />
                            <span className="text-live">Serial</span>
                          </>
                        ) : (
                          <>
                            <Film className="h-3 w-3 text-live" />
                            <span className="text-live">Film</span>
                          </>
                        )}
                      </span>

                      <span className="font-mono text-xs font-bold text-ink-7 bg-ink-3 px-2 py-0.5 rounded-md">
                        {room.code}
                      </span>
                    </div>

                    {/* Room Title */}
                    <h3 className="text-small font-bold text-ink-9 line-clamp-2 leading-snug">
                      {room.title}
                    </h3>
                  </div>

                  {/* Room Meta & Join Button */}
                  <div className="flex items-center justify-between pt-3 border-t border-ink-4/60">
                    <div className="flex items-center gap-1 text-[11px] text-ink-6">
                      <Users className="h-3.5 w-3.5 text-live" />
                      <span>Max {room.max_participants || 4} nəfər</span>
                    </div>

                    <Link
                      href={`/room/${room.code}`}
                      className="ctl ctl-primary h-7 px-3 text-xs font-semibold flex items-center gap-1"
                    >
                      <span>{t("rooms.join")}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <WatchPartyModal />
      <AuthModal />
    </div>
  );
}
