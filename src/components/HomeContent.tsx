"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Header as TopBar } from "@/components/Header";
import { FilterPanel } from "@/components/FilterPanel";
import { RouletteButton } from "@/components/RouletteButton";
import { MovieCard } from "@/components/MovieCard";
import { SidebarMenu } from "@/components/SidebarMenu";
import { HistoryView } from "@/components/HistoryView";
import { FavouritesView } from "@/components/FavouritesView";
import { MobileAppView } from "@/components/MobileAppView";
import { HelpView } from "@/components/HelpView";

import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { getImageUrl, Genre } from "@/lib/tmdb";

const EASE = [0.19, 1, 0.22, 1] as const;

export function HomeContent({ genres }: { genres: Genre[] }) {
  const { locale, movie, isLoading, activeView } = useStore();
  const t = getTranslations(locale);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (movie && resultRef.current && activeView === "random") {
      const timer = setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [movie, activeView]);

  const backdrop = getImageUrl(movie?.backdrop_path ?? null, "original");
  const showBackdrop = activeView === "random" && !!backdrop;

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* The film supplies the only colour on the page. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden sm:h-[560px]"
        aria-hidden="true"
      >
        <AnimatePresence mode="wait">
          {showBackdrop && (
            <motion.div
              key={movie!.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
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
        <div className="absolute inset-x-0 top-0 h-[72px] bg-gradient-to-b from-bg/90 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-bg via-bg/85 to-transparent" />
      </div>

      <TopBar />
      <SidebarMenu />

      <main className="relative flex-1">
        {activeView === "random" && (
          <>
            <section className="mx-auto w-full max-w-[960px] px-6 pb-8 pt-10 sm:pt-16">
              <h1 className="max-w-[18ch] text-h2 font-semibold leading-[1.125] text-heading sm:text-h1">
                {t("site.tagline")}
              </h1>
              <p className="mt-3 max-w-[62ch] font-serif text-body-lg leading-[1.6] text-ink-high">
                {t("site.description")}
              </p>

              <div className="mt-8 rounded-panel border border-surface-alt bg-surface/60 p-4 backdrop-blur-sm sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                  <div className="min-w-0 flex-1">
                    <FilterPanel genres={genres} />
                  </div>
                  <div className="shrink-0 lg:pb-0">
                    <RouletteButton />
                  </div>
                </div>
              </div>
            </section>

            <div ref={resultRef} className="scroll-mt-[72px]">
              {isLoading && <ResultSkeleton />}
              {!isLoading && !movie && <FirstRun label={t("site.badge")} />}
              <MovieCard />
            </div>
          </>
        )}

        {activeView === "history" && <HistoryView />}
        {activeView === "favourites" && <FavouritesView />}
        {activeView === "mobileapp" && <MobileAppView />}
        {activeView === "help" && <HelpView />}
      </main>

      <footer className="mt-16 border-t border-surface-alt py-6">
        <p className="mx-auto max-w-[960px] px-6 text-tiny text-meta">
          {t("site.footer")}
        </p>
      </footer>
    </div>
  );
}

/* Holds the result's shape while it loads, so the page does not jump. */
function ResultSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[960px] px-6 pb-12" aria-hidden="true">
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        <div className="poster w-[180px] shrink-0 sm:w-[230px]">
          <span className="skeleton" />
        </div>
        <div className="flex-1 space-y-3 pt-2">
          <Bar className="h-7 w-2/3" />
          <Bar className="h-4 w-1/3" />
          <Bar className="mt-6 h-3 w-full" />
          <Bar className="h-3 w-full" />
          <Bar className="h-3 w-4/5" />
        </div>
      </div>
    </div>
  );
}

/* Before the first roll the page would otherwise be a filter bar over nothing.
   Three blank frames stand in for the result, so the shape is legible first. */
function FirstRun({ label }: { label: string }) {
  return (
    <div className="mx-auto w-full max-w-[960px] px-6 pb-12">
      <div className="flex items-center gap-4 border border-dashed border-surface-alt p-6 sm:gap-6 sm:p-8">
        <div className="flex shrink-0 gap-2" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-9 rounded-[2px] bg-poster-inset sm:w-12"
              style={{ aspectRatio: "2 / 3", opacity: 1 - i * 0.28 }}
            />
          ))}
        </div>
        <p className="font-serif text-body-lg leading-[1.6] text-meta">{label}</p>
      </div>
    </div>
  );
}

function Bar({ className }: { className: string }) {
  return (
    <div
      className={`animate-skeleton rounded-[2px] bg-poster-inset ${className}`}
    />
  );
}
