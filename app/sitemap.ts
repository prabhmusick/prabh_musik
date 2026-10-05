import { MetadataRoute } from "next";
import { CANONICAL_DOMAIN } from "@/lib/seo/schemas";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/about",
    "/services",
    "/services/music-production",
    "/services/mix-n-master",
    "/services/lyrics",
    "/services/marketing-distribution",
    "/beat",
    "/privacy",
    "/terms",
    "/beat-license",
  ];

  return routes.map((route) => {
    const isLegal = route === "/privacy" || route === "/terms" || route === "/beat-license";
    return {
      url: `${CANONICAL_DOMAIN}${route}`,
      lastModified: new Date(),
      changeFrequency: route === "" || route === "/beat" ? "daily" : isLegal ? "monthly" : "weekly",
      priority: route === "" ? 1.0 : route === "/beat" ? 0.9 : isLegal ? 0.4 : 0.8,
    };
  });
}
