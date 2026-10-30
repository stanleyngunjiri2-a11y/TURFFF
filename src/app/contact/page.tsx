import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Contact TURFF",
  description: "Contact TURFF about football pitch listings, bookings and owner accounts.",
};

export default function ContactPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-4xl px-5 py-16 sm:py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-green-800">Contact</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">Let’s talk football.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">
          Have a question about TURFF, want to list a pitch, or need help with a booking? Use the appropriate support channel once it has been published by the platform team.
        </p>
        <div className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-6 sm:p-8">
          <h2 className="text-xl font-bold">Support contact details</h2>
          <p className="mt-3 leading-7 text-gray-600">
            Official support contact information has not yet been configured. We will publish verified contact details here before opening the service to customers.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
