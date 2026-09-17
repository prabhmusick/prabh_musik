'use client';
import React from "react";
import { usePathname } from "next/navigation";

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/prabhmusik",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@prabhmusik07",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="12" rx="3" />
        <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/919461209922",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15.5c-.5 1.4-2.1 2.5-3.7 2.8-1.1.2-2.2.1-3.2-.2C12.2 17.4 9.6 16 8.1 13.8c-1.4-2.2-1.6-5-.5-7.3.3-1 .9-2 1.8-2.7C10.1 2.6 11.6 2 13.2 2c.5 0 1 .1 1.5.3 1.4.6 2.4 1.8 2.8 3.3.3 1.1.2 2.2-.2 3.2-.2.7-.6 1.3-1.1 1.8l-.7.7c-.4.4-.7.9-.7 1.5s.2 1.1.5 1.6c.4.8 1.1 1.5 1.9 2.1.6.5 1.2.8 1.9 1.1.7.3 1.5.4 2.3.3.7-.1 1.4-.4 1.9-.9.5-.5.8-1.2.9-1.9.1-.8 0-1.6-.3-2.3z" />
        <path d="M15.5 13.5c-.5-.2-.9-.3-1.3-.5-.2-.1-.4-.1-.6.1-.2.2-.7.8-.9 1-.2.2-.4.3-.7.1-.9-.5-1.8-1.1-2.6-1.9-.8-.8-1.4-1.7-1.9-2.6-.2-.3-.1-.5.1-.7.1-.1.2-.3.3-.4.1-.1.1-.3 0-.4-.1-.2-.5-1.3-.7-1.8-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.4-.9 1-.9 2.4 0 1.4.9 2.8 1.1 3 .2.3 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.7.1.5-.1 1.5-.6 1.7-1.3.2-.7.2-1.2.1-1.3-.1-.1-.2-.2-.4-.3z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

const navColumns = [
  {
    label: "Product",
    links: [
      { label: "Features", href: "/beat" },
      { label: "Pricing", href: "/services" },
    ],
  },
  {
    label: "Resources",
    links: [
      { label: "Documentation", href: "/services" },
      { label: "Tutorials", href: "/beat" },
      { label: "Support", href: "/services" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Beats", href: "/beat" },
      { label: "Contact", href: "/services" },
    ],
  },
];

const LogoIcon: React.FC = () => (
  <div
    style={{
      width: 28,
      height: 28,
      background: "#c8a96e",
      borderRadius: 6,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" fill="#0a0a0a" rx="1" />
      <rect x="9" y="2" width="5" height="5" fill="#0a0a0a" rx="1" />
      <rect x="2" y="9" width="5" height="5" fill="#0a0a0a" rx="1" />
      <rect x="9" y="9" width="5" height="5" fill="#0a0a0a" rx="1" />
    </svg>
  </div>
);

const SocialButton: React.FC<{ label: string; href: string; icon: React.ReactNode }> = ({
  label,
  href,
  icon,
}) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <a
      href={href}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 30,
        height: 30,
        border: `0.5px solid ${hovered ? "#c8a96e" : "#2e2e2e"}`,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: hovered ? "#c8a96e" : "#6a6050",
        textDecoration: "none",
        transition: "border-color 0.15s, color 0.15s",
        flexShrink: 0,
      }}
    >
      {icon}
    </a>
  );
};

const NavLink: React.FC<{ label: string; href?: string }> = ({ label, href = "#" }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <li>
      <a
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          fontSize: 13,
          color: hovered ? "#e8e0d0" : "#6a6050",
          textDecoration: "none",
          transition: "color 0.15s",
        }}
      >
        {label}
      </a>
    </li>
  );
};

const LegalLink: React.FC<{ label: string; href?: string }> = ({ label, href = "#" }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: 12,
        color: hovered ? "#7a7060" : "#3a3530",
        textDecoration: "none",
        transition: "color 0.15s",
      }}
    >
      {label}
    </a>
  );
};

const GraphyFooter: React.FC = () => {
  const pathname = usePathname();
  if (pathname === "/signup" || pathname?.startsWith("/admin")) return null;

  return (
    <footer className="footer">
      {/* Top grid */}
      <div className="footer-grid">
        {/* Brand column */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <LogoIcon />
            <span
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: "#f5f0e8",
                letterSpacing: "-0.02em",
              }}
            >
              PrabhMusik
            </span>
          </div>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.65,
              color: "#7a7060",
              marginBottom: 20,
              maxWidth: 220,
              margin: "0 0 20px 0",
            }}
          >
            PrabhMusik empowers teams to transform raw data into clear, compelling
            visuals — making insights easier to share, understand, and act on.
          </p>
          <div className="footer-social">
            {socialLinks.map((s) => (
              <SocialButton key={s.label} {...s} />
            ))}
          </div>
        </div>

        {/* Nav columns */}
        {navColumns.map((col) => (
          <div key={col.label}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#c8a96e",
                marginBottom: 16,
                margin: "0 0 16px 0",
              }}
            >
              {col.label}
            </p>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {col.links.map((link) => (
                <NavLink key={link.label} label={link.label} href={link.href} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <span style={{ fontSize: 12, color: "#3a3530" }}>
          © 2026 PrabhMusik. All rights reserved.
        </span>
        
      </div>
    </footer>
  );
};

export default GraphyFooter;