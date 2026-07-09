"use client";

import Link from "next/link";
import { useAppShell } from "../contexts/app-shell-context";

const INK = "#0b0d12";
const PANEL = "rgba(255,255,255,0.03)";
const BORDER = "rgba(255,255,255,0.08)";
const AMBER = "#d4820a";
const GOLD = "#fbbf24";
const TEXT = "#f5f3ef";
const MUTED = "rgba(245,243,239,0.55)";

const displayFont =
  '"Neue Haas Grotesk Display","Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
const monoFont =
  '"JetBrains Mono","SF Mono",ui-monospace,Menlo,Consolas,monospace';

export default function ProfilePage() {
  const { user, isAuthenticated, logout, purchasedBeats, wishlist, cart } =
    useAppShell();

  if (!isAuthenticated || !user) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: INK,
        }}
      >
        <style>{`
          .pp-btn { transition: transform .15s ease, background .15s ease, border-color .15s ease; }
          .pp-btn:hover { transform: translateY(-1px); }
          .pp-btn:focus-visible { outline: 2px solid ${AMBER}; outline-offset: 2px; }
        `}</style>
        <div
          style={{
            maxWidth: 440,
            width: "100%",
            background: "linear-gradient(180deg, rgba(212,130,10,0.06), transparent 60%), #12141a",
            border: `1px solid ${BORDER}`,
            borderRadius: 4,
            padding: "40px 32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 3,
              background: AMBER,
              margin: "0 auto 20px",
              borderRadius: 2,
            }}
          />
          <h2
            style={{
              color: TEXT,
              fontFamily: displayFont,
              fontSize: 26,
              letterSpacing: "-0.02em",
              margin: "0 0 8px",
            }}
          >
            Sign in to your crate
          </h2>
          <p style={{ color: MUTED, margin: "0 0 26px", lineHeight: 1.5 }}>
            Your purchased beats, saved tracks, and cart live here once you're
            signed in.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <Link
              href="/login"
              className="pp-btn"
              style={{
                background: AMBER,
                color: "#0b0d12",
                textDecoration: "none",
                padding: "11px 20px",
                borderRadius: 3,
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.01em",
              }}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="pp-btn"
              style={{
                background: "transparent",
                color: TEXT,
                textDecoration: "none",
                border: `1px solid ${BORDER}`,
                padding: "11px 20px",
                borderRadius: 3,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const counts = {
    purchased: purchasedBeats.length,
    wishlist: wishlist.length,
    cart: cart.length,
  };
  const maxCount = Math.max(counts.purchased, counts.wishlist, counts.cart, 1);

  const bars = [
    { label: "Purchased", value: counts.purchased, color: GOLD },
    { label: "Wishlist", value: counts.wishlist, color: AMBER },
    { label: "Cart", value: counts.cart, color: "#e0651f" },
  ];

  return (
    <div
      style={{
        minHeight: "70vh",
        padding: "32px 20px 56px",
        background: `linear-gradient(180deg, ${INK} 0%, #12141a 100%)`,
      }}
    >
      <style>{`
        .pp-btn { transition: transform .15s ease, background .15s ease, border-color .15s ease; }
        .pp-btn:hover { transform: translateY(-1px); }
        .pp-btn:focus-visible { outline: 2px solid ${AMBER}; outline-offset: 2px; }
        .pp-row { transition: background .12s ease, padding-left .12s ease; border-radius: 3px; }
        .pp-row:hover { background: rgba(255,255,255,0.035); padding-left: 6px; }
        .pp-cta { transition: background .15s ease, transform .15s ease; }
        .pp-cta:hover { transform: translateY(-1px); }
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 }}>
        {/* Header */}
        <section
          style={{
            background: PANEL,
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            padding: "28px 28px 24px",
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <img
                src={
                  user.avatar ||
                  "https://api.dicebear.com/7.x/thumbs/svg?seed=producer"
                }
                alt={user.fullName}
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `2px solid ${AMBER}`,
                  padding: 2,
                }}
              />
            </div>
            <div>
              <h1
                style={{
                  color: TEXT,
                  fontFamily: displayFont,
                  fontSize: 28,
                  letterSpacing: "-0.02em",
                  margin: 0,
                }}
              >
                {user.fullName}
              </h1>
              <p
                style={{
                  color: AMBER,
                  fontFamily: monoFont,
                  fontSize: 13,
                  margin: "6px 0 0",
                }}
              >
                @{user.username}
              </p>
              <p style={{ color: MUTED, fontSize: 13, margin: "3px 0 0" }}>
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="pp-btn"
            style={{
              background: "transparent",
              border: `1px solid ${BORDER}`,
              color: TEXT,
              borderRadius: 999,
              padding: "10px 18px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              height: "fit-content",
              alignSelf: "center",
            }}
          >
            Log out
          </button>
        </section>

        {/* Equalizer stat strip */}
        <section
          style={{
            background: PANEL,
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            padding: "18px 28px",
            display: "flex",
            alignItems: "flex-end",
            gap: 28,
          }}
        >
          {bars.map((bar) => (
            <div
              key={bar.label}
              style={{ display: "flex", alignItems: "flex-end", gap: 10, flex: 1 }}
            >
              <div
                style={{
                  width: 6,
                  height: 8 + (bar.value / maxCount) * 34,
                  background: bar.color,
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              />
              <div>
                <div
                  style={{
                    color: TEXT,
                    fontFamily: monoFont,
                    fontSize: 20,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {bar.value}
                </div>
                <div
                  style={{
                    color: MUTED,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginTop: 4,
                  }}
                >
                  {bar.label}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Crates */}
        <section
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          }}
        >
          <Crate title="Purchased beats" items={purchasedBeats} empty="No purchases yet." ctaHref="/browse" ctaLabel="Browse beats" />
          <Crate title="Wishlist" items={wishlist} empty="No saved beats." ctaHref="/browse" ctaLabel="Discover beats" />
        </section>

        {/* Cart */}
        <section
          style={{
            background: PANEL,
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            padding: "22px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h3
              style={{
                color: TEXT,
                fontFamily: displayFont,
                fontSize: 17,
                margin: "0 0 4px",
              }}
            >
              Cart summary
            </h3>
            <p style={{ color: MUTED, margin: 0, fontSize: 14 }}>
              {cart.length === 0
                ? "Your cart is empty."
                : `${cart.length} beat${cart.length === 1 ? "" : "s"} ready for checkout.`}
            </p>
          </div>
          {cart.length > 0 && (
            <Link
              href="/checkout"
              className="pp-cta"
              style={{
                background: AMBER,
                color: "#0b0d12",
                textDecoration: "none",
                padding: "11px 22px",
                borderRadius: 3,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Go to checkout
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}

function Crate({ title, items, empty, ctaHref, ctaLabel }) {
  return (
    <div
      style={{
        background: PANEL,
        border: `1px solid ${BORDER}`,
        borderRadius: 6,
        padding: "22px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <h3
          style={{
            color: TEXT,
            fontFamily: displayFont,
            fontSize: 17,
            margin: 0,
          }}
        >
          {title}
        </h3>
        <span
          style={{
            color: MUTED,
            fontFamily: monoFont,
            fontSize: 12,
          }}
        >
          {String(items.length).padStart(2, "0")}
        </span>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            border: `1px dashed ${BORDER}`,
            borderRadius: 4,
            padding: "22px 16px",
            textAlign: "center",
          }}
        >
          <p style={{ color: MUTED, margin: "0 0 12px", fontSize: 14 }}>{empty}</p>
          <Link
            href={ctaHref}
            className="pp-btn"
            style={{
              color: AMBER,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              border: `1px solid rgba(212,130,10,0.4)`,
              borderRadius: 3,
              padding: "8px 14px",
            }}
          >
            {ctaLabel} →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map((beat, i) => (
            <div
              key={beat.id}
              className="pp-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 4px",
              }}
            >
              <span
                style={{
                  color: MUTED,
                  fontFamily: monoFont,
                  fontSize: 12,
                  width: 20,
                  flexShrink: 0,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                style={{
                  color: TEXT,
                  fontSize: 14,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {beat.title}
              </span>
              <span
                style={{
                  color: GOLD,
                  fontFamily: monoFont,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {beat.price ? `₹${beat.price.toLocaleString("en-IN")}` : "Free"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}