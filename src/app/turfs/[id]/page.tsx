import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TurfDetailsClient from "./turf-details-client";

const SITE_URL = "https://www.turff.co.ke";

type Turf = {
  id: string;
  name: string;
  description: string | null;
  county: string;
  town: string;
  address: string;
  price_per_hour: number;
  capacity: number | null;
  facilities: string[] | null;
  opening_time: string;
  closing_time: string;
  booking_mode: "manual" | "instant";
  turf_images: {
    id: string;
    image_url: string;
    alt_text: string | null;
    position: number;
  }[];
};

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getPublicTurf(id: string): Promise<Turf | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("turfs")
    .select(`
      id,
      name,
      description,
      county,
      town,
      address,
      price_per_hour,
      capacity,
      facilities,
      opening_time,
      closing_time,
      booking_mode,
      turf_images (
        id,
        image_url,
        alt_text,
        position
      )
    `)
    .eq("id", id)
    .eq("review_status", "approved")
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const turf = data as unknown as Turf;

  turf.turf_images = [...(turf.turf_images ?? [])].sort(
    (a, b) => a.position - b.position
  );

  return turf;
}

function makeDescription(turf: Turf): string {
  const fallback =
    `Find ${turf.name}, a football pitch in ${turf.town}, ${turf.county}, Kenya. ` +
    `View facilities, check the hourly price and request a booking with TURFF.`;

  const description = (turf.description || fallback)
    .replace(/\s+/g, " ")
    .trim();

  return description.length > 155
    ? `${description.slice(0, 152).trimEnd()}...`
    : description;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const turf = await getPublicTurf(id);

  if (!turf) {
    return {
      title: "Turf unavailable",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title =
    `${turf.name} | Football Pitch in ${turf.town}, ${turf.county}`;

  const description = makeDescription(turf);
  const canonical = `/turfs/${turf.id}`;

  const images = turf.turf_images
    .filter((image) => Boolean(image.image_url))
    .map((image) => image.image_url);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: "en_KE",
      siteName: "TURFF",
      title,
      description,
      url: `${SITE_URL}${canonical}`,
      images,
    },
    twitter: {
      card: images.length > 0 ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}

export default async function TurfDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const turf = await getPublicTurf(id);

  if (!turf) {
    notFound();
  }

  const images = turf.turf_images ?? [];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: turf.name,
    description: makeDescription(turf),
    url: `${SITE_URL}/turfs/${turf.id}`,
    ...(images.length > 0 && {
      image: images.map((image) => image.image_url),
    }),
    address: {
      "@type": "PostalAddress",
      ...(turf.address && { streetAddress: turf.address }),
      addressLocality: turf.town,
      addressRegion: turf.county,
      addressCountry: "KE",
    },
    priceRange:
      `KES ${Number(turf.price_per_hour).toLocaleString("en-KE")} per hour`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <TurfDetailsClient turf={turf} />
    </>
  );
}
