import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Per-IP rate limiting for the API surface.
 *
 * Deliberately in-process rather than Redis-backed: it needs no account, no
 * dashboard step and no extra credential, which keeps deployment to a git push.
 * The tradeoff is real and worth stating — serverless instances do not share
 * memory, so the effective ceiling is (limit x warm instances) rather than a
 * global one. That still turns a single-source flood into a trickle, which is
 * what the TMDB and Resend quotas actually need protecting from.
 */

type Bucket = { tokens: number; updatedAt: number };

const WINDOW_MS = 60_000;

/** Requests per minute, per IP, per route group. */
const LIMITS: Array<{ prefix: string; limit: number }> = [
  // Sends real email; the tightest budget by far.
  { prefix: "/api/feedback", limit: 5 },
  // Hits TMDB search on every keystroke burst.
  { prefix: "/api/search", limit: 40 },
  // Everything else that costs an upstream call.
  { prefix: "/api/", limit: 90 },
];

const buckets = new Map<string, Bucket>();

function limitFor(pathname: string): number | null {
  for (const rule of LIMITS) {
    if (pathname.startsWith(rule.prefix)) return rule.limit;
  }
  return null;
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Drop buckets that have fully refilled, so the map cannot grow without end. */
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (now - bucket.updatedAt > WINDOW_MS) buckets.delete(key);
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const limit = limitFor(pathname);
  if (limit === null) return NextResponse.next();

  const now = Date.now();
  sweep(now);

  const key = `${clientIp(request)}:${pathname.split("/").slice(0, 3).join("/")}`;
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.updatedAt >= WINDOW_MS) {
    buckets.set(key, { tokens: limit - 1, updatedAt: now });
    return NextResponse.next();
  }

  if (bucket.tokens <= 0) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - bucket.updatedAt)) / 1000);
    return NextResponse.json(
      { error: "rateLimited" },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  bucket.tokens -= 1;
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", String(bucket.tokens));
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
