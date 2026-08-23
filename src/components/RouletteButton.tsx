"use client";

import { useState } from "react";
import { Dice5, Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { getTranslations } from "@/lib/i18n";

const EASE = [0.2, 0.8, 0.2, 1] as const;

/* The locale strings carry a leading dice emoji from an earlier design. The
   control has a drawn icon, so the emoji would read as a second one. Strip it
   at render rather than editing every translation. */
const stripLeadingEmoji = (s: string) =>
  s.replace(/^[\p{Extended_Pictographic}️\s]+/u, "").trim();

export function RouletteButton({
  id = "roll-dice-btn",
  className,
}: {
  id?: string;
  className?: string;
} = {}) {
  const {
    contentType,
    genre,
    yearFrom,
    yearTo,
    originalLanguage,
    imdbRange,
    history,
    setMovie,
    isLoading,
    setIsLoading,
    locale,
    setActiveView,
  } = useStore();
  const [error, setError] = useState("");
  const t = getTranslations(locale);

  const rollDice = async () => {
    setIsLoading(true);
    setError("");
    setMovie(null);
    setActiveView("random");

    try {
      const params = new URLSearchParams();
      if (contentType && contentType !== "all") params.append("type", contentType);
      if (genre) params.append("genre", genre);
      if (yearFrom) params.append("yearFrom", yearFrom);
      if (yearTo) params.append("yearTo", yearTo);
      if (originalLanguage) params.append("originalLanguage", originalLanguage);
      if (imdbRange) params.append("imdbRange", imdbRange);

      // Pass the last 20 served items to anti-repeat buffer
      if (history && history.length > 0) {
        const excludeIds = history.slice(0, 20).map((m) => m.id);
        params.append("exclude", excludeIds.join(","));
      }

      // Add cache buster timestamp
      params.append("_t", Date.now().toString());

      const res = await fetch(`/api/random?${params.toString()}`);

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
    <div className={className}>
      <button
        type="button"
        id={id}
        onClick={rollDice}
        disabled={isLoading}
        className="ctl ctl-live w-full"
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Dice5 className="h-3.5 w-3.5" />
        )}
        {stripLeadingEmoji(isLoading ? t("button.rolling") : t("button.roll"))}
      </button>

      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: EASE }}
            className="mt-2 border border-alert-border bg-alert-subtle px-2 py-1.5 text-small text-alert"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
