"use client";

import { Link2, Download, Check, Twitter } from "lucide-react";
import { useState } from "react";
import { Movie } from "@/lib/tmdb";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";

export function ShareButton({ movie }: { movie: Movie }) {
  const [isCopied, setIsCopied] = useState(false);
  const { locale } = useStore();
  const t = getTranslations(locale);

  const ogUrl = `/api/og?title=${encodeURIComponent(movie.title)}&poster=${movie.poster_path ? encodeURIComponent(movie.poster_path) : ""}&rating=${movie.vote_average.toFixed(1)}&year=${movie.release_date ? movie.release_date.split("-")[0] : ""}&genres=${movie.genres ? encodeURIComponent(movie.genres.map((g) => g.name).join(", ")) : ""}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${ogUrl}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {}
  };

  const twitterText = t("share.ogText", { title: movie.title, year: movie.release_date ? movie.release_date.split("-")[0] : "", rating: movie.vote_average.toFixed(1) });
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;

  return (
    <div className="flex gap-2">
      <button onClick={handleCopyLink} className="flex-1 flex items-center justify-center gap-2 bg-muted hover:bg-muted/70 text-foreground border border-border px-4 py-2.5 rounded-xl transition-all text-sm font-medium">
        {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
        <span>{isCopied ? t("share.copied") : t("share.copyLink")}</span>
      </button>
      <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-muted hover:bg-muted/70 text-foreground border border-border px-4 py-2.5 rounded-xl transition-all text-sm font-medium">
        <Twitter className="w-4 h-4" />
        <span>{t("share.share")}</span>
      </a>
      <a href={ogUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center bg-muted hover:bg-muted/70 text-foreground border border-border px-3 py-2.5 rounded-xl transition-all" title={t("share.download")}>
        <Download className="w-4 h-4" />
      </a>
    </div>
  );
}
