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
            flexDirection: "column",
            position: "relative",
            backgroundColor: "#020617",
            fontFamily: "sans-serif",
            overflow: "hidden",
          }}
        >
          {/* Background Poster (Dramatic Blur) */}
          {poster && (
            <img
              src={`https://image.tmdb.org/t/p/w1280${poster}`}
              alt="Background"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.3,
                filter: "blur(40px) brightness(0.6) saturate(1.4)",
              }}
            />
          )}

          {/* Vignette & Gradient Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at center, transparent 0%, rgba(2,6,23,0.8) 100%), linear-gradient(to bottom, rgba(2,6,23,0.4), #020617)",
            }}
          />

          {/* Grid pattern for high-tech feel */}
          <div 
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              opacity: 0.5,
            }}
          />

          {/* Main Content */}
          <div
            style={{
              position: "relative",
              display: "flex",
              width: "100%",
              height: "100%",
              padding: "60px",
              alignItems: "center",
              gap: "60px",
            }}
          >
            {/* Movie Poster with Sophisticated Frame */}
            {poster ? (
              <div
                style={{
                  display: "flex",
                  position: "relative",
                  padding: "4px",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.2), transparent, rgba(255,255,255,0.1))",
                  borderRadius: "24px",
                  boxShadow: "0 40px 80px -20px rgba(0,0,0,0.8)",
                }}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w500${poster}`}
                  alt="Poster"
                  style={{
                    width: "320px",
                    height: "480px",
                    objectFit: "cover",
                    borderRadius: "20px",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: "320px",
                  height: "480px",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "120px",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                🎬
              </div>
            )}

            {/* Movie Info Section */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minWidth: 0,
              }}
            >
              {/* Header Branding */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "24px",
                }}
              >
                <div style={{ fontSize: "24px" }}>🎲</div>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    letterSpacing: "4px",
                    textTransform: "uppercase",
                    background: "linear-gradient(to right, #ef4444, #f87171)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  Film Roulette
                </div>
              </div>

              {/* Title with Custom Typography */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginBottom: "32px",
                }}
              >
                <h1
                  style={{
                    color: "#ffffff",
                    fontSize: title.length > 20 ? "64px" : "80px",
                    fontWeight: 900,
                    margin: 0,
                    lineHeight: 1.05,
                    letterSpacing: "-2px",
                  }}
                >
                  {title}
                </h1>
                {year && (
                  <div
                    style={{
                      fontSize: "32px",
                      color: "rgba(255,255,255,0.5)",
                      fontWeight: 600,
                      marginTop: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <span>{year}</span>
                    <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.3)" }} />
                    <span style={{ fontSize: "24px", fontWeight: 700, color: "#fcd34d" }}>MOVIE PASS</span>
                  </div>
                )}
              </div>

              {/* Details Card (Glassmorphism) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "32px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderRadius: "24px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(12px)",
                  gap: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
                  {rating && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Rating</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "#fcd34d", fontSize: "36px", fontWeight: 800 }}>{rating}</span>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "20px", fontWeight: 600, marginTop: "8px" }}>/ 10</span>
                      </div>
                    </div>
                  )}
                  
                  {genres && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Genre</span>
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
                        {genres.split(", ").slice(0, 3).map((g, i) => (
                          <span
                            key={i}
                            style={{
                              backgroundColor: "rgba(255,255,255,0.08)",
                              color: "#ffffff",
                              padding: "6px 14px",
                              borderRadius: "10px",
                              fontSize: "16px",
                              fontWeight: 600,
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* URL/Branding Footer */}
              <div
                style={{
                  marginTop: "auto",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "40px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px" }}>Available at</span>
                  <span style={{ color: "#ffffff", fontSize: "18px", fontWeight: 600, opacity: 0.8 }}>filmroulette.vercel.app</span>
                </div>
                <div 
                  style={{ 
                    padding: "10px 20px", 
                    borderRadius: "12px", 
                    backgroundColor: "rgba(239,68,68,0.1)", 
                    color: "#f87171",
                    fontSize: "14px",
                    fontWeight: 700,
                    letterSpacing: "1px"
                  }}
                >
                  #CinematicDiscovery
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
