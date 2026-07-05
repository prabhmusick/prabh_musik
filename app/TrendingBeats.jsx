"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchBeats } from "@/lib/api/beats";
import { useAppShell } from "./contexts/app-shell-context";

// Color palettes for visual variety
const colorPalettes = [
  {
    bg: "linear-gradient(135deg, #1a4a2e 0%, #0d2b1a 40%, #0a1f12 100%)",
    accent: "#00ff88",
    textOverlay: true,
  },
  {
    bg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    accent: "#a0c4ff",
    textOverlay: false,
  },
  {
    bg: "linear-gradient(135deg, #2a1a2e 0%, #3e1650 50%, #601050 100%)",
    accent: "#ffffff",
    textOverlay: false,
  },
  {
    bg: "linear-gradient(135deg, #1a0030 0%, #2d0060 30%, #0a0030 60%, #200050 100%)",
    accent: "#ff00ff",
    textOverlay: false,
    cityGlow: true,
  },
];

// Map API beat to display format
function formatBeatForDisplay(beat, index) {
  const palette = colorPalettes[index % colorPalettes.length];
  return {
    ...beat,
    songs: 412, // Default fallback
    ...palette,
    id: beat.id,
    genre: beat.genre || "MUSIC",
    label: beat.beat_name,
    img: beat.cover_image_url || beat.banner_image_url,
  };
}

function MusicIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59L5.25 14c-.16.28-.25.61-.25.96C5 16.1 5.9 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0023.46 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function ChevronIcon({ direction }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d={direction === "left" ? "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" : "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"} />
    </svg>
  );
}

