"use client";

import { useStore } from "@/store/useStore";
import { Genre, LANGUAGE_CODES } from "@/lib/tmdb";
import { SlidersHorizontal } from "lucide-react";
import { getTranslations } from "@/lib/i18n";

export function FilterPanel({ genres }: { genres: Genre[] }) {
  const {
    genre,
    yearFrom,
    yearTo,
    originalLanguage,
    imdbRange,
    setGenre,
    setYearFrom,
    setYearTo,
    setOriginalLanguage,
    setImdbRange,
    isLoading,
    locale,
  } = useStore();

  const t = getTranslations(locale);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const selectClass =
    "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 appearance-none cursor-pointer";

  const ratingKeys = ["", "9-10", "8-10", "7-10", "6-10", "5-10", "0-5"];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-4 text-muted-foreground">
        <SlidersHorizontal className="w-4 h-4" />
        <span className="text-sm font-medium">{t("filters.title")}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-card text-card-foreground rounded-2xl shadow-sm border border-border">
        {/* Genre */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wider">
            {t("filters.genre")}
          </label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            disabled={isLoading}
            className={selectClass}
          >
            <option value="">{t("filters.genreAll")}</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id.toString()}>
                {t(`genres.${g.id}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Year Range */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wider">
            {t("filters.year")}
          </label>
          <div className="flex gap-1.5 items-center">
            <select
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              disabled={isLoading}
              className={selectClass}
            >
              <option value="">{t("filters.yearFrom")}</option>
              {years.map((y) => (
                <option key={y} value={y.toString()}>
                  {y}
                </option>
              ))}
            </select>
            <span className="text-muted-foreground text-xs shrink-0">–</span>
            <select
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              disabled={isLoading}
              className={selectClass}
            >
              <option value="">{t("filters.yearTo")}</option>
              {years.map((y) => (
                <option key={y} value={y.toString()}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wider">
            {t("filters.language")}
          </label>
          <select
            value={originalLanguage}
            onChange={(e) => setOriginalLanguage(e.target.value)}
            disabled={isLoading}
            className={selectClass}
          >
            {LANGUAGE_CODES.map((code) => (
              <option key={code} value={code}>
                {t(`languages.${code}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wider">
            {t("filters.rating")}
          </label>
          <select
            value={imdbRange}
            onChange={(e) => setImdbRange(e.target.value)}
            disabled={isLoading}
            className={selectClass}
          >
            {ratingKeys.map((key) => (
              <option key={key} value={key}>
                {t(`ratingOptions.${key}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
