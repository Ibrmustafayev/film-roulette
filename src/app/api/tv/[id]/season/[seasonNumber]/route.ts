import { NextResponse } from 'next/server';
import { getSeasonDetails } from '@/lib/tmdb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; seasonNumber: string }> }
) {
  const { id: tvIdStr, seasonNumber: seasonNumberStr } = await params;
  const tvId = parseInt(tvIdStr, 10);
  const seasonNumber = parseInt(seasonNumberStr, 10);
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('language') || 'en-US';

  if (isNaN(tvId) || isNaN(seasonNumber)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  try {
    const seasonData = await getSeasonDetails(tvId, seasonNumber, language);

    return NextResponse.json(seasonData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Season Details API error:', error);
    return NextResponse.json({ error: 'Failed to fetch season details' }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}
