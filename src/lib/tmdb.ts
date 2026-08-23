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
  air_date: string | null;
  episodes: Episode[];
}

export interface Movie {
  id: number;
  title: string;
  original_title?: string;
  media_type: 'movie' | 'tv';
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

const FALLBACK_MOVIE_GENRES: Genre[] = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

const FALLBACK_TV_GENRES: Genre[] = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 10762, name: 'Kids' },
  { id: 9648, name: 'Mystery' },
  { id: 10763, name: 'News' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 10768, name: 'War & Politics' },
  { id: 37, name: 'Western' },
];

const FALLBACK_MOVIES: Movie[] = [
  {
    id: 550,
    title: 'Fight Club',
    original_title: 'Fight Club',
    media_type: 'movie',
    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
    poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    release_date: '1999-10-15',
    vote_average: 8.4,
    vote_count: 27800,
    genre_ids: [18, 53],
    genres: [{ id: 18, name: 'Drama' }, { id: 53, name: 'Thriller' }],
    runtime: 139,
    original_language: 'en',
    imdb_id: 'tt0137523',
    trailer_key: 'O1nDozs-L58',
    cast: [
      { id: 819, name: 'Edward Norton', character: 'The Narrator', profile_path: '/5XBzD5WuTyVQ2kv60vTuG4V4s7u.jpg' },
      { id: 287, name: 'Brad Pitt', character: 'Tyler Durden', profile_path: '/cckcYc2v0yh1tc9QjRelptsqArn.jpg' },
      { id: 1283, name: 'Helena Bonham Carter', character: 'Marla Singer', profile_path: '/DDeitAWEMeHq9ipd7P52a657N7.jpg' },
    ],
  },
  {
    id: 27205,
    title: 'Inception',
    original_title: 'Inception',
    media_type: 'movie',
    overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life.',
    poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    backdrop_path: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    release_date: '2010-07-15',
    vote_average: 8.4,
    vote_count: 35000,
    genre_ids: [28, 878, 12],
    genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Science Fiction' }],
    runtime: 148,
    original_language: 'en',
    imdb_id: 'tt1375666',
    trailer_key: 'YoHD9XEInc0',
    cast: [
      { id: 6193, name: 'Leonardo DiCaprio', character: 'Dom Cobb', profile_path: '/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg' },
      { id: 24045, name: 'Joseph Gordon-Levitt', character: 'Arthur', profile_path: '/dhv93w0P7QfV8n3kFv70A887iL5.jpg' },
    ],
  },
  {
    id: 157336,
    title: 'Interstellar',
    original_title: 'Interstellar',
    media_type: 'movie',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    release_date: '2014-11-05',
    vote_average: 8.4,
    vote_count: 33000,
    genre_ids: [12, 18, 878],
    genres: [{ id: 12, name: 'Adventure' }, { id: 18, name: 'Drama' }, { id: 878, name: 'Science Fiction' }],
    runtime: 169,
    original_language: 'en',
    imdb_id: 'tt0816692',
    trailer_key: 'zSWdZVtXT7E',
  },
];

