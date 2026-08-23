import { NextResponse } from 'next/server';
import { searchMedia } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const typeParam = searchParams.get('type') || 'all';
  const type: 'movie' | 'tv' | 'all' =
    typeParam === 'movie' || typeParam === 'tv' ? typeParam : 'all';
  const language = searchParams.get('language') || 'en-US';

  if (!query || !query.trim()) {
    return NextResponse.json({ results: [] }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const results = await searchMedia(query, type, language);

    return NextResponse.json({ results }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Failed to search media' }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}
