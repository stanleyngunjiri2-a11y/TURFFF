import type { MetadataRoute } from "next";

const SITE_URL = "https://www.turff.co.ke";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/about",
        "/contact",
        "/pricing",
        "/turfs",
        "/terms",
        "/privacy",
        "/cookies",
      ],
      disallow: [
        "/admin/",
        "/owner/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/my-bookings",
        "/auth/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
