"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

export default function TurfDetailsClient({ turf }: { turf: Turf }) {
  const router = useRouter();
  const supabase = createClient();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [playerCount, setPlayerCount] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  const nairobiToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
  }).format(new Date());

  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!turf) return;

    if (!bookingDate || !startTime || !endTime) {
      setError("Please select a date, start time and end time.");
      return;
    }

    if (endTime <= startTime) {
      setError("The booking end time must be later than the start time.");
      return;
    }

    if (bookingDate < nairobiToday) {
      setError("Please select today or a future date.");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.push(`/login?next=${encodeURIComponent(`/turfs/${turf.id}`)}`);
      return;
    }

    const { data, error: bookingError } = await supabase.rpc(
      "create_booking_request",
      {
        p_turf_id: turf.id,
        p_booking_date: bookingDate,
        p_start_time: startTime,
        p_end_time: endTime,
        p_player_count: playerCount ? Number(playerCount) : null,
        p_customer_note: customerNote.trim(),
      }
    );

    if (bookingError) {
      setError(bookingError.message || "We could not create your booking.");
      setSubmitting(false);
      return;
    }

    const bookingId = data as string;

    router.push(`/my-bookings?created=${encodeURIComponent(bookingId)}`);
    router.refresh();
  }

  const images = turf.turf_images ?? [];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/turfs"
          className="mb-6 inline-flex text-sm font-semibold text-green-700 hover:text-green-900"
        >
          ← Back to turfs
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <div className="overflow-hidden rounded-2xl bg-gray-200">
              {images.length > 0 ? (
                <img
                  src={images[0].image_url}
                  alt={images[0].alt_text || turf.name}
                  className="h-72 w-full object-cover sm:h-96"
                />
              ) : (
                <div className="flex h-72 items-center justify-center text-gray-500 sm:h-96">
                  No turf image available
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {images.slice(1, 4).map((image) => (
                  <img
                    key={image.id}
                    src={image.image_url}
                    alt={image.alt_text || turf.name}
                    className="h-24 w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            )}

            <div className="mt-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-950">
                    {turf.name}
                  </h1>
                  <p className="mt-2 text-gray-600">
                    {turf.town}, {turf.county}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {turf.address}
                  </p>
                </div>

                <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
                  {turf.booking_mode === "instant"
                    ? "Instant booking"
                    : "Owner approval required"}
                </span>
              </div>

              <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-sm text-gray-500">Price per hour</p>
                <p className="mt-1 text-3xl font-extrabold text-green-700">
                  KSh {Number(turf.price_per_hour).toLocaleString("en-KE")}
                </p>
              </div>

              {turf.description && (
                <div className="mt-7">
                  <h2 className="text-xl font-bold text-gray-900">
                    About this turf
                  </h2>
                  <p className="mt-3 leading-7 text-gray-600">
                    {turf.description}
                  </p>
                </div>
              )}

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-white p-5">
                  <h2 className="font-bold text-gray-900">Operating hours</h2>
                  <p className="mt-2 text-gray-600">
                    {turf.opening_time} – {turf.closing_time}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-5">
                  <h2 className="font-bold text-gray-900">Player capacity</h2>
                  <p className="mt-2 text-gray-600">
                    {turf.capacity ?? "Contact the turf owner"}
                  </p>
                </div>
              </div>

              {turf.facilities && turf.facilities.length > 0 && (
                <div className="mt-7">
                  <h2 className="text-xl font-bold text-gray-900">
                    Facilities
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {turf.facilities.map((facility) => (
                      <span
                        key={facility}
                        className="rounded-full bg-green-50 px-4 py-2 text-sm text-green-800"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside>
            <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-950">
                Book this turf
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Choose your preferred date and playing time.
              </p>

              <form onSubmit={submitBooking} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="booking-date"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Booking date
                  </label>
                  <input
                    id="booking-date"
                    type="date"
                    min={nairobiToday}
                    value={bookingDate}
                    onChange={(event) => setBookingDate(event.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="start-time"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Start time
                    </label>
                    <input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      required
                      className="w-full rounded-xl border border-gray-300 px-3 py-3 text-gray-900 outline-none focus:border-green-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="end-time"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      End time
                    </label>
                    <input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      required
                      className="w-full rounded-xl border border-gray-300 px-3 py-3 text-gray-900 outline-none focus:border-green-600"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="players"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Number of players (optional)
                  </label>
                  <input
                    id="players"
                    type="number"
                    min="1"
                    max="100"
                    value={playerCount}
                    onChange={(event) => setPlayerCount(event.target.value)}
                    placeholder="e.g. 10"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="customer-note"
                    className="mb-2 block text-sm font-semibold text-gray-800"
                  >
                    Additional note (optional)
                  </label>
                  <textarea
                    id="customer-note"
                    rows={3}
                    value={customerNote}
                    onChange={(event) => setCustomerNote(event.target.value)}
                    placeholder="Any additional information..."
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                  >
                    {error}
                  </p>
                )}

                {success && (
                  <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-green-700 px-5 py-4 font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Request booking"}
                </button>

                <p className="text-center text-xs leading-5 text-gray-500">
                  Your booking is subject to the turf&apos;s availability and
                  booking rules. Payment is handled after the booking is
                  approved.
                </p>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
