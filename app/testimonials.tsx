"use client";

import React from "react";
import { useEffect, useState } from "react";
import { getTestimonials } from "../services/testimonial.service";

interface TestimonialCardProps {
  text: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  image?: string;
  rating: number;
  variant: "dark" | "light";
}

const testimonials = [
  {
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    name: "Mickael Grants",
    role: "CEO of Apples to Oranges",
    initials: "MG",
    color: "#5b4fcf",
    rating: 5,
  },
  {
    text: "Absolutely seamless experience from start to finish. The platform exceeded every expectation we had going in.",
    name: "Sarah Chen",
    role: "Head of Product at NovaCo",
    initials: "SC",
    color: "#0f7c6e",
    rating: 5,
  },
  {
    text: "Our team's productivity doubled within the first month. I can't imagine going back to the old way of working.",
    name: "James O'Brien",
    role: "CTO at Linkflow",
    initials: "JO",
    color: "#c0392b",
    rating: 5,
  },
  {
    text: "The support team is phenomenal. Any question we had was answered swiftly and the onboarding was incredibly smooth.",
    name: "Priya Malhotra",
    role: "VP Engineering at Stackr",
    initials: "PM",
    color: "#d35400",
    rating: 5,
  },
  {
    text: "Best investment we made this year. The results speak for themselves — our conversion rate jumped significantly.",
    name: "Lucas Ferreira",
    role: "Founder at PulseMetrics",
    initials: "LF",
    color: "#1a6b9a",
    rating: 5,
  },
  {
    text: "Incredibly intuitive interface paired with powerful features. It's rare to find software that nails both.",
    name: "Amara Nwosu",
    role: "Designer at Craft Studio",
    initials: "AN",
    color: "#7d3c98",
    rating: 5,
  },
];

const StarIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="#f5a623"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  text,
  name,
  role,
  initials,
  color,
  image,
  rating,
  variant,
}) => {
  const isDark = variant === "dark";

  return (
    <div
      style={{
        background: isDark ? "#030B0B66" : "rgba(255, 255, 255, 0.055)",
        border: isDark
          ? "1px solid rgba(255, 255, 255, 0.09)"
          : "1px solid rgba(255, 255, 255, 0.13)",
        borderRadius: "14px",
        padding: "20px 18px 18px",
        width: "440px",
        minWidth: "240px",
        maxWidth: "440px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        boxSizing: "border-box",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = isDark
          ? "rgba(245, 166, 35, 0.28)"
          : "rgba(255, 255, 255, 0.3)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = isDark
          ? "rgba(255, 255, 255, 0.09)"
          : "rgba(255, 255, 255, 0.13)";
      }}
    >
      {/* Quote text */}
      <p
        style={{
          fontSize: "13px",
          color: isDark
            ? "rgba(200, 205, 220, 0.85)"
            : "rgba(255, 255, 255, 0.65)",
          lineHeight: 1.65,
          margin: 0,
          fontFamily: "'DM Sans', sans-serif",
          flex: 1,
        }}
      >
        {text}
      </p>

      {/* Author row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Avatar */}
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: isDark ? color : "rgba(255, 255, 255, 0.18)",
            border: isDark ? "none" : "1.5px solid rgba(255, 255, 255, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 600,
            color: "#fff",
            flexShrink: 0,
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "0.4px",
          }}
        >
          {image ? (
            <img
              src={image}
              alt={name}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            initials
          )}
        </div>

        {/* Name + role */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#ffffff",
              lineHeight: 1.3,
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: isDark ? "#6b7080" : "rgba(255, 255, 255, 0.42)",
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {role}
          </div>
        </div>

        {/* Stars */}
        <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
          {Array(rating)
            .fill(null)
            .map((_, i) => (
              <StarIcon key={i} />
            ))}
        </div>
      </div>
    </div>
  );
};

const TestimonialsMarquee: React.FC = () => {
  const [items, setItems] = useState(testimonials);

  useEffect(() => {
    let isMounted = true;

    getTestimonials()
      .then((itemsFromApi) => {
        if (!isMounted || itemsFromApi.length === 0) return;
        setItems(
          itemsFromApi.map((item, index) => ({
            text: item.testimonial,
            name: item.name,
            role: item.professional,
            initials: item.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
            color: ["#5b4fcf", "#0f7c6e", "#c0392b", "#d35400", "#1a6b9a"][
              index % 5
            ],
            image: item.image,
            rating: item.rating,
          })),
        );
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const doubled = [...items, ...items];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jacques+Francois&family=DM+Sans:wght@300;400;500&display=swap');

        @keyframes scroll-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .mq-track {
          display: flex;
          gap: 16px;
          animation: scroll-left 30s linear infinite;
          will-change: transform;
          align-items: stretch;
        }

        .mq-track:hover {
          animation-play-state: paused;
        }

        .mq-fade {
          position: relative;
          overflow: hidden;
        }

        .mq-fade::before,
        .mq-fade::after {
          content: '';
          position: absolute;
          top: 0; bottom: 0;
          width: 80px;
          z-index: 2;
          pointer-events: none;
        }

        .mq-fade::before {
          left: 0;
          background: linear-gradient(to right, #1e1008, transparent);
        }

        .mq-fade::after {
          right: 0;
          background: linear-gradient(to left, #100d15, transparent);
        }

        @media (max-width: 640px) {
          .testimonial-heading {
            font-size: clamp(30px, 7vw, 36px) !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <section
        style={{
          backgroundImage: "url('/bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          borderRadius: "16px",
          padding: "44px 0 50px",
          overflow: "hidden",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "0 40px 36px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          <h2
            className="testimonial-heading"
            style={{
              fontFamily:
                "'Jacques Francois', Georgia, 'Times New Roman', serif",
              fontSize: "65px",
              fontWeight: 400,
              fontStyle: "normal",
              color: "#ffffff",
              lineHeight: 1,
              letterSpacing: 0,
              margin: 0,
              maxWidth: "640px",
            }}
          >
            Don&apos;t take our word for it, Over 100+ people trust us
          </h2>
          <span
            style={{
              background: "#f5a623",
              color: "#1a0a00",
              fontSize: "12px",
              fontWeight: 600,
              padding: "8px 16px",
              borderRadius: "100px",
              whiteSpace: "nowrap",
              marginTop: "10px",
              flexShrink: 0,
              cursor: "default",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Testimonials
          </span>
        </div>

        {/* Scrolling strip */}
        <div className="mq-fade">
          <div style={{ display: "flex" }}>
            <div className="mq-track">
              {doubled.map((t, i) => (
                <TestimonialCard
                  key={i}
                  {...t}
                  variant={i % 2 === 0 ? "dark" : "light"}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default TestimonialsMarquee;
