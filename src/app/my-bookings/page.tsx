"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PaymentForm from "./payment-form";

type Booking = {
  id: string;
  turf_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  player_count: number | null;
  customer_note: string | null;
  status: string;
  payment_status: string;
  payment_reference: string | null;
  payment_note: string | null;
  created_at: string;
  turf:
    | {
        name: string;
        county: string;
        town: string;
        address: string;
        price_per_hour: number;
      }
    | null;
};

function statusStyle(status: string) {
  switch (status) {
    case "approved":
    case "completed":
    case "verified":
      return "bg-green-100 text-green-800";
    case "pending":
    case "pending_verification":
      return "bg-amber-100 text-amber-800";
    case "rejected":
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

function MyBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = useCallback(async () => {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.replace(`/login?next=${encodeURIComponent("/my-bookings")}`);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("bookings")
      .select(`
        id,
        turf_id,
        booking_date,
        start_time,
        end_time,
        player_count,
        customer_note,
        status,
        payment_status,
        payment_reference,
        payment_note,
        created_at,
        turf:turfs (
          name,
          county,
          town,
          address,
          price_per_hour
        )
      `)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setBookings((data ?? []) as unknown as Booking[]);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBookings();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadBookings]);

  const createdMessage = Boolean(searchParams.get("created"));

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
              Your account
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-gray-950">
              My bookings
            </h1>
            <p className="mt-2 text-gray-600">
              Track your turf bookings and payment verification.
            </p>
          </div>

          <Link
            href="/turfs"
            className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
          >
            Find a turf
          </Link>
        </div>

        {createdMessage && (
          <div className="mt-7 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            Your booking request was submitted successfully. Check its status
            below.
          </div>
        )}

        {error && (
          <div role="alert" className="mt-7 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-gray-600">
            Loading your bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <h2 className="text-xl font-bold text-gray-900">
              No bookings yet
            </h2>
            <p className="mt-2 text-gray-600">
              Browse available turfs and make your first booking.
            </p>
            <Link
              href="/turfs"
              className="mt-6 inline-block rounded-xl bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
            >
              Browse available turfs
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {bookings.map((booking) => (
              <article
                key={booking.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-950">
                      {booking.turf?.name ?? "Turf"}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {booking.turf?.town ?? ""},{" "}
                      {booking.turf?.county ?? ""}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-2 text-xs font-bold capitalize ${statusStyle(booking.status)}`}
                  >
                    {label(booking.status)}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Date
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {booking.booking_date}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Time
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {booking.start_time.slice(0, 5)} –{" "}
                      {booking.end_time.slice(0, 5)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Players
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {booking.player_count ?? "Not specified"}
                    </p>
                  </div>
                </div>

                {booking.customer_note && (
                  <p className="mt-4 text-sm text-gray-600">
                    <span className="font-semibold">Your note:</span>{" "}
                    {booking.customer_note}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5">
                  <span className="text-sm font-semibold text-gray-700">
                    Payment:
                  </span>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${statusStyle(booking.payment_status)}`}
                  >
                    {label(booking.payment_status)}
                  </span>
                </div>

                {booking.payment_reference && (
                  <p className="mt-3 text-sm text-gray-600">
                    M-Pesa reference:{" "}
                    <span className="font-semibold text-gray-900">
                      {booking.payment_reference}
                    </span>
                  </p>
                )}

                {booking.status === "approved" &&
                  ["unpaid", "rejected"].includes(booking.payment_status) && (
                    <div className="mt-5 rounded-xl bg-gray-50 p-4">
                      <h3 className="font-bold text-gray-900">
                        Submit your payment reference
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        Follow the payment instructions provided by the turf
                        owner, then submit your M-Pesa transaction reference
                        for verification.
                      </p>
                      <PaymentForm bookingId={booking.id} />
                    </div>
                  )}

                {booking.payment_status === "pending_verification" && (
                  <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                    Your payment reference has been submitted and is awaiting
                    verification by the turf owner.
                  </p>
                )}

                {booking.payment_status === "verified" && (
                  <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">
                    Your payment has been verified.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}


export default function MyBookingsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 px-4 py-20 text-center text-gray-600">
          Loading your bookings...
        </main>
      }
    >
      <MyBookingsContent />
    </Suspense>
  );
}
