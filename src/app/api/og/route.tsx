import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/* The OG card follows the same world as the app: ink ground, the film's own
   artwork as the only colour, left-aligned composition, hard corners, one live
   accent, and the aperture mark. See DESIGN.md. */
const INK_0 = "#0B0E11";
const INK_4 = "#2A323C";
const INK_6 = "#5C6977";
const INK_8 = "#B9C4CE";
const INK_9 = "#EDF1F5";
const LIVE = "#00E054";

/**
 * Satori aborts the whole render if an <img> fails to load, which turns one
 * stale poster path into a dead share image. Confirm the file resolves first
 * and fall back to the text-only card if it does not.
 */
async function posterLoads(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "GET" });
    return res.ok && (res.headers.get("content-type") ?? "").startsWith("image/");
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get("title") || "Film Roulette";
    const posterParam = searchParams.get("poster");
    const rating = searchParams.get("rating") || "";
    const year = searchParams.get("year") || "";
    const genres = searchParams.get("genres") || "";

    const poster =
      posterParam &&
      (await posterLoads(`https://image.tmdb.org/t/p/w500${posterParam}`))
        ? posterParam
        : null;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            position: "relative",
            backgroundColor: INK_0,
            fontFamily: "sans-serif",
            overflow: "hidden",
          }}
        >
          {/* The film supplies the colour; the shell stays neutral. */}
          {poster && (
            <img
              src={`https://image.tmdb.org/t/p/w1280${poster}`}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.28,
                filter: "blur(28px)",
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(90deg, ${INK_0} 30%, rgba(11,14,17,0.55) 100%)`,
              display: "flex",
            }}
          />

          {/* Content: poster left, detail right — the stage arrangement */}
          <div
            style={{
              position: "relative",
              display: "flex",
              width: "100%",
              height: "100%",
              padding: 64,
              gap: 56,
              alignItems: "center",
            }}
          >
            {poster && (
              <img
                src={`https://image.tmdb.org/t/p/w500${poster}`}
                alt=""
                width={320}
                height={480}
                style={{
                  width: 320,
                  height: 480,
                  objectFit: "cover",
                  borderRadius: 2,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.55)",
                }}
              />
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                justifyContent: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                {/* Mark + wordmark */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <svg width="30" height="30" viewBox="0 0 32 32">
                    <mask id="og-pips">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        fill="#fff"
                        d="M16 1 28.99 8.5 28.99 23.5 16 31 3.01 23.5 3.01 8.5Z M16 9 22.06 12.5 22.06 19.5 16 23 9.94 19.5 9.94 12.5Z"
                      />
                      <circle cx="16" cy="5.6" r="1.9" fill="#000" />
                      <circle cx="25.2" cy="21.4" r="1.9" fill="#000" />
                      <circle cx="6.8" cy="21.4" r="1.9" fill="#000" />
                    </mask>
                    <rect width="32" height="32" fill={LIVE} mask="url(#og-pips)" />
                  </svg>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 17,
                      letterSpacing: 3,
                      textTransform: "uppercase",
                      color: INK_9,
                      fontWeight: 600,
                    }}
                  >
                    Film / Roulette
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    marginTop: 40,
                    fontSize: title.length > 30 ? 60 : 76,
                    lineHeight: 1.02,
                    letterSpacing: -2,
                    color: INK_9,
                    fontWeight: 700,
                  }}
                >
                  {title}
                </div>

                {genres && (
                  <div style={{ display: "flex", gap: 8, marginTop: 28 }}>
                    {genres
                      .split(",")
                      .slice(0, 4)
                      .map((g) => (
                        <div
                          key={g}
                          style={{
                            display: "flex",
                            border: `1px solid ${INK_4}`,
                            color: INK_6,
                            fontSize: 15,
                            letterSpacing: 1.4,
                            textTransform: "uppercase",
                            padding: "5px 9px",
                          }}
                        >
                          {g.trim()}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Readout strip, closed by a rule. Satori renders gradients
                  unreliably, so this is a solid hairline. */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: 44,
                  paddingTop: 22,
                  width: 460,
                  borderTop: `1px solid ${INK_4}`,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 36 }}
                >
                  {rating && (
                    <div
                      style={{ display: "flex", alignItems: "baseline", gap: 10 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          fontSize: 44,
                          color: LIVE,
                          fontWeight: 600,
                        }}
                      >
                        {rating}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          fontSize: 15,
                          letterSpacing: 2,
                          textTransform: "uppercase",
                          color: INK_6,
                        }}
                      >
                        TMDB
                      </div>
                    </div>
                  )}
                  {year && (
                    <div
                      style={{ display: "flex", fontSize: 26, color: INK_8 }}
                    >
                      {year}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch {
    return new Response("Failed to generate image", { status: 500 });
  }
}
