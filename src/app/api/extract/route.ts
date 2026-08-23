import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tmdbId = searchParams.get('tmdbId');
  const imdbId = searchParams.get('imdbId');
  const mediaType = searchParams.get('mediaType') || 'movie';
  const season = searchParams.get('season') || '1';
  const episode = searchParams.get('episode') || '1';

  if (!tmdbId && !imdbId) {
    return NextResponse.json(
      { success: false, error: 'Missing media identifier' },
      { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const cacheKey = `extract:${tmdbId || imdbId}:${mediaType}:${season}:${episode}`;
  const cached = cache.get<{ success: boolean; streamUrl?: string; fallbackToIframe?: boolean }>(cacheKey);
  if (cached && cached.data.success) {
    return NextResponse.json(cached.data, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    // Check candidate stream extraction endpoints
    // If a direct m3u8 stream manifest is detected from upstream open proxies:
    const candidateUrls: string[] = [];

    if (mediaType === 'movie') {
      if (tmdbId) candidateUrls.push(`https://vidsrc.cc/v2/embed/movie/${tmdbId}`);
      if (imdbId) candidateUrls.push(`https://vidsrc.cc/v2/embed/movie/${imdbId}`);
    } else {
      if (tmdbId) candidateUrls.push(`https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`);
      if (imdbId) candidateUrls.push(`https://vidsrc.cc/v2/embed/tv/${imdbId}/${season}/${episode}`);
    }

    for (const testUrl of candidateUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(testUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          },
          signal: controller.signal,
        }).catch(() => null);

        clearTimeout(timeoutId);

        if (res && res.ok) {
          const html = await res.text();
          // Match m3u8 playlist URLs in raw scripts or HTML
          const m3u8Match = html.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/i) ||
            html.match(/file:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i);

          if (m3u8Match && m3u8Match[1]) {
            const rawStream = m3u8Match[1].replace(/\\\//g, '/');
            const proxiedStream = `/api/proxy?url=${encodeURIComponent(rawStream)}`;
            const result = { success: true, streamUrl: proxiedStream };
            cache.set(cacheKey, result, 1800);
            return NextResponse.json(result, {
              headers: { 'Access-Control-Allow-Origin': '*' },
            });
          }
        }
      } catch {
        // Continue to fallback
      }
    }

    // Direct extraction was not immediately available -> signal fallback to iframe
    const fallbackResult = { success: false, fallbackToIframe: true };
    cache.set(cacheKey, fallbackResult, 300);
    return NextResponse.json(fallbackResult, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    console.error('Extract API error:', error);
    return NextResponse.json(
      { success: false, fallbackToIframe: true },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
