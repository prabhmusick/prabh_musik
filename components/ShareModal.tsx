"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Copy, Check, Share2 } from "lucide-react";
import { BeatItem } from "@/app/contexts/app-shell-context";
import { CANONICAL_DOMAIN } from "@/lib/seo/schemas";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  beat: BeatItem | null;
}

export function ShareModal({ isOpen, onClose, beat }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string>("");
  const [supportsNativeShare, setSupportsNativeShare] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const artistName =
    beat?.producer || beat?.artist || "Prabh Musik";
  const beatId = beat?.id ? String(beat.id) : "";
  const shareUrl = beatId ? `${CANONICAL_DOMAIN}/beat/${encodeURIComponent(beatId)}` : "";
  const shareTitle = `${beat?.title || "Beat"} | Prabh Musik`;
  const shareText = `Check out ${beat?.title || "this beat"} by ${artistName} on Prabh Musik.`;

  // Detect native share support safely
  useEffect(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      setSupportsNativeShare(typeof navigator.share === "function");
    }
  }, []);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Reset copy feedback on close or beat change
  useEffect(() => {
    setCopied(false);
    setCopyFeedback("");
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, [isOpen, beat?.id]);

  if (!isOpen || !beat) return null;

  const handleCopy = async () => {
    if (!shareUrl) return;

    let successful = false;

    // 1. Try modern navigator.clipboard
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        successful = true;
      } catch (err) {
        // Fallback below
      }
    }

    // 2. Fallback to selection & execCommand
    if (!successful && inputRef.current) {
      try {
        inputRef.current.select();
        inputRef.current.setSelectionRange(0, 99999);
        successful = document.execCommand("copy");
      } catch (err) {
        successful = false;
      }
    }

    if (successful) {
      setCopied(true);
      setCopyFeedback("Link copied!");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setCopied(false);
        setCopyFeedback("");
      }, 2500);
    } else {
      // If copying was blocked, select input for manual Ctrl+C
      if (inputRef.current) {
        inputRef.current.select();
      }
      setCopyFeedback("Press Ctrl+C to copy");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopyFeedback(""), 3500);
    }
  };

  const handleNativeShare = async () => {
    if (!shareUrl || typeof navigator === "undefined" || !navigator.share) return;

    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // User cancelled share dialog - do not show error
        return;
      }
      console.warn("Native share error, falling back to copy:", err);
      // Fallback to copy link
      handleCopy();
    }
  };

  // Official social share URLs
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  return (
    <>
      <style>{`
        .pm-share-backdrop {
          position: fixed;
          inset: 0;
          z-index: 2000;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: pmShareFadeIn 0.2s ease-out;
        }
        @keyframes pmShareFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .pm-share-card {
          width: 100%;
          max-width: 460px;
          background: #141416;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(255, 192, 67, 0.08);
          overflow: hidden;
          color: #ededed;
          display: flex;
          flex-direction: column;
          animation: pmShareSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes pmShareSlideUp {
          from { transform: translateY(16px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .pm-share-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .pm-share-title {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pm-share-close {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .pm-share-close:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
        }
        .pm-share-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .pm-share-preview {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 10px;
          padding: 12px;
        }
        .pm-share-cover {
          width: 56px;
          height: 56px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .pm-share-cover-placeholder {
          width: 56px;
          height: 56px;
          border-radius: 8px;
          background: rgba(255, 192, 67, 0.1);
          border: 1px solid rgba(255, 192, 67, 0.25);
          color: #ffc043;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }
        .pm-share-meta {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .pm-share-track-title {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pm-share-track-artist {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pm-share-badges {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
        }
        .pm-share-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.07);
          color: rgba(255, 255, 255, 0.7);
        }
        .pm-share-badge-gold {
          background: rgba(255, 192, 67, 0.14);
          color: #ffc043;
          border: 1px solid rgba(255, 192, 67, 0.3);
        }
        .pm-share-url-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pm-share-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pm-share-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pm-share-input {
          flex: 1;
          height: 42px;
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 0 12px;
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          color: #ffc043;
          outline: none;
          user-select: all;
          transition: border-color 0.15s ease;
        }
        .pm-share-input:focus {
          border-color: #ffc043;
        }
        .pm-share-primary-btn {
          height: 42px;
          padding: 0 16px;
          border-radius: 8px;
          border: none;
          background: #ffc043;
          color: #0a0a0a;
          font-size: 13px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
          box-shadow: 0 2px 10px rgba(255, 192, 67, 0.25);
          flex-shrink: 0;
        }
        .pm-share-primary-btn:hover {
          background: #e8920a;
          box-shadow: 0 4px 14px rgba(255, 192, 67, 0.4);
          transform: translateY(-1px);
        }
        .pm-share-primary-btn.copied {
          background: #10b981;
          color: #fff;
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.35);
        }
        .pm-share-native-btn {
          height: 40px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.04);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .pm-share-native-btn:hover {
          border-color: rgba(255, 192, 67, 0.4);
          background: rgba(255, 192, 67, 0.1);
          color: #ffc043;
        }
        .pm-share-social-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-top: 4px;
        }
        .pm-share-social-btn {
          flex: 1;
          height: 38px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.8);
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .pm-share-social-btn:hover {
          border-color: rgba(255, 255, 255, 0.25);
          color: #fff;
        }
        .pm-share-social-btn.whatsapp:hover {
          background: rgba(37, 211, 102, 0.12);
          border-color: rgba(37, 211, 102, 0.4);
          color: #25d366;
        }
        .pm-share-social-btn.twitter:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.35);
          color: #fff;
        }
        .pm-share-social-btn.facebook:hover {
          background: rgba(24, 119, 242, 0.14);
          border-color: rgba(24, 119, 242, 0.4);
          color: #1877f2;
        }
        .pm-share-feedback {
          font-size: 12px;
          font-weight: 600;
          color: #10b981;
          min-height: 16px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
      `}</style>

      <div
        className="pm-share-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pm-share-modal-title"
      >
        <div className="pm-share-card">
          <div className="pm-share-header">
            <h2 id="pm-share-modal-title" className="pm-share-title">
              <Share2 size={18} style={{ color: "#ffc043" }} aria-hidden="true" />
              Share this beat
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="pm-share-close"
              aria-label="Close share dialog"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="pm-share-body">
            {/* Beat preview metadata */}
            <div className="pm-share-preview">
              {beat.cover ? (
                <img src={beat.cover} alt="" className="pm-share-cover" />
              ) : (
                <div className="pm-share-cover-placeholder">♪</div>
              )}
              <div className="pm-share-meta">
                <div className="pm-share-track-title" title={beat.title}>
                  {beat.title}
                </div>
                <div className="pm-share-track-artist" title={`by ${artistName}`}>
                  by {artistName}
                </div>
                <div className="pm-share-badges">
                  {beat.genre && (
                    <span className="pm-share-badge pm-share-badge-gold">
                      {beat.genre}
                    </span>
                  )}
                  {beat.bpm && (
                    <span className="pm-share-badge">{beat.bpm} BPM</span>
                  )}
                  {beat.price !== null && typeof beat.price === "number" && (
                    <span className="pm-share-badge">
                      ₹{beat.price.toLocaleString("en-IN", {
                        minimumFractionDigits: beat.price % 1 !== 0 ? 2 : 0,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* URL input and Copy button */}
            <div className="pm-share-url-box">
              <label htmlFor="pm-share-input-url" className="pm-share-label">
                Shareable Beat Link
              </label>
              <div className="pm-share-input-row">
                <input
                  id="pm-share-input-url"
                  ref={inputRef}
                  type="text"
                  readOnly
                  value={shareUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="pm-share-input"
                  aria-label="Shareable link"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`pm-share-primary-btn ${copied ? "copied" : ""}`}
                  aria-label={copied ? "Link copied" : "Copy beat link"}
                >
                  {copied ? (
                    <>
                      <Check size={16} aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="pm-share-feedback" aria-live="polite">
                {copyFeedback && (
                  <>
                    <Check size={13} aria-hidden="true" />
                    <span>{copyFeedback}</span>
                  </>
                )}
              </div>
            </div>

            {/* Native device share if supported */}
            {supportsNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="pm-share-native-btn"
                aria-label="Share via device options"
              >
                <Share2 size={16} aria-hidden="true" />
                <span>Share via device options</span>
              </button>
            )}

            {/* Direct social links */}
            <div>
              <div className="pm-share-label" style={{ marginBottom: 6 }}>
                Direct Share
              </div>
              <div className="pm-share-social-row">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pm-share-social-btn whatsapp"
                  aria-label="Share on WhatsApp"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.158.572 4.186 1.572 5.941l-1.666 6.091 6.257-1.642c1.702.927 3.654 1.458 5.733 1.458 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z" />
                  </svg>
                  WhatsApp
                </a>
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pm-share-social-btn twitter"
                  aria-label="Share on X (Twitter)"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  X
                </a>
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pm-share-social-btn facebook"
                  aria-label="Share on Facebook"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.595 0 9 1.582 9 4.615V8z" />
                  </svg>
                  Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
