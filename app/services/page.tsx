'use client';
import { JSX, useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ServiceCard {
  number: string;
  title: string;
  description: string;
  learnMore: string;
  slug: string;
//   icon: JSX.Element;
  imagePlaceholder: string;
}

interface ProcessStep {
  icon: JSX.Element;
  label: string;
  description: string;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const WaveformIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h2l2-8 4 16 4-10 2 4h6"/>
  </svg>
);

const SlidersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
    <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
    <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
    <line x1="17" y1="16" x2="23" y2="16"/>
  </svg>
);

const PenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);

const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

const WandIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4V2m0 2v2m0-2h-2m2 0h2M3 10l9 9 9-9-9-9-9 9z"/>
  </svg>
);

const RocketIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

// ─── Service Card Images (photo + gradient fallback) ─────────────────────────
const serviceImageFiles = ["/img_1.png", "/img_2.png", "/img_3.png", "/img_4.png"];

const serviceImageFallbacks = [
  // Music Production – purple/pink studio feel
  "linear-gradient(135deg, #1a0a2e 0%, #2d1060 40%, #4a1080 70%, #1a0a2e 100%)",
  // Mix n Master – dark teal board feel  
  "linear-gradient(135deg, #0a1628 0%, #0d2040 40%, #1a3060 70%, #0a1628 100%)",
  // Lyrics – warm amber/brown spotlight feel
  "linear-gradient(135deg, #1a0f00 0%, #3d2200 40%, #6b3d00 70%, #1a0f00 100%)",
  // Marketing & Distribution – dark green globe feel
  "linear-gradient(135deg, #001a14 0%, #003326 50%, #004d38 70%, #001a14 100%)",
];

// ─── Data ─────────────────────────────────────────────────────────────────────
const services: ServiceCard[] = [
  {
    number: "01",
    title: "Music Production",
    description: "From beatmaking to full arrangements, we craft high-quality, industry-ready tracks that bring your sound to life.",
    learnMore: "Learn more",
    slug: "music-production",
    // icon: <WaveformIcon />,
    imagePlaceholder: `url('${serviceImageFiles[0]}'), ${serviceImageFallbacks[0]}`,
  },
  {
    number: "02",
    title: "Mix n Master",
    description: "We deliver clean, balanced mixes and loud, professional masters ready for all major streaming platforms.",
    learnMore: "Learn more",
    slug: "mix-n-master",
    // icon: <SlidersIcon />,
    imagePlaceholder: `url('${serviceImageFiles[1]}'), ${serviceImageFallbacks[1]}`,
  },
  {
    number: "03",
    title: "Lyrics",
    description: "Powerful words, real emotion. We write lyrics that connect, inspire, and make your music unforgettable.",
    learnMore: "Learn more",
    slug: "lyrics",
    // icon: <PenIcon />,
    imagePlaceholder: `url('${serviceImageFiles[2]}'), ${serviceImageFallbacks[2]}`,
  },
  {
    number: "04",
    title: "Marketing & Distribution",
    description: "We help you reach the right audience and get your music on all major platforms worldwide.",
    learnMore: "Learn more",
    slug: "marketing-distribution",
    // icon: <GlobeIcon />,
    imagePlaceholder: `url('${serviceImageFiles[3]}'), ${serviceImageFallbacks[3]}`,
  },
];

