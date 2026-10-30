"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 12) {
      setError("Your new password must contain at least 12 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Require an authenticated recovery session before changing the password.
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(
          "Your recovery session is missing or has expired. Please request a new password-reset link."
        );
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(
          "We couldn't update your password. Please try again or request a new recovery link."
        );
        return;
      }

      // End the current session after changing the password.
      await supabase.auth.signOut();

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please request a new recovery link if needed.");
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
          Set a new password
        </h1>

        <p className="mt-3 leading-7 text-gray-600">
          Choose a strong, unique password for your TURFF account.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-lg border border-gray-200 bg-white p-6 sm:p-8"
        >
          {error && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800"
            >
              {error}
            </p>
          )}

          {success ? (
            <div
              role="status"
              className="rounded-md border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-900"
            >
              Your password has been updated. You can now sign in using your
              new password.
              <Link
                href="/login"
                className="mt-3 inline-block font-semibold underline underline-offset-4"
              >
                Return to login
              </Link>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  New password
                </label>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={12}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-950 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                  placeholder="At least 12 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Confirm new password
                </label>

                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-950 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                  placeholder="Enter your new password again"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="text-sm font-semibold text-green-800 underline underline-offset-4"
              >
                {showPassword ? "Hide passwords" : "Show passwords"}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-green-800 px-5 py-3 font-semibold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Updating password..." : "Update password"}
              </button>
            </>
          )}
        </form>
      </section>
    </SiteShell>
  );
}
