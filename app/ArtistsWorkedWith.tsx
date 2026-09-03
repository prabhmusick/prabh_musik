"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Artist {
  id: number;
  name: string;
  album: string;
  genre: string;
  year: string;
  image?: string;
  skinTone: string;
  clothColor: string;
  clothColor2: string;
  hairColor: string;
}

const artists: Artist[] = [
  {
    id: 1,
    name: "Karan Aujla",
    album: "Dont Look 2",
    genre: "Punjabi Trap",
    year: "2024",
    image: "/karan.png",
    skinTone: "#c68642",
    clothColor: "#7B3A1A",
    clothColor2: "#5a2a10",
    hairColor: "#1a0e05",
  },
  {
    id: 2,
    name: "Sidhu Moose Wala",
    album: "Dont Look 2",
    genre: "Punjabi Trap",
    year: "2024",
    image: "/siddhu.png",
    skinTone: "#b5763a",
    clothColor: "#1a2a4a",
    clothColor2: "#0f1e36",
    hairColor: "#0a0604",
  },
  {
    id: 3,
    name: "Ap Dhillon",
    album: "Dont Look 2",
    genre: "Punjabi Trap",
    year: "2024",
    image: "/ap.png",
    skinTone: "#c09060",
    clothColor: "#1a1a3a",
    clothColor2: "#0f0f28",
    hairColor: "#0d0a04",
  },
  {
    id: 4,
    name: "Diljit Dosanjh",
    album: "Ghost",
    genre: "Punjabi Pop",
    year: "2024",
    skinTone: "#c07840",
    clothColor: "#2a1a0a",
    clothColor2: "#1a1005",
    hairColor: "#0a0604",
  },
  {
    id: 5,
    name: "Shubh",
    album: "Still Rollin",
    genre: "Punjabi Trap",
    year: "2024",
    skinTone: "#a06030",
    clothColor: "#0a1a0a",
    clothColor2: "#050f05",
    hairColor: "#050302",
  },
];

function PlayCircleIcon() {
  return (
    <svg className="artists-play-icon" width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="13" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      <path d="M11 9.5l9 4.5-9 4.5V9.5z" fill="rgba(255,255,255,0.85)" />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg className="artists-icon" width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d={dir === "left" ? "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" : "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"} />
    </svg>
  );
}

