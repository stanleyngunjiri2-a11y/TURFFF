"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type OwnerApplication = {
  id: string;
  user_id: string;
  business_name: string;
  phone: string;
  county: string;
  town: string;
  address: string;
  experience: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  applicant_name?: string;
};

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [applications, setApplications] = useState<OwnerApplication[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const loadApplications = useCallback(async () => {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.replace("/login?next=/admin/applications");
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
      .from("owner_applications")
      .select(
        "id, user_id, business_name, phone, county, town, address, experience, message, status, rejection_reason, created_at"
      )
      .order("created_at", { ascending: false });

    if (listError) {
      setError(listError.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as OwnerApplication[];
    const userIds = [...new Set(rows.map((item) => item.user_id))];

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const names = new Map(
        (profiles ?? []).map((profile) => [profile.id, profile.full_name])
      );

      for (const row of rows) {
        row.applicant_name = names.get(row.user_id) ?? "TURFF user";
      }
    }

    setApplications(rows);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadApplications();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadApplications]);

  async function reviewApplication(
    applicationId: string,
    decision: "approved" | "rejected"
  ) {
    setError("");
    setNotice("");

    const reason = (reasons[applicationId] ?? "").trim();

    if (decision === "rejected" && !reason) {
      setError("Enter a reason before rejecting an application.");
      return;
    }

    if (
      !window.confirm(
        decision === "approved"
          ? "Approve this application and promote the applicant to turf owner?"
          : "Reject this owner application?"
      )
    ) {
      return;
    }

    setBusyId(applicationId);

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
        "review_owner_application",
        {
          p_application_id: applicationId,
          p_decision: decision,
          p_rejection_reason: decision === "rejected" ? reason : null,
        }
      );

      if (reviewError) {
        setError(reviewError.message);
        return;
      }

      setNotice(
        decision === "approved"
          ? "Application approved. The applicant now has the turf-owner role."
          : "Application rejected."
      );

      await loadApplications();
    } catch {
      setError("The application could not be reviewed. Please try again.");
    } finally {
      setBusyId("");
    }
  }

  if (loading) {
    return (
      
        <div className="mx-auto max-w-7xl px-5 py-16 text-gray-600">
          Loading applications...
        </div>
      
    );
  }

  return (
    <>
    
      <section className="bg-green-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <p className="text-sm font-bold uppercase tracking-wider text-green-300">
            Administration
          </p>
          <h1 className="mt-3 text-4xl font-black">Owner applications</h1>
          <p className="mt-3 text-green-100">
            Review applications and approve or reject them.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-6 flex flex-wrap gap-3">
          <a href="/admin/dashboard" className="inline-flex min-h-11 items-center rounded-lg border border-gray-300 px-4 font-semibold text-gray-800 hover:bg-gray-50">
            Admin dashboard
          </a>
          <button onClick={() => void loadApplications()} className="min-h-11 rounded-lg bg-green-800 px-4 font-bold text-white hover:bg-green-900">
            Refresh applications
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
            {error}
          </div>
        )}

        {notice && (
          <div role="status" className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-950">
            {notice}
          </div>
        )}

        {applications.length === 0 ? (
          <div className="rounded-xl border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-950">
              No owner applications found
            </h2>
            <p className="mt-2 text-gray-600">
              Applications will appear here after users submit them.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {applications.map((application) => (
              <article key={application.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-gray-950">
                      {application.business_name}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      Applicant: {application.applicant_name}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Submitted: {new Date(application.created_at).toLocaleString("en-KE")}
                    </p>
                  </div>
                  <span className="rounded-md bg-gray-100 px-3 py-2 text-sm font-bold capitalize text-gray-800">
                    {application.status}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="font-bold text-gray-900">Contact phone</p>
                    <p className="mt-1 text-gray-700">{application.phone}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Location</p>
                    <p className="mt-1 text-gray-700">
                      {[application.address, application.town, application.county].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>

                {application.experience && (
                  <div className="mt-5">
                    <h3 className="font-bold text-gray-900">Experience</h3>
                    <p className="mt-2 whitespace-pre-wrap leading-6 text-gray-700">
                      {application.experience}
                    </p>
                  </div>
                )}

                {application.message && (
                  <div className="mt-5">
                    <h3 className="font-bold text-gray-900">Additional information</h3>
                    <p className="mt-2 whitespace-pre-wrap leading-6 text-gray-700">
                      {application.message}
                    </p>
                  </div>
                )}

                {application.status === "pending" && (
                  <div className="mt-6 border-t border-gray-200 pt-5">
                    <label htmlFor={`reason-${application.id}`} className="font-semibold text-gray-900">
                      Rejection reason, if rejecting
                    </label>
                    <textarea
                      id={`reason-${application.id}`}
                      rows={2}
                      maxLength={1000}
                      value={reasons[application.id] ?? ""}
                      onChange={(event) =>
                        setReasons((previous) => ({
                          ...previous,
                          [application.id]: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-gray-950 outline-none focus:border-green-700"
                    />

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        disabled={busyId === application.id}
                        onClick={() => void reviewApplication(application.id, "approved")}
                        className="min-h-11 rounded-lg bg-green-800 px-5 font-bold text-white hover:bg-green-900 disabled:opacity-60"
                      >
                        {busyId === application.id ? "Processing..." : "Approve application"}
                      </button>
                      <button
                        disabled={busyId === application.id}
                        onClick={() => void reviewApplication(application.id, "rejected")}
                        className="min-h-11 rounded-lg border border-red-300 px-5 font-bold text-red-800 hover:bg-red-50 disabled:opacity-60"
                      >
                        Reject application
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    
    </>
  );
}
