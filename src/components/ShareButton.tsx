"use client";

import { Link2, Download, Check } from "lucide-react";
import { useState } from "react";
import { Movie } from "@/lib/tmdb";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";

/** Renders bare `.btn` elements so it can sit inside the card's action row. */
export function ShareButton({ movie }: { movie: Movie }) {
  const [isCopied, setIsCopied] = useState(false);
  const { locale } = useStore();
  const t = getTranslations(locale);

  const ogUrl = `/api/og?title=${encodeURIComponent(movie.title)}&poster=${
    movie.poster_path ? encodeURIComponent(movie.poster_path) : ""
  }&rating=${movie.vote_average.toFixed(1)}&year=${
    movie.release_date ? movie.release_date.split("-")[0] : ""
  }&genres=${
    movie.genres
      ? encodeURIComponent(movie.genres.map((g) => g.name).join(", "))
      : ""
  }`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${ogUrl}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <>
      <button type="button" onClick={handleCopyLink} className="btn btn-quiet">
        {isCopied ? (
          <Check className="h-4 w-4 text-green" />
        ) : (
          <Link2 className="h-4 w-4" />
        )}
        {isCopied ? t("share.copied") : t("share.copyLink")}
      </button>

      <a
        href={ogUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-quiet"
        title={t("share.download")}
      >
        <Download className="h-4 w-4" />
        <span className="sr-only">{t("share.download")}</span>
      </a>
    </>
  );
}