function ArtistSVG({ a }: { a: Artist }) {
  return (
    <svg width="130" height="190" viewBox="0 0 130 190" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Glow */}
      <ellipse cx="65" cy="140" rx="50" ry="55" fill={a.clothColor} fillOpacity="0.5" />
      {/* Head */}
      <ellipse cx="65" cy="48" rx="24" ry="26" fill={a.skinTone} />
      {/* Hair */}
      <ellipse cx="65" cy="30" rx="24" ry="14" fill={a.hairColor} />
      {/* Ears */}
      <ellipse cx="41" cy="50" rx="5" ry="7" fill={a.skinTone} />
      <ellipse cx="89" cy="50" rx="5" ry="7" fill={a.skinTone} />
      {/* Neck */}
      <rect x="58" y="70" width="14" height="16" rx="4" fill={a.skinTone} />
      {/* Torso / jacket */}
      <path d="M20 190 Q20 110 40 100 L55 86 Q65 95 75 86 L90 100 Q110 110 110 190Z" fill={a.clothColor} />
      {/* Jacket lapels */}
      <path d="M55 86 L48 120 L65 108 L82 120 L75 86 Q65 95 55 86Z" fill={a.clothColor2} />
      {/* Shirt visible */}
      <path d="M58 88 L60 115 L65 110 L70 115 L72 88 Q65 95 58 88Z" fill="rgba(255,255,255,0.15)" />
      {/* Left arm */}
      <path d="M40 100 Q22 118 20 155 Q24 158 30 155 Q34 125 48 112Z" fill={a.clothColor} />
      {/* Right arm */}
      <path d="M90 100 Q108 118 110 155 Q106 158 100 155 Q96 125 82 112Z" fill={a.clothColor} />
      {/* Left hand */}
      <ellipse cx="24" cy="158" rx="8" ry="6" fill={a.skinTone} />
      {/* Right hand */}
      <ellipse cx="106" cy="158" rx="8" ry="6" fill={a.skinTone} />
      {/* Face details - eyes */}
      <ellipse cx="57" cy="48" rx="3.5" ry="3" fill="#1a0e05" />
      <ellipse cx="73" cy="48" rx="3.5" ry="3" fill="#1a0e05" />
      <ellipse cx="58" cy="47" rx="1.2" ry="1.2" fill="#ffffff55" />
      <ellipse cx="74" cy="47" rx="1.2" ry="1.2" fill="#ffffff55" />
      {/* Eyebrows */}
      <path d="M52 42 Q57 39 62 41" stroke="#1a0e05" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M68 41 Q73 39 78 42" stroke="#1a0e05" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Nose */}
      <path d="M63 52 Q65 58 67 52" stroke={a.skinTone === "#c68642" ? "#a0602a" : "#8a5020"} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Mouth */}
      <path d="M59 63 Q65 67 71 63" stroke="#7a3820" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Chain / necklace */}
      <path d="M52 90 Q65 98 78 90" stroke="rgba(255,215,0,0.5)" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function ArtistCard({ artist, index }: { artist: Artist; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [listenHov, setListenHov] = useState(false);

  return (
    <div
      className="artists-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        scrollSnapAlign: "start",
        minWidth: "460px",
        width: "460px",
        borderRadius: "16px",
        background: hovered ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.1)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.14)"}`,
        display: "flex",
        alignItems: "flex-end",
        gap: "0",
        overflow: "hidden",
        cursor: "pointer",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease, border-color 0.3s ease",
        animation: `fadeSlideUp 0.55s ease both`,
        animationDelay: `${index * 0.1}s`,
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Subtle inner glow top */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: "2px",
        background: "linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)",
        borderRadius: "16px 16px 0 0",
      }} />

      {/* Artist figure */}
      <div style={{ paddingLeft: "10px", paddingBottom: "0", lineHeight: 0, flexShrink: 0 }}>
        {artist.image ? (
          <img
            className="artists-card-image"
            src={artist.image}
            alt={artist.name}
            style={{
              width: 150,
              height: 190,
              objectFit: "cover",
              borderRadius: "16px",
              display: "block",
            }}
          />
        ) : (
          <ArtistSVG a={artist} />
        )}
      </div>

      {/* Info */}
      <div className="artists-card-info" style={{ padding: "28px 24px 28px 16px", flex: 1 }}>
        <h3
          className="artists-card-name"
          style={{
            fontFamily: "'Jacques Francois', Georgia, serif",
            fontSize: "24px",
            fontWeight: 400,
            color: "#ffffff",
            marginBottom: "10px",
            letterSpacing: "0.2px",
          }}
        >
          {artist.name}
        </h3>

        <p className="artists-card-text" style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "13px",
          color: "rgba(255,255,255,0.5)",
          lineHeight: 1.5,
          marginBottom: "2px",
        }}>
          {artist.album}
        </p>
        <p className="artists-card-text" style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "13px",
          color: "rgba(255,255,255,0.5)",
          lineHeight: 1.5,
          marginBottom: "16px",
        }}>
          {artist.genre}. {artist.year}
        </p>

        {/* Music icon row */}
        <div style={{ marginBottom: "18px" }}>
          <MusicIcon />
        </div>

        {/* Listen Now */}
        <button
          className="artists-card-button"
          onMouseEnter={() => setListenHov(true)}
          onMouseLeave={() => setListenHov(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "transparent",
            border: "none",
            color: listenHov ? "#ffffff" : "rgba(255,255,255,0.75)",
            fontSize: "14px",
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            cursor: "pointer",
            padding: 0,
            transition: "color 0.2s ease",
          }}
        >
          <PlayCircleIcon />
          Listen Now
        </button>
      </div>
    </div>
  );
}

