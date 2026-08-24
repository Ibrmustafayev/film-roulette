/**
 * Canonical origin for absolute URLs (sitemap, robots, OG tags, JSON-LD).
 *
 * Resolution order, all automatic — nothing has to be added by hand in a
 * dashboard:
 *   1. NEXT_PUBLIC_SITE_URL, if someone deliberately pins a custom domain.
 *   2. VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL, which Vercel injects into
 *      every build and deployment on its own.
 *   3. The known production domain, so local builds still emit sane absolute
 *      URLs instead of "undefined".
 */
const FALLBACK_ORIGIN = "https://filmroulette.vercel.app";

function normalise(value: string): string {
  const withScheme = value.startsWith("http") ? value : `https://${value}`;
  return withScheme.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return normalise(explicit);

  // Set by Vercel automatically; stable across preview and production.
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return normalise(production);

  const deployment = process.env.VERCEL_URL;
  if (deployment) return normalise(deployment);

  return FALLBACK_ORIGIN;
}

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
