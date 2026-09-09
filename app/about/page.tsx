'use client';
import { useEffect, useRef, useState } from 'react';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface ServiceItem { icon: string; title: string; desc: string }
interface StepItem    { phase: string; title: string; desc: string }
interface StatItem    { symbol: string; value: string; label: string }

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const SERVICES: ServiceItem[] = [
  { icon: '◎', title: 'Music Production',    desc: 'Custom production tailored to your artistic identity — from concept to final session file.' },
  { icon: '≋', title: 'Mixing & Mastering',  desc: 'Industry-standard sound that translates on every speaker, stream, and stage.' },
  { icon: '◈', title: 'Creative Direction',  desc: 'Shape your visual and sonic identity with clarity, consistency, and intent.' },
  { icon: '↗', title: 'Artist Development',  desc: 'Long-term strategy, guidance, and growth planning built around your career goals.' },
];

const STEPS: StepItem[] = [
  { phase: 'Phase I',   title: 'DISCOVER', desc: 'Deep-dive into your story, influences, and where you want to go.' },
  { phase: 'Phase II',  title: 'CREATE',   desc: 'Producing and arranging — turning raw ideas into structured music.' },
  { phase: 'Phase III', title: 'PERFECT',  desc: 'Mixing, mastering, and obsessing over every detail until it\'s right.' },
  { phase: 'Phase IV',  title: 'LAUNCH',   desc: 'Release strategy, branding assets, and growth support.' },
];

const STATS: StatItem[] = [
  { symbol: '★', value: '100%',      label: 'Commitment to every project' },
  { symbol: '∞', value: 'UNLIMITED', label: 'Creative possibilities' },
  { symbol: '◎', value: '1 GOAL',    label: 'Your success, always' },
  { symbol: '◈', value: 'LONG-TERM', label: 'Partnerships built on trust' },
];

const TICKER_ITEMS = ['MUSIC', 'IDENTITY', 'LEGACY', 'IMPACT', 'SOUND', 'VISION', 'CRAFT', 'EMOTION'];

