"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/client";

type Application = {
  id: string;
  business_name: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
};

const inputClass =
  "mt-2 min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-gray-950 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100";

export default function OwnerApplyPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [application, setApplication] = useState<Application | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [address, setAddress] = useState("");
  const [experience, setExperience] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.replace("/login?next=/owner/apply");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        if (active) {
          setError("We could not verify your account. Please try again.");
          setLoading(false);
        }
        return;
      }

      if (profile?.role === "superadmin") {
        router.replace("/admin/dashboard");
        return;
      }

      if (profile?.role === "turf_owner") {
        router.replace("/owner/dashboard");
        return;
      }

      const { data, error: applicationError } = await supabase
        .from("owner_applications")
        .select(
          "id, business_name, status, rejection_reason, created_at"
        )
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!active) return;

      if (applicationError) {
        setError(
          "We could not load your application. Confirm that the owner-onboarding database migration has been applied."
        );
      } else if (data) {
        setApplication(data as Application);
      }

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      !businessName.trim() ||
      !phone.trim() ||
      !county.trim() ||
      !town.trim()
    ) {
      setError("Complete all required fields before submitting.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        router.replace("/login?next=/owner/apply");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError || profile?.role !== "footballer") {
        setError(
          "Only a footballer account without an existing owner role can submit this application."
        );
        return;
      }

      const { error: insertError } = await supabase
        .from("owner_applications")
        .insert({
          user_id: authData.user.id,
          business_name: businessName.trim(),
          phone: phone.trim(),
          county: county.trim(),
          town: town.trim(),
          address: address.trim(),
          experience: experience.trim(),
          message: message.trim(),
          status: "pending",
        });

      if (insertError) {
        if (insertError.code === "23505") {
          setError(
            "You already have a pending application. Please wait for the administrator to review it."
          );
        } else {
          setError(insertError.message);
        }
        return;
      }

      router.replace("/owner/apply?submitted=1");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-3xl px-5 py-20 text-gray-600">
          Loading your application...
        </div>
      </SiteShell>
    );
  }

  if (application?.status === "approved") {
    return (
      <SiteShell>
        <section className="mx-auto max-w-3xl px-5 py-16">
          <div className="rounded-xl border border-green-200 bg-green-50 p-8">
            <h1 className="text-3xl font-black text-green-950">
              Your application was approved
            </h1>
            <p className="mt-4 leading-7 text-green-900">
              You can now access the turf-owner dashboard. Activate your
              subscription before receiving booking requests.
            </p>
            <Link
              href="/owner/dashboard"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-green-800 px-6 font-bold text-white hover:bg-green-900"
            >
              Open owner dashboard
            </Link>
          </div>
        </section>
      </SiteShell>
    );
  }

  if (application?.status === "pending") {
    return (
      <SiteShell>
        <section className="mx-auto max-w-3xl px-5 py-16">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-8">
            <p className="text-sm font-bold uppercase tracking-wider text-amber-900">
              Application under review
            </p>
            <h1 className="mt-3 text-3xl font-black text-gray-950">
              {application.business_name}
            </h1>
            <p className="mt-4 leading-7 text-gray-700">
              Your application has been received. An administrator must review
              and approve it before you can manage turf listings.
            </p>
          </div>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <p className="text-sm font-bold uppercase tracking-wider text-green-800">
          TURFF for turf owners
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-950">
          Apply to list your football turf
        </h1>
        <p className="mt-4 leading-7 text-gray-600">
          Tell us about your facility. Our team will review your application.
          Approval is required before you can publish listings as a turf owner.
        </p>

        {application?.status === "rejected" && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5">
            <h2 className="font-bold text-red-950">
              Your previous application was rejected
            </h2>
            {application.rejection_reason && (
              <p className="mt-2 text-sm leading-6 text-red-900">
                {application.rejection_reason}
              </p>
            )}
            <p className="mt-2 text-sm text-red-900">
              You may submit a new application after addressing the feedback.
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={submitApplication}
          className="mt-8 space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div>
            <label htmlFor="businessName" className="font-semibold text-gray-900">
              Turf or business name *
            </label>
            <input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              maxLength={150}
              className={inputClass}
              autoComplete="organization"
            />
          </div>

          <div>
            <label htmlFor="phone" className="font-semibold text-gray-900">
              Contact phone *
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              maxLength={30}
              className={inputClass}
              autoComplete="tel"
              placeholder="e.g. 07XXXXXXXX"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="county" className="font-semibold text-gray-900">
                County *
              </label>
              <input
                id="county"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
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
                onChange={(e) => setTown(e.target.value)}
                required
                maxLength={100}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="font-semibold text-gray-900">
              Physical address
            </label>
            <input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={250}
              className={inputClass}
              placeholder="Estate, road, or nearby landmark"
            />
          </div>

          <div>
            <label htmlFor="experience" className="font-semibold text-gray-900">
              Experience managing turfs
            </label>
            <textarea
              id="experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              maxLength={2000}
              rows={3}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="message" className="font-semibold text-gray-900">
              Additional information
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={3000}
              rows={4}
              className={inputClass}
              placeholder="Tell us about your facility and the services you offer."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-green-800 px-6 font-bold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Submitting..." : "Submit owner application"}
          </button>

          <p className="text-sm leading-6 text-gray-500">
            Submitting an application does not automatically grant owner
            permissions. A superadmin must approve your application.
          </p>
        </form>
      </section>
    </SiteShell>
  );
}
