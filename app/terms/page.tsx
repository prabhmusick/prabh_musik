import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/config/site";
import { CANONICAL_DOMAIN, createBreadcrumbSchema } from "@/lib/seo/schemas";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Terms & Conditions | Prabh Musik",
  description:
    "Review the Terms and Conditions for purchasing beats, licenses, and music services from Prabh Musik.",
  alternates: {
    canonical: `${CANONICAL_DOMAIN}/terms`,
  },
};

export default function TermsPage() {
  const breadcrumb = createBreadcrumbSchema(`${CANONICAL_DOMAIN}/terms`, [
    { name: "Home", url: CANONICAL_DOMAIN },
    { name: "Terms & Conditions", url: `${CANONICAL_DOMAIN}/terms` },
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
          Legal Agreement
        </span>

        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 800,
            margin: "12px 0 24px",
            color: "#ffffff",
          }}
        >
          Terms & Conditions
        </h1>

        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 36 }}>
          Last Updated: October 2026
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 28, lineHeight: 1.8, fontSize: 15, color: "rgba(255,255,255,0.85)" }}>
          <section>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>1. Website Usage</h2>
            <p>
              By accessing or using the Prabh Musik website (<a href={SITE_CONFIG.domain} style={{ color: "#fbbf24", textDecoration: "none" }}>{SITE_CONFIG.domain}</a>), you agree to comply with and be bound by these Terms & Conditions. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>2. User Accounts</h2>
            <p>
              When creating an account, you agree to provide accurate registration information and keep your credentials secure. You are responsible for all activities occurring under your account.
            </p>
          </section>

          <section style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.25)", padding: 22, borderRadius: 12 }}>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>3. Purchase & Refund Policy</h2>
            <p style={{ fontWeight: 700, color: "#ffffff", fontSize: 16, marginBottom: 8 }}>
              All Beat Purchases Are Final
            </p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.9)" }}>
              Due to the digital nature of our products, all beat purchases are final and non-refundable once the purchase has been completed, except where required by applicable law. Downloads are made available immediately upon payment verification.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>4. Intellectual Property & Beat Licenses</h2>
            <p>
              Purchasing a beat license does <strong>NOT</strong> automatically transfer full ownership of the underlying master compositions or copyrights unless an explicit Exclusive License agreement is executed in writing. Your usage rights (streaming limits, broadcast rights, distribution rights) are defined strictly by the applicable beat license agreement chosen at checkout.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>5. Prohibited Use</h2>
            <p>
              Users may not re-sell, re-license, upload raw audio files to content identification systems (e.g. YouTube Content ID) without exclusive rights, or distribute un-edited beat files. Unauthorized duplication or piracy is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>6. Payments & Third-Party Providers</h2>
            <p>
              All prices listed are in Indian Rupees (INR) unless otherwise specified. Transactions are processed securely through certified payment gateways. Prabh Musik is not responsible for gateway downtime or transaction delays caused by financial institutions.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>7. Contact Information</h2>
            <p style={{ marginBottom: 12 }}>
              If you have questions regarding these terms, please contact:
            </p>
            <div style={{ background: "rgba(255,255,255,0.04)", padding: 18, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Prabh Musik Support</p>
              <p style={{ margin: "4px 0 0" }}>Email: <a href={SITE_CONFIG.contact.emailMailto} style={{ color: "#fbbf24" }}>{SITE_CONFIG.contact.email}</a></p>
              <p style={{ margin: "4px 0 0" }}>Phone: <a href={SITE_CONFIG.contact.phoneTel} style={{ color: "#fbbf24" }}>{SITE_CONFIG.contact.phoneDisplay}</a></p>
              <p style={{ margin: "4px 0 0" }}>WhatsApp: <a href={SITE_CONFIG.contact.whatsappLink} target="_blank" rel="noopener noreferrer" style={{ color: "#25D366" }}>{SITE_CONFIG.contact.whatsappDisplay}</a></p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
