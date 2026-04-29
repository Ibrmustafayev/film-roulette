import { NextResponse } from 'next/server';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const language = searchParams.get('language') || 'en-US';

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = new URL(`${TMDB_BASE_URL}/search/movie`);
    url.searchParams.append('api_key', TMDB_API_KEY || '');
    url.searchParams.append('query', query);
    url.searchParams.append('language', language);
    url.searchParams.append('include_adult', 'false');

    const response = await fetch(url.toString());
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
