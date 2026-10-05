"use client";

import React from "react";
import { useAudioPlayer } from "@/app/contexts/audio-player-context";
import { useAppShell } from "@/app/contexts/app-shell-context";
import { useRouter, usePathname } from "next/navigation";

export function GlobalAudioPlayer() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentBeat,
    isPlaying,
    currentTime,
    duration,
    isLooping,
    togglePlay,
    seekByRatio,
    toggleLoop,
    closePlayer,
  } = useAudioPlayer();
  const { isAuthenticated, addToCart } = useAppShell();

  if (!currentBeat || pathname?.startsWith("/admin")) return null;

  const formatTime = (secs: number) => {
    const safe = Math.max(0, Math.floor(secs));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const progressRatio = duration > 0 ? currentTime / duration : 0;

  const waveformBars = Array.from({ length: 140 }, (_, i) => {
    const wave = Math.sin(i * 0.21) + Math.sin(i * 0.09 + 1.3) + Math.sin(i * 0.045 + 2.2);
    const normalized = Math.abs(wave / 3);
    return 6 + Math.round(normalized * 24);
  });

  const handlePurchase = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    addToCart(currentBeat);
  };

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        background: "rgba(10, 12, 16, 0.96)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 -16px 40px rgba(0,0,0,0.7)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        padding: "10px 20px 14px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg, rgba(251,191,36,0.3) 0%, #fbbf24 50%, rgba(251,191,36,0.3) 100%)",
        }}
      />

      <button
        onClick={closePlayer}
        aria-label="Close player"
        style={{
          position: "absolute",
          top: 8,
          right: 12,
          width: 24,
          height: 24,
          borderRadius: 6,
          border: "1px solid rgba(251,191,36,0.35)",
          background: "rgba(251,191,36,0.08)",
          color: "#fbbf24",
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

      <div style={{ maxWidth: 1280, margin: "0 auto", paddingRight: 32 }}>
        {/* Waveform Seek Bar */}
        <div
          style={{
            height: 32,
            marginBottom: 6,
            display: "grid",
            gridTemplateColumns: "48px 1fr 48px",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", textAlign: "left" }}>
            {formatTime(currentTime)}
          </span>

          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seekByRatio((e.clientX - rect.left) / rect.width);
            }}
            style={{
              height: 28,
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
                    background: played ? "#fbbf24" : "rgba(255,255,255,0.15)",
                    transition: "background 0.12s linear",
                  }}
                />
              );
            })}
          </div>

          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", textAlign: "right" }}>
            {formatTime(duration || 0)}
          </span>
        </div>

        {/* Controls & Track Info */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          {/* Cover & Title */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 200, flex: "1 1 240px" }}>
            {currentBeat.cover && (
              <img
                src={currentBeat.cover}
                alt={currentBeat.title}
                style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
              />
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {currentBeat.title}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {currentBeat.producer} {currentBeat.bpm ? `• ${currentBeat.bpm} BPM` : ""}
              </p>
            </div>
          </div>

          {/* Play / Pause / Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "none",
                background: "#fbbf24",
                color: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(251,191,36,0.4)",
              }}
            >
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            <button
              onClick={toggleLoop}
              style={{
                background: "transparent",
                border: "none",
                color: isLooping ? "#fbbf24" : "rgba(255,255,255,0.6)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ↻ Loop
            </button>
          </div>

          {/* Purchase CTA */}
          <button
            onClick={handlePurchase}
            style={{
              background: "#d4820a",
              border: "none",
              color: "#000",
              fontWeight: 700,
              fontSize: 14,
              borderRadius: 8,
              padding: "8px 18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>Cart</span>
            <span>{currentBeat.price === null ? "Free" : `₹${currentBeat.price.toLocaleString("en-IN")}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
