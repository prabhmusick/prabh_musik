"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppShell } from "./contexts/app-shell-context";

const navLinks = ["Home", "About", "Services", "Beats"];


export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, cart, cartOpen, openCart, closeCart, logout } = useAppShell();
  if (pathname?.startsWith("/admin")) return null;
  const [activeLink, setActiveLink] = useState("Home");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [loginHov, setLoginHov] = useState(false);
  const [signupHov, setSignupHov] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jacques+Francois&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .nav-link {
          position: relative;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: rgba(255,255,255,0.75);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 0;
          transition: color 0.2s ease;
          text-decoration: none;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1.5px;
          background: #d4820a;
          transition: width 0.25s ease;
        }
        .nav-link:hover { color: #ffffff; }
        .nav-link:hover::after { width: 100%; }
        .nav-link.active { color: #ffffff; }
        .nav-link.active::after { width: 100%; }

        .search-input {
          background: transparent;
          border: none;
          outline: none;
          color: rgba(255,255,255,0.85);
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          width: 100px;
          transition: width 0.3s ease;
          caret-color: #d4820a;
        }
        .search-input::placeholder { color: rgba(255,255,255,0.4); }
        .search-input:focus { width: 140px; }

        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
          .mobile-nav { display: none !important; }
        }
      `}</style>

      <header
        style={{
          position: "relative",
          zIndex: 100,
          width: "100%",
          maxWidth: 1240,
          margin: "16px auto 16px",
          background: "#0A0C10",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "18px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset",
        }}
      >
        <div
          style={{
            padding: "12px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "32px",
          }}
        >
          {/* ── Logo ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                fontFamily: "'Irish Grover', cursive",
                fontSize: "20px",
                fontWeight: 400,
                color: "#d4820a",
                letterSpacing: "0.3px",
              }}
            >
              Prahbh
            </span>
            <span
              style={{
                fontFamily: "'Irish Grover', cursive",
                fontSize: "20px",
                fontWeight: 400,
                color: "#ffffff",
                letterSpacing: "0.3px",
              }}
            >
              {" "}Musik
            </span>
          </div>

          {/* ── Desktop Nav ── */}
          <nav
            className="desktop-nav"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
              flex: 1,
              justifyContent: "center",
            }}
          >
            {navLinks.map((link) => (
              <button
                key={link}
                onClick={() => {
                  setActiveLink(link);
                  if (link === "About") {
                    router.push("/about");
                  } else if (link === "Home") {
                    router.push("/");
                  } else if (link === "Services") {
                    router.push("/services");
                  } else if (link === "Beats") {
                    router.push("/beat");
                  }
                }}
                className={`nav-link${activeLink === link ? " active" : ""}`}
              >
                {link}
              </button>
            ))}
          </nav>

          {/* ── Right side ── */}
          <div
            className="desktop-nav"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexShrink: 0,
            }}
          >
            {/* Search pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                background: searchFocused
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(255,255,255,0.07)",
                border: `1px solid ${searchFocused ? "rgba(212,130,10,0.5)" : "rgba(255,255,255,0.12)"}`,
                borderRadius: "20px",
                padding: "6px 14px",
                transition: "background 0.2s ease, border-color 0.2s ease",
              }}
            >
              {/* Search icon */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input
                className="search-input"
                type="text"
                placeholder="Search"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>

            <button
              onClick={() => { if (isAuthenticated) { openCart(); } else { router.push("/login"); } }}
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#ffffff",
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                padding: "7px 12px",
                borderRadius: "999px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h2l.4 2M7 13h10l3-8H6.4"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>
              Cart {cart.length}
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => router.push("/profile")}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#ffffff",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "7px 12px",
                  borderRadius: "999px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(212,130,10,0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                  {user?.fullName?.charAt(0) || "P"}
                </span>
                Profile
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push("/login")}
                  onMouseEnter={() => setLoginHov(true)}
                  onMouseLeave={() => setLoginHov(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: loginHov ? "#ffffff" : "rgba(255,255,255,0.75)",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                    padding: "6px 4px",
                    transition: "color 0.2s ease",
                  }}
                >
                  Log in
                </button>

                <button
                  onClick={() => router.push("/signup")}
                  onMouseEnter={() => setSignupHov(true)}
                  onMouseLeave={() => setSignupHov(false)}
                  style={{
                    background: signupHov ? "#e8920a" : "#d4820a",
                    border: "none",
                    color: "#000000",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: "7px 18px",
                    borderRadius: "6px",
                    transition: "background 0.2s ease, transform 0.15s ease",
                    transform: signupHov ? "translateY(-1px)" : "translateY(0)",
                    boxShadow: signupHov ? "0 4px 14px #d4820a55" : "none",
                  }}
                >
                  Sign up
                </button>
              </>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen((v) => !v)}
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              {mobileOpen ? (
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              ) : (
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              )}
            </svg>
          </button>
        </div>

        {cartOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 120, display: "flex", justifyContent: "flex-end" }} onClick={closeCart}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "min(420px, 100%)", height: "100%", background: "#0f1117", borderLeft: "1px solid rgba(255,255,255,0.1)", boxShadow: "-16px 0 45px rgba(0,0,0,0.4)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ color: "#fff", fontSize: 20, margin: 0 }}>Your cart</h3>
                <button onClick={closeCart} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: 18 }}>✕</button>
              </div>
              {cart.length === 0 ? (
                <div style={{ padding: "32px 0", color: "rgba(255,255,255,0.65)", textAlign: "center" }}>Your selected beats will appear here.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" }}>
                  {cart.map((item) => (
                    <div key={item.id} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px", display: "flex", gap: "12px", alignItems: "center" }}>
                      <img src={item.cover} alt={item.title} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#fff", fontWeight: 700 }}>{item.title}</div>
                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{item.producer}</div>
                      </div>
                      <div style={{ color: "#fbbf24", fontWeight: 700 }}>{item.price ? `₹${item.price.toLocaleString("en-IN")}` : "Free"}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#fff" }}>
                  <span>Total</span>
                  <span>₹{cart.reduce((sum, item) => sum + (item.price || 0), 0).toLocaleString("en-IN")}</span>
                </div>
                <button onClick={() => { if (cart.length) { router.push("/profile"); closeCart(); } }} style={{ background: "#d4820a", border: "none", color: "#000", fontWeight: 700, borderRadius: 10, padding: "12px 16px", cursor: "pointer" }}>Proceed to checkout</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Mobile dropdown ── */}
        {mobileOpen && (
          <div
            className="mobile-nav"
            style={{
              background: "transparent",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              padding: "16px 32px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {navLinks.map((link) => (
              <button
                key={link}
                onClick={() => {
                  setActiveLink(link);
                  setMobileOpen(false);
                  if (link === "About") {
                    router.push("/about");
                  } else if (link === "Home") {
                    router.push("/");
                  } else if (link === "Services") {
                    router.push("/services");
                  } else if (link === "Beats") {
                    router.push("/beat");
                  }
                }}
                className={`nav-link${activeLink === link ? " active" : ""}`}
                style={{ textAlign: "left", width: "fit-content" }}
              >
                {link}
              </button>
            ))}
            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    router.push("/profile");
                    setMobileOpen(false);
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#ffffff",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "7px 12px",
                    borderRadius: "999px",
                  }}
                >
                  Profile
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      router.push("/login");
                      setMobileOpen(false);
                    }}
                    style={{
                    background: "transparent", border: "none",
                    color: "rgba(255,255,255,0.75)", fontFamily: "'Inter', sans-serif",
                    fontSize: "14px", fontWeight: 500, cursor: "pointer", padding: 0,
                  }}>Log in</button>
                  <button 
                    onClick={() => {
                      router.push("/signup");
                      setMobileOpen(false);
                    }}
                    style={{
                    background: "#d4820a", border: "none", color: "#000",
                    fontFamily: "'Inter', sans-serif", fontSize: "14px",
                    fontWeight: 700, cursor: "pointer", padding: "7px 18px", borderRadius: "6px",
                  }}>Sign up</button>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}