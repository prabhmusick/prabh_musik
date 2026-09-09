'use client';
import { useState, useEffect, useRef } from "react";

const stats = [
  { value: "200M+", label: "Units Sold Worldwide" },
  { value: "$3.2B", label: "Annual Revenue" },
  { value: "180+", label: "Countries Reached" },
  { value: "94%", label: "Customer Satisfaction" },
];

const strategies = [
  {
    id: "01",
    title: "Artist Partnerships",
    description:
      "Deep-rooted collaborations with chart-topping artists and producers. We don't just sponsor—we co-create. Limited edition drops that become cultural moments.",
    kpi: "340% ROI on collab campaigns",
    icon: "🎤",
  },
  {
    id: "02",
    title: "Sonic Dominance",
    description:
      "Positioning Beats as the studio-grade daily driver. Every product tells a story of uncompromised audio fidelity—tuned by the world's most demanding ears.",
    kpi: "62% market share in premium segment",
    icon: "🔊",
  },
  {
    id: "03",
    title: "Cultural Immersion",
    description:
      "We live where culture is made—stadiums, studios, street corners, and runways. Our brand shows up where music matters most: before the drop, during the set, after the encore.",
    kpi: "2.1B social impressions Q1 2026",
    icon: "🌍",
  },
  {
    id: "04",
    title: "Gen Z Pipeline",
    description:
      "Hyper-targeted content across TikTok, YouTube Shorts, and Twitch. Authenticity over polish. We seed culture instead of chasing it.",
    kpi: "47% YoY growth in 18–24 segment",
    icon: "⚡",
  },
];

const campaigns = [
  {
    title: "STUDIO SESSIONS",
    quarter: "Q1 2026",
    status: "LIVE",
    desc: "Behind-the-scenes with Grammy-winning producers",
    reach: "890M",
  },
  {
    title: "STREET FREQUENCY",
    quarter: "Q2 2026",
    status: "ACTIVE",
    desc: "Urban micro-influencer program across 12 cities",
    reach: "420M",
  },
  {
    title: "DROP ZERO",
    quarter: "Q3 2026",
    status: "UPCOMING",
    desc: "Mystery limited edition product launch event",
    reach: "TBD",
  },
  {
    title: "SONIC PRIDE",
    quarter: "Q4 2026",
    status: "PLANNING",
    desc: "Holiday flagship campaign & retail activation",
    reach: "1.4B",
  },
];

const products = [
  { name: "Beats Studio Pro X", tag: "Flagship", price: "$399", heat: 98 },
  { name: "Beats Flex 2", tag: "Everyday", price: "$79", heat: 85 },
  { name: "Beats Fit Pro Ultra", tag: "Sport", price: "$229", heat: 91 },
  { name: "Beats Pill+", tag: "Speaker", price: "$149", heat: 76 },
];

