"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Search as SearchIcon, X, Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { searchMovies, getMovieDetails, getImageUrl, Movie } from "@/lib/tmdb";
import { motion, AnimatePresence } from "framer-motion";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { locale, setMovie, setIsLoading, setActiveView, setMenuOpen } =
    useStore();
  const t = getTranslations(locale);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 2) {
        setIsSearching(true);
        setIsOpen(true);
        try {
          const movies = await searchMovies(
            query,
            locale === "az" ? "az-AZ" : locale === "ru" ? "ru-RU" : "en-US"
          );
          setResults(movies.slice(0, 6));
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, locale]);

  const handleSelect = async (movie: Movie) => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setIsLoading(true);
    setActiveView("random");
    setMenuOpen(false);
    try {
      const details = await getMovieDetails(movie.id);
      setMovie({ ...movie, ...details });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Select error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={searchRef} className="relative hidden min-w-0 max-w-xs flex-1 md:block">
      <div className="group relative">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-meta transition-colors group-focus-within:text-blue" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 2 && setIsOpen(true)}
          placeholder={t("search.placeholder")}
          className="field h-8 pl-8 pr-8"
          aria-label={t("search.placeholder")}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-meta transition-colors hover:text-heading"
            aria-label={t("menu.close")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: [0.19, 1, 0.22, 1] }}
            className="absolute inset-x-0 top-full z-100 mt-1.5 overflow-hidden rounded-panel border border-surface-alt bg-surface shadow-[0_8px_28px_rgba(0,0,0,0.45)]"
          >
            {isSearching ? (
              <div className="flex items-center justify-center gap-2 p-6 text-meta">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-body-sm">{t("search.searching")}</span>
              </div>
            ) : results.length > 0 ? (
              <ul className="max-h-[380px] overflow-y-auto p-1.5">
                {results.map((movie) => (
                  <li key={movie.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(movie)}
                      className="group/item flex w-full gap-2.5 rounded-control p-1.5 text-left transition-colors hover:bg-panel/40"
                    >
                      <span className="relative block h-[54px] w-9 shrink-0 overflow-hidden rounded-[2px] bg-poster-bg">
                        {movie.poster_path && (
                          <Image
                            src={getImageUrl(movie.poster_path, "w185")!}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="36px"
                          />
                        )}
                      </span>
                      <span className="flex min-w-0 flex-col justify-center">
                        <span className="truncate text-body-sm font-medium text-ink-high transition-colors group-hover/item:text-heading">
                          {movie.title}
                        </span>
                        <span
                          className="font-serif text-tiny text-meta"
                          data-numeric
                        >
                          {movie.release_date?.split("-")[0]}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.length > 2 ? (
              <p className="p-6 text-center text-body-sm text-meta">
                {t("search.noResults")}
              </p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
