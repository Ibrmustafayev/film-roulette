"use client";

import Link from "next/link";
import { Dice5 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useStore } from "@/store/useStore";
import { getTranslations, LOCALE_LABELS, Locale } from "@/lib/i18n";

import { SearchBar } from "./SearchBar";

export function Header() {
  const { locale, setLocale } = useStore();
  const t = getTranslations(locale);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-auto min-h-[64px] py-3 md:py-0 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center space-x-2 order-1">
          <Dice5 className="w-8 h-8 text-primary" />
          <span className="font-bold text-xl tracking-tight text-foreground hidden sm:inline-block">
            {t("site.name")}
          </span>
        </Link>

        <SearchBar />

        <div className="flex items-center gap-2 md:gap-3 order-2 md:order-3">
          {/* Language Selector */}
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="bg-muted text-foreground border border-border rounded-lg px-2 pr-8 py-1.5 text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer appearance-none"
            aria-label={t("lang.label")}
          >
            {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(
              ([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              )
            )}
          </select>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
