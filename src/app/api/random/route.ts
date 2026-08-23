import { NextResponse } from "next/server";
import { getRandomMedia, IMDB_RANGES } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type") || "all";
    const type: "movie" | "tv" | "all" =
      typeParam === "movie" || typeParam === "tv" ? typeParam : "all";

    const genre = searchParams.get("genre") || undefined;
    const yearFrom = searchParams.get("yearFrom") || undefined;
    const yearTo = searchParams.get("yearTo") || undefined;
    const originalLanguage = searchParams.get("originalLanguage") || undefined;
    const imdbRange = searchParams.get("imdbRange") || "";
    const excludeParam = searchParams.get("exclude") || "";

    const excludeIds: number[] = excludeParam
      ? excludeParam
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => !isNaN(n) && n > 0)
      : [];

    let imdbMin: number | undefined;
    let imdbMax: number | undefined;

    if (imdbRange) {
      const found = IMDB_RANGES.find((r) => r.value === imdbRange);
      if (found) {
        imdbMin = found.min;
        imdbMax = found.max;
      }
    }

    const media = await getRandomMedia({
      type,
      genre,
      yearFrom,
      yearTo,
      originalLanguage,
      imdbMin,
      imdbMax,
      excludeIds,
    });

    if (!media) {
      return NextResponse.json(
        { error: "notFound" },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache, no-store",
          },
        }
      );
    }

    return NextResponse.json(media, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Random API Error:", error);
    return NextResponse.json(
      { error: "generic" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
