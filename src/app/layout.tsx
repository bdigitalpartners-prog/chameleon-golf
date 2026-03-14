import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "Chameleon Golf -- Dynamic Golf Course Rankings",
  description:
    "Explore 1,500+ ranked golf courses worldwide. Aggregating Golf Digest, Golfweek, GOLF Magazine & Top100GolfCourses -- then letting you re-weight by what matters to you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <footer
            className="py-8 mt-0"
            style={{
              backgroundColor: "var(--cg-bg-primary)",
              borderTop: "1px solid var(--cg-border)",
            }}
          >
            <div className="mx-auto max-w-7xl px-4 text-center text-sm" style={{ color: "var(--cg-text-muted)" }}>
              &copy; {new Date().getFullYear()} Chameleon Golf. Rankings powered by Golf Digest, Golfweek, GOLF Magazine &amp; Top100GolfCourses.
              <div className="mt-2">
                <a
                  href="https://www.perplexity.ai/computer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  Created with Perplexity Computer
                </a>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
