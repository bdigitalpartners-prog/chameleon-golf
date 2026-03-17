import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Providers } from "@/components/layout/Providers";
import { PiEasterEgg } from "@/components/layout/PiEasterEgg";
import { CirclesSocialWidget } from "@/components/circles-widget/CirclesSocialWidget";
import { LeaderboardWidget } from "@/components/leaderboard-widget/LeaderboardWidget";

export const metadata: Metadata = {
  title: "golfEQUALIZER — Dynamic Golf Course Rankings",
  description:
    "Explore 1,500+ ranked golf courses worldwide. golfEQUALIZER aggregates Golf Digest, Golfweek, GOLF Magazine & Top100GolfCourses — then lets you re-weight by what matters to you.",
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
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <CirclesSocialWidget />
          <LeaderboardWidget />
          <footer
            className="py-8 mt-0"
            style={{
              backgroundColor: "var(--cg-bg-primary)",
              borderTop: "1px solid var(--cg-border)",
            }}
          >
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                  {/* Brand lockup */}
                  <div className="flex items-center gap-3 mb-3 justify-center sm:justify-start">
                    <img
                      src="/golfEQUALIZER_wordmark.svg"
                      alt="golfEQUALIZER"
                      className="h-6 w-auto"
                    />
                    <span className="text-[10px] opacity-50" style={{ color: "var(--cg-text-muted)" }}>|</span>
                    <img
                      src="/powered_by_COURSEfactor_ai.svg"
                      alt="Powered by COURSEfactor.ai"
                      className="h-4 w-auto opacity-70"
                    />
                  </div>
                  {/* Legal text */}
                  <div className="text-xs mb-2" style={{ color: "var(--cg-text-muted)" }}>
                    &copy; 2026 COURSEfactor.ai. golfEQUALIZER is a product of COURSEfactor.ai.
                  </div>
                  <div className="text-xs mb-2" style={{ color: "var(--cg-text-muted)", opacity: 0.7 }}>
                    Rankings powered by Golf Digest, Golfweek, GOLF Magazine &amp; Top100GolfCourses.
                  </div>
                </div>
              </div>
              {/* Bottom row: legal links + easter egg */}
              <div className="flex items-center justify-center sm:justify-between mt-4 gap-x-4 gap-y-1 text-xs">
                <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center sm:justify-start">
                  <a href="/privacy" className="transition-colors hover:underline" style={{ color: "var(--cg-text-muted)" }}>Privacy Policy</a>
                  <a href="/terms" className="transition-colors hover:underline" style={{ color: "var(--cg-text-muted)" }}>Terms of Service</a>
                </div>
                <PiEasterEgg />
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
