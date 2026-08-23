/**
 * High-performance In-Memory TTL Cache with Stale-While-Revalidate support
 * and automatic cleanup to prevent memory leaks.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  staleAt: number;
}

class MemoryCache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private maxEntries: number;

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Get an item from the cache.
   * If stale, returns stale data while caller can optionally refresh.
   */
  get<T>(key: string): { data: T; isStale: boolean } | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return {
      data: entry.data,
      isStale: now > entry.staleAt,
    };
  }

  /**
   * Set an item in the cache.
   * @param ttlSeconds Time-to-live in seconds until hard expiration.
   * @param staleSeconds Time in seconds until considered stale (defaults to ttlSeconds).
   */
  set<T>(key: string, data: T, ttlSeconds = 300, staleSeconds = ttlSeconds * 0.8): void {
    if (this.store.size >= this.maxEntries) {
      // Evict oldest 10% entries
      const keysToEvict = Array.from(this.store.keys()).slice(0, Math.floor(this.maxEntries * 0.1));
      for (const k of keysToEvict) {
        this.store.delete(k);
      }
    }

    const now = Date.now();
    this.store.set(key, {
      data,
      expiresAt: now + ttlSeconds * 1000,
      staleAt: now + staleSeconds * 1000,
    });
  }

  /**
   * Wrapper for fetching or using cached data.
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds = 300,
    staleSeconds = ttlSeconds * 0.8
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached && !cached.isStale) {
      return cached.data;
    }

    try {
      const freshData = await fetchFn();
      this.set(key, freshData, ttlSeconds, staleSeconds);
      return freshData;
    } catch (err) {
      // If fetch fails but we have stale data, return stale data as fallback
      if (cached) {
        return cached.data;
      }
      throw err;
    }
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// Global singleton instance across serverless execution contexts
const globalForCache = globalThis as unknown as { appCache?: MemoryCache };
export const cache = globalForCache.appCache ?? new MemoryCache(1500);
if (process.env.NODE_ENV !== 'production') globalForCache.appCache = cache;
