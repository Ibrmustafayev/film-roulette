/**
 * Streaming Providers Architecture
 * Provides high-reliability embed sources with primary and fallback stream resolution
 * for both Movies and TV Shows.
 */

export interface StreamParams {
  tmdbId: number;
  imdbId?: string | null;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
}

export interface StreamProvider {
  id: string;
  name: string;
  shortName: string;
  reliability: number; // 1 to 10
  supportsTv: boolean;
  supportsMovie: boolean;
  getUrl: (params: StreamParams) => string | null;
}

export const STREAM_PROVIDERS: StreamProvider[] = [
  {
    id: 'vidlink',
    name: 'Server 1 (VidLink HD)',
    shortName: 'VidLink',
    reliability: 9.8,
    supportsTv: true,
    supportsMovie: true,
    getUrl: ({ tmdbId, mediaType, season = 1, episode = 1 }) => {
      if (mediaType === 'tv') {
        return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=00e054&secondaryColor=0a5c25&icons=vid&autoplay=true`;
      }
      return `https://vidlink.pro/movie/${tmdbId}?primaryColor=00e054&secondaryColor=0a5c25&icons=vid&autoplay=true`;
    },
  },
  {
    id: 'vidsrc-su',
    name: 'Server 2 (VidSrc SU)',
    shortName: 'VidSrc SU',
    reliability: 9.5,
    supportsTv: true,
    supportsMovie: true,
    getUrl: ({ tmdbId, mediaType, season = 1, episode = 1 }) => {
      if (mediaType === 'tv') {
        return `https://vidsrc.su/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.su/embed/movie/${tmdbId}`;
    },
  },
  {
    id: 'autoembed',
    name: 'Server 3 (AutoEmbed)',
    shortName: 'AutoEmbed',
    reliability: 9.3,
    supportsTv: true,
    supportsMovie: true,
    getUrl: ({ tmdbId, mediaType, season = 1, episode = 1 }) => {
      if (mediaType === 'tv') {
        return `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://player.autoembed.cc/embed/movie/${tmdbId}`;
    },
  },
  {
    id: 'embedsu',
    name: 'Server 4 (EmbedSu)',
    shortName: 'EmbedSu',
    reliability: 9.2,
    supportsTv: true,
    supportsMovie: true,
    getUrl: ({ tmdbId, mediaType, season = 1, episode = 1 }) => {
      if (mediaType === 'tv') {
        return `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://embed.su/embed/movie/${tmdbId}`;
    },
  },
  {
    id: 'vidsrc-cc',
    name: 'Server 5 (VidSrc CC)',
    shortName: 'VidSrc CC',
    reliability: 9.0,
    supportsTv: true,
    supportsMovie: true,
    getUrl: ({ tmdbId, mediaType, season = 1, episode = 1 }) => {
      if (mediaType === 'tv') {
        return `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.cc/v2/embed/movie/${tmdbId}`;
    },
  },
  {
    id: 'multiembed',
    name: 'Server 6 (MultiEmbed)',
    shortName: 'MultiEmbed',
    reliability: 8.8,
    supportsTv: true,
    supportsMovie: true,
    getUrl: ({ tmdbId, imdbId, mediaType, season = 1, episode = 1 }) => {
      const idParam = imdbId || tmdbId;
      if (!idParam) return null;
      if (mediaType === 'tv') {
        return `https://multiembed.mov/?video_id=${idParam}&tmdb=1&s=${season}&e=${episode}`;
      }
      return `https://multiembed.mov/?video_id=${idParam}&tmdb=1`;
    },
  },
  {
    id: '2embed',
    name: 'Server 7 (2Embed)',
    shortName: '2Embed',
    reliability: 8.5,
    supportsTv: true,
    supportsMovie: true,
    getUrl: ({ tmdbId, mediaType, season = 1, episode = 1 }) => {
      if (mediaType === 'tv') {
        return `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`;
      }
      return `https://www.2embed.cc/embed/${tmdbId}`;
    },
  },
];

/**
 * Resolves stream URLs for all available providers matching media criteria.
 */
export function resolveStreamSources(params: StreamParams): Array<{
  id: string;
  name: string;
  shortName: string;
  url: string;
  reliability: number;
}> {
  return STREAM_PROVIDERS
    .filter((p) => (params.mediaType === 'tv' ? p.supportsTv : p.supportsMovie))
    .map((p) => {
      const url = p.getUrl(params);
      return url ? { id: p.id, name: p.name, shortName: p.shortName, url, reliability: p.reliability } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}
