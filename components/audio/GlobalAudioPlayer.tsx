"use client";

import React, { useRef, useState, useEffect } from "react";
import { useAudioPlayer } from "@/app/contexts/audio-player-context";
import { useAppShell } from "@/app/contexts/app-shell-context";
import { useRouter, usePathname } from "next/navigation";
import { ListMusic, X } from "lucide-react";

export function GlobalAudioPlayer() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentBeat,
    isPlaying,
    currentTime,
    duration,
    isLooping,
    volume,
    queue,
    playBeat,
    togglePlay,
    seekByRatio,
    toggleLoop,
    playNext,
    playPrevious,
    setVolume,
    closePlayer,
  } = useAudioPlayer();
  const { isAuthenticated, addToCart } = useAppShell();
  const [shareStatus, setShareStatus] = useState("");
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const prevVolumeRef = useRef(1);

  // Expose a safe testing hook on window for automated verification
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__PRABH_TEST_PLAY_BEAT__ = (customBeat?: any) => {
        playBeat(
          {
            id: 1,
            title: "Manish",
            producer: "Sanskar",
            price: 149.99,
            cover: "/beats_bg.png",
            bpm: 120,
            previewUrl:
              "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            genre: "Hip-Hop",
            ...customBeat,
          },
          [
            {
              id: 1,
              title: "Manish",
              producer: "Sanskar",
              price: 149.99,
              cover: "/beats_bg.png",
              bpm: 120,
              previewUrl:
                "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
              genre: "Hip-Hop",
            },
            {
              id: 2,
              title: "Levels",
              producer: "Session Demo",
              price: 199.99,
              cover: "/hip-hop.png",
              bpm: 128,
              previewUrl:
                "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
              genre: "Trap",
            },
          ],
        );
      };
    }
  }, [playBeat]);

  useEffect(() => {
    if (!shareStatus) return;
    const timer = setTimeout(() => setShareStatus(""), 2200);
    return () => clearTimeout(timer);
  }, [shareStatus]);

  if (!currentBeat || pathname?.startsWith("/admin")) return null;

  const formatTime = (secs: number) => {
    const safe = Math.max(0, Math.floor(secs));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const queueIndex = queue.findIndex(
    (beat) => String(beat.id) === String(currentBeat.id),
  );
  const canPlayPrevious = queueIndex > 0;
  const canPlayNext = queueIndex >= 0 && queueIndex < queue.length - 1;

  const handleShare = async () => {
    const url = new URL("/beat", window.location.origin);
    url.searchParams.set("search", currentBeat.title);
    const shareData = {
      title: currentBeat.title,
      text: `Listen to ${currentBeat.title} by ${currentBeat.producer} on Prabh Musik`,
      url: url.toString(),
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus("Shared");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        setShareStatus("Link copied");
      } else {
        setShareStatus("Not supported");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Failed to share beat link", error);
      setShareStatus("Failed to share");
    }
  };

  const waveformBars = Array.from({ length: 120 }, (_, i) => {
    const wave =
      Math.sin(i * 0.21) + Math.sin(i * 0.09 + 1.3) + Math.sin(i * 0.045 + 2.2);
    const normalized = Math.abs(wave / 3);
    return 6 + Math.round(normalized * 22);
  });

  const handlePurchase = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    addToCart(currentBeat);
  };

  const toggleMute = () => {
    if (volume > 0) {
      prevVolumeRef.current = volume;
      setVolume(0);
    } else {
      setVolume(prevVolumeRef.current || 0.8);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seekByRatio((e.clientX - rect.left) / rect.width);
  };

  const handleTouchSeek = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!e.touches[0]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    seekByRatio((e.touches[0].clientX - rect.left) / rect.width);
  };

  return (
    <>
      <style>{`
        .pap-wrapper {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999;
          background: rgba(10, 12, 16, 0.98);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 -16px 40px rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 8px 16px 12px;
          user-select: none;
        }
        .pap-accent-line {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1.5px;
          background: linear-gradient(90deg, rgba(255, 192, 67, 0) 0%, #ffc043 50%, rgba(255, 192, 67, 0) 100%);
          opacity: 0.8;
        }
        .pap-container {
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        /* ── Waveform Seek Bar ── */
        .pap-waveform-row {
          height: 24px;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }
        .pap-time {
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.7);
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
          width: 38px;
        }
        .pap-time-curr { text-align: left; }
        .pap-time-dur { text-align: right; }
        .pap-waveform {
          flex: 1;
          height: 24px;
          display: flex;
          align-items: center;
          gap: 2px;
          cursor: pointer;
          overflow: hidden;
          padding: 2px 0;
        }
        .pap-waveform-bar {
          flex: 1 1 0px;
          min-width: 1.5px;
          max-width: 3.5px;
          border-radius: 999px;
          transition: background 0.12s linear;
        }
        @media (max-width: 640px) {
          .pap-waveform-row {
            height: 20px;
            gap: 8px;
            margin-bottom: 4px;
          }
          .pap-time {
            font-size: 10px;
            width: 32px;
          }
          .pap-waveform {
            height: 20px;
            gap: 1.5px;
          }
          .pap-waveform-bar:nth-child(2n) {
            display: none;
          }
        }

        /* ── Track Info ── */
        .pap-track-info {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .pap-cover-img {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .pap-cover-placeholder {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffc043;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .pap-meta {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .pap-title {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #ededed;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.25;
          letter-spacing: -0.01em;
        }
        .pap-sub {
          margin: 3px 0 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }

        /* ── Controls & Buttons ── */
        .pap-playback-ctrls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .pap-ctrl-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
          color: #ededed;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .pap-ctrl-btn:hover:not(:disabled) {
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }
        .pap-ctrl-btn.active {
          border-color: rgba(255, 192, 67, 0.45);
          background: rgba(255, 192, 67, 0.12);
          color: #ffc043;
        }
        .pap-ctrl-btn:disabled {
          opacity: 0.25;
          cursor: not-allowed;
          border-color: rgba(255, 255, 255, 0.04);
        }
        .pap-play-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: none;
          background: #ffc043;
          color: #0a0a0a;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 0 16px rgba(255, 192, 67, 0.35);
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .pap-play-btn:hover {
          background: #e8920a;
          box-shadow: 0 0 22px rgba(255, 192, 67, 0.5);
          transform: scale(1.04);
        }
        .pap-play-btn:active {
          transform: scale(0.98);
        }

        .pap-actions-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .pap-tool-btn {
          height: 34px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.7);
          padding: 0 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .pap-tool-btn:hover {
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }
        .pap-tool-btn.active {
          border-color: rgba(255, 192, 67, 0.4);
          background: rgba(255, 192, 67, 0.12);
          color: #ffc043;
        }

        .pap-share-btn {
          min-width: 80px;
          justify-content: center;
        }

        .pap-volume-group {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .pap-volume-icon-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.65);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: color 0.15s;
        }
        .pap-volume-icon-btn:hover {
          color: #fff;
        }
        .pap-volume-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 72px;
          height: 4px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.2);
          outline: none;
          cursor: pointer;
        }
        .pap-volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ffc043;
          box-shadow: 0 0 6px rgba(255, 192, 67, 0.6);
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        .pap-volume-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        .pap-volume-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ffc043;
          border: none;
          box-shadow: 0 0 6px rgba(255, 192, 67, 0.6);
          cursor: pointer;
        }

        .pap-cart-btn {
          height: 34px;
          background: #ffc043;
          color: #0a0a0a;
          border: none;
          border-radius: 8px;
          padding: 0 14px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
          transition: all 0.15s ease;
          box-shadow: 0 2px 10px rgba(255, 192, 67, 0.25);
          flex-shrink: 0;
        }
        .pap-cart-btn:hover {
          background: #e8920a;
          box-shadow: 0 4px 16px rgba(255, 192, 67, 0.4);
          transform: translateY(-1px);
        }
        .pap-cart-btn:active {
          transform: translateY(0);
        }
        .pap-cart-icon {
          width: 16px;
          height: 18px;
          object-fit: contain;
          display: block;
          flex-shrink: 0;
        }
        .pap-cart-price {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .pap-close-btn {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
          padding: 0;
        }
        .pap-close-btn:hover {
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
        }

        .pap-queue-panel {
          position: fixed;
          z-index: 1000;
          right: max(16px, calc((100vw - 1400px) / 2));
          bottom: 88px;
          width: min(360px, calc(100vw - 32px));
          max-height: min(560px, calc(100dvh - 120px));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          color: #ededed;
          background: rgba(24, 24, 24, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(16px);
        }
        .pap-queue-header {
          min-height: 48px;
          padding: 0 14px 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 13px;
          font-weight: 700;
        }
        .pap-queue-count {
          margin-left: 6px;
          color: rgba(255, 255, 255, 0.45);
          font-weight: 500;
        }
        .pap-queue-close {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.55);
          background: transparent;
          border: 0;
          border-radius: 6px;
          cursor: pointer;
        }
        .pap-queue-close:hover { color: #fff; background: rgba(255, 255, 255, 0.08); }
        .pap-queue-list { overflow-y: auto; padding: 6px; }
        .pap-queue-item {
          width: 100%;
          min-height: 54px;
          padding: 6px 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          color: inherit;
          background: transparent;
          border: 0;
          border-radius: 6px;
          cursor: pointer;
        }
        .pap-queue-item:hover { background: rgba(255, 255, 255, 0.07); }
        .pap-queue-item.current { background: rgba(255, 192, 67, 0.12); }
        .pap-queue-cover {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          object-fit: cover;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.08);
        }
        .pap-queue-meta { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .pap-queue-title, .pap-queue-producer {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .pap-queue-title { font-size: 12px; font-weight: 600; }
        .pap-queue-producer { color: rgba(255, 255, 255, 0.5); font-size: 11px; }
        .pap-queue-playing { margin-left: auto; color: #ffc043; font-size: 10px; }
        .pap-queue-empty { padding: 24px 12px; text-align: center; color: rgba(255, 255, 255, 0.5); font-size: 12px; }

        .pap-close-btn-desktop {
          margin-left: 4px;
        }

        /* ── Desktop Layout: 3-Zone Grid (>= 860px) ── */
        .pap-desktop-bar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
          align-items: center;
          gap: 16px;
          width: 100%;
        }
        .pap-desktop-bar .pap-track-info {
          justify-self: start;
          min-width: 0;
          max-width: 380px;
        }
        .pap-desktop-bar .pap-playback-ctrls {
          justify-self: center;
          gap: 12px;
        }
        .pap-desktop-bar .pap-actions-group {
          justify-self: end;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pap-mobile-bar {
          display: none;
        }

        /* ── Mobile Layout (< 860px) ── */
        @media (max-width: 859px) {
          .pap-wrapper {
            padding: 8px 12px 10px;
          }
          .pap-queue-panel {
            right: 12px;
            bottom: 176px;
            width: min(360px, calc(100vw - 24px));
            max-height: calc(100dvh - 196px);
          }
          .pap-close-btn-desktop {
            display: none !important;
          }
          .pap-desktop-bar {
            display: none;
          }
          .pap-mobile-bar {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
          }
          .pap-mobile-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            width: 100%;
          }
          .pap-mobile-top .pap-track-info {
            flex: 1;
            min-width: 0;
          }
          .pap-mobile-top .pap-cover-img,
          .pap-mobile-top .pap-cover-placeholder {
            width: 38px;
            height: 38px;
            border-radius: 6px;
          }
          .pap-mobile-top .pap-title {
            font-size: 13px;
          }
          .pap-mobile-top .pap-sub {
            font-size: 11px;
          }
          .pap-close-btn-mobile {
            width: 30px;
            height: 30px;
          }

          .pap-mobile-ctrls {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 18px;
            width: 100%;
          }
          .pap-mobile-ctrls .pap-play-btn {
            width: 44px;
            height: 44px;
          }
          .pap-mobile-ctrls .pap-ctrl-btn {
            width: 36px;
            height: 36px;
          }

          .pap-mobile-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            width: 100%;
          }
          .pap-mobile-tools {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .pap-mobile-tools .pap-tool-btn {
            width: 36px;
            height: 34px;
            padding: 0;
            justify-content: center;
          }
          .pap-mobile-tools .pap-tool-text {
            display: none;
          }
          .pap-mobile-tools .pap-volume-icon-btn {
            width: 36px;
            height: 34px;
            padding: 0;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.03);
          }
          .pap-mobile-tools .pap-volume-slider {
            display: none;
          }

          .pap-mobile-actions .pap-cart-btn {
            height: 34px;
            padding: 0 12px;
            font-size: 13px;
          }
        }
      `}</style>

      <div className="pap-wrapper">
        <div className="pap-accent-line" />

        <div className="pap-container">
          {/* Waveform Seek Bar (Spans full width) */}
          <div className="pap-waveform-row">
            <span className="pap-time pap-time-curr">
              {formatTime(currentTime)}
            </span>

            <div
              onClick={handleSeek}
              onTouchStart={handleTouchSeek}
              onTouchMove={handleTouchSeek}
              className="pap-waveform"
              title="Click to seek"
              aria-label="Seek track"
              role="slider"
              aria-valuemin={0}
              aria-valuemax={duration || 0}
              aria-valuenow={currentTime}
            >
              {waveformBars.map((barHeight, i) => {
                const barProgress = i / (waveformBars.length - 1);
                const played = barProgress <= progressRatio;
                return (
                  <span
                    key={i}
                    className="pap-waveform-bar"
                    style={{
                      height: barHeight,
                      background: played
                        ? "#ffc043"
                        : "rgba(255, 255, 255, 0.16)",
                    }}
                  />
                );
              })}
            </div>

            <span className="pap-time pap-time-dur">
              {formatTime(duration || 0)}
            </span>

            <button
              type="button"
              onClick={closePlayer}
              className="pap-close-btn pap-close-btn-desktop"
              aria-label="Close player"
              title="Close player"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Desktop Layout: 3-Zone Grid (>= 860px) */}
          <div className="pap-desktop-bar">
            {/* Left Zone: Cover & Track Info */}
            <div className="pap-track-info">
              {currentBeat.cover ? (
                <img
                  src={currentBeat.cover}
                  alt={currentBeat.title}
                  className="pap-cover-img"
                />
              ) : (
                <div className="pap-cover-placeholder">♪</div>
              )}
              <div className="pap-meta">
                <p className="pap-title" title={currentBeat.title}>
                  {currentBeat.title}
                </p>
                <p
                  className="pap-sub"
                  title={`${currentBeat.producer}${currentBeat.bpm ? ` • ${currentBeat.bpm} BPM` : ""}`}
                >
                  {currentBeat.producer}{" "}
                  {currentBeat.bpm ? `• ${currentBeat.bpm} BPM` : ""}
                </p>
              </div>
            </div>

            {/* Center Zone: Playback Controls (Mathematically Centered) */}
            <div className="pap-playback-ctrls">
              <button
                type="button"
                onClick={playPrevious}
                disabled={!canPlayPrevious}
                className="pap-ctrl-btn"
                aria-label="Play previous beat"
                title="Previous beat"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="pap-play-btn"
                aria-label={isPlaying ? "Pause" : "Play"}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M7 5h4v14H7zm6 0h4v14h-4z" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ marginLeft: 2 }}
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={playNext}
                disabled={!canPlayNext}
                className="pap-ctrl-btn"
                aria-label="Play next beat"
                title="Next beat"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setIsQueueOpen((open) => !open)}
                className={`pap-ctrl-btn ${isQueueOpen ? "active" : ""}`}
                aria-label={
                  isQueueOpen ? "Hide playing queue" : "Show playing queue"
                }
                title="Playing queue"
                aria-expanded={isQueueOpen}
              >
                <ListMusic size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Right Zone: Secondary Tools + Cart CTA */}
            <div className="pap-actions-group">
              <button
                type="button"
                onClick={toggleLoop}
                className={`pap-tool-btn ${isLooping ? "active" : ""}`}
                aria-label={isLooping ? "Disable loop" : "Enable loop"}
                title={isLooping ? "Loop enabled" : "Loop disabled"}
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
                  <path d="M17 2l4 4-4 4" />
                  <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                  <path d="M7 22l-4-4 4-4" />
                  <path d="M21 13v1a4 4 0 0 1-4 4H3" />
                </svg>
                <span className="pap-tool-text">Loop</span>
              </button>

              <div className="pap-volume-group">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="pap-volume-icon-btn"
                  aria-label={volume === 0 ? "Unmute" : "Mute"}
                  title={volume === 0 ? "Unmute" : "Mute"}
                >
                  {volume === 0 ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon
                        points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"
                        fill="currentColor"
                      />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  ) : volume < 0.5 ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon
                        points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"
                        fill="currentColor"
                      />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  ) : (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon
                        points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"
                        fill="currentColor"
                      />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  aria-label="Volume"
                  className="pap-volume-slider"
                />
              </div>

              <div className="pap-share-wrap" style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={handleShare}
                  className={`pap-tool-btn pap-share-btn ${shareStatus ? "active" : ""}`}
                  aria-label="Share beat"
                  title="Share beat link"
                >
                  {shareStatus ? (
                    <>
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="pap-tool-text">{shareStatus}</span>
                    </>
                  ) : (
                    <>
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      <span className="pap-tool-text">Share</span>
                    </>
                  )}
                </button>
                <span className="sr-only" aria-live="polite">
                  {shareStatus}
                </span>
              </div>

              <button
                type="button"
                onClick={handlePurchase}
                className="pap-cart-btn"
                aria-label={`Buy beat ${currentBeat.title} for ${currentBeat.price === null ? "free" : `₹${currentBeat.price.toLocaleString("en-IN")}`}`}
              >
                <img
                  src="/cart-icon.png"
                  alt="Cart"
                  className="pap-cart-icon"
                />
                <span className="pap-cart-price">
                  {currentBeat.price === null
                    ? "Free"
                    : `₹${currentBeat.price.toLocaleString("en-IN")}`}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Layout: Clean Multi-Row Responsive (< 860px) */}
          <div className="pap-mobile-bar">
            {/* Mobile Row 1: Track Info & Close Button */}
            <div className="pap-mobile-top">
              <div className="pap-track-info">
                {currentBeat.cover ? (
                  <img
                    src={currentBeat.cover}
                    alt={currentBeat.title}
                    className="pap-cover-img"
                  />
                ) : (
                  <div className="pap-cover-placeholder">♪</div>
                )}
                <div className="pap-meta">
                  <p className="pap-title" title={currentBeat.title}>
                    {currentBeat.title}
                  </p>
                  <p
                    className="pap-sub"
                    title={`${currentBeat.producer}${currentBeat.bpm ? ` • ${currentBeat.bpm} BPM` : ""}`}
                  >
                    {currentBeat.producer}{" "}
                    {currentBeat.bpm ? `• ${currentBeat.bpm} BPM` : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePlayer}
                className="pap-close-btn pap-close-btn-mobile"
                aria-label="Close player"
                title="Close player"
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
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Mobile Row 2: Playback Controls centered */}
            <div className="pap-mobile-ctrls">
              <button
                type="button"
                onClick={playPrevious}
                disabled={!canPlayPrevious}
                className="pap-ctrl-btn"
                aria-label="Play previous beat"
                title="Previous beat"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="pap-play-btn"
                aria-label={isPlaying ? "Pause" : "Play"}
                title={isPlaying ? "Pause" : "Play"}
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
                    style={{ marginLeft: 2 }}
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={playNext}
                disabled={!canPlayNext}
                className="pap-ctrl-btn"
                aria-label="Play next beat"
                title="Next beat"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setIsQueueOpen((open) => !open)}
                className={`pap-ctrl-btn ${isQueueOpen ? "active" : ""}`}
                aria-label={
                  isQueueOpen ? "Hide playing queue" : "Show playing queue"
                }
                title="Playing queue"
                aria-expanded={isQueueOpen}
              >
                <ListMusic size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Mobile Row 3: Action Buttons & Cart CTA */}
            <div className="pap-mobile-actions">
              <div className="pap-mobile-tools">
                <button
                  type="button"
                  onClick={toggleLoop}
                  className={`pap-tool-btn ${isLooping ? "active" : ""}`}
                  aria-label={isLooping ? "Disable loop" : "Enable loop"}
                  title={isLooping ? "Loop enabled" : "Loop disabled"}
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
                    <path d="M17 2l4 4-4 4" />
                    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                    <path d="M7 22l-4-4 4-4" />
                    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="pap-volume-icon-btn"
                  aria-label={volume === 0 ? "Unmute" : "Mute"}
                  title={volume === 0 ? "Unmute" : "Mute"}
                >
                  {volume === 0 ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon
                        points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"
                        fill="currentColor"
                      />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  ) : volume < 0.5 ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon
                        points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"
                        fill="currentColor"
                      />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  ) : (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon
                        points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"
                        fill="currentColor"
                      />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className={`pap-tool-btn ${shareStatus ? "active" : ""}`}
                  aria-label="Share beat"
                  title="Share beat link"
                >
                  {shareStatus ? (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handlePurchase}
                className="pap-cart-btn"
                aria-label={`Buy beat ${currentBeat.title} for ${currentBeat.price === null ? "free" : `₹${currentBeat.price.toLocaleString("en-IN")}`}`}
              >
                <img
                  src="/cart-icon.png"
                  alt="Cart"
                  className="pap-cart-icon"
                />
                <span className="pap-cart-price">
                  {currentBeat.price === null
                    ? "Free"
                    : `₹${currentBeat.price.toLocaleString("en-IN")}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {isQueueOpen && (
        <section className="pap-queue-panel" aria-label="Playing queue">
          <div className="pap-queue-header">
            <span>
              Playing queue
              <span className="pap-queue-count">{queue.length}</span>
            </span>
            <button
              type="button"
              onClick={() => setIsQueueOpen(false)}
              className="pap-queue-close"
              aria-label="Close playing queue"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          {queue.length > 0 ? (
            <div className="pap-queue-list">
              {queue.map((beat, index) => {
                const isCurrentBeat =
                  String(beat.id) === String(currentBeat.id);
                return (
                  <button
                    type="button"
                    key={`${beat.id}-${index}`}
                    onClick={() => playBeat(beat, queue)}
                    className={`pap-queue-item ${isCurrentBeat ? "current" : ""}`}
                    aria-current={isCurrentBeat ? "true" : undefined}
                  >
                    {beat.cover ? (
                      <img
                        src={beat.cover}
                        alt=""
                        className="pap-queue-cover"
                      />
                    ) : (
                      <span className="pap-queue-cover" />
                    )}
                    <span className="pap-queue-meta">
                      <span className="pap-queue-title">{beat.title}</span>
                      <span className="pap-queue-producer">
                        {beat.producer}
                      </span>
                    </span>
                    {isCurrentBeat && (
                      <span className="pap-queue-playing">Playing</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="pap-queue-empty">No tracks in the queue</div>
          )}
        </section>
      )}
    </>
  );
}
