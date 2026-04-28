"use client";

import { useState } from "react";
import { Dice5, Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { getTranslations } from "@/lib/i18n";

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
    } catch (err: any) {
      setError(err.message || t("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-10 space-y-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={rollDice}
        disabled={isLoading}
        className="relative group overflow-hidden bg-gradient-to-r from-red-600 to-red-500 text-white rounded-full px-10 py-5 font-bold text-xl shadow-[0_0_50px_-12px_rgba(239,68,68,0.6)] hover:shadow-[0_0_70px_-15px_rgba(239,68,68,0.8)] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3"
      >
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Loader2 className="w-7 h-7" />
            </motion.div>
          ) : (
            <motion.div
              key="dice"
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Dice5 className="w-7 h-7" />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="text-lg">
          {isLoading ? t("button.rolling") : t("button.roll")}
        </span>
      </motion.button>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="font-medium text-red-500 text-sm bg-red-500/10 px-4 py-2 rounded-lg"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
