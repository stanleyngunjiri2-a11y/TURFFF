import type { Metadata } from "next";
import "./globals.css";
import { AnalyticsConsent } from "@/components/analytics-consent";

const SITE_URL = "https://www.turff.co.ke";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "TURFF | Find and Book Football Turfs in Kenya",
    template: "%s | TURFF Kenya",
  },

  description:
    "Find football turfs and pitches for hire in Kenya. Compare locations, prices and facilities, discover nearby football grounds, and request bookings with TURFF.",

  applicationName: "TURFF",

  keywords: [
    "football turfs in Kenya",
    "football pitches for hire in Kenya",
    "football pitches in Nairobi",
    "football turfs in Nairobi",
    "book a football pitch",
    "five a side football Kenya",
    "artificial football pitches",
    "football grounds near me",
    "TURFF",
  ],

  openGraph: {
    type: "website",
    locale: "en_KE",
    url: SITE_URL,
    siteName: "TURFF",
    title: "TURFF | Find and Book Football Turfs in Kenya",
    description:
      "Discover football turfs across Kenya, compare prices and facilities, and request your next football booking.",
  },

  twitter: {
    card: "summary_large_image",
    title: "TURFF | Find Football Turfs in Kenya",
    description:
      "Discover football pitches, compare prices and find places to play football across Kenya.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-KE">
      <body>
        {children}
        <AnalyticsConsent />
      </body>
    </html>
  );
}
