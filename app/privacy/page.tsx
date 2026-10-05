import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/config/site";
import { CANONICAL_DOMAIN, createBreadcrumbSchema } from "@/lib/seo/schemas";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Privacy Policy | Prabh Musik",
  description:
    "Read the Prabh Musik Privacy Policy to learn how we collect, use, protect, and handle your personal information.",
  alternates: {
    canonical: `${CANONICAL_DOMAIN}/privacy`,
  },
};

export default function PrivacyPage() {
  const breadcrumb = createBreadcrumbSchema(`${CANONICAL_DOMAIN}/privacy`, [
    { name: "Home", url: CANONICAL_DOMAIN },
    { name: "Privacy Policy", url: `${CANONICAL_DOMAIN}/privacy` },
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
          Legal & Compliance
        </span>

        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 800,
            margin: "12px 0 24px",
            color: "#ffffff",
          }}
        >
          Privacy Policy
        </h1>

        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 36 }}>
          Last Updated: October 2026
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 28, lineHeight: 1.8, fontSize: 15, color: "rgba(255,255,255,0.85)" }}>
          <section>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>1. Introduction</h2>
            <p>
              Prabh Musik ("we," "our," or "us") respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy outlines how we collect, use, store, and safeguard your data when you visit our website at <a href={SITE_CONFIG.domain} style={{ color: "#fbbf24", textDecoration: "none" }}>{SITE_CONFIG.domain}</a> or purchase music production, mixing & mastering, or beat licensing services.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>2. Information We Collect</h2>
            <p style={{ marginBottom: 12 }}>We collect information necessary to provide and improve our services, including:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong>Contact Information:</strong> Name, email address, phone number, and mailing address.</li>
              <li><strong>Account Credentials:</strong> Passwords and account management preferences.</li>
              <li><strong>Transaction & Purchase Data:</strong> Orders, license details, and billing history. Payment card details are processed directly by certified third-party payment gateways and are never stored on our servers.</li>
              <li><strong>Communications:</strong> Messages, custom project briefs, and support inquiries voluntarily submitted via forms or direct email.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>3. How We Use Your Information</h2>
            <p style={{ marginBottom: 12 }}>Your information is used solely for legitimate business purposes:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>Processing purchases and delivering digital audio files and beat license contracts.</li>
              <li>Providing customer support and communicating project updates.</li>
              <li>Account security, authentication, and fraud prevention.</li>
              <li>Improving website performance, audio streaming, and overall user experience.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>4. Third-Party Services & Payment Processors</h2>
            <p>
              We partner with trusted third-party payment service providers and cloud storage providers (such as Cloudflare R2) for secure digital asset delivery. These third parties access data strictly to perform their contracted services under privacy and security standards.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>5. Cookies & Technical Analytics</h2>
            <p>
              We use essential cookies and session storage to maintain authentication, manage your shopping cart state, and remember playback preferences. Technical analytics help us monitor site performance without profiling individuals.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>6. Data Security & Retention</h2>
            <p>
              We implement industry-standard encryption, strict access controls, and parameterized database queries to safeguard your information. We retain personal data only as long as necessary to fulfill orders, legal obligations, and accounting requirements.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, color: "#fbbf24", marginBottom: 12, fontWeight: 700 }}>7. Your Rights & Contact Information</h2>
            <p style={{ marginBottom: 12 }}>
              You have the right to request access to, correction of, or deletion of your personal data stored with us. For privacy-related inquiries, contact us at:
            </p>
            <div style={{ background: "rgba(255,255,255,0.04)", padding: 18, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Prabh Musik Support</p>
              <p style={{ margin: "4px 0 0" }}>Email: <a href={SITE_CONFIG.contact.emailMailto} style={{ color: "#fbbf24" }}>{SITE_CONFIG.contact.email}</a></p>
              <p style={{ margin: "4px 0 0" }}>Phone: <a href={SITE_CONFIG.contact.phoneTel} style={{ color: "#fbbf24" }}>{SITE_CONFIG.contact.phoneDisplay}</a></p>
              <p style={{ margin: "4px 0 0" }}>Location: {SITE_CONFIG.contact.address.display}</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
