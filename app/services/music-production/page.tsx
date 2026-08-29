'use client';
import { useState, useRef, useEffect } from "react";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #080808;
    --surface: #111111;
    --surface2: #181818;
    --surface3: #1e1e1e;
    --border: rgba(255,255,255,0.07);
    --border-hover: rgba(240,123,32,0.28);
    --orange: #f07b20;
    --orange-dim: rgba(240,123,32,0.12);
    --orange-glow: rgba(240,123,32,0.20);
    --amber: #e8a050;
    --text: #f0ebe3;
    --text-2: #b5afa7;
    --muted: #6a6560;
    --serif: 'Playfair Display', Georgia, serif;
    --sans: 'DM Sans', sans-serif;
    --mono: 'DM Mono', monospace;
  }

  html { scroll-behavior: smooth; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    font-size: 15px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  /* ── NAV ── */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 52px;
    height: 68px;
    border-bottom: 1px solid var(--border);
    background: rgba(8,8,8,0.88);
    backdrop-filter: blur(16px) saturate(1.4);
  }
  .nav-logo {
    display: flex; align-items: center; gap: 10px;
    text-decoration: none;
  }
  .nav-logo-mark {
    width: 32px; height: 32px; border-radius: 8px;
    background: var(--orange);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    box-shadow: 0 0 16px var(--orange-glow);
    flex-shrink: 0;
  }
  .nav-logo-text {
    font-family: var(--serif);
    font-size: 18px; font-weight: 700;
    color: var(--text); letter-spacing: 0.01em;
  }
  .nav-links {
    display: flex; gap: 0; list-style: none;
  }
  .nav-links a {
    color: var(--muted); text-decoration: none;
    font-size: 13px; letter-spacing: 0.06em;
    padding: 8px 18px; border-radius: 6px;
    transition: color 0.2s, background 0.2s;
    display: block;
  }
  .nav-links a:hover { color: var(--text); background: rgba(255,255,255,0.04); }
  .nav-right { display: flex; align-items: center; gap: 12px; }
  .nav-badge {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em;
    color: var(--orange); border: 1px solid rgba(240,123,32,0.3);
    padding: 3px 10px; border-radius: 100px;
    background: rgba(240,123,32,0.06);
  }
  .nav-cta {
    background: var(--orange); color: #fff; border: none;
    padding: 9px 22px; border-radius: 8px;
    font-family: var(--sans); font-size: 13px; font-weight: 500;
    cursor: pointer; letter-spacing: 0.03em;
    transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 0 16px var(--orange-glow);
  }
  .nav-cta:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 6px 28px var(--orange-glow); }

  /* ── HERO ── */
  .hero {
    position: relative;
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    padding: 24px 0 0;
    overflow: hidden;
  }
  .hero-bg {
    position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 60% 80% at 70% 50%, rgba(240,123,32,0.06) 0%, transparent 65%),
      radial-gradient(ellipse 40% 40% at 20% 80%, rgba(240,123,32,0.03) 0%, transparent 60%);
  }
  .hero-grid-lines {
    position: absolute; inset: 0; pointer-events: none; opacity: 0.025;
    background-image:
      linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px);
    background-size: 60px 60px;
  }
  .hero-left {
    position: relative;
    padding: 56px 56px 80px 72px;
    display: flex; flex-direction: column;
  }
  .hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    margin-bottom: 28px;
  }
  .hero-eyebrow-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--orange);
    box-shadow: 0 0 8px var(--orange);
    animation: pulse-dot 2s ease-in-out infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; box-shadow: 0 0 8px var(--orange); }
    50% { opacity: 0.5; box-shadow: 0 0 3px var(--orange); }
  }
  .hero-eyebrow-text {
    font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--orange);
  }
  .hero-title {
    font-family: var(--serif);
    font-size: clamp(48px, 5.5vw, 80px);
    font-weight: 900;
    line-height: 0.95;
    letter-spacing: -0.02em;
    color: var(--text);
    margin-bottom: 6px;
  }
  .hero-title em {
    font-style: italic;
    color: transparent;
    -webkit-text-stroke: 1.5px var(--orange);
    display: block;
  }
  .hero-title span { display: block; }
  .hero-desc {
    color: var(--text-2); font-size: 15px; line-height: 1.8;
    max-width: 400px; margin: 24px 0 40px;
  }
  .hero-actions {
    display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
  }
  .btn-primary {
    background: var(--orange); color: #fff; border: none;
    padding: 14px 32px; border-radius: 8px;
    font-family: var(--sans); font-size: 14px; font-weight: 600;
    cursor: pointer; letter-spacing: 0.02em;
    display: flex; align-items: center; gap: 8px;
    transition: all 0.2s;
    box-shadow: 0 4px 28px var(--orange-glow);
  }
  .btn-primary:hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 10px 44px var(--orange-glow); }
  .btn-ghost {
    background: transparent; color: var(--text-2);
    border: 1px solid var(--border);
    padding: 14px 28px; border-radius: 8px;
    font-family: var(--sans); font-size: 14px; font-weight: 400;
    cursor: pointer; letter-spacing: 0.02em;
    transition: all 0.2s;
  }
  .btn-ghost:hover { border-color: rgba(255,255,255,0.2); color: var(--text); background: rgba(255,255,255,0.03); }

  .hero-stats {
    display: flex; gap: 0; margin-top: 60px;
    border-top: 1px solid var(--border);
    padding-top: 28px;
  }
  .hero-stat { flex: 1; }
  .hero-stat + .hero-stat { border-left: 1px solid var(--border); padding-left: 28px; }
  .hero-stat-num {
    font-family: var(--serif); font-size: 32px; font-weight: 900;
    color: var(--text); line-height: 1;
    margin-bottom: 4px;
  }
  .hero-stat-num span { color: var(--orange); }
  .hero-stat-label {
    font-size: 12px; color: var(--muted); letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* Hero right - visual */
  .hero-right {
    position: relative;
    height: 100%;
    min-height: calc(100vh - 68px);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    border-left: 1px solid var(--border);
  }
  .hero-visual {
    position: relative; width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
  }
  .hero-console {
    position: relative; z-index: 2;
    width: 88%; max-width: 420px;
  }
  .console-header {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-bottom: none;
    border-radius: 12px 12px 0 0;
    padding: 12px 16px;
    display: flex; align-items: center; gap: 8px;
  }
  .console-dot {
    width: 10px; height: 10px; border-radius: 50%;
  }
  .console-label {
    font-family: var(--mono); font-size: 11px; color: var(--muted);
    margin-left: 4px; letter-spacing: 0.06em;
  }
  .console-body {
    background: var(--surface);
    border: 1px solid var(--border);
    border-top: none;
    border-radius: 0 0 12px 12px;
    padding: 20px;
    overflow: hidden;
  }
  .eq-container {
    display: flex; align-items: flex-end; gap: 3px;
    height: 100px; margin-bottom: 20px;
  }
  .eq-bar-wrap {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; gap: 4px;
  }
  .eq-bar {
    width: 100%; border-radius: 3px 3px 0 0;
    background: linear-gradient(to top, var(--orange), var(--amber));
    transition: height 0.15s ease;
    min-height: 4px;
  }
  .eq-label {
    font-family: var(--mono); font-size: 8px; color: var(--muted);
    letter-spacing: 0.05em;
  }
  .track-list { display: flex; flex-direction: column; gap: 8px; }
  .track-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 12px; border-radius: 8px;
    background: var(--surface2);
    border: 1px solid var(--border);
    transition: border-color 0.2s;
    cursor: pointer;
  }
  .track-item:hover { border-color: var(--border-hover); }
  .track-item.playing { border-color: rgba(240,123,32,0.35); background: rgba(240,123,32,0.05); }
  .track-num {
    font-family: var(--mono); font-size: 10px; color: var(--muted);
    width: 16px; text-align: center; flex-shrink: 0;
  }
  .track-item.playing .track-num { color: var(--orange); }
  .track-info { flex: 1; min-width: 0; }
  .track-name { font-size: 13px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .track-artist { font-size: 11px; color: var(--muted); }
  .track-dur { font-family: var(--mono); font-size: 11px; color: var(--muted); flex-shrink: 0; }
  .track-wave { display: flex; align-items: center; gap: 1px; height: 18px; flex-shrink: 0; }
  .track-wave-bar {
    width: 2px; border-radius: 1px;
    background: var(--orange);
    animation: wave-anim 0.8s ease-in-out infinite alternate;
  }
  .track-wave-bar:nth-child(1) { animation-delay: 0s; }
  .track-wave-bar:nth-child(2) { animation-delay: 0.12s; }
  .track-wave-bar:nth-child(3) { animation-delay: 0.24s; }
  .track-wave-bar:nth-child(4) { animation-delay: 0.36s; }
  @keyframes wave-anim {
    from { height: 4px; }
    to { height: 16px; }
  }
  .hero-bg-glow {
    position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 80% 70% at 50% 50%, rgba(240,123,32,0.04) 0%, transparent 70%);
  }

  /* ── SECTION LABELS ── */
  .section-wrap {
    max-width: 1160px; margin: 0 auto;
  }
  .section-header {
    display: flex; align-items: flex-end; justify-content: space-between;
    margin-bottom: 40px;
  }
  .section-kicker {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--orange);
    margin-bottom: 8px;
  }
  .section-title {
    font-family: var(--serif);
    font-size: clamp(32px, 4vw, 50px);
    font-weight: 900; color: var(--text);
    line-height: 1.0; letter-spacing: -0.02em;
  }
  .section-title em { font-style: italic; color: var(--amber); }
  .section-link {
    font-size: 12px; color: var(--muted); text-decoration: none;
    letter-spacing: 0.08em; text-transform: uppercase;
    border-bottom: 1px solid var(--border);
    padding-bottom: 2px;
    transition: color 0.2s, border-color 0.2s;
    white-space: nowrap;
    flex-shrink: 0; margin-bottom: 4px;
  }
  .section-link:hover { color: var(--text); border-color: rgba(255,255,255,0.3); }

  /* ── ARTISTS ── */
  .artists-section {
    padding: 100px 72px;
    background: linear-gradient(180deg, transparent 0%, rgba(240,123,32,0.02) 50%, transparent 100%);
  }
  .artists-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .artist-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
    cursor: pointer;
  }
  .artist-card:hover {
    border-color: var(--border-hover);
    transform: translateY(-6px);
    box-shadow: 0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(240,123,32,0.08);
  }
  .artist-vis {
    height: 220px; position: relative; overflow: hidden;
    background: #0c0a08;
  }
  .artist-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 30%, var(--surface) 100%);
    z-index: 1;
  }
  .artist-tag {
    position: absolute; top: 16px; left: 16px; z-index: 2;
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--orange);
    background: rgba(240,123,32,0.12);
    border: 1px solid rgba(240,123,32,0.22);
    padding: 4px 10px; border-radius: 100px;
  }
  .artist-body { padding: 20px 24px 24px; }
  .artist-meta {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 12px;
  }
  .artist-name {
    font-family: var(--serif);
    font-size: 26px; font-weight: 900;
    color: var(--text); line-height: 1.0;
    letter-spacing: -0.01em;
  }
  .artist-credits {
    display: flex; flex-direction: column; align-items: flex-end; gap: 3px;
    flex-shrink: 0; margin-left: 12px;
  }
  .artist-credits-num {
    font-family: var(--serif); font-size: 22px; font-weight: 900;
    color: var(--orange); line-height: 1;
  }
  .artist-credits-label {
    font-size: 10px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase;
  }
  .artist-genres {
    display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;
  }
  .genre-tag {
    font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--muted);
    border: 1px solid var(--border);
    padding: 3px 9px; border-radius: 4px;
  }
  .artist-desc {
    color: var(--text-2); font-size: 13px; line-height: 1.75;
    margin-bottom: 18px;
  }

  /* ── AUDIO PLAYER ── */
  .audio-player {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 11px 14px;
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 16px;
  }
  .play-btn {
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--orange); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 0 14px var(--orange-glow);
  }
  .play-btn:hover { transform: scale(1.1); box-shadow: 0 0 24px var(--orange-glow); }
  .play-icon { color: #fff; font-size: 11px; }
  .play-icon-pause { color: #fff; font-size: 13px; }
  .waveform {
    flex: 1; display: flex; align-items: center; gap: 2px; height: 30px; cursor: pointer;
  }
  .waveform-bar {
    flex: 1; border-radius: 2px;
    background: rgba(255,255,255,0.08);
    transition: background 0.15s;
    cursor: pointer;
  }
  .waveform-bar.played { background: rgba(240,123,32,0.45); }
  .waveform-bar.active { background: var(--orange); }
  .audio-time {
    font-family: var(--mono); font-size: 10px; color: var(--muted); white-space: nowrap;
  }
  .card-actions { display: flex; gap: 10px; }
  .card-btn {
    flex: 1; background: transparent; color: var(--text-2);
    border: 1px solid var(--border);
    padding: 10px; border-radius: 8px;
    font-family: var(--sans); font-size: 12px; font-weight: 500;
    cursor: pointer; letter-spacing: 0.04em; text-transform: uppercase;
    transition: all 0.2s; text-align: center;
  }
  .card-btn:hover { border-color: rgba(255,255,255,0.2); color: var(--text); background: rgba(255,255,255,0.04); }
  .card-btn-primary {
    flex: 1; background: rgba(240,123,32,0.1); color: var(--orange);
    border: 1px solid rgba(240,123,32,0.22);
    padding: 10px; border-radius: 8px;
    font-family: var(--sans); font-size: 12px; font-weight: 600;
    cursor: pointer; letter-spacing: 0.04em; text-transform: uppercase;
    transition: all 0.2s; text-align: center;
  }
  .card-btn-primary:hover { background: rgba(240,123,32,0.18); box-shadow: 0 0 16px rgba(240,123,32,0.1); }

  /* ── SERVICES STRIP ── */
  .services-strip {
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 20px 72px;
    display: flex; align-items: center; gap: 0;
    overflow: hidden;
  }
  .strip-item {
    display: flex; align-items: center; gap: 10px;
    padding: 0 32px; white-space: nowrap;
  }
  .strip-item + .strip-item { border-left: 1px solid var(--border); }
  .strip-dot { color: var(--orange); font-size: 16px; }
  .strip-text {
    font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--muted);
  }

  /* ── WORKFLOW ── */
  .workflow-section {
    padding: 100px 72px;
  }
  .workflow-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    margin-top: 56px;
  }
  .wf-step {
    background: var(--surface);
    padding: 36px 28px 32px;
    display: flex; flex-direction: column;
    transition: background 0.25s;
    position: relative; overflow: hidden;
  }
  .wf-step::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--orange);
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.3s ease;
  }
  .wf-step:hover { background: var(--surface2); }
  .wf-step:hover::before { transform: scaleX(1); }
  .wf-num {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em;
    color: var(--muted); margin-bottom: 20px;
    text-transform: uppercase;
  }
  .wf-icon { font-size: 28px; margin-bottom: 16px; }
  .wf-name {
    font-family: var(--serif); font-size: 21px; font-weight: 900;
    color: var(--text); margin-bottom: 10px; letter-spacing: -0.01em;
  }
  .wf-desc {
    color: var(--muted); font-size: 13px; line-height: 1.7;
    flex: 1;
  }

  /* ── CONTACT ── */
  .contact-section {
    padding: 100px 72px;
    background: linear-gradient(180deg, transparent 0%, rgba(240,123,32,0.025) 50%, transparent 100%);
  }
  .contact-layout {
    display: grid; grid-template-columns: 1fr 1.1fr; gap: 48px;
    align-items: start;
  }
  .contact-left { padding-top: 8px; }
  .contact-details { margin-top: 40px; display: flex; flex-direction: column; gap: 16px; }
  .contact-item {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  .contact-icon {
    width: 36px; height: 36px; border-radius: 8px;
    background: var(--orange-dim);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .contact-item-label {
    font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 2px;
  }
  .contact-item-val { font-size: 14px; color: var(--text); font-weight: 500; }

  .contact-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 36px 36px 32px;
    position: relative; overflow: hidden;
  }
  .contact-card::after {
    content: '';
    position: absolute; bottom: -60px; right: -60px;
    width: 180px; height: 180px; border-radius: 50%;
    background: radial-gradient(circle, rgba(240,123,32,0.06), transparent 70%);
    pointer-events: none;
  }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .form-label {
    font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--muted);
  }
  .form-input, .form-textarea, .form-select {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 8px; padding: 11px 14px;
    color: var(--text); font-family: var(--sans); font-size: 14px;
    outline: none; width: 100%;
    transition: border-color 0.2s, box-shadow 0.2s;
    -webkit-appearance: none;
  }
  .form-input::placeholder, .form-textarea::placeholder { color: #333; }
  .form-input:focus, .form-textarea:focus, .form-select:focus {
    border-color: rgba(240,123,32,0.4);
    box-shadow: 0 0 0 3px rgba(240,123,32,0.06);
  }
  .form-textarea { resize: vertical; min-height: 100px; }
  .form-select { color: var(--text-2); cursor: pointer; }
  .form-select option { background: var(--surface2); color: var(--text); }
  .btn-send {
    width: 100%; background: var(--orange); color: #fff; border: none;
    padding: 14px; border-radius: 8px;
    font-family: var(--sans); font-size: 14px; font-weight: 600;
    cursor: pointer; letter-spacing: 0.04em;
    margin-top: 4px;
    transition: all 0.2s;
    box-shadow: 0 4px 24px var(--orange-glow);
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .btn-send:hover:not(:disabled) { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 8px 40px var(--orange-glow); }
  .btn-send:disabled { opacity: 0.6; cursor: default; }
  .btn-send.success { background: #2e7d52; box-shadow: 0 4px 24px rgba(46,125,82,0.3); }

  /* ── FOOTER ── */
  .footer {
    border-top: 1px solid var(--border);
    padding: 32px 72px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .footer-logo {
    font-family: var(--serif); font-size: 16px; font-weight: 700;
    color: var(--muted);
  }
  .footer-copy { font-size: 12px; color: var(--muted); }
  .footer-links { display: flex; gap: 24px; }
  .footer-links a {
    font-size: 12px; color: var(--muted); text-decoration: none;
    transition: color 0.2s;
  }
  .footer-links a:hover { color: var(--text); }

  /* ── DIVIDER ── */
  .divider { height: 1px; background: var(--border); }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.65s ease forwards; }
  .d1 { animation-delay: 0.05s; opacity: 0; }
  .d2 { animation-delay: 0.15s; opacity: 0; }
  .d3 { animation-delay: 0.25s; opacity: 0; }
  .d4 { animation-delay: 0.35s; opacity: 0; }
  .d5 { animation-delay: 0.45s; opacity: 0; }

  @media (max-width: 900px) {
    .nav { padding: 0 24px; }
    .nav-links { display: none; }
    .hero { grid-template-columns: 1fr; }
    .hero-left { padding: 100px 28px 60px; }
    .hero-right { display: none; }
    .artists-section, .workflow-section, .contact-section { padding: 70px 28px; }
    .artists-grid { grid-template-columns: 1fr; }
    .workflow-grid { grid-template-columns: 1fr 1fr; }
    .contact-layout { grid-template-columns: 1fr; }
    .contact-left { display: none; }
    .footer { flex-direction: column; gap: 16px; padding: 24px 28px; text-align: center; }
    .footer-links { justify-content: center; }
    .services-strip { padding: 16px 28px; }
    .form-row { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .workflow-grid { grid-template-columns: 1fr; }
  }
`;

function AnimatedEQ({ playing }: { playing: boolean }) {
  const freqs = ["60", "160", "400", "1k", "2.5k", "6k", "16k"];
  const baseHeights = [55, 75, 65, 90, 70, 80, 50];
  const [heights, setHeights] = useState(baseHeights);

  useEffect(() => {
    if (!playing) { setHeights(baseHeights); return; }
    const id = setInterval(() => {
      setHeights(baseHeights.map(h => Math.max(15, h + (Math.random() - 0.5) * 40)));
    }, 140);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <div className="eq-container">
      {heights.map((h, i) => (
        <div key={i} className="eq-bar-wrap">
          <div className="eq-bar" style={{ height: `${h}%`, transition: playing ? "height 0.13s ease" : "none" }} />
          <span className="eq-label">{freqs[i]}</span>
        </div>
      ))}
    </div>
  );
}

function Waveform({ playing, progress }: { playing: boolean; progress: number }) {
  const heights = [30,55,70,45,80,60,40,65,75,50,85,45,60,70,35,55,80,65,40,70,50,60,45,75,55,40,65,80,55,70];
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setActiveIdx(i => (i + 1) % heights.length), 120);
    return () => clearInterval(id);
  }, [playing]);

  const played = Math.floor(progress * heights.length);

  return (
    <div className="waveform">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`waveform-bar${i === activeIdx && playing ? " active" : i < played ? " played" : ""}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function ArtistCard({ name, sceneColor, tag, genres, credits, delay }: {
  name: string; sceneColor: string; tag: string;
  genres: string[]; credits: number; delay: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const total = 225;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggle = () => {
    if (playing) { clearInterval(timerRef.current!); setPlaying(false); }
    else {
      setPlaying(true);
      timerRef.current = setInterval(() => setTime(t => (t + 1) % total), 1000);
    }
  };
  useEffect(() => () => clearInterval(timerRef.current!), []);
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="artist-card fade-up" style={{ animationDelay: delay, opacity: 0 }}>
      <div className="artist-vis">
        <span className="artist-tag">{tag}</span>
        {name === "Karan Aujla" ? (
          <svg width="100%" height="100%" viewBox="0 0 460 220" preserveAspectRatio="xMidYMid slice"
            style={{ position: "absolute", inset: 0 }}>
            <defs>
              <radialGradient id="ka-bg" cx="38%" cy="0%" r="90%">
                <stop offset="0%" stopColor="#2a1500" />
                <stop offset="100%" stopColor="#0a0704" />
              </radialGradient>
              <radialGradient id="ka-spot" cx="38%" cy="10%" r="55%">
                <stop offset="0%" stopColor="#f07b20" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#f07b20" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="ka-body" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a1008" />
                <stop offset="100%" stopColor="#0d0905" />
              </linearGradient>
              <clipPath id="ka-clip">
                <rect width="460" height="220" />
              </clipPath>
            </defs>
            <rect width="460" height="220" fill="url(#ka-bg)" />
            <rect width="460" height="220" fill="url(#ka-spot)" />
            {/* Abstract city/skyline bg */}
            {[0,1,2,3,4,5,6,7,8].map(i => (
              <rect key={i} x={i * 58 + 10} y={100 + (i % 3) * 18} width={36 + (i%2)*10} height={120 - (i%3)*18}
                fill="#f07b20" fillOpacity={0.03 + (i%2)*0.02} />
            ))}
            {/* Horizontal lines — studio grid */}
            {[0,1,2,3].map(i => (
              <line key={i} x1="0" y1={55 + i * 40} x2="460" y2={55 + i * 40}
                stroke="#f07b20" strokeOpacity={0.04} strokeWidth="1" />
            ))}
            {/* Figure — stylized silhouette with turban */}
            {/* Body */}
            <ellipse cx="175" cy="310" rx="72" ry="110" fill="#0f0a06" clipPath="url(#ka-clip)" />
            {/* Jacket */}
            <path d="M130 220 Q140 160 175 150 Q210 160 220 220 L230 230 H120 Z"
              fill="#1a1008" clipPath="url(#ka-clip)" />
            {/* Chain */}
            <path d="M162 160 Q175 178 188 160" fill="none" stroke="#f07b20" strokeOpacity="0.55" strokeWidth="1.5" />
            <circle cx="175" cy="178" r="3" fill="#f07b20" fillOpacity="0.6" />
            {/* Neck */}
            <rect x="168" y="127" width="14" height="26" rx="5" fill="#c08040" />
            {/* Head */}
            <ellipse cx="175" cy="118" rx="22" ry="24" fill="#c08040" />
            {/* Ear */}
            <ellipse cx="153" cy="119" rx="4" ry="6" fill="#b07030" />
            <ellipse cx="197" cy="119" rx="4" ry="6" fill="#b07030" />
            {/* Eyes */}
            <ellipse cx="167" cy="114" rx="3.5" ry="2.5" fill="#1a0e06" />
            <ellipse cx="183" cy="114" rx="3.5" ry="2.5" fill="#1a0e06" />
            {/* Eye shine */}
            <circle cx="168.5" cy="113" r="1" fill="rgba(255,255,255,0.5)" />
            <circle cx="184.5" cy="113" r="1" fill="rgba(255,255,255,0.5)" />
            {/* Nose */}
            <path d="M173 118 Q175 124 177 118" fill="none" stroke="#8a5020" strokeWidth="1.2" />
            {/* Mouth - slight smirk */}
            <path d="M169 125 Q175 129 181 125" fill="none" stroke="#8a5020" strokeWidth="1.5" strokeLinecap="round" />
            {/* Beard */}
            <path d="M156 124 Q157 138 175 142 Q193 138 194 124" fill="#3a2010" fillOpacity="0.85" />
            <path d="M163 131 Q175 140 187 131" fill="#2a1608" fillOpacity="0.6" />
            {/* Mustache */}
            <path d="M165 123 Q175 127 185 123" fill="#2a1608" fillOpacity="0.8" />
            {/* Turban — Karan's signature */}
            <path d="M153 103 Q155 75 175 70 Q195 75 197 103 Q185 95 175 96 Q165 95 153 103Z"
              fill="#1a0f05" />
            <path d="M153 103 Q160 88 175 85 Q190 88 197 103" fill="none" stroke="#f07b20" strokeOpacity="0.3" strokeWidth="1" />
            {/* Turban wrap lines */}
            {[0,1,2,3].map(i => (
              <path key={i}
                d={`M${155+i*2} ${101-i*7} Q175 ${78-i*4} ${195-i*2} ${101-i*7}`}
                fill="none" stroke="#f07b20" strokeOpacity={0.08 + i*0.04} strokeWidth="0.8" />
            ))}
            {/* Tattoos on arm hint */}
            <path d="M130 175 Q128 180 131 185" stroke="#f07b20" strokeOpacity="0.2" strokeWidth="1.5" fill="none" />
            {/* Mic in hand */}
            <rect x="108" y="155" width="10" height="28" rx="5" fill="#2a1a0a" stroke="#f07b20" strokeOpacity="0.3" strokeWidth="1" />
            <ellipse cx="113" cy="152" rx="8" ry="10" fill="#1e1208" stroke="#f07b20" strokeOpacity="0.4" strokeWidth="1" />
            {/* Mic grille lines */}
            {[0,1,2].map(i => (
              <line key={i} x1="106" y1={147+i*4} x2="120" y2={147+i*4}
                stroke="#f07b20" strokeOpacity="0.2" strokeWidth="0.8" />
            ))}
            {/* Stage floor reflection */}
            <rect x="0" y="215" width="460" height="6" fill="#f07b20" fillOpacity="0.05" />
            {/* Glow under figure */}
            <ellipse cx="175" cy="220" rx="80" ry="12" fill="#f07b20" fillOpacity="0.06" />
            {/* Right side — text/typography art */}
            <text x="300" y="80" fontFamily="serif" fontSize="56" fontWeight="900"
              fill="#f07b20" fillOpacity="0.06" letterSpacing="-2">KA</text>
            <text x="290" y="140" fontFamily="monospace" fontSize="9" fill="#f07b20" fillOpacity="0.25"
              letterSpacing="3">PUNJABI · HIP HOP</text>
            <text x="290" y="158" fontFamily="monospace" fontSize="9" fill="#f07b20" fillOpacity="0.18"
              letterSpacing="3">VANCOUVER · BC</text>
            <text x="290" y="176" fontFamily="monospace" fontSize="9" fill="#f07b20" fillOpacity="0.18"
              letterSpacing="3">EST. 2016</text>
            {/* Decorative vertical line */}
            <line x1="280" y1="60" x2="280" y2="210" stroke="#f07b20" strokeOpacity="0.08" strokeWidth="1" />
            {/* Orange accent bars */}
            <rect x="290" y="192" width="40" height="2" rx="1" fill="#f07b20" fillOpacity="0.4" />
            <rect x="290" y="198" width="24" height="2" rx="1" fill="#f07b20" fillOpacity="0.2" />
          </svg>
        ) : (
          <svg width="100%" height="100%" viewBox="0 0 460 220" preserveAspectRatio="xMidYMid slice"
            style={{ position: "absolute", inset: 0 }}>
            <defs>
              <radialGradient id="sm-bg" cx="38%" cy="0%" r="90%">
                <stop offset="0%" stopColor="#1a1200" />
                <stop offset="100%" stopColor="#080706" />
              </radialGradient>
              <radialGradient id="sm-spot" cx="38%" cy="5%" r="60%">
                <stop offset="0%" stopColor="#d4902a" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#d4902a" stopOpacity="0" />
              </radialGradient>
              <clipPath id="sm-clip">
                <rect width="460" height="220" />
              </clipPath>
            </defs>
            <rect width="460" height="220" fill="url(#sm-bg)" />
            <rect width="460" height="220" fill="url(#sm-spot)" />
            {/* Punjab landscape hint — wheat fields */}
            {[0,1,2,3,4,5,6,7].map(i => (
              <path key={i}
                d={`M${i*62} 220 Q${i*62+10} ${170+(i%3)*12} ${i*62+20} 220`}
                fill="#d4902a" fillOpacity={0.04 + (i%2)*0.02} />
            ))}
            {/* Grid lines */}
            {[0,1,2,3].map(i => (
              <line key={i} x1="0" y1={50 + i * 45} x2="460" y2={50 + i * 45}
                stroke="#d4902a" strokeOpacity="0.04" strokeWidth="1" />
            ))}
            {/* Body mass */}
            <ellipse cx="175" cy="310" rx="80" ry="110" fill="#100e08" clipPath="url(#sm-clip)" />
            {/* Jacket — waistcoat style */}
            <path d="M125 220 Q138 158 175 148 Q212 158 225 220 L235 230 H115 Z"
              fill="#1a1608" clipPath="url(#sm-clip)" />
            {/* Waistcoat pattern lines */}
            {[0,1,2].map(i => (
              <path key={i} d={`M${158+i*6} 165 L${158+i*6} 215`}
                stroke="#d4902a" strokeOpacity="0.1" strokeWidth="0.8" />
            ))}
            {/* Neck */}
            <rect x="167" y="126" width="16" height="25" rx="5" fill="#b07830" />
            {/* Head — fuller/rounder */}
            <ellipse cx="175" cy="112" rx="26" ry="28" fill="#b07830" />
            {/* Ears */}
            <ellipse cx="149" cy="113" rx="5" ry="7" fill="#9a6820" />
            <ellipse cx="201" cy="113" rx="5" ry="7" fill="#9a6820" />
            {/* Eyes — more intense */}
            <ellipse cx="166" cy="108" rx="4" ry="3" fill="#180e04" />
            <ellipse cx="184" cy="108" rx="4" ry="3" fill="#180e04" />
            <circle cx="167.5" cy="107" r="1.2" fill="rgba(255,255,255,0.5)" />
            <circle cx="185.5" cy="107" r="1.2" fill="rgba(255,255,255,0.5)" />
            {/* Nose */}
            <path d="M172 113 Q175 120 178 113" fill="none" stroke="#7a4a10" strokeWidth="1.5" />
            {/* Mouth — serious expression */}
            <path d="M168 122 Q175 124 182 122" fill="none" stroke="#7a4a10" strokeWidth="1.5" strokeLinecap="round" />
            {/* Dense beard — Sidhu's signature */}
            <path d="M151 118 Q152 146 175 152 Q198 146 199 118 Q190 125 175 127 Q160 125 151 118Z"
              fill="#2a1a08" fillOpacity="0.9" />
            {/* Beard texture */}
            {[-6,-3,0,3,6].map(i => (
              <path key={i}
                d={`M${175+i} 127 L${175+i*1.1} 148`}
                stroke="#1a1004" strokeWidth="1.2" strokeOpacity="0.5" />
            ))}
            {/* Mustache */}
            <path d="M162 119 Q168 123 175 121 Q182 123 188 119"
              fill="#2a1808" fillOpacity="0.85" />
            {/* Hair — wavy on sides */}
            <path d="M149 100 Q150 84 160 80 Q175 77 190 80 Q200 84 201 100"
              fill="#1a1006" />
            <path d="M149 100 Q146 88 152 82 Q162 75 175 73 Q188 75 198 82 Q204 88 201 100"
              fill="#120c04" />
            {/* Hair detail lines */}
            {[-2,-1,0,1,2].map(i => (
              <path key={i}
                d={`M${155+i*4} 82 Q${158+i*4} 78 ${162+i*4} 80`}
                fill="none" stroke="#d4902a" strokeOpacity="0.06" strokeWidth="0.8" />
            ))}
            {/* Patka / bandana */}
            <path d="M149 96 Q155 82 175 79 Q195 82 201 96 Q190 90 175 91 Q160 90 149 96Z"
              fill="#8B0000" fillOpacity="0.6" />
            {/* Bandana knot at back */}
            <path d="M195 90 Q205 86 208 92 Q205 96 198 94Z" fill="#8B0000" fillOpacity="0.5" />
            {/* Gold chain */}
            <path d="M160 152 Q175 170 190 152" fill="none" stroke="#d4902a" strokeOpacity="0.65" strokeWidth="2" />
            <circle cx="175" cy="170" r="4" fill="#d4902a" fillOpacity="0.7" />
            <circle cx="160" cy="152" r="2.5" fill="#d4902a" fillOpacity="0.5" />
            <circle cx="190" cy="152" r="2.5" fill="#d4902a" fillOpacity="0.5" />
            {/* Glow */}
            <ellipse cx="175" cy="220" rx="85" ry="14" fill="#d4902a" fillOpacity="0.05" />
            <rect x="0" y="214" width="460" height="6" fill="#d4902a" fillOpacity="0.04" />
            {/* Right side info art */}
            <text x="298" y="82" fontFamily="serif" fontSize="56" fontWeight="900"
              fill="#d4902a" fillOpacity="0.06" letterSpacing="-2">SM</text>
            <text x="288" y="142" fontFamily="monospace" fontSize="9" fill="#d4902a" fillOpacity="0.28"
              letterSpacing="3">DESI POP · RAP</text>
            <text x="288" y="160" fontFamily="monospace" fontSize="9" fill="#d4902a" fillOpacity="0.2"
              letterSpacing="3">MOOSA · PUNJAB</text>
            <text x="288" y="178" fontFamily="monospace" fontSize="9" fill="#d4902a" fillOpacity="0.2"
              letterSpacing="3">EST. 2017</text>
            <line x1="278" y1="60" x2="278" y2="210" stroke="#d4902a" strokeOpacity="0.08" strokeWidth="1" />
            <rect x="288" y="194" width="44" height="2" rx="1" fill="#d4902a" fillOpacity="0.4" />
            <rect x="288" y="200" width="26" height="2" rx="1" fill="#d4902a" fillOpacity="0.2" />
          </svg>
        )}
        <div className="artist-overlay" />
      </div>
      <div className="artist-body">
        <div className="artist-meta">
          <div className="artist-name">{name}</div>
          <div className="artist-credits">
            <div className="artist-credits-num">{credits}+</div>
            <div className="artist-credits-label">Credits</div>
          </div>
        </div>
        <div className="artist-genres">
          {genres.map(g => <span key={g} className="genre-tag">{g}</span>)}
        </div>
        <p className="artist-desc">
          Precision-crafted productions bridging raw artistry and commercial polish.
          From tracking to final master, every element placed with intention.
        </p>
        <div className="audio-player">
          <button className="play-btn" onClick={toggle}>
            {playing
              ? <span className="play-icon-pause">⏸</span>
              : <span className="play-icon" style={{ marginLeft: 2 }}>▶</span>}
          </button>
          <Waveform playing={playing} progress={time / total} />
          <span className="audio-time">{fmt(time)}&thinsp;/&thinsp;3:45</span>
        </div>
        <div className="card-actions">
          <button className="card-btn">Portfolio</button>
          <button className="card-btn-primary">Book Session →</button>
        </div>
      </div>
    </div>
  );
}

export default function MusicProductionPage() {
  const [form, setForm] = useState({ name: "", email: "", type: "", details: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSend = () => {
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); setTimeout(() => setSent(false), 3500); }, 1400);
  };

  const tracks = [
    { name: "Night Drive", artist: "Karan Aujla", dur: "3:24" },
    { name: "Vasl", artist: "Sidhu Moose Wala", dur: "4:02" },
    { name: "Levels", artist: "Session Demo", dur: "2:58" },
  ];
  const [activeTrack, setActiveTrack] = useState(1);

  return (
    <>
      <style>{style}</style>


      {/* HERO */}
      <section className="hero" id="services">
        <div className="hero-bg" />
        <div className="hero-grid-lines" />

        <div className="hero-left">
          <div className="hero-eyebrow fade-up d1">
            <div className="hero-eyebrow-dot" />
            <span className="hero-eyebrow-text">Professional Music Production</span>
          </div>
          <h1 className="hero-title fade-up d2">
            <span>Where Sound</span>
            <em>Becomes Art</em>
          </h1>
          <p className="hero-desc fade-up d3">
            From beatmaking to full orchestrations — we craft industry-ready tracks
            that carry emotional weight, commercial clarity, and a sound uniquely yours.
          </p>
          <div className="hero-actions fade-up d4">
            <button className="btn-primary" onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}>
              Start Your Project →
            </button>
            <button className="btn-ghost" onClick={() => document.getElementById("artists")?.scrollIntoView({ behavior: "smooth" })}>
              Hear Our Work
            </button>
          </div>
          <div className="hero-stats fade-up d5">
            <div className="hero-stat">
              <div className="hero-stat-num">12<span>k+</span></div>
              <div className="hero-stat-label">Tracks Delivered</div>
            </div>
            <div className="hero-stat" style={{ paddingLeft: 28 }}>
              <div className="hero-stat-num">340<span>+</span></div>
              <div className="hero-stat-label">Artist Credits</div>
            </div>
            <div className="hero-stat" style={{ paddingLeft: 28 }}>
              <div className="hero-stat-num">8</div>
              <div className="hero-stat-label">Years Active</div>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-bg-glow" />
          <div className="hero-console">
            <div className="console-header">
              <div className="console-dot" style={{ background: "#ff5f57" }} />
              <div className="console-dot" style={{ background: "#febc2e" }} />
              <div className="console-dot" style={{ background: "#28c840" }} />
              <span className="console-label">Studio Session · Live</span>
            </div>
            <div className="console-body">
              <AnimatedEQ playing={activeTrack >= 0} />
              <div className="track-list">
                {tracks.map((t, i) => (
                  <div key={i}
                    className={`track-item${activeTrack === i ? " playing" : ""}`}
                    onClick={() => setActiveTrack(i)}>
                    <span className="track-num">
                      {activeTrack === i
                        ? <span className="track-wave">
                            {[1,2,3,4].map(j => <span key={j} className="track-wave-bar" />)}
                          </span>
                        : String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="track-info">
                      <div className="track-name">{t.name}</div>
                      <div className="track-artist">{t.artist}</div>
                    </div>
                    <span className="track-dur">{t.dur}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STRIP */}
      <div className="services-strip">
        {["Beat Production", "Mixing & Mastering", "Session Recording", "Film Scoring", "Vocal Production", "Sound Design"].map((s, i) => (
          <div key={i} className="strip-item">
            <span className="strip-dot">✦</span>
            <span className="strip-text">{s}</span>
          </div>
        ))}
      </div>

      {/* ARTISTS */}
      <section className="artists-section" id="artists">
        <div className="section-wrap">
          <div className="section-header">
            <div>
              <div className="section-kicker">Featured Collaborations</div>
              <div className="section-title">Artists We've <em>Worked With</em></div>
            </div>
            <a href="#" className="section-link">View All →</a>
          </div>
          <div className="artists-grid">
            <ArtistCard
              name="Karan Aujla"
              sceneColor="#f07b20"
              tag="Punjabi Hip-Hop"
              genres={["Hip-Hop", "Trap", "Drill"]}
              credits={80}
              delay="0.05s"
            />
            <ArtistCard
              name="Sidhu Moose Wala"
              sceneColor="#c87a30"
              tag="Desi Pop"
              genres={["Pop", "Folk Fusion", "Rap"]}
              credits={120}
              delay="0.18s"
            />
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* WORKFLOW */}
      <section className="workflow-section" id="workflow">
        <div className="section-wrap">
          <div className="section-header">
            <div>
              <div className="section-kicker">Our Process</div>
              <div className="section-title">From Concept <em>to Master</em></div>
            </div>
          </div>
          <div className="workflow-grid">
            {[
              { icon: "🎵", name: "Composition", step: "Step 01", desc: "Developing themes, melodies, and harmonic structures that define your unique creative signature." },
              { icon: "🎸", name: "Arrangement", step: "Step 02", desc: "Orchestrating instrumentation and song structure for maximum emotional impact and flow." },
              { icon: "🎙", name: "Tracking",    step: "Step 03", desc: "High-fidelity recording of vocals and live instruments using world-class preamps and microphones." },
              { icon: "✦",  name: "Final Polish",step: "Step 04", desc: "Meticulous editing and refinement — preparing your tracks for the mixing and mastering stage." },
            ].map((s, i) => (
              <div className="wf-step" key={i}>
                <div className="wf-num">{s.step}</div>
                <div className="wf-icon">{s.icon}</div>
                <div className="wf-name">{s.name}</div>
                <p className="wf-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* CONTACT */}
      <section className="contact-section" id="contact">
        <div className="section-wrap">
          <div className="contact-layout">
            <div className="contact-left">
              <div className="section-kicker">Get in Touch</div>
              <div className="section-title">Let's Build<br /><em>Something</em></div>
              <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.8, marginTop: 16, maxWidth: 340 }}>
                Ready to start your next project? Whether it's one track or a full album,
                we're here to make your vision sound exactly as you imagined it.
              </p>
              <div className="contact-details">
                {[
                  { icon: "📍", label: "Studio", val: "sri ganganagar rajasthan" },
                  { icon: "📧", label: "Email", val: "hello@resonance.studio" },
                  { icon: "📞", label: "Phone", val: "+91 98765 43210" },
                ].map((c, i) => (
                  <div key={i} className="contact-item">
                    <div className="contact-icon">{c.icon}</div>
                    <div>
                      <div className="contact-item-label">{c.label}</div>
                      <div className="contact-item-val">{c.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="contact-card">
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Name</label>
                  <input className="form-input" type="text" name="name" placeholder="Your name"
                    value={form.name} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" name="email" placeholder="your@email.com"
                    value={form.email} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Project Type</label>
                <select className="form-select" name="type" value={form.type} onChange={handleChange}>
                  <option value="" disabled>Select a service…</option>
                  <option value="beat">Beat Production</option>
                  <option value="mix">Mixing & Mastering</option>
                  <option value="record">Session Recording</option>
                  <option value="film">Film / Sync</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Project Details</label>
                <textarea className="form-textarea" name="details" placeholder="Tell us about your project — genre, timeline, references…"
                  value={form.details} onChange={handleChange} />
              </div>
              <button
                className={`btn-send${sent ? " success" : ""}`}
                onClick={handleSend}
                disabled={sending || sent}
              >
                {sent ? "✓  Message Received" : sending ? "Sending…" : "Send Message →"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      
    </>
  );
}