import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "Chameleon Golf — Dynamic Golf Course Rankings",
  description:
    "Explore 1,500+ ranked golf courses worldwide. Filter by what matters to you — style, access, price, rankings — and watch the list adapt in real time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <footer className="border-t border-stone-200 bg-white py-8 mt-12">
            <div className="mx-auto max-w-7xl px-4 text-center text-sm text-stone-500">
              &copy; {new Date().getFullYear()} Chameleon Golf. Rankings powered by Golf Digest, Golfweek, GOLF.com & Top100GolfCourses.
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
