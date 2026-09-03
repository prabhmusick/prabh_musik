"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const COL1 = [
  {
    artist: "Karan Aujla", title: "Midnight Therapy", genre: "Punjabi Trap · 2026",
    tag: "EXPLICIT", tagBg: "rgba(0,0,0,0.82)",
    img: "https://picsum.photos/seed/karan1/400/400",
    overlay: "linear-gradient(180deg,transparent 50%,rgba(26,26,46,0.85))",
  },
  {
    artist: "AP Dhillon", title: "Brown Munde 2", genre: "Punjabi Pop · 2026",
    tag: "HOT", tagBg: "#e8a020",
    img: "https://picsum.photos/seed/ap2/400/400",
    overlay: "linear-gradient(180deg,transparent 50%,rgba(42,26,14,0.85))",
  },
  {
    artist: "Sidhu Moosewala", title: "Pind Da Raja", genre: "Punjabi Folk · 2026",
    tag: "NEW", tagBg: "#1d9e75",
    img: "https://picsum.photos/seed/sidhu3/400/400",
    overlay: "linear-gradient(180deg,transparent 50%,rgba(13,42,31,0.85))",
  },
  {
    artist: "Diljit Dosanjh", title: "G.O.A.T. Returns", genre: "Bhangra · 2026",
    tag: "FIRE", tagBg: "#7f77dd",
    img: "https://picsum.photos/seed/diljit4/400/400",
    overlay: "linear-gradient(180deg,transparent 50%,rgba(31,10,42,0.85))",
  },
];

const COL2 = [
  {
    artist: "Karan Aujla", title: "Sidhu's Anthem", genre: "Punjabi Trap · 2026",
    tag: "3K", tagBg: "#e8a020",
    img: "https://picsum.photos/seed/karan5/400/400",
    overlay: "linear-gradient(180deg,transparent 50%,rgba(110,26,26,0.85))",
  },
  {
    artist: "Shubh", title: "Raatan Lambiyan", genre: "R&B · 2026",
    tag: "CHILL", tagBg: "#185fa5",
    img: "https://picsum.photos/seed/shubh6/400/400",
    overlay: "linear-gradient(180deg,transparent 50%,rgba(10,26,42,0.85))",
  },
  {
    artist: "Babbal Rai", title: "Yaarian Forever", genre: "Punjabi Soul · 2026",
    tag: "VIBE", tagBg: "#3b6d11",
    img: "https://picsum.photos/seed/babbal7/400/400",
    overlay: "linear-gradient(180deg,transparent 50%,rgba(26,42,10,0.85))",
  },
  {
    artist: "Amrit Maan", title: "Tere Bina", genre: "Punjabi Rock · 2026",
    tag: "RAW", tagBg: "#993c1d",
    img: "https://picsum.photos/seed/amrit8/400/400",
    overlay: "linear-gradient(180deg,transparent 50%,rgba(42,26,26,0.85))",
  },
];

const STATS = [
  { icon: "/sound.png", value: "10M+", label: "Streams" },
  { icon: "/file.png", value: "150+", label: "Artists" },
  { icon: "/globe.png", value: "50+", label: "Countries" },
];

