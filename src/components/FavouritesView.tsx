"use client";

import { AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { Movie } from "@/lib/tmdb";
import { PosterTile, PosterWall, EmptyState } from "./PosterTile";

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
      className="mx-auto w-full max-w-[960px] px-6 pt-10"
    >
      <h2 className="label-rule">
        {t("favourites.title")}
        {favourites.length > 0 && (
          <span className="font-serif text-body-sm tracking-normal" data-numeric>
            {favourites.length}
          </span>
        )}
      </h2>
      <p className="mb-6 font-serif text-body text-meta">
        {t("favourites.subtitle")}
      </p>

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
