import { NextResponse } from "next/server";
import { getRandomMovie, IMDB_RANGES } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get("genre") || undefined;
    const yearFrom = searchParams.get("yearFrom") || undefined;
    const yearTo = searchParams.get("yearTo") || undefined;
    const originalLanguage = searchParams.get("originalLanguage") || undefined;
    const imdbRange = searchParams.get("imdbRange") || "";

    let imdbMin: number | undefined;
    let imdbMax: number | undefined;

    if (imdbRange) {
      const found = IMDB_RANGES.find((r) => r.value === imdbRange);
      if (found) {
        imdbMin = found.min;
        imdbMax = found.max;
      }
    }

    const movie = await getRandomMovie({
      genre,
      yearFrom,
      yearTo,
      originalLanguage,
      imdbMin,
      imdbMax,
    });

    if (!movie) {
      return NextResponse.json(
        { error: "notFound" },
        { status: 404 }
      );
    }

    return NextResponse.json(movie);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "generic" },
      { status: 500 }
    );
  }
}
