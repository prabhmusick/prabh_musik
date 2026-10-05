import { SITE_CONFIG } from "@/lib/config/site";

export const CANONICAL_DOMAIN = SITE_CONFIG.domain;

export const ORGANIZATION_SCHEMA = {
  "@type": "OnlineStore",
  "@id": `${CANONICAL_DOMAIN}/#organization`,
  name: SITE_CONFIG.name,
  alternateName: "PrabhMusik",
  url: CANONICAL_DOMAIN,
  logo: `${CANONICAL_DOMAIN}/favicon.ico`,
  description:
    "Buy Punjabi & Hip-Hop Beats, Custom Beats, Mixing & Mastering, and Lyrics.",
  email: SITE_CONFIG.contact.email,
  telephone: `+91${SITE_CONFIG.contact.phone}`,
  sameAs: [
    SITE_CONFIG.socials.instagram,
    SITE_CONFIG.socials.youtube,
    SITE_CONFIG.socials.facebook,
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: SITE_CONFIG.contact.address.city,
    addressRegion: SITE_CONFIG.contact.address.state,
    postalCode: SITE_CONFIG.contact.address.postalCode,
    addressCountry: "IN",
  },
  founder: {
    "@id": `${CANONICAL_DOMAIN}/#founder`,
  },
};

export const FOUNDER_SCHEMA = {
  "@type": "Person",
  "@id": `${CANONICAL_DOMAIN}/#founder`,
  name: "Prabh",
  jobTitle: "Founder & Lead Producer",
  worksFor: {
    "@id": `${CANONICAL_DOMAIN}/#organization`,
  },
};

export const WEBSITE_SCHEMA = {
  "@type": "WebSite",
  "@id": `${CANONICAL_DOMAIN}/#website`,
  name: "Prabh Musik",
  url: CANONICAL_DOMAIN,
  publisher: {
    "@id": `${CANONICAL_DOMAIN}/#organization`,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${CANONICAL_DOMAIN}/beat?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};


export function createBreadcrumbSchema(
  pageUrl: string,
  items: { name: string; url: string }[]
) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
