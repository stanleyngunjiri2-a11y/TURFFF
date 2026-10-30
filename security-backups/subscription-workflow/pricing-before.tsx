import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Turf Owner Plans | TURFF",
  description: "Information for football turf owners interested in listing their facilities on TURFF.",
};

export default function PricingPage() {
  return (
    <SiteShell>
      <section className="bg-green-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:py-20">
          <p className="font-bold uppercase tracking-widest text-green-300">For turf owners</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Bring your pitch online.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-green-100">
            Prepare your turf listing, manage enquiries and make it easier for footballers to find your facility.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { name: "Basic", detail: "For owners starting their online presence." },
            { name: "Pro", detail: "For owners who need more day-to-day management tools." },
            { name: "Premium", detail: "For owners who need the full set of planned platform features." },
          ].map((plan) => (
            <article key={plan.name} className="rounded-lg border border-gray-200 p-7">
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <p className="mt-4 min-h-14 leading-7 text-gray-600">{plan.detail}</p>
              <p className="mt-5 text-sm font-semibold text-green-800">Subscription price to be confirmed</p>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                Features, billing terms and availability will be published before paid subscriptions launch.
              </p>
            </article>
          ))}
        </div>
        <div className="mt-10 rounded-lg bg-green-50 p-7">
          <h2 className="text-xl font-bold text-green-950">How onboarding is planned to work</h2>
          <ol className="mt-4 list-inside list-decimal space-y-3 leading-7 text-gray-700">
            <li>Create an owner account.</li>
            <li>Submit your pitch information for administrator review.</li>
            <li>After approval, activate an available subscription.</li>
            <li>Manage booking requests once your account is eligible.</li>
          </ol>
          <Link href="/register" className="mt-6 inline-flex rounded-md bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900">Get started</Link>
        </div>
      </section>
    </SiteShell>
  );
}
