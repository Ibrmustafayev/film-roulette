import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Movie, SeasonDetails } from "@/lib/tmdb";
import { Locale, DEFAULT_LOCALE } from "@/lib/i18n";

type ActiveView = "random" | "history" | "favourites" | "mobileapp" | "help";
export type ContentType = "all" | "movie" | "tv";

const MAX_HISTORY = 30;

interface AppState {
  // Content Type Filter
  contentType: ContentType;

  // Filters
  genre: string;
  yearFrom: string;
  yearTo: string;
  originalLanguage: string;
  imdbRange: string;

  // Result
  movie: Movie | null;
  isLoading: boolean;

  // TV Shows Season & Episode Selection
  selectedSeason: number;
  selectedEpisode: number;
  seasonCache: Record<string, SeasonDetails>; // key: `${tvId}_${season}`
  isLoadingSeason: boolean;

  // UI
  locale: Locale;
  activeView: ActiveView;
  isMenuOpen: boolean;

  // History & Favourites
  history: Movie[];
  favourites: Movie[];

  // Player state (for resume)
  showPlayer: boolean;
  showTrailer: boolean;
  autoPlayNext: boolean;
  watchProgress: Record<string, number>; // Media ID / Episode Key -> Time in seconds

  // Actions
  setContentType: (c: ContentType) => void;
  setGenre: (g: string) => void;
  setYearFrom: (y: string) => void;
  setYearTo: (y: string) => void;
  setOriginalLanguage: (l: string) => void;
  setImdbRange: (r: string) => void;
  setMovie: (m: Movie | null, autoPlay?: boolean) => void;
  setAutoPlayNext: (auto: boolean) => void;
  setIsLoading: (l: boolean) => void;
  setSelectedSeason: (season: number) => void;
  setSelectedEpisode: (episode: number) => void;
  setSeasonDetails: (tvId: number, seasonNumber: number, details: SeasonDetails) => void;
  setIsLoadingSeason: (l: boolean) => void;
  setLocale: (l: Locale) => void;
  setActiveView: (v: ActiveView) => void;
  setMenuOpen: (open: boolean) => void;
  addToHistory: (movie: Movie) => void;
  toggleFavourite: (movie: Movie) => void;
  isFavourite: (movieId: number) => boolean;
  setShowPlayer: (s: boolean) => void;
  setShowTrailer: (s: boolean) => void;
  setWatchProgress: (key: string | number, time: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      contentType: "all",
      genre: "",
      yearFrom: "",
      yearTo: "",
      originalLanguage: "",
      imdbRange: "",
      movie: null,
      isLoading: false,
      selectedSeason: 1,
      selectedEpisode: 1,
      seasonCache: {},
      isLoadingSeason: false,
      locale: DEFAULT_LOCALE,
      activeView: "random",
      isMenuOpen: false,
      history: [],
      favourites: [],
      showPlayer: false,
      showTrailer: false,
      autoPlayNext: false,
      watchProgress: {},

      setContentType: (contentType) => set({ contentType }),
      setGenre: (genre) => set({ genre }),
      setYearFrom: (yearFrom) => set({ yearFrom }),
      setYearTo: (yearTo) => set({ yearTo }),
      setOriginalLanguage: (originalLanguage) => set({ originalLanguage }),
      setImdbRange: (imdbRange) => set({ imdbRange }),
      setAutoPlayNext: (autoPlayNext) => set({ autoPlayNext }),
      setMovie: (movie, autoPlay = false) => {
        set({
          movie,
          showPlayer: autoPlay,
          showTrailer: false,
          autoPlayNext: autoPlay,
          selectedSeason: 1,
          selectedEpisode: 1,
        });
        if (movie) {
          get().addToHistory(movie);
        }
      },
      setIsLoading: (isLoading) => set({ isLoading }),
      setSelectedSeason: (selectedSeason) => set({ selectedSeason, selectedEpisode: 1 }),
      setSelectedEpisode: (selectedEpisode) => set({ selectedEpisode }),
      setSeasonDetails: (tvId, seasonNumber, details) =>
        set((state) => ({
          seasonCache: {
            ...state.seasonCache,
            [`${tvId}_${seasonNumber}`]: details,
          },
        })),
      setIsLoadingSeason: (isLoadingSeason) => set({ isLoadingSeason }),
      setLocale: (locale) => set({ locale }),
      setActiveView: (activeView) => set({ activeView, isMenuOpen: false }),
      setMenuOpen: (isMenuOpen) => set({ isMenuOpen }),
      setShowPlayer: (showPlayer) => set({ showPlayer, showTrailer: false }),
      setShowTrailer: (showTrailer) => set({ showTrailer, showPlayer: false }),
      setWatchProgress: (key, time) =>
        set((state) => ({
          watchProgress: { ...state.watchProgress, [String(key)]: time },
        })),

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
      name: "film-roulette-v3",
      partialize: (state) => ({
        contentType: state.contentType,
        locale: state.locale,
        history: state.history,
        favourites: state.favourites,
        watchProgress: state.watchProgress,
      }),
    }
  )
);
