'use client';
import React from "react";
import { usePathname } from "next/navigation";

const socialLinks = [
  {
    label: "X / Twitter",
    href: "#",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4l16 16M4 20L20 4" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    label: "GitHub",
    href: "#",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </svg>
    ),
  },
];

const navColumns = [
  {
    label: "Product",
    links: ["Features", "Pricing", "Integrations", "Changelog"],
  },
  {
    label: "Resources",
    links: ["Documentation", "Tutorials", "Blog", "Support"],
  },
  {
    label: "Company",
    links: ["About", "Careers", "Contact", "Partners"],
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
            Graphy empowers teams to transform raw data into clear, compelling
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
                <NavLink key={link} label={link} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <span style={{ fontSize: 12, color: "#3a3530" }}>
          © 2025 PrabhMusik. All rights reserved.
        </span>
        <div className="footer-legal-links">
          <LegalLink label="Privacy Policy" />
          <LegalLink label="Terms of Service" />
          <LegalLink label="Cookies Settings" />
        </div>
      </div>
    </footer>
  );
};

export default GraphyFooter;