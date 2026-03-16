"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Search, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { ThemeSettings } from "@/components/layout/ThemeSettings";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isAdmin = (session?.user as any)?.role === "admin";

  return (
    <>
      <nav
        className="sticky top-0 z-50 backdrop-blur"
        style={{
          backgroundColor: "var(--cg-bg-nav)",
          borderBottom: "1px solid var(--cg-border)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/golfEQUALIZER_wordmark.svg"
              alt="golfEQUALIZER"
              className="h-7 sm:h-8 w-auto"
            />
            <span
              className="hidden sm:inline-flex items-center gap-0.5 text-[9px] tracking-wide opacity-60"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <span style={{ color: "var(--cg-text-muted)", fontWeight: 300 }}>powered by</span>
              <span style={{ color: "var(--cg-text-secondary)", fontWeight: 800 }}>COURSE</span>
              <span style={{ color: "var(--cg-text-muted)", fontWeight: 300 }}>factor.ai</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            {[
              { href: "/rankings", label: "Rankings" },
              { href: "/explore", label: "Explore" },
              { href: "/about", label: "How It Works" },
              ...(session
                ? [
                    { href: "/feed", label: "Feed" },
                    { href: "/circles", label: "Circles" },
                    { href: "/journal", label: "Score Journal" },
                    { href: "/profile", label: "Profile" },
                  ]
                : []),
              ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors"
                style={{ color: "var(--cg-text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cg-accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--cg-text-secondary)")}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeSettings />

            {session && <NotificationBell />}

            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-lg p-2 transition-colors"
              style={{ color: "var(--cg-text-secondary)" }}
            >
              <Search className="h-5 w-5" />
            </button>

            {session ? (
              <div className="flex items-center gap-2">
                {session.user?.image ? (
                  <img src={session.user.image} alt="" className="h-8 w-8 rounded-full" />
                ) : (
                  <User className="h-5 w-5" style={{ color: "var(--cg-text-secondary)" }} />
                )}
                <button
                  onClick={() => signOut()}
                  className="hidden md:block text-sm transition-colors"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
                style={{
                  backgroundColor: "var(--cg-accent)",
                  color: "var(--cg-text-inverse)",
                }}
              >
                Sign In
              </button>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden rounded-lg p-2"
              style={{ color: "var(--cg-text-secondary)" }}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div
            className="px-4 py-3 md:hidden"
            style={{
              borderTop: "1px solid var(--cg-border)",
              backgroundColor: "var(--cg-bg-secondary)",
            }}
          >
            <div className="flex flex-col gap-2 text-sm font-medium">
              {[
                { href: "/rankings", label: "Rankings" },
                { href: "/explore", label: "Explore" },
                { href: "/about", label: "How It Works" },
                ...(session
                  ? [
                      { href: "/feed", label: "Feed" },
                      { href: "/circles", label: "Circles" },
                      { href: "/journal", label: "Score Journal" },
                      { href: "/profile", label: "Profile" },
                    ]
                  : []),
                ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  style={{ color: "var(--cg-text-secondary)" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
