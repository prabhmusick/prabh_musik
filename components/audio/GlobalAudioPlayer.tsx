"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAudioPlayer, Beat } from "@/app/contexts/audio-player-context";
import { useAppShell } from "@/app/contexts/app-shell-context";
import { useRouter } from "next/navigation";

export function GlobalAudioPlayer() {
  const {
    currentBeat,
    isPlaying,
    currentTime,
    duration,
    isLooping,
    playAdjacent,
    togglePlayback,
    closePlayer,
    seekByRatio,
    setIsLooping,
  } = useAudioPlayer();

  const { isAuthenticated, addToCart } = useAppShell();
  const router = useRouter();
  const waveformRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDraggingSeek, setIsDraggingSeek] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 900);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const formatTime = (secs: number) => {
    const numeric = Number(secs);
    if (!Number.isFinite(numeric) || numeric < 0) return "0:00";
    const safe = Math.max(0, Math.floor(numeric));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const progressRatio = Number.isFinite(duration) && duration > 0 ? currentTime / duration : 0;

  const handleWaveformSeek = useCallback(
    (clientX: number, targetElement?: HTMLElement | null) => {
      const waveform = targetElement || waveformRef.current || document.getElementById("beat-waveform-seek");
      if (!waveform || !Number.isFinite(duration) || duration <= 0) return;
      const rect = waveform.getBoundingClientRect();
      if (rect.width <= 0) return;
      const rawRatio = (clientX - rect.left) / rect.width;
      const clampedRatio = Math.max(0, Math.min(1, rawRatio));
      seekByRatio(clampedRatio);
    },
    [duration, seekByRatio]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only handle primary pointer click / touch
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingSeek(true);
    handleWaveformSeek(e.clientX, e.currentTarget);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSeek) return;
    handleWaveformSeek(e.clientX, e.currentTarget);
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDraggingSeek(false);
  };

  const waveformBars = Array.from({ length: 210 }, (_, i) => {
    const wave =
      Math.sin(i * 0.21) + Math.sin(i * 0.09 + 1.3) + Math.sin(i * 0.045 + 2.2);
    const normalized = Math.abs(wave / 3);
    return 7 + Math.round(normalized * 30);
  });

  const handlePurchase = (beat: Beat) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    addToCart({
      id: beat.id,
      title: beat.title,
      producer: beat.producer,
      price: beat.price,
      cover: beat.cover,
      genre: beat.genre,
      bpm: beat.bpm,
      previewUrl: beat.previewUrl,
      plays: beat.plays,
    });
  };

  if (!currentBeat) return null;

  return (
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
            id="beat-waveform-seek"
            ref={waveformRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUpOrCancel}
            onPointerCancel={handlePointerUpOrCancel}
            style={{
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              cursor: "pointer",
              overflow: "hidden",
              touchAction: "none",
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
                {currentBeat.title}
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
              onClick={() => handlePurchase(currentBeat)}
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
  );
}
