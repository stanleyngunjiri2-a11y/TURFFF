import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Terms and Conditions | TURFF",
  description: "Draft terms for the planned TURFF football pitch platform.",
};

export default function TermsPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-4xl px-5 py-14">
        <p className="text-sm font-bold uppercase tracking-widest text-green-800">Legal</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Terms and Conditions</h1>
        <p className="mt-4 text-gray-600">Draft for review before public launch.</p>
        <h2 className="mt-10 text-2xl font-bold">1. About the platform</h2>
        <p className="mt-3 leading-7 text-gray-700">TURFF is being developed to help users discover football pitches and submit booking requests. Availability of individual features depends on the live service.</p>
        <h2 className="mt-8 text-2xl font-bold">2. Accounts</h2>
        <p className="mt-3 leading-7 text-gray-700">Users must provide accurate information, protect their login credentials and promptly report suspected account misuse. Owners must provide accurate facility and pricing details.</p>
        <h2 className="mt-8 text-2xl font-bold">3. Turf listings</h2>
        <p className="mt-3 leading-7 text-gray-700">Listings may require administrator approval. Publication does not guarantee availability, quality or suitability. Owners are responsible for keeping their information accurate.</p>
        <h2 className="mt-8 text-2xl font-bold">4. Bookings and payments</h2>
        <p className="mt-3 leading-7 text-gray-700">A booking request is not a confirmed reservation unless the platform and owner process explicitly show confirmation. Under the planned manual payment model, the customer pays the turf owner using verified instructions and should retain their payment record. Cancellation and refund rules must be disclosed before booking.</p>
        <h2 className="mt-8 text-2xl font-bold">5. Subscriptions</h2>
        <p className="mt-3 leading-7 text-gray-700">Any owner subscription price, billing interval, included features, renewal terms and cancellation process must be disclosed before payment. No subscription should be charged under these draft terms.</p>
        <h2 className="mt-8 text-2xl font-bold">6. Acceptable use</h2>
        <p className="mt-3 leading-7 text-gray-700">Users must not submit fraudulent listings, misuse personal information, interfere with platform security or misrepresent payment status.</p>
        <h2 className="mt-8 text-2xl font-bold">7. Disputes and changes</h2>
        <p className="mt-3 leading-7 text-gray-700">The final terms must identify the operating entity, effective date, applicable law, complaint procedure and dispute process. These provisions require review before launch.</p>
      </article>
    </SiteShell>
  );
}
