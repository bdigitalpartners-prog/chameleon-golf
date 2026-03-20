import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { Providers } from "@/components/layout/Providers";
import { AppShell } from "@/components/layout/AppShell";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "golfEQUALIZER — Dynamic Golf Course Rankings",
  description:
    "Explore 1,500+ ranked golf courses worldwide. golfEQUALIZER aggregates Golf Digest, Golfweek, GOLF Magazine & Top100GolfCourses — then lets you re-weight by what matters to you.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "golfEQUALIZER — Dynamic Golf Course Rankings",
    description: "Explore 1,500+ ranked golf courses worldwide with dynamic, user-weighted rankings.",
    url: "https://golfequalizer.ai",
    siteName: "golfEQUALIZER",
    type: "website",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "golfEQUALIZER — Dynamic Golf Course Rankings",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "golfEQUALIZER — Dynamic Golf Course Rankings",
    description: "Explore 1,500+ ranked golf courses worldwide with dynamic, user-weighted rankings.",
    images: ["/og-default.png"],
  },
  metadataBase: new URL("https://golfequalizer.ai"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <GoogleAnalytics />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