/* ─────────────────────────────────────────────
   INTERSECTION HOOK
───────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─────────────────────────────────────────────
   REVEAL WRAPPER
───────────────────────────────────────────── */
function Reveal({ children, delay = 0, from = 'bottom' }: {
  children: React.ReactNode;
  delay?: number;
  from?: 'bottom' | 'left' | 'right';
}) {
  const { ref, inView } = useInView();
  const tx = from === 'left' ? 'translateX(-32px)' : from === 'right' ? 'translateX(32px)' : 'translateY(32px)';
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translate(0)' : tx,
      transition: `opacity 0.9s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 0.9s cubic-bezier(.16,1,.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TICKER MARQUEE
───────────────────────────────────────────── */
function Ticker({ reversed = false }: { reversed?: boolean }) {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{
      overflow: 'hidden',
      borderTop: '1px solid rgba(212,160,23,0.25)',
      borderBottom: '1px solid rgba(212,160,23,0.25)',
      padding: '14px 0',
      background: 'rgba(212,160,23,0.03)',
    }}>
      <div style={{
        display: 'flex',
        gap: 0,
        animation: reversed ? 'tickerR 28s linear infinite' : 'ticker 28s linear infinite',
        width: 'max-content',
      }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 13,
            letterSpacing: '0.32em',
            color: i % 2 === 0 ? 'rgba(212,160,23,0.9)' : 'rgba(245,240,232,0.2)',
            paddingRight: 48,
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION LABEL
───────────────────────────────────────────── */
function Label({ children }: { children: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
      <div style={{ width: 24, height: 1, background: '#d4a017' }} />
      <span style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.26em',
        color: '#d4a017',
        textTransform: 'uppercase',
      }}>{children}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   GOLD RULE
───────────────────────────────────────────── */
function Rule() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
      <div style={{ width: 40, height: 1.5, background: '#d4a017' }} />
      <div style={{ width: 5, height: 5, background: '#d4a017', transform: 'rotate(45deg)', flexShrink: 0 }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   BUTTON
───────────────────────────────────────────── */
function GoldBtn({ children, large, href }: { children: React.ReactNode; large?: boolean; href?: string }) {
  const [hov, setHov] = useState(false);
  const baseStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: large ? 12 : 11,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: hov ? '#d4a017' : '#080808',
    background: hov ? 'transparent' : '#d4a017',
    border: '1.5px solid #d4a017',
    padding: large ? '18px 56px' : '14px 36px',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    outline: 'none',
    display: 'inline-block',
    textDecoration: 'none',
  };

  const content = (
    <span
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={baseStyle}
    >
      {children}
    </span>
  );

  if (href) {
    // open Gmail compose in new tab if possible, otherwise use mailto
    const isGmail = href.startsWith('https://mail.google.com');
    return (
      <a href={href} target={isGmail ? '_blank' : undefined} rel={isGmail ? 'noopener noreferrer' : undefined} style={{ display: 'inline-block' }}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={baseStyle}>
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */
function HeroSection({ isMobile }: { isMobile: boolean }) {
  return (
    <section style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Left panel */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: isMobile ? '80px 28px 48px' : '0 72px 72px',
        paddingTop: isMobile ? 80 : 0,
        position: 'relative',
        zIndex: 2,
        borderRight: isMobile ? 'none' : '1px solid rgba(212,160,23,0.15)',
      }}>
        <Reveal delay={0}>
          <Label>About Prabh Musik</Label>
        </Reveal>
        <Reveal delay={80}>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: isMobile ? 'clamp(72px, 18vw, 96px)' : 'clamp(80px, 9vw, 136px)',
            lineHeight: 0.88,
            letterSpacing: '-0.01em',
            color: '#f5f0e8',
            margin: '0 0 8px',
          }}>
            MUSIC<br />
            THAT<br />
            <span style={{ color: '#d4a017', WebkitTextStroke: isMobile ? '0px' : '0px' }}>CREATES</span>
          </h1>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: isMobile ? 'clamp(72px, 18vw, 96px)' : 'clamp(80px, 9vw, 136px)',
            lineHeight: 0.88,
            letterSpacing: '-0.01em',
            color: 'transparent',
            WebkitTextStroke: '1.5px rgba(212,160,23,0.6)',
            margin: '0 0 40px',
          }}>
            IMPACT.
          </h1>
        </Reveal>
        <Reveal delay={180}>
          <Rule />
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 18,
            lineHeight: 1.8,
            color: 'rgba(245,240,232,0.55)',
            maxWidth: 400,
            marginBottom: 44,
          }}>
            We help artists discover their sound, build their identity, and create
            music that leaves a lasting impression.
          </p>
        </Reveal>
        <Reveal delay={260}>
          <GoldBtn href={"https://mail.google.com/mail/?view=cm&fs=1&to=support@prabhmusik.com&su=Start%20Your%20Journey&body=Name:%0AEmail:%0AProject%20Type:%20%0A%0ADetails:%0A"}>Start Your Journey</GoldBtn>
        </Reveal>
        {/* Vertical text */}
        {!isMobile && (
          <div style={{
            position: 'absolute',
            right: -1,
            top: '50%',
            transform: 'translateY(-50%) rotate(90deg)',
            transformOrigin: 'center',
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.3em',
            color: 'rgba(212,160,23,0.35)',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            Prabh Musik Studio · Est. 2020
          </div>
        )}
      </div>

      {/* Right panel — image full bleed */}
      <div style={{
        position: isMobile ? 'relative' : 'sticky',
        top: 0,
        height: isMobile ? '60vw' : '100vh',
        overflow: 'hidden',
        borderRadius: 0,
      }}>
        <img
          src="/about_1.png"
          alt="Prabh Musik Studio"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            filter: 'contrast(1.06) brightness(0.88)',
            borderRadius: 0,
          }}
        />
        {/* Vignette overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: isMobile
            ? 'linear-gradient(to top, rgba(8,8,8,0.7) 0%, transparent 50%)'
            : 'linear-gradient(to right, rgba(8,8,8,0.5) 0%, transparent 40%), linear-gradient(to top, rgba(8,8,8,0.4) 0%, transparent 40%)',
        }} />
        {/* Corner label */}
        <div style={{
          position: 'absolute',
          bottom: 28,
          right: 28,
          fontFamily: "'Space Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.24em',
          color: 'rgba(212,160,23,0.5)',
          textTransform: 'uppercase',
        }}>
          Studio · Mumbai
        </div>
        {/* Gold frame accent removed */}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   VISION
───────────────────────────────────────────── */
function VisionSection({ isMobile }: { isMobile: boolean }) {
  return (
    <section style={{
      padding: isMobile ? '80px 28px' : '120px 72px',
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: isMobile ? 48 : 80,
      alignItems: 'center',
      maxWidth: 1400,
      margin: '0 auto',
    }}>
      {/* Big quote / left */}
      <Reveal from="left" delay={0}>
        <div style={{ position: 'relative' }}>
          {/* Huge decorative P */}
          <div style={{
            position: 'absolute',
            top: -20,
            left: -20,
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: isMobile ? 200 : 280,
            lineHeight: 1,
            color: 'rgba(212,160,23,0.05)',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 0,
          }}>P</div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Label>Our Vision</Label>
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: isMobile ? 'clamp(44px, 12vw, 72px)' : 'clamp(48px, 5.5vw, 80px)',
              lineHeight: 0.92,
              letterSpacing: '-0.01em',
              color: '#f5f0e8',
              marginBottom: 8,
            }}>
              MUSIC IS MORE<br />THAN SOUND
            </h2>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontSize: isMobile ? 20 : 24,
              color: '#d4a017',
              letterSpacing: '0.04em',
              marginBottom: 28,
            }}>
              — Emotion. Identity. Influence.
            </p>
            <Rule />
          </div>
        </div>
      </Reveal>

      {/* Right body */}
      <Reveal from="right" delay={120}>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: isMobile ? 17 : 19,
          lineHeight: 1.9,
          color: 'rgba(245,240,232,0.6)',
          marginBottom: 24,
        }}>
          At Prabh Musik, every artist is treated as a unique creative voice.
          We focus on understanding their inspirations, style, personality, and
          goals to create music that feels authentic and meaningful.
        </p>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: isMobile ? 17 : 19,
          lineHeight: 1.9,
          color: 'rgba(245,240,232,0.35)',
          marginBottom: 36,
        }}>
          The objective isn't simply to make songs. It's to create moments
          people remember for the rest of their lives.
        </p>
        <div style={{
          padding: '24px 28px',
          borderLeft: '2px solid #d4a017',
          background: 'rgba(212,160,23,0.04)',
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: 22,
            lineHeight: 1.6,
            color: 'rgba(245,240,232,0.8)',
            margin: 0,
          }}>
            "Sound is the last sense to leave us. Make it count."
          </p>
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.22em',
            color: 'rgba(212,160,23,0.6)',
            textTransform: 'uppercase',
            marginTop: 12,
            display: 'block',
          }}>— Prabh</span>
        </div>
      </Reveal>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SERVICES
───────────────────────────────────────────── */
function ServicesSection({ isMobile }: { isMobile: boolean }) {
  return (
    <section style={{
      padding: isMobile ? '80px 28px' : '100px 72px',
      background: 'rgba(212,160,23,0.018)',
      borderTop: '1px solid rgba(255,255,255,0.04)',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <Reveal>
          <div style={{
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'flex-end',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 24,
            marginBottom: 72,
          }}>
            <div>
              <Label>What We Do</Label>
              <h2 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: isMobile ? 'clamp(48px, 12vw, 72px)' : 'clamp(52px, 5.5vw, 76px)',
                lineHeight: 0.9,
                color: '#f5f0e8',
                letterSpacing: '-0.01em',
              }}>
                EVERYTHING ARTISTS<br />NEED, UNDER ONE ROOF
              </h2>
            </div>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 16,
              lineHeight: 1.8,
              color: 'rgba(245,240,232,0.45)',
              maxWidth: 280,
              flexShrink: 0,
            }}>
              Four disciplines. One studio. A complete artist support system.
            </p>
          </div>
        </Reveal>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: 1,
          border: '1px solid rgba(212,160,23,0.15)',
        }}>
          {SERVICES.map((s, i) => (
            <ServiceCard key={s.title} item={s} index={i} isMobile={isMobile} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ item, index, isMobile }: { item: ServiceItem; index: number; isMobile: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <Reveal delay={index * 90}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          padding: isMobile ? '40px 28px' : '52px 36px',
          borderRight: !isMobile && index < 3 ? '1px solid rgba(212,160,23,0.15)' : 'none',
          background: hov ? 'rgba(212,160,23,0.07)' : 'transparent',
          transition: 'background 0.3s',
          position: 'relative',
          cursor: 'default',
          overflow: 'hidden',
        }}
      >
        {/* Top accent bar */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 2,
          background: '#d4a017',
          transform: hov ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'left',
          transition: 'transform 0.45s cubic-bezier(.16,1,.3,1)',
        }} />
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 40,
          color: hov ? '#d4a017' : 'rgba(212,160,23,0.35)',
          marginBottom: 28,
          lineHeight: 1,
          transition: 'color 0.3s',
        }}>
          {item.icon}
        </div>
        <h3 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 22,
          letterSpacing: '0.1em',
          color: '#f5f0e8',
          marginBottom: 16,
        }}>
          {item.title}
        </h3>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 15,
          lineHeight: 1.85,
          color: 'rgba(245,240,232,0.5)',
          margin: 0,
        }}>
          {item.desc}
        </p>
        <div style={{
          position: 'absolute',
          bottom: 28, right: 28,
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.2em',
          color: 'rgba(212,160,23,0.25)',
          transition: 'color 0.3s',
        }}>
          {String(index + 1).padStart(2, '0')}
        </div>
      </div>
    </Reveal>
  );
}

/* ─────────────────────────────────────────────
   PROCESS
───────────────────────────────────────────── */
function ProcessSection({ isMobile }: { isMobile: boolean }) {
  return (
    <section style={{ padding: isMobile ? '80px 28px' : '100px 72px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <Reveal>
          <Label>Our Process</Label>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: isMobile ? 'clamp(48px, 12vw, 72px)' : 'clamp(52px, 5.5vw, 76px)',
            lineHeight: 0.9,
            color: '#f5f0e8',
            letterSpacing: '-0.01em',
            marginBottom: 72,
          }}>
            HOW WE WORK
          </h2>
        </Reveal>

        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STEPS.map((step, i) => (
              <Reveal key={step.phase} delay={i * 80}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr',
                  gap: 24,
                  paddingBottom: 48,
                  position: 'relative',
                }}>
                  <div>
                    <div style={{
                      width: 48, height: 48,
                      border: '1.5px solid #d4a017',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      color: '#d4a017',
                      letterSpacing: '0.12em',
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{
                        width: 1, height: 'calc(100% - 24px)',
                        background: 'rgba(212,160,23,0.2)',
                        margin: '8px auto 0',
                      }} />
                    )}
                  </div>
                  <div style={{ paddingTop: 8 }}>
                    <span style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 9,
                      letterSpacing: '0.22em',
                      color: 'rgba(212,160,23,0.5)',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: 8,
                    }}>{step.phase}</span>
                    <h4 style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 28,
                      letterSpacing: '0.1em',
                      color: '#f5f0e8',
                      marginBottom: 10,
                    }}>{step.title}</h4>
                    <p style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 15,
                      lineHeight: 1.8,
                      color: 'rgba(245,240,232,0.5)',
                    }}>{step.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Connector */}
            <div style={{
              position: 'absolute',
              top: 32,
              left: '12.5%', right: '12.5%',
              height: 1,
              background: 'linear-gradient(to right, transparent, rgba(212,160,23,0.4) 10%, rgba(212,160,23,0.4) 90%, transparent)',
            }} />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 24,
            }}>
              {STEPS.map((step, i) => (
                <Reveal key={step.phase} delay={i * 100}>
                  <div style={{ paddingTop: 0 }}>
                    {/* Node */}
                    <div style={{
                      width: 64, height: 64,
                      border: '1.5px solid #d4a017',
                      background: '#080808',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 32,
                      position: 'relative',
                      zIndex: 2,
                    }}>
                      <span style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 24,
                        color: '#d4a017',
                        lineHeight: 1,
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <span style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 9,
                      letterSpacing: '0.22em',
                      color: 'rgba(212,160,23,0.5)',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: 10,
                    }}>{step.phase}</span>
                    <h4 style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 30,
                      letterSpacing: '0.1em',
                      color: '#f5f0e8',
                      marginBottom: 14,
                    }}>{step.title}</h4>
                    <p style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 15,
                      lineHeight: 1.85,
                      color: 'rgba(245,240,232,0.48)',
                    }}>{step.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   STATS / SUCCESS
───────────────────────────────────────────── */
function SuccessSection({ isMobile }: { isMobile: boolean }) {
  return (
    <section style={{
      padding: isMobile ? '80px 28px' : '100px 72px',
      background: 'rgba(212,160,23,0.018)',
      borderTop: '1px solid rgba(255,255,255,0.04)',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 40 : 80,
          alignItems: 'flex-end',
          marginBottom: 80,
        }}>
          <Reveal from="left">
            <div>
              <Label>Built for Success</Label>
              <h2 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: isMobile ? 'clamp(48px, 12vw, 72px)' : 'clamp(52px, 5.5vw, 76px)',
                lineHeight: 0.9,
                color: '#f5f0e8',
                letterSpacing: '-0.01em',
                marginBottom: 8,
              }}>
                WE BUILD<br />CAREERS,<br />
                <span style={{
                  color: 'transparent',
                  WebkitTextStroke: '1.5px rgba(212,160,23,0.55)',
                }}>
                  NOT JUST SONGS.
                </span>
              </h2>
            </div>
          </Reveal>
          <Reveal from="right" delay={100}>
            <div>
              <Rule />
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: isMobile ? 17 : 19,
                lineHeight: 1.9,
                color: 'rgba(245,240,232,0.55)',
                marginBottom: 20,
              }}>
                Success isn't measured by delivering a track. It's measured by
                helping artists build careers. Every project receives complete
                attention, dedication, and creative commitment.
              </p>
              <p style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 14,
                letterSpacing: '0.2em',
                color: '#d4a017',
              }}>
                WHEN ARTISTS GROW — WE GROW TOGETHER.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: 1,
          border: '1px solid rgba(212,160,23,0.15)',
        }}>
          {STATS.map((stat, i) => (
            <Reveal key={stat.value} delay={i * 70}>
              <StatCard item={stat} index={i} isMobile={isMobile} last={i === STATS.length - 1} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ item, index, isMobile, last }: { item: StatItem; index: number; isMobile: boolean; last: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: isMobile ? '40px 24px' : '56px 40px',
        borderRight: !isMobile && !last ? '1px solid rgba(212,160,23,0.15)' : (isMobile && index % 2 === 0 ? '1px solid rgba(212,160,23,0.15)' : 'none'),
        textAlign: 'center',
        background: hov ? 'rgba(212,160,23,0.06)' : 'transparent',
        transition: 'background 0.3s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 2,
        background: '#d4a017',
        transform: hov ? 'scaleX(1)' : 'scaleX(0)',
        transition: 'transform 0.4s ease',
      }} />
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 28,
        color: 'rgba(212,160,23,0.5)',
        marginBottom: 16,
        lineHeight: 1,
      }}>{item.symbol}</div>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: isMobile ? 'clamp(22px, 8vw, 36px)' : 'clamp(28px, 3vw, 44px)',
        color: '#d4a017',
        letterSpacing: '0.02em',
        marginBottom: 14,
        lineHeight: 1,
      }}>{item.value}</div>
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.24em',
        color: 'rgba(212,160,23,0.7)',
        textTransform: 'uppercase',
        lineHeight: 1.9,
      }}>{item.label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FOUNDER
───────────────────────────────────────────── */
function FounderSection({ isMobile }: { isMobile: boolean }) {
  return (
    <section style={{ padding: isMobile ? '80px 28px' : '100px 72px' }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 0,
        border: '1px solid rgba(212,160,23,0.18)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Gold top accent */}
        <div style={{
          position: 'absolute',
          top: 0, left: '20%', right: '20%',
          height: 2,
          background: 'linear-gradient(to right, transparent, #d4a017, transparent)',
        }} />

        {/* Photo */}
        <Reveal from="left">
          <div style={{
            aspectRatio: isMobile ? '4/3' : '3/4',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <img
              src="/about_5.png"
              alt="Prabh"
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                objectPosition: '50% 20%',
                display: 'block',
                filter: 'contrast(1.06) brightness(0.92)',
                transform: 'translateY(6px)',
              }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: isMobile
                ? 'linear-gradient(to top, rgba(8,8,8,0.6) 0%, transparent 50%)'
                : 'linear-gradient(to right, transparent 60%, rgba(8,8,8,0.5) 100%)',
            }} />
          </div>
        </Reveal>

        {/* Text */}
        <div style={{
          padding: isMobile ? '48px 0 0' : '72px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderLeft: isMobile ? 'none' : '1px solid rgba(212,160,23,0.15)',
        }}>
          <Reveal from="right" delay={0}>
            <Label>Founder</Label>
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: isMobile ? 'clamp(56px, 15vw, 80px)' : 'clamp(60px, 6vw, 88px)',
              lineHeight: 0.88,
              letterSpacing: '-0.02em',
              color: '#f5f0e8',
              marginBottom: 4,
            }}>
              MEET<br />PRABH
            </h2>
            <p style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 14,
              letterSpacing: '0.18em',
              color: '#d4a017',
              textTransform: 'uppercase',
              marginBottom: 36,
            }}>
              Music Producer · Creative Director
            </p>
          </Reveal>
          <Reveal from="right" delay={100}>
            <Rule />
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: isMobile ? 17 : 18,
              lineHeight: 1.9,
              color: 'rgba(245,240,232,0.58)',
              maxWidth: 420,
              marginBottom: 24,
            }}>
              I believe every artist deserves a sound that genuinely represents
              who they are. My role is to help transform ideas into records
              that connect emotionally and stand the test of time.
            </p>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: isMobile ? 17 : 18,
              lineHeight: 1.9,
              color: 'rgba(245,240,232,0.32)',
              maxWidth: 420,
              marginBottom: 48,
            }}>
              From a simple idea to a global impact — let's build your legacy together.
            </p>
            {/* Signature-style wordmark */}
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: isMobile ? 56 : 68,
              color: '#d4a017',
              letterSpacing: '0.08em',
              lineHeight: 1,
              borderTop: '1px solid rgba(212,160,23,0.2)',
              paddingTop: 24,
              opacity: 0.9,
            }}>
              PRABH
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CTA
───────────────────────────────────────────── */
function CTASection({ isMobile }: { isMobile: boolean }) {
  return (
    <section style={{
      padding: isMobile ? '96px 28px 80px' : '120px 72px 100px',
      textAlign: 'center',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Radial glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 120%, rgba(212,160,23,0.1) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <Reveal>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.26em',
          color: '#d4a017',
          textTransform: 'uppercase',
          display: 'block',
          marginBottom: 28,
        }}>Ready to Begin?</span>
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: isMobile ? 'clamp(56px, 14vw, 80px)' : 'clamp(64px, 7vw, 104px)',
          lineHeight: 0.9,
          letterSpacing: '-0.02em',
          color: '#f5f0e8',
          marginBottom: 20,
        }}>
          LET'S BUILD<br />YOUR{' '}
          <span style={{ color: '#d4a017' }}>LEGACY.</span>
        </h2>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: isMobile ? 17 : 19,
          lineHeight: 1.8,
          color: 'rgba(245,240,232,0.4)',
          maxWidth: 380,
          margin: '0 auto 52px',
        }}>
          Every great career started with a single decision to begin.
        </p>
        <GoldBtn large href={"https://mail.google.com/mail/?view=cm&fs=1&to=support@prabhmusik.com&su=Start%20Your%20Journey&body=Name:%0AEmail:%0AProject%20Type:%20%0A%0ADetails:%0A"}>Start Your Journey</GoldBtn>
      </Reveal>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────── */
// function Footer({ isMobile }: { isMobile: boolean }) {
//   return (
//     <footer style={{
//       padding: isMobile ? '28px 28px' : '28px 72px',
//       borderTop: '1px solid rgba(212,160,23,0.15)',
//       display: 'flex',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       flexWrap: 'wrap',
//       gap: 16,
//     }}>
//       <span style={{
//         fontFamily: "'Bebas Neue', sans-serif",
//         fontSize: 20,
//         color: '#d4a017',
//         letterSpacing: '0.14em',
//       }}>PRABH MUSIK</span>
//       <span style={{
//         fontFamily: "'Space Mono', monospace",
//         fontSize: 9,
//         letterSpacing: '0.2em',
//         color: 'rgba(212,160,23,0.35)',
//         textTransform: 'uppercase',
//       }}>© 2025 · All Rights Reserved</span>
//     </footer>
//   );
// }

/* ─────────────────────────────────────────────
   ROOT
───────────────────────────────────────────── */
export default function PrabhMusikAbout() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 900);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html { scroll-behavior: smooth; }

        body {
          background: #080808;
          color: #f5f0e8;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #0d0d0d; }
        ::-webkit-scrollbar-thumb { background: #d4a017; }

        ::selection { background: rgba(212,160,23,0.28); color: #f5f0e8; }

        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes tickerR {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <div style={{ background: '#080808', minHeight: '100vh', position: 'relative' }}>
        {/* Noise overlay */}
        <div style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.45,
        }} />

        <HeroSection isMobile={isMobile} />
        <Ticker />
        <VisionSection isMobile={isMobile} />
        <ServicesSection isMobile={isMobile} />
        <Ticker reversed />
        <ProcessSection isMobile={isMobile} />
        <SuccessSection isMobile={isMobile} />
        <FounderSection isMobile={isMobile} />
        <CTASection isMobile={isMobile} />
        {/* <Footer isMobile={isMobile} /> */}
      </div>
    </>
  );
}