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
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    // Derive upstream origin for Referer/Origin headers
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

    const responseHeaders = new Headers();
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    const contentType = response.headers.get('content-type');
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
    console.error('Edge Proxy Error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed or timed out', ok: false },
      {
        status: 502,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}
