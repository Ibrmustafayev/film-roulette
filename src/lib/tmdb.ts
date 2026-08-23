import { cache } from './cache';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_ACCESS_TOKEN = process.env.TMDB_API_READ_ACCESS_TOKEN;

export const fetchFromTMDB = async (
  endpoint: string,
  params: Record<string, string | number> = {},
  ttlSeconds = 300
) => {
  const cacheKey = `tmdb:${endpoint}:${JSON.stringify(params)}`;

  return cache.getOrFetch(
    cacheKey,
    async () => {
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
    },
    ttlSeconds
  );
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

export interface SeasonSummary {
  id: number;
  season_number: number;
  name: string;
  overview?: string;
  episode_count: number;
  poster_path: string | null;
  air_date?: string | null;
}

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  vote_average: number;
  runtime?: number;
}

export interface SeasonDetails {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  episodes: Episode[];
}

export interface Movie {
  id: number;
  media_type?: 'movie' | 'tv';
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
  // TV Series specific attributes
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: SeasonSummary[];
  first_air_date?: string;
}

export type MediaItem = Movie;

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

/**
 * Fetch genres for Movies
 */
export const getMovieGenres = async (language = 'en-US'): Promise<Genre[]> => {
  const data = await fetchFromTMDB('/genre/movie/list', { language }, 3600);
  return data.genres as Genre[];
};

/**
 * Fetch genres for TV Series
 */
export const getTVGenres = async (language = 'en-US'): Promise<Genre[]> => {
  const data = await fetchFromTMDB('/genre/tv/list', { language }, 3600);
  return data.genres as Genre[];
};

/**
 * Combined genres (Movies + TV series merged uniquely)
 */
