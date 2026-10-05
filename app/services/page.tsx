"use client";
import { JSX, useState } from "react";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { CANONICAL_DOMAIN, createBreadcrumbSchema } from "@/lib/seo/schemas";

const servicesWebPageSchema = {
  "@type": "WebPage",
  "@id": `${CANONICAL_DOMAIN}/services#webpage`,
  url: `${CANONICAL_DOMAIN}/services`,
  name: "Music Services | Prabh Musik",
  description:
    "End-to-end music production, mixing & mastering, lyrics writing, and marketing & distribution services by Prabh Musik.",
  isPartOf: {
    "@id": `${CANONICAL_DOMAIN}/#website`,
  },
  breadcrumb: {
    "@id": `${CANONICAL_DOMAIN}/services#breadcrumb`,
  },
};

const servicesBreadcrumbSchema = createBreadcrumbSchema(
  `${CANONICAL_DOMAIN}/services`,
  [
    { name: "Home", url: CANONICAL_DOMAIN },
    { name: "Services", url: `${CANONICAL_DOMAIN}/services` },
  ]
);

const serviceEntitiesSchema = {
  "@type": "ItemList",
  "@id": `${CANONICAL_DOMAIN}/services#itemlist`,
  name: "Prabh Musik Services",
  numberOfItems: 4,
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      item: {
        "@type": "Service",
        "@id": `${CANONICAL_DOMAIN}/services/music-production#service`,
        name: "Music Production",
        serviceType: "Music Production",
        description:
          "From beatmaking to full arrangements, we craft high-quality, industry-ready tracks that bring your sound to life.",
        url: `${CANONICAL_DOMAIN}/services/music-production`,
        provider: {
          "@id": `${CANONICAL_DOMAIN}/#organization`,
        },
      },
    },
    {
      "@type": "ListItem",
      position: 2,
      item: {
        "@type": "Service",
        "@id": `${CANONICAL_DOMAIN}/services/mix-n-master#service`,
        name: "Mix n Master",
        serviceType: "Audio Mixing & Mastering",
        description:
          "We deliver clean, balanced mixes and loud, professional masters ready for all major streaming platforms.",
        url: `${CANONICAL_DOMAIN}/services/mix-n-master`,
        provider: {
          "@id": `${CANONICAL_DOMAIN}/#organization`,
        },
      },
    },
    {
      "@type": "ListItem",
      position: 3,
      item: {
        "@type": "Service",
        "@id": `${CANONICAL_DOMAIN}/services/lyrics#service`,
        name: "Lyrics",
        serviceType: "Songwriting & Lyrics",
        description:
          "Powerful words, real emotion. We write lyrics that connect, inspire, and make your music unforgettable.",
        url: `${CANONICAL_DOMAIN}/services/lyrics`,
        provider: {
          "@id": `${CANONICAL_DOMAIN}/#organization`,
        },
      },
    },
    {
      "@type": "ListItem",
      position: 4,
      item: {
        "@type": "Service",
        "@id": `${CANONICAL_DOMAIN}/services/marketing-distribution#service`,
        name: "Marketing & Distribution",
        serviceType: "Music Marketing & Distribution",
        description:
          "We help you reach the right audience and get your music on all major platforms worldwide.",
        url: `${CANONICAL_DOMAIN}/services/marketing-distribution`,
        provider: {
          "@id": `${CANONICAL_DOMAIN}/#organization`,
        },
      },
    },
  ],
};


// ─── Types ────────────────────────────────────────────────────────────────────
interface ServiceCard {
  number: string;
  title: string;
  description: string;
  learnMore: string;
  slug: string;
  //   icon: JSX.Element;
  imagePlaceholder: string;
}

interface ProcessStep {
  icon: JSX.Element;
  label: string;
  description: string;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const WaveformIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12h2l2-8 4 16 4-10 2 4h6" />
  </svg>
);

const SlidersIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

const PenIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const GlobeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const SearchIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SparkleIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

const WandIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 4V2m0 2v2m0-2h-2m2 0h2M3 10l9 9 9-9-9-9-9 9z" />
  </svg>
);

const RocketIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

// ─── Service Card Images (photo + gradient fallback) ─────────────────────────
const serviceImageFiles = [
  "/img_1.webp",
  "/img_2.webp",
  "/img_3.webp",
  "/img_4.webp",
];

