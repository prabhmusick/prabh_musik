"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppShell } from "./contexts/app-shell-context";

const navLinks = ["Home", "About", "Services", "Beats"];


export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, cart, cartOpen, openCart, closeCart, logout } = useAppShell();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  const getActiveLink = () => {
    if (pathname === "/") return "Home";
    if (pathname === "/about") return "About";
    if (pathname === "/services") return "Services";
    if (pathname === "/beat") return "Beats";
    return "";
  };
  const activeLink = getActiveLink();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jacques+Francois&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .header-wrapper {
          position: relative;
          z-index: 100;
          width: 100%;
          max-width: 1240px;
          margin: 16px auto;
          background: radial-gradient(
            circle at 85% 0%,
            rgba(245, 158, 11, 0.07),
            transparent 35%
          ),
          rgba(14, 16, 22, 0.78);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35), 0 0 30px rgba(245, 158, 11, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .header-wrapper::after {
          content: "";
          position: absolute;
          bottom: -1px;
          left: 10%;
          width: 80%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(245, 158, 11, 0.35),
            transparent
          );
          pointer-events: none;
        }

        .nav-link {
          position: relative;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.72);
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px 4px;
          transition: color 0.25s ease, transform 0.25s ease, text-shadow 0.25s ease;
          text-decoration: none;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          width: 0;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            transparent,
            #f59e0b,
            #ffb84d,
            transparent
          );
          transform: translateX(-50%);
          transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
          opacity: 0;
        }
        .nav-link:hover {
          color: #ffffff;
          transform: translateY(-1px);
          text-shadow: 0 0 12px rgba(245, 158, 11, 0.25);
        }
        .nav-link:hover::after {
          width: 50%;
          opacity: 0.7;
        }
        .nav-link.active {
          color: #ffffff;
          font-weight: 600;
        }
        .nav-link.active::after {
          width: 70%;
          opacity: 1;
        }

        .search-container {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          padding: 6px 14px;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
          transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .search-container:hover, .search-container.focused {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(245, 158, 11, 0.45);
          box-shadow: 0 0 14px rgba(245, 158, 11, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .search-icon {
          transition: fill 0.25s ease;
        }
        .search-container.focused .search-icon, .search-container:hover .search-icon {
          fill: #f59e0b;
        }

        .search-input {
          background: transparent;
          border: none;
          outline: none;
          color: rgba(255, 255, 255, 0.9);
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          width: 110px;
          transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          caret-color: #f59e0b;
        }
        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.42);
        }
        .search-input:focus {
          width: 150px;
        }

        .cart-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 14px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.25s ease, border-color 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
        }
        .cart-btn:hover {
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(245, 158, 11, 0.35);
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        }
        .cart-badge {
          background: rgba(245, 158, 11, 0.18);
          color: #ffb84d;
          border: 1px solid rgba(245, 158, 11, 0.35);
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 999px;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
        }

        .login-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.88);
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          padding: 7px 16px;
          border-radius: 8px;
          transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
        }
        .login-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(245, 158, 11, 0.35);
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .signup-btn {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border: 1px solid rgba(251, 191, 36, 0.4);
          color: #050507;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.2px;
          cursor: pointer;
          padding: 7.5px 20px;
          border-radius: 8px;
          transition: background 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.15);
        }
        .signup-btn:hover {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          transform: translateY(-1.5px);
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.28), 0 2px 6px rgba(0, 0, 0, 0.4);
        }

        .profile-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 14px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.25s ease, border-color 0.25s ease, transform 0.2s ease;
        }
        .profile-btn:hover {
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(245, 158, 11, 0.35);
          transform: translateY(-1px);
        }

        .logo-text-accent {
          font-family: 'Irish Grover', cursive;
          font-size: 21px;
          font-weight: 400;
          background: linear-gradient(135deg, #f59e0b 0%, #ffb84d 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: 0.3px;
          filter: drop-shadow(0 0 12px rgba(245, 158, 11, 0.25));
        }
        .logo-text-white {
          font-family: 'Irish Grover', cursive;
          font-size: 21px;
          font-weight: 400;
          color: #ffffff;
          letter-spacing: 0.3px;
        }

        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .header-wrapper { margin: 12px 12px 16px; width: calc(100% - 24px); }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
          .mobile-nav { display: none !important; }
        }
      `}</style>

      <header className="header-wrapper">
        <div
          style={{
            padding: "12px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "28px",
          }}
        >
          {/* ── Logo ── */}
          <div
            onClick={() => router.push("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            <span className="logo-text-accent">
              Prahbh
            </span>
            <span className="logo-text-white">
              Musik
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
            <div className={`search-container${searchFocused ? " focused" : ""}`}>
              {/* Search icon */}
              <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.45)">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input
                className="search-input"
                type="text"
                placeholder="Search beats, artists..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>

            {/* Cart Button */}
            <button
              className="cart-btn"
              onClick={() => { if (isAuthenticated) { openCart(); } else { router.push("/login"); } }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h2l.4 2M7 13h10l3-8H6.4" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></svg>
              <span>Cart</span>
              <span className="cart-badge">{cart.length}</span>
            </button>

            {/* Profile / Auth actions */}
            {isAuthenticated ? (
              <button
                className="profile-btn"
                onClick={() => router.push("/profile")}
              >
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.4), rgba(217, 119, 6, 0.2))", border: "1px solid rgba(245, 158, 11, 0.4)", color: "#ffb84d", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                  {user?.fullName?.charAt(0) || "P"}
                </span>
                Profile
              </button>
            ) : (
              <>
                {pathname === "/login" && (
                  <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif", fontSize: "13px", marginRight: "4px" }}>
                    Need an account?
                  </span>
                )}
                {pathname !== "/login" && (
                  <button
                    className="login-btn"
                    onClick={() => router.push("/login")}
                    style={{
                      marginRight: pathname === "/signup" ? "8px" : "0"
                    }}
                  >
                    Log in
                  </button>
                )}

                {pathname === "/signup" && (
                  <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif", fontSize: "13px", marginRight: "4px" }}>
                    Already a member?
                  </span>
                )}
                {pathname !== "/signup" && (
                  <button
                    className="signup-btn"
                    onClick={() => router.push("/signup")}
                  >
                    Sign up
                  </button>
                )}
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

        {/* ── Mobile dropdown ── */}
        {mobileOpen && (
          <div
            className="mobile-nav"
            style={{
              background: "rgba(14, 16, 22, 0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              borderBottomLeftRadius: "18px",
              borderBottomRightRadius: "18px",
              padding: "20px 24px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {navLinks.map((link) => (
              <button
                key={link}
                onClick={() => {
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
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              {isAuthenticated ? (
                <>
                  <button
                    className="profile-btn"
                    onClick={() => {
                      router.push("/profile");
                      setMobileOpen(false);
                    }}
                  >
                    Profile
                  </button>
                  <button
                    className="login-btn"
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                      router.push("/");
                    }}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="login-btn"
                    onClick={() => {
                      router.push("/login");
                      setMobileOpen(false);
                    }}
                  >
                    Log in
                  </button>
                  <button
                    className="signup-btn"
                    onClick={() => {
                      router.push("/signup");
                      setMobileOpen(false);
                    }}
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}