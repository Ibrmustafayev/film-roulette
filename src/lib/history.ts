export interface WatchHistoryItem {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  currentTime: number; // in seconds
  duration: number; // in seconds
  progressPercent: number; // 0 to 100
  season?: number;
  episode?: number;
  lastWatchedAt: number; // timestamp
}

const STORAGE_KEY = "film_roulette_history";
const ZUSTAND_KEY = "film-roulette-v3";
const MAX_HISTORY_ITEMS = 30;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Retrieve full watch history ordered by most recently watched
 */
export function getWatchHistory(): WatchHistoryItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let items: WatchHistoryItem[] = raw ? JSON.parse(raw) : [];

    // Fallback: If empty, check zustand persisted store to migrate
    if (!Array.isArray(items) || items.length === 0) {
      const zRaw = localStorage.getItem(ZUSTAND_KEY);
      if (zRaw) {
        const zData = JSON.parse(zRaw);
        const zHist = zData?.state?.history || [];
        const zProg = zData?.state?.watchProgress || {};

        if (Array.isArray(zHist) && zHist.length > 0) {
          items = zHist
            .filter((m) => !!m && !!m.id)
            .map((m, idx) => {
              const time = zProg[String(m.id)] || zProg[`${m.id}_s1_e1`] || (m.runtime ? Math.min(300, m.runtime * 60) : 0);
              const duration = m.runtime && m.runtime > 0 ? m.runtime * 60 : 7200;
              const isTv = m.media_type === "tv" || !!m.number_of_seasons;
              return {
                id: m.id,
                mediaType: isTv ? "tv" : "movie",
                title: m.title || m.original_title || "Unknown",
                posterPath: m.poster_path || null,
                backdropPath: m.backdrop_path || null,
                currentTime: time,
                duration,
                progressPercent: Math.min(100, Math.max(0, Math.round((time / duration) * 100))),
                season: isTv ? 1 : undefined,
                episode: isTv ? 1 : undefined,
                lastWatchedAt: Date.now() - idx * 60000,
              };
            });

          // Save migrated items
          if (items.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
          }
        }
      }
    }

    return Array.isArray(items)
      ? items.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt)
      : [];
  } catch (err) {
    console.error("Failed to read watch history:", err);
    return [];
  }
}

/**
 * Get watch progress for a specific movie or TV show episode
 */
export function getMediaProgress(
  id: number,
  season?: number,
  episode?: number
): WatchHistoryItem | null {
  const history = getWatchHistory();
  const found = history.find((item) => {
    if (item.id !== id) return false;
    if (item.mediaType === "tv" && season) {
      return item.season === season && (episode ? item.episode === episode : true);
    }
    return true;
  });

  if (found) return found;

  // Fallback to check zustand watchProgress store
  if (isBrowser()) {
    try {
      const zRaw = localStorage.getItem(ZUSTAND_KEY);
      if (zRaw) {
        const zData = JSON.parse(zRaw);
        const zProg = zData?.state?.watchProgress || {};
        const key = season && episode ? `${id}_s${season}_e${episode}` : String(id);
        const time = zProg[key] || zProg[String(id)];
        if (time && time > 0) {
          const duration = 7200;
          return {
            id,
            mediaType: season ? "tv" : "movie",
            title: "",
            posterPath: null,
            backdropPath: null,
            currentTime: time,
            duration,
            progressPercent: Math.min(100, Math.max(0, Math.round((time / duration) * 100))),
            season,
            episode,
            lastWatchedAt: Date.now(),
          };
        }
      }
    } catch {
      /* ignore */
    }
  }

  return null;
}

/**
 * Save or update watch progress in localStorage
 */
export function saveWatchProgress(
  item: Omit<WatchHistoryItem, "lastWatchedAt" | "progressPercent"> & {
    lastWatchedAt?: number;
    progressPercent?: number;
  }
): void {
  if (!isBrowser() || !item.id) return;

  try {
    const history = getWatchHistory();
    const duration = item.duration && item.duration > 0 ? item.duration : 120 * 60; // default 120 min if duration not supplied
    const progressPercent = Math.min(
      100,
      Math.max(0, Math.round((item.currentTime / duration) * 100))
    );

    const fullItem: WatchHistoryItem = {
      ...item,
      duration,
      progressPercent,
      lastWatchedAt: item.lastWatchedAt || Date.now(),
    };

    // Filter out existing matching entry
    const filtered = history.filter((h) => {
      if (h.id !== fullItem.id) return true;
      if (h.mediaType === "tv") {
        return !(h.season === fullItem.season && h.episode === fullItem.episode);
      }
      return false;
    });

    const updated = [fullItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Also sync to zustand localStorage for backward compatibility
    const zRaw = localStorage.getItem(ZUSTAND_KEY);
    if (zRaw) {
      try {
        const zData = JSON.parse(zRaw);
        if (!zData.state) zData.state = {};
        if (!zData.state.watchProgress) zData.state.watchProgress = {};
        const key = item.season && item.episode ? `${item.id}_s${item.season}_e${item.episode}` : String(item.id);
        zData.state.watchProgress[key] = item.currentTime;
        localStorage.setItem(ZUSTAND_KEY, JSON.stringify(zData));
      } catch {
        /* ignore */
      }
    }

    // Dispatch a custom event so other components update synchronously
    window.dispatchEvent(new CustomEvent("film_roulette_history_updated"));
  } catch (err) {
    console.error("Failed to save watch progress:", err);
  }
}

/**
 * Remove a specific item from watch history
 */
export function removeHistoryItem(id: number, season?: number, episode?: number): void {
  if (!isBrowser()) return;
  try {
    const history = getWatchHistory();
    const updated = history.filter((h) => {
      if (h.id !== id) return true;
      if (h.mediaType === "tv") {
        return !(h.season === season && h.episode === episode);
      }
      return false;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("film_roulette_history_updated"));
  } catch (err) {
    console.error("Failed to remove history item:", err);
  }
}

/**
 * Clear all stored watch history
 */
export function clearHistory(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("film_roulette_history_updated"));
  } catch (err) {
    console.error("Failed to clear watch history:", err);
  }
}

/**
 * Format seconds into HH:MM:SS or MM:SS
 */
export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format remaining time (e.g. "25m remaining")
 */
export function formatRemaining(currentTime: number, duration: number): string {
  if (!duration || duration <= currentTime) return "";
  const remaining = duration - currentTime;
  const mins = Math.ceil(remaining / 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m > 0 ? `${m}m` : ""} remaining`;
  }
  return `${mins}m remaining`;
}
