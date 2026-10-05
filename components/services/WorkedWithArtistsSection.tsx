"use client";

import { useEffect, useState } from "react";
import {
  getWorkedWithArtists,
  WorkedWithArtist,
} from "../../services/artist.service";

type ServiceVisibility =
  | "showOnMusicProduction"
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
      .then((items: WorkedWithArtist[]) => {
        if (isMounted) {
          setArtists(items.filter((artist: WorkedWithArtist) => artist[visibility]));
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
        .worked-with-header { margin-bottom: 32px; }
        .worked-with-kicker {
          margin-bottom: 12px; color: #f07b20; font: 600 11px/1.2 'DM Mono', monospace;
          letter-spacing: 2px; text-transform: uppercase;
        }
        .worked-with-title {
          margin: 0; color: #f0ebe3; font: 700 clamp(30px, 4vw, 48px)/1.1 'Playfair Display', Georgia, serif;
        }
        .worked-with-title em { color: #e8a050; }
        .worked-with-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
        .worked-with-card {
          overflow: hidden; border: 1px solid rgba(255,255,255,.08); border-radius: 16px;
          background: #111111; transition: border-color .35s ease, transform .35s ease, box-shadow .35s ease;
          display: flex; flex-direction: column; position: relative;
        }
        .worked-with-card:hover { transform: translateY(-6px); border-color: rgba(240,123,32,.5); box-shadow: 0 20px 40px rgba(0,0,0,0.65), 0 0 20px rgba(240,123,32,0.15); }
        .worked-with-image {
          height: 280px; position: relative; overflow: hidden; background: #161310;
        }
        .worked-with-image img {
          width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block;
          transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .worked-with-card:hover .worked-with-image img { transform: scale(1.07); }
        .worked-with-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 65%, rgba(17,17,17,0.95) 100%);
          pointer-events: none; z-index: 1;
        }
        .worked-with-info { padding: 22px 24px 24px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
        .worked-with-name { margin: 0 0 8px; color: #fff; font: 700 24px/1.2 'Playfair Display', Georgia, serif; }
        .worked-with-meta { color: #f07b20; font: 600 11px/1.6 'DM Mono', monospace; letter-spacing: .5px; text-transform: uppercase; }
        @media (max-width: 640px) {
          .worked-with-section { padding: 60px 20px; }
          .worked-with-grid { grid-template-columns: 1fr; gap: 16px; }
          .worked-with-image { height: 230px; }
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
                <div className="worked-with-overlay" />
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

