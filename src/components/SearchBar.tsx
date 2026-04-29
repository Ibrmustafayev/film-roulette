"use client";

import { useState, useEffect, useRef } from "react";
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
  const { locale, setMovie, setIsLoading } = useStore();
  const t = getTranslations(locale);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 2) {
        setIsSearching(true);
        setIsOpen(true);
        try {
          const movies = await searchMovies(query, locale === 'az' ? 'az-AZ' : locale === 'ru' ? 'ru-RU' : 'en-US');
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
    try {
      const details = await getMovieDetails(movie.id);
      setMovie({ ...movie, ...details });
      
      // Auto scroll to movie card after selection
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (error) {
      console.error("Select error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-sm order-3 md:order-2">
      <div className="relative group">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 2 && setIsOpen(true)}
          placeholder={t("search.placeholder")}
          className="w-full bg-secondary/50 hover:bg-secondary/80 focus:bg-secondary border-none rounded-full pl-10 pr-10 py-2 text-sm transition-all focus:ring-2 focus:ring-primary/20"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-[100]"
          >
            {isSearching ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm font-medium">{t("search.searching")}</span>
              </div>
            ) : results.length > 0 ? (
              <div className="p-2 max-h-[380px] overflow-y-auto">
                {results.map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => handleSelect(movie)}
                    className="w-full flex gap-3 p-2 hover:bg-muted rounded-xl transition-colors text-left group"
                  >
                    <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-muted border border-border">
                      {movie.poster_path ? (
                        <img
                          src={getImageUrl(movie.poster_path, "w185")!}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <SearchIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {movie.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {movie.release_date?.split("-")[0]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : query.length > 2 ? (
              <div className="p-8 text-center text-muted-foreground">
                <span className="text-sm">{t("search.noResults")}</span>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
