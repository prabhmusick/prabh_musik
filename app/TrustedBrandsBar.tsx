"use client";

const brands = [
  { name: "spotify" },
  { name: "zap ler" },
  { name: "wynk" },
  { name: "apple music" },
  { name: "amazon" },
];

// Duplicate for seamless infinite scroll
const allBrands = [...brands, ...brands, ...brands, ...brands];

export default function TrustedBrands() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');

        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }

        .marquee-track {
          display: flex;
          align-items: center;
          gap: 64px;
          animation: marquee 22s linear infinite;
          width: max-content;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }

        .brand-item {
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.9;
          transition: opacity 0.2s ease, transform 0.2s ease;
          cursor: pointer;
          flex-shrink: 0;
          min-width: 128px;
        }

        .brand-item:hover {
          opacity: 1;
          transform: translateY(-2px);
        }

        .brand-name {
          font-family: 'Inter', sans-serif;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: rgba(255,255,255,0.85);
          text-transform: lowercase;
          white-space: nowrap;
        }

        @media (max-width: 900px) {
          section {
            padding: 26px 0 28px;
          }

          .trusted-pill {
            padding: 10px 26px;
          }

          .trusted-pill span {
            font-size: 16px;
            letter-spacing: 0.03em;
            white-space: normal;
            text-align: center;
            line-height: 1.2;
          }

          .marquee-track {
            gap: 32px;
            animation-duration: 24s;
          }

          .brand-item {
            padding: 0 4px;
          }

          .brand-item svg {
            height: 20px;
            width: auto;
          }
        }
      `}</style>

      <section
        style={{
          background: "#111111",
          padding: "36px 0 40px",
          overflow: "hidden",
        }}
      >
        {/* ── "Trusted by Artists and Brands" pill ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "32px",
          }}
        >
          <div
            className="trusted-pill"
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(50, 48, 46, 0.95)",
              borderRadius: "999px",
              padding: "16px 36px",
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "22px",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.1px",
                whiteSpace: "nowrap",
              }}
            >
              Trusted by Artists and Brands
            </span>
          </div>
        </div>

        {/* ── Marquee ── */}
        <div
          style={{
            overflow: "hidden",
            maskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
          }}
        >
          <div className="marquee-track">
            {allBrands.map((brand, i) => (
              <div key={`${brand.name}-${i}`} className="brand-item">
                <span className="brand-name">{brand.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}