"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { getBeats } from "@/services/beat.service";
import { useAppShell } from "../contexts/app-shell-context";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Beat {
  id: string;
  title: string;
  producer: string;
  price: number | null;
  cover: string;
  genre: string;
  bpm: number;
  previewUrl: string;
  plays: number;
}

// ─── API Integration ──────────────────────────────────────────────────────────

async function fetchBeats(
  page: number,
): Promise<{ beats: Beat[]; total: number; pages: number }> {
  try {
    const allBeats = await getBeats();
    // allBeats are already mapped to frontend Beat shape by services/beat.service
    const perPage = 20;
    const total = allBeats.length;
    const pages = Math.ceil(total / perPage);
    const start = (page - 1) * perPage;
    const paginatedBeats = allBeats.slice(start, start + perPage).map((b) => ({
      id: String(b.id),
      title: b.title,
      producer: "Unknown",
      price: b.price || null,
      cover:
        (b.assets && (b.assets.coverImage || b.assets.bannerImage)) ||
        "https://via.placeholder.com/400?text=No+Cover",
      genre: b.genre || "Music",
      bpm: b.bpm || 120,
      previewUrl: (b.assets && b.assets.previewAudio) || "",
      plays: Math.floor(Math.random() * 5000),
    }));
    return { beats: paginatedBeats, total, pages };
  } catch (error) {
    console.error("Failed to fetch beats from API:", error);
    return { beats: [], total: 0, pages: 0 };
  }
}

// ─── Artist data ──────────────────────────────────────────────────────────────

const ARTISTS = [
  {
    name: "KARAN AUJLA",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face",
  },
  {
    name: "SIDHU MOOSE WALA",
    img: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=120&h=120&fit=crop&crop=face",
    active: true,
  },
  {
    name: "DILJIT DOSANTH",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face",
  },
  {
    name: "AP DHILLON",
    img: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&h=120&fit=crop&crop=face",
  },
  {
    name: "GURU RANDHAWA",
    img: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=120&h=120&fit=crop&crop=face",
  },
  {
    name: "SHUBH",
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face",
  },
  {
    name: "YO YO HONEY SINGH",
    img: "https://images.unsplash.com/photo-1542909168-82c3e7fdcd5b?w=120&h=120&fit=crop&crop=face",
  },
];

const TAGS = [
  "drake",
  "trap",
  "guitar",
  "travis scott",
  "lil baby",
  "rnb",
  "gunna",
];

function getFilterOptions(beats: Beat[]) {
  return {
    genres: Array.from(
      new Set(beats.map((b) => b.genre).filter(Boolean)),
    ).sort(),
    moods: ["Energetic", "Chill", "Dark", "Uplifting", "Aggressive"],
    priceRanges: ["Free", "₹0-500", "₹500-1000", "₹1000+"],
    bpmRanges: [
      "Slow (60-90)",
      "Normal (90-130)",
      "Fast (130-160)",
      "Very Fast (160+)",
    ],
  };
}

interface FilterState {
  genre: string | null;
  mood: string | null;
  priceRange: string | null;
  bpmRange: string | null;
}

// ─── Price Button ─────────────────────────────────────────────────────────────

function PriceButton({
  price,
  beat,
  onPurchase,
}: {
  price: number | null;
  beat: Beat;
  onPurchase: (selectedBeat: Beat) => void;
}) {
  const [hov, setHov] = useState(false);
  const free = price === null;
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={(event) => {
        event.stopPropagation();
        onPurchase(beat);
      }}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        background: hov
          ? free
            ? "rgba(74,222,128,0.22)"
            : "rgba(255,255,255,0.13)"
          : free
            ? "rgba(74,222,128,0.1)"
            : "rgba(255,255,255,0.07)",
        border: free
          ? "1px solid rgba(74,222,128,0.35)"
          : "1px solid rgba(255,255,255,0.15)",
        borderRadius: 8,
        padding: "9px 12px",
        color: free ? "#4ade80" : "#e8e8e8",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        transition: "background 0.18s",
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: "0.01em",
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {free ? "Free" : `₹${price!.toLocaleString("en-IN")}`}
    </button>
  );
}

// ─── Beat Card ────────────────────────────────────────────────────────────────

