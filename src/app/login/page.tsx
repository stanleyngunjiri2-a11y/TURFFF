"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/client";
import { getLoginDestination } from "@/lib/auth/get-login-destination";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        setError(
          "We couldn't sign you in. Check your email and password, and confirm your email address if required."
        );
        return;
      }

      const { data: authData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !authData.user) {
        setError("Your login succeeded, but we could not verify your account. Please try again.");
        return;
      }

      const requestedNext = new URLSearchParams(window.location.search).get("next");

      const destination = await getLoginDestination(
        supabase,
        authData.user.id,
        requestedNext
      );

      router.replace(destination);
      router.refresh();
    } catch {
      setError(
        "Unable to connect to the authentication service. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);

    try {
      const supabase = createClient();

      const { error: oauthError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=${
              new URLSearchParams(window.location.search).get("next") === "/owner/apply"
                ? "/owner/apply"
                : "/turfs"
            }`,
          },
        });

      if (oauthError) {
        setError(
          "Google sign-in could not be started. Please try again or use email and password."
        );
        setGoogleLoading(false);
      }
    } catch {
      setError(
        "Unable to connect to the authentication service. Please try again."
      );
      setGoogleLoading(false);
    }
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-lg px-5 py-16 sm:py-20">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-green-800">
            Welcome back to TURFF
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
            Log in to your account
          </h1>

          <p className="mt-3 leading-7 text-gray-600">
            Sign in to discover turfs, manage bookings, or access your turf
            owner account.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 sm:p-8">
          {error && (
            <p
              role="alert"
              className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.63 5.92c4.45-4.11 7.14-10.16 7.14-17.57Z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.91-5.79l-7.63-5.92c-2.12 1.42-4.84 2.26-8.28 2.26-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"
                transform="translate(0 4)"
              />
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
                transform="translate(0 4)"
              />
            </svg>

            {googleLoading ? "Connecting to Google..." : "Continue with Google"}
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Or use email
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
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

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-800"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-green-800 underline underline-offset-4 hover:text-green-900"
                >
                  Forgot password?
                </Link>
              </div>

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-950 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="mt-2 text-sm font-semibold text-green-800 underline underline-offset-4 hover:text-green-900"
              >
                {showPassword ? "Hide password" : "Show password"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full rounded-md bg-green-800 px-5 py-3 font-semibold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm leading-6 text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-green-800 underline underline-offset-4 hover:text-green-900"
            >
              Create an account
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-gray-500">
          Access to turf owner and administrator features depends on your
          assigned account permissions.
        </p>
      </section>
    </SiteShell>
  );
}
