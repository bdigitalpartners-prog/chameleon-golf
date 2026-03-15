import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Providers } from "@/components/layout/Providers";
import ConciergeWidget from "@/components/concierge/ConciergeWidget";

export const metadata: Metadata = {
  title: "CourseFACTOR — Dynamic Golf Course Rankings",
  description:
    "Explore 1,500+ ranked golf courses worldwide. CourseFACTOR aggregates Golf Digest, Golfweek, GOLF Magazine & Top100GolfCourses — then lets you re-weight by what matters to you.",
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
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left text-sm" style={{ color: "var(--cg-text-muted)" }}>
                  <div>
                    &copy; {new Date().getFullYear()} CourseFACTOR. Rankings powered by Golf Digest, Golfweek, GOLF Magazine &amp; Top100GolfCourses.
                  </div>
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
                <div className="flex-shrink-0">
                  <img
                    src="/powered_by_COURSEfactor_ai.svg"
                    alt="Powered by COURSEfactor.ai"
                    className="h-6 w-auto opacity-70"
                  />
                </div>
              </div>
            </div>
          </footer>
          <ConciergeWidget />
        </Providers>
      </body>
    </html>
  );
}
