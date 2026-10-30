"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/client";

type Turf = {
  id: string;
  owner_id: string;
  name: string;
  county: string;
  town: string;
  price_per_hour: number;
  review_status: "pending" | "approved" | "rejected";
  is_active: boolean;
  created_at: string;
  owner_name?: string;
};

export default function AdminTurfsPage() {
  const router = useRouter();

  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTurfs = useCallback(async () => {
    setError("");

    const supabase = createClient();

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.replace("/login?next=/admin/turfs");
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

    const { data, error: listError } = await supabase
      .from("turfs")
      .select(
        "id, owner_id, name, county, town, price_per_hour, review_status, is_active, created_at"
      )
      .order("created_at", { ascending: false });

    if (listError) {
      setError(listError.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as Turf[];
    const ownerIds = [...new Set(rows.map((turf) => turf.owner_id))];

    if (ownerIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ownerIds);

      if (profilesError) {
        setError(profilesError.message);
      }

      const ownerNames = new Map(
        (profiles ?? []).map((profile) => [profile.id, profile.full_name])
      );

      for (const turf of rows) {
        turf.owner_name = ownerNames.get(turf.owner_id) ?? "TURFF owner";
      }
    }

    setTurfs(rows);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTurfs();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadTurfs]);

  async function reviewTurf(
    turf: Turf,
    decision: "approved" | "rejected"
  ) {
    setError("");
    setNotice("");

    const confirmed = window.confirm(
      decision === "approved"
        ? `Approve "${turf.name}"? This will activate the listing and automatically start its five-day free trial.`
        : `Reject "${turf.name}"?`
    );

    if (!confirmed) return;

    setBusyId(turf.id);

    try {
      const supabase = createClient();

      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profile?.role !== "superadmin") {
        setError("Superadmin access is required.");
        return;
      }

      const { error: reviewError } = await supabase.rpc(
        "review_turf_listing",
        {
          p_turf_id: turf.id,
          p_decision: decision,
        }
      );

      if (reviewError) {
        setError(reviewError.message);
        return;
      }

      setNotice(
        decision === "approved"
          ? `${turf.name} has been approved. Its five-day free trial has started.`
          : `${turf.name} has been rejected.`
      );

      await loadTurfs();
    } catch {
      setError("The turf listing could not be reviewed. Please try again.");
    } finally {
      setBusyId("");
    }
  }

  const pendingTurfs = turfs.filter(
    (turf) => turf.review_status === "pending"
  );

  const reviewedTurfs = turfs.filter(
    (turf) => turf.review_status !== "pending"
  );

  if (loading) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-7xl px-5 py-16 text-gray-600">
          Loading turf listings...
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="bg-green-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <p className="text-sm font-bold uppercase tracking-wider text-green-300">
            Administration
          </p>
          <h1 className="mt-3 text-4xl font-black">Turf listings</h1>
          <p className="mt-3 max-w-2xl text-green-100">
            Review submitted turf listings. Approved turfs automatically
            receive a five-day free trial.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-7 flex flex-wrap gap-3">
          <a
            href="/admin/dashboard"
            className="inline-flex min-h-11 items-center rounded-lg border border-gray-300 px-4 font-semibold text-gray-800 hover:bg-gray-50"
          >
            Admin dashboard
          </a>

          <button
            onClick={() => void loadTurfs()}
            className="min-h-11 rounded-lg bg-green-800 px-4 font-bold text-white hover:bg-green-900"
          >
            Refresh listings
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-950"
          >
            {notice}
          </div>
        )}

        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-semibold text-gray-500">
              All turf listings
            </p>
            <p className="mt-2 text-3xl font-black text-gray-950">
              {turfs.length}
            </p>
          </div>

          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
            <p className="text-sm font-semibold text-yellow-800">
              Awaiting review
            </p>
            <p className="mt-2 text-3xl font-black text-yellow-950">
              {pendingTurfs.length}
            </p>
          </div>

          <div className="rounded-xl border border-green-200 bg-green-50 p-5">
            <p className="text-sm font-semibold text-green-800">
              Reviewed listings
            </p>
            <p className="mt-2 text-3xl font-black text-green-950">
              {reviewedTurfs.length}
            </p>
          </div>
        </div>

        <div className="mb-12">
          <div className="mb-5">
            <h2 className="text-2xl font-black text-gray-950">
              Pending approvals
            </h2>
            <p className="mt-1 text-gray-600">
              These listings need an administrator&apos;s decision.
            </p>
          </div>

          {pendingTurfs.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <h3 className="text-lg font-bold text-gray-950">
                No pending turf listings
              </h3>
              <p className="mt-2 text-gray-600">
                New listings submitted by approved turf owners will appear
                here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {pendingTurfs.map((turf) => (
                <article
                  key={turf.id}
                  className="rounded-xl border border-yellow-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black text-gray-950">
                        {turf.name}
                      </h3>

                      <p className="mt-2 text-sm text-gray-600">
                        Owner: {turf.owner_name}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Location: {turf.town}, {turf.county}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Submitted:{" "}
                        {new Date(turf.created_at).toLocaleString("en-KE")}
                      </p>
                    </div>

                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold capitalize text-yellow-900">
                      {turf.review_status}
                    </span>
                  </div>

                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <p className="text-lg font-bold text-gray-950">
                      KSh {Number(turf.price_per_hour).toLocaleString("en-KE")}{" "}
                      <span className="text-sm font-medium text-gray-500">
                        per hour
                      </span>
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      Approving this listing will activate it and start its
                      one-time five-day free trial.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busyId === turf.id}
                      onClick={() => void reviewTurf(turf, "approved")}
                      className="min-h-11 rounded-lg bg-green-800 px-5 font-bold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busyId === turf.id ? "Processing..." : "Approve turf"}
                    </button>

                    <button
                      type="button"
                      disabled={busyId === turf.id}
                      onClick={() => void reviewTurf(turf, "rejected")}
                      className="min-h-11 rounded-lg border border-red-300 px-5 font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reject listing
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-5 text-2xl font-black text-gray-950">
            Previously reviewed listings
          </h2>

          {reviewedTurfs.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-gray-600">
              No reviewed listings yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-5 py-4 font-bold">Turf</th>
                    <th className="px-5 py-4 font-bold">Owner</th>
                    <th className="px-5 py-4 font-bold">Location</th>
                    <th className="px-5 py-4 font-bold">Price/hour</th>
                    <th className="px-5 py-4 font-bold">Review status</th>
                    <th className="px-5 py-4 font-bold">Listing status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {reviewedTurfs.map((turf) => (
                    <tr key={turf.id}>
                      <td className="px-5 py-4 font-bold text-gray-950">
                        {turf.name}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {turf.owner_name ?? "TURFF owner"}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {turf.town}, {turf.county}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        KSh{" "}
                        {Number(turf.price_per_hour).toLocaleString("en-KE")}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                            turf.review_status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {turf.review_status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`font-semibold ${
                            turf.is_active
                              ? "text-green-700"
                              : "text-gray-500"
                          }`}
                        >
                          {turf.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
