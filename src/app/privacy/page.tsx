import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Privacy Policy | TURFF",
  description: "TURFF privacy information and planned data-handling practices.",
};

export default function PrivacyPage() {
  return (
    <SiteShell>
      <article className="prose prose-gray mx-auto max-w-4xl px-5 py-14">
        <p className="text-sm font-bold uppercase tracking-widest text-green-800">Legal</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-gray-600">Draft for review. This policy must be checked against the actual service before launch.</p>
        <h2 className="mt-10 text-2xl font-bold">1. Information we may collect</h2>
        <p className="mt-3 leading-7">If account and booking features are enabled, TURFF may process account details, contact information, booking requests, turf listing information and essential security records. Only information needed to provide the service should be collected.</p>
        <h2 className="mt-8 text-2xl font-bold">2. How information may be used</h2>
        <p className="mt-3 leading-7">Information may be used to manage accounts, publish approved turf listings, coordinate bookings, support users, prevent misuse and meet legal obligations.</p>
        <h2 className="mt-8 text-2xl font-bold">3. Payments</h2>
        <p className="mt-3 leading-7">Under the planned manual payment process, customers pay turf owners directly. Users should not submit passwords, PINs or other payment credentials. Any payment evidence collected must be limited to what is necessary.</p>
        <h2 className="mt-8 text-2xl font-bold">4. Sharing and service providers</h2>
        <p className="mt-3 leading-7">Data may be shared with relevant turf owners for booking fulfilment and with service providers needed to operate the platform, subject to appropriate safeguards and applicable law.</p>
        <h2 className="mt-8 text-2xl font-bold">5. Security and retention</h2>
        <p className="mt-3 leading-7">Appropriate access controls and retention periods must be established. No online service can promise absolute security.</p>
        <h2 className="mt-8 text-2xl font-bold">6. Your rights</h2>
        <p className="mt-3 leading-7">Rights and procedures for accessing, correcting, objecting to or requesting deletion of personal data must be handled in accordance with applicable Kenyan data-protection law.</p>
        <h2 className="mt-8 text-2xl font-bold">7. Contact and updates</h2>
        <p className="mt-3 leading-7">An official privacy contact and effective date must be supplied before launch. This draft is not a substitute for a legal review or a data-protection compliance assessment.</p>
      </article>
    </SiteShell>
  );
}
