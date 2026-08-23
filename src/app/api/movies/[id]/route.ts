import { NextResponse } from 'next/server';
import { getMovieDetails, fetchFromTMDB } from '@/lib/tmdb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: movieIdStr } = await params;
  const movieId = parseInt(movieIdStr, 10);
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('language') || 'en-US';

  if (isNaN(movieId)) {
    return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 });
  }

  try {
    const rawMovie = await fetchFromTMDB(`/movie/${movieId}`, { language }, 600);
    const details = await getMovieDetails(movieId, language);

    return NextResponse.json({
      id: rawMovie.id,
      media_type: 'movie',
      title: rawMovie.title,
      original_title: rawMovie.original_title,
      overview: rawMovie.overview,
      poster_path: rawMovie.poster_path,
      backdrop_path: rawMovie.backdrop_path,
      release_date: rawMovie.release_date,
      vote_average: rawMovie.vote_average,
      vote_count: rawMovie.vote_count,
      genre_ids: (rawMovie.genres || []).map((g: { id: number }) => g.id),
      original_language: rawMovie.original_language,
      ...details,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Movie Details API error:', error);
    return NextResponse.json({ error: 'Failed to fetch movie details' }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}
