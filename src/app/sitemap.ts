import type { MetadataRoute } from "next";

const SITE_URL = "https://turfff.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicPages = [
    "",
    "/about",
    "/contact",
    "/pricing",
    "/turfs",
    "/terms",
    "/privacy",
    "/cookies",
  ];

  return publicPages.map((page) => ({
    url: `${SITE_URL}${page}`,
    lastModified: new Date(),
    changeFrequency: page === "" ? "daily" : "weekly",
    priority: page === "" ? 1 : page === "/turfs" ? 0.9 : 0.7,
  }));
}