export const getGenres = async (language = 'en-US'): Promise<Genre[]> => {
  const [movieGenres, tvGenres] = await Promise.allSettled([
    getMovieGenres(language),
    getTVGenres(language),
  ]);

  const map = new Map<number, Genre>();
  if (movieGenres.status === 'fulfilled') {
    movieGenres.value.forEach((g) => map.set(g.id, g));
  }
  if (tvGenres.status === 'fulfilled') {
    tvGenres.value.forEach((g) => {
      if (!map.has(g.id)) map.set(g.id, g);
    });
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Normalize TV raw TMDB object into MediaItem (Movie format)
 */
const normalizeTVShow = (tv: Record<string, unknown>): Movie => {
  return {
    id: Number(tv.id),
    media_type: 'tv',
    title: String(tv.name || tv.original_name || 'Untitled'),
    original_title: String(tv.original_name || tv.name || 'Untitled'),
    overview: String(tv.overview || ''),
    poster_path: (tv.poster_path as string) || null,
    backdrop_path: (tv.backdrop_path as string) || null,
    release_date: String(tv.first_air_date || ''),
    first_air_date: String(tv.first_air_date || ''),
    vote_average: Number(tv.vote_average || 0),
    vote_count: Number(tv.vote_count || 0),
    genre_ids: Array.isArray(tv.genre_ids) ? (tv.genre_ids as number[]) : [],
    genres: tv.genres as Genre[] | undefined,
    original_language: String(tv.original_language || 'en'),
    number_of_seasons: tv.number_of_seasons ? Number(tv.number_of_seasons) : undefined,
    number_of_episodes: tv.number_of_episodes ? Number(tv.number_of_episodes) : undefined,
    seasons: (tv.seasons as SeasonSummary[]) || undefined,
  };
};

/**
 * Normalize Movie raw TMDB object into MediaItem
 */
const normalizeMovie = (m: Record<string, unknown>): Movie => {
  return {
    id: Number(m.id),
    media_type: 'movie',
    title: String(m.title || m.original_title || 'Untitled'),
    original_title: String(m.original_title || m.title || 'Untitled'),
    overview: String(m.overview || ''),
    poster_path: (m.poster_path as string) || null,
    backdrop_path: (m.backdrop_path as string) || null,
    release_date: String(m.release_date || ''),
    vote_average: Number(m.vote_average || 0),
    vote_count: Number(m.vote_count || 0),
    genre_ids: Array.isArray(m.genre_ids) ? (m.genre_ids as number[]) : [],
    genres: m.genres as Genre[] | undefined,
    runtime: m.runtime ? Number(m.runtime) : undefined,
    original_language: String(m.original_language || 'en'),
    imdb_id: (m.imdb_id as string) || null,
  };
};

/**
 * Fetch complete Movie details (with cast, trailer, and IMDb ID)
 */
export const getMovieDetails = async (movieId: number, language = 'en-US'): Promise<Partial<Movie>> => {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/movies/${movieId}?language=${language}`);
    if (!res.ok) throw new Error('Failed to fetch movie details');
    return await res.json();
  }

  const [details, credits, videos] = await Promise.all([
    fetchFromTMDB(`/movie/${movieId}`, { language }, 600),
    fetchFromTMDB(`/movie/${movieId}/credits`, { language }, 600),
    fetchFromTMDB(`/movie/${movieId}/videos`, { language }, 600),
  ]);

  const cast = (credits.cast || []).slice(0, 8).map((c: { id: number; name: string; character: string; profile_path: string | null }) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profile_path: c.profile_path,
  }));

  const trailer = (videos.results || []).find(
    (v: { type: string; site: string; key: string }) => v.type === 'Trailer' && v.site === 'YouTube'
  ) || (videos.results || [])[0];

  return {
    media_type: 'movie',
    genres: details.genres,
    runtime: details.runtime,
    imdb_id: details.imdb_id || null,
    cast,
    trailer_key: trailer?.key || null,
  };
};

/**
 * Fetch complete TV Show details (with cast, trailer, external IDs, and seasons)
 */
export const getTVDetails = async (tvId: number, language = 'en-US'): Promise<Partial<Movie>> => {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/tv/${tvId}?language=${language}`);
    if (!res.ok) throw new Error('Failed to fetch TV details');
    return await res.json();
  }

  const [details, credits, videos, externalIds] = await Promise.all([
    fetchFromTMDB(`/tv/${tvId}`, { language }, 600),
    fetchFromTMDB(`/tv/${tvId}/credits`, { language }, 600),
    fetchFromTMDB(`/tv/${tvId}/videos`, { language }, 600),
    fetchFromTMDB(`/tv/${tvId}/external_ids`, {}, 600).catch(() => ({ imdb_id: null })),
  ]);

  const cast = (credits.cast || []).slice(0, 8).map((c: { id: number; name: string; character: string; profile_path: string | null }) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profile_path: c.profile_path,
  }));

  const trailer = (videos.results || []).find(
    (v: { type: string; site: string; key: string }) => v.type === 'Trailer' && v.site === 'YouTube'
  ) || (videos.results || [])[0];

  // Filter valid seasons (omit specials season 0 if preferred, or keep all)
  const seasons: SeasonSummary[] = (details.seasons || [])
    .filter((s: { season_number: number }) => s.season_number > 0)
    .map((s: { id: number; season_number: number; name: string; overview?: string; episode_count: number; poster_path: string | null; air_date?: string }) => ({
      id: s.id,
      season_number: s.season_number,
      name: s.name,
      overview: s.overview,
      episode_count: s.episode_count,
      poster_path: s.poster_path,
      air_date: s.air_date,
    }));

  return {
    media_type: 'tv',
    title: details.name,
    original_title: details.original_name,
    genres: details.genres,
    number_of_seasons: details.number_of_seasons,
    number_of_episodes: details.number_of_episodes,
    seasons,
    imdb_id: externalIds.imdb_id || null,
    cast,
    trailer_key: trailer?.key || null,
    runtime: details.episode_run_time?.[0] || undefined,
  };
};

/**
 * Fetch episode breakdown for a specific TV Season
 */
