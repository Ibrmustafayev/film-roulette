import type { Movie } from "@/lib/tmdb";
import { getImageUrl } from "@/lib/tmdb";
import { absoluteUrl } from "@/lib/siteUrl";

/**
 * Schema.org structured data for a title page.
 *
 * Search engines read this to build a rich result — poster, rating, year, cast
 * — instead of a bare blue link. It is emitted server-side as a plain script
 * tag; nothing here runs in the browser.
 */
export function MediaJsonLd({
  media,
  type,
}: {
  media: Movie;
  type: "movie" | "tv";
}) {
  const year = (media.release_date || "").slice(0, 4);
  const image = getImageUrl(media.poster_path, "w500");

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type === "tv" ? "TVSeries" : "Movie",
    name: media.title,
    url: absoluteUrl(`/${type === "tv" ? "tv" : "movie"}/${media.id}`),
  };

  if (media.overview) data.description = media.overview;
  if (image) data.image = image;
  if (media.original_title && media.original_title !== media.title) {
    data.alternateName = media.original_title;
  }
  if (year) {
    // TMDB gives a full date for films and a first-air date for series.
    data[type === "tv" ? "startDate" : "datePublished"] = media.release_date;
  }
  if (media.runtime) {
    // ISO 8601 duration, which is what Schema.org expects.
    data.duration = `PT${media.runtime}M`;
  }
  if (media.genres?.length) {
    data.genre = media.genres.map((g) => g.name);
  }
  if (media.cast?.length) {
    data.actor = media.cast.slice(0, 10).map((person) => ({
      "@type": "Person",
      name: person.name,
    }));
  }
  // Only claim a rating when there are votes behind it; an aggregateRating with
  // no reviewCount is the kind of thing that gets structured data ignored.
  if (media.vote_average > 0 && (media.vote_count ?? 0) > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: media.vote_average.toFixed(1),
      bestRating: 10,
      worstRating: 0,
      ratingCount: media.vote_count,
    };
  }

  return (
    <script
      type="application/ld+json"
      // Server-rendered from typed TMDB fields, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
