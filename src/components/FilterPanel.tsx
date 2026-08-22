"use client";

import { useStore } from "@/store/useStore";
import { Genre, LANGUAGE_CODES } from "@/lib/tmdb";
import { getTranslations } from "@/lib/i18n";

/** Vertical instrument panel. Dense rows, label above field, no boxes. */
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
  const ratingKeys = ["", "9-10", "8-10", "7-10", "6-10", "5-10", "0-5"];

  return (
    <div className="space-y-4">
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
              {t(`genres.${g.id}`)}
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
