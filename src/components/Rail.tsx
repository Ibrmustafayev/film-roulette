"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dice5, Clock, Heart, Smartphone, HelpCircle, X } from "lucide-react";

import { useStore } from "@/store/useStore";
import { getTranslations, LOCALE_LABELS, Locale } from "@/lib/i18n";
import { Genre } from "@/lib/tmdb";
import { Logo } from "./Mark";
import { SearchBar } from "./SearchBar";
import { FilterPanel } from "./FilterPanel";
import { RouletteButton } from "./RouletteButton";

const NAV = [
  { key: "random" as const, icon: Dice5 },
  { key: "history" as const, icon: Clock },
  { key: "favourites" as const, icon: Heart },
  { key: "mobileapp" as const, icon: Smartphone },
  { key: "help" as const, icon: HelpCircle },
];

const EASE = [0.2, 0.8, 0.2, 1] as const;

/** The instrument. Dense, hard-cornered, hairline-ruled — the opposite of the stage. */
export function RailContent({ genres }: { genres: Genre[] }) {
  const {
    locale, setLocale, activeView, setActiveView,
    history, favourites,
  } = useStore();
  const t = getTranslations(locale);

  const counts: Record<string, number> = {
    history: history.length,
    favourites: favourites.length,
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-4 px-5 py-5">
        <Logo id="desktop-site-logo-btn" />
      </div>

      <div className="border-b border-ink-4 px-5 py-4">
        <SearchBar />
      </div>

      <nav className="border-b border-ink-4 px-3 py-3">
        <ul>
          {NAV.map(({ key, icon: Icon }) => {
            const active = activeView === key;
            const count = counts[key];
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => setActiveView(key)}
                  aria-current={active ? "page" : undefined}
                  className={`group flex h-7 w-full items-center gap-2.5 px-2 text-small transition-colors duration-[120ms] ${
                    active
                      ? "text-ink-9"
                      : "text-ink-7 hover:text-ink-9"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      active ? "text-live" : "text-ink-6 group-hover:text-ink-7"
                    }`}
                  />
                  <span className="flex-1 text-left">{t(`menu.${key}`)}</span>
                  {count > 0 && (
                    <span className="text-label text-ink-6" data-num>
                      {count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* The instrument panel proper */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <h2 className="rail-heading mb-3">{t("filters.title")}</h2>
        <FilterPanel genres={genres} />
        <div className="mt-5">
          <RouletteButton id="rail-roll-dice-btn" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-ink-4 px-5 py-3">
        <label className="sr-only" htmlFor="rail-locale">
          {t("lang.label")}
        </label>
        <select
          id="rail-locale"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="inp h-7 w-auto cursor-pointer text-label uppercase tracking-[0.12em]"
        >
          {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(
            ([code, label]) => (
              <option key={code} value={code} className="bg-ink-3">
                {label}
              </option>
            )
          )}
        </select>
        <span className="rail-label truncate">TMDB</span>
      </div>
    </div>
  );
}

/** Fixed rail at xl and above; a drawer below it. */
export function Rail({ genres }: { genres: Genre[] }) {
  const { isMenuOpen, setMenuOpen, locale } = useStore();
  const t = getTranslations(locale);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMenuOpen, setMenuOpen]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-(--rail-width) border-r border-ink-4 bg-ink-2 xl:block">
        <RailContent genres={genres} />
      </aside>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: EASE }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-ink-0/80 xl:hidden"
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={t("menu.title") || "Menu"}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.24, ease: EASE }}
              className="fixed inset-y-0 left-0 z-50 w-(--rail-width) max-w-[85vw] border-r border-ink-4 bg-ink-2 shadow-lifted xl:hidden"
            >
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label={t("menu.close")}
                className="ctl ctl-bare absolute right-2 top-3 h-7 w-7 px-0"
              >
                <X className="h-4 w-4" />
              </button>
              <RailContent genres={genres} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
