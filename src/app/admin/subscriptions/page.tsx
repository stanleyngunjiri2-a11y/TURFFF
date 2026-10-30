"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/client";

type Subscription = {
  id: string;
  turf_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  payment_reference: string | null;
  created_at: string;
  verified_at: string | null;
};

type TurfInfo = {
  id: string;
  name: string;
  county: string;
  town: string;
};

export default function AdminSubscriptionsPage() {
  const router = useRouter();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [turfs, setTurfs] = useState<Record<string, TurfInfo>>({});
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadSubscriptions = useCallback(async () => {
    const supabase = createClient();

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.replace("/login?next=/admin/subscriptions");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || profile?.role !== "superadmin") {
      router.replace("/turfs");
      return;
    }

    const { data, error: queryError } = await supabase
      .from("subscriptions")
      .select(
        "id, turf_id, plan_name, amount, currency, status, starts_at, ends_at, payment_reference, created_at, verified_at"
      )
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as Subscription[];
    setSubscriptions(rows);

    const turfIds = [...new Set(rows.map((row) => row.turf_id))];

    if (turfIds.length > 0) {
      const { data: turfRows, error: turfError } = await supabase
        .from("turfs")
        .select("id, name, county, town")
        .in("id", turfIds);

      if (turfError) {
        setError(turfError.message);
      } else {
        const mapped: Record<string, TurfInfo> = {};

        for (const turf of (turfRows ?? []) as TurfInfo[]) {
          mapped[turf.id] = turf;
        }

        setTurfs(mapped);
      }
    } else {
      setTurfs({});
    }

    setCurrentTime(Date.now());
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSubscriptions(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSubscriptions]);

  async function verifyPayment(subscriptionId: string, turfName: string) {
    if (
      !window.confirm(
        `Confirm that the M-Pesa payment for ${turfName} has been received and verified?`
      )
    ) {
      return;
    }

    setError("");
    setNotice("");
    setBusyId(subscriptionId);

    try {
      const supabase = createClient();

      const { error: verifyError } = await supabase.rpc(
        "verify_subscription_payment",
        {
          p_subscription_id: subscriptionId,
        }
      );

      if (verifyError) {
        setError(verifyError.message);
        return;
      }

      setNotice(
        `Payment verified. The paid subscription for ${turfName} is now active for one month.`
      );

      await loadSubscriptions();
    } catch {
      setError("Could not verify this subscription payment.");
    } finally {
      setBusyId("");
    }
  }

  const pendingPayments = subscriptions.filter(
    (subscription) =>
      subscription.status === "pending" &&
      subscription.payment_reference !== null
  );

  const awaitingCodes = subscriptions.filter(
    (subscription) =>
      subscription.status === "pending" &&
      subscription.payment_reference === null
  );

  const activeSubscriptions = subscriptions.filter(
    (subscription) =>
      subscription.status === "active" &&
      (subscription.ends_at === null ||
        (currentTime !== null &&
          new Date(subscription.ends_at).getTime() > currentTime))
  );

  return (
    <SiteShell>
      <section className="bg-green-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <p className="font-bold uppercase tracking-widest text-green-300">
            TURFF administration
          </p>
          <h1 className="mt-3 text-4xl font-black">
            Subscription payments
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-green-100">
            Review owner M-Pesa transaction codes and activate paid
            subscriptions after confirming receipt of payment.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/admin/dashboard"
            className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-50"
          >
            Back to dashboard
          </Link>

          <Link
            href="/admin/turfs"
            className="rounded-lg bg-green-800 px-5 py-3 font-bold text-white hover:bg-green-900"
          >
            Review turf listings
          </Link>

          <button
            type="button"
            onClick={() => void loadSubscriptions()}
            className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
            {error}
          </div>
        )}

        {notice && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
            {notice}
          </div>
        )}

        {!loading && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-600">Payments to verify</p>
              <p className="mt-2 text-3xl font-black text-gray-950">
                {pendingPayments.length}
              </p>
            </article>

            <article className="rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-600">Awaiting transaction codes</p>
              <p className="mt-2 text-3xl font-black text-gray-950">
                {awaitingCodes.length}
              </p>
            </article>

            <article className="rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-600">Currently active subscriptions</p>
              <p className="mt-2 text-3xl font-black text-gray-950">
                {activeSubscriptions.length}
              </p>
            </article>
          </div>
        )}

        {loading ? (
          <p className="py-10 text-gray-600">Loading subscription records...</p>
        ) : pendingPayments.length === 0 ? (
          <div className="rounded-xl border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-950">
              No payments awaiting verification
            </h2>
            <p className="mt-2 text-gray-600">
              Submitted M-Pesa transaction codes will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {pendingPayments.map((subscription) => {
              const turf = turfs[subscription.turf_id];
              const turfName = turf?.name ?? "Unknown turf";

              return (
                <article
                  key={subscription.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-gray-950">
                        {turfName}
                      </h2>
                      {turf && (
                        <p className="mt-1 text-sm text-gray-600">
                          {[turf.town, turf.county]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>

                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
                      Awaiting verification
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Selected plan
                      </p>
                      <p className="mt-2 text-lg font-black text-gray-950">
                        {subscription.plan_name}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Amount expected
                      </p>
                      <p className="mt-2 text-lg font-black text-green-800">
                        KSh{" "}
                        {Number(subscription.amount).toLocaleString("en-KE")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-green-800">
                      Submitted M-Pesa transaction code
                    </p>
                    <p className="mt-2 break-all text-2xl font-black tracking-wider text-green-950">
                      {subscription.payment_reference}
                    </p>
                  </div>

                  <p className="mt-4 text-sm text-gray-600">
                    Request submitted:{" "}
                    {new Date(subscription.created_at).toLocaleString("en-KE")}
                  </p>

                  <button
                    type="button"
                    disabled={busyId === subscription.id}
                    onClick={() =>
                      void verifyPayment(subscription.id, turfName)
                    }
                    className="mt-5 min-h-12 w-full rounded-lg bg-green-800 px-6 font-bold text-white hover:bg-green-900 disabled:opacity-60 sm:w-auto"
                  >
                    {busyId === subscription.id
                      ? "Verifying..."
                      : "Confirm payment and activate"}
                  </button>

                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    Only click after independently confirming the payment in
                    the M-Pesa transaction records. Activation lasts one
                    month and replaces the turf&apos;s previous active trial
                    or subscription.
                  </p>
                </article>
              );
            })}
          </div>
        )}

        <section className="mt-12">
          <h2 className="text-xl font-black text-gray-950">
            Subscription history
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            This includes active, expired and pending subscription records
            across all turfs.
          </p>

          {!loading && subscriptions.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="p-4">Turf</th>
                    <th className="p-4">Plan</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Transaction code</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((subscription) => (
                    <tr
                      key={subscription.id}
                      className="border-t border-gray-100"
                    >
                      <td className="p-4 font-semibold text-gray-950">
                        {turfs[subscription.turf_id]?.name ?? "Unknown turf"}
                      </td>
                      <td className="p-4">{subscription.plan_name}</td>
                      <td className="p-4">
                        KSh{" "}
                        {Number(subscription.amount).toLocaleString("en-KE")}
                      </td>
                      <td className="p-4">{subscription.status}</td>
                      <td className="p-4 break-all">
                        {subscription.payment_reference ?? "Not submitted"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </SiteShell>
  );
}
