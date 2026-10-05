'use client';
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/config/site";

const socialLinks = [
  {
    label: "Instagram",
    href: SITE_CONFIG.socials.instagram,
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
    href: SITE_CONFIG.socials.youtube,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: SITE_CONFIG.socials.facebook,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
];

const navColumns = [
  {
    label: "Explore",
    links: [
      { label: "Beat Marketplace", href: "/beat" },
      { label: "Music Production", href: "/services/music-production" },
      { label: "Mix & Master", href: "/services/mix-n-master" },
      { label: "Lyrics Writing", href: "/services/lyrics" },
    ],
  },
  {
    label: "Services",
    links: [
      { label: "Marketing & Distribution", href: "/services/marketing-distribution" },
      { label: "Custom Beat Production", href: "/services" },
      { label: "About Prabh Musik", href: "/about" },
    ],
  },
];

const SocialButton: React.FC<{ label: string; href: string; icon: React.ReactNode }> = ({
  label,
  href,
  icon,
}) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 32,
        height: 32,
        border: `1px solid ${hovered ? "#fbbf24" : "rgba(255,255,255,0.15)"}`,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: hovered ? "#fbbf24" : "rgba(255,255,255,0.7)",
        textDecoration: "none",
        transition: "border-color 0.15s, color 0.15s",
        flexShrink: 0,
      }}
    >
      {icon}
    </a>
  );
};

const NavLink: React.FC<{ label: string; href: string }> = ({ label, href }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <li>
      <Link
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          fontSize: 13,
          color: hovered ? "#fbbf24" : "rgba(255,255,255,0.65)",
          textDecoration: "none",
          transition: "color 0.15s",
        }}
      >
        {label}
      </Link>
    </li>
  );
};

const LegalLink: React.FC<{ label: string; href: string }> = ({ label, href }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: 12,
        color: hovered ? "#fbbf24" : "rgba(255,255,255,0.45)",
        textDecoration: "none",
        transition: "color 0.15s",
      }}
    >
      {label}
    </Link>
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
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#f5f0e8",
                letterSpacing: "-0.02em",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {SITE_CONFIG.name}
            </span>
          </div>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.55)",
              maxWidth: 240,
              margin: "0 0 16px 0",
            }}
          >
            Premium studio-grade beats, custom music production, and mixing & mastering crafted for independent artists and record labels.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 18 }}>
            <span>📍 {SITE_CONFIG.contact.address.display}</span>
            <span>📞 Call: <a href={SITE_CONFIG.contact.phoneTel} style={{ color: "#fbbf24", textDecoration: "none" }}>{SITE_CONFIG.contact.phoneDisplay}</a></span>
            <span>💬 WhatsApp: <a href={SITE_CONFIG.contact.whatsappLink} target="_blank" rel="noopener noreferrer" style={{ color: "#25D366", textDecoration: "none", fontWeight: 600 }}>{SITE_CONFIG.contact.whatsappDisplay}</a></span>
            <span>✉️ Email: <a href={SITE_CONFIG.contact.emailMailto} style={{ color: "#fbbf24", textDecoration: "none" }}>{SITE_CONFIG.contact.email}</a></span>
          </div>
          <div className="footer-social" style={{ display: "flex", gap: 10 }}>
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
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#fbbf24",
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
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          © {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.
        </span>
        <div className="footer-legal-links" style={{ display: "flex", gap: 18 }}>
          <LegalLink label="Privacy Policy" href="/privacy" />
          <LegalLink label="Terms & Conditions" href="/terms" />
          <LegalLink label="Beat License Agreement" href="/beat-license" />
        </div>
      </div>
    </footer>
  );
};

export default GraphyFooter;