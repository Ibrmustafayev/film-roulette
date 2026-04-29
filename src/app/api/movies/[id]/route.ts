import { NextResponse } from 'next/server';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const movieId = params.id;
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('language') || 'en-US';

  try {
    const fetchOptions = {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    };

    // Fetch movie details, credits, and videos in parallel
    const [movieRes, creditsRes, videosRes] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=${language}`, fetchOptions),
      fetch(`${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=${language}`, fetchOptions),
      fetch(`${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=${language}`, fetchOptions)
    ]);

    const movieData = await movieRes.json();
    const creditsData = await creditsRes.json();
    const videosData = await videosRes.json();

    const cast = (creditsData.cast || []).slice(0, 6).map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profile_path: c.profile_path,
    }));

    const trailer = (videosData.results || []).find(
      (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
    );

    return NextResponse.json({
      ...movieData,
      genres: movieData.genres,
      runtime: movieData.runtime,
      imdb_id: movieData.imdb_id || null,
      cast,
      trailer_key: trailer?.key || null,
    });
  } catch (error) {
    console.error('Movie Details API error:', error);
    return NextResponse.json({ error: 'Failed to fetch movie details' }, { status: 500 });
  }
}
