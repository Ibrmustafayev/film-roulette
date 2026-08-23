"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Search as SearchIcon, X, Loader2, Tv, Film } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { searchMedia, getMovieDetails, getTVDetails, getImageUrl, Movie } from "@/lib/tmdb";
import { motion, AnimatePresence } from "framer-motion";

const EASE = [0.2, 0.8, 0.2, 1] as const;

/** Sits in the rail. Results drop over the stage, hard-cornered and lifted. */
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
          const items = await searchMedia(
            query,
            "all",
            locale === "az" ? "az-AZ" : locale === "ru" ? "ru-RU" : "en-US"
          );
          setResults(items);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, locale]);

  const handleSelect = async (item: Movie) => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setIsLoading(true);
    setActiveView("random");
    setMenuOpen(false);

    try {
      const isTv = item.media_type === "tv" || !!item.number_of_seasons;
      const lang = locale === "az" ? "az-AZ" : locale === "ru" ? "ru-RU" : "en-US";
      const details = isTv
        ? await getTVDetails(item.id, lang)
        : await getMovieDetails(item.id, lang);

      setMovie({ ...item, ...details });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Select error:", error);
      setMovie(item);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="group relative">
        <SearchIcon className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-6 transition-colors group-focus-within:text-link" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 2 && setIsOpen(true)}
          placeholder={t("search.placeholder")}
          className="inp pl-7 pr-7"
          aria-label={t("search.placeholder")}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-6 transition-colors hover:text-ink-9"
            aria-label={t("menu.close")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12, ease: EASE }}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[460px] overflow-hidden rounded-sm border border-ink-4 bg-ink-2 shadow-lifted"
          >
            {isSearching ? (
              <div className="flex items-center gap-2 px-3 py-4 text-ink-6">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-label uppercase tracking-[0.12em]">
                  {t("search.searching")}
                </span>
              </div>
            ) : results.length > 0 ? (
              <div className="flex flex-col">
                <ul className="max-h-[400px] overflow-y-auto divide-y divide-ink-4">
                  {results.map((item) => {
                    const isTv = item.media_type === "tv";
                    const year = (isTv ? item.first_air_date : item.release_date)?.split("-")[0];
                    const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
                    return (
                      <li key={`${item.media_type || "item"}-${item.id}`}>
                        <button
                          type="button"
                          onClick={() => handleSelect(item)}
                          className="group/item flex w-full items-center gap-2.5 p-2.5 text-left transition-colors duration-[120ms] hover:bg-ink-3"
                        >
                          <span className="relative block h-14 w-9 shrink-0 overflow-hidden rounded-sm bg-ink-3">
                            {item.poster_path ? (
                              <Image
                                src={getImageUrl(item.poster_path, "w185")!}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="36px"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[10px] text-ink-6">
                                {isTv ? <Tv className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                              </span>
                            )}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-small font-medium text-ink-8 transition-colors group-hover/item:text-ink-9">
                              {item.title}
                            </span>
                            {item.original_title && item.original_title !== item.title && (
                              <span className="truncate text-[11px] text-ink-6 italic">
                                {item.original_title}
                              </span>
                            )}
                            <span className="mt-0.5 flex items-center gap-2 text-label text-ink-6" data-num>
                              <span>{year || "—"}</span>
                              {rating && Number(rating) > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-link font-semibold">
                                  ★ {rating}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider text-ink-6">
                                {isTv ? (
                                  <>
                                    <Tv className="h-2.5 w-2.5 text-live" />
                                    <span>{t("tv.badge")}</span>
                                  </>
                                ) : (
                                  <>
                                    <Film className="h-2.5 w-2.5 text-link" />
                                    <span>{t("tv.movieBadge")}</span>
                                  </>
                                )}
                              </span>
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="border-t border-ink-4 bg-ink-1 px-3 py-1.5 text-right text-[10px] text-ink-6">
                  {results.length} {results.length === 1 ? 'result' : 'results'}
                </div>
              </div>
            ) : query.length > 2 ? (
              <p className="px-3 py-4 text-label uppercase tracking-[0.12em] text-ink-6">
                {t("search.noResults")}
              </p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