const keyframes = `
  @keyframes scrollUp {
    0% { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }
  @keyframes scrollDown {
    0% { transform: translateY(-50%); }
    100% { transform: translateY(0); }
  }
  @keyframes scrollLeft {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes scrollRight {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .bs-card-play { opacity: 0; transition: opacity 0.18s; }
  .bs-card:hover .bs-card-play { opacity: 1; }
  .bs-btn-ghost:hover { border-color: #e8c547 !important; color: #e8c547 !important; }
  .bs-card-mini-btn:hover { background: rgba(232,197,71,0.28) !important; }

  @media (max-width: 768px) {
    .bs-hero {
      flex-direction: column !important;
      gap: 32px !important;
      padding: 40px 24px !important;
      min-height: auto !important;
      align-items: flex-start !important;
    }
    .bs-left { max-width: 100% !important; }
    .bs-right {
      height: auto !important;
      width: 100% !important;
      margin-left: 0 !important;
      gap: 18px !important;
      justify-content: flex-start !important;
      flex-direction: column !important;
      overflow: visible !important;
      padding: 0 !important;
      mask-image: none !important;
      -webkit-mask-image: none !important;
    }
    .bs-lane {
      width: 100% !important;
      max-width: none !important;
      height: 220px !important;
      transform: none !important;
      overflow: hidden !important;
      flex-shrink: 0 !important;
      display: flex !important;
      flex-direction: row !important;
      gap: 14px !important;
      padding: 0 !important;
    }
    .bs-lane:nth-child(1) {
      transform: skewY(-2deg) !important;
    }
    .bs-lane:nth-child(2) {
      transform: skewY(2deg) !important;
    }
    .bs-lane:nth-child(1) > div {
      animation: scrollLeft 15s linear infinite !important;
    }
    .bs-lane:nth-child(2) > div {
      animation: scrollRight 15s linear infinite !important;
    }
    .bs-lane > div {
      display: flex !important;
      flex-direction: row !important;
      gap: 14px !important;
      flex-wrap: nowrap !important;
    }
    .bs-card {
      width: 200px !important;
    }
    .bs-divider { display: none !important; }
    .bs-stat { 
      gap: 6px !important;
    }
  }

  @media (max-width: 640px) {
    .bs-hero {
      flex-direction: column !important;
      padding: 28px 18px 0 !important;
      min-height: auto !important;
      gap: 26px !important;
      align-items: flex-start !important;
    }
    .bs-left { 
      max-width: 100% !important; 
      animation: fadeUp 0.65s ease both !important;
    }
    .bs-right {
      height: auto !important;
      width: 100% !important;
      margin-left: 0 !important;
      gap: 16px !important;
      justify-content: flex-start !important;
      flex-direction: column !important;
      overflow: visible !important;
      padding: 0 !important;
      mask-image: none !important;
      -webkit-mask-image: none !important;
    }
    .bs-lane {
      width: 100% !important;
      max-width: none !important;
      height: 190px !important;
      transform: none !important;
      overflow: hidden !important;
      flex-shrink: 0 !important;
      display: flex !important;
      flex-direction: row !important;
      gap: 12px !important;
      padding: 0 !important;
    }
    .bs-lane:nth-child(1) {
      transform: skewY(-1.5deg) !important;
    }
    .bs-lane:nth-child(2) {
      transform: skewY(1.5deg) !important;
    }
    .bs-lane:nth-child(1) > div {
      animation: scrollLeft 14s linear infinite !important;
    }
    .bs-lane:nth-child(2) > div {
      animation: scrollRight 14s linear infinite !important;
    }
    .bs-lane > div {
      display: flex !important;
      flex-direction: row !important;
      gap: 12px !important;
      flex-wrap: nowrap !important;
    }
    .bs-card {
      width: 170px !important;
    }
    .bs-divider { display: none !important; }
    .bs-stat { 
      gap: 4px !important;
    }
  }

  @media (max-width: 480px) {
    .bs-hero {
      flex-direction: column !important;
      padding: 24px 16px 0 !important;
      gap: 24px !important;
    }
    .bs-right {
      height: auto !important;
      width: 100% !important;
      gap: 14px !important;
      padding: 0 !important;
      flex-direction: column !important;
      overflow: visible !important;
    }
    .bs-lane {
      width: 100% !important;
      height: 160px !important;
      gap: 10px !important;
      padding: 0 !important;
      overflow: hidden !important;
    }
    .bs-lane:nth-child(1) {
      transform: skewY(-1.5deg) !important;
    }
    .bs-lane:nth-child(2) {
      transform: skewY(1.5deg) !important;
    }
    .bs-lane:nth-child(1) > div {
      animation: scrollLeft 13s linear infinite !important;
    }
    .bs-lane:nth-child(2) > div {
      animation: scrollRight 13s linear infinite !important;
    }
    .bs-card {
      width: 140px !important;
    }
    .bs-stat { 
      gap: 3px !important;
    }
  }
`;

type CardData = (typeof COL1)[0];

