import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://turfff.vercel.app"),
  verification: {
    google: "Ay9knnbwIDF44uiplWmzbaVHNZvootYUXDi-GwICd9I",
  },
  title: "TURFF | Find Your Game",
  description:
    "Discover football turfs near you, compare prices, and request your next football booking with TURFF.",
  applicationName: "TURFF",
  keywords: [
    "football turfs Kenya",
    "football pitches Nairobi",
    "book football pitch",
    "five-a-side football",
    "TURFF",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
