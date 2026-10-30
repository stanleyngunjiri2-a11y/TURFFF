import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Search, Clock3, Users, ImageIcon } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Find Football Turfs | TURFF",
  description:
    "Discover approved football turfs in Kenya, compare hourly prices, and find a pitch for your next game.",
};

type TurfsPageProps = {
  searchParams: Promise<{
    location?: string;
  }>;
};

function formatPrice(price: number | string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(price));
}

function formatTime(value: string | null) {
  if (!value) return null;

  const [hours, minutes] = value.split(":");
  const hour = Number(hours);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minutes} ${suffix}`;
}

export default async function TurfsPage({
  searchParams,
}: TurfsPageProps) {
  const params = await searchParams;
  const location = (params.location ?? "").trim().slice(0, 100);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("turfs")
    .select(
      `
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
        turf_images (
          id,
          image_url,
          alt_text,
          position
        )
      `
    )
    .eq("review_status", "approved")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const turfs = (data ?? []).filter((turf) => {
    if (!location) return true;

    const searchableText = [
      turf.name,
      turf.description,
      turf.county,
      turf.town,
      turf.address,
      ...(turf.facilities ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();

    return searchableText.includes(location.toLocaleLowerCase());
  });

  return (
    <SiteShell>
      <section className="bg-green-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-widest text-green-300">
            Find your next game
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Your next game starts here.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-green-100">
            Discover football pitches, compare hourly prices, and find
            a place to bring your squad together.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
        <form
          action="/turfs"
          method="get"
          className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:p-5"
        >
          <label htmlFor="location" className="sr-only">
            Search by town, county, address, or facility
          </label>

          <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-300 px-4">
            <Search
              size={20}
              className="shrink-0 text-gray-500"
              aria-hidden="true"
            />

            <input
              id="location"
              name="location"
              type="search"
              maxLength={100}
              defaultValue={location}
              placeholder="Search town, county, estate, or facility"
              className="min-h-12 w-full bg-transparent text-gray-950 outline-none placeholder:text-gray-500"
            />
          </div>

          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-green-800 px-6 font-bold text-white transition hover:bg-green-900"
          >
            <Search size={18} aria-hidden="true" />
            Search turfs
          </button>

          {location && (
            <Link
              href="/turfs"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-gray-300 px-5 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Clear
            </Link>
          )}
        </form>

        <div className="mt-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-green-800">
              Discover pitches
            </p>

            <h2 className="mt-2 text-2xl font-black text-gray-950 sm:text-3xl">
              {location ? `Results for "${location}"` : "Explore available turfs"}
            </h2>
          </div>

          {!error && (
            <p className="text-sm text-gray-600">
              {turfs.length} {turfs.length === 1 ? "turf" : "turfs"} found
            </p>
          )}
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6"
          >
            <h3 className="font-bold text-red-900">
              We could not load the turf listings.
            </h3>

            <p className="mt-2 text-sm leading-6 text-red-800">
              Please try again. If the problem continues, check that the
              database migration has been applied to the correct Supabase
              project and that the database policies permit public discovery
              of approved turfs.
            </p>
          </div>
        ) : turfs.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {turfs.map((turf) => {
              const images = [...(turf.turf_images ?? [])].sort(
                (a, b) => a.position - b.position
              );

              const openingTime = formatTime(turf.opening_time);
              const closingTime = formatTime(turf.closing_time);

              return (
                <article
                  key={turf.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-green-50">
                    {images[0]?.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={images[0].image_url}
                        alt={images[0].alt_text || `${turf.name} football pitch`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3 px-5 text-center text-green-900">
                        <ImageIcon size={38} aria-hidden="true" />
                        <span className="text-sm font-medium">
                          Turf photo coming soon
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-bold text-gray-950">
                        {turf.name}
                      </h3>

                      <div className="shrink-0 text-right">
                        <p className="font-black text-green-800">
                          {formatPrice(turf.price_per_hour)}
                        </p>
                        <p className="text-xs text-gray-500">per hour</p>
                      </div>
                    </div>

                    <p className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                      <MapPin
                        size={17}
                        className="mt-0.5 shrink-0 text-green-800"
                        aria-hidden="true"
                      />
                      <span>
                        {[turf.address, turf.town, turf.county]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </p>

                    {turf.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                        {turf.description}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600">
                      {turf.capacity && (
                        <span className="inline-flex items-center gap-1.5">
                          <Users size={16} aria-hidden="true" />
                          {turf.capacity} players
                        </span>
                      )}

                      {openingTime && closingTime && (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={16} aria-hidden="true" />
                          {openingTime} – {closingTime}
                        </span>
                      )}
                    </div>

                    {turf.facilities?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {turf.facilities.slice(0, 4).map((facility: string) => (
                          <span
                            key={facility}
                            className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-900"
                          >
                            {facility}
                          </span>
                        ))}
                      </div>
                    )}

                    <Link
                      href={`/register`}
                      className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-green-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-900"
                    >
                      Create an account to get started
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white px-6 py-12 text-center sm:px-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-800">
              <MapPin size={26} aria-hidden="true" />
            </div>

            <h3 className="mt-5 text-xl font-bold text-gray-950">
              {location
                ? "No matching turfs found"
                : "The pitch is being prepared"}
            </h3>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">
              {location
                ? "Try another town, county, estate, or facility name."
                : "There are no approved turf listings to display yet. Check back soon, or register if you manage a football pitch and want to list it on TURFF."}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              {location && (
                <Link
                  href="/turfs"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-5 font-semibold text-gray-800 hover:bg-gray-50"
                >
                  View all turfs
                </Link>
              )}

              <Link
                href="/register"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-green-800 px-5 font-bold text-white hover:bg-green-900"
              >
                Join TURFF
              </Link>
            </div>
          </div>
        )}
      </section>
    </SiteShell>
  );
}