export const getSeasonDetails = async (
  tvId: number,
  seasonNumber: number,
  language = 'en-US'
): Promise<SeasonDetails> => {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/tv/${tvId}/season/${seasonNumber}?language=${language}`);
    if (!res.ok) throw new Error('Failed to fetch season details');
    return await res.json();
  }

  const data = await fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}`, { language }, 600);

  const episodes: Episode[] = (data.episodes || []).map((ep: {
    id: number;
    episode_number: number;
    season_number: number;
    name: string;
    overview: string;
    still_path: string | null;
    air_date: string | null;
    vote_average: number;
    runtime?: number;
  }) => ({
    id: ep.id,
    episode_number: ep.episode_number,
    season_number: ep.season_number,
    name: ep.name,
    overview: ep.overview,
    still_path: ep.still_path,
    air_date: ep.air_date,
    vote_average: ep.vote_average,
    runtime: ep.runtime,
  }));

  return {
    id: data.id,
    season_number: data.season_number,
    name: data.name,
    overview: data.overview || '',
    poster_path: data.poster_path || null,
    episodes,
  };
};

/**
 * Unified Random Media (Movie, TV Show, or Both)
 */
export const getRandomMedia = async ({
  type = 'all',
  genre,
  yearFrom,
  yearTo,
  originalLanguage,
  imdbMin,
  imdbMax,
}: {
  type?: 'movie' | 'tv' | 'all';
  genre?: string;
  yearFrom?: string;
  yearTo?: string;
  originalLanguage?: string;
  imdbMin?: number;
  imdbMax?: number;
}): Promise<Movie | null> => {
  const chosenType: 'movie' | 'tv' =
    type === 'all' ? (Math.random() > 0.5 ? 'movie' : 'tv') : type;

  const endpoint = chosenType === 'movie' ? '/discover/movie' : '/discover/tv';

  const initialParams: Record<string, string | number> = {
    include_adult: 'false',
    language: 'en-US',
    sort_by: 'popularity.desc',
    'vote_count.gte': chosenType === 'movie' ? 50 : 25,
  };

  if (genre) initialParams.with_genres = genre;
  if (originalLanguage) initialParams.with_original_language = originalLanguage;

  if (chosenType === 'movie') {
    if (yearFrom) initialParams['primary_release_date.gte'] = `${yearFrom}-01-01`;
    if (yearTo) initialParams['primary_release_date.lte'] = `${yearTo}-12-31`;
  } else {
    if (yearFrom) initialParams['first_air_date.gte'] = `${yearFrom}-01-01`;
    if (yearTo) initialParams['first_air_date.lte'] = `${yearTo}-12-31`;
  }

  if (imdbMin !== undefined && imdbMin > 0) {
    initialParams['vote_average.gte'] = imdbMin;
  }
  if (imdbMax !== undefined && imdbMax < 10) {
    initialParams['vote_average.lte'] = imdbMax;
  }

  const initialData = await fetchFromTMDB(endpoint, initialParams, 120);

  if (!initialData.results || initialData.results.length === 0) {
    // If 'all' was selected and chosen branch had 0 results, try other branch
    if (type === 'all') {
      return getRandomMedia({
        type: chosenType === 'movie' ? 'tv' : 'movie',
        genre,
        yearFrom,
        yearTo,
        originalLanguage,
        imdbMin,
        imdbMax,
      });
    }
    return null;
  }

  const totalPages = Math.min(initialData.total_pages, 500);
  const randomPage = Math.floor(Math.random() * totalPages) + 1;

  const randomPageParams = { ...initialParams, page: randomPage };
  const randomPageData = await fetchFromTMDB(endpoint, randomPageParams, 120);

  const rawResults = randomPageData.results as Record<string, unknown>[];
  if (!rawResults || rawResults.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * rawResults.length);
  const rawItem = rawResults[randomIndex];

  if (chosenType === 'tv') {
    const tvNormalized = normalizeTVShow(rawItem);
    const details = await getTVDetails(tvNormalized.id);
    return {
      ...tvNormalized,
      ...details,
    };
  } else {
    const movieNormalized = normalizeMovie(rawItem);
    const details = await getMovieDetails(movieNormalized.id);
    return {
      ...movieNormalized,
      ...details,
    };
  }
};

