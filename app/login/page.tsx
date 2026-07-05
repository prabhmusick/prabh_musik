import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

// ─── SEO Metadata ───────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Login | Prahbh Musik",
  description: "Log in to your Prahbh Musik account to access premium studio-grade beats, downloads, and distribution tools.",
  alternates: {
    canonical: "https://prabhmusik.com/login"
  },
  openGraph: {
    title: "Login | Prahbh Musik",
    description: "Log in to your Prahbh Musik account to access premium studio-grade beats, downloads, and distribution tools.",
    url: "https://prabhmusik.com/login",
    siteName: "Prahbh Musik",
    type: "website"
  }
};

// ─── Feature list (left panel) ────────────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg className="h-5 w-5 text-[#f59e0b] group-hover:text-black transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
    title: "Access premium beats",
    desc: "Curated library of studio-grade tracks.",
  },
  {
    icon: (
      <svg className="h-5 w-5 text-[#f59e0b] group-hover:text-black transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    title: "Instant downloads",
    desc: "No waiting. High-fidelity stems ready.",
  },
  {
    icon: (
      <svg className="h-5 w-5 text-[#f59e0b] group-hover:text-black transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Secure payments",
    desc: "Encrypted transactions for your peace.",
  },
  {
    icon: (
      <svg className="h-5 w-5 text-[#f59e0b] group-hover:text-black transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: "Artist growth tools",
    desc: "Analytics and distribution assistance.",
  },
];

// ─── Page Component ───────────────────────────────────────────────────────────
export default function LoginPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LoginAction",
    "name": "Log in to Prahbh Musik",
    "description": "Log in to your Prahbh Musik account and unlock professional-grade beats and distribution tools.",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://prabhmusik.com/login",
      "actionPlatform": [
        "http://schema.org/DesktopWebPlatform",
        "http://schema.org/MobileWebPlatform"
      ]
    }
  };

  return (
    <div className="signup-page-container selection:bg-[#f59e0b] selection:text-black">
      {/* Insert JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Local Fonts & form styling to avoid modifying globals.css */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jacques+Francois&family=Irish+Grover&family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        .signup-page-container {
          min-height: 100vh;
          background-color: #0a0a0f;
          display: flex;
          flex-direction: column;
          position: relative;
          font-family: 'Inter', sans-serif;
        }

        /* Layout */
        .signup-main {
          display: flex;
          flex: 1;
          flex-direction: column;
          padding-top: 24px; /* offset for header spacing */
        }

        @media (min-width: 1024px) {
          .signup-main {
            flex-direction: row;
            padding-top: 0;
          }
          .signup-left-hero {
            display: flex !important;
            width: 60% !important;
            flex-shrink: 0 !important;
          }
          .signup-right-form {
            width: 40% !important;
            flex-shrink: 0 !important;
            padding: 40px 48px !important;
          }
        }

        .signup-left-hero {
          display: none;
          position: relative;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 40px;
          overflow: hidden;
          padding: 32px 56px;
          width: 100%;
        }

        .signup-right-form {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: #0e0e0e;
          padding: 40px 16px;
          width: 100%;
          position: relative;
        }

        @media (min-width: 640px) {
          .signup-right-form {
            padding: 64px 32px;
          }
        }
        @media (min-width: 768px) {
          .signup-right-form {
            padding: 64px 48px;
          }
        }

        /* Card */
        .signup-card {
          width: 100%;
          max-width: 448px;
          background-color: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
        }

        @media (min-width: 640px) {
          .signup-card {
            padding: 32px;
          }
        }
        
        .font-jacques {
          font-family: 'Jacques Francois', serif !important;
        }
        
        .font-irish {
          font-family: 'Irish Grover', cursive !important;
        }

        /* Form inputs & buttons styling */
        .auth-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .auth-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: rgba(255, 255, 255, 0.5) !important;
        }

        .auth-input-wrapper {
          position: relative;
        }

        .auth-input {
          width: 100% !important;
          border-radius: 12px !important;
          background-color: rgba(255, 255, 255, 0.03) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          padding: 12px 16px !important;
          font-size: 14px !important;
          color: #ffffff !important;
          outline: none !important;
          transition: all 0.2s ease !important;
          font-family: 'Inter', sans-serif !important;
        }

        .auth-input::placeholder {
          color: rgba(255, 255, 255, 0.2) !important;
        }

        .auth-input:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }

        .auth-input:focus {
          background-color: #0f0b06 !important;
          border-color: #f59e0b !important;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2) !important;
        }

        .auth-input.error {
          border-color: rgba(239, 68, 68, 0.6) !important;
        }

        .auth-input.error:focus {
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
        }

        .auth-error-msg {
          font-size: 12px !important;
          color: #f87171 !important;
          margin-top: 4px !important;
        }

        /* Checkbox */
        .auth-checkbox {
          height: 16px !important;
          width: 16px !important;
          flex-shrink: 0 !important;
          border-radius: 4px !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          background-color: rgba(255, 255, 255, 0.03) !important;
          accent-color: #f59e0b !important;
          cursor: pointer !important;
          transition: all 0.15s ease !important;
        }

        /* Submit Button */
        .auth-submit-btn {
          display: flex !important;
          width: 100% !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          border-radius: 12px !important;
          padding: 14px 24px !important;
          font-size: 14px !important;
          font-weight: 700 !important;
          letter-spacing: 0.05em !important;
          border: none !important;
          background-color: #f59e0b !important;
          color: #000000 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 4px 20px rgba(245, 158, 11, 0.15) !important;
          font-family: 'Inter', sans-serif !important;
        }

        .auth-submit-btn:hover {
          background-color: #ffb333 !important;
          box-shadow: 0 4px 25px rgba(245, 158, 11, 0.3) !important;
          transform: translateY(-1px) !important;
        }

        .auth-submit-btn:active {
          transform: translateY(0) !important;
        }

        .auth-submit-btn:disabled {
          background-color: rgba(245, 158, 11, 0.5) !important;
          color: rgba(0, 0, 0, 0.5) !important;
          cursor: not-allowed !important;
          box-shadow: none !important;
          transform: none !important;
        }

        /* Social Buttons & Grid */
        .auth-social-grid {
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: 12px !important;
          width: 100% !important;
        }

        @media (min-width: 480px) {
          .auth-social-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        .auth-social-btn {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 10px !important;
          border-radius: 12px !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          background-color: rgba(255, 255, 255, 0.03) !important;
          padding: 11px 18px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          color: rgba(255, 255, 255, 0.8) !important;
          cursor: pointer !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          font-family: 'Inter', sans-serif !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
        }

        .auth-social-btn svg {
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .auth-social-btn:hover {
          background-color: rgba(255, 255, 255, 0.07) !important;
          border-color: rgba(255, 255, 255, 0.25) !important;
          color: #ffffff !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(255, 255, 255, 0.03) !important;
        }

        .auth-social-btn:hover svg {
          transform: scale(1.1) !important;
        }

        .auth-social-btn:active {
          transform: translateY(0) scale(0.98) !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
        }

        .auth-divider-line {
          height: 1px !important;
          flex: 1 !important;
          background-color: rgba(255, 255, 255, 0.08) !important;
        }

        /* Form row (Full Name + Username) */
        .auth-form-row {
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: 16px !important;
          width: 100% !important;
        }

        @media (min-width: 576px) {
          .auth-form-row {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>

      {/* ── Header/Nav (Absolute Overlay for Split-Screen Aesthetic) ──────── */}
      <header className="hidden lg:hidden absolute top-0 left-0 right-0 z-20 w-full h-20 bg-[#050505]/50 backdrop-blur-md border-b border-white/[0.04]">
        <nav className="flex items-center justify-between px-6 sm:px-10 lg:px-14 max-w-7xl mx-auto w-full h-full" aria-label="Main Navigation">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" aria-label="Prahbh Musik Home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.3)] group-hover:scale-105 transition-transform duration-300">
              <svg className="h-4 w-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" stroke="black" strokeWidth="2" strokeLinecap="round" fill="none"/>
              </svg>
            </span>
            <span className="text-lg text-white font-irish font-normal tracking-wide">
              Prahbh <span className="text-[#f59e0b] group-hover:text-[#ffb333] transition-colors duration-300">Musik</span>
            </span>
          </Link>

          {/* Sign Up link */}
          <p className="text-sm text-gray-400">
            Don't have an account?{" "}
            <Link href="/signup" className="font-bold text-white hover:text-[#f59e0b] hover:underline transition-colors duration-200">
              Sign up
            </Link>
          </p>
        </nav>
      </header>

      {/* ── Main two-column layout (Semantic HTML) ────────────────────────── */}
      <main className="signup-main">

        {/* ── LEFT — Hero Panel (Occupies exactly 60% width on Desktop) ────── */}
        <section
          aria-label="Features and Benefits"
          className="signup-left-hero"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(5, 5, 5, 1) 0%, rgba(5, 5, 5, 0.4) 50%, rgba(5, 5, 5, 0) 100%),
              linear-gradient(to top, rgba(5, 5, 5, 1) 0%, rgba(5, 5, 5, 0) 50%, rgba(5, 5, 5, 0.3) 100%),
              url('/studio_bg.png')
            `,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Subtle Ambient Top Glow */}
          <div className="absolute top-0 left-1/4 right-1/4 h-64 bg-gradient-to-b from-[#f59e0b]/10 to-transparent blur-3xl pointer-events-none" />

          {/* Header Block */}
          <div className="z-10 flex flex-col items-center text-center">
            {/* "WELCOME BACK" pill */}
            <span className="mb-6 inline-flex rounded-full border border-[#f59e0b]/30 px-3.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#f59e0b] bg-[#f59e0b]/5 backdrop-blur-sm shadow-[0_0_15px_rgba(245,158,11,0.05)]">
              Welcome Back
            </span>

            {/* Hero headline */}
            <h1 className="mb-4 text-4xl font-normal font-jacques leading-[0.95] text-white sm:text-5xl lg:text-6xl tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
              Login to <span className="text-[#f59e0b] drop-shadow-[0_2px_15px_rgba(245,158,11,0.15)]">Prahbh<br />Musik</span>
            </h1>

            <p className="max-w-md text-sm leading-relaxed text-gray-300 drop-shadow-[0_1px_5px_rgba(0,0,0,0.5)] mx-auto">
              Sign in to your account and access professional-grade beats, downloads, and your collaborator network.
            </p>
          </div>

          {/* Feature Container (Glassmorphic Interface Style) */}
          <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] z-10 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.03] max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-3 group">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a1a28] border border-white/[0.05] group-hover:bg-[#f59e0b] group-hover:border-[#f59e0b] transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                    {f.icon}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-[#f59e0b] transition-colors duration-300">{f.title}</p>
                    <p className="text-xs leading-relaxed text-gray-400 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Responsive Waveform Decoration */}
          <div className="absolute bottom-6 left-8 flex items-end gap-0.5 opacity-25 hover:opacity-60 transition-opacity duration-300 pointer-events-none" aria-hidden="true">
            {[4, 7, 5, 9, 6, 11, 8, 5, 10, 7, 4, 8, 6].map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-sm bg-[#f59e0b] animate-bounce-bar"
                style={{
                  height: `${h * 3.5}px`,
                  animationDelay: `${i * 0.08}s`,
                  animationDuration: `${1.0 + (h % 3) * 0.15}s`
                }}
              />
            ))}
          </div>
        </section>

        {/* ── RIGHT — Form Panel (Occupies exactly 40% width on Desktop) ────── */}
        <section
          aria-label="Account Login Form"
          className="signup-right-form"
        >
          {/* Subtle Right Ambient Top-Right Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#f59e0b]/5 to-transparent blur-3xl pointer-events-none" />

          <div className="flex w-full max-w-md flex-col gap-6 mx-auto relative z-10">
            {/* Form header */}
            <div className="px-2">
              <h2 className="text-3xl font-normal font-jacques leading-tight text-white sm:text-4xl tracking-tight">
                Log In to Your<br />Account
              </h2>
              <p className="mt-2.5 text-sm text-gray-400">
                Fill in your details to access your beats.
              </p>
            </div>

            {/* Login Form wrapped inside a styled div with proper padding & margin */}
            <div className="signup-card">
              <LoginForm />
            </div>
          </div>
        </section>

      </main>

      {/* Footer Strip */}
      <footer className="w-full py-4 flex justify-center bg-transparent z-10 select-none">
        <div 
          className="h-[8px] w-full max-w-7xl opacity-50"
          style={{
            backgroundImage: "linear-gradient(to right, rgba(233, 179, 255, 0) 0%, rgba(233, 179, 255, 0.5) 50%, rgba(233, 179, 255, 0) 100%)"
          }}
        />
      </footer>
    </div>
  );
}