const serviceImageFallbacks = [
  // Music Production – purple/pink studio feel
  "linear-gradient(135deg, #1a0a2e 0%, #2d1060 40%, #4a1080 70%, #1a0a2e 100%)",
  // Mix n Master – dark teal board feel
  "linear-gradient(135deg, #0a1628 0%, #0d2040 40%, #1a3060 70%, #0a1628 100%)",
  // Lyrics – warm amber/brown spotlight feel
  "linear-gradient(135deg, #1a0f00 0%, #3d2200 40%, #6b3d00 70%, #1a0f00 100%)",
  // Marketing & Distribution – dark green globe feel
  "linear-gradient(135deg, #001a14 0%, #003326 50%, #004d38 70%, #001a14 100%)",
];

// ─── Data ─────────────────────────────────────────────────────────────────────
const services: ServiceCard[] = [
  {
    number: "01",
    title: "Music Production",
    description:
      "From beatmaking to full arrangements, we craft high-quality, industry-ready tracks that bring your sound to life.",
    learnMore: "Learn more",
    slug: "music-production",
    // icon: <WaveformIcon />,
    imagePlaceholder: `url('${serviceImageFiles[0]}'), ${serviceImageFallbacks[0]}`,
  },
  {
    number: "02",
    title: "Mix n Master",
    description:
      "We deliver clean, balanced mixes and loud, professional masters ready for all major streaming platforms.",
    learnMore: "Learn more",
    slug: "mix-n-master",
    // icon: <SlidersIcon />,
    imagePlaceholder: `url('${serviceImageFiles[1]}'), ${serviceImageFallbacks[1]}`,
  },
  {
    number: "03",
    title: "Lyrics",
    description:
      "Powerful words, real emotion. We write lyrics that connect, inspire, and make your music unforgettable.",
    learnMore: "Learn more",
    slug: "lyrics",
    // icon: <PenIcon />,
    imagePlaceholder: `url('${serviceImageFiles[2]}'), ${serviceImageFallbacks[2]}`,
  },
  {
    number: "04",
    title: "Marketing & Distribution",
    description:
      "We help you reach the right audience and get your music on all major platforms worldwide.",
    learnMore: "Learn more",
    slug: "marketing-distribution",
    // icon: <GlobeIcon />,
    imagePlaceholder: `url('${serviceImageFiles[3]}'), ${serviceImageFallbacks[3]}`,
  },
];

