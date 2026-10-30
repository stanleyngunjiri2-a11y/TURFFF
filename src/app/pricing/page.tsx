import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Turf Owner Plans | TURFF",
  description:
    "Compare TURFF Standard and Professional turf subscriptions. Every approved turf receives a five-day free trial.",
};

const plans = [
  {
    name: "Standard",
    price: "999",
    description:
      "For turf owners who want an affordable online presence and the essential tools to manage their facility.",
    features: [
      "Individual turf listing",
      "Public turf discovery",
      "Standard placement in search results",
      "Booking request access while subscribed",
      "Owner subscription dashboard",
      "Booking management",
      "Manual M-Pesa payment verification",
      "Standard customer support",
    ],
  },
  {
    name: "Professional",
    price: "1,999",
    description:
      "For ambitious turf owners who want greater visibility, stronger promotion and better insights into their facility.",
    features: [
      "Everything included in Standard",
      "Priority placement in search results",
      "Professional featured badge",
      "Enhanced turf profile and additional photos",
      "Promotional offers and discounts",
      "Booking and performance analytics",
      "Priority customer support",
    ],
  },
];

export default function PricingPage() {
  return (
    <SiteShell>
      <section className="bg-green-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:py-20">
          <p className="font-bold uppercase tracking-widest text-green-300">
            For turf owners
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Simple subscriptions for every pitch.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-green-100">
            List your football facility, reach players searching for nearby
            turfs and manage booking requests through TURFF.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="mb-8 rounded-xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-black text-green-950">
            Every approved turf gets a five-day free trial
          </h2>
          <p className="mt-2 leading-7 text-green-900">
            Create your owner account for free and submit your turf for
            review. When the administrator approves an individual turf
            listing, its five-day free trial starts automatically. Each
            additional turf has its own separate trial and subscription.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan, index) => (
            <article
              key={plan.name}
              className={`rounded-xl border p-7 ${
                index === 1
                  ? "border-green-700 shadow-lg ring-1 ring-green-700"
                  : "border-gray-200"
              }`}
            >
              {index === 1 && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-900">
                  Best for growth
                </span>
              )}

              <h2 className="mt-4 text-2xl font-black text-gray-950">
                {plan.name}
              </h2>

              <div className="mt-5 flex items-end gap-2">
                <span className="text-4xl font-black text-green-800">
                  KSh {plan.price}
                </span>
                <span className="pb-1 text-gray-500">/ turf / month</span>
              </div>

              <p className="mt-4 min-h-14 leading-7 text-gray-600">
                {plan.description}
              </p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex gap-3 text-sm leading-6 text-gray-700"
                  >
                    <span className="font-black text-green-700">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-green-800 px-5 font-bold text-white hover:bg-green-900"
              >
                Create owner account
              </Link>
            </article>
          ))}
        </div>

        <section className="mt-12 rounded-xl border border-gray-200 p-7">
          <h2 className="text-xl font-black text-gray-950">
            How subscription payments work
          </h2>

          <ol className="mt-5 list-inside list-decimal space-y-3 leading-7 text-gray-700">
            <li>Create your owner account and submit your turf listing.</li>
            <li>Wait for the administrator to approve your turf.</li>
            <li>Your individual turf receives a five-day free trial.</li>
            <li>Choose Standard or Professional from your owner dashboard.</li>
            <li>
              Send the subscription payment to the TURFF M-Pesa payment
              number below.
            </li>
            <li>Submit your M-Pesa transaction code in your dashboard.</li>
            <li>
              The administrator verifies the payment and activates your
              subscription for one month.
            </li>
          </ol>

          <div className="mt-6 rounded-lg bg-green-50 p-5">
            <p className="text-sm font-semibold text-green-900">
              TURFF subscription payment number
            </p>
            <p className="mt-2 text-2xl font-black tracking-wide text-green-950">
              0768176570
            </p>
            <p className="mt-2 text-sm leading-6 text-green-900">
              Always submit your transaction code through your owner
              dashboard. Your subscription is not activated until payment
              verification is complete.
            </p>
          </div>

          <p className="mt-6 text-sm leading-6 text-gray-600">
            Subscription prices apply separately to each turf. For example,
            an owner with three turfs needs a separate subscription for each
            turf. Footballers do not pay an owner subscription to search for
            turfs.
          </p>

          <Link
            href="/register"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-lg bg-green-800 px-6 font-bold text-white hover:bg-green-900"
          >
            Get started
          </Link>
        </section>
      </section>
    </SiteShell>
  );
}
