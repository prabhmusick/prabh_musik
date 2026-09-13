'use client';
import { useState, useEffect, useRef } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const services = [
  {
    title: "Mixing",
    tagline: "Every element in its place.",
    desc: "Balancing levels, EQ, compression, stereo width, and spatial placement so your track breathes exactly the way you envisioned it.",
    detail: ["Up to 64 stems accepted", "3 rounds of revisions", "48–96kHz / 24-bit delivery", "Turnaround: 3–5 business days"],
    price: "₹2,499",
    icon: (
      <svg viewBox="0 0 48 48" width="40" fill="none">
        <rect x="4" y="22" width="4" height="12" rx="2" fill="#FF9124" opacity="0.9"/>
        <rect x="12" y="14" width="4" height="20" rx="2" fill="#FF9124"/>
        <rect x="20" y="8" width="4" height="32" rx="2" fill="#FF9124" opacity="0.7"/>
        <rect x="28" y="16" width="4" height="22" rx="2" fill="#FF9124" opacity="0.85"/>
        <rect x="36" y="20" width="4" height="14" rx="2" fill="#FF9124" opacity="0.6"/>
        <line x1="4" y1="38" x2="44" y2="38" stroke="#FF7A00" strokeWidth="1" opacity="0.3"/>
      </svg>
    ),
  },
  {
    title: "Mastering",
    tagline: "Loud, clear, streaming-ready.",
    desc: "Final loudness optimisation, true-peak limiting, and LUFS targeting for Spotify, Apple Music, YouTube and every major platform.",
    detail: ["LUFS-targeted per platform", "True-peak at −1 dBTP", "WAV + MP3 deliverables", "Turnaround: 1–2 business days"],
    price: "₹999",
    icon: (
      <svg viewBox="0 0 48 48" width="40" fill="none">
        <circle cx="24" cy="24" r="18" stroke="#FF9124" strokeWidth="1.5" opacity="0.2"/>
        <circle cx="24" cy="24" r="12" stroke="#FF9124" strokeWidth="1.5" opacity="0.4"/>
        <circle cx="24" cy="24" r="6" stroke="#FF9124" strokeWidth="1.5" opacity="0.8"/>
        <circle cx="24" cy="24" r="2" fill="#FF9124"/>
        <line x1="24" y1="6" x2="24" y2="11" stroke="#FF9124" strokeWidth="1.5"/>
        <line x1="24" y1="37" x2="24" y2="42" stroke="#FF9124" strokeWidth="1.5"/>
        <line x1="6" y1="24" x2="11" y2="24" stroke="#FF9124" strokeWidth="1.5"/>
        <line x1="37" y1="24" x2="42" y2="24" stroke="#FF9124" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    title: "Mix + Master Bundle",
    tagline: "Start to finish, one engineer.",
    desc: "Hand your raw sessions over and receive a commercially polished, platform-ready master — handled end-to-end with full communication throughout.",
    detail: ["Everything in Mixing + Mastering", "Priority queue", "Stems bounced back to you", "Turnaround: 4–7 business days"],
    price: "₹3,199",
    icon: (
      <svg viewBox="0 0 48 48" width="40" fill="none">
        <path d="M8 36 Q24 8 40 36" stroke="#FF9124" strokeWidth="2" fill="none"/>
        <circle cx="8" cy="36" r="3" fill="#FF9124" opacity="0.6"/>
        <circle cx="24" cy="14" r="3" fill="#FF9124"/>
        <circle cx="40" cy="36" r="3" fill="#FF9124" opacity="0.6"/>
        <path d="M16 28 Q24 20 32 28" stroke="#FF7A00" strokeWidth="1.5" fill="none" opacity="0.6"/>
      </svg>
    ),
  },
];

const steps = [
  { label: "Upload", body: "Send us your session files, stems, or a rough bounce via our secure upload link." },
  { label: "Consult", body: "We listen, ask questions, and agree on the sonic direction before touching a fader." },
  { label: "Process", body: "Your track is mixed and/or mastered in our calibrated studio environment." },
  { label: "Deliver", body: "You receive polished files with revision rounds built in. No surprises, no extra charges." },
];

const genres = ["Hip-Hop", "R&B", "Afrobeats", "Pop", "Trap", "Lo-Fi", "Drill", "Dancehall", "Electronic"];

const faqs = [
  {
    q: "What file formats do you accept?",
    a: "We accept WAV, AIFF, and MP3 for mastering. For mixing sessions, we prefer exported stems as WAV (44.1/48/96kHz, 24-bit). Logic, Ableton, and Pro Tools sessions are welcome too.",
  },
  {
    q: "How many revisions are included?",
    a: "Mixing includes 3 rounds of revisions. Mastering includes 2. Additional rounds are available at ₹299 per round.",
  },
  {
    q: "Do you handle vocals separately?",
    a: "Yes. Vocal tuning and editing are available as add-ons. Just let us know when you submit your project.",
  },
  {
    q: "Will my track hit streaming loudness standards?",
    a: "Absolutely. Every master is targeted to platform-specific LUFS standards — Spotify, Apple Music, YouTube, and more.",
  },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function MixMasterPage() {
  const [scrollY, setScrollY] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeService, setActiveService] = useState(0);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    name: "",
    email: "",
    projectType: "Mixing & Mastering",
    trackTitle: "",
    timeline: "",
    requirements: "",
  });
  const waveRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Animated waveform on canvas
  useEffect(() => {
    const canvas = waveRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let raf: number;

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const bars = 80;
      const barW = W / bars;
      for (let i = 0; i < bars; i++) {
        const t = frame * 0.018;
        const h = Math.abs(Math.sin(i * 0.18 + t) * Math.cos(i * 0.09 + t * 0.7)) * H * 0.72 + 4;
        const x = i * barW + barW * 0.15;
        const bw = barW * 0.55;
        const alpha = 0.18 + 0.55 * (h / (H * 0.72 + 4));
        ctx.fillStyle = `rgba(255,145,36,${alpha})`;
        ctx.beginPath();
        ctx.roundRect(x, (H - h) / 2, bw, h, 2);
        ctx.fill();
      }
      frame++;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleQuoteChange = (field: keyof typeof quoteForm, value: string) => {
    setQuoteForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuoteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = [
      "Hi Prabh Musik, I want a custom quote for Mixing & Mastering.",
      `Name: ${quoteForm.name || "Not provided"}`,
      `Email: ${quoteForm.email || "Not provided"}`,
      `Project Type: ${quoteForm.projectType}`,
      `Track Title: ${quoteForm.trackTitle || "Not provided"}`,
      `Timeline: ${quoteForm.timeline || "Not provided"}`,
      "Requirements:",
      quoteForm.requirements || "No additional requirements provided",
    ].join("\n");

    window.open(`https://wa.me/919461209922?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    setQuoteSubmitted(true);
    setShowQuoteForm(false);
    setQuoteForm({
      name: "",
      email: "",
      projectType: "Mixing & Mastering",
      trackTitle: "",
      timeline: "",
      requirements: "",
    });
  };

  return (
    <div style={{ background: "#0d0d0d", color: "#e8e2d9", fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --or: #FF9124;
          --or2: #FF7A00;
          --or-dim: #7a3d00;
          --bg: #0d0d0d;
          --bg2: #111111;
          --card: #161616;
          --border: #222222;
          --muted: #555;
          --text: #e8e2d9;
        }

        html { scroll-behavior: smooth; }

        a { text-decoration: none; color: inherit; }

        .nav-link {
          font-size: 13px; font-weight: 500; color: #aaa;
          transition: color 0.2s; padding-bottom: 2px;
          position: relative;
        }
        .nav-link::after {
          content: ''; position: absolute; bottom: -2px; left: 0; right: 0;
          height: 1.5px; background: var(--or); transform: scaleX(0);
          transform-origin: left; transition: transform 0.2s;
        }
        .nav-link:hover { color: #fff; }
        .nav-link:hover::after { transform: scaleX(1); }
        .nav-link.active { color: #fff; }
        .nav-link.active::after { transform: scaleX(1); }

        .pill-btn {
          background: var(--or); color: #000; border: none;
          padding: 10px 22px; border-radius: 6px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .pill-btn:hover {
          background: var(--or2); transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(255,145,36,0.35);
        }

        .ghost-btn {
          background: transparent; color: var(--or);
          border: 1.5px solid rgba(255,145,36,0.35);
          padding: 10px 22px; border-radius: 6px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.2s;
        }
        .ghost-btn:hover {
          border-color: var(--or);
          background: rgba(255,145,36,0.07);
        }

        .search-box {
          background: rgba(255,255,255,0.06); border: 1px solid #2a2a2a;
          border-radius: 100px; padding: 8px 16px 8px 36px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px; color: #888; width: 160px; outline: none;
          transition: border-color 0.2s, width 0.3s;
        }
        .search-box:focus { border-color: rgba(255,145,36,0.4); width: 200px; color: #ccc; }
        .search-box::placeholder { color: #555; }

        .service-tab {
          padding: 14px 24px; cursor: pointer;
          font-size: 14px; font-weight: 600;
          color: #555; border-bottom: 2px solid transparent;
          transition: all 0.2s; white-space: nowrap;
          background: none; border-top: none; border-left: none; border-right: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .service-tab:hover { color: #aaa; }
        .service-tab.active { color: var(--or); border-bottom-color: var(--or); }

        .step-dot {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,145,36,0.1);
          border: 1.5px solid rgba(255,145,36,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: var(--or);
          flex-shrink: 0;
        }

        .faq-item {
          border-bottom: 1px solid var(--border);
          overflow: hidden;
        }
        .faq-q {
          padding: 20px 0; display: flex; justify-content: space-between;
          align-items: center; cursor: pointer; gap: 16px;
        }
        .faq-q:hover .faq-q-text { color: var(--or); }
        .faq-q-text { font-size: 15px; font-weight: 600; transition: color 0.2s; }
        .faq-a {
          font-size: 14px; font-weight: 300; color: #666; line-height: 1.7;
          padding-bottom: 20px; max-width: 680px;
        }

        .genre-chip {
          padding: 6px 14px; border-radius: 100px;
          border: 1px solid #252525; background: #161616;
          font-size: 11px; font-weight: 600; color: #555;
          letter-spacing: 0.5px; cursor: default;
          transition: all 0.2s;
        }
        .genre-chip:hover { border-color: rgba(255,145,36,0.3); color: var(--or); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fu { animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .fu1 { animation-delay: 0.05s; }
        .fu2 { animation-delay: 0.18s; }
        .fu3 { animation-delay: 0.3s; }
        .fu4 { animation-delay: 0.42s; }

        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,145,36,0); }
          50% { box-shadow: 0 0 32px 4px rgba(255,145,36,0.12); }
        }

        .detail-chip {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 500; color: #666;
        }
        .detail-chip::before {
          content: ''; width: 5px; height: 5px; border-radius: 50%;
          background: var(--or); flex-shrink: 0; opacity: 0.7;
        }

        @media (max-width: 768px) {
          .mix-hero { padding: 40px 22px 60px !important; }
          .mix-hero h1 { margin-bottom: 20px !important; }
          .mix-hero p { max-width: 100% !important; }
          .hero-wave { bottom: 24px !important; opacity: 0.4 !important; }
          .service-panel { grid-template-columns: 1fr !important; gap: 28px !important; }
          .service-panel > div:first-child { order: 0; }
          .service-panel > div:last-child { order: 1; }
          .service-panel > div:last-child { padding: 28px 24px !important; }
          .process-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .process-step { padding-right: 0 !important; padding-bottom: 24px !important; }
          .process-connector { display: none !important; }
          .genres-section { padding: 40px 22px !important; }
          .genres-section .genre-chip { font-size: 11px !important; padding: 8px 12px !important; }
          .social-proof-section { padding: 60px 22px !important; }
          .social-proof-section > div { grid-template-columns: 1fr !important; }
          .social-proof-section > div > div { padding: 32px 24px !important; }
          .cta-banner { padding: 0 22px 60px !important; }
          .cta-banner > div { padding: 42px 24px !important; flex-direction: column !important; align-items: stretch !important; }
          .cta-banner > div > div:last-child { width: 100% !important; justify-content: flex-start !important; }
          .cta-banner button { width: 100% !important; min-width: 100% !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section className="mix-hero" style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "50px 64px 80px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Background radial glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 60% 60% at 50% 60%, rgba(255,122,0,0.07) 0%, transparent 65%)",
        }} />
        {/* Grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,145,36,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,145,36,0.03) 1px,transparent 1px)",
          backgroundSize: "52px 52px",
        }} />

        {/* Animated waveform */}
        <canvas
          ref={waveRef}
          className="hero-wave"
          width={900} height={120}
          style={{
            position: "absolute", bottom: 60, left: "50%",
            transform: "translateX(-50%)", opacity: 0.6,
            width: "100vw",
            maxWidth: "100%",
          }}
        />

        <div style={{ position: "relative", maxWidth: 780 }}>
          {/* Eyebrow */}
          <div className="fu fu1" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,145,36,0.1)", border: "1px solid rgba(255,145,36,0.22)",
            borderRadius: 100, padding: "6px 16px", marginBottom: 28,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF9124", display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#FF9124", letterSpacing: 2, textTransform: "uppercase" }}>
              Mix n Master
            </span>
          </div>

          <div style={{ width: 36, height: 2, background: "#FF9124", marginBottom: 24, borderRadius: 2 }} />

          <h1 className="fu fu2" style={{
            fontSize: "clamp(48px, 8vw, 96px)", fontWeight: 800,
            lineHeight: 0.95, letterSpacing: "-2px", marginBottom: 28, color: "#fff",
          }}>
            We deliver clean,
            <br />
            <span style={{ color: "#FF9124" }}>balanced</span> mixes
            <br />
            and loud,{" "}
            <svg
              viewBox="0 0 520 90"
              style={{ display: "inline-block", verticalAlign: "middle", height: "0.95em", overflow: "visible", marginBottom: "0.05em" }}
              aria-label="professional"
            >
              <text
                x="0" y="76"
                fontFamily="'Plus Jakarta Sans', sans-serif"
                fontWeight="800"
                fontSize="80"
                letterSpacing="-2"
                fill="none"
                stroke="#FF9124"
                strokeWidth="1.8"
                paintOrder="stroke"
              >
                professional
              </text>
            </svg>
            <br />
            masters.
          </h1>

          <p className="fu fu3" style={{
            fontSize: 17, fontWeight: 300, color: "#666",
            maxWidth: 520, lineHeight: 1.75, marginBottom: 44,
          }}>
            Ready for all major streaming platforms. Whether you're dropping a
            single or finishing an album — we get it sounding exactly right.
          </p>

          <div className="fu fu4" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button className="pill-btn" style={{ padding: "14px 32px", fontSize: 14 }}>
              Start a Project
            </button>
            <button className="ghost-btn" style={{ padding: "14px 32px", fontSize: 14 }}>
              Hear Samples
            </button>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" style={{ padding: "100px 64px", background: "#0f0f0f", borderTop: "1px solid #1a1a1a" }}>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 26, height: 2, background: "#FF9124", borderRadius: 2 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#FF9124", letterSpacing: 4, textTransform: "uppercase" }}>
            What We Offer
          </span>
        </div>
        <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 40, color: "#fff" }}>
          Services
        </h2>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #1e1e1e", marginBottom: 40, overflowX: "auto" }}>
          {services.map((s, i) => (
            <button
              key={i}
              className={`service-tab${activeService === i ? " active" : ""}`}
              onClick={() => setActiveService(i)}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Active service panel */}
        {services.map((s, i) => (
          i === activeService && (
            <div key={i} className="service-panel" style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 60, alignItems: "start",
            }}>
              <div>
                <div style={{ marginBottom: 24 }}>{s.icon}</div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#FF9124", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
                  {s.tagline}
                </p>
                <p style={{ fontSize: 16, fontWeight: 300, color: "#888", lineHeight: 1.8, marginBottom: 32 }}>
                  {s.desc}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
                  {s.detail.map((d, di) => (
                    <div key={di} className="detail-chip">{d}</div>
                  ))}
                </div>
                <a
                  href="https://wa.me/919461209922?text=Hi%20Prabh%20Musik%2C%20I%20want%20to%20book%20this%20service."
                  target="_blank"
                  rel="noreferrer"
                  className="pill-btn"
                  style={{ padding: "14px 32px", fontSize: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                >
                  Book This Service
                </a>
              </div>

              <div style={{
                background: "#141414", border: "1px solid #1e1e1e",
                borderRadius: 12, padding: "40px 36px",
                display: "flex", flexDirection: "column",
                alignItems: "flex-start", gap: 18,
                animation: "glow-pulse 4s ease infinite",
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#444", letterSpacing: 3, textTransform: "uppercase" }}>
                  Premium Sound
                </span>
                <h3 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-1px" }}>
                  High-Quality Mixing & Mastering
                </h3>
                <p style={{ fontSize: 16, color: "#d3d3d3", fontWeight: 300, lineHeight: 1.8 }}>
                  Give your music the professional sound it deserves. Our mixing and mastering services are tailored to bring out the best in every track.
                </p>
                <div style={{ width: "100%", height: 1, background: "#1e1e1e", margin: "8px 0 4px" }} />
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                  {[
                    "Detailed mix balancing and tonal shaping",
                    "Streaming-ready mastering with loudness optimization",
                    "Revision-friendly workflow for artists and labels",
                  ].map((item) => (
                    <li key={item} style={{ fontSize: 14, color: "#b8b8b8", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF9124", display: "inline-block" }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://wa.me/919461209922?text=Hi%20Prabh%20Musik%2C%20I%20want%20a%20custom%20quote%20for%20Mixing%20%26%20Mastering."
                  target="_blank"
                  rel="noreferrer"
                  className="pill-btn"
                  style={{ marginTop: 18, width: "100%", padding: "14px 0", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                >
                  Get a Custom Quote
                </a>
                {quoteSubmitted && (
                  <div style={{ marginTop: 12, color: "#7ee7a8", fontSize: 13, fontWeight: 500 }}>
                    Thanks! Your project details are ready for WhatsApp follow-up.
                  </div>
                )}
              </div>
            </div>
          )
        ))}

        {showQuoteForm && (
          <form
            onSubmit={handleQuoteSubmit}
            style={{
              marginTop: 28,
              background: "#141414",
              border: "1px solid #1e1e1e",
              borderRadius: 12,
              padding: "28px 24px",
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 18,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label htmlFor="quote-name" style={{ fontSize: 12, fontWeight: 700, color: "#b8b8b8", letterSpacing: 1.2, textTransform: "uppercase" }}>
                Your Name
              </label>
              <input
                id="quote-name"
                value={quoteForm.name}
                onChange={(e) => handleQuoteChange("name", e.target.value)}
                placeholder="Enter your name"
                style={{ background: "#0d0d0d", border: "1px solid #2b2b2b", borderRadius: 8, padding: "12px 14px", color: "#f4f4f4" }}
                required
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label htmlFor="quote-email" style={{ fontSize: 12, fontWeight: 700, color: "#b8b8b8", letterSpacing: 1.2, textTransform: "uppercase" }}>
                Email
              </label>
              <input
                id="quote-email"
                type="email"
                value={quoteForm.email}
                onChange={(e) => handleQuoteChange("email", e.target.value)}
                placeholder="you@example.com"
                style={{ background: "#0d0d0d", border: "1px solid #2b2b2b", borderRadius: 8, padding: "12px 14px", color: "#f4f4f4" }}
                required
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label htmlFor="quote-project" style={{ fontSize: 12, fontWeight: 700, color: "#b8b8b8", letterSpacing: 1.2, textTransform: "uppercase" }}>
                Project Type
              </label>
              <select
                id="quote-project"
                value={quoteForm.projectType}
                onChange={(e) => handleQuoteChange("projectType", e.target.value)}
                style={{ background: "#0d0d0d", border: "1px solid #2b2b2b", borderRadius: 8, padding: "12px 14px", color: "#f4f4f4" }}
              >
                <option>Mixing & Mastering</option>
                <option>Mixing Only</option>
                <option>Mastering Only</option>
                <option>Album / EP</option>
                <option>Other</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label htmlFor="quote-track" style={{ fontSize: 12, fontWeight: 700, color: "#b8b8b8", letterSpacing: 1.2, textTransform: "uppercase" }}>
                Track / Song Title
              </label>
              <input
                id="quote-track"
                value={quoteForm.trackTitle}
                onChange={(e) => handleQuoteChange("trackTitle", e.target.value)}
                placeholder="Name of the song or project"
                style={{ background: "#0d0d0d", border: "1px solid #2b2b2b", borderRadius: 8, padding: "12px 14px", color: "#f4f4f4" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, gridColumn: "1 / -1" }}>
              <label htmlFor="quote-timeline" style={{ fontSize: 12, fontWeight: 700, color: "#b8b8b8", letterSpacing: 1.2, textTransform: "uppercase" }}>
                Desired Timeline
              </label>
              <input
                id="quote-timeline"
                value={quoteForm.timeline}
                onChange={(e) => handleQuoteChange("timeline", e.target.value)}
                placeholder="e.g. 2 weeks, ASAP, release in 10 days"
                style={{ background: "#0d0d0d", border: "1px solid #2b2b2b", borderRadius: 8, padding: "12px 14px", color: "#f4f4f4" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, gridColumn: "1 / -1" }}>
              <label htmlFor="quote-requirements" style={{ fontSize: 12, fontWeight: 700, color: "#b8b8b8", letterSpacing: 1.2, textTransform: "uppercase" }}>
                Project Requirements
              </label>
              <textarea
                id="quote-requirements"
                value={quoteForm.requirements}
                onChange={(e) => handleQuoteChange("requirements", e.target.value)}
                rows={5}
                placeholder="Tell us about the track, references, number of stems, genre, preferred sound, and any deadlines."
                style={{ background: "#0d0d0d", border: "1px solid #2b2b2b", borderRadius: 8, padding: "12px 14px", color: "#f4f4f4", resize: "vertical" }}
                required
              />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>
              <button type="button" className="ghost-btn" onClick={() => setShowQuoteForm(false)}>
                Cancel
              </button>
              <button type="submit" className="pill-btn">
                Send Quote Request
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ── PROCESS ── */}
      <section style={{ padding: "100px 64px", borderTop: "1px solid #1a1a1a" }}>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 26, height: 2, background: "#FF9124", borderRadius: 2 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#FF9124", letterSpacing: 4, textTransform: "uppercase" }}>
            How It Works
          </span>
        </div>
        <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 64, color: "#fff" }}>
          Your track, start to finish.
        </h2>

        <div className="process-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
          {steps.map((step, i) => (
            <div key={i} className="process-step" style={{ position: "relative", paddingRight: 32 }}>
              {/* connector line */}
              {i < steps.length - 1 && (
                <div className="process-connector" style={{
                  position: "absolute", top: 18, left: 36, right: 0,
                  height: 1,
                  background: "linear-gradient(90deg, rgba(255,145,36,0.3), rgba(255,145,36,0.05))",
                }} />
              )}
              <div className="step-dot" style={{ marginBottom: 20 }}>{i + 1}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{step.label}</div>
              <div style={{ fontSize: 13, fontWeight: 300, color: "#666", lineHeight: 1.7 }}>{step.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── GENRES ── */}
      <section className="genres-section" style={{ padding: "60px 64px", background: "#0f0f0f", borderTop: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#444", letterSpacing: 3, textTransform: "uppercase", flexShrink: 0 }}>
            Genres We Work With
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {genres.map((g) => (
              <span key={g} className="genre-chip">{g}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="social-proof-section" style={{ padding: "100px 64px", borderTop: "1px solid #1a1a1a" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 1, border: "1px solid #1a1a1a", borderRadius: 12, overflow: "hidden",
        }}>
          {[
            { n: "500+", label: "Tracks Delivered" },
            { n: "98%", label: "Client Satisfaction" },
            { n: "48h", label: "Avg. Turnaround" },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: "52px 40px",
              background: "#111",
              borderRight: i < 2 ? "1px solid #1a1a1a" : "none",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "clamp(48px, 5vw, 68px)", fontWeight: 800, color: "#FF9124", lineHeight: 1, letterSpacing: "-2px" }}>
                {stat.n}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#484848", letterSpacing: 3, marginTop: 10, textTransform: "uppercase" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: "80px 64px 100px", background: "#0f0f0f", borderTop: "1px solid #1a1a1a" }}>
        <div style={{ maxWidth: 760 }}>
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 26, height: 2, background: "#FF9124", borderRadius: 2 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#FF9124", letterSpacing: 4, textTransform: "uppercase" }}>
              FAQ
            </span>
          </div>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 48, color: "#fff" }}>
            Common Questions
          </h2>

          {faqs.map((faq, i) => (
            <div key={i} className="faq-item">
              <div className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span className="faq-q-text" style={{ color: openFaq === i ? "#FF9124" : "#ccc" }}>{faq.q}</span>
                <span style={{ color: openFaq === i ? "#FF9124" : "#444", fontSize: 22, lineHeight: 1, fontWeight: 300, flexShrink: 0 }}>
                  {openFaq === i ? "−" : "+"}
                </span>
              </div>
              {openFaq === i && (
                <div className="faq-a">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="cta-banner" style={{ padding: "0 64px 80px" }}>
        <div style={{
          background: "linear-gradient(130deg, #FF9124 0%, #FF7A00 100%)",
          borderRadius: 14, padding: "60px 64px",
          display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 28,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.45)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>
              Ready to Sound Pro?
            </div>
            <h3 style={{ fontSize: "clamp(28px, 4vw, 50px)", fontWeight: 800, color: "#000", lineHeight: 0.95, letterSpacing: "-1px" }}>
              Send us your track.
              <br />
              We'll make it hit.
            </h3>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <a
              href="https://wa.me/919461209922?text=Hi%20Prabh%20Musik%2C%20I%20want%20to%20upload%20my%20track%20for%20mixing%20and%20mastering."
              target="_blank"
              rel="noreferrer"
              style={{
                background: "#000", color: "#FF9124", border: "none",
                padding: "15px 36px", borderRadius: 8,
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.2s",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ""; }}
            >
              Upload Your Track
            </a>
            <a
              href="https://wa.me/919461209922?text=Hi%20Prabh%20Musik%2C%20I%20want%20to%20talk%20about%20my%20track."
              target="_blank"
              rel="noreferrer"
              style={{
                background: "transparent", color: "#000",
                border: "2px solid rgba(0,0,0,0.2)", padding: "14px 36px",
                borderRadius: 8, fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}