"use client";

import { useEffect, useState } from "react";
import {
  getWorkedWithArtists,
  WorkedWithArtist,
} from "../../services/artist.service";

type ServiceVisibility =
  | "showOnMixMaster"
  | "showOnLyrics"
  | "showOnMarketingDistribution";

export function WorkedWithArtistsSection({
  visibility,
}: {
  visibility: ServiceVisibility;
}) {
  const [artists, setArtists] = useState<WorkedWithArtist[]>([]);

  useEffect(() => {
    let isMounted = true;

    getWorkedWithArtists()
      .then((items) => {
        if (isMounted) {
          setArtists(items.filter((artist) => artist[visibility]));
        }
      })
      .catch(() => {
        if (isMounted) setArtists([]);
      });

    return () => {
      isMounted = false;
    };
  }, [visibility]);

  if (artists.length === 0) return null;

  return (
    <section className="worked-with-section">
      <style>{`
        .worked-with-section {
          padding: 84px clamp(24px, 6vw, 72px);
          background: linear-gradient(180deg, transparent, rgba(240,123,32,0.035), transparent);
          color: #f0ebe3;
        }
        .worked-with-inner { max-width: 1200px; margin: 0 auto; }
        .worked-with-header { margin-bottom: 30px; }
        .worked-with-kicker {
          margin-bottom: 12px; color: #f07b20; font: 600 10px/1.2 'DM Mono', monospace;
          letter-spacing: 2px; text-transform: uppercase;
        }
        .worked-with-title {
          margin: 0; color: #f0ebe3; font: 700 clamp(30px, 4vw, 48px)/1.1 'Playfair Display', Georgia, serif;
        }
        .worked-with-title em { color: #e8a050; }
        .worked-with-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
        .worked-with-card {
          overflow: hidden; border: 1px solid rgba(255,255,255,.08); border-radius: 10px;
          background: #111; transition: border-color .25s ease, transform .25s ease;
        }
        .worked-with-card:hover { transform: translateY(-4px); border-color: rgba(240,123,32,.42); }
        .worked-with-image { height: 230px; background: #19130d; }
        .worked-with-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .worked-with-info { padding: 20px 22px 22px; }
        .worked-with-name { margin: 0 0 7px; color: #fff; font: 700 22px/1.2 'Playfair Display', Georgia, serif; }
        .worked-with-meta { color: #8d8881; font: 500 11px/1.6 'DM Mono', monospace; letter-spacing: .5px; text-transform: uppercase; }
        @media (max-width: 640px) {
          .worked-with-section { padding: 60px 20px; }
          .worked-with-grid { grid-template-columns: 1fr; gap: 14px; }
          .worked-with-image { height: 210px; }
        }
      `}</style>
      <div className="worked-with-inner">
        <header className="worked-with-header">
          <div className="worked-with-kicker">Featured Collaborations</div>
          <h2 className="worked-with-title">
            Artists We&apos;ve <em>Worked With</em>
          </h2>
        </header>
        <div className="worked-with-grid">
          {artists.map((artist) => (
            <article className="worked-with-card" key={artist.id}>
              <div className="worked-with-image">
                <img src={artist.image} alt={artist.name} loading="lazy" />
              </div>
              <div className="worked-with-info">
                <h3 className="worked-with-name">{artist.name}</h3>
                <div className="worked-with-meta">
                  {[artist.musicType, artist.popularSong, artist.workedYear]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
