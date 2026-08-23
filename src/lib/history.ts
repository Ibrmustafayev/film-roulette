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
    if (!raw) return [];
    const items: WatchHistoryItem[] = JSON.parse(raw);
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
  return (
    history.find((item) => {
      if (item.id !== id) return false;
      if (item.mediaType === "tv") {
        return item.season === season && item.episode === episode;
      }
      return true;
    }) || null
  );
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
  if (!isBrowser() || !item.id || item.currentTime < 5) return;

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
