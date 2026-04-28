import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Movie } from "@/lib/tmdb";
import { Locale, DEFAULT_LOCALE } from "@/lib/i18n";

interface AppState {
  // Filters
  genre: string;
  yearFrom: string;
  yearTo: string;
  originalLanguage: string;
  imdbRange: string;

  // Result
  movie: Movie | null;
  isLoading: boolean;

  // UI
  locale: Locale;

  // Actions
  setGenre: (g: string) => void;
  setYearFrom: (y: string) => void;
  setYearTo: (y: string) => void;
  setOriginalLanguage: (l: string) => void;
  setImdbRange: (r: string) => void;
  setMovie: (m: Movie | null) => void;
  setIsLoading: (l: boolean) => void;
  setLocale: (l: Locale) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      genre: "",
      yearFrom: "",
      yearTo: "",
      originalLanguage: "",
      imdbRange: "",
      movie: null,
      isLoading: false,
      locale: DEFAULT_LOCALE,

      setGenre: (genre) => set({ genre }),
      setYearFrom: (yearFrom) => set({ yearFrom }),
      setYearTo: (yearTo) => set({ yearTo }),
      setOriginalLanguage: (originalLanguage) => set({ originalLanguage }),
      setImdbRange: (imdbRange) => set({ imdbRange }),
      setMovie: (movie) => set({ movie }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "film-roulette-prefs",
      partialize: (state) => ({
        locale: state.locale,
      }),
    }
  )
);