export default function BeatsMarketingPage() {
  const [activeStrategy, setActiveStrategy] = useState(0);
  const [count, setCount] = useState({ val: 0, stat: 0 });
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => ({ ...c, stat: (c.stat + 1) % stats.length }));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        background: "#0a0a0a",
        color: "#fff",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,300&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --orange: #FF9124;
          --orange-hot: #FF7A00;
          --orange-dim: #cc6e00;
          --orange-glow: rgba(255,145,36,0.15);
          --orange-border: rgba(255,145,36,0.25);
          --black: #0a0a0a;
          --black-mid: #0f0f0f;
          --black-card: #141414;
          --grey: #777;
          --white: #fff;
        }

        body { font-family: 'Plus Jakarta Sans', sans-serif; }

        .nav-link {
          color: var(--grey);
          text-decoration: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .nav-link:hover { color: var(--orange); }

        .hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 55% 55% at 72% 48%, rgba(255,122,0,0.09) 0%, transparent 55%),
            radial-gradient(ellipse 30% 50% at 8% 85%, rgba(255,145,36,0.05) 0%, transparent 50%);
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,145,36,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,145,36,0.035) 1px, transparent 1px);
          background-size: 56px 56px;
        }

        .stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--orange-glow);
          border: 1px solid var(--orange-border);
          border-radius: 100px;
          padding: 7px 16px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: var(--orange);
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .cta-primary {
          background: var(--orange);
          color: #000;
          border: none;
          padding: 14px 36px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.22s;
          border-radius: 4px;
        }
        .cta-primary:hover {
          background: var(--orange-hot);
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(255,122,0,0.35);
        }

        .cta-secondary {
          background: transparent;
          color: var(--orange);
          border: 1.5px solid var(--orange-border);
          padding: 13px 36px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.22s;
          border-radius: 4px;
        }
        .cta-secondary:hover {
          border-color: var(--orange);
          background: var(--orange-glow);
        }

        .strategy-card {
          background: var(--black-card);
          border: 1px solid #1e1e1e;
          padding: 26px 28px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
          border-radius: 6px;
        }
        .strategy-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: linear-gradient(to bottom, var(--orange), var(--orange-hot));
          border-radius: 4px 0 0 4px;
          transform: scaleY(0);
          transform-origin: bottom;
          transition: transform 0.3s;
        }
        .strategy-card:hover::before,
        .strategy-card.active::before { transform: scaleY(1); }
        .strategy-card:hover,
        .strategy-card.active {
          border-color: var(--orange-border);
          background: #191919;
        }

        .campaign-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 2fr 1fr;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #1a1a1a;
          transition: background 0.2s;
          gap: 16px;
        }
        .campaign-row:hover { background: rgba(255,145,36,0.025); }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          border-radius: 100px;
        }
        .status-live { background: rgba(255,145,36,0.15); color: var(--orange); border: 1px solid rgba(255,145,36,0.35); }
        .status-active { background: rgba(255,122,0,0.1); color: #ff9124; border: 1px solid rgba(255,122,0,0.25); }
        .status-upcoming { background: rgba(255,255,255,0.04); color: #555; border: 1px solid #2a2a2a; }
        .status-planning { background: rgba(255,255,255,0.02); color: #383838; border: 1px solid #1e1e1e; }

        .product-card {
          background: var(--black-card);
          border: 1px solid #1a1a1a;
          padding: 24px;
          position: relative;
          transition: all 0.3s;
          overflow: hidden;
          border-radius: 8px;
        }
        .product-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--orange), transparent);
          transform: scaleX(0);
          transition: transform 0.35s;
          border-radius: 0 0 8px 8px;
        }
        .product-card:hover::after { transform: scaleX(1); }
        .product-card:hover {
          border-color: var(--orange-border);
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .heat-bar {
          height: 3px;
          background: #222;
          border-radius: 99px;
          overflow: hidden;
          margin-top: 12px;
        }
        .heat-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--orange-dim), var(--orange));
          border-radius: 99px;
          transition: width 1s ease;
        }

        .section-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 4px;
          color: var(--orange);
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }
        .section-label::before {
          content: '';
          width: 28px;
          height: 2px;
          background: var(--orange);
          border-radius: 2px;
        }

        .big-ghost {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          line-height: 0.85;
          color: transparent;
          -webkit-text-stroke: 1px rgba(255,145,36,0.08);
          position: absolute;
          right: -20px;
          top: -10px;
          pointer-events: none;
          user-select: none;
        }

        .ticker {
          display: flex;
          gap: 48px;
          animation: ticker 22s linear infinite;
          white-space: nowrap;
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.75s cubic-bezier(0.22,1,0.36,1) forwards; }
        .delay-1 { animation-delay: 0.05s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.35s; opacity: 0; }
        .delay-4 { animation-delay: 0.5s; opacity: 0; }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }

        @media (max-width: 768px) {
          .campaign-row { grid-template-columns: 1fr 1fr; }
          .hero { padding: 60px 24px 60px !important; }
          .hero h1 { margin-bottom: 24px !important; }
          .hero .stat-pill { max-width: 100%; }
          .hero-stats {
            position: static !important;
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
            margin-top: 32px;
            align-items: start;
            justify-items: stretch;
            text-align: left;
          }
          .hero-stats > div { text-align: left !important; }
          .stats-bar { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .strategy-section { padding: 80px 24px !important; }
          .strategy-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .campaign-section { padding: 60px 24px !important; }
          .campaign-table { border-radius: 0 !important; }
          .campaign-row {
            grid-template-columns: 1fr !important;
            padding: 18px 18px !important;
          }
          .campaign-row span {
            display: block;
            width: 100%;
            text-align: left;
          }
          .campaign-row span:nth-child(1) { font-size: 15px; font-weight: 700; }
          .campaign-row span:nth-child(3),
          .campaign-row span:nth-child(5) { justify-self: start; }
          .cta-banner { margin: 0 24px 64px !important; padding: 42px 22px !important; }
          .cta-banner > div:last-child {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .cta-banner button {
            min-width: 100%;
            width: 100%;
          }
        }
      `}</style>

      {/* HERO */}
      <section
        ref={heroRef}
        className="hero"
        style={{
          minHeight: "100vh",
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "80px 48px 80px",
          position: "relative", overflow: "hidden",
        }}
      >
        <div className="hero-bg" />
        <div className="grid-overlay" />

        {/* Ghost BG letter */}
        <div
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(220px, 38vw, 480px)",
            lineHeight: 0.85,
            color: "transparent",
            WebkitTextStroke: "1px rgba(255,145,36,0.055)",
            position: "absolute",
            right: "-60px", top: "50%",
            transform: "translateY(-50%)",
            userSelect: "none", pointerEvents: "none",
          }}
        >
          b
        </div>

        <div style={{ position: "relative", maxWidth: 880 }}>
          <div className="stat-pill fade-up delay-1" style={{ marginBottom: 32 }}>
            <span
              style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "var(--orange)", display: "inline-block",
                animation: "pulse-dot 1.8s ease infinite",
              }}
            />
            2026 Marketing & Strategy Overview
          </div>

          <h1
            className="fade-up delay-2"
            style={{
              fontSize: "clamp(56px, 10vw, 120px)",
              fontWeight: 800,
              lineHeight: 0.92,
              letterSpacing: "-2px",
              marginBottom: 28,
            }}
          >
            Sound Is
            <br />
            <span style={{ color: "var(--orange)" }}>Power.</span>
            <br />
            Power Is
            <br />
            Market.
          </h1>

          <p
            className="fade-up delay-3"
            style={{
              fontSize: 18, fontWeight: 300,
              color: "#777", maxWidth: 520,
              lineHeight: 1.7, marginBottom: 44,
            }}
          >
            Beats isn't a headphone brand. It's a cultural movement powered by
            unapologetic sound, raw artistry, and a relentless drive to own
            every frequency of modern life.
          </p>

          <div className="fade-up delay-4" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button className="cta-primary">View Full Strategy</button>
            <button className="cta-secondary">Watch Brand Film</button>
          </div>
        </div>

        {/* Floating stat counter */}
        <div
          className="hero-stats"
          style={{
            position: "absolute", right: 48, bottom: 80,
            display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-end",
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                textAlign: "right",
                opacity: count.stat === i ? 1 : 0.18,
                transition: "opacity 0.6s",
              }}
            >
              <div style={{ fontSize: 34, fontWeight: 800, color: "var(--orange)", lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, fontWeight: 500, marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TICKER */}
      <div
        style={{
          borderTop: "1px solid #181818", borderBottom: "1px solid #181818",
          padding: "13px 0", overflow: "hidden",
          background: "rgba(255,145,36,0.018)",
        }}
      >
        <div className="ticker">
          {[...Array(2)].map((_, j) =>
            ["STUDIO QUALITY", "CULTURAL IMPACT", "ARTIST DRIVEN", "GLOBAL REACH",
             "SONIC DOMINANCE", "DROP CULTURE", "PREMIUM SOUND", "BEATS BY DRE",
            ].map((t, i) => (
              <span
                key={`${j}-${i}`}
                style={{
                  fontSize: 10, letterSpacing: 4, fontWeight: 600,
                  color: i % 2 === 0 ? "#2a2a2a" : "var(--orange-dim)",
                  textTransform: "uppercase",
                }}
              >
                {t} ◆{" "}
              </span>
            ))
          )}
        </div>
      </div>

      {/* STATS BAR */}
      <section
        className="stats-bar"
        style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          borderBottom: "1px solid #181818",
        }}
      >
        {stats.map((s, i) => (
          <div
            key={i}
            style={{
              padding: "44px 32px",
              borderRight: i < 3 ? "1px solid #181818" : "none",
              position: "relative", overflow: "hidden",
            }}
          >
            <div
              className="big-ghost"
              style={{ fontSize: "clamp(64px, 9vw, 110px)" }}
            >
              {i + 1}
            </div>
            <div
              style={{
                fontSize: "clamp(38px, 4.5vw, 58px)",
                fontWeight: 800, color: "var(--orange)", lineHeight: 1,
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: 10, color: "#484848", letterSpacing: 2.5,
                marginTop: 8, fontWeight: 600, textTransform: "uppercase",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </section>

      {/* STRATEGY */}
      <section className="strategy-section" style={{ padding: "100px 48px" }}>
        <div className="section-label">Core Strategy Pillars</div>
        <div
          className="strategy-grid"
          style={{
            display: "grid", gridTemplateColumns: "1fr 1.5fr",
            gap: 60, alignItems: "start",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "clamp(44px, 5.5vw, 76px)",
                fontWeight: 800, lineHeight: 0.95,
                letterSpacing: "-1.5px", marginBottom: 28,
              }}
            >
              How We
              <br />
              <span style={{ color: "var(--orange)" }}>Dominate</span>
              <br />
              Every
              <br />
              Market
            </h2>
            <p
              style={{
                color: "#555", fontSize: 15, lineHeight: 1.8,
                fontWeight: 300, maxWidth: 380,
              }}
            >
              Four interlocking vectors of market penetration — each one reinforcing
              the next. Not a strategy. A system.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {strategies.map((s, i) => (
              <div
                key={i}
                className={`strategy-card ${activeStrategy === i ? "active" : ""}`}
                onClick={() => setActiveStrategy(i)}
              >
                <div
                  style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: activeStrategy === i ? 14 : 0,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span
                      style={{
                        fontSize: 10, color: "var(--orange)",
                        letterSpacing: 2, fontWeight: 700,
                      }}
                    >
                      {s.id}
                    </span>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <span style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>
                      {s.title}
                    </span>
                  </div>
                  <span style={{ color: "#333", fontSize: 20, lineHeight: 1, fontWeight: 300 }}>
                    {activeStrategy === i ? "−" : "+"}
                  </span>
                </div>
                {activeStrategy === i && (
                  <div>
                    <p
                      style={{
                        color: "#777", fontSize: 14, lineHeight: 1.7,
                        fontWeight: 300, marginBottom: 14,
                      }}
                    >
                      {s.description}
                    </p>
                    <div
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        background: "rgba(255,145,36,0.07)",
                        border: "1px solid rgba(255,145,36,0.18)",
                        padding: "6px 14px", borderRadius: "100px",
                      }}
                    >
                      <span style={{ color: "var(--orange)", fontSize: 10 }}>▲</span>
                      <span
                        style={{
                          fontSize: 10, color: "var(--orange)",
                          letterSpacing: 1, fontWeight: 600,
                        }}
                      >
                        {s.kpi}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAMPAIGNS */}
      {/* <section
        className="campaign-section"
        style={{
          padding: "80px 48px",
          background: "var(--black-mid)",
          borderTop: "1px solid #181818", borderBottom: "1px solid #181818",
        }}
      >
        <div className="section-label">Active Campaigns</div>
        <h2
          style={{
            fontSize: "clamp(38px, 5vw, 60px)", fontWeight: 800,
            letterSpacing: "-1px", marginBottom: 40,
          }}
        >
          2026 Campaign Calendar
        </h2>

        <div className="campaign-table" style={{ border: "1px solid #1e1e1e", borderRadius: 8, overflow: "hidden" }}>
          <div
            className="campaign-row"
            style={{ borderBottom: "1px solid #222", background: "rgba(255,145,36,0.03)" }}
          >
            {["Campaign", "Quarter", "Status", "Description", "Reach"].map((h) => (
              <span
                key={h}
                style={{ fontSize: 9, color: "#383838", letterSpacing: 3, fontWeight: 700, textTransform: "uppercase" }}
              >
                {h}
              </span>
            ))}
          </div>
          {campaigns.map((c, i) => (
            <div key={i} className="campaign-row">
              <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{c.title}</span>
              <span style={{ fontSize: 11, color: "#484848", fontWeight: 500 }}>{c.quarter}</span>
              <span className={`status-badge status-${c.status.toLowerCase()}`}>{c.status}</span>
              <span style={{ fontSize: 13, color: "#555", fontWeight: 300 }}>{c.desc}</span>
              <span
                style={{
                  fontSize: 20, fontWeight: 800,
                  color: c.status === "LIVE" ? "var(--orange)" : c.status === "ACTIVE" ? "#ff9124" : "#2a2a2a",
                }}
              >
                {c.reach}
              </span>
            </div>
          ))}
        </div>
      </section> */}

      {/* CTA BANNER */}
      <section
        className="cta-banner"
        style={{
          margin: "0 48px 80px",
          background: "linear-gradient(135deg, #FF9124 0%, #FF7A00 100%)",
          padding: "64px 64px",
          display: "flex", justifyContent: "space-between",
          alignItems: "center", borderRadius: 12,
          flexWrap: "wrap", gap: 28,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10, color: "rgba(0,0,0,0.5)",
              letterSpacing: 3, marginBottom: 10, fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Ready to Collaborate?
          </div>
          <h3
            style={{
              fontSize: "clamp(32px, 4.5vw, 58px)",
              fontWeight: 800, color: "#000",
              lineHeight: 0.95, letterSpacing: "-1px",
            }}
          >
            Let's Build Something
            <br />
            The World Can Hear
          </h3>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <button
            type="button"
            onClick={() => {
              try {
                const subject = encodeURIComponent("Let's Build Something — Project Inquiry");
                const body = encodeURIComponent('Name:%0AEmail:%0AProject%20Type:%20%0A%0ADetails:%0A');
                const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=support@prabhmusik.com&su=${subject}&body=${body}`;
                const win = window.open(gmail, '_blank');
                if (!win) {
                  // popup blocked — fallback to mailto
                  window.location.href = `mailto:support@prabhmusik.com?subject=${subject}&body=${body}`;
                }
              } catch (e) {
                const subject = encodeURIComponent("Let's Build Something — Project Inquiry");
                const body = encodeURIComponent('Name:%0AEmail:%0AProject%20Type:%20%0A%0ADetails:%0A');
                window.location.href = `mailto:support@prabhmusik.com?subject=${subject}&body=${body}`;
              }
            }}
            style={{
              background: "#000", color: "var(--orange)",
              border: "none", padding: "16px 40px",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 13, fontWeight: 700,
              letterSpacing: 2, textTransform: "uppercase",
              cursor: "pointer", borderRadius: 6,
            }}
          >
            Get In Touch
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                const subject = encodeURIComponent('Request: Download Deck');
                const body = encodeURIComponent('Name:%0AEmail:%0AProject%20Type:%20%0A%0AI%20would%20like%20to%20receive%20the%20marketing%20deck.%0A%0ADetails:%0A');
                const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=support@prabhmusik.com&su=${subject}&body=${body}`;
                const win = window.open(gmail, '_blank');
                if (!win) window.location.href = `mailto:support@prabhmusik.com?subject=${subject}&body=${body}`;
              } catch (e) {
                const subject = encodeURIComponent('Request: Download Deck');
                const body = encodeURIComponent('Name:%0AEmail:%0AProject%20Type:%20%0A%0AI%20would%20like%20to%20receive%20the%20marketing%20deck.%0A%0ADetails:%0A');
                window.location.href = `mailto:support@prabhmusik.com?subject=${subject}&body=${body}`;
              }
            }}
            style={{
              background: "transparent", color: "#000",
              border: "2px solid rgba(0,0,0,0.25)", padding: "14px 40px",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 13, fontWeight: 700,
              letterSpacing: 2, textTransform: "uppercase",
              cursor: "pointer", borderRadius: 6,
            }}
          >
            Download Deck
          </button>
        </div>
      </section>
    </div>
  );
}