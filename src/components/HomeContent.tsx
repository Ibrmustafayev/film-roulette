"use client";

import { Header } from "@/components/Header";
import { FilterPanel } from "@/components/FilterPanel";
import { RouletteButton } from "@/components/RouletteButton";
import { MovieCard } from "@/components/MovieCard";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import { Genre } from "@/lib/tmdb";

export function HomeContent({ genres }: { genres: Genre[] }) {
  const { locale } = useStore();
  const t = getTranslations(locale);

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-amber-500/5 rounded-full blur-[100px]" />
      </div>

      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-5">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-2">
            <span>🎬</span>
            <span>{t("site.badge")}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
              {t("site.tagline").includes(",") ? t("site.tagline").split(",")[0] + "," : t("site.tagline")}
            </span>
            <br />
            <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
              {t("site.tagline").includes(",") ? t("site.tagline").split(",")[1] : ""}
            </span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            {t("site.description")}
          </p>
        </div>

        <FilterPanel genres={genres} />
        <RouletteButton />
        <MovieCard />
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40 mt-auto">
        <p>{t("site.footer")}</p>
      </footer>
    </div>
  );
}
