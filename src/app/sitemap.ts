import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { getPopularMedia } from "@/lib/tmdb";

/**
 * Revalidated daily rather than pinned at build time, so newly popular titles
 * reach search engines without a redeploy. TMDB's discover endpoint returns one
 * page (20 items) per call, so this lists the current top 20 of each type; if it
 * is unreachable the static routes still ship instead of the whole sitemap
 * failing.
 */
export const revalidate = 86400; // one day

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site, lastModified: now, changeFrequency: "daily", priority: 1 },
  ];

  const [movies, shows] = await Promise.allSettled([
    getPopularMedia("movie", "en-US", 20),
    getPopularMedia("tv", "en-US", 20),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  if (movies.status === "fulfilled") {
    for (const item of movies.value) {
      entries.push({
        url: `${site}/movie/${item.id}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } else {
    console.error("sitemap: popular movies unavailable", movies.reason);
  }

  if (shows.status === "fulfilled") {
    for (const item of shows.value) {
      entries.push({
        url: `${site}/tv/${item.id}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } else {
    console.error("sitemap: popular shows unavailable", shows.reason);
  }

  return [...staticRoutes, ...entries];
}
