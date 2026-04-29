const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_ACCESS_TOKEN = process.env.TMDB_API_READ_ACCESS_TOKEN;

const fetchFromTMDB = async (endpoint: string, params: Record<string, string | number> = {}) => {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);

  if (TMDB_API_KEY) {
    url.searchParams.append('api_key', TMDB_API_KEY);
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (TMDB_ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${TMDB_ACCESS_TOKEN}`;
  }

  const response = await fetch(url.toString(), {
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  genres?: Genre[];
  runtime?: number;
  original_language: string;
  cast?: CastMember[];
  trailer_key?: string | null;
  imdb_id?: string | null;
}

export const LANGUAGE_CODES = [
  '', 'en', 'tr', 'fr', 'de', 'es', 'it', 'ja', 'ko', 'hi',
  'ru', 'pt', 'zh', 'ar', 'sv', 'da', 'pl',
];

export const IMDB_RANGES = [
  { value: '', min: 0, max: 10 },
  { value: '9-10', min: 9, max: 10 },
  { value: '8-10', min: 8, max: 10 },
  { value: '7-10', min: 7, max: 10 },
  { value: '6-10', min: 6, max: 10 },
  { value: '5-10', min: 5, max: 10 },
  { value: '0-5', min: 0, max: 5 },
];

export const getGenres = async (language = 'en-US') => {
  const data = await fetchFromTMDB('/genre/movie/list', { language });
  return data.genres as Genre[];
};

// Movie details + cast + trailer + IMDB ID
export const getMovieDetails = async (movieId: number): Promise<Partial<Movie>> => {
  const [details, credits, videos] = await Promise.all([
    fetchFromTMDB(`/movie/${movieId}`, { language: 'en-US' }),
    fetchFromTMDB(`/movie/${movieId}/credits`, { language: 'en-US' }),
    fetchFromTMDB(`/movie/${movieId}/videos`, { language: 'en-US' }),
  ]);

  const cast = (credits.cast || []).slice(0, 6).map((c: any) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profile_path: c.profile_path,
  }));

  const trailer = (videos.results || []).find(
    (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
  );

  return {
    genres: details.genres,
    runtime: details.runtime,
    imdb_id: details.imdb_id || null,
    cast,
    trailer_key: trailer?.key || null,
  };
};

// Random movie with year range support
export const getRandomMovie = async ({
  genre,
  yearFrom,
  yearTo,
  originalLanguage,
  imdbMin,
  imdbMax,
}: {
  genre?: string;
  yearFrom?: string;
  yearTo?: string;
  originalLanguage?: string;
  imdbMin?: number;
  imdbMax?: number;
}) => {
  const initialParams: Record<string, string | number> = {
    include_adult: 'false',
    include_video: 'false',
    language: 'en-US',
    sort_by: 'popularity.desc',
    'vote_count.gte': 50,
  };

  if (genre) initialParams.with_genres = genre;
  if (originalLanguage) initialParams.with_original_language = originalLanguage;

  // Year range support
  if (yearFrom) initialParams['primary_release_date.gte'] = `${yearFrom}-01-01`;
  if (yearTo) initialParams['primary_release_date.lte'] = `${yearTo}-12-31`;

  // TMDB vote_average filter
  if (imdbMin !== undefined && imdbMin > 0) {
    initialParams['vote_average.gte'] = imdbMin;
  }
  if (imdbMax !== undefined && imdbMax < 10) {
    initialParams['vote_average.lte'] = imdbMax;
  }

  const initialData = await fetchFromTMDB('/discover/movie', initialParams);

  if (!initialData.results || initialData.results.length === 0) {
    return null;
  }

  const totalPages = Math.min(initialData.total_pages, 500);
  const randomPage = Math.floor(Math.random() * totalPages) + 1;

  const randomPageParams = { ...initialParams, page: randomPage };
  const randomPageData = await fetchFromTMDB('/discover/movie', randomPageParams);

  const results = randomPageData.results as Movie[];
  if (results.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * results.length);
  const movie = results[randomIndex];

  const details = await getMovieDetails(movie.id);

  return {
    ...movie,
    ...details,
  };
};

// Search movies by title
export const searchMovies = async (query: string, language = 'en-US') => {
  if (!query) return [];
  
  // If running in browser, use our internal proxy API to keep the key safe
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}&language=${language}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []) as Movie[];
  }

  // If server-side, use direct TMDB fetch
  const data = await fetchFromTMDB('/search/movie', {
    query,
    language,
    include_adult: 'false',
  });
  return (data.results || []) as Movie[];
};

export const getImageUrl = (path: string | null, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500') => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};
