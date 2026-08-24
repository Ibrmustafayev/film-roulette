"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, User, Users } from "lucide-react";

import { Rail } from "@/components/Rail";
import { Mark, Logo } from "@/components/Mark";
import { MovieCard } from "@/components/MovieCard";
import { HistoryView } from "@/components/HistoryView";
import { FavouritesView } from "@/components/FavouritesView";
import { MobileAppView } from "@/components/MobileAppView";
import { HelpView } from "@/components/HelpView";
import { RouletteButton } from "@/components/RouletteButton";
import { SearchBar } from "@/components/SearchBar";
import { ContinueWatching } from "@/components/WatchHistory";
import { AdGuardBanner } from "@/components/AdGuardBanner";

import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { getImageUrl, getMovieDetails, getTVDetails, Genre, Movie } from "@/lib/tmdb";
import { PosterTile, PosterWall } from "@/components/PosterTile";

const EASE = [0.2, 0.8, 0.2, 1] as const;

export function HomeContent({
  genres,
  popular = [],
  initialMovie,
  initialSeason,
  initialEpisode,
}: {
  genres: Genre[];
  popular?: Movie[];
  initialMovie?: Movie;
  initialSeason?: number;
  initialEpisode?: number;
}) {
  const {
    locale,
    movie,
    setMovie,
    isLoading,
    activeView,
    setActiveView,
    setMenuOpen,
    selectedSeason,
    setSelectedSeason,
    selectedEpisode,
    setSelectedEpisode,
  } = useStore();
  const t = getTranslations(locale);
  const stageRef = useRef<HTMLDivElement>(null);

  // Initialize store from deep link on mount
  useEffect(() => {
    if (initialMovie) {
      setMovie(initialMovie);
      setActiveView("random");
      if (initialSeason) setSelectedSeason(initialSeason);
      if (initialEpisode) setSelectedEpisode(initialEpisode);
    }
  }, [initialMovie, initialSeason, initialEpisode, setMovie, setActiveView, setSelectedSeason, setSelectedEpisode]);

  // Sync browser URL dynamically with the current active movie or view
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (activeView === "random") {
      if (movie) {
        const isTv = movie.media_type === "tv" || !!movie.number_of_seasons;
        let targetPath = "";
        if (isTv) {
          if (selectedSeason && selectedEpisode && (selectedSeason > 1 || selectedEpisode > 1)) {
            targetPath = `/tv/${movie.id}?season=${selectedSeason}&episode=${selectedEpisode}`;
          } else {
            targetPath = `/tv/${movie.id}`;
          }
        } else {
          targetPath = `/movie/${movie.id}`;
        }

        if (window.location.pathname + window.location.search !== targetPath) {
          window.history.replaceState(
            { ...window.history.state, as: targetPath, url: targetPath },
            "",
            targetPath
          );
        }
      } else {
        if (window.location.pathname !== "/" && !window.location.pathname.startsWith("/api")) {
          window.history.replaceState(
            { ...window.history.state, as: "/", url: "/" },
            "",
            "/"
          );
        }
      }
    }
  }, [movie, activeView, selectedSeason, selectedEpisode]);

  useEffect(() => {
    if (movie && stageRef.current && activeView === "random") {
      const timer = setTimeout(() => {
        stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [movie, activeView]);

  const backdrop = getImageUrl(movie?.backdrop_path ?? null, "original");
  const showBackdrop = activeView === "random" && !!backdrop;

  return (
    <div className="flex min-h-screen flex-col bg-ink-1 xl:pl-(--rail-width)">
      <Rail genres={genres} />

      {/* Compact bar below xl only — the rail carries navigation above it. */}
      <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-ink-4 bg-ink-1/95 px-4 backdrop-blur-sm xl:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("menu.open")}
            className="ctl ctl-ghost h-8 w-8 px-0"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Logo id="mobile-site-logo-btn" markSize={18} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => useStore.getState().setWatchPartyModalOpen(true)}
            id="mobile-watch-party-btn"
            className="ctl ctl-ghost h-8 gap-1.5 px-2.5 text-xs text-amber-300 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
          >
            <Users className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[11px] font-semibold">Party</span>
          </button>

          {useStore.getState().user ? (
            <div className="h-7 w-7 rounded-full bg-live/15 text-live border border-live/30 flex items-center justify-center text-xs font-bold">
              {useStore.getState().profile?.username?.charAt(0).toUpperCase() || "U"}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => useStore.getState().setAuthModalOpen(true)}
              id="mobile-auth-login-btn"
              className="ctl ctl-ghost h-8 w-8 px-0 text-ink-7 border border-ink-4"
              title="Sign In"
            >
              <User className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <main className="relative flex-1">
        {activeView === "random" && (
          <>
            {/* Stage backdrop: the film supplies the only colour on the page. */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[380px] overflow-hidden sm:h-[520px]"
              aria-hidden="true"
            >
              <AnimatePresence mode="wait">
                {showBackdrop && (
                  <motion.div
                    key={movie!.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.55 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.42, ease: EASE }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={backdrop!}
                      alt=""
                      fill
                      priority
                      className="object-cover object-top"
                      sizes="100vw"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-r from-ink-1 via-ink-1/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink-1 to-transparent" />
            </div>

            <div ref={stageRef} className="relative scroll-mt-14">
              {isLoading && <StageSkeleton />}
              {!isLoading && !movie && (
                <Idle
                  headline={t("site.tagline")}
                  body={t("site.description")}
                  note={t("site.badge")}
                  popular={popular}
                />
              )}
              {movie && <MovieCard />}
            </div>
          </>
        )}

        {activeView === "history" && <HistoryView />}
        {activeView === "favourites" && <FavouritesView />}
        {activeView === "mobileapp" && <MobileAppView />}
        {activeView === "help" && <HelpView />}
      </main>

      <footer className="mt-24 border-t border-ink-4">
        <div className="stage-pad py-6">
          <p className="text-label uppercase tracking-[0.12em] text-ink-7">
            {t("site.footer")}
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Before the first roll. Not a card and not an apology for empty space — the
 * proposition set at display size, so the stage reads as waiting, not blank.
 */
function Idle({
  headline,
  body,
  note,
  popular,
}: {
  headline: string;
  body: string;
  note: string;
  popular: Movie[];
}) {
  const { setMovie, setIsLoading, locale } = useStore();
  const t = getTranslations(locale);

  /* The wall is not decoration: picking a poster loads that film/show, the same as
     rolling would. Details are fetched through the internal proxy. */
  const pick = async (m: Movie) => {
    setIsLoading(true);
    try {
      const isTv = m.media_type === "tv" || !!m.number_of_seasons;
      const lang = locale === "az" ? "az-AZ" : locale === "ru" ? "ru-RU" : "en-US";
      const details = isTv
        ? await getTVDetails(m.id, lang)
        : await getMovieDetails(m.id, lang);
      setMovie({ ...m, ...details });
    } catch (error) {
      console.error("Select error:", error);
      setMovie(m);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="stage-pad pt-16 sm:pt-24">
      <div className="grid gap-x-10 gap-y-8 sm:grid-cols-12">
        <div className="sm:col-span-11 lg:col-span-9">
          <h1 className="max-w-[15ch] text-title leading-[1.1] tracking-[-0.02em] text-ink-9 lg:text-display lg:leading-[1.02] lg:tracking-[-0.03em]">
            {headline}
          </h1>
          <p className="mt-6 max-w-[58ch] font-prose text-[1.0625rem] leading-[1.65] text-ink-7">
            {body}
          </p>
        </div>
      </div>

      <div className="stage-rule mt-12" />

      <div className="mt-5 flex items-center gap-4">
        <Mark size={28} className="shrink-0 text-ink-5" />
        <p className="text-label uppercase tracking-[0.12em] text-ink-6">
          {note}
        </p>
      </div>

      {/* Responsive AdGuard Recommendation Banner */}
      <AdGuardBanner />

      {/* Quick Search & Roll button on Mobile idle view (between site badge and Popular Now) */}
      <div className="mt-6 max-w-xs space-y-3 xl:hidden">
        <SearchBar />
        <RouletteButton id="mobile-roll-dice-btn" />
      </div>

      {/* Continue Watching Section (YouTube/Netflix Style) */}
      <ContinueWatching />

      {popular.length > 0 && (
        <section className="mt-12 sm:mt-14">
          <h2 className="rail-heading mb-5">{t("home.popular")}</h2>
          <PosterWall>
            {popular.map((m, i) => (
              <PosterTile key={`${m.media_type || "item"}-${m.id}`} movie={m} index={i} onSelect={pick} />
            ))}
          </PosterWall>
        </section>
      )}
    </div>
  );
}

/** Holds the result's shape while it loads so the stage does not jump. */
function StageSkeleton() {
  return (
    <div className="stage-pad pt-10 sm:pt-16" aria-hidden="true">
      <div className="grid gap-8 sm:grid-cols-12">
        <div className="sm:col-span-4 lg:col-span-3">
          <div className="poster">
            <span className="skeleton-cell absolute inset-0" />
          </div>
        </div>
        <div className="space-y-4 sm:col-span-8 lg:col-span-9">
          <div className="skeleton-cell h-11 w-3/5" />
          <div className="skeleton-cell h-4 w-1/4" />
          <div className="mt-8 space-y-2">
            <div className="skeleton-cell h-3 w-full" />
            <div className="skeleton-cell h-3 w-full" />
            <div className="skeleton-cell h-3 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
