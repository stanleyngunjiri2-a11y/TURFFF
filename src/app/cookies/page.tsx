import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Cookie Policy | TURFF",
  description: "Information about cookies and similar technologies used by TURFF.",
};

export default function CookiesPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-4xl px-5 py-14">
        <p className="text-sm font-bold uppercase tracking-widest text-green-800">Legal</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Cookie Policy</h1>
        <p className="mt-4 text-gray-600">Draft for review against the actual production configuration.</p>
        <h2 className="mt-10 text-2xl font-bold">1. What cookies do</h2>
        <p className="mt-3 leading-7 text-gray-700">Cookies and similar technologies may store session information, remember preferences or help a website operate securely.</p>
        <h2 className="mt-8 text-2xl font-bold">2. Essential cookies</h2>
        <p className="mt-3 leading-7 text-gray-700">If authentication is enabled, strictly necessary session or security cookies may be required. Their exact names, purposes and lifetimes should be documented after implementation.</p>
        <h2 className="mt-8 text-2xl font-bold">3. Analytics and advertising</h2>
        <p className="mt-3 leading-7 text-gray-700">Analytics and advertising technologies should remain disabled until their purpose, providers and consent requirements have been assessed. This page does not claim that a consent banner is or is not legally required for every future configuration.</p>
        <h2 className="mt-8 text-2xl font-bold">4. Managing cookies</h2>
        <p className="mt-3 leading-7 text-gray-700">Users can manage cookies through their browser settings. Blocking essential cookies may prevent some account features from working.</p>
        <h2 className="mt-8 text-2xl font-bold">5. Policy updates</h2>
        <p className="mt-3 leading-7 text-gray-700">Update this policy when the production service begins using cookies or similar technologies. Confirm the actual implementation before launch.</p>
      </article>
    </SiteShell>
  );
}
