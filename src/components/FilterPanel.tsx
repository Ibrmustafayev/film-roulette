"use client";

import { useStore, ContentType } from "@/store/useStore";
import { Genre, LANGUAGE_CODES } from "@/lib/tmdb";
import { getTranslations } from "@/lib/i18n";
import { Film, Tv, Clapperboard } from "lucide-react";

/** Vertical instrument panel. Dense rows, label above field, no boxes. */
export function FilterPanel({ genres }: { genres: Genre[] }) {
  const {
    contentType,
    genre,
    yearFrom,
    yearTo,
    originalLanguage,
    imdbRange,
    setContentType,
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
  const ratingKeys = ["", "9-10", "8-10", "7-10", "6-10", "5-10", "0-5"];

  const contentTypes: Array<{ key: ContentType; label: string; icon: typeof Film }> = [
    { key: "all", label: t("filters.typeAll"), icon: Clapperboard },
    { key: "movie", label: t("filters.typeMovie"), icon: Film },
    { key: "tv", label: t("filters.typeTv"), icon: Tv },
  ];

  return (
    <div className="space-y-4">
      {/* Content Type Filter */}
      <Row label={t("filters.contentType")} htmlFor="f-type">
        <div className="grid grid-cols-3 gap-1">
          {contentTypes.map(({ key, label, icon: Icon }) => {
            const active = contentType === key;
            return (
              <button
                key={key}
                type="button"
                id={key === "all" ? "f-type" : undefined}
                onClick={() => setContentType(key)}
                disabled={isLoading}
                title={label}
                aria-pressed={active}
                className={`flex h-8 items-center justify-center gap-1.5 px-2 text-label transition-colors duration-[120ms] ${
                  active
                    ? "border border-live/40 bg-live/15 text-live font-semibold"
                    : "border border-ink-4 bg-ink-3/40 text-ink-7 hover:border-ink-5 hover:text-ink-9"
                }`}
              >
                <Icon className="h-3 w-3 shrink-0" />
                <span className="truncate text-[10px] uppercase tracking-wider">
                  {key === "all" ? "All" : key === "movie" ? "Movie" : "Series"}
                </span>
              </button>
            );
          })}
        </div>
      </Row>

      <Row label={t("filters.genre")} htmlFor="f-genre">
        <select
          id="f-genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          disabled={isLoading}
          className="inp"
        >
          <option value="">{t("filters.genreAll")}</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id.toString()}>
              {t(`genres.${g.id}`) || g.name}
            </option>
          ))}
        </select>
      </Row>

      <Row label={t("filters.year")} htmlFor="f-year-from">
        <div className="flex items-center gap-1.5">
          <select
            id="f-year-from"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
            disabled={isLoading}
            className="inp font-(family-name:--font-data)"
            aria-label={t("filters.yearFrom")}
          >
            <option value="">{t("filters.yearFrom")}</option>
            {years.map((y) => (
              <option key={y} value={y.toString()}>
                {y}
              </option>
            ))}
          </select>
          <span className="text-ink-6">–</span>
          <select
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
            disabled={isLoading}
            className="inp font-(family-name:--font-data)"
            aria-label={t("filters.yearTo")}
          >
            <option value="">{t("filters.yearTo")}</option>
            {years.map((y) => (
              <option key={y} value={y.toString()}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </Row>

      <Row label={t("filters.language")} htmlFor="f-lang">
        <select
          id="f-lang"
          value={originalLanguage}
          onChange={(e) => setOriginalLanguage(e.target.value)}
          disabled={isLoading}
          className="inp"
        >
          {LANGUAGE_CODES.map((code) => (
            <option key={code} value={code}>
              {t(`languages.${code}`)}
            </option>
          ))}
        </select>
      </Row>

      <Row label={t("filters.rating")} htmlFor="f-rating">
        <select
          id="f-rating"
          value={imdbRange}
          onChange={(e) => setImdbRange(e.target.value)}
          disabled={isLoading}
          className="inp"
        >
          {ratingKeys.map((key) => (
            <option key={key} value={key}>
              {t(`ratingOptions.${key}`)}
            </option>
          ))}
        </select>
      </Row>
    </div>
  );
}

function Row({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="rail-label mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}