function BeatCard({
  beat,
  index,
  onPlay,
  isActive,
  isPlaying,
  onPurchase,
}: {
  beat: Beat;
  index: number;
  onPlay: (beat: Beat) => void;
  isActive: boolean;
  isPlaying: boolean;
  onPurchase: (beat: Beat) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const showOverlay = hovered || isActive;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPlay(beat)}
      style={{
        background: "#1a1409",
        border: `1px solid ${showOverlay ? "rgba(251,191,36,0.35)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        transition:
          "transform 0.22s cubic-bezier(.34,1.56,.64,1), border-color 0.2s, box-shadow 0.2s",
        transform: hovered ? "translateY(-5px) scale(1.012)" : "none",
        boxShadow: showOverlay
          ? "0 20px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(251,191,36,0.15)"
          : "0 2px 10px rgba(0,0,0,0.4)",
        animationDelay: `${index * 35}ms`,
        animation: "fadeUp 0.4s ease both",
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "1",
          overflow: "hidden",
          background: "#111",
        }}
      >
        <img
          src={beat.cover}
          alt={beat.title}
          onLoad={() => setImgLoaded(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.4s ease, filter 0.3s",
            transform: hovered ? "scale(1.07)" : "scale(1)",
            filter: imgLoaded
              ? hovered
                ? "brightness(0.7)"
                : "brightness(1)"
              : "brightness(0)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: showOverlay ? 1 : 0,
            transition: "opacity 0.2s",
            background: "rgba(0,0,0,0.3)",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(beat);
            }}
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#fbbf24",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 28px rgba(251,191,36,0.55)",
              border: "none",
              cursor: "pointer",
            }}
          >
            {isActive && isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#000">
                <path d="M7 6h4v12H7zm6 0h4v12h-4z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div style={{ padding: "11px 13px 13px" }}>
        <p
          style={{
            margin: 0,
            fontSize: 13.5,
            fontWeight: 700,
            color: "#f0ebe0",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.01em",
          }}
        >
          {beat.title}
        </p>
        <p
          style={{
            margin: "4px 0 10px",
            fontSize: 11.5,
            color: "rgba(255,255,255,0.45)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {beat.producer}
          <span style={{ fontSize: 12 }}>👑</span>
        </p>
        <PriceButton price={beat.price} beat={beat} onPurchase={onPurchase} />
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      style={{
        background: "#1a1409",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 14,
        overflow: "hidden",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    >
      <div style={{ aspectRatio: "1", background: "rgba(255,255,255,0.06)" }} />
      <div style={{ padding: "11px 13px 13px" }}>
        <div
          style={{
            height: 13,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 4,
            marginBottom: 8,
          }}
        />
        <div
          style={{
            height: 11,
            width: "55%",
            background: "rgba(255,255,255,0.05)",
            borderRadius: 4,
            marginBottom: 10,
          }}
        />
        <div
          style={{
            height: 36,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 8,
          }}
        />
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const pages: (number | "…")[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push("…");
    for (
      let i = Math.max(2, current - 1);
      i <= Math.min(total - 1, current + 1);
      i++
    )
      pages.push(i);
    if (current < total - 2) pages.push("…");
    pages.push(total);
  }

  const btn = (
    label: React.ReactNode,
    page: number | null,
    active = false,
    disabled = false,
  ) => (
    <button
      key={String(label) + String(page)}
      onClick={() => page !== null && onChange(page)}
      disabled={disabled}
      style={{
        minWidth: 36,
        height: 36,
        padding: "0 10px",
        borderRadius: 8,
        border: active
          ? "1px solid rgba(251,191,36,0.6)"
          : "1px solid rgba(255,255,255,0.1)",
        background: active ? "rgba(251,191,36,0.18)" : "rgba(255,255,255,0.04)",
        color: active
          ? "#fbbf24"
          : disabled
            ? "rgba(255,255,255,0.18)"
            : "rgba(255,255,255,0.55)",
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
        justifyContent: "center",
        marginTop: 44,
      }}
    >
      {btn("← Prev", current - 1, false, current === 1)}
      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`e${i}`}
            style={{ color: "rgba(255,255,255,0.25)", padding: "0 4px" }}
          >
            …
          </span>
        ) : (
          btn(p, p as number, p === current)
        ),
      )}
      {btn("Next →", current + 1, false, current === total)}
    </div>
  );
}

// ─── Trending Beat Types Header ───────────────────────────────────────────────

function TrendingHeader({
  search,
  onSearch,
  isMobile,
  beats,
  filters,
  onFilterChange,
}: {
  search: string;
  onSearch: (v: string) => void;
  isMobile: boolean;
  beats: Beat[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}) {
  const [activeArtist, setActiveArtist] = useState(1);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const filterOptions = getFilterOptions(beats);

  return (
    <div style={{ paddingTop: 36, paddingBottom: 10 }}>
      {/* ── Trending Beat Types row ── */}
      <div
        style={{
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          marginBottom: 22,
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 14 : 0,
        }}
      >
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: isMobile ? 34 : 72,
            fontWeight: 800,
            lineHeight: isMobile ? "42px" : "79.2px",
            letterSpacing: isMobile ? "-0.8px" : "-1.44px",
            color: "#E5E2E1",
            margin: 0,
          }}
        >
          Trending Beat Types
        </h1>
      </div>

      {/* ── Artist circles ── */}
      <div
        style={{
          display: "flex",
          gap: 22,
          marginBottom: 26,
          flexWrap: "nowrap",
          overflowX: "auto",
          paddingBottom: 8,
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          scrollSnapType: "x mandatory",
        }}
      >
        {ARTISTS.map((a, i) => (
          <div
            key={i}
            onClick={() => setActiveArtist(i)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              flexShrink: 0,
              minWidth: isMobile ? 108 : undefined,
              scrollSnapAlign: "start",
            }}
          >
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                padding: 3,
                background:
                  activeArtist === i
                    ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                    : "rgba(255,255,255,0.08)",
                transition: "background 0.2s",
              }}
            >
              <img
                src={a.img}
                alt={a.name}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #120e06",
                  filter:
                    activeArtist === i
                      ? "none"
                      : "brightness(0.75) saturate(0.8)",
                  transition: "filter 0.2s",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: activeArtist === i ? "#fbbf24" : "rgba(255,255,255,0.5)",
                letterSpacing: "0.08em",
                textAlign: "center",
                fontFamily: "'DM Sans', sans-serif",
                transition: "color 0.2s",
                maxWidth: 88,
                lineHeight: 1.3,
              }}
            >
              {a.name}
            </span>
          </div>
        ))}
      </div>

      {/* ── Row 1: Search bar + tag pills + Refresh ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap",
          justifyContent: "flex-start",
        }}
      >
        {/* Search — dark pill, icon left, wider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: 24,
            flexShrink: 0,
            width: isMobile ? "100%" : 240,
            minWidth: 0,
          }}
        >
          <svg
            style={{
              marginLeft: 14,
              flexShrink: 0,
              color: "rgba(255,255,255,0.45)",
            }}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search for tags"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 13.5,
              padding: "10px 14px 10px 10px",
            }}
          />
        </div>

        {/* Tag pills — dark filled, no border */}
        {TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            style={{
              padding: "8px 16px",
              borderRadius: 24,
              border: "none",
              background:
                activeTag === tag
                  ? "rgba(251,191,36,0.22)"
                  : "rgba(255,255,255,0.1)",
              color: activeTag === tag ? "#fbbf24" : "rgba(255,255,255,0.75)",
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "background 0.15s, color 0.15s",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (activeTag !== tag)
                e.currentTarget.style.background = "rgba(255,255,255,0.16)";
            }}
            onMouseLeave={(e) => {
              if (activeTag !== tag)
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            }}
          >
            {tag}
          </button>
        ))}

        {/* Refresh pill */}
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 16px",
            borderRadius: 24,
            border: "none",
            background: "rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.75)",
            fontSize: 13.5,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            transition: "background 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.16)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
          }
          onClick={() => {}}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Row 2: Filter dropdowns ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 4,
          flexWrap: "wrap",
          justifyContent: "flex-start",
        }}
      >
        {/* Genre Filter */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() =>
              setOpenDropdown(openDropdown === "genre" ? null : "genre")
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${filters.genre ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.18)"}`,
              background: filters.genre
                ? "rgba(251,191,36,0.15)"
                : "transparent",
              color: filters.genre ? "#fbbf24" : "rgba(255,255,255,0.8)",
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "border-color 0.15s, color 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            Genre {filters.genre && `(${filters.genre})`}{" "}
            <svg
              width="11"
              height="11"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M2 4l4 4 4-4" />
            </svg>
          </button>
          {openDropdown === "genre" && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                background: "#1a1409",
                border: "1px solid rgba(251,191,36,0.3)",
                borderRadius: 8,
                padding: "8px 0",
                minWidth: 200,
                zIndex: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              }}
            >
              <button
                onClick={() => {
                  onFilterChange({ ...filters, genre: null });
                  setOpenDropdown(null);
                }}
                style={{
                  width: "100%",
                  padding: "8px 14px",
                  background: !filters.genre
                    ? "rgba(251,191,36,0.2)"
                    : "transparent",
                  color: "rgba(255,255,255,0.8)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  textAlign: "left",
                }}
              >
                All Genres
              </button>
              {filterOptions.genres.map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    onFilterChange({ ...filters, genre: g });
                    setOpenDropdown(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 14px",
                    background:
                      filters.genre === g
                        ? "rgba(251,191,36,0.2)"
                        : "transparent",
                    color: "rgba(255,255,255,0.8)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    textAlign: "left",
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price Filter */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() =>
              setOpenDropdown(openDropdown === "price" ? null : "price")
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${filters.priceRange ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.18)"}`,
              background: filters.priceRange
                ? "rgba(251,191,36,0.15)"
                : "transparent",
              color: filters.priceRange ? "#fbbf24" : "rgba(255,255,255,0.8)",
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "border-color 0.15s, color 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            Price {filters.priceRange && `(${filters.priceRange})`}{" "}
            <svg
              width="11"
              height="11"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M2 4l4 4 4-4" />
            </svg>
          </button>
          {openDropdown === "price" && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                background: "#1a1409",
                border: "1px solid rgba(251,191,36,0.3)",
                borderRadius: 8,
                padding: "8px 0",
                minWidth: 160,
                zIndex: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              }}
            >
              <button
                onClick={() => {
                  onFilterChange({ ...filters, priceRange: null });
                  setOpenDropdown(null);
                }}
                style={{
                  width: "100%",
                  padding: "8px 14px",
                  background: !filters.priceRange
                    ? "rgba(251,191,36,0.2)"
                    : "transparent",
                  color: "rgba(255,255,255,0.8)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  textAlign: "left",
                }}
              >
                All Prices
              </button>
              {filterOptions.priceRanges.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    onFilterChange({ ...filters, priceRange: p });
                    setOpenDropdown(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 14px",
                    background:
                      filters.priceRange === p
                        ? "rgba(251,191,36,0.2)"
                        : "transparent",
                    color: "rgba(255,255,255,0.8)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    textAlign: "left",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mood Filter */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() =>
              setOpenDropdown(openDropdown === "mood" ? null : "mood")
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${filters.mood ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.18)"}`,
              background: filters.mood
                ? "rgba(251,191,36,0.15)"
                : "transparent",
              color: filters.mood ? "#fbbf24" : "rgba(255,255,255,0.8)",
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "border-color 0.15s, color 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            Mood {filters.mood && `(${filters.mood})`}{" "}
            <svg
              width="11"
              height="11"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M2 4l4 4 4-4" />
            </svg>
          </button>
          {openDropdown === "mood" && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                background: "#1a1409",
                border: "1px solid rgba(251,191,36,0.3)",
                borderRadius: 8,
                padding: "8px 0",
                minWidth: 160,
                zIndex: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              }}
            >
              <button
                onClick={() => {
                  onFilterChange({ ...filters, mood: null });
                  setOpenDropdown(null);
                }}
                style={{
                  width: "100%",
                  padding: "8px 14px",
                  background: !filters.mood
                    ? "rgba(251,191,36,0.2)"
                    : "transparent",
                  color: "rgba(255,255,255,0.8)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  textAlign: "left",
                }}
              >
                All Moods
              </button>
              {filterOptions.moods.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    onFilterChange({ ...filters, mood: m });
                    setOpenDropdown(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 14px",
                    background:
                      filters.mood === m
                        ? "rgba(251,191,36,0.2)"
                        : "transparent",
                    color: "rgba(255,255,255,0.8)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    textAlign: "left",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* BPM Filter */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() =>
              setOpenDropdown(openDropdown === "bpm" ? null : "bpm")
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${filters.bpmRange ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.18)"}`,
              background: filters.bpmRange
                ? "rgba(251,191,36,0.15)"
                : "transparent",
              color: filters.bpmRange ? "#fbbf24" : "rgba(255,255,255,0.8)",
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "border-color 0.15s, color 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            BPM {filters.bpmRange && `(${filters.bpmRange})`}{" "}
            <svg
              width="11"
              height="11"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M2 4l4 4 4-4" />
            </svg>
          </button>
          {openDropdown === "bpm" && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                background: "#1a1409",
                border: "1px solid rgba(251,191,36,0.3)",
                borderRadius: 8,
                padding: "8px 0",
                minWidth: 180,
                zIndex: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              }}
            >
              <button
                onClick={() => {
                  onFilterChange({ ...filters, bpmRange: null });
                  setOpenDropdown(null);
                }}
                style={{
                  width: "100%",
                  padding: "8px 14px",
                  background: !filters.bpmRange
                    ? "rgba(251,191,36,0.2)"
                    : "transparent",
                  color: "rgba(255,255,255,0.8)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  textAlign: "left",
                }}
              >
                All BPM
              </button>
              {filterOptions.bpmRanges.map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    onFilterChange({ ...filters, bpmRange: b });
                    setOpenDropdown(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 14px",
                    background:
                      filters.bpmRange === b
                        ? "rgba(251,191,36,0.2)"
                        : "transparent",
                    color: "rgba(255,255,255,0.8)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    textAlign: "left",
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BeatMarketplace() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    genre: null,
    mood: null,
    priceRange: null,
    bpmRange: null,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();
  const { isAuthenticated, addToCart } = useAppShell();

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const data = await fetchBeats(p);
    setBeats(data.beats);
    setTotalPages(data.pages);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 900);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.loop = isLooping;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  const filtered = beats.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.producer.toLowerCase().includes(search.toLowerCase());

    const matchesGenre = !filters.genre || b.genre === filters.genre;

    const matchesMood = true; // Mood filter can be added when API data includes it

    let matchesBpm = true;
    if (filters.bpmRange) {
      if (filters.bpmRange.includes("60-90"))
        matchesBpm = b.bpm >= 60 && b.bpm <= 90;
      else if (filters.bpmRange.includes("90-130"))
        matchesBpm = b.bpm > 90 && b.bpm <= 130;
      else if (filters.bpmRange.includes("130-160"))
        matchesBpm = b.bpm > 130 && b.bpm <= 160;
      else if (filters.bpmRange.includes("160+")) matchesBpm = b.bpm > 160;
    }

    let matchesPrice = true;
    if (filters.priceRange) {
      if (filters.priceRange === "Free")
        matchesPrice = !b.price || b.price === 0;
      else if (filters.priceRange === "₹0-500")
        matchesPrice = (b.price || 0) > 0 && (b.price || 0) <= 500;
      else if (filters.priceRange === "₹500-1000")
        matchesPrice = (b.price || 0) > 500 && (b.price || 0) <= 1000;
      else if (filters.priceRange === "₹1000+")
        matchesPrice = (b.price || 0) > 1000;
    }

    return (
      matchesSearch && matchesGenre && matchesMood && matchesBpm && matchesPrice
    );
  });

  const handlePurchase = useCallback(
    (beat: Beat) => {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }
      addToCart(beat);
    },
    [addToCart, isAuthenticated, router],
  );

  const playBeat = useCallback(
    async (beat: Beat) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (currentBeat?.id === beat.id) {
        if (audio.paused) {
          await audio.play().catch(() => {});
        } else {
          audio.pause();
        }
        return;
      }

      if (!beat.previewUrl) {
        console.warn("No preview URL available for this beat");
        return;
      }

      audio.src = beat.previewUrl;
      audio.currentTime = 0;
      setCurrentBeat(beat);
      setCurrentTime(0);
      setDuration(0);
      await audio.play().catch(() => {});
    },
    [currentBeat?.id],
  );

  const playAdjacent = useCallback(
    async (direction: -1 | 1) => {
      if (filtered.length === 0) return;
      if (!currentBeat) {
        await playBeat(filtered[0]);
        return;
      }

      const currentIdx = filtered.findIndex((b) => b.id === currentBeat.id);
      const baseIndex = currentIdx >= 0 ? currentIdx : 0;
      const nextIndex =
        (baseIndex + direction + filtered.length) % filtered.length;
      await playBeat(filtered[nextIndex]);
    },
    [currentBeat, filtered, playBeat],
  );

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentBeat && filtered.length > 0) {
      await playBeat(filtered[0]);
      return;
    }

    if (audio.paused) {
      await audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [currentBeat, filtered, playBeat]);

  const closePlayer = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCurrentBeat(null);
  };

  const formatTime = (secs: number) => {
    const safe = Math.max(0, Math.floor(secs));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const seekByRatio = (ratio: number) => {
    const audio = audioRef.current;
    if (!audio || duration <= 0) return;
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const next = clampedRatio * duration;
    audio.currentTime = next;
    setCurrentTime(next);
  };
  const waveformBars = Array.from({ length: 210 }, (_, i) => {
    const wave =
      Math.sin(i * 0.21) + Math.sin(i * 0.09 + 1.3) + Math.sin(i * 0.045 + 2.2);
    const normalized = Math.abs(wave / 3);
    return 7 + Math.round(normalized * 30);
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;1,500&family=Jacques+Francois:wght@400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #120e06; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.45; }
        }
        ::-webkit-scrollbar { width: 5px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(251,191,36,0.25); border-radius: 3px; }
        input::placeholder { color: rgba(255,255,255,0.28); }
        input:focus { outline: none; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(160deg, #1c1408 0%, #0f0b04 60%, #120d05 100%)",
          fontFamily: "'DM Sans', sans-serif",
          color: "#fff",
          overflowX: "hidden",
        }}
      >
        {/* Subtle top vignette glow */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 340,
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(180,120,20,0.13) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 1360,
            margin: "0 auto",
            padding: isMobile ? "0 16px 70px" : "0 32px 70px",
          }}
        >
          {/* ── Hero: Beats background + title (full-bleed) ── */}
          <div
            style={{
              position: "relative",
              left: "50%",
              right: "50%",
              marginLeft: "-50vw",
              marginRight: "-50vw",
              width: "100vw",
              maxWidth: "100vw",
              boxSizing: "border-box",
              paddingBottom: 40,
              overflowX: "hidden",
            }}
          >
            <div
              style={{ position: "relative", height: 360, overflow: "hidden" }}
            >
              <img
                src="/beats_bg.png"
                alt="Beats background"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.78) 100%)",
                }}
              />
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    maxWidth: 1360,
                    margin: isMobile ? "0 auto 0 20px" : "0 auto 0 92px",
                    padding: isMobile
                      ? "22px 18px 22px 16px"
                      : "36px 48px 36px 20px",
                  }}
                >
                  {/* <p style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.75)", letterSpacing: "0.26em", textTransform: "uppercase", fontSize: 12, marginBottom: 8 }}>Industry</p> */}
                  <h1
                    style={{
                      fontFamily: "'Jacques Francois', serif",
                      fontWeight: 400,
                      fontSize: isMobile ? 42 : "clamp(56px, 6vw, 94px)",
                      color: "#fff",
                      lineHeight: isMobile ? 1.05 : 0.84,
                      marginBottom: 10,
                    }}
                  >
                    Industry
                    <br />
                    Ready beats for Artists
                  </h1>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontStyle: "italic",
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.9)",
                      maxWidth: 720,
                      marginBottom: 6,
                      fontSize: isMobile ? 20 : 38.88,
                      lineHeight: isMobile ? 1.5 : 2,
                    }}
                  >
                    ~who wants to stand out
                  </p>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400,
                      color: "rgba(255,255,255,0.68)",
                      maxWidth: 760,
                      marginTop: 8,
                      fontSize: isMobile ? 15 : 18.66,
                      lineHeight: isMobile ? 1.5 : 1,
                    }}
                  >
                    Premium Trap, Drill, Punjabi, Emotional and commercial beats
                    crafted for independent artists and labels.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── NEW: Trending Beat Types header ── */}
          <TrendingHeader
            search={search}
            onSearch={setSearch}
            isMobile={isMobile}
            beats={beats}
            filters={filters}
            onFilterChange={setFilters}
          />

          {/* ── Toolbar ── */}
          <div
            style={{
              display: "flex",
              justifyContent: isMobile ? "space-between" : "flex-end",
              flexWrap: "wrap",
              marginTop: 18,
              marginBottom: 18,
              gap: 8,
            }}
          >
            {(["grid", "list"] as const).map((m) => (
              <button
                key={m}
                disabled
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 9,
                  cursor: "not-allowed",
                  border:
                    viewMode === m
                      ? "1px solid rgba(251,191,36,0.55)"
                      : "1px solid rgba(255,255,255,0.1)",
                  background:
                    viewMode === m
                      ? "rgba(251,191,36,0.14)"
                      : "rgba(255,255,255,0.04)",
                  color: viewMode === m ? "#fbbf24" : "rgba(255,255,255,0.24)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                {m === "grid" ? (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M1 1h6v6H1zm8 0h6v6H9zM1 9h6v6H1zm8 0h6v6H9z" />
                  </svg>
                ) : (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M1 3h14v2H1zm0 4h14v2H1zm0 4h14v2H1z" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* ── Grid ── */}
          {viewMode === "grid" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "repeat(2, minmax(0, 1fr))"
                  : "repeat(5, 1fr)",
                gap: isMobile ? 12 : 16,
              }}
            >
              {loading
                ? Array.from({ length: 18 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))
                : filtered.map((beat, i) => (
                    <BeatCard
                      key={beat.id}
                      beat={beat}
                      index={i}
                      onPlay={playBeat}
                      onPurchase={handlePurchase}
                      isActive={currentBeat?.id === beat.id}
                      isPlaying={isPlaying}
                    />
                  ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        height: 66,
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 10,
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    />
                  ))
                : filtered.map((beat, i) => (
                    <div
                      key={beat.id}
                      style={{
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        alignItems: isMobile ? "stretch" : "center",
                        gap: isMobile ? 12 : 14,
                        background: "#1a1409",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 10,
                        padding: isMobile ? "14px" : "10px 16px",
                        animationDelay: `${i * 25}ms`,
                        animation: "fadeUp 0.35s ease both",
                        cursor: "pointer",
                        transition: "background 0.15s, border-color 0.15s",
                      }}
                      onClick={() => playBeat(beat)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(251,191,36,0.06)";
                        e.currentTarget.style.borderColor =
                          "rgba(251,191,36,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#1a1409";
                        e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.07)";
                      }}
                    >
                      <img
                        src={beat.cover}
                        alt={beat.title}
                        style={{
                          width: isMobile ? "100%" : 46,
                          height: isMobile ? 180 : 46,
                          borderRadius: 12,
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          marginTop: isMobile ? 10 : 0,
                        }}
                      >
                        <p
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontFamily: "'Syne',sans-serif",
                          }}
                        >
                          {beat.title}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.38)",
                            marginTop: 2,
                          }}
                        >
                          {beat.producer} 👑 · {beat.genre} · {beat.bpm} BPM
                        </p>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          width: isMobile ? "100%" : "auto",
                          justifyContent: isMobile
                            ? "space-between"
                            : "flex-end",
                          marginTop: isMobile ? 10 : 0,
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playBeat(beat);
                          }}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            border: "none",
                            background: "#fbbf24",
                            color: "#000",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          {currentBeat?.id === beat.id && isPlaying ? (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M7 6h4v12H7zm6 0h4v12h-4z" />
                            </svg>
                          ) : (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          )}
                        </button>
                        <div onClick={(e) => e.stopPropagation()}>
                          <PriceButton
                            price={beat.price}
                            beat={beat}
                            onPurchase={handlePurchase}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                paddingTop: 80,
                color: "rgba(255,255,255,0.28)",
              }}
            >
              <div style={{ fontSize: 46, marginBottom: 14 }}>🎵</div>
              <p style={{ fontSize: 16, fontWeight: 600 }}>
                No beats found for "{search}"
              </p>
              <p style={{ fontSize: 13, marginTop: 6 }}>
                Try a different search term
              </p>
            </div>
          )}

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <Pagination
              current={page}
              total={totalPages}
              onChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </div>

        {currentBeat && (
          <div
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 30,
              background: "rgba(2, 5, 7, 0.98)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 -18px 48px rgba(0,0,0,0.6)",
              backdropFilter: "blur(10px)",
              padding: isMobile ? "10px 12px 14px" : "8px 20px 12px",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background:
                  "linear-gradient(90deg, rgba(251,191,36,0.25) 0%, #fbbf24 50%, rgba(251,191,36,0.25) 100%)",
              }}
            />
            <button
              onClick={closePlayer}
              aria-label="Close player"
              style={{
                position: "absolute",
                top: 8,
                right: 12,
                width: 26,
                height: 26,
                borderRadius: 6,
                border: "1px solid rgba(251,191,36,0.35)",
                background: "rgba(251,191,36,0.08)",
                color: "#f6d47b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              ×
            </button>
            <div
              style={{
                maxWidth: 1360,
                margin: "0 auto",
                paddingRight: isMobile ? 0 : 34,
              }}
            >
              <div
                style={{
                  height: 42,
                  marginBottom: 8,
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "56px 1fr 56px",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#dbe4e4",
                    textAlign: "left",
                  }}
                >
                  {formatTime(currentTime)}
                </span>

                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    seekByRatio((e.clientX - rect.left) / rect.width);
                  }}
                  style={{
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    cursor: "pointer",
                    overflow: "hidden",
                  }}
                >
                  {waveformBars.map((barHeight, i) => {
                    const barProgress = i / (waveformBars.length - 1);
                    const played = barProgress <= progressRatio;
                    return (
                      <span
                        key={i}
                        style={{
                          width: 3,
                          height: barHeight,
                          borderRadius: 999,
                          background: played
                            ? "#f3f6f6"
                            : "rgba(255,255,255,0.14)",
                          transition: "background 0.14s linear",
                        }}
                      />
                    );
                  })}
                </div>

                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#dbe4e4",
                    textAlign: "right",
                  }}
                >
                  {formatTime(duration || 0)}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 18,
                  minHeight: 56,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "flex-start" : "center",
                    gap: 12,
                    minWidth: 240,
                    flex: "1 1 320px",
                  }}
                >
                  <img
                    src={currentBeat.cover}
                    alt={currentBeat.title}
                    style={{
                      width: 62,
                      height: 62,
                      borderRadius: 7,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{ minWidth: 0, width: isMobile ? "100%" : "auto" }}
                  >
                    <p
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 430,
                        fontSize: 15,
                        fontWeight: 700,
                        lineHeight: 1,
                        color: "#f4f6f8",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          letterSpacing: "0.06em",
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.55)",
                          background: "rgba(255,255,255,0.08)",
                          borderRadius: 4,
                          padding: "3px 6px",
                          flexShrink: 0,
                        }}
                      >
                        AD
                      </span>
                      <span
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        "{currentBeat.title}" - Afro Fusion Instrumental x
                        Afr...
                      </span>
                    </p>
                    <p
                      style={{
                        marginTop: 4,
                        fontSize: 13,
                        color: "rgba(255,255,255,0.56)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 430,
                      }}
                    >
                      {currentBeat.producer} • {currentBeat.bpm} BPM •{" "}
                      {currentBeat.plays} plays
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    flex: "0 1 auto",
                    flexWrap: "wrap",
                    justifyContent: isMobile ? "flex-start" : "flex-end",
                  }}
                >
                  <button
                    onClick={() => setIsLiked((v) => !v)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: isLiked ? "#ffffff" : "rgba(255,255,255,0.8)",
                      cursor: "pointer",
                      padding: 4,
                    }}
                    aria-label="Toggle favourite"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => playAdjacent(-1)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#fff",
                      cursor: "pointer",
                      padding: 4,
                    }}
                    aria-label="Previous beat"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M6 6h2v12H6zm3.5 6L18 5v14z" />
                    </svg>
                  </button>

                  <button
                    onClick={togglePlayback}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      border: "none",
                      background: "#fff",
                      color: "#000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M7 5h4v14H7zm6 0h4v14h-4z" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={() => playAdjacent(1)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#fff",
                      cursor: "pointer",
                      padding: 4,
                    }}
                    aria-label="Next beat"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M16 6h2v12h-2zM6 19V5l8.5 7z" />
                    </svg>
                  </button>

                  <button
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "rgba(255,255,255,0.85)",
                      cursor: "pointer",
                      padding: 4,
                    }}
                    aria-label="Queue"
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="4" y1="6" x2="20" y2="6" />
                      <line x1="4" y1="12" x2="14" y2="12" />
                      <line x1="4" y1="18" x2="14" y2="18" />
                      <circle cx="18" cy="18" r="2" />
                    </svg>
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    justifyContent: isMobile ? "space-between" : "flex-end",
                    flex: "1 1 400px",
                    minWidth: 240,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "rgba(255,255,255,0.9)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ✪ Edit
                  </button>

                  <button
                    onClick={() => setIsLooping((v) => !v)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: isLooping ? "#fbbf24" : "rgba(255,255,255,0.9)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ↻ Loop
                  </button>

                  <button
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "rgba(255,255,255,0.9)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ♬ Lyrics
                  </button>

                  <button
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "rgba(255,255,255,0.92)",
                      fontSize: 18,
                      cursor: "pointer",
                    }}
                    aria-label="Volume"
                  >
                    🔉
                  </button>

                  <button
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "rgba(255,255,255,0.88)",
                      fontSize: 23,
                      fontWeight: 600,
                      cursor: "pointer",
                      lineHeight: 1,
                    }}
                  >
                    ⋯
                  </button>

                  <button
                    style={{
                      border: "none",
                      background: "#0f6bff",
                      color: "#fff",
                      borderRadius: 10,
                      height: 38,
                      padding: "0 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 8px 22px rgba(15,107,255,0.32)",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 2l3 4h9a2 2 0 0 1 2 2v3H4V6a2 2 0 0 1 2-2z" />
                      <path d="M4 11h16l-1.4 8.2a2 2 0 0 1-2 1.8H7.4a2 2 0 0 1-2-1.8z" />
                    </svg>
                    {currentBeat.price === null
                      ? "Free"
                      : `₹${currentBeat.price.toLocaleString("en-IN")}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
