import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    clearTimeout(id);
    
    // Even if HEAD fails, some servers might return 405 Method Not Allowed, 
    // so we can try a partial GET if needed, but for now let's just check response.ok or response.status < 500
    return NextResponse.json({ ok: response.status < 400 });
  } catch (error) {
    console.error('Check Source Error:', error);
    return NextResponse.json({ ok: false });
  }
}
