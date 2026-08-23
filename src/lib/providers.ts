/**
 * Verified 2026 Public Embed Video Stream Providers & Automated Fallback Chain
 *
 * Implements a 3-tier priority matrix:
 * - Primary Tier (High Priority, Low Ads, ~98% Uptime): Videasy, Vidlink, VidKing, VidSrc
 * - Secondary Tier (Fallback, High Availability): AutoEmbed, Embed.su, LordFlix, 2Embed, SuperEmbed
 * - Tertiary Tier (Last Resort): SmashyStream
 */

export type ProviderTier = 'primary' | 'secondary' | 'tertiary';

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
  tier: ProviderTier;
  reliability: number; // Percentage / score
  supportsTv: boolean;
  supportsMovie: boolean;
  getUrl: (params: StreamParams) => string | null;
}

export const STREAM_PROVIDERS: StreamProvider[] = [
  // ==========================================
  // PRIMARY TIER (High Priority, Low Ads, ~98% Uptime)
  // ==========================================
  {
    id: 'videasy',
    name: 'Server 1 (Videasy HD)',
    shortName: 'Videasy',
    tier: 'primary',
    reliability: 98,
    supportsTv: true,
    supportsMovie: true,
    getUrl: ({ tmdbId, mediaType, season = 1, episode = 1 }) => {
      if (mediaType === 'tv') {
        return `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://player.videasy.net/movie/${tmdbId}`;
    },
  },
  {
    id: 'vidlink',
    name: 'Server 2 (Vidlink Pro)',
    shortName: 'Vidlink',
    tier: 'primary',
    reliability: 97,
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
    id: 'vidking',
    name: 'Server 3 (VidKing 4K)',
    shortName: 'VidKing',
    tier: 'primary',
    reliability: 96,
    supportsTv: true,
    supportsMovie: true,
    getUrl: ({ tmdbId, mediaType, season = 1, episode = 1 }) => {
      if (mediaType === 'tv') {
        return `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://www.vidking.net/embed/movie/${tmdbId}`;
    },
  },
  {
    id: 'vidsrc',
    name: 'Server 4 (VidSrc CC)',
    shortName: 'VidSrc',
    tier: 'primary',
    reliability: 95,
    supportsTv: true,
    supportsMovie: true,
    getUrl: ({ tmdbId, imdbId, mediaType, season = 1, episode = 1 }) => {
      const identifier = imdbId || tmdbId;
      if (!identifier) return null;
      if (mediaType === 'tv') {
        return `https://vidsrc.cc/v2/embed/tv/${identifier}/${season}/${episode}`;
      }
      return `https://vidsrc.cc/v2/embed/movie/${identifier}`;
    },
  },

  // ==========================================
  // SECONDARY TIER (Fallback, High Availability)
  // ==========================================
  {
    id: 'autoembed',
    name: 'Server 5 (AutoEmbed)',
    shortName: 'AutoEmbed',
    tier: 'secondary',
    reliability: 94,
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
    name: 'Server 6 (Embed.su)',
    shortName: 'Embed.su',
    tier: 'secondary',
    reliability: 93,
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
    id: 'lordflix',
    name: 'Server 7 (LordFlix)',
    shortName: 'LordFlix',
    tier: 'secondary',
    reliability: 92,
    supportsTv: true,
    supportsMovie: true,
    getUrl: ({ tmdbId, mediaType, season = 1, episode = 1 }) => {
      if (mediaType === 'tv') {
        return `https://snowhouse.lordflix.club/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://snowhouse.lordflix.club/movie/${tmdbId}`;
    },
  },
  {
    id: '2embed',
    name: 'Server 8 (2Embed)',
    shortName: '2Embed',
    tier: 'secondary',
    reliability: 90,
    supportsTv: true,
    supportsMovie: true,
    getUrl: ({ tmdbId, mediaType, season = 1, episode = 1 }) => {
      if (mediaType === 'tv') {
        return `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`;
      }
      return `https://www.2embed.cc/embed/${tmdbId}`;
    },
  },
  {
    id: 'superembed',
    name: 'Server 9 (SuperEmbed)',
    shortName: 'SuperEmbed',
    tier: 'secondary',
    reliability: 89,
    supportsTv: true,
    supportsMovie: true,
    getUrl: ({ tmdbId, imdbId, mediaType, season = 1, episode = 1 }) => {
      const identifier = imdbId || tmdbId;
      if (!identifier) return null;
      if (mediaType === 'tv') {
        return `https://getsuperembed.link/?video_id=${identifier}&season=${season}&episode=${episode}`;
      }
      return `https://getsuperembed.link/?video_id=${identifier}`;
    },
  },

  // ==========================================
  // TERTIARY TIER (Last Resort)
  // ==========================================
  {
    id: 'smashystream',
    name: 'Server 10 (SmashyStream)',
    shortName: 'SmashyStream',
    tier: 'tertiary',
    reliability: 85,
    supportsTv: true,
    supportsMovie: true,
    getUrl: ({ tmdbId, mediaType, season = 1, episode = 1 }) => {
      if (mediaType === 'tv') {
        return `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}&s=${season}&e=${episode}`;
      }
      return `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}`;
    },
  },
];

/**
 * Resolves stream URLs for all available providers in prioritized fallback order.
 */
export function resolveStreamSources(params: StreamParams): Array<{
  id: string;
  name: string;
  shortName: string;
  tier: ProviderTier;
  url: string;
  reliability: number;
}> {
  return STREAM_PROVIDERS
    .filter((p) => (params.mediaType === 'tv' ? p.supportsTv : p.supportsMovie))
    .map((p) => {
      const url = p.getUrl(params);
      return url
        ? {
            id: p.id,
            name: p.name,
            shortName: p.shortName,
            tier: p.tier,
            url,
            reliability: p.reliability,
          }
        : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}
