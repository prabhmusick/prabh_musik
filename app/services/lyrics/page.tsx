'use client';
import { useState, useEffect, useRef } from "react";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,700;0,800;1,400;1,500;1,700&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #080807;
    --surface: #101010;
    --surface2: #161614;
    --surface3: #1c1c1a;
    --border: rgba(255,255,255,0.06);
    --border-warm: rgba(240,123,32,0.18);
    --orange: #f07b20;
    --orange-dim: rgba(240,123,32,0.1);
    --orange-glow: rgba(240,123,32,0.22);
    --amber: #d4902a;
    --cream: #f0ece4;
    --cream-2: #b8b2a8;
    --muted: #5a5752;
    --serif: 'EB Garamond', Georgia, serif;
    --sans: 'DM Sans', sans-serif;
    --mono: 'DM Mono', monospace;
  }

  html { scroll-behavior: smooth; }
  body {
    background: var(--bg);
    color: var(--cream);
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
    padding: 0 56px; height: 64px;
    border-bottom: 1px solid var(--border);
    background: rgba(8,8,7,0.9);
    backdrop-filter: blur(20px);
  }
  .nav-left { display: flex; align-items: center; gap: 14px; }
  .nav-logo {
    font-family: var(--serif); font-size: 19px; font-weight: 700;
    color: var(--cream); text-decoration: none; letter-spacing: 0.01em;
  }
  .nav-sep { color: var(--muted); font-size: 16px; }
  .nav-service {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
    color: var(--orange); text-transform: uppercase;
    border: 1px solid rgba(240,123,32,0.25);
    padding: 3px 9px; border-radius: 4px;
    background: rgba(240,123,32,0.06);
  }
  .nav-links { display: flex; list-style: none; gap: 2px; }
  .nav-links a {
    color: var(--muted); text-decoration: none;
    font-size: 13px; padding: 6px 15px; border-radius: 6px;
    transition: color 0.2s, background 0.2s;
    display: block;
  }
  .nav-links a:hover { color: var(--cream); background: rgba(255,255,255,0.04); }
  .nav-cta {
    background: var(--orange); color: #fff; border: none;
    padding: 9px 20px; border-radius: 6px;
    font-family: var(--sans); font-size: 13px; font-weight: 500;
    cursor: pointer; letter-spacing: 0.02em;
    transition: opacity 0.2s, transform 0.2s;
    box-shadow: 0 0 18px var(--orange-glow);
  }
  .nav-cta:hover { opacity: 0.88; transform: translateY(-1px); }

  /* ── HERO ── */
  .hero {
    position: relative;
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding-top: 24px;
    overflow: hidden;
  }
  .hero-bg {
    position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 50% 70% at 72% 42%, rgba(240,123,32,0.055) 0%, transparent 65%),
      radial-gradient(ellipse 30% 50% at 15% 75%, rgba(240,123,32,0.025) 0%, transparent 55%);
  }
  .hero-ruled {
    position: absolute; inset: 0; pointer-events: none;
    background-image: repeating-linear-gradient(
      transparent, transparent 31px,
      rgba(255,255,255,0.025) 31px, rgba(255,255,255,0.025) 32px
    );
  }
  .hero-left {
    position: relative; z-index: 1;
    padding: 36px 56px 80px 72px;
    display: flex; flex-direction: column; justify-content: center;
    border-right: 1px solid var(--border);
  }
  .hero-label {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--orange);
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 32px;
  }
  .hero-label::before { content: ''; display: block; width: 28px; height: 1px; background: var(--orange); }
  .hero-title {
    font-family: var(--serif);
    font-size: clamp(46px, 5.5vw, 76px);
    font-weight: 800;
    line-height: 0.96;
    letter-spacing: -0.02em;
    color: var(--cream);
    margin-bottom: 10px;
  }
  .hero-title-italic {
    font-family: var(--serif);
    font-style: italic;
    font-size: clamp(40px, 5vw, 68px);
    font-weight: 500;
    color: var(--orange);
    display: block; margin-bottom: 28px;
    letter-spacing: -0.01em;
  }
  .hero-desc {
    color: var(--cream-2); font-size: 15px; line-height: 1.85;
    max-width: 380px; margin-bottom: 40px;
  }
  .hero-actions { display: flex; gap: 12px; }
  .btn-primary {
    background: var(--orange); color: #fff; border: none;
    padding: 13px 28px; border-radius: 7px;
    font-family: var(--sans); font-size: 14px; font-weight: 600;
    cursor: pointer; letter-spacing: 0.02em;
    transition: all 0.2s;
    box-shadow: 0 4px 26px var(--orange-glow);
  }
  .btn-primary:hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 10px 42px var(--orange-glow); }
  .btn-ghost {
    background: transparent; color: var(--cream-2);
    border: 1px solid var(--border);
    padding: 13px 24px; border-radius: 7px;
    font-family: var(--sans); font-size: 14px;
    cursor: pointer; transition: all 0.2s;
  }
  .btn-ghost:hover { border-color: rgba(255,255,255,0.18); color: var(--cream); background: rgba(255,255,255,0.03); }

  /* Hero right — typewriter lyric manuscript */
  .hero-right {
    position: relative; z-index: 1;
    display: flex; align-items: center; justify-content: center;
    padding: 60px 48px;
    background: rgba(255,255,255,0.012);
  }
  .manuscript {
    width: 100%; max-width: 420px;
    position: relative;
  }
  .ms-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }
  .ms-title-group { display: flex; flex-direction: column; gap: 3px; }
  .ms-song-name {
    font-family: var(--serif); font-size: 20px; font-weight: 700;
    color: var(--cream); letter-spacing: 0.01em;
  }
  .ms-artist {
    font-family: var(--mono); font-size: 10px; color: var(--muted); letter-spacing: 0.1em;
  }
  .ms-status {
    display: flex; align-items: center; gap: 6px;
    font-family: var(--mono); font-size: 10px; color: var(--orange); letter-spacing: 0.08em;
  }
  .ms-status-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--orange);
    animation: blink 1.1s ease-in-out infinite;
  }
  @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }

  .ms-section-label {
    font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--orange);
    margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
  }
  .ms-section-label::after { content: ''; flex: 1; height: 1px; background: rgba(240,123,32,0.15); }

  .ms-verse {
    margin-bottom: 24px;
  }
  .ms-line {
    font-family: var(--serif);
    font-size: 17px;
    font-style: italic;
    color: var(--cream);
    line-height: 1.75;
    min-height: 1.75em;
    display: block;
  }
  .ms-line.muted-line { color: var(--muted); }
  .ms-cursor {
    display: inline-block;
    width: 2px; height: 1em;
    background: var(--orange);
    vertical-align: text-bottom;
    animation: cursor-blink 0.7s step-end infinite;
  }
  @keyframes cursor-blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

  .ms-chorus {
    margin-bottom: 24px;
    padding: 16px 18px;
    background: rgba(240,123,32,0.05);
    border-left: 2px solid var(--orange);
    border-radius: 0 8px 8px 0;
  }
  .ms-chorus .ms-line { color: var(--cream); }

  .ms-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 16px; border-top: 1px solid var(--border);
  }
  .ms-progress-wrap { flex: 1; margin-right: 16px; }
  .ms-progress-label {
    font-family: var(--mono); font-size: 9px; color: var(--muted);
    letter-spacing: 0.08em; margin-bottom: 6px;
    display: flex; justify-content: space-between;
  }
  .ms-progress-bar {
    height: 3px; background: var(--border); border-radius: 2px; overflow: hidden;
  }
  .ms-progress-fill {
    height: 100%; background: var(--orange); border-radius: 2px;
    transition: width 0.4s ease;
  }
  .ms-page {
    font-family: var(--mono); font-size: 10px; color: var(--muted); letter-spacing: 0.06em;
  }

  /* ── TAGLINE STRIP ── */
  .strip {
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 16px 0;
    display: flex; align-items: center; gap: 0;
    overflow: hidden;
    background: rgba(240,123,32,0.015);
  }
  .strip-track {
    display: flex; align-items: center; gap: 48px;
    animation: scroll-left 22s linear infinite;
    white-space: nowrap; padding-right: 48px;
    flex-shrink: 0;
  }
  @keyframes scroll-left {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  .strip-item {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--muted);
    display: flex; align-items: center; gap: 16px;
    flex-shrink: 0;
  }
  .strip-item span { color: var(--orange); font-size: 14px; }

  /* ── CAPABILITIES ── */
  .capabilities {
    padding: 100px 72px;
    max-width: 1200px; margin: 0 auto;
  }
  .cap-header {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 48px; align-items: end; margin-bottom: 64px;
  }
  .section-kicker {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--orange); margin-bottom: 10px;
  }
  .section-title {
    font-family: var(--serif);
    font-size: clamp(32px, 4vw, 52px);
    font-weight: 800; color: var(--cream);
    line-height: 1.0; letter-spacing: -0.02em;
  }
  .section-title em { font-style: italic; color: var(--amber); }
  .cap-intro {
    color: var(--cream-2); font-size: 15px; line-height: 1.8;
    align-self: flex-end;
  }
  .cap-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  }
  .cap-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px; overflow: hidden;
    transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
    cursor: default;
  }
  .cap-card:hover {
    border-color: var(--border-warm);
    transform: translateY(-4px);
    box-shadow: 0 20px 50px rgba(0,0,0,0.4);
  }
  .cap-vis {
    height: 190px; position: relative; overflow: hidden;
    background: var(--surface2);
  }
  .cap-body { padding: 24px 26px 28px; }
  .cap-icon-wrap {
    width: 38px; height: 38px; border-radius: 9px;
    background: rgba(240,123,32,0.1);
    border: 1px solid rgba(240,123,32,0.18);
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; margin-bottom: 14px;
  }
  .cap-title {
    font-family: var(--serif); font-size: 22px; font-weight: 700;
    color: var(--cream); margin-bottom: 10px; letter-spacing: -0.01em;
  }
  .cap-desc {
    color: var(--cream-2); font-size: 13px; line-height: 1.75;
  }

  /* ── ARCHIVE / COMMISSIONS ── */
  .archive-section {
    padding: 100px 72px;
    background: linear-gradient(180deg, transparent 0%, rgba(240,123,32,0.018) 50%, transparent 100%);
  }
  .archive-wrap { max-width: 1200px; margin: 0 auto; }
  .archive-header {
    display: flex; align-items: flex-end; justify-content: space-between;
    margin-bottom: 48px;
  }
  .archive-link {
    font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em;
    color: var(--muted); text-decoration: none; text-transform: uppercase;
    border-bottom: 1px solid var(--border); padding-bottom: 2px;
    transition: color 0.2s, border-color 0.2s;
    margin-bottom: 4px;
  }
  .archive-link:hover { color: var(--cream); border-color: rgba(255,255,255,0.3); }
  .commissions-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
  }
  .commission-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px; padding: 30px 28px;
    position: relative; overflow: hidden;
    transition: border-color 0.3s, transform 0.3s;
    cursor: default;
  }
  .commission-card:hover { border-color: var(--border-warm); transform: translateY(-4px); }
  .commission-card::after {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--orange), transparent);
    opacity: 0; transition: opacity 0.3s;
  }
  .commission-card:hover::after { opacity: 1; }
  .commission-num {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
    color: var(--muted); margin-bottom: 16px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .commission-num-badge {
    font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em;
    color: var(--orange); background: rgba(240,123,32,0.08);
    border: 1px solid rgba(240,123,32,0.18);
    padding: 2px 8px; border-radius: 100px;
  }
  .commission-title {
    font-family: var(--serif); font-size: 28px; font-weight: 800;
    color: var(--cream); margin-bottom: 20px; letter-spacing: -0.02em; line-height: 1.0;
  }
  .commission-quote {
    font-family: var(--serif); font-style: italic;
    font-size: 14px; line-height: 1.85; color: var(--cream-2);
    margin-bottom: 24px;
    padding-left: 14px;
    border-left: 2px solid rgba(240,123,32,0.28);
  }
  .commission-footer {
    display: flex; align-items: center; justify-content: space-between;
  }
  .commission-genre {
    font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted);
    background: var(--surface3); border: 1px solid var(--border);
    padding: 3px 9px; border-radius: 4px;
  }
  .commission-link {
    font-family: var(--mono); font-size: 11px; color: var(--orange);
    text-decoration: none; letter-spacing: 0.06em;
    display: flex; align-items: center; gap: 5px;
    transition: gap 0.2s;
  }
  .commission-link:hover { gap: 9px; }

  /* ── WORKFLOW ── */
  .workflow-section { padding: 100px 72px; }
  .workflow-wrap { max-width: 1200px; margin: 0 auto; }
  .workflow-layout {
    display: grid; grid-template-columns: 380px 1fr;
    gap: 80px; align-items: start;
    margin-top: 60px;
  }
  .workflow-aside { position: sticky; top: 100px; }
  .workflow-aside-title {
    font-family: var(--serif); font-size: 36px; font-weight: 800;
    color: var(--cream); line-height: 1.0; letter-spacing: -0.02em;
    margin-bottom: 16px;
  }
  .workflow-aside-title em { font-style: italic; color: var(--amber); }
  .workflow-aside-desc {
    color: var(--cream-2); font-size: 14px; line-height: 1.8; margin-bottom: 28px;
  }
  .workflow-aside-stat {
    display: flex; gap: 0; border: 1px solid var(--border); border-radius: 12px;
    overflow: hidden;
  }
  .w-stat {
    flex: 1; padding: 16px 20px; border-right: 1px solid var(--border);
  }
  .w-stat:last-child { border-right: none; }
  .w-stat-num {
    font-family: var(--serif); font-size: 26px; font-weight: 800;
    color: var(--orange); line-height: 1; margin-bottom: 3px;
  }
  .w-stat-label { font-size: 11px; color: var(--muted); letter-spacing: 0.06em; }

  .workflow-steps { display: flex; flex-direction: column; gap: 2px; }
  .wf-step {
    padding: 28px 32px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    position: relative; overflow: hidden;
    transition: border-color 0.25s, background 0.25s;
  }
  .wf-step:hover { border-color: var(--border-warm); background: var(--surface2); }
  .wf-step::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0;
    width: 2px; background: var(--orange);
    transform: scaleY(0); transform-origin: top;
    transition: transform 0.3s ease;
  }
  .wf-step:hover::before { transform: scaleY(1); }
  .wf-step-top {
    display: flex; align-items: center; gap: 16px; margin-bottom: 12px;
  }
  .wf-step-num {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
    color: var(--muted); flex-shrink: 0; width: 44px;
  }
  .wf-step-icon {
    width: 36px; height: 36px; border-radius: 8px;
    background: var(--surface3); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
    transition: border-color 0.25s;
  }
  .wf-step:hover .wf-step-icon { border-color: rgba(240,123,32,0.3); }
  .wf-step-name {
    font-family: var(--serif); font-size: 21px; font-weight: 700;
    color: var(--cream); letter-spacing: -0.01em;
  }
  .wf-step-desc {
    color: var(--cream-2); font-size: 13px; line-height: 1.75;
    padding-left: 60px;
  }

  /* ── CONTACT ── */
  .contact-section { padding: 100px 72px 120px; }
  .contact-wrap { max-width: 1200px; margin: 0 auto; }
  .contact-layout { display: grid; grid-template-columns: 1fr 1.15fr; gap: 60px; align-items: start; }
  .contact-left { padding-top: 4px; }
  .contact-left-title {
    font-family: var(--serif); font-size: clamp(32px, 3.5vw, 48px);
    font-weight: 800; color: var(--cream);
    line-height: 1.0; letter-spacing: -0.02em; margin-bottom: 16px;
  }
  .contact-left-title em { font-style: italic; color: var(--amber); }
  .contact-left-desc {
    color: var(--cream-2); font-size: 14px; line-height: 1.8; max-width: 340px; margin-bottom: 36px;
  }
  .contact-details { display: flex; flex-direction: column; gap: 10px; }
  .contact-item {
    display: flex; align-items: center; gap: 14px;
    padding: 13px 16px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 10px;
    transition: border-color 0.2s;
  }
  .contact-item:hover { border-color: var(--border-warm); }
  .contact-icon {
    width: 34px; height: 34px; border-radius: 8px;
    background: rgba(240,123,32,0.09); border: 1px solid rgba(240,123,32,0.15);
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0;
  }
  .contact-item-label {
    font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 2px;
  }
  .contact-item-val { font-size: 14px; color: var(--cream); font-weight: 500; }

  .contact-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 36px 36px 32px;
    position: relative; overflow: hidden;
  }
  .contact-card::after {
    content: ''; position: absolute; bottom: -50px; right: -50px;
    width: 180px; height: 180px; border-radius: 50%;
    background: radial-gradient(circle, rgba(240,123,32,0.05), transparent 70%);
    pointer-events: none;
  }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
  .form-label {
    font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--muted);
  }
  .form-input, .form-textarea, .form-select {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 8px; padding: 11px 14px;
    color: var(--cream); font-family: var(--sans); font-size: 14px;
    outline: none; width: 100%;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .form-input::placeholder, .form-textarea::placeholder { color: #2e2d2a; }
  .form-input:focus, .form-textarea:focus, .form-select:focus {
    border-color: rgba(240,123,32,0.4);
    box-shadow: 0 0 0 3px rgba(240,123,32,0.06);
  }
  .form-textarea { resize: vertical; min-height: 96px; }
  .form-select {
    appearance: none; cursor: pointer; color: var(--cream-2);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 14px center;
  }
  .form-select option { background: #161614; color: var(--cream); }
  .btn-send {
    width: 100%; background: var(--orange); color: #fff; border: none;
    padding: 14px; border-radius: 8px;
    font-family: var(--sans); font-size: 14px; font-weight: 600;
    cursor: pointer; margin-top: 4px;
    transition: all 0.2s;
    box-shadow: 0 4px 22px var(--orange-glow);
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .btn-send:hover:not(:disabled) { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 8px 38px var(--orange-glow); }
  .btn-send:disabled { opacity: 0.55; cursor: default; transform: none; }
  .btn-send.sent { background: #2a7a50; box-shadow: 0 4px 22px rgba(42,122,80,0.3); }

  /* ── FOOTER ── */
  .footer {
    border-top: 1px solid var(--border);
    padding: 28px 72px;
    display: flex; align-items: center; justify-content: space-between;
    color: var(--muted); font-size: 13px;
  }
  .footer-logo { font-family: var(--serif); font-size: 17px; font-weight: 700; color: var(--muted); }
  .footer-links { display: flex; gap: 24px; }
  .footer-links a { color: var(--muted); text-decoration: none; font-size: 12px; transition: color 0.2s; }
  .footer-links a:hover { color: var(--cream); }

  /* ── DIVIDER ── */
  .divider { height: 1px; background: var(--border); }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; } }
  .fu { animation: fadeUp 0.6s ease forwards; }
  .fu1 { animation-delay: 0.05s; opacity: 0; }
  .fu2 { animation-delay: 0.15s; opacity: 0; }
  .fu3 { animation-delay: 0.25s; opacity: 0; }
  .fu4 { animation-delay: 0.35s; opacity: 0; }

  @media (max-width: 960px) {
    .nav { padding: 0 24px; }
    .nav-links { display: none; }
    .hero { grid-template-columns: 1fr; }
    .hero-left { padding: 90px 28px 60px; border-right: none; }
    .hero-right { display: none; }
    .capabilities, .archive-section, .workflow-section, .contact-section { padding: 70px 28px; }
    .cap-header, .contact-layout { grid-template-columns: 1fr; }
    .cap-grid { grid-template-columns: 1fr; }
    .commissions-grid { grid-template-columns: 1fr; }
    .workflow-layout { grid-template-columns: 1fr; }
    .workflow-aside { position: static; }
    .footer { flex-direction: column; gap: 16px; padding: 24px 28px; text-align: center; }
    .footer-links { justify-content: center; }
    .form-row { grid-template-columns: 1fr; }
    .contact-left { display: none; }
  }
`;

// ── Typewriter lyric component ──────────────────────────────────────────────
const VERSES = [
  {
    label: "VERSE I",
    lines: [
      "Dancing through the static of a city made of glass,",
      "every heartbeat echoing the shadows that we pass—",
    ],
  },
  {
    label: "CHORUS",
    lines: [
      "We are the frequency between",
      "the silence and the scream.",
    ],
    highlighted: true,
  },
  {
    label: "BRIDGE",
    lines: [
      "In the 1s and 0s of the life we left behind,",
      "I found the only truth that I could never redefine.",
    ],
  },
];

function TypewriterManuscript() {
  const [verseIdx, setVerseIdx] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [completedVerses, setCompletedVerses] = useState<typeof VERSES>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) {
      const resetId = setTimeout(() => {
        setCompletedVerses([]);
        setVerseIdx(0);
        setLineIdx(0);
        setCharIdx(0);
        setDone(false);
      }, 3200);
      return () => clearTimeout(resetId);
    }

    const verse = VERSES[verseIdx];
    const line = verse.lines[lineIdx];

    if (charIdx < line.length) {
      const id = setTimeout(() => setCharIdx(c => c + 1), 36 + Math.random() * 20);
      return () => clearTimeout(id);
    }

    // line complete
    if (lineIdx < verse.lines.length - 1) {
      const id = setTimeout(() => { setLineIdx(l => l + 1); setCharIdx(0); }, 320);
      return () => clearTimeout(id);
    }

    // verse complete
    if (verseIdx < VERSES.length - 1) {
      const id = setTimeout(() => {
        setCompletedVerses(cv => [...cv, verse]);
        setVerseIdx(v => v + 1);
        setLineIdx(0);
        setCharIdx(0);
      }, 700);
      return () => clearTimeout(id);
    }

    setDone(true);
  }, [charIdx, lineIdx, verseIdx, done]);

  const progress = ((verseIdx * 2 + lineIdx) / (VERSES.length * 2)) * 100;
  const currentVerse = VERSES[verseIdx];

  return (
    <div className="manuscript">
      <div className="ms-header">
        <div className="ms-title-group">
          <div className="ms-song-name">Neon Soul</div>
          <div className="ms-artist">Commission · Pop / Electronic</div>
        </div>
        <div className="ms-status">
          <div className="ms-status-dot" />
          WRITING
        </div>
      </div>

      {completedVerses.map((v, i) => (
        <div key={i} className={v.highlighted ? "ms-chorus ms-verse" : "ms-verse"}>
          <div className="ms-section-label">{v.label}</div>
          {v.lines.map((line, j) => (
            <span key={j} className="ms-line">{line}</span>
          ))}
        </div>
      ))}

      {!done && (
        <div className={currentVerse.highlighted ? "ms-chorus ms-verse" : "ms-verse"}>
          <div className="ms-section-label">{currentVerse.label}</div>
          {currentVerse.lines.map((line, j) => {
            if (j < lineIdx) return <span key={j} className="ms-line">{line}</span>;
            if (j === lineIdx) return (
              <span key={j} className="ms-line">
                {line.slice(0, charIdx)}<span className="ms-cursor" />
              </span>
            );
            return <span key={j} className="ms-line muted-line" style={{ opacity: 0 }}>{line}</span>;
          })}
        </div>
      )}

      <div className="ms-footer">
        <div className="ms-progress-wrap">
          <div className="ms-progress-label">
            <span>Progress</span>
            <span>{Math.round(done ? 100 : progress)}%</span>
          </div>
          <div className="ms-progress-bar">
            <div className="ms-progress-fill" style={{ width: `${done ? 100 : progress}%` }} />
          </div>
        </div>
        <div className="ms-page">pg. 01 / 04</div>
      </div>
    </div>
  );
}

// ── Capability card visuals ──────────────────────────────────────────────────
function CapVisStorytellers() {
  return (
    <svg width="100%" height="190" viewBox="0 0 460 190" style={{ display: "block" }}>
      <defs>
        <radialGradient id="cv1-bg" cx="50%" cy="100%" r="80%">
          <stop offset="0%" stopColor="#1a1006" />
          <stop offset="100%" stopColor="#0c0a07" />
        </radialGradient>
      </defs>
      <rect width="460" height="190" fill="url(#cv1-bg)" />
      {/* Ruled lines — manuscript paper */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <line key={i} x1="0" y1={30 + i * 22} x2="460" y2={30 + i * 22}
          stroke="rgba(240,123,32,0.06)" strokeWidth="1" />
      ))}
      {/* Left margin line */}
      <line x1="60" y1="0" x2="60" y2="190" stroke="rgba(240,123,32,0.12)" strokeWidth="1" />
      {/* Text lines — handwriting style */}
      {[
        { y: 36, w: 260, indent: 80, op: 0.55 },
        { y: 58, w: 180, indent: 80, op: 0.35 },
        { y: 80, w: 230, indent: 80, op: 0.45 },
        { y: 102, w: 200, indent: 80, op: 0.3 },
        { y: 124, w: 250, indent: 80, op: 0.5 },
        { y: 146, w: 160, indent: 80, op: 0.28 },
        { y: 168, w: 210, indent: 80, op: 0.4 },
      ].map((l, i) => (
        <rect key={i} x={l.indent} y={l.y - 7} width={l.w} height={6}
          rx="3" fill="#f07b20" fillOpacity={l.op} />
      ))}
      {/* Section bracket */}
      <rect x="70" y="26" width="3" height="100" rx="2" fill="#f07b20" fillOpacity="0.4" />
      {/* Label */}
      <text x="78" y="21" fontFamily="monospace" fontSize="9" fill="#f07b20" fillOpacity="0.5"
        letterSpacing="3">VERSE I</text>
      {/* Cursor */}
      <rect x="298" y="161" width="2" height="14" rx="1" fill="#f07b20" fillOpacity="0.9">
        <animate attributeName="opacity" values="1;0;1" dur="0.9s" repeatCount="indefinite" />
      </rect>
      {/* Decorative orange corner */}
      <path d="M440 0 L460 0 L460 40 Z" fill="#f07b20" fillOpacity="0.05" />
    </svg>
  );
}

function CapVisVisual() {
  return (
    <svg width="100%" height="190" viewBox="0 0 460 190" style={{ display: "block" }}>
      <defs>
        <radialGradient id="cv2-bg" cx="60%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#0f0a14" />
          <stop offset="100%" stopColor="#080609" />
        </radialGradient>
      </defs>
      <rect width="460" height="190" fill="url(#cv2-bg)" />
      {/* Social media card mockups */}
      {[
        { x: 60, y: 30, w: 130, h: 130, rot: -6, title: "NEON SOUL", sub: "Softly · 2024", op: 0.9 },
        { x: 180, y: 25, w: 140, h: 140, rot: 1, title: "MIDNIGHT ECHO", sub: "Drop incoming", op: 1 },
        { x: 310, y: 35, w: 120, h: 120, rot: 8, title: "BINARY", sub: "Heartbeat", op: 0.8 },
      ].map((c, i) => (
        <g key={i} transform={`rotate(${c.rot}, ${c.x + c.w/2}, ${c.y + c.h/2})`}>
          <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="8"
            fill="rgba(240,123,32,0.07)" stroke="rgba(240,123,32,0.22)" strokeWidth="1"
            opacity={c.op} />
          {/* Card inner gradient */}
          <rect x={c.x+1} y={c.y+1} width={c.w-2} height={c.h*0.55} rx="7"
            fill="rgba(240,123,32,0.06)" opacity={c.op} />
          {/* Title */}
          <text x={c.x + c.w/2} y={c.y + c.h * 0.52}
            textAnchor="middle" fontFamily="serif" fontWeight="900"
            fontSize={c.w > 125 ? 11 : 10} fill="#f07b20" fillOpacity={0.7 * c.op}
            letterSpacing="1">{c.title}</text>
          <text x={c.x + c.w/2} y={c.y + c.h * 0.65}
            textAnchor="middle" fontFamily="monospace"
            fontSize="7" fill="#f07b20" fillOpacity={0.35 * c.op}
            letterSpacing="1">{c.sub}</text>
          {/* Bottom bar */}
          <rect x={c.x + 12} y={c.y + c.h - 22} width={c.w - 24} height={4} rx="2"
            fill="#f07b20" fillOpacity={0.18 * c.op} />
          <rect x={c.x + 12} y={c.y + c.h - 14} width={(c.w - 24) * 0.6} height={4} rx="2"
            fill="#f07b20" fillOpacity={0.1 * c.op} />
        </g>
      ))}
      {/* Sparkle */}
      <circle cx="240" cy="95" r="3" fill="#f07b20" fillOpacity="0.6" />
      <circle cx="240" cy="95" r="8" fill="none" stroke="#f07b20" strokeOpacity="0.15" strokeWidth="1" />
    </svg>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function LyricsPage() {
  const [form, setForm] = useState({ name: "", email: "", type: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSend = () => {
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); setTimeout(() => setSent(false), 3500); }, 1400);
  };

  const stripItems = ["Verse Writing", "Hook Craft", "Lyrical Direction", "Full Album", "EP Direction", "Ghostwriting", "Co-writing", "Concept Development"];

  return (
    <>
      <style>{style}</style>

      {/* HERO */}
      <section className="hero" id="services">
        <div className="hero-bg" />
        <div className="hero-ruled" />

        <div className="hero-left">
          <div className="hero-label fu fu1">Elite Songwriting & Lyrical Direction</div>
          <h1 className="hero-title fu fu2">Words That</h1>
          <span className="hero-title-italic fu fu2">Move Worlds</span>
          <p className="hero-desc fu fu3">
            We craft stories that resonate at frequency. From poetic verses to
            chart-topping hooks — every lyric gives your music a soul it could
            never have without the right words.
          </p>
          <div className="hero-actions fu fu4">
            <button className="btn-primary" onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}>
              Start Your Project
            </button>
            <button className="btn-ghost" onClick={() => document.getElementById("archive")?.scrollIntoView({ behavior: "smooth" })}>
              View Archive →
            </button>
          </div>
        </div>

        <div className="hero-right">
          <TypewriterManuscript />
        </div>
      </section>

      {/* SCROLLING STRIP */}
      <div className="strip">
        <div className="strip-track">
          {[...stripItems, ...stripItems].map((s, i) => (
            <div key={i} className="strip-item">
              <span>✦</span>
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* CAPABILITIES */}
      <section className="capabilities" id="services">
        <div className="cap-header">
          <div>
            <div className="section-kicker">What We Offer</div>
            <div className="section-title">Craft built on<br /><em>narrative truth</em></div>
          </div>
          <p className="cap-intro">
            Great lyrics aren't decoration. They're the architecture of meaning — the
            emotional scaffolding that makes a listener feel seen. We build them
            with intention, from the first syllable to the final refrain.
          </p>
        </div>
        <div className="cap-grid">
          <div className="cap-card">
            <div className="cap-vis"><CapVisStorytellers /></div>
            <div className="cap-body">
              <div className="cap-icon-wrap">🎙</div>
              <div className="cap-title">The Storytellers</div>
              <p className="cap-desc">
                We dive deep into your personal narrative, translating raw emotion into structured,
                high-impact lyrical masterpieces that feel authentic to your voice — not anyone else's.
              </p>
            </div>
          </div>
          <div className="cap-card">
            <div className="cap-vis"><CapVisVisual /></div>
            <div className="cap-body">
              <div className="cap-icon-wrap">✦</div>
              <div className="cap-title">Visual Lyricism</div>
              <p className="cap-desc">
                Every hook is designed to be shareable, visually striking, and memorable — lyrics built
                to resonate across digital formats, physical releases, and live performance alike.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ARCHIVE */}
      <section className="archive-section" id="archive">
        <div className="archive-wrap">
          <div className="archive-header">
            <div>
              <div className="section-kicker">Archive</div>
              <div className="section-title">Recent <em>Commissions</em></div>
            </div>
            <a href="#" className="archive-link">Full Archive →</a>
          </div>
          <div className="commissions-grid">
            {[
              { num: "001", genre: "Pop · Electronic", title: "Neon Soul", quote: "Dancing through the static of a city made of glass, every heartbeat echoing the shadows that we pass—" },
              { num: "002", genre: "Alternative", title: "Binary Heartbeat", quote: "In the 1s and 0s of the life we left behind, I found the only truth that I could never redefine." },
              { num: "003", genre: "R&B · Soul", title: "Midnight Echo", quote: "Soft whispers in the hallway of a house we used to call home, carving names into the silence when I'm alone." },
            ].map((c) => (
              <div className="commission-card" key={c.num}>
                <div className="commission-num">
                  <span>Commission #{c.num}</span>
                  <span className="commission-num-badge">{c.genre}</span>
                </div>
                <div className="commission-title">{c.title}</div>
                <p className="commission-quote">{c.quote}</p>
                <div className="commission-footer">
                  <span />
                  <a href="#" className="commission-link">Read Breakdown →</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* WORKFLOW */}
      <section className="workflow-section" id="workflow">
        <div className="workflow-wrap">
          <div className="section-kicker">The Process</div>
          <div className="workflow-layout">
            <div className="workflow-aside">
              <div className="workflow-aside-title">From Concept<br /><em>to Soul</em></div>
              <p className="workflow-aside-desc">
                A structured approach to capturing the intangible essence of your musical vision.
                Every lyric built through discovery, craft, and precision.
              </p>
              <div className="workflow-aside-stat">
                <div className="w-stat">
                  <div className="w-stat-num">340+</div>
                  <div className="w-stat-label">Commissions</div>
                </div>
                <div className="w-stat">
                  <div className="w-stat-num">98%</div>
                  <div className="w-stat-label">Satisfaction</div>
                </div>
              </div>
            </div>

            <div className="workflow-steps">
              {[
                { num: "01", icon: "📍", name: "Ideation",    desc: "Deep-dive sessions to uncover the core theme — the emotional truth your song is actually about. We interview, we listen, we find the thing underneath the thing." },
                { num: "02", icon: "✏️", name: "Draft",       desc: "Building the lyrical structure: syllabic rhythm, phonetic texture, harmonic fit with the melody. Multiple drafts until the cadence feels inevitable." },
                { num: "03", icon: "⚙️", name: "Refinement",  desc: "Word-level polishing. Every syllable tested against the emotional peak. Redundancies stripped. Imagery sharpened until each line earns its place." },
              ].map((s) => (
                <div className="wf-step" key={s.num}>
                  <div className="wf-step-top">
                    <span className="wf-step-num">Step {s.num}</span>
                    <div className="wf-step-icon">{s.icon}</div>
                    <div className="wf-step-name">{s.name}</div>
                  </div>
                  <p className="wf-step-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* CONTACT */}
      <section className="contact-section" id="contact">
        <div className="contact-wrap">
          <div className="contact-layout">
            <div className="contact-left">
              <div className="contact-left-title">Start Your<br /><em>Narrative</em></div>
              <p className="contact-left-desc">
                Tell us about your project and let's find the words that will change
                everything. Every great song starts with a single honest line.
              </p>
              <div className="contact-details">
                {[
                  { icon: "📍", label: "Studio", val: "sri ganganagar rajasthan" },
                  { icon: "📧", label: "Email", val: "support@prabhmusik.com" },
                  { icon: "⏱", label: "Turnaround", val: "3–7 business days" },
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
                  <option>Full Album Lyrical Direction</option>
                  <option>Single Track Lyrics</option>
                  <option>EP Direction</option>
                  <option>Hook Writing</option>
                  <option>Verse Writing</option>
                  <option>Ghostwriting</option>
                  <option>Custom Package</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Your Vision</label>
                <textarea className="form-textarea" name="message"
                  placeholder="Tell us about the vibe, the story, the feeling you're chasing…"
                  value={form.message} onChange={handleChange} />
              </div>
              <button
                className={`btn-send${sent ? " sent" : ""}`}
                onClick={handleSend}
                disabled={sending || sent}
              >
                {sent ? "✓ Request Received" : sending ? "Sending…" : "Send Request →"}
              </button>
            </div>
          </div>
        </div>
      </section>

   
    </>
  );
}