const processSteps: ProcessStep[] = [
  {
    icon: <SearchIcon />,
    label: "Discover",
    description: "Deep dive into your artistic vision and project goals.",
  },
  {
    icon: <SparkleIcon />,
    label: "Create",
    description: "Bringing elements together through premium production.",
  },
  {
    icon: <WandIcon />,
    label: "Polish",
    description: "Fine-tuning every frequency for a professional finish.",
  },
  {
    icon: <RocketIcon />,
    label: "Launch",
    description: "Strategizing the release and hitting the platforms.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ServicesPage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <div
      style={{
        fontFamily: "'Sora', 'DM Sans', 'Inter', sans-serif",
        background: "#0a0a0a",
        color: "#fff",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {/* ── Google Font Import ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtlePulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        .fade-up { animation: fadeUp 0.7s ease forwards; }
        .fade-up-1 { animation: fadeUp 0.7s 0.1s ease both; }
        .fade-up-2 { animation: fadeUp 0.7s 0.25s ease both; }
        .fade-up-3 { animation: fadeUp 0.7s 0.4s ease both; }

        .service-card {
          background: #111111;
          border: 1px solid #222;
          border-radius: 16px;
          overflow: hidden;
          transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }
        .service-card:hover {
          border-color: #f59e0b66;
          transform: translateY(-6px);
          box-shadow: 0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px #f59e0b22;
        }

        .learn-more-btn {
          background: none;
          border: none;
          color: #e5e7eb;
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0;
          transition: color 0.2s;
          letter-spacing: 0.01em;
        }
        .learn-more-btn:hover { color: #f59e0b; }

        .cta-primary {
          background: #f59e0b;
          color: #0a0a0a;
          border: none;
          border-radius: 8px;
          padding: 14px 32px;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          letter-spacing: 0.01em;
        }
        .cta-primary:hover { background: #fbbf24; transform: translateY(-1px); }

        .cta-secondary {
          background: #1f1f1f;
          color: #e5e7eb;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 14px 32px;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
        }
        .cta-secondary:hover { background: #2a2a2a; border-color: #555; transform: translateY(-1px); }

        .hero-primary-btn {
          background: transparent;
          color: #f97316;
          border: 2px solid #f97316;
          border-radius: 10px;
          padding: 15px 36px;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
          display: flex;
          align-items: center;
          gap: 10px;
          letter-spacing: 0.01em;
        }
        .hero-primary-btn:hover {
          background: rgba(249,115,22,0.08);
          box-shadow: 0 0 18px rgba(249,115,22,0.35);
          transform: translateY(-1px);
        }

        .hero-secondary-btn {
          background: rgba(255,255,255,0.08);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 10px;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
          padding: 15px 36px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .hero-secondary-btn:hover {
          background: rgba(255,255,255,0.14);
          border-color: rgba(255,255,255,0.32);
          transform: translateY(-1px);
        }

        .process-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #111;
          border: 1px solid #2a2a2a;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          transition: border-color 0.3s, background 0.3s;
        }
        .process-step:hover .process-icon-wrap {
          border-color: #f59e0b55;
          background: #1a1a0a;
        }
        .process-step {
          text-align: center;
          max-width: 200px;
          transition: transform 0.25s;
          cursor: default;
        }
        .process-step:hover { transform: translateY(-4px); }

        .divider-line {
          width: 28px;
          height: 2px;
          background: #f59e0b;
          border-radius: 2px;
          margin: 12px 0 14px;
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1 — HERO / OUR SERVICES
      ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          minHeight: "420px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          overflow: "hidden",
          padding: "80px 24px",
        }}
      >
        {/* Background image — user supplies bg_1.png */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/bg_1.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.72) 100%)",
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: "700px" }}>
          <p
            className="fade-up-1"
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.22em",
              color: "#f59e0b",
              textTransform: "uppercase",
              marginBottom: "20px",
            }}
          >
            Our Services
          </p>

          <h1
            className="fade-up-2"
            style={{
              fontSize: "clamp(2.2rem, 6vw, 3.6rem)",
              fontWeight: 800,
              lineHeight: 1.12,
              marginBottom: "20px",
              letterSpacing: "-0.02em",
            }}
          >
            Everything You Need To{" "}
            <em style={{ fontStyle: "italic", color: "#f59e0b" }}>Build</em> Your Sound
          </h1>

          <p
            className="fade-up-3"
            style={{
              fontSize: "1rem",
              color: "#9ca3af",
              lineHeight: 1.7,
              maxWidth: "520px",
              margin: "0 auto 36px",
            }}
          >
            End-to-end music production, mixing, lyrics, and distribution services
            designed for the elite tier of sound creation.
          </p>

          <div
            className="fade-up-3"
            style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}
          >
            <Link href="/beat" className="hero-primary-btn">
              Start Your Project <ArrowRightIcon />
            </Link>
            <Link href="/about" className="hero-secondary-btn">View Portfolio</Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2 — SERVICE CARDS
      ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "#0d0d0d",
          padding: "80px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {services.map((svc, i) => (
            <Link
              key={i}
              href={`/services/${svc.slug}`}
              className="service-card"
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Image area */}
              <div
                style={{
                  height: "180px",
                  background: svc.imagePlaceholder,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  position: "relative",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              />

              {/* Text content */}
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", flex: 1 }}>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "#f59e0b",
                    letterSpacing: "0.05em",
                    marginBottom: "14px",
                    display: "block",
                  }}
                >
                  {svc.number}
                </span>

                <h3
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    marginBottom: "10px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {svc.title}
                </h3>

                <div className="divider-line" />

                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#9ca3af",
                    lineHeight: 1.65,
                    flex: 1,
                    marginBottom: "20px",
                  }}
                >
                  {svc.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <span className="learn-more-btn">
                    {svc.learnMore} <ArrowRightIcon />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3 — OUR PROCESS
      ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "#0a0a0a",
          padding: "96px 24px 80px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "12px",
            }}
          >
            Our Process
          </h2>
          <p style={{ color: "#6b7280", fontSize: "0.95rem", marginBottom: "64px" }}>
            The path from an idea to a global release.
          </p>

          <div
            style={{
              width: "100%",
              maxWidth: "1300px",
              margin: "0 auto",
              borderRadius: 0,
              overflow: "visible",
            }}
          >
            <img
              src="/process.png"
              alt="Our process"
              style={{
                display: "block",
                width: "100%",
                height: "auto",
              }}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 4 — CTA BANNER
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: "#0a0a0a", padding: "0 24px 96px" }}>
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            background: "#111",
            border: "1px solid #1f1f1f",
            borderRadius: "20px",
            padding: "clamp(48px, 6vw, 72px) clamp(24px, 6vw, 80px)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Amber glow top-right */}
          <div
            style={{
              position: "absolute",
              top: "-80px",
              right: "-80px",
              width: "360px",
              height: "360px",
              background: "radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          {/* Dark left side gradient */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "200px",
              height: "100%",
              background: "linear-gradient(to right, #0d0d0d 0%, transparent 100%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <h2
              style={{
                fontSize: "clamp(1.7rem, 4vw, 2.5rem)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: "16px",
              }}
            >
              Ready to Amplify Your Art?
            </h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.95rem",
                lineHeight: 1.7,
                maxWidth: "480px",
                margin: "0 auto 36px",
              }}
            >
              Let's collaborate on your next masterpiece. Join the elite network of producers
              and artists using Prahbh Music.
            </p>

            <div
              style={{
                display: "flex",
                gap: "16px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button className="cta-primary">Get Started Now</button>
              <a className="cta-secondary" href="https://mail.google.com/mail/?view=cm&fs=1&to=support@prabhmusik.com&su=Support%20Request">Contact Support</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}