const processSteps: ProcessStep[] = [
  {
    icon: <SearchIcon />,
    label: "Discover",
    description: "Deep dive into your artistic vision and project goals.",
  },
  {
    icon: <SparkleIcon />,
    label: "Create",
    description: "Bringing elements together through premium production.",
  },
  {
    icon: <WandIcon />,
    label: "Polish",
    description: "Fine-tuning every frequency for a professional finish.",
  },
  {
    icon: <RocketIcon />,
    label: "Launch",
    description: "Strategizing the release and hitting the platforms.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ServicesPage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div
      style={{
        fontFamily: "'Sora', 'DM Sans', 'Inter', sans-serif",
        background: "#0a0a0a",
        color: "#fff",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      <JsonLd
        data={[
          servicesWebPageSchema,
          servicesBreadcrumbSchema,
          serviceEntitiesSchema,
        ]}
      />

      {/* ── Styles & Animations ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.05); }
        }

        .fade-up-1 { animation: fadeUp 0.6s 0.1s ease both; }
        .fade-up-2 { animation: fadeUp 0.6s 0.2s ease both; }
        .fade-up-3 { animation: fadeUp 0.6s 0.35s ease both; }

        /* Service Card Styling */
        .services-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .services-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .services-grid {
            grid-template-columns: 1fr;
          }
        }

        .service-card {
          background: #111111;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          position: relative;
        }
        .service-card:hover {
          border-color: rgba(245, 158, 11, 0.5);
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(245, 158, 11, 0.15);
        }

        .service-card-img-wrapper {
          height: 190px;
          position: relative;
          overflow: hidden;
          background: #18181b;
        }

        .service-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .service-card:hover .service-card-img {
          transform: scale(1.07);
        }

        .service-card-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          background: rgba(10, 10, 10, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #f59e0b;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .service-card-icon-badge {
          position: absolute;
          bottom: 12px;
          left: 14px;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(10, 10, 10, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #f59e0b;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-card-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.3;
          margin-bottom: 12px;
          min-height: 3.2rem;
          display: flex;
          align-items: center;
        }

        .divider-line {
          width: 32px;
          height: 3px;
          background: linear-gradient(90deg, #f59e0b 0%, #f97316 100%);
          border-radius: 2px;
          margin-bottom: 16px;
          transition: width 0.3s ease;
        }
        .service-card:hover .divider-line {
          width: 48px;
        }

        .learn-more-btn {
          color: #e5e7eb;
          font-size: 0.875rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: color 0.2s, transform 0.2s;
        }
        .service-card:hover .learn-more-btn {
          color: #f59e0b;
        }
        .service-card:hover .learn-more-arrow {
          transform: translateX(4px);
        }

        /* Buttons */
        .hero-primary-btn {
          background: #f59e0b;
          color: #0a0a0a;
          border: none;
          border-radius: 10px;
          padding: 15px 36px;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
        }
        .hero-primary-btn:hover {
          background: #fbbf24;
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(245, 158, 11, 0.45);
        }

        .hero-secondary-btn {
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 10px;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 15px 36px;
          backdrop-filter: blur(8px);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }
        .hero-secondary-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.32);
          transform: translateY(-2px);
        }

        /* Process Steps Grid */
        .process-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          position: relative;
        }
        @media (max-width: 1024px) {
          .process-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .process-grid {
            grid-template-columns: 1fr;
          }
        }

        .process-card {
          background: #111111;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
          padding: 32px 24px;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .process-card:hover {
          border-color: rgba(245, 158, 11, 0.4);
          transform: translateY(-5px);
          background: #141414;
          box-shadow: 0 16px 32px rgba(0,0,0,0.5);
        }

        .process-step-num {
          font-size: 0.75rem;
          font-weight: 800;
          color: #f59e0b;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 20px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          padding: 4px 12px;
          border-radius: 20px;
        }

        .process-icon-wrap {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(17, 17, 17, 1) 70%);
          border: 1px solid rgba(245, 158, 11, 0.25);
          color: #f59e0b;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          transition: all 0.3s ease;
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.08);
        }
        .process-card:hover .process-icon-wrap {
          background: radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(20, 20, 20, 1) 70%);
          border-color: #f59e0b;
          transform: scale(1.1);
          box-shadow: 0 0 28px rgba(245, 158, 11, 0.25);
        }

        .process-card-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }

        .process-card-desc {
          font-size: 0.875rem;
          color: #9ca3af;
          line-height: 1.6;
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1 — HERO / OUR SERVICES
      ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          minHeight: "460px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          overflow: "hidden",
          padding: "90px 24px 80px",
        }}
      >
        {/* Background image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/bg_1.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* Dark overlay for contrast */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at center, rgba(10,10,10,0.65) 0%, rgba(10,10,10,0.92) 100%)",
          }}
        />

        {/* Hero Content */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: "760px" }}>
          <div
            className="fade-up-1"
            style={{
              display: "inline-block",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.25em",
              color: "#f59e0b",
              textTransform: "uppercase",
              marginBottom: "18px",
              padding: "6px 16px",
              borderRadius: "20px",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
            }}
          >
            Our Services
          </div>

          <h1
            className="fade-up-2"
            style={{
              fontSize: "clamp(2.4rem, 5.5vw, 3.8rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: "20px",
              letterSpacing: "-0.02em",
              color: "#ffffff",
            }}
          >
            Everything You Need To{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontStyle: "normal",
              }}
            >
              Build
            </span>{" "}
            Your Sound
          </h1>

          <p
            className="fade-up-3"
            style={{
              fontSize: "1.05rem",
              color: "#d1d5db",
              lineHeight: 1.7,
              maxWidth: "560px",
              margin: "0 auto 36px",
            }}
          >
            End-to-end music production, mixing, lyrics, and distribution
            services crafted to bring your musical vision to life with industry standard excellence.
          </p>

          <div
            className="fade-up-3"
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="https://wa.me/919461209922?text=Hi%20Prabh%20Musik%2C%20I%20want%20to%20start%20my%20project."
              target="_blank"
              rel="noreferrer"
              className="hero-primary-btn"
            >
              Start Your Project
              <span className="learn-more-arrow">
                <ArrowRightIcon />
              </span>
            </Link>
            <Link href="/about" className="hero-secondary-btn">
              View Portfolio
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2 — SERVICE CARDS
      ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "#0d0d0d",
          padding: "80px 24px",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <div className="services-grid">
            {services.map((svc, i) => (
              <Link
                key={i}
                href={`/services/${svc.slug}`}
                className="service-card"
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Image & Badges */}
                <div className="service-card-img-wrapper">
                  <img
                    src={serviceImageFiles[i]}
                    alt={svc.title}
                    className="service-card-img"
                    onError={(e) => {
                      // Fallback gradient if webp image missing
                      (e.currentTarget.parentNode as HTMLElement).style.background = serviceImageFallbacks[i];
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="service-card-badge">{svc.number}</div>
                  <div className="service-card-icon-badge">
                    {i === 0 && <WaveformIcon />}
                    {i === 1 && <SlidersIcon />}
                    {i === 2 && <PenIcon />}
                    {i === 3 && <GlobeIcon />}
                  </div>
                </div>

                {/* Content */}
                <div
                  style={{
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  <h3 className="service-card-title">{svc.title}</h3>

                  <div className="divider-line" />

                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#9ca3af",
                      lineHeight: 1.65,
                      flex: 1,
                      marginBottom: "24px",
                    }}
                  >
                    {svc.description}
                  </p>

                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span className="learn-more-btn">
                      {svc.learnMore}
                      <span className="learn-more-arrow">
                        <ArrowRightIcon />
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3 — OUR PROCESS
      ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "#0a0a0a",
          padding: "96px 24px",
        }}
      >
        <div style={{ maxWidth: "1240px", margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "#f59e0b",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            How We Work
          </div>
          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "14px",
              color: "#ffffff",
            }}
          >
            Our Production Process
          </h2>
          <p
            style={{
              color: "#9ca3af",
              fontSize: "1rem",
              maxWidth: "520px",
              margin: "0 auto 60px",
              lineHeight: 1.6,
            }}
          >
            A structured four-step journey transforming your raw idea into a platform-ready masterpiece.
          </p>

          {/* Process Steps Grid */}
          <div className="process-grid">
            {processSteps.map((step, idx) => (
              <div key={idx} className="process-card">
                <span className="process-step-num">Step 0{idx + 1}</span>
                <div className="process-icon-wrap">{step.icon}</div>
                <h3 className="process-card-title">{step.label}</h3>
                <p className="process-card-desc">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 4 — CTA BANNER
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: "#0a0a0a", padding: "0 24px 96px" }}>
        <div
          style={{
            maxWidth: "1140px",
            margin: "0 auto",
            background: "linear-gradient(135deg, #121214 0%, #17171a 100%)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: "24px",
            padding: "clamp(48px, 6vw, 72px) clamp(24px, 6vw, 80px)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 24px 48px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Ambient Glow */}
          <div
            style={{
              position: "absolute",
              top: "-100px",
              right: "-100px",
              width: "380px",
              height: "380px",
              background:
                "radial-gradient(circle, rgba(245,158,11,0.16) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-100px",
              left: "-100px",
              width: "380px",
              height: "380px",
              background:
                "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4.5vw, 2.75rem)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: "16px",
                color: "#ffffff",
              }}
            >
              Ready to Amplify Your Art?
            </h2>
            <p
              style={{
                color: "#d1d5db",
                fontSize: "1rem",
                lineHeight: 1.7,
                maxWidth: "540px",
                margin: "0 auto 36px",
              }}
            >
              Let's collaborate on your next release. Connect with our sound engineers and production team to bring your project to life.
            </p>

            <div
              style={{
                display: "flex",
                gap: "16px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <a
                href="https://wa.me/919461209922?text=Hi%20Prabh%20Musik%2C%20I%20want%20to%20get%20started%20with%20my%20project."
                target="_blank"
                rel="noreferrer"
                className="hero-primary-btn"
              >
                Get Started Now
              </a>
              <a
                className="hero-secondary-btn"
                href="https://mail.google.com/mail/?view=cm&fs=1&to=support@prabhmusik.com&su=Support%20Request"
                target="_blank"
                rel="noreferrer"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

