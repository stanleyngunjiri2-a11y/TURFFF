"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/client";

type Turf = {
  id: string;
  name: string;
  county: string;
  town: string;
  price_per_hour: number;
  review_status: string;
  is_active: boolean;
};

type Booking = {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  customer_note: string | null;
  turf_id: string;
};

type Subscription = {
  id: string;
  turf_id: string;
  plan_name: string;
  amount: number;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  payment_reference: string | null;
  created_at: string;
};

const inputClass =
  "mt-2 min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-950 outline-none focus:border-green-700";

const PAYMENT_NUMBER = "0768176570";

function formatDate(value: string | null) {
  if (!value) return "Not started";

  return new Date(value).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getEffectiveStatus(
  subscription: Subscription | undefined,
  currentTime: number | null
) {
  if (!subscription) return "No subscription";

  if (
    currentTime !== null &&
    subscription.status === "active" &&
    subscription.ends_at &&
    new Date(subscription.ends_at).getTime() <= currentTime
  ) {
    return "Expired";
  }

  return subscription.status;
}

export default function OwnerDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [paymentCodes, setPaymentCodes] = useState<Record<string, string>>({});
  const [busyTurf, setBusyTurf] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("10");
  const [facilities, setFacilities] = useState("");
  const [openingTime, setOpeningTime] = useState("08:00");
  const [closingTime, setClosingTime] = useState("22:00");

  const loadDashboard = useCallback(async () => {
    const supabase = createClient();

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      router.replace("/login?next=/owner/dashboard");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError) {
      setError("Could not verify your account.");
      setLoading(false);
      return;
    }

    if (profile.role === "superadmin") {
      router.replace("/admin/dashboard");
      return;
    }

    if (profile.role !== "turf_owner") {
      router.replace("/owner/apply");
      return;
    }

    const [turfResult, bookingResult] = await Promise.all([
      supabase
        .from("turfs")
        .select(
          "id, name, county, town, price_per_hour, review_status, is_active"
        )
        .eq("owner_id", authData.user.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("bookings")
        .select(
          "id, turf_id, booking_date, start_time, end_time, status, payment_status, customer_note"
        )
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (turfResult.error) {
      setError(turfResult.error.message);
      setLoading(false);
      return;
    }

    const turfRows = (turfResult.data ?? []) as Turf[];
    setTurfs(turfRows);

    if (bookingResult.error) {
      setError(bookingResult.error.message);
    } else {
      setBookings((bookingResult.data ?? []) as Booking[]);
    }

    if (turfRows.length > 0) {
      const { data: subscriptionRows, error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .select(
            "id, turf_id, plan_name, amount, status, starts_at, ends_at, payment_reference, created_at"
          )
          .in(
            "turf_id",
            turfRows.map((turf) => turf.id)
          )
          .order("created_at", { ascending: false });

      if (subscriptionError) {
        setError((previous) => previous || subscriptionError.message);
      } else {
        setSubscriptions((subscriptionRows ?? []) as Subscription[]);
      }
    } else {
      setSubscriptions([]);
    }

    setCurrentTime(Date.now());
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  function latestSubscription(turfId: string) {
    return subscriptions.find((item) => item.turf_id === turfId);
  }

  async function requestSubscription(turfId: string, planName: string) {
    setError("");
    setNotice("");
    setBusyTurf(turfId);

    try {
      const supabase = createClient();

      const { data, error: requestError } = await supabase.rpc(
        "request_turf_subscription",
        {
          p_turf_id: turfId,
          p_plan_name: planName,
        }
      );

      if (requestError) {
        setError(requestError.message);
        return;
      }

      if (!data) {
        setError("The subscription request was not created.");
        return;
      }

      setNotice(
        `${planName} subscription requested. Send the payment to ${PAYMENT_NUMBER}, then submit your M-Pesa transaction code below.`
      );

      await loadDashboard();
    } catch {
      setError("Could not create the subscription request.");
    } finally {
      setBusyTurf("");
    }
  }

  async function submitPayment(subscriptionId: string, turfId: string) {
    setError("");
    setNotice("");

    const reference = paymentCodes[subscriptionId]?.trim() ?? "";

    if (reference.length < 6 || reference.length > 40) {
      setError("Enter a valid M-Pesa transaction code.");
      return;
    }

    setBusyTurf(turfId);

    try {
      const supabase = createClient();

      const { error: paymentError } = await supabase.rpc(
        "submit_subscription_payment",
        {
          p_subscription_id: subscriptionId,
          p_payment_reference: reference,
        }
      );

      if (paymentError) {
        setError(paymentError.message);
        return;
      }

      setNotice(
        "Your M-Pesa transaction code has been submitted. Your subscription will activate after administrator verification."
      );

      setPaymentCodes((previous) => ({
        ...previous,
        [subscriptionId]: "",
      }));

      await loadDashboard();
    } catch {
      setError("Could not submit the payment reference.");
    } finally {
      setBusyTurf("");
    }
  }

  async function createTurf(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!name.trim() || !county.trim() || !town.trim()) {
      setError("Complete the required turf fields.");
      return;
    }

    const numericPrice = Number(price);
    const numericCapacity = Number(capacity);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError("Enter a valid hourly price.");
      return;
    }

    if (!Number.isInteger(numericCapacity) || numericCapacity < 1) {
      setError("Capacity must be a positive whole number.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.replace("/login?next=/owner/dashboard");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profile?.role !== "turf_owner") {
        setError("Only approved turf owners can submit turf listings.");
        return;
      }

      const { error: insertError } = await supabase.from("turfs").insert({
        owner_id: authData.user.id,
        name: name.trim(),
        description: description.trim(),
        county: county.trim(),
        town: town.trim(),
        address: address.trim(),
        price_per_hour: numericPrice,
        capacity: numericCapacity,
        facilities: facilities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        opening_time: openingTime,
        closing_time: closingTime,
        review_status: "pending",
        is_active: false,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setNotice(
        "Turf submitted successfully. The administrator must approve it before its five-day free trial begins."
      );

      setName("");
      setDescription("");
      setCounty("");
      setTown("");
      setAddress("");
      setPrice("");
      setCapacity("10");
      setFacilities("");

      await loadDashboard();
    } catch {
      setError("Could not submit the turf. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-7xl px-5 py-16 text-gray-600">
          Loading owner dashboard...
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="bg-green-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <p className="text-sm font-bold uppercase tracking-wider text-green-300">
            Turf owner workspace
          </p>
          <h1 className="mt-3 text-4xl font-black">Owner dashboard</h1>
          <p className="mt-3 max-w-2xl leading-7 text-green-100">
            Manage each of your turf listings, subscriptions, payments and
            booking requests from one place.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-12 px-5 py-10">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-950"
          >
            {notice}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Total turf listings</p>
            <p className="mt-2 text-3xl font-black text-gray-950">
              {turfs.length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Pending turf approvals</p>
            <p className="mt-2 text-3xl font-black text-gray-950">
              {turfs.filter((turf) => turf.review_status === "pending").length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Booking requests visible</p>
            <p className="mt-2 text-3xl font-black text-gray-950">
              {bookings.length}
            </p>
          </div>
        </div>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-gray-950">
                Your turf subscriptions
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Every turf has its own subscription and five-day trial.
              </p>
            </div>

            <Link
              href="/pricing"
              className="font-semibold text-green-800 underline"
            >
              View all plans
            </Link>
          </div>

          {turfs.length === 0 ? (
            <p className="mt-4 rounded-xl border border-gray-200 p-6 text-gray-600">
              Submit a turf listing to start the approval process.
            </p>
          ) : (
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {turfs.map((turf) => {
                const subscription = latestSubscription(turf.id);
                const effectiveStatus = getEffectiveStatus(subscription, currentTime);
                const isApproved =
                  turf.review_status === "approved" && turf.is_active;
                const isPendingPayment =
                  subscription?.status === "pending";
                const hasPaymentReference =
                  Boolean(subscription?.payment_reference);
                const isPaidActive =
                  subscription?.status === "active" &&
                  subscription.plan_name !== "Free Trial" &&
                  effectiveStatus === "active";

                return (
                  <article
                    key={turf.id}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black text-gray-950">
                          {turf.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {[turf.town, turf.county]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800">
                        {turf.review_status}
                      </span>
                    </div>

                    <p className="mt-3 font-bold text-green-800">
                      KSh{" "}
                      {Number(turf.price_per_hour).toLocaleString("en-KE")} /
                      hour
                    </p>

                    {!isApproved && (
                      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <p className="font-bold text-amber-950">
                          {turf.review_status === "pending"
                            ? "Awaiting administrator approval"
                            : "This turf is not currently approved"}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-amber-900">
                          Your five-day free trial starts only after the
                          administrator approves this individual turf.
                        </p>
                      </div>
                    )}

                    {isApproved && (
                      <div className="mt-5 rounded-lg border border-gray-200 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Subscription
                        </p>

                        {subscription ? (
                          <>
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                              <p className="text-lg font-black text-gray-950">
                                {subscription.plan_name}
                              </p>

                              <span
                                className={`rounded-full px-3 py-1 text-sm font-bold ${
                                  effectiveStatus === "active"
                                    ? "bg-green-100 text-green-900"
                                    : effectiveStatus === "pending"
                                      ? "bg-amber-100 text-amber-900"
                                      : "bg-red-100 text-red-900"
                                }`}
                              >
                                {effectiveStatus}
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-gray-600">
                              Amount: KSh{" "}
                              {Number(subscription.amount).toLocaleString(
                                "en-KE"
                              )}
                            </p>

                            {subscription.ends_at && (
                              <p className="mt-1 text-sm text-gray-600">
                                {subscription.plan_name === "Free Trial"
                                  ? "Trial ends: "
                                  : "Subscription ends: "}
                                {formatDate(subscription.ends_at)}
                              </p>
                            )}

                            {subscription.starts_at && (
                              <p className="mt-1 text-sm text-gray-600">
                                Started: {formatDate(subscription.starts_at)}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="mt-2 text-sm text-gray-600">
                            No subscription record found for this turf.
                          </p>
                        )}

                        {isPendingPayment && !hasPaymentReference && (
                          <div className="mt-4 rounded-lg bg-amber-50 p-4">
                            <p className="font-bold text-amber-950">
                              Payment required
                            </p>
                            <p className="mt-2 text-sm leading-6 text-amber-900">
                              Send KSh{" "}
                              {Number(subscription.amount).toLocaleString(
                                "en-KE"
                              )}{" "}
                              to M-Pesa number{" "}
                              <strong>{PAYMENT_NUMBER}</strong>. Enter the
                              transaction code below after paying.
                            </p>

                            <form
                              className="mt-4 space-y-3"
                              onSubmit={(event) => {
                                event.preventDefault();
                                void submitPayment(
                                  subscription.id,
                                  turf.id
                                );
                              }}
                            >
                              <label
                                htmlFor={`code-${subscription.id}`}
                                className="block text-sm font-semibold text-gray-900"
                              >
                                M-Pesa transaction code
                              </label>

                              <input
                                id={`code-${subscription.id}`}
                                value={paymentCodes[subscription.id] ?? ""}
                                onChange={(event) =>
                                  setPaymentCodes((previous) => ({
                                    ...previous,
                                    [subscription.id]: event.target.value,
                                  }))
                                }
                                required
                                minLength={6}
                                maxLength={40}
                                className={inputClass}
                                placeholder="e.g. QWE1234567"
                              />

                              <button
                                type="submit"
                                disabled={busyTurf === turf.id}
                                className="min-h-11 w-full rounded-lg bg-green-800 px-5 font-bold text-white hover:bg-green-900 disabled:opacity-60"
                              >
                                {busyTurf === turf.id
                                  ? "Submitting..."
                                  : "Submit payment code"}
                              </button>
                            </form>
                          </div>
                        )}

                        {isPendingPayment && hasPaymentReference && (
                          <div className="mt-4 rounded-lg bg-amber-50 p-4">
                            <p className="font-bold text-amber-950">
                              Awaiting payment verification
                            </p>
                            <p className="mt-1 text-sm text-amber-900">
                              Submitted code:{" "}
                              <strong>
                                {subscription.payment_reference}
                              </strong>
                            </p>
                            <p className="mt-1 text-sm text-amber-900">
                              Your paid subscription activates after an
                              administrator verifies the payment.
                            </p>
                          </div>
                        )}

                        {isPaidActive && (
                          <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-900">
                            Your paid subscription is active for this turf.
                          </div>
                        )}

                        {!isPendingPayment &&
                          !isPaidActive &&
                          effectiveStatus !== "active" && (
                            <div className="mt-4">
                              <p className="text-sm leading-6 text-gray-600">
                                Choose a paid plan to continue receiving new
                                booking requests after your trial expires.
                              </p>

                              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <button
                                  type="button"
                                  disabled={busyTurf === turf.id}
                                  onClick={() =>
                                    void requestSubscription(
                                      turf.id,
                                      "Standard"
                                    )
                                  }
                                  className="min-h-12 rounded-lg border border-green-700 px-4 font-bold text-green-900 hover:bg-green-50 disabled:opacity-60"
                                >
                                  Standard · KSh 999
                                </button>

                                <button
                                  type="button"
                                  disabled={busyTurf === turf.id}
                                  onClick={() =>
                                    void requestSubscription(
                                      turf.id,
                                      "Professional"
                                    )
                                  }
                                  className="min-h-12 rounded-lg bg-green-800 px-4 font-bold text-white hover:bg-green-900 disabled:opacity-60"
                                >
                                  Professional · KSh 1,999
                                </button>
                              </div>
                            </div>
                          )}

                        {effectiveStatus === "active" &&
                          !isPaidActive &&
                          subscription?.plan_name === "Free Trial" && (
                            <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-900">
                              Your free trial is active. You can request a
                              paid plan before it expires.
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                <button
                                  type="button"
                                  disabled={busyTurf === turf.id}
                                  onClick={() =>
                                    void requestSubscription(
                                      turf.id,
                                      "Standard"
                                    )
                                  }
                                  className="min-h-11 rounded-lg border border-green-700 px-3 font-bold text-green-900 hover:bg-green-100 disabled:opacity-60"
                                >
                                  Standard · KSh 999
                                </button>
                                <button
                                  type="button"
                                  disabled={busyTurf === turf.id}
                                  onClick={() =>
                                    void requestSubscription(
                                      turf.id,
                                      "Professional"
                                    )
                                  }
                                  className="min-h-11 rounded-lg bg-green-800 px-3 font-bold text-white hover:bg-green-900 disabled:opacity-60"
                                >
                                  Professional · KSh 1,999
                                </button>
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-950">
            Booking requests
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Booking status changes must be handled by an authorized
            server-side operation. This dashboard displays requests but does
            not bypass the database&apos;s booking-update protections.
          </p>

          {bookings.length === 0 ? (
            <p className="mt-4 rounded-xl border border-gray-200 p-6 text-gray-600">
              No booking requests are available yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {bookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-xl border border-gray-200 p-5"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <p className="font-bold text-gray-950">
                      {booking.booking_date} · {booking.start_time}–
                      {booking.end_time}
                    </p>
                    <p className="text-sm text-gray-600">
                      {booking.status} / {booking.payment_status}
                    </p>
                  </div>
                  {booking.customer_note && (
                    <p className="mt-2 text-sm text-gray-600">
                      {booking.customer_note}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-black text-gray-950">
            Submit a new turf
          </h2>
          <p className="mt-2 text-gray-600">
            Every new listing is submitted for administrator approval.
          </p>

          <form
            onSubmit={createTurf}
            className="mt-5 grid gap-5 rounded-xl border border-gray-200 p-6 sm:grid-cols-2"
          >
            <div>
              <label htmlFor="name" className="font-semibold text-gray-900">
                Turf name *
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={150}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="price" className="font-semibold text-gray-900">
                Price per hour (KSh) *
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="county" className="font-semibold text-gray-900">
                County *
              </label>
              <input
                id="county"
                value={county}
                onChange={(event) => setCounty(event.target.value)}
                required
                maxLength={100}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="town" className="font-semibold text-gray-900">
                Town or estate *
              </label>
              <input
                id="town"
                value={town}
                onChange={(event) => setTown(event.target.value)}
                required
                maxLength={100}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="address"
                className="font-semibold text-gray-900"
              >
                Physical address
              </label>
              <input
                id="address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                maxLength={250}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="description"
                className="font-semibold text-gray-900"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                maxLength={3000}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="capacity"
                className="font-semibold text-gray-900"
              >
                Player capacity
              </label>
              <input
                id="capacity"
                type="number"
                min="1"
                step="1"
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="facilities"
                className="font-semibold text-gray-900"
              >
                Facilities
              </label>
              <input
                id="facilities"
                value={facilities}
                onChange={(event) => setFacilities(event.target.value)}
                className={inputClass}
                placeholder="Parking, changing rooms, lights"
              />
            </div>

            <div>
              <label
                htmlFor="openingTime"
                className="font-semibold text-gray-900"
              >
                Opening time
              </label>
              <input
                id="openingTime"
                type="time"
                value={openingTime}
                onChange={(event) => setOpeningTime(event.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="closingTime"
                className="font-semibold text-gray-900"
              >
                Closing time
              </label>
              <input
                id="closingTime"
                type="time"
                value={closingTime}
                onChange={(event) => setClosingTime(event.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-green-800 px-6 font-bold text-white hover:bg-green-900 disabled:opacity-60"
              >
                {saving ? "Submitting..." : "Submit turf for approval"}
              </button>
            </div>
          </form>
        </section>
      </section>
    </SiteShell>
  );
}
