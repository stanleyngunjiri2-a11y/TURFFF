"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/turfs`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        router.push("/turfs");
        router.refresh();
        return;
      }

      setMessage(
        "Your account registration was submitted. Check your email for a confirmation link before logging in."
      );
    } catch {
      setError(
        "We could not complete registration. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-lg px-5 py-16 sm:py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-green-800">
          Join TURFF
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
          Create your account
        </h1>

        <p className="mt-3 leading-7 text-gray-600">
          Find football turfs, request bookings, and manage your football
          activities with TURFF.
        </p>

        <form
          onSubmit={handleRegister}
          className="mt-8 space-y-5 rounded-lg border border-gray-200 bg-white p-6 sm:p-8"
        >
          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900"
            >
              {message}
            </div>
          )}

          <div>
            <label
              htmlFor="fullName"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              maxLength={100}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-950 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
              placeholder="Enter your full name"
            />
          </div>

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
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-950 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-950 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
              placeholder="At least 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-green-800 px-5 py-3 font-semibold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="text-sm leading-6 text-gray-600">
            By registering, you agree to our{" "}
            <Link
              href="/terms"
              className="font-semibold text-green-800 underline underline-offset-4"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-semibold text-green-800 underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-green-800 underline underline-offset-4"
            >
              Log in
            </Link>
          </p>
        </form>
      </section>
    </SiteShell>
  );
}
