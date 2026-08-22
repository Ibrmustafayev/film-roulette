"use client";

import { AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { Movie } from "@/lib/tmdb";
import { PosterTile, PosterWall, EmptyState } from "./PosterTile";
import { StageHeading } from "./StageHeading";

export function FavouritesView() {
  const { favourites, locale, setMovie, setActiveView, toggleFavourite } =
    useStore();
  const t = getTranslations(locale);

  const handleSelect = (movie: Movie) => {
    setMovie(movie);
    setActiveView("random");
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
                key={movie.id}
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
