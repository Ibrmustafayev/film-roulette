import { NextResponse } from 'next/server';
import { getFullMovie } from '@/lib/tmdb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: movieIdStr } = await params;
  const movieId = parseInt(movieIdStr, 10);
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('language') || 'en-US';

  if (isNaN(movieId) || movieId <= 0) {
    return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 });
  }

  try {
    const movie = await getFullMovie(movieId, language);
    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    return NextResponse.json(movie, {
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