export default function ArtistsWorkedWith() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewAllHov, setViewAllHov] = useState(false);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -420 : 420, behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jacques+Francois&family=Inter:wght@400;500;700&display=swap');
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .artists-scroll::-webkit-scrollbar { display: none; }
        .artists-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        
        @media (max-width: 900px) {
          .artists-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            justify-content: flex-start !important;
            gap: 12px !important;
            width: 100% !important;
            margin-bottom: 24px !important;
          }
          .artists-header-buttons {
            align-self: flex-end !important;
            width: 100% !important;
            justify-content: flex-end !important;
          }
          .artists-card {
            min-width: 280px !important;
            width: 280px !important;
            padding: 0 !important;
          }
          .artists-card-image {
            width: 90px !important;
            height: 120px !important;
          }
          .artists-card-info {
            padding: 16px 12px 16px 10px !important;
          }
          .artists-card-name {
            font-size: 16px !important;
            margin-bottom: 6px !important;
          }
          .artists-card-text {
            font-size: 11px !important;
            margin-bottom: 8px !important;
          }
          .artists-card-button {
            font-size: 12px !important;
          }
          .artists-icon {
            width: 16px !important;
            height: 16px !important;
          }
          .artists-play-icon {
            width: 20px !important;
            height: 20px !important;
          }
          .artists-header-title {
            font-size: 24px !important;
            margin-bottom: 0 !important;
          }
          .artists-scroll {
            gap: 12px !important;
            padding: 0 12px 6px !important;
          }
        }
      `}</style>

      <section
        style={{
          backgroundImage: "url('/art_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          padding: "56px 1% 64px",
          fontFamily: "'Inter', sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow blobs */}
        <div style={{
          position: "absolute", top: "-80px", left: "10%",
          width: "500px", height: "400px",
          background: "radial-gradient(ellipse, #c8780a22 0%, transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-60px", right: "15%",
          width: "400px", height: "300px",
          background: "radial-gradient(ellipse, #8B4500 22 0%, transparent 70%)",
          filter: "blur(50px)", pointerEvents: "none",
        }} />

        {/* ── Header ── */}
        <div className="artists-header" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "32px",
          position: "relative",
          zIndex: 2,
        }}>
          <h2 className="artists-header-title" style={{
            fontFamily: "'Jacques Francois', Georgia, serif",
            fontSize: "clamp(26px, 3.5vw, 48px)",
            fontWeight: 400,
            color: "#ffffff",
            lineHeight: 1.1,
            letterSpacing: "-0.2px",
          }}>
            Artists I have Worked With
          </h2>

          <div className="artists-header-buttons" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => router.push("/beat")}
              onMouseEnter={() => setViewAllHov(true)}
              onMouseLeave={() => setViewAllHov(false)}
              style={{
                padding: "10px 22px",
                borderRadius: "6px",
                border: "none",
                background: viewAllHov ? "#e8920a" : "#d4820a",
                color: "#000",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "background 0.2s ease, transform 0.15s ease",
                transform: viewAllHov ? "translateY(-1px)" : "translateY(0)",
                boxShadow: viewAllHov ? "0 6px 20px #d4820a55" : "none",
              }}
            >
              View All
            </button>

            {(["left", "right"] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => scroll(dir)}
                style={{
                  width: "36px", height: "36px",
                  borderRadius: "50%",
                  border: "1.5px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "#ffffff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <ChevronIcon dir={dir} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Cards ── */}
        <div
          ref={scrollRef}
          className="artists-scroll"
          style={{
            display: "flex",
            gap: "18px",
            overflowX: "auto",
            padding: "0 18px 6px",
            scrollSnapType: "x mandatory",
            scrollPaddingInline: "18px",
            position: "relative",
            zIndex: 2,
          }}
        >
          {artists.map((artist, i) => (
            <ArtistCard key={artist.id} artist={artist} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}