function BeatCard({ beat, index, onPurchase }) {
  const [hovered, setHovered] = useState(false);
  const [playHovered, setPlayHovered] = useState(false);
  const [cartHovered, setCartHovered] = useState(false);

  return (
    <div
      className="beat-card-container"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        animation: `fadeSlideUp 0.5s ease both`,
        animationDelay: `${index * 0.1}s`,
      }}
    >
      {/* Image Card */}
      <div
        className="beat-card-image"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "relative",
          borderRadius: "10px",
          overflow: "hidden",
          aspectRatio: "1 / 1",
          background: beat.bg,
          cursor: "pointer",
          transform: hovered ? "scale(1.02)" : "scale(1)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          boxShadow: hovered
            ? `0 16px 40px rgba(0,0,0,0.6), 0 0 20px ${beat.accent}33`
            : "0 8px 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* Simulated photo content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: beat.bg,
          }}
        />

        {beat.img && (
          <img
            src={beat.img}
            alt={beat.label ?? beat.genre}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* City glow effect for card 4 */}
        {beat.cityGlow && (
          <>
            <div style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at 30% 70%, #ff00ff44 0%, transparent 60%), radial-gradient(ellipse at 70% 40%, #00ffff33 0%, transparent 50%)",
            }} />
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "60%",
              background: "linear-gradient(to top, #1a003088, transparent)",
            }} />
            {/* Fake city skyline */}
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{
                position: "absolute",
                bottom: 0,
                left: `${i * 8.5}%`,
                width: `${5 + (i % 3) * 2}%`,
                height: `${20 + (i % 5) * 15}%`,
                background: i % 3 === 0 ? "#ff00ff55" : i % 3 === 1 ? "#0000aa66" : "#00008866",
                borderTop: `1px solid ${i % 2 === 0 ? "#ff00ff88" : "#00ffff44"}`,
              }} />
            ))}
          </>
        )}

        {/* Card 1 green tones */}
        {beat.id === 1 && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 50% 30%, #00ff8822 0%, transparent 70%)",
          }} />
        )}

        {/* Card 3 B&W silhouette */}
        {beat.id === 3 && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 50%, #000 100%)",
            opacity: 0.9,
          }} />
        )}

        {/* Text overlay (POPPIN') */}
        {beat.textOverlay && (
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "16px",
              fontFamily: "'Georgia', serif",
              fontSize: "28px",
              fontWeight: "900",
              color: "#fff",
              letterSpacing: "2px",
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
              fontStyle: "italic",
            }}
          >
            {beat.label}
          </div>
        )}

        {/* Small badge top-left for card 1 */}
        {beat.id === 1 && (
          <div style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "#ff6600",
            borderRadius: "50%",
            width: "10px",
            height: "10px",
          }} />
        )}

        {/* Number badge */}
        {beat.id === 1 && (
          <div style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            color: "rgba(255,255,255,0.5)",
            fontSize: "11px",
            fontFamily: "monospace",
          }}>
            07
          </div>
        )}

        {/* Play button overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: hovered ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)",
            transition: "background 0.3s ease",
          }}
        >
          <button
            className="play-button"
            onMouseEnter={() => setPlayHovered(true)}
            onMouseLeave={() => setPlayHovered(false)}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: "none",
              background: playHovered ? "#fff" : "rgba(255,255,255,0.9)",
              color: "#111",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transform: playHovered ? "scale(1.12)" : "scale(1)",
              transition: "transform 0.2s ease, background 0.2s ease",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              paddingLeft: "2px",
            }}
          >
            <PlayIcon />
          </button>
        </div>
      </div>

      {/* Info Row */}
      <div>
        <div
          className="beat-card-title"
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "18px",
            fontWeight: "700",
            color: "#ffffff",
            letterSpacing: "0.5px",
            marginBottom: "4px",
          }}
        >
          {beat.genre}
        </div>
        <div
          className="beat-card-songs"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            color: "rgba(255,255,255,0.5)",
            fontSize: "12px",
            marginBottom: "14px",
          }}
        >
          <MusicIcon />
          <span>{beat.songs} Songs</span>
        </div>

        {/* Add to Cart Button */}
        <button
          className="beat-card-btn"
          onMouseEnter={() => setCartHovered(true)}
          onMouseLeave={() => setCartHovered(false)}
          onClick={(event) => {
            event.stopPropagation();
            onPurchase(beat);
          }}
          style={{
            width: "100%",
            padding: "10px 0",
            borderRadius: "30px",
            border: "1.5px solid rgba(255,255,255,0.25)",
            background: cartHovered ? "rgba(255,255,255,0.12)" : "transparent",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: "600",
            letterSpacing: "0.3px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
            transition: "background 0.2s ease, border-color 0.2s ease, transform 0.15s ease",
            transform: cartHovered ? "translateY(-1px)" : "translateY(0)",
          }}
        >
          <CartIcon />
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default function TrendingTypeBeats() {
  const [beats, setBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leftHovered, setLeftHovered] = useState(false);
  const [rightHovered, setRightHovered] = useState(false);
  const router = useRouter();
  const { isAuthenticated, addToCart } = useAppShell();

  const handlePurchase = (beat) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    addToCart({
      id: beat.id,
      title: beat.label || beat.title || beat.beat_name || "Untitled",
      producer: beat.producer || beat.artist_name || "Unknown Artist",
      price: beat.price ?? null,
      cover: beat.cover || beat.img || beat.cover_image_url || beat.banner_image_url || "",
      genre: beat.genre,
      bpm: beat.bpm,
      previewUrl: beat.previewUrl || beat.audio_url || "",
      plays: beat.plays || 0,
    });
  };

  useEffect(() => {
    async function getBeats() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchBeats();
        // Format beats for display with color palettes
        const formattedBeats = data.slice(0, 4).map((beat, i) => formatBeatForDisplay(beat, i));
        setBeats(formattedBeats);
      } catch (err) {
        console.error("Error fetching beats:", err);
        setError(err.message || "Failed to load beats");
        setBeats([]);
      } finally {
        setLoading(false);
      }
    }

    getBeats();
  }, []);

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #111; }

        @media (max-width: 1024px) {
          .trending-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 24px !important;
          }
        }

        @media (max-width: 768px) {
          .trending-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
          }
          .trending-header {
            flex-direction: column !important;
            gap: 24px !important;
          }
          .trending-nav {
            align-self: flex-start !important;
          }
          .beat-card-title {
            font-size: 16px !important;
          }
          .beat-card-songs {
            font-size: 11px !important;
          }
          .beat-card-btn {
            font-size: 12px !important;
            padding: 8px 0 !important;
          }
        }

        @media (max-width: 640px) {
          .trending-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 18px !important;
          }
          .trending-header {
            flex-direction: column !important;
            gap: 20px !important;
            margin-bottom: 32px !important;
          }
          .trending-title {
            font-size: clamp(24px, 5vw, 32px) !important;
          }
          .trending-desc {
            font-size: 12px !important;
          }
          .trending-nav {
            align-self: flex-start !important;
            gap: 8px !important;
          }
          .trending-nav button {
            width: 32px !important;
            height: 32px !important;
          }
          .beat-card-title {
            font-size: 15px !important;
          }
          .beat-card-songs {
            font-size: 11px !important;
          }
          .beat-card-btn {
            font-size: 12px !important;
            padding: 8px 0 !important;
          }
          .play-button {
            width: 38px !important;
            height: 38px !important;
          }
        }

        @media (max-width: 480px) {
          .trending-container {
            padding: 40px 20px !important;
          }
          .trending-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
          }
          .trending-title {
            font-size: clamp(20px, 6vw, 28px) !important;
          }
          .trending-desc {
            font-size: 11px !important;
          }
          .beat-card-container {
            gap: 12px !important;
          }
          .beat-card-image {
            border-radius: 8px !important;
          }
          .beat-card-title {
            font-size: 14px !important;
          }
          .beat-card-songs {
            font-size: 10px !important;
            margin-bottom: 10px !important;
          }
          .beat-card-btn {
            font-size: 11px !important;
            padding: 7px 0 !important;
          }
        }
      `}</style>

      <div
        className="trending-container"
        style={{
          minHeight: "100vh",
          background: "#111111",
          padding: "60px 48px",
          fontFamily: "sans-serif",
        }}
      >
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#fff" }}>
            <p>Loading beats...</p>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#ff6b6b" }}>
            <p>Error: {error}</p>
          </div>
        )}

        {!loading && !error && beats.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa" }}>
            <p>No beats available</p>
          </div>
        )}

        {!loading && !error && beats.length > 0 && (
          <>
            {/* Header */}
            <div
              className="trending-header"
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "40px",
              }}
            >
              <div style={{ maxWidth: "420px" }}>
                <h1
                  className="trending-title"
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: "clamp(32px, 4vw, 52px)",
                    fontWeight: "700",
                    color: "#ffffff",
                    lineHeight: "1.1",
                    marginBottom: "12px",
                    letterSpacing: "-0.5px",
                  }}
                >
                  Trending Type Beats
                </h1>
                <p
                  className="trending-desc"
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "13px",
                    lineHeight: "1.6",
                    maxWidth: "320px",
                  }}
                >
                  Say goodbye to interruptions and enjoy uninterrupted music streaming.
                  With our ad-free platform, you'll have access to millions to songs
                </p>
              </div>

              {/* Nav arrows */}
              <div className="trending-nav" style={{ display: "flex", gap: "10px", paddingTop: "8px" }}>
                {["left", "right"].map((dir) => {
                  const isHov = dir === "left" ? leftHovered : rightHovered;
                  return (
                    <button
                      key={dir}
                      onMouseEnter={() => dir === "left" ? setLeftHovered(true) : setRightHovered(true)}
                      onMouseLeave={() => dir === "left" ? setLeftHovered(false) : setRightHovered(false)}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        border: "1.5px solid rgba(255,255,255,0.2)",
                        background: isHov ? "rgba(255,255,255,0.12)" : "transparent",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "background 0.2s ease, transform 0.15s ease",
                        transform: isHov ? "scale(1.08)" : "scale(1)",
                      }}
                    >
                      <ChevronIcon direction={dir} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Beat Cards Grid */}
            <div
              className="trending-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "28px",
              }}
            >
              {beats.map((beat, i) => (
                <BeatCard key={beat.id} beat={beat} index={i} onPurchase={handlePurchase} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}