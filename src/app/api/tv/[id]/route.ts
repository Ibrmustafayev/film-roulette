import { NextResponse } from 'next/server';
import { getTVDetails, fetchFromTMDB } from '@/lib/tmdb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tvIdStr } = await params;
  const tvId = parseInt(tvIdStr, 10);
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('language') || 'en-US';

  if (isNaN(tvId)) {
    return NextResponse.json({ error: 'Invalid TV ID' }, { status: 400 });
  }

  try {
    const rawTv = await fetchFromTMDB(`/tv/${tvId}`, { language }, 600);
    const details = await getTVDetails(tvId, language);

    return NextResponse.json({
      id: rawTv.id,
      media_type: 'tv',
      title: rawTv.name,
      original_title: rawTv.original_name,
      overview: rawTv.overview,
      poster_path: rawTv.poster_path,
      backdrop_path: rawTv.backdrop_path,
      release_date: rawTv.first_air_date,
      first_air_date: rawTv.first_air_date,
      vote_average: rawTv.vote_average,
      vote_count: rawTv.vote_count,
      genre_ids: (rawTv.genres || []).map((g: { id: number }) => g.id),
      original_language: rawTv.original_language,
      ...details,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('TV Details API error:', error);
    return NextResponse.json({ error: 'Failed to fetch TV show details' }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}
