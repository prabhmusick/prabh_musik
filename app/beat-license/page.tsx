import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/config/site";
import { CANONICAL_DOMAIN, createBreadcrumbSchema } from "@/lib/seo/schemas";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Beat License Agreement | Prabh Musik",
  description:
    "Learn about Prabh Musik beat licensing terms, usage rights, non-exclusive licenses, and exclusive production rights.",
  alternates: {
    canonical: `${CANONICAL_DOMAIN}/beat-license`,
  },
};

export default function BeatLicensePage() {
  const breadcrumb = createBreadcrumbSchema(`${CANONICAL_DOMAIN}/beat-license`, [
    { name: "Home", url: CANONICAL_DOMAIN },
    { name: "Beat License Agreement", url: `${CANONICAL_DOMAIN}/beat-license` },
  ]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0c10",
        color: "#e5e2e1",
        fontFamily: "'DM Sans', sans-serif",
        padding: "60px 24px 100px",
      }}
    >
      <JsonLd data={breadcrumb} />

      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 16,
          padding: "48px 40px",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#fbbf24",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Licensing Guide
        </span>

        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 800,
            margin: "12px 0 24px",
            color: "#ffffff",
          }}
        >
          Beat License Agreement
        </h1>

        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 36 }}>
          Official Licensing Terms & Usage Guidelines
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 28, lineHeight: 1.8, fontSize: 15, color: "rgba(255,255,255,0.85)" }}>
          <section>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>1. Licensing Overview</h2>
            <p>
              When you purchase a beat from Prabh Musik, you are purchasing a license to record your vocals over the instrumental and distribute your song according to the specific license tier selected at checkout.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>2. Non-Exclusive vs Exclusive Rights</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
              <div style={{ background: "rgba(255,255,255,0.04)", padding: 20, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 style={{ color: "#fbbf24", fontSize: 16, margin: "0 0 8px" }}>Non-Exclusive License</h3>
                <p style={{ margin: 0, fontSize: 13.5, color: "rgba(255,255,255,0.75)" }}>
                  Allows distribution on streaming platforms up to specified stream/sales limits. The producer retains ownership and may license the beat to other artists.
                </p>
              </div>
              <div style={{ background: "rgba(251,191,36,0.08)", padding: 20, borderRadius: 10, border: "1px solid rgba(251,191,36,0.2)" }}>
                <h3 style={{ color: "#fbbf24", fontSize: 16, margin: "0 0 8px" }}>Exclusive License</h3>
                <p style={{ margin: 0, fontSize: 13.5, color: "rgba(255,255,255,0.9)" }}>
                  Removes the beat from the catalog permanently. Grants unlimited distribution, radio play, and sync licensing rights.
                </p>
              </div>
            </div>
          </section>

          <section style={{ background: "rgba(255,255,255,0.04)", padding: 22, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>3. Producer Tag & Credit Requirement</h2>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.9)" }}>
              All non-exclusive releases must explicitly credit the producer in track metadata and titles: <strong>Produced by Prabh Musik</strong> (or <strong>Prod. Prabh Musik</strong>).
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>4. Questions & Custom Licensing</h2>
            <p style={{ marginBottom: 12 }}>
              Need custom stem files, exclusive rights buyout, or commercial sync licensing for film/TV? Get in touch directly:
            </p>
            <div style={{ background: "rgba(255,255,255,0.04)", padding: 18, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Prabh Musik Licensing</p>
              <p style={{ margin: "4px 0 0" }}>Email: <a href={SITE_CONFIG.contact.emailMailto} style={{ color: "#fbbf24" }}>{SITE_CONFIG.contact.email}</a></p>
              <p style={{ margin: "4px 0 0" }}>WhatsApp: <a href={SITE_CONFIG.contact.whatsappLink} target="_blank" rel="noopener noreferrer" style={{ color: "#25D366" }}>{SITE_CONFIG.contact.whatsappDisplay}</a></p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