function BeatCard({ card }: { card: CardData }) {
  return (
    <div
      className="bs-card"
      style={{
        borderRadius: 13,
        overflow: "hidden",
        flexShrink: 0,
        width: "100%",
        background: "#1a1a2e",
        position: "relative",
      }}
    >
      {/* Cover art */}
      <div style={{ width: "100%", aspectRatio: "1/1", position: "relative", overflow: "hidden" }}>
        <img
          src={card.img}
          alt={card.artist}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute", inset: 0,
            background: card.overlay,
            pointerEvents: "none",
          }}
        />
        {/* Tag badge */}
        <div
          style={{
            position: "absolute", top: 9, left: 9,
            background: card.tagBg, color: "#fff",
            fontSize: 8, fontWeight: 800,
            padding: "3px 8px", borderRadius: 5,
            letterSpacing: 0.9, textTransform: "uppercase",
            zIndex: 2,
          }}
        >
          {card.tag}
        </div>
        {/* Hover play overlay */}
        <div
          className="bs-card-play"
          style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.38)",
            zIndex: 3,
          }}
        >
          <button
            style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "#e8c547", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 13, color: "#0d0d0f", fontWeight: 700,
            }}
          >
            ▶
          </button>
        </div>
      </div>

      {/* Info row */}
      <div
        style={{
          padding: "9px 11px",
          background: "rgba(0,0,0,0.7)",
          display: "flex", justifyContent: "space-between",
          alignItems: "center", gap: 7,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#fff", fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.2 }}>
            {card.artist}
          </div>
          <div style={{ color: "rgba(255,255,255,0.48)", fontSize: 9.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {card.title}
          </div>
          <div style={{ color: "rgba(255,255,255,0.26)", fontSize: 8, marginTop: 1 }}>
            {card.genre}
          </div>
        </div>
        <button
          aria-label={`Play ${card.title}`}
          className="bs-card-mini-btn"
          style={{
            width: 27, height: 27, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.14)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
            fontSize: 9, color: "#fff",
          }}
        >
          ▶
        </button>
      </div>
    </div>
  );
}

export default function BeatstarsHero() {
  const router = useRouter();
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = keyframes;
    document.head.appendChild(el);
    styleRef.current = el;
    return () => { el.remove(); };
  }, []);

  return (
    <div
      className="bs-hero"
      style={{
        minHeight: "560px",
        background: "#0d0d0f",
        display: "flex",
        alignItems: "center",
        padding: "48px",
        gap: 44,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        borderRadius: 16,
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 50% 60% at 75% 50%, rgba(232,197,71,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* LEFT */}
      <div
        className="bs-left"
        style={{ flex: "0 0 auto", maxWidth: 520, zIndex: 2, animation: "fadeUp 0.65s ease both" }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "rgba(232,197,71,0.1)",
            border: "1px solid rgba(232,197,71,0.25)",
            borderRadius: 20, padding: "4px 14px",
            fontSize: "clamp(11px, 2vw, 12px)", color: "#e8c547", fontWeight: 600,
            marginBottom: 20, letterSpacing: 0.3,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFA500", opacity: 0.75, display: "inline-block", flexShrink: 0 }} />
          #MadeonPrabhMusic
        </div>

        <h1
          style={{
            fontSize: "clamp(28px, 6vw, 64px)",
            fontWeight: 800, color: "#fff",
            lineHeight: 1.05, margin: "0 0 18px",
            letterSpacing: -1.2,
            maxWidth: 520,
          }}
        >
          Yes that beat was bought on <br/>
           <span style={{ color: "#e8c547" }}> Prabh Musik.</span>
        </h1>

        <p style={{ fontSize: "clamp(13px, 3vw, 15px)", color: "rgba(255,255,255,0.62)", fontStyle: "italic", lineHeight: 1.55, margin: "0 0 34px", maxWidth: 520 }}>
          ~Thousands of artists are building hits with Prabh Musik
        </p>

        {/* Stats */}
        <div style={{ display: "flex", gap: 15, marginBottom: 38, flexWrap: "wrap", alignItems: "flex-start", overflowX: "visible" }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ display: "flex", alignItems: "flex-start", gap: "24px", flexBasis: "auto" }}>
              {i > 0 && (
                <div
                  className="bs-divider"
                  style={{ width: 1, height: 34, background: "rgba(255,255,255,0.12)", flexShrink: 0, margin: "0" }}
                />
              )}
              <div
                className="bs-stat"
                style={{ padding: "0", animation: `fadeUp 0.6s ease ${0.3 + i * 0.1}s both`, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img
                    src={s.icon}
                    alt={`${s.label} icon`}
                    style={{ width: "clamp(24px, 6vw, 32px)", height: "clamp(24px, 6vw, 32px)", objectFit: "contain", flexShrink: 0 }}
                  />
                  <span style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 500,
                    fontSize: "clamp(28px, 7vw, 40px)",
                    lineHeight: 1.2,
                    color: "#fff",
                    display: "inline-block",
                  }}>{s.value}</span>
                </div>
                <div style={{ fontSize: "clamp(10px, 2vw, 11px)", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, lineHeight: 1.2 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => router.push("/beat")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#e8c547", border: "1px solid rgba(232,197,71,0.35)", borderRadius: 10,
              color: "#0d0d0f", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: 700,
              padding: "clamp(10px, 3vw, 14px) clamp(16px, 4vw, 24px)", cursor: "pointer", letterSpacing: 0.2,
              boxShadow: "0 14px 30px rgba(232,197,71,0.12)",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.94")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            Browse beats →
          </button>
        </div>
      </div>

      {/* RIGHT — scrolling card lanes */}
      <div
        className="bs-right"
        aria-hidden="true"
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "stretch",
          gap: 14,
          zIndex: 2,
          height: 500,
          overflow: "hidden",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 9%, black 91%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 9%, black 91%, transparent 100%)",
          minWidth: 0,
        }}
      >
        {/* Column 1 — scrolls UP (desktop) / LEFT (mobile) */}
        <div
          className="bs-lane"
          style={{ width: 230, overflow: "hidden", flexShrink: 0, transform: "rotate(5deg)", transformOrigin: "center center" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 13, animation: "scrollUp 13s linear infinite" }}>
            {[...COL1, ...COL1].map((card, i) => <BeatCard key={i} card={card} />)}
          </div>
        </div>

        {/* Column 2 — scrolls DOWN (desktop) / LEFT (mobile) */}
        <div
          className="bs-lane"
          style={{ width: 230, overflow: "hidden", flexShrink: 0, transform: "rotate(5deg)", transformOrigin: "center center" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 13, animation: "scrollDown 13s linear infinite" }}>
            {[...COL2, ...COL2].map((card, i) => <BeatCard key={i} card={card} />)}
          </div>
        </div>
      </div>
    </div>
  );
}