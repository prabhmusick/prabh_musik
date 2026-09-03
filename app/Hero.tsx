"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Load Google Fonts: Jacques Francois + Inter
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Jacques+Francois&family=Inter:wght@400;500&display=swap";
    document.head.appendChild(link);
    link.onload = () => setFontsLoaded(true);
  }, []);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @media (max-width: 900px) {
          .hero-section {
            min-height: auto !important;
            align-items: flex-start !important;
            padding-top: 60px !important;
            padding-bottom: 60px !important;
          }

          .hero-copy {
            max-width: 100% !important;
            padding-left: 4% !important;
            padding-right: 4% !important;
          }

          .hero-image-container {
            position: absolute !important;
            width: 100% !important;
            height: 40vh !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            overflow: hidden !important;
          }

          .hero-image-container img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }

          .hero-section h1 {
            font-size: 3.4rem !important;
            line-height: 1.05 !important;
          }

          .hero-section p {
            font-size: clamp(0.95rem, 2.5vw, 1rem) !important;
          }

          .hero-section button {
            width: fit-content !important;
          }
        }
      `}</style>

      <section
        className="hero-section"
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100vh",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {/* ── Amber radial glow (right side) ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 65% 90% at 82% 55%, #c8860a55 0%, #a0600822 40%, transparent 70%)",
            zIndex: 1,
            animation: "fadeIn 1.2s ease both",
          }}
        />

        {/* ── Left vignette so text stays legible ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, #0a0a0af2 0%, #0a0a0aaa 38%, transparent 68%)",
            zIndex: 2,
          }}
        />

        {/* ══════════════════════════════════════════
            ARTIST + KEYBOARD IMAGE (right side)
        ══════════════════════════════════════════ */}
        <div
          className="hero-image-container"
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: "58%",
            height: "100%",
            zIndex: 1,
            overflow: "hidden",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
          }}
        >
          <img
            src="/hero.png"
            alt="Artist with Keyboard"
            style={{
              width: "90%",
              height: "auto",
              maxHeight: "95%",
              objectFit: "contain",
              filter: "drop-shadow(0 8px 44px #c8780a55)",
              userSelect: "none",
            }}
	  />
        </div>

        {/* ══════════════════════════
            LEFT CONTENT
        ══════════════════════════ */}
        <div
          className="hero-copy"
          style={{
            position: "relative",
            zIndex: 10,
            paddingLeft: "5%",
            paddingRight: "4%",
            maxWidth: "660px",
          }}
        >

          {/* ── H1 ── */}
          <h1
            style={{
              fontFamily: fontsLoaded ? "'Jacques Francois', serif" : "Georgia, 'Times New Roman', serif",
              fontSize: "5.8rem",
              fontWeight: 400,
              color: "#fff",
              lineHeight: 0.9,
              marginBottom: "18px",
              animation: "fadeUp 0.7s ease both",
              animationDelay: "0.1s",
              letterSpacing: "0.01em",
            }}
          >
            Industry<br />Ready beats for<br />Artist!
          </h1>

          {/* ── Subhead ── */}
          <p
            style={{
              fontFamily: fontsLoaded ? "'Inter', sans-serif" : "sans-serif",
              fontSize: "1.35rem",
              fontWeight: 500,
              fontStyle: "italic",
              color: "#fff",
              marginBottom: "12px",
              animation: "fadeUp 0.7s ease both",
              animationDelay: "0.25s",
            }}
          >
            ~who wants to stand out
          </p>

          {/* ── Body ── */}
          <p
            style={{
              fontFamily: fontsLoaded ? "'Inter', sans-serif" : "sans-serif",
              fontSize: "1rem",
              fontWeight: 400,
              color: "#b9b9b9",
              marginBottom: "28px",
              maxWidth: 480,
              animation: "fadeUp 0.7s ease both",
              animationDelay: "0.4s",
            }}
          >
            Premium Trap, Drill, Punjabi, Emotional and commercial beats crafted for independent artists and labels
          </p>

          {/* ── CTA Button ── */}
          <button
            onClick={() => router.push("/beat")}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              padding: "12px 28px",
              borderRadius: "7px",
              border: "none",
              background: hovered ? "#e8920a" : "#ffc043",
              color: "#222",
              fontSize: "1.1rem",
              fontWeight: 700,
              fontFamily: fontsLoaded ? "'Inter', sans-serif" : "sans-serif",
              letterSpacing: "0.01em",
              cursor: "pointer",
              marginTop: 8,
              boxShadow: hovered ? "0 6px 18px #d4820a55" : "0 2px 8px #d4820a33",
              transition: "background 0.2s, box-shadow 0.2s, transform 0.2s",
              animation: "fadeUp 0.7s ease both",
              animationDelay: "0.55s",
              transform: hovered ? "translateY(-1px)" : "none",
            }}
          >
            Browse Beats
          </button>
        </div>
      </section>
    </>
  );
}