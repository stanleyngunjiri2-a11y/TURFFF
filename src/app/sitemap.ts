import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = "https://www.turff.co.ke";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/turfs`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/pricing`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/cookies`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("turfs")
      .select("id, updated_at")
      .eq("review_status", "approved")
      .eq("is_active", true);

    if (error || !data) {
      console.error("Could not retrieve public turfs for sitemap:", error);
      return staticPages;
    }

    const turfPages: MetadataRoute.Sitemap = data.map((turf) => ({
      url: `${SITE_URL}/turfs/${turf.id}`,
      lastModified: turf.updated_at
        ? new Date(turf.updated_at)
        : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticPages, ...turfPages];
  } catch (error) {
    console.error("Sitemap generation failed:", error);
    return staticPages;
  }
}
