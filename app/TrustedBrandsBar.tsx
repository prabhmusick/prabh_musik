"use client";

const platforms = [
  { name: "Spotify", label: "Spotify" },
  { name: "Apple Music", label: "Apple Music" },
  { name: "YouTube Music", label: "YouTube Music" },
  { name: "Jio Music", label: "Jio Music" },
  { name: "BeatStars", label: "BeatStars" },
];

// Duplicate for smooth infinite marquee loop
const allPlatforms = [...platforms, ...platforms, ...platforms, ...platforms];

export default function TrustedBrandsBar() {
  return (
    <>
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }

        .marquee-track {
          display: flex;
          align-items: center;
          gap: 48px;
          animation: marquee 24s linear infinite;
          width: max-content;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }

        .platform-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 10px 22px;
          border-radius: 999px;
          color: #f5f0e8;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.3px;
          flex-shrink: 0;
          transition: border-color 0.2s, background 0.2s;
        }

        .platform-item:hover {
          border-color: #fbbf24;
          background: rgba(251,191,36,0.1);
        }

        @media (max-width: 768px) {
          .marquee-track { gap: 24px; }
          .platform-item { font-size: 13px; padding: 8px 16px; }
        }
      `}</style>

      <section
        style={{
          background: "#0d0e12",
          padding: "32px 0 36px",
          overflow: "hidden",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(251,191,36,0.08)",
              border: "1px solid rgba(251,191,36,0.25)",
              borderRadius: "999px",
              padding: "10px 24px",
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                color: "#fbbf24",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Platforms / Brands Worked With
            </span>
          </div>
        </div>

        <div
          style={{
            overflow: "hidden",
            maskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
          }}
        >
          <div className="marquee-track">
            {allPlatforms.map((p, i) => (
              <div key={`${p.name}-${i}`} className="platform-item">
                <span style={{ color: "#fbbf24", fontSize: 16 }}>🎵</span>
                <span>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}