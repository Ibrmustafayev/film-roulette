"use client";

import { Menu } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getTranslations, LOCALE_LABELS, Locale } from "@/lib/i18n";
import { SearchBar } from "./SearchBar";

export function Header() {
  const { locale, setLocale, setMenuOpen, setActiveView } = useStore();
  const t = getTranslations(locale);

  return (
    <header className="sticky top-0 z-50 h-[72px] border-b border-surface-alt bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[960px] items-center gap-4 px-6">
        <button
          type="button"
          onClick={() => setActiveView("random")}
          className="flex shrink-0 items-center gap-2.5"
        >
          <Pips />
          <span className="hidden text-h5 font-semibold tracking-tight text-heading sm:inline">
            {t("site.name")}
          </span>
        </button>

        <SearchBar />

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <label className="sr-only" htmlFor="locale">
            {t("lang.label")}
          </label>
          <select
            id="locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="field h-8 w-auto cursor-pointer text-tiny font-semibold uppercase tracking-[0.075em]"
          >
            {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(
              ([code, label]) => (
                <option key={code} value={code} className="bg-surface">
                  {label}
                </option>
              )
            )}
          </select>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="btn btn-quiet h-8 px-2.5"
            aria-label={t("menu.open")}
          >
            <Menu className="h-4 w-4" />
            <span className="hidden text-tiny uppercase tracking-[0.075em] sm:inline">
              {t("menu.title") || "Menu"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

/* Three pips: the brand mark, and the only place the three accents sit together. */
function Pips() {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      <span className="h-2.5 w-2.5 rounded-full bg-green" />
      <span className="h-2.5 w-2.5 rounded-full bg-orange" />
      <span className="h-2.5 w-2.5 rounded-full bg-blue" />
    </span>
  );
}
