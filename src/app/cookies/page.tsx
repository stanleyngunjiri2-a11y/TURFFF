import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Cookie Policy | TURFF",
  description:
    "Learn how TURFF uses essential technologies and optional Google Analytics.",
};

export default function CookiesPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-4xl px-5 py-14">
        <p className="text-sm font-bold uppercase tracking-widest text-green-800">
          Legal
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight">
          Cookie Policy
        </h1>

        <p className="mt-4 leading-7 text-gray-600">
          This policy explains how TURFF uses cookies and similar technologies
          when visitors use our website.
        </p>

        <h2 className="mt-10 text-2xl font-bold">1. Essential technologies</h2>
        <p className="mt-3 leading-7 text-gray-700">
          Essential technologies support website functionality, account
          authentication, security and other services requested by visitors.
          These technologies may be necessary for TURFF to operate correctly.
        </p>

        <h2 className="mt-8 text-2xl font-bold">2. Optional analytics</h2>
        <p className="mt-3 leading-7 text-gray-700">
          With visitor permission, TURFF uses Google Analytics 4, a service
          provided by Google, to understand website usage and improve the
          platform. Analytics may collect information such as pages visited,
          browser and device information, interaction events and approximate
          location derived from network information.
        </p>
        <p className="mt-3 leading-7 text-gray-700">
          Google Analytics is not initialized unless a visitor accepts
          optional analytics. Advertising-related storage and advertising
          personalization are not enabled by this implementation.
        </p>

        <h2 className="mt-8 text-2xl font-bold">3. Consent preferences</h2>
        <p className="mt-3 leading-7 text-gray-700">
          Visitors can accept or reject optional analytics using the cookie
          preference notice. Their choice is stored in their browser so that
          the preference can be remembered. Visitors can reopen Cookie settings
          on the website to change their choice.
        </p>

        <h2 className="mt-8 text-2xl font-bold">4. Third-party services</h2>
        <p className="mt-3 leading-7 text-gray-700">
          When analytics is accepted, information may be processed by Google
          under its applicable terms and privacy practices. Google may process
          information in countries outside Kenya. Visitors can consult
          Google&apos;s privacy information for further details.
        </p>

        <h2 className="mt-8 text-2xl font-bold">5. Browser controls</h2>
        <p className="mt-3 leading-7 text-gray-700">
          Visitors can manage or delete cookies and local browser storage
          through their browser settings. Blocking essential technologies
          may affect account and website functionality.
        </p>

        <h2 className="mt-8 text-2xl font-bold">6. Policy updates</h2>
        <p className="mt-3 leading-7 text-gray-700">
          This policy should be reviewed whenever TURFF changes its analytics,
          cookies or third-party services. The actual production configuration
          and applicable data-protection requirements should be checked
          before launch.
        </p>
      </article>
    </SiteShell>
  );
}
