import { MetadataRoute } from "next";
import { CANONICAL_DOMAIN } from "@/lib/seo/schemas";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/profile/", "/checkout/"],
    },
    sitemap: `${CANONICAL_DOMAIN}/sitemap.xml`,
  };
}
