"use client";

import { AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { Movie, getMovieDetails, getTVDetails } from "@/lib/tmdb";
import { PosterTile, PosterWall, EmptyState } from "./PosterTile";
import { StageHeading } from "./StageHeading";

export function FavouritesView() {
  const { favourites, locale, setMovie, setActiveView, setIsLoading, toggleFavourite } =
    useStore();
  const t = getTranslations(locale);

  const handleSelect = async (movie: Movie) => {
    setActiveView("random");
    setIsLoading(true);
    try {
      const isTv = movie.media_type === "tv" || !!movie.number_of_seasons;
      const lang = locale === "az" ? "az-AZ" : locale === "ru" ? "ru-RU" : "en-US";
      const details = isTv
        ? await getTVDetails(movie.id, lang)
        : await getMovieDetails(movie.id, lang);
      setMovie({ ...movie, ...details });
    } catch {
      setMovie(movie);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      aria-label={t("favourites.title")}
      className="stage-pad pt-10 sm:pt-16"
    >
      <StageHeading
        title={t("favourites.title")}
        subtitle={t("favourites.subtitle")}
        count={favourites.length}
      />

      {favourites.length === 0 ? (
        <EmptyState message={t("favourites.empty")} />
      ) : (
        <PosterWall>
          <AnimatePresence>
            {favourites.map((movie, i) => (
              <PosterTile
                key={`${movie.media_type || "item"}-${movie.id}`}
                movie={movie}
                index={i}
                onSelect={handleSelect}
                onRemove={toggleFavourite}
                removeLabel={t("favourites.remove")}
              />
            ))}
          </AnimatePresence>
        </PosterWall>
      )}
    </section>
  );
}