/**
 * Backward compatible alias for movie roulette
 */
export const getRandomMovie = async (params: {
  genre?: string;
  yearFrom?: string;
  yearTo?: string;
  originalLanguage?: string;
  imdbMin?: number;
  imdbMax?: number;
}) => {
  return getRandomMedia({ ...params, type: 'movie' });
};

/**
 * Popular media for the idle stage (Movies & TV Series)
 */
export const getPopularMedia = async (
  type: 'movie' | 'tv' | 'all' = 'all',
  language = 'en-US',
  limit = 18
): Promise<Movie[]> => {
  if (type === 'tv') {
    const data = await fetchFromTMDB('/discover/tv', {
      include_adult: 'false',
      language,
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
    }, 600);
    return ((data.results || []) as Record<string, unknown>[]).slice(0, limit).map(normalizeTVShow);
  }

  if (type === 'movie') {
    const data = await fetchFromTMDB('/discover/movie', {
      include_adult: 'false',
      language,
      sort_by: 'popularity.desc',
      'vote_count.gte': 200,
    }, 600);
    return ((data.results || []) as Record<string, unknown>[]).slice(0, limit).map(normalizeMovie);
  }

  // Combined mix of popular Movies and TV series
  const [movieRes, tvRes] = await Promise.allSettled([
    fetchFromTMDB('/discover/movie', {
      include_adult: 'false',
      language,
      sort_by: 'popularity.desc',
      'vote_count.gte': 200,
    }, 600),
    fetchFromTMDB('/discover/tv', {
      include_adult: 'false',
      language,
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
    }, 600),
  ]);

  const movies: Movie[] =
    movieRes.status === 'fulfilled'
      ? ((movieRes.value.results || []) as Record<string, unknown>[]).map(normalizeMovie)
      : [];
  const tvs: Movie[] =
    tvRes.status === 'fulfilled'
      ? ((tvRes.value.results || []) as Record<string, unknown>[]).map(normalizeTVShow)
      : [];

  const combined: Movie[] = [];
  const maxLen = Math.max(movies.length, tvs.length);
  for (let i = 0; i < maxLen; i++) {
    if (movies[i]) combined.push(movies[i]);
    if (tvs[i]) combined.push(tvs[i]);
  }

  return combined.slice(0, limit);
};

export const getPopularMovies = async (language = 'en-US', limit = 18) => {
  return getPopularMedia('movie', language, limit);
};

/**
 * Unified Search across Movies and TV Shows
 */
export const searchMedia = async (
  query: string,
  type: 'movie' | 'tv' | 'all' = 'all',
  language = 'en-US'
): Promise<Movie[]> => {
  if (!query.trim()) return [];

  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}&type=${type}&language=${language}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []) as Movie[];
  }

  if (type === 'movie') {
    const data = await fetchFromTMDB('/search/movie', { query, language, include_adult: 'false' }, 120);
    return ((data.results || []) as Record<string, unknown>[]).map(normalizeMovie);
  }

  if (type === 'tv') {
    const data = await fetchFromTMDB('/search/tv', { query, language, include_adult: 'false' }, 120);
    return ((data.results || []) as Record<string, unknown>[]).map(normalizeTVShow);
  }

  const multiData = await fetchFromTMDB('/search/multi', { query, language, include_adult: 'false' }, 120);
  const results = (multiData.results || []) as (Record<string, unknown> & { media_type?: string })[];

  return results
    .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
    .map((item) => (item.media_type === 'tv' ? normalizeTVShow(item) : normalizeMovie(item)));
};

export const searchMovies = async (query: string, language = 'en-US') => {
  return searchMedia(query, 'all', language);
};

export const getImageUrl = (path: string | null, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500') => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};
