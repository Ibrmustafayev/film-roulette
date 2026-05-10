import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Movie } from "@/lib/tmdb";
import { Locale, DEFAULT_LOCALE } from "@/lib/i18n";

type ActiveView = "random" | "history" | "favourites";

const MAX_HISTORY = 30;

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
  activeView: ActiveView;
  isMenuOpen: boolean;

  // History & Favourites
  history: Movie[];
  favourites: Movie[];

  // Actions
  setGenre: (g: string) => void;
  setYearFrom: (y: string) => void;
  setYearTo: (y: string) => void;
  setOriginalLanguage: (l: string) => void;
  setImdbRange: (r: string) => void;
  setMovie: (m: Movie | null) => void;
  setIsLoading: (l: boolean) => void;
  setLocale: (l: Locale) => void;
  setActiveView: (v: ActiveView) => void;
  setMenuOpen: (open: boolean) => void;
  addToHistory: (movie: Movie) => void;
  toggleFavourite: (movie: Movie) => void;
  isFavourite: (movieId: number) => boolean;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      genre: "",
      yearFrom: "",
      yearTo: "",
      originalLanguage: "",
      imdbRange: "",
      movie: null,
      isLoading: false,
      locale: DEFAULT_LOCALE,
      activeView: "random",
      isMenuOpen: false,
      history: [],
      favourites: [],

      setGenre: (genre) => set({ genre }),
      setYearFrom: (yearFrom) => set({ yearFrom }),
      setYearTo: (yearTo) => set({ yearTo }),
      setOriginalLanguage: (originalLanguage) => set({ originalLanguage }),
      setImdbRange: (imdbRange) => set({ imdbRange }),
      setMovie: (movie) => {
        set({ movie });
        if (movie) {
          get().addToHistory(movie);
        }
      },
      setIsLoading: (isLoading) => set({ isLoading }),
      setLocale: (locale) => set({ locale }),
      setActiveView: (activeView) => set({ activeView, isMenuOpen: false }),
      setMenuOpen: (isMenuOpen) => set({ isMenuOpen }),

      addToHistory: (movie) =>
        set((state) => {
          const filtered = state.history.filter((m) => m.id !== movie.id);
          const updated = [movie, ...filtered].slice(0, MAX_HISTORY);
          return { history: updated };
        }),

      toggleFavourite: (movie) =>
        set((state) => {
          const exists = state.favourites.some((m) => m.id === movie.id);
          if (exists) {
            return { favourites: state.favourites.filter((m) => m.id !== movie.id) };
          }
          return { favourites: [movie, ...state.favourites] };
        }),

      isFavourite: (movieId) => get().favourites.some((m) => m.id === movieId),
    }),
    {
      name: "film-roulette-prefs",
      partialize: (state) => ({
        locale: state.locale,
        history: state.history,
        favourites: state.favourites,
      }),
    }
  )
);
