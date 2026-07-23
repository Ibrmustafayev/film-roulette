import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

    // Try HEAD first; fall back to GET with early abort if HEAD is blocked (405)
    let response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    }).catch(() => null);

    clearTimeout(id);

    // 405 = server is alive but rejects HEAD → treat as ok
    if (response && response.status === 405) {
      return NextResponse.json({ ok: true });
    }

    // Any 2xx or 3xx = server is alive
    if (response && response.status < 400) {
      return NextResponse.json({ ok: true });
    }

    // HEAD failed entirely → not reachable
    return NextResponse.json({ ok: false });

  } catch {
    return NextResponse.json({ ok: false });
  }
}
