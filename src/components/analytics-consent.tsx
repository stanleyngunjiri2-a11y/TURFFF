"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

const GA_MEASUREMENT_ID = "G-N0ZZ6X4MQP";
const CONSENT_KEY = "turff-analytics-consent";

type Consent = "accepted" | "rejected" | "unset";

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
    __turffGaInitialized?: boolean;
  }
}

function getConsent(): Consent {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "accepted" || value === "rejected"
      ? value
      : "unset";
  } catch {
    return "unset";
  }
}

function getServerConsent(): Consent {
  return "unset";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("turff-consent-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("turff-consent-change", callback);
  };
}

function isPublicPage(pathname: string) {
  const privatePrefixes = [
    "/admin",
    "/owner",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/my-bookings",
    "/auth",
  ];

  return !privatePrefixes.some(
    (prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function AnalyticsConsent() {
  const consent = useSyncExternalStore(
    subscribe,
    getConsent,
    getServerConsent
  );

  const pathname = usePathname();
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const disabledKey = `ga-disable-${GA_MEASUREMENT_ID}`;
    const analyticsWindow = window as unknown as Window & Record<string, unknown>;

    if (consent !== "accepted") {
      analyticsWindow[disabledKey] = true;

      if (window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
      }

      return;
    }

    analyticsWindow[disabledKey] = false;
    window.dataLayer = window.dataLayer || [];

    if (!window.gtag) {
      window.gtag = (...args: unknown[]) => {
        window.dataLayer?.push(args);
      };
    }

    window.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });

    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });

    if (!window.__turffGaInitialized) {
      window.gtag("js", new Date());

      window.gtag("config", GA_MEASUREMENT_ID, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });

      window.__turffGaInitialized = true;
    }

    if (!document.getElementById("turff-google-analytics")) {
      const script = document.createElement("script");
      script.id = "turff-google-analytics";
      script.async = true;
      script.src =
        `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;

      document.head.appendChild(script);
    }
  }, [consent]);

  useEffect(() => {
    if (consent !== "accepted" || !isPublicPage(pathname)) {
      return;
    }

    if (!window.gtag) {
      return;
    }

    window.gtag("event", "page_view", {
      page_title: document.title,
      page_path: pathname,
      page_location: `${window.location.origin}${pathname}`,
    });
  }, [consent, pathname]);

  function saveConsent(value: "accepted" | "rejected") {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // Analytics remains disabled if preferences cannot be stored.
    }

    setShowPreferences(false);
    window.dispatchEvent(new Event("turff-consent-change"));
  }

  const showBanner = consent === "unset" || showPreferences;

  return (
    <>
      {showBanner && (
        <section
          role="dialog"
          aria-label="Cookie preferences"
          aria-describedby="turff-cookie-description"
          className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:bottom-6 sm:p-6"
        >
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-lg font-extrabold text-gray-950">
                Your privacy matters
              </p>

              <p
                id="turff-cookie-description"
                className="mt-2 text-sm leading-6 text-gray-600"
              >
                TURFF uses essential technologies to operate the website.
                With your permission, Google Analytics helps us understand
                website visits and improve your experience. Analytics is
                optional and is not enabled unless you accept.
              </p>

              <a
                href="/cookies"
                className="mt-2 inline-block text-sm font-bold text-green-800 underline underline-offset-4"
              >
                Read our Cookie Policy
              </a>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => saveConsent("rejected")}
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50"
              >
                Reject optional analytics
              </button>

              <button
                type="button"
                onClick={() => saveConsent("accepted")}
                className="rounded-lg bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900"
              >
                Accept analytics
              </button>
            </div>
          </div>
        </section>
      )}

      {!showBanner && (
        <button
          type="button"
          onClick={() => setShowPreferences(true)}
          className="fixed bottom-3 left-3 z-[90] rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-md hover:bg-gray-50"
        >
          Cookie settings
        </button>
      )}
    </>
  );
}