const FALLBACK_TVS: Movie[] = [
  {
    id: 1399,
    title: 'Game of Thrones',
    original_title: 'Game of Thrones',
    media_type: 'tv',
    overview: 'Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war.',
    poster_path: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    backdrop_path: '/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg',
    release_date: '2011-04-17',
    first_air_date: '2011-04-17',
    vote_average: 8.4,
    vote_count: 23000,
    genre_ids: [10765, 18, 10759],
    genres: [{ id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 18, name: 'Drama' }],
    original_language: 'en',
    imdb_id: 'tt0944947',
    trailer_key: 'KPLWWIOCOOQ',
    number_of_seasons: 8,
    number_of_episodes: 73,
    seasons: [
      { id: 3624, season_number: 1, name: 'Season 1', episode_count: 10, poster_path: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg' },
      { id: 3625, season_number: 2, name: 'Season 2', episode_count: 10, poster_path: '/2 OMB0ynKlyIenMJWI2Dy9IWT4c.jpg' },
      { id: 3626, season_number: 3, name: 'Season 3', episode_count: 10, poster_path: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg' },
    ],
  },
  {
    id: 1396,
    title: 'Breaking Bad',
    original_title: 'Breaking Bad',
    media_type: 'tv',
    overview: 'Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of two years left to live.',
    poster_path: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
    backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    release_date: '2008-01-20',
    first_air_date: '2008-01-20',
    vote_average: 8.9,
    vote_count: 14000,
    genre_ids: [18, 80],
    genres: [{ id: 18, name: 'Drama' }, { id: 80, name: 'Crime' }],
    original_language: 'en',
    imdb_id: 'tt0903747',
    number_of_seasons: 5,
    number_of_episodes: 62,
    seasons: [
      { id: 3572, season_number: 1, name: 'Season 1', episode_count: 7, poster_path: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg' },
      { id: 3573, season_number: 2, name: 'Season 2', episode_count: 13, poster_path: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg' },
    ],
  },
];

/**
 * Fetch genres for Movies
 */
export const getMovieGenres = async (language = 'en-US'): Promise<Genre[]> => {
  try {
    const data = await fetchFromTMDB('/genre/movie/list', { language }, 3600);
    return (data.genres as Genre[]) || FALLBACK_MOVIE_GENRES;
  } catch {
    return FALLBACK_MOVIE_GENRES;
  }
};

/**
 * Fetch genres for TV Series
 */
export const getTVGenres = async (language = 'en-US'): Promise<Genre[]> => {
  try {
    const data = await fetchFromTMDB('/genre/tv/list', { language }, 3600);
    return (data.genres as Genre[]) || FALLBACK_TV_GENRES;
  } catch {
    return FALLBACK_TV_GENRES;
  }
};

/**
 * Combined genres (Movies + TV series merged uniquely)
 */
export const getGenres = async (language = 'en-US'): Promise<Genre[]> => {
  const [movieGenres, tvGenres] = await Promise.allSettled([
    getMovieGenres(language),
    getTVGenres(language),
  ]);

  const map = new Map<number, string>();

  if (movieGenres.status === 'fulfilled') {
    movieGenres.value.forEach((g) => map.set(g.id, g.name));
  }
  if (tvGenres.status === 'fulfilled') {
    tvGenres.value.forEach((g) => {
      if (!map.has(g.id)) map.set(g.id, g.name);
    });
  }

  if (map.size === 0) {
    FALLBACK_MOVIE_GENRES.forEach((g) => map.set(g.id, g.name));
  }

  return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
};

export const normalizeMovie = (raw: Record<string, unknown>): Movie => {
  return {
    id: Number(raw.id),
    title: String(raw.title || raw.name || 'Untitled'),
    original_title: raw.original_title ? String(raw.original_title) : undefined,
    media_type: 'movie',
    overview: String(raw.overview || ''),
    poster_path: (raw.poster_path as string) || null,
    backdrop_path: (raw.backdrop_path as string) || null,
    release_date: String(raw.release_date || raw.first_air_date || ''),
    vote_average: Number(raw.vote_average || 0),
    vote_count: Number(raw.vote_count || 0),
    genre_ids: Array.isArray(raw.genre_ids) ? (raw.genre_ids as number[]) : [],
    genres: Array.isArray(raw.genres) ? (raw.genres as Genre[]) : undefined,
    runtime: raw.runtime ? Number(raw.runtime) : undefined,
    original_language: String(raw.original_language || 'en'),
    imdb_id: (raw.imdb_id as string) || null,
  };
};

export const normalizeTVShow = (raw: Record<string, unknown>): Movie => {
  const seasonsRaw = Array.isArray(raw.seasons) ? (raw.seasons as Record<string, unknown>[]) : [];
  const seasons: SeasonSummary[] = seasonsRaw.map((s) => ({
    id: Number(s.id || 0),
    season_number: Number(s.season_number || 0),
    name: String(s.name || `Season ${s.season_number}`),
    overview: s.overview ? String(s.overview) : undefined,
    episode_count: Number(s.episode_count || 0),
    poster_path: (s.poster_path as string) || null,
    air_date: (s.air_date as string) || null,
  }));

  return {
    id: Number(raw.id),
    title: String(raw.name || raw.title || 'Untitled Series'),
    original_title: raw.original_name ? String(raw.original_name) : undefined,
    media_type: 'tv',
    overview: String(raw.overview || ''),
    poster_path: (raw.poster_path as string) || null,
    backdrop_path: (raw.backdrop_path as string) || null,
    release_date: String(raw.first_air_date || raw.release_date || ''),
    first_air_date: String(raw.first_air_date || raw.release_date || ''),
    vote_average: Number(raw.vote_average || 0),
    vote_count: Number(raw.vote_count || 0),
    genre_ids: Array.isArray(raw.genre_ids) ? (raw.genre_ids as number[]) : [],
    genres: Array.isArray(raw.genres) ? (raw.genres as Genre[]) : undefined,
    original_language: String(raw.original_language || 'en'),
    imdb_id: (raw.imdb_id as string) || null,
    number_of_seasons: raw.number_of_seasons ? Number(raw.number_of_seasons) : seasons.length || 1,
    number_of_episodes: raw.number_of_episodes ? Number(raw.number_of_episodes) : undefined,
    seasons: seasons.length > 0 ? seasons : undefined,
  };
};

export const getMovieDetails = async (movieId: number, language = 'en-US'): Promise<Partial<Movie>> => {
  try {
    const data = await fetchFromTMDB(`/movie/${movieId}`, {
      language,
      append_to_response: 'credits,videos,external_ids',
    }, 600);

    const cast: CastMember[] = (data.credits?.cast || []).slice(0, 10).map((c: Record<string, unknown>) => ({
      id: Number(c.id),
      name: String(c.name),
      character: String(c.character || ''),
      profile_path: (c.profile_path as string) || null,
    }));

    const trailer = (data.videos?.results || []).find(
      (v: { site: string; type: string }) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );

    return {
      runtime: data.runtime ? Number(data.runtime) : undefined,
      genres: (data.genres as Genre[]) || [],
      cast,
      trailer_key: trailer?.key || null,
      imdb_id: data.external_ids?.imdb_id || data.imdb_id || null,
    };
  } catch {
    const fallback = FALLBACK_MOVIES.find((m) => m.id === movieId);
    if (fallback) return fallback;
    return {
      cast: [],
      genres: [],
    };
  }
};

export const getTVDetails = async (tvId: number, language = 'en-US'): Promise<Partial<Movie>> => {
  try {
    const data = await fetchFromTMDB(`/tv/${tvId}`, {
      language,
      append_to_response: 'credits,videos,external_ids',
    }, 600);

    const cast: CastMember[] = (data.credits?.cast || []).slice(0, 10).map((c: Record<string, unknown>) => ({
      id: Number(c.id),
      name: String(c.name),
      character: String(c.character || ''),
      profile_path: (c.profile_path as string) || null,
    }));

    const trailer = (data.videos?.results || []).find(
      (v: { site: string; type: string }) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );

    const seasonsRaw = Array.isArray(data.seasons) ? (data.seasons as Record<string, unknown>[]) : [];
    const seasons: SeasonSummary[] = seasonsRaw
      .filter((s) => Number(s.season_number) > 0)
      .map((s) => ({
        id: Number(s.id || 0),
        season_number: Number(s.season_number || 0),
        name: String(s.name || `Season ${s.season_number}`),
        overview: s.overview ? String(s.overview) : undefined,
        episode_count: Number(s.episode_count || 0),
        poster_path: (s.poster_path as string) || null,
        air_date: (s.air_date as string) || null,
      }));

    return {
      genres: (data.genres as Genre[]) || [],
      cast,
      trailer_key: trailer?.key || null,
      imdb_id: data.external_ids?.imdb_id || null,
      number_of_seasons: data.number_of_seasons ? Number(data.number_of_seasons) : seasons.length || 1,
      number_of_episodes: data.number_of_episodes ? Number(data.number_of_episodes) : undefined,
      seasons,
    };
  } catch {
    const fallback = FALLBACK_TVS.find((t) => t.id === tvId);
    if (fallback) return fallback;
    return {
      cast: [],
      genres: [],
      number_of_seasons: 1,
      seasons: [{ id: 1, season_number: 1, name: 'Season 1', episode_count: 10, poster_path: null }],
    };
  }
};

export const getSeasonDetails = async (
  tvId: number,
  seasonNumber: number,
  language = 'en-US'
): Promise<SeasonDetails> => {
  try {
    const data = await fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}`, { language }, 600);

    const episodes: Episode[] = (data.episodes || []).map((e: Record<string, unknown>) => ({
      id: Number(e.id),
      episode_number: Number(e.episode_number),
      season_number: Number(e.season_number),
      name: String(e.name || `Episode ${e.episode_number}`),
      overview: String(e.overview || ''),
      still_path: (e.still_path as string) || null,
      air_date: (e.air_date as string) || null,
      vote_average: Number(e.vote_average || 0),
      runtime: e.runtime ? Number(e.runtime) : undefined,
    }));

    return {
      id: Number(data.id || seasonNumber),
      season_number: Number(data.season_number || seasonNumber),
      name: String(data.name || `Season ${seasonNumber}`),
      overview: String(data.overview || ''),
      poster_path: (data.poster_path as string) || null,
      air_date: (data.air_date as string) || null,
      episodes,
    };
  } catch {
    const mockEpisodes: Episode[] = Array.from({ length: 10 }, (_, i) => ({
      id: tvId * 100 + seasonNumber * 10 + (i + 1),
      episode_number: i + 1,
      season_number: seasonNumber,
      name: `Episode ${i + 1}`,
      overview: `Episode ${i + 1} of season ${seasonNumber}.`,
      still_path: null,
      air_date: '2024-01-01',
      vote_average: 8.0,
      runtime: 50,
    }));

    return {
      id: seasonNumber,
      season_number: seasonNumber,
      name: `Season ${seasonNumber}`,
      overview: `Season ${seasonNumber} episodes`,
      poster_path: null,
      air_date: '2024-01-01',
      episodes: mockEpisodes,
    };
  }
};

export const getRandomMedia = async (params: {
  type?: 'movie' | 'tv' | 'all';
  genre?: string;
  yearFrom?: string;
  yearTo?: string;
  originalLanguage?: string;
  imdbMin?: number;
  imdbMax?: number;
}): Promise<Movie | null> => {
  const {
    type = 'all',
    genre,
    yearFrom,
    yearTo,
    originalLanguage,
    imdbMin,
    imdbMax,
  } = params;

  const chosenType: 'movie' | 'tv' =
    type === 'all' ? (Math.random() > 0.5 ? 'movie' : 'tv') : type;

  try {
    const endpoint = chosenType === 'tv' ? '/discover/tv' : '/discover/movie';

    const initialParams: Record<string, string | number> = {
      include_adult: 'false',
      sort_by: 'popularity.desc',
      'vote_count.gte': chosenType === 'tv' ? 80 : 150,
    };

    if (genre) initialParams['with_genres'] = genre;
    if (originalLanguage) initialParams['with_original_language'] = originalLanguage;

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
      throw new Error('No results');
    }

    const totalPages = Math.min(initialData.total_pages, 500);
    const randomPage = Math.floor(Math.random() * totalPages) + 1;

    const randomPageParams = { ...initialParams, page: randomPage };
    const randomPageData = await fetchFromTMDB(endpoint, randomPageParams, 120);

    const rawResults = randomPageData.results as Record<string, unknown>[];
    if (!rawResults || rawResults.length === 0) throw new Error('No results');

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
  } catch {
    // Robust offline catalog fallback
    const list = chosenType === 'tv' ? FALLBACK_TVS : FALLBACK_MOVIES;
    const selected = list[Math.floor(Math.random() * list.length)];
    return selected;
  }
};

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

export const getPopularMedia = async (
  type: 'movie' | 'tv' | 'all' = 'all',
  language = 'en-US',
  limit = 18
): Promise<Movie[]> => {
  try {
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

    if (combined.length > 0) {
      return combined.slice(0, limit);
    }
    return [...FALLBACK_MOVIES, ...FALLBACK_TVS];
  } catch {
    return [...FALLBACK_MOVIES, ...FALLBACK_TVS];
  }
};

export const getPopularMovies = async (language = 'en-US', limit = 18) => {
  return getPopularMedia('movie', language, limit);
};

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

  try {
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
  } catch {
    const q = query.toLowerCase();
    const all = [...FALLBACK_MOVIES, ...FALLBACK_TVS];
    return all.filter((m) => m.title.toLowerCase().includes(q));
  }
};

export const searchMovies = async (query: string, language = 'en-US') => {
  return searchMedia(query, 'all', language);
};

export const getImageUrl = (path: string | null, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500') => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};
