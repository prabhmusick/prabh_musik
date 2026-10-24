import type { Metadata } from "next";
import Link from "next/link";
import { CANONICAL_DOMAIN } from "@/lib/seo/schemas";

// ─── SEO Metadata ───────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Forgot Password | Prabh Musik",
  description:
    "Self-service password recovery assistance and official support channel for your Prabh Musik account.",
  alternates: {
    canonical: `${CANONICAL_DOMAIN}/forgot-password`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

// ─── Feature highlights for the left panel ──────────────────────────────────
const RECOVERY_GUIDELINES = [
  {
    icon: (
      <svg
        className="h-5 w-5 text-[#f59e0b] group-hover:text-black transition-colors duration-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    title: "Account Security",
    desc: "Manual verification ensures your purchased licenses and beats remain secure.",
  },
  {
    icon: (
      <svg
        className="h-5 w-5 text-[#f59e0b] group-hover:text-black transition-colors duration-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    title: "Direct Support",
    desc: "Reach our dedicated team at support@prabhmusik.com for prompt assistance.",
  },
];

export default function ForgotPasswordPage() {
  return (
    <div className="signup-page-container selection:bg-[#f59e0b] selection:text-black">
      {/* Local Fonts & layout styling matching login and signup */}
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

        .signup-main {
          display: flex;
          flex: 1;
          flex-direction: column;
          padding-top: 24px;
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
          position: relative;
          width: 100%;
          padding: 32px 20px;
          background: radial-gradient(circle at 100% 0%, rgba(245, 158, 11, 0.03) 0%, rgba(10, 10, 15, 1) 70%);
        }

        .signup-card {
          width: 100%;
          border-radius: 20px;
          background-color: rgba(18, 18, 26, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          padding: 32px 28px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.03);
        }

        .font-jacques {
          font-family: 'Jacques Francois', serif;
        }

        .font-irish {
          font-family: 'Irish Grover', cursive;
        }

        @keyframes bounce-bar {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }

        .animate-bounce-bar {
          animation: bounce-bar ease-in-out infinite alternate;
          transform-origin: bottom;
        }
      `}</style>

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="w-full h-20 border-b border-white/[0.04] bg-[#050505]/60 backdrop-blur-md z-20">
        <nav
          className="flex items-center justify-between px-6 sm:px-10 lg:px-14 max-w-7xl mx-auto w-full h-full"
          aria-label="Navigation"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
            aria-label="Prabh Musik Home"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.3)] group-hover:scale-105 transition-transform duration-300">
              <svg
                className="h-4 w-4 text-black"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  stroke="black"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
            <span className="text-lg text-white font-irish font-normal tracking-wide">
              Prabh{" "}
              <span className="text-[#f59e0b] group-hover:text-[#ffb333] transition-colors duration-300">
                Musik
              </span>
            </span>
          </Link>

          {/* Back to Login link */}
          <p className="text-sm text-gray-400">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-bold text-white hover:text-[#f59e0b] hover:underline transition-colors duration-200"
            >
              Log in
            </Link>
          </p>
        </nav>
      </header>

      {/* ── Main two-column layout ────────────────────────────────────────── */}
      <main className="signup-main">
        {/* ── LEFT — Hero Panel ───────────────────────────────────────────── */}
        <section
          aria-label="Account Recovery Guidelines"
          className="signup-left-hero"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(5, 5, 5, 1) 0%, rgba(5, 5, 5, 0.4) 50%, rgba(5, 5, 5, 0) 100%),
              linear-gradient(to top, rgba(5, 5, 5, 1) 0%, rgba(5, 5, 5, 0) 50%, rgba(5, 5, 5, 0.3) 100%),
              url('/studio_bg.webp')
            `,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Subtle Ambient Top Glow */}
          <div className="absolute top-0 left-1/4 right-1/4 h-64 bg-gradient-to-b from-[#f59e0b]/10 to-transparent blur-3xl pointer-events-none" />

          {/* Header Block */}
          <div className="z-10 flex flex-col items-center text-center">
            {/* Pill */}
            <span className="mb-6 inline-flex rounded-full border border-[#f59e0b]/30 px-3.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#f59e0b] bg-[#f59e0b]/5 backdrop-blur-sm shadow-[0_0_15px_rgba(245,158,11,0.05)]">
              Account Recovery
            </span>

            {/* Headline */}
            <h1 className="mb-4 text-4xl font-normal font-jacques leading-[0.95] text-white sm:text-5xl lg:text-6xl tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
              Account{" "}
              <span className="text-[#f59e0b] drop-shadow-[0_2px_15px_rgba(245,158,11,0.15)]">
                Assistance
              </span>
            </h1>

            <p className="max-w-md text-sm leading-relaxed text-gray-300 drop-shadow-[0_1px_5px_rgba(0,0,0,0.5)] mx-auto">
              Our support team is here to assist you with restoring access to your
              Prabh Musik account and purchased assets.
            </p>
          </div>

          {/* Guidelines Container */}
          <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] z-10 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.03] max-w-xl w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {RECOVERY_GUIDELINES.map((g) => (
                <div key={g.title} className="flex items-start gap-3 group">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a1a28] border border-white/[0.05] group-hover:bg-[#f59e0b] group-hover:border-[#f59e0b] transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                    {g.icon}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-[#f59e0b] transition-colors duration-300">
                      {g.title}
                    </p>
                    <p className="text-xs leading-relaxed text-gray-400 mt-0.5">
                      {g.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decorative Waveform */}
          <div
            className="absolute bottom-6 left-8 flex items-end gap-0.5 opacity-25 hover:opacity-60 transition-opacity duration-300 pointer-events-none"
            aria-hidden="true"
          >
            {[4, 7, 5, 9, 6, 11, 8, 5, 10, 7, 4, 8, 6].map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-sm bg-[#f59e0b] animate-bounce-bar"
                style={{
                  height: `${h * 3.5}px`,
                  animationDelay: `${i * 0.08}s`,
                  animationDuration: `${1.0 + (h % 3) * 0.15}s`,
                }}
              />
            ))}
          </div>
        </section>

        {/* ── RIGHT — Form/Info Panel ─────────────────────────────────────── */}
        <section
          aria-label="Password Recovery Information"
          className="signup-right-form"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#f59e0b]/5 to-transparent blur-3xl pointer-events-none" />

          <div className="flex w-full max-w-md flex-col gap-6 mx-auto relative z-10">
            {/* Header */}
            <div className="px-2">
              <h2 className="text-3xl font-normal font-jacques leading-tight text-white sm:text-4xl tracking-tight">
                Forgot your
                <br />
                password?
              </h2>
              <p className="mt-2.5 text-sm text-gray-400">
                Follow the instructions below to regain access.
              </p>
            </div>

            {/* Informational Card */}
            <div className="signup-card flex flex-col gap-6">
              {/* Recovery Status & Instructions */}
              <div className="flex flex-col gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>

                <p className="text-sm leading-relaxed text-gray-300">
                  Self-service password recovery is currently unavailable. Please
                  contact Prabh Musik support and include the email address
                  associated with your account. Our team will help you regain
                  access.
                </p>
              </div>

              {/* Support Contact Box */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Official Support Email
                </span>
                <a
                  href="mailto:support@prabhmusik.com?subject=Password%20Reset%20Request"
                  className="text-base font-semibold text-[#f59e0b] hover:text-[#ffb333] transition-colors break-all"
                  aria-label="Send email to support@prabhmusik.com"
                >
                  support@prabhmusik.com
                </a>
                <p className="text-xs text-gray-400 mt-1">
                  Please send your message from or mention the email address you
                  used to register your account.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-2">
                <a
                  href="mailto:support@prabhmusik.com?subject=Password%20Reset%20Request"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] px-5 py-3.5 text-sm font-bold text-black shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:brightness-110 active:scale-[0.99] transition-all duration-200 cursor-pointer select-none"
                  id="contact-support-btn"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Contact Support
                </a>

                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/[0.08] hover:text-white transition-all duration-200"
                  id="back-to-login-btn"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Strip */}
      <footer className="w-full py-4 flex justify-center bg-transparent z-10 select-none">
        <div
          className="h-[8px] w-full max-w-7xl opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(233, 179, 255, 0) 0%, rgba(233, 179, 255, 0.5) 50%, rgba(233, 179, 255, 0) 100%)",
          }}
        />
      </footer>
    </div>
  );
}
