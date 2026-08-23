import { NextResponse } from 'next/server';
import { getFullTV } from '@/lib/tmdb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tvIdStr } = await params;
  const tvId = parseInt(tvIdStr, 10);
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('language') || 'en-US';

  if (isNaN(tvId) || tvId <= 0) {
    return NextResponse.json({ error: 'Invalid TV ID' }, { status: 400 });
  }

  try {
    const tv = await getFullTV(tvId, language);
    if (!tv) {
      return NextResponse.json({ error: 'TV show not found' }, { status: 404 });
    }

    return NextResponse.json(tv, {
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
