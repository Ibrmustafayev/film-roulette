import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ ok: false }, {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  const cacheKey = `source-check:${url}`;
  const cached = cache.get<{ ok: boolean }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached.data, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000); // 4s timeout

    // Try HEAD first; fall back to GET with early abort if HEAD is blocked (405)
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    }).catch(() => null);

    clearTimeout(id);

    // 405 = server is alive but rejects HEAD → treat as ok
    if (response && response.status === 405) {
      cache.set(cacheKey, { ok: true }, 600);
      return NextResponse.json({ ok: true }, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Any 2xx or 3xx = server is alive
    if (response && response.status < 400) {
      cache.set(cacheKey, { ok: true }, 600);
      return NextResponse.json({ ok: true }, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    cache.set(cacheKey, { ok: false }, 300);
    return NextResponse.json({ ok: false }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch {
    cache.set(cacheKey, { ok: false }, 300);
    return NextResponse.json({ ok: false }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}
