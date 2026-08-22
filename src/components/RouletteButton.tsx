"use client";

import { useState } from "react";
import { Dice5, Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { getTranslations } from "@/lib/i18n";

/* The locale strings carry a leading dice emoji from the previous design. The
   button now has a real drawn icon, so the emoji would read as a second one.
   Strip it at render rather than editing every translation. */
const stripLeadingEmoji = (s: string) =>
  s.replace(/^[\p{Extended_Pictographic}️\s]+/u, "").trim();

export function RouletteButton() {
  const {
    genre,
    yearFrom,
    yearTo,
    originalLanguage,
    imdbRange,
    setMovie,
    isLoading,
    setIsLoading,
    locale,
  } = useStore();
  const [error, setError] = useState("");
  const t = getTranslations(locale);

  const rollDice = async () => {
    setIsLoading(true);
    setError("");
    setMovie(null);

    try {
      const params = new URLSearchParams();
      if (genre) params.append("genre", genre);
      if (yearFrom) params.append("yearFrom", yearFrom);
      if (yearTo) params.append("yearTo", yearTo);
      if (originalLanguage) params.append("originalLanguage", originalLanguage);
      if (imdbRange) params.append("imdbRange", imdbRange);

      const res = await fetch(`/api/movies/random?${params.toString()}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errKey = data.error || "generic";
        throw new Error(t(`errors.${errKey}`));
      }

      const data = await res.json();
      setMovie(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={rollDice}
        disabled={isLoading}
        className="btn btn-primary h-[2.625rem] w-full px-6 text-body-sm lg:w-auto"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Dice5 className="h-4 w-4" />
        )}
        {stripLeadingEmoji(isLoading ? t("button.rolling") : t("button.roll"))}
      </button>

      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.19, 1, 0.22, 1] }}
            className="max-w-xs text-body-sm text-danger"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
