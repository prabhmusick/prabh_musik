import HomePage from "./HomePage";
import { JsonLd } from "@/components/seo/JsonLd";
import { CANONICAL_DOMAIN } from "@/lib/seo/schemas";

const homepageWebPageSchema = {
  "@type": "WebPage",
  "@id": `${CANONICAL_DOMAIN}/#webpage`,
  url: CANONICAL_DOMAIN,
  name: "Prabh Musik - Buy Beats, Custom Beats & Studio Services",
  description:
    "Official website of Prabh Musik. Buy studio-grade Punjabi & Hip-Hop beats, custom production, mixing & mastering, and lyrics.",
  isPartOf: {
    "@id": `${CANONICAL_DOMAIN}/#website`,
  },
  about: {
    "@id": `${CANONICAL_DOMAIN}/#organization`,
  },
};

export default function Home() {
  return (
    <>
      <JsonLd data={homepageWebPageSchema} />
      <HomePage />
    </>
  );
}

