import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get("title") || "Film Ruleti";
    const poster = searchParams.get("poster");
    const rating = searchParams.get("rating") || "";
    const year = searchParams.get("year") || "";
    const genres = searchParams.get("genres") || "";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            position: "relative",
            backgroundColor: "#020617",
            fontFamily: "sans-serif",
          }}
        >
          {/* Arka plan poster (bulanık) */}
          {poster && (
            <img
              src={`https://image.tmdb.org/t/p/w780${poster}`}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.15,
                filter: "blur(20px) saturate(1.5)",
              }}
            />
          )}

          {/* Koyu overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(2,6,23,0.95) 0%, rgba(15,23,42,0.85) 100%)",
            }}
          />

          {/* İçerik */}
          <div
            style={{
              position: "relative",
              display: "flex",
              width: "100%",
              height: "100%",
              padding: "48px",
              alignItems: "center",
              gap: "48px",
            }}
          >
            {/* Film Posteri */}
            {poster ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w500${poster}`}
                  alt="Poster"
                  style={{
                    width: "280px",
                    height: "420px",
                    objectFit: "cover",
                    borderRadius: "16px",
                    boxShadow:
                      "0 25px 50px -12px rgba(0,0,0,0.7), 0 0 40px rgba(239,68,68,0.2)",
                    border: "2px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: "280px",
                  height: "420px",
                  backgroundColor: "#1e293b",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "100px",
                  flexShrink: 0,
                }}
              >
                🎬
              </div>
            )}

            {/* Film Bilgileri */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                flex: 1,
              }}
            >
              {/* Film Ruleti etiketi */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "20px",
                    color: "#ef4444",
                    fontWeight: 700,
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                  }}
                >
                  🎲 Film Ruleti
                </div>
              </div>

              {/* Film adı */}
              <h1
                style={{
                  color: "#f8fafc",
                  fontSize: title.length > 30 ? "48px" : "56px",
                  fontWeight: 900,
                  margin: 0,
                  lineHeight: 1.1,
                  textShadow: "0 4px 20px rgba(0,0,0,0.5)",
                }}
              >
                {title}
              </h1>

              {/* IMDB + Yıl + Türler */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  marginTop: "24px",
                  flexWrap: "wrap",
                }}
              >
                {rating && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: "rgba(234,179,8,0.15)",
                      color: "#eab308",
                      padding: "8px 16px",
                      borderRadius: "12px",
                      fontSize: "28px",
                      fontWeight: 800,
                    }}
                  >
                    ⭐ {rating}/10
                  </div>
                )}
                {year && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#94a3b8",
                      fontSize: "24px",
                      fontWeight: 600,
                    }}
                  >
                    📅 {year}
                  </div>
                )}
              </div>

              {/* Türler */}
              {genres && (
                <div
                  style={{
                    display: "flex",
                    marginTop: "20px",
                    color: "#cbd5e1",
                    fontSize: "20px",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {genres.split(", ").map((g, i) => (
                    <span
                      key={i}
                      style={{
                        backgroundColor: "rgba(239,68,68,0.15)",
                        color: "#f87171",
                        padding: "4px 14px",
                        borderRadius: "20px",
                        fontSize: "18px",
                        fontWeight: 500,
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
