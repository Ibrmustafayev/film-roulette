import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

/**
 * Rewrites relative and absolute URLs inside m3u8 playlist manifests to pass through this proxy.
 */
function rewriteM3U8Manifest(content: string, manifestUrl: string, proxyOrigin: string): string {
  const manifestBase = new URL(manifestUrl);
  const lines = content.split('\n');

  const rewrittenLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    // Handle URI attributes in tags like #EXT-X-KEY:METHOD=...,URI="..."
    if (trimmed.startsWith('#')) {
      return line.replace(/URI="([^"]+)"/g, (_, uri) => {
        try {
          const resolvedUri = new URL(uri, manifestBase).toString();
          const proxiedUri = `${proxyOrigin}/api/proxy?url=${encodeURIComponent(resolvedUri)}`;
          return `URI="${proxiedUri}"`;
        } catch {
          return _;
        }
      });
    }

    // Handle segment or nested m3u8 playlist URLs
    try {
      const resolved = new URL(trimmed, manifestBase).toString();
      return `${proxyOrigin}/api/proxy?url=${encodeURIComponent(resolved)}`;
    } catch {
      return line;
    }
  });

  return rewrittenLines.join('\n');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid url format' }, {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const upstreamOrigin = `${parsedTarget.protocol}//${parsedTarget.host}`;

    const forwardHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: `${upstreamOrigin}/`,
      Origin: upstreamOrigin,
    };

    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      forwardHeaders['Range'] = rangeHeader;
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: forwardHeaders,
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    const isM3U8 =
      parsedTarget.pathname.endsWith('.m3u8') ||
      contentType.includes('application/vnd.apple.mpegurl') ||
      contentType.includes('application/x-mpegurl');

    const responseHeaders = new Headers();
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    if (isM3U8) {
      const text = await response.text();
      const requestUrl = new URL(request.url);
      const proxyOrigin = `${requestUrl.protocol}//${requestUrl.host}`;
      const rewritten = rewriteM3U8Manifest(text, targetUrl, proxyOrigin);

      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      responseHeaders.set('Cache-Control', 'no-cache');
      return new NextResponse(rewritten, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    // Pass through stream segments / binary data
    if (contentType) {
      responseHeaders.set('Content-Type', contentType);
    }

    const contentRange = response.headers.get('content-range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    const acceptRanges = response.headers.get('accept-ranges');
    if (acceptRanges) {
      responseHeaders.set('Accept-Ranges', acceptRanges);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Edge Stream Proxy Error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed or timed out', ok: false },
      {
        status: 502,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}
