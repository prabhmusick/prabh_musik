"use client";

import React, { useState } from "react";
import Link from "next/navigation";
import NextLink from "next/link";
import { Play, Pause, ShoppingCart, Share2, Check, ArrowLeft, Music, Disc3, ShieldCheck, Zap, Download } from "lucide-react";
import { BeatItem, useAppShell } from "@/app/contexts/app-shell-context";
import { useAudioPlayer } from "@/app/contexts/audio-player-context";
import { ShareModal } from "@/components/ShareModal";

interface BeatDetailViewProps {
  beat: BeatItem;
  canonicalUrl: string;
}

export function BeatDetailView({ beat, canonicalUrl }: BeatDetailViewProps) {
  const { currentBeat, isPlaying, playBeat, togglePlay } = useAudioPlayer();
  const { cart, addToCart, openCart } = useAppShell();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const artistName = beat.producer || beat.artist || "Prabh Musik";
  const isThisPlaying = isPlaying && String(currentBeat?.id) === String(beat.id);
  const isThisCurrent = String(currentBeat?.id) === String(beat.id);
  const isInCart = cart.some((item) => String(item.id) === String(beat.id));

  const handlePlayToggle = () => {
    if (isThisCurrent) {
      togglePlay();
    } else {
      playBeat(beat);
    }
  };

  const handleAddToCart = () => {
    if (isInCart) {
      openCart();
      return;
    }
    addToCart(beat);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const formattedPrice =
    beat.price !== null && typeof beat.price === "number"
      ? `₹${beat.price.toLocaleString("en-IN", {
          minimumFractionDigits: beat.price % 1 !== 0 ? 2 : 0,
          maximumFractionDigits: 2,
        })}`
      : "Contact for Price";

  return (
    <>
      <style>{`
        .pm-detail-wrap {
          min-height: 100vh;
          background: #0a0a0c;
          color: #ededed;
          padding: 32px 20px 140px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .pm-detail-container {
          width: 100%;
          max-width: 1100px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .pm-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }
        .pm-breadcrumb a {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .pm-breadcrumb a:hover {
          color: #ffc043;
        }
        .pm-breadcrumb-current {
          color: #ffc043;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 280px;
        }
        .pm-detail-card {
          background: #141416;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 36px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 40px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .pm-detail-card {
            grid-template-columns: 1fr;
            padding: 24px;
            gap: 24px;
          }
        }
        .pm-artwork-box {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 14px;
          overflow: hidden;
          background: #1a1a1e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
        }
        .pm-artwork-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }
        .pm-artwork-box:hover .pm-artwork-img {
          transform: scale(1.03);
        }
        .pm-artwork-overlay-btn {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.4);
          opacity: 0;
          transition: opacity 0.2s ease;
          border: none;
          cursor: pointer;
        }
        .pm-artwork-box:hover .pm-artwork-overlay-btn,
        .pm-artwork-overlay-btn.active {
          opacity: 1;
        }
        .pm-artwork-play-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #ffc043;
          color: #0a0a0c;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(255, 192, 67, 0.4);
          transform: scale(0.95);
          transition: transform 0.15s ease;
        }
        .pm-artwork-overlay-btn:hover .pm-artwork-play-icon {
          transform: scale(1.05);
        }
        .pm-info-box {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .pm-title-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pm-beat-h1 {
          font-size: 32px;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }
        @media (max-width: 640px) {
          .pm-beat-h1 {
            font-size: 24px;
          }
        }
        .pm-beat-artist-sub {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.65);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pm-beat-artist-sub strong {
          color: #ededed;
        }
        .pm-badges-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        .pm-badge-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .pm-badge-gold {
          background: rgba(255, 192, 67, 0.12);
          color: #ffc043;
          border-color: rgba(255, 192, 67, 0.3);
        }
        .pm-price-block {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .pm-price-val {
          font-size: 28px;
          font-weight: 800;
          color: #ffc043;
          letter-spacing: -0.02em;
        }
        .pm-price-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }
        .pm-action-buttons {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
        }
        .pm-btn {
          height: 48px;
          padding: 0 22px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
          text-decoration: none;
        }
        .pm-btn-primary {
          background: #ffc043;
          color: #0a0a0c;
          box-shadow: 0 4px 16px rgba(255, 192, 67, 0.28);
        }
        .pm-btn-primary:hover {
          background: #e8920a;
          box-shadow: 0 6px 20px rgba(255, 192, 67, 0.4);
          transform: translateY(-1px);
        }
        .pm-btn-secondary {
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .pm-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }
        .pm-btn-share {
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .pm-btn-share:hover {
          border-color: rgba(255, 192, 67, 0.4);
          background: rgba(255, 192, 67, 0.1);
          color: #ffc043;
          transform: translateY(-1px);
        }
        .pm-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 8px;
        }
        @media (max-width: 640px) {
          .pm-features-grid {
            grid-template-columns: 1fr;
          }
        }
        .pm-feature-box {
          background: #141416;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          padding: 18px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .pm-feature-icon {
          color: #ffc043;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .pm-feature-text h3 {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 4px;
        }
        .pm-feature-text p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.55);
          margin: 0;
          line-height: 1.4;
        }
      `}</style>

      <div className="pm-detail-wrap">
        <div className="pm-detail-container">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="pm-breadcrumb">
            <NextLink href="/">Home</NextLink>
            <span>/</span>
            <NextLink href="/beat">Beats</NextLink>
            <span>/</span>
            <span className="pm-breadcrumb-current" aria-current="page">
              {beat.title}
            </span>
          </nav>

          {/* Main Beat Details Card */}
          <div className="pm-detail-card">
            {/* Artwork with play overlay */}
            <div className="pm-artwork-box">
              <img
                src={beat.cover || "/beats_bg.png"}
                alt={`${beat.title} cover artwork`}
                className="pm-artwork-img"
              />
              <button
                type="button"
                onClick={handlePlayToggle}
                className={`pm-artwork-overlay-btn ${isThisPlaying ? "active" : ""}`}
                aria-label={isThisPlaying ? `Pause preview for ${beat.title}` : `Play preview for ${beat.title}`}
              >
                <div className="pm-artwork-play-icon">
                  {isThisPlaying ? (
                    <Pause size={28} fill="currentColor" />
                  ) : (
                    <Play size={28} fill="currentColor" style={{ marginLeft: 3 }} />
                  )}
                </div>
              </button>
            </div>

            {/* Information & Action Block */}
            <div className="pm-info-box">
              <div className="pm-title-row">
                <h1 className="pm-beat-h1">{beat.title}</h1>
                <div className="pm-beat-artist-sub">
                  <span>Produced by</span>
                  <strong>{artistName}</strong>
                </div>
              </div>

              {/* Badges: Genre, BPM, Plays */}
              <div className="pm-badges-row">
                {beat.genre && (
                  <span className="pm-badge-item pm-badge-gold">
                    <Music size={12} />
                    {beat.genre}
                  </span>
                )}
                {beat.bpm && (
                  <span className="pm-badge-item">
                    <Disc3 size={12} />
                    {beat.bpm} BPM
                  </span>
                )}
                {beat.plays !== undefined && beat.plays > 0 && (
                  <span className="pm-badge-item">
                    {beat.plays.toLocaleString()} Plays
                  </span>
                )}
                <span className="pm-badge-item">
                  <ShieldCheck size={12} />
                  Verified Royalty-Free
                </span>
              </div>

              {/* Price Block */}
              <div className="pm-price-block">
                <div>
                  <div className="pm-price-val">{formattedPrice}</div>
                  <div className="pm-price-label">
                    Includes standard commercial license & untagged master
                  </div>
                </div>
              </div>

              {/* Action Buttons: Play, Add to Cart, Share */}
              <div className="pm-action-buttons">
                <button
                  type="button"
                  onClick={handlePlayToggle}
                  className="pm-btn pm-btn-secondary"
                  aria-label={isThisPlaying ? "Pause preview" : "Play preview"}
                >
                  {isThisPlaying ? (
                    <>
                      <Pause size={18} fill="currentColor" />
                      <span>Pause Preview</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} fill="currentColor" />
                      <span>Play Preview</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="pm-btn pm-btn-primary"
                  aria-label={`Add ${beat.title} to cart`}
                >
                  {justAdded || isInCart ? (
                    <>
                      <Check size={18} />
                      <span>{isInCart ? "In Cart (View)" : "Added to Cart"}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsShareOpen(true)}
                  className="pm-btn pm-btn-share"
                  aria-label={`Share ${beat.title}`}
                  id="pm-share-beat-btn"
                >
                  <Share2 size={18} />
                  <span>Share Beat</span>
                </button>
              </div>
            </div>
          </div>

          {/* Value Props / Guarantee Section */}
          <div className="pm-features-grid">
            <div className="pm-feature-box">
              <Zap size={22} className="pm-feature-icon" />
              <div className="pm-feature-text">
                <h3>Instant Digital Download</h3>
                <p>Receive untagged WAV and MP3 files immediately upon checkout.</p>
              </div>
            </div>
            <div className="pm-feature-box">
              <ShieldCheck size={22} className="pm-feature-icon" />
              <div className="pm-feature-text">
                <h3>100% Royalty Free</h3>
                <p>Distribute on Spotify, Apple Music, and YouTube without copyright strikes.</p>
              </div>
            </div>
            <div className="pm-feature-box">
              <Download size={22} className="pm-feature-icon" />
              <div className="pm-feature-text">
                <h3>Studio Master Quality</h3>
                <p>Professional mixing & mastering ready for recording vocals.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reusable Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        beat={beat}
      />
    </>
  );
}
