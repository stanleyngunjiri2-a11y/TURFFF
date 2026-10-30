"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitted(false);
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });

      if (resetError) {
        setError(
          "We couldn't send the recovery request. Please check your connection and try again."
        );
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Unable to contact the authentication service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-lg px-5 py-16 sm:py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-green-800">
          Account recovery
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
          Forgot your password?
        </h1>

        <p className="mt-3 leading-7 text-gray-600">
          Enter the email address associated with your TURFF account. If the
          account is eligible for recovery, we&apos;ll send you a password-reset link.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-lg border border-gray-200 bg-white p-6 sm:p-8"
        >
          {submitted && (
            <p
              role="status"
              className="rounded-md border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-900"
            >
              If an account can be recovered using this email address, a
              password-reset link will be sent. Please check your inbox and
              spam folder.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800"
            >
              {error}
            </p>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-950 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-green-800 px-5 py-3 font-semibold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending request..." : "Send reset link"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-semibold text-green-800 underline underline-offset-4"
            >
              Back to login
            </Link>
          </p>
        </form>
      </section>
    </SiteShell>
  );
}
