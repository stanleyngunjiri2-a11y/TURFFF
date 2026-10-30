import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "About TURFF",
  description: "Learn about TURFF and its mission to simplify football pitch discovery and booking.",
};

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="bg-green-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:py-20">
          <p className="font-bold uppercase tracking-widest text-green-300">About TURFF</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            More time playing. Less time organising.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-green-100">
            TURFF is being built to make it easier for footballers to discover pitches and for turf owners to manage their facilities.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-2">
        <article>
          <h2 className="text-2xl font-bold">For footballers</h2>
          <p className="mt-4 leading-7 text-gray-600">
            The goal is to help players find pitches by area, review useful venue information and request a booking without unnecessary back-and-forth.
          </p>
        </article>
        <article>
          <h2 className="text-2xl font-bold">For turf owners</h2>
          <p className="mt-4 leading-7 text-gray-600">
            The goal is to give owners a central place to present their pitches, respond to booking requests and keep track of bookings.
          </p>
        </article>
        <article className="md:col-span-2 rounded-lg border border-green-100 bg-green-50 p-7">
          <h2 className="text-xl font-bold text-green-950">Built around trust</h2>
          <p className="mt-3 leading-7 text-gray-700">
            Turf listings should be reviewed before publication. Booking and payment statuses should be clear, and payment instructions should identify the turf owner receiving the money.
          </p>
        </article>
      </section>
      <div className="mx-auto max-w-7xl px-5 pb-12">
        <Link href="/turfs" className="inline-flex rounded-md bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900">Explore TURFF</Link>
      </div>
    </SiteShell>
  );
}
