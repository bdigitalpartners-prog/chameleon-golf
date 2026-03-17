"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Search, Menu, X, User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { ThemeSettings } from "@/components/layout/ThemeSettings";
import { NotificationBell } from "@/components/layout/NotificationBell";

function UserDropdown({ session }: { session: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors"
        style={{ color: "var(--cg-text-secondary)" }}
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt=""
            className="h-8 w-8 rounded-full ring-2"
            style={{ ringColor: "var(--cg-accent)" } as any}
          />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
            style={{
              backgroundColor: "var(--cg-accent)",
              color: "var(--cg-text-inverse)",
            }}
          >
            {session.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
        )}
        <ChevronDown className="h-3.5 w-3.5 hidden md:block" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-lg py-1 shadow-xl"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
          }}
        >
          <div
            className="px-3 py-2 text-xs truncate"
            style={{
              color: "var(--cg-text-muted)",
              borderBottom: "1px solid var(--cg-border)",
            }}
          >
            {session.user?.email}
          </div>
          {[
            { href: "/profile", label: "Profile" },
            { href: "/settings/profile", label: "Settings" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm transition-colors"
              style={{ color: "var(--cg-text-secondary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--cg-bg-card-hover)";
                e.currentTarget.style.color = "var(--cg-accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--cg-text-secondary)";
              }}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full px-3 py-2 text-left text-sm transition-colors"
            style={{
              color: "var(--cg-text-muted)",
              borderTop: "1px solid var(--cg-border)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--cg-bg-card-hover)";
              e.currentTarget.style.color = "var(--cg-error, #ef4444)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--cg-text-muted)";
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

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
              { href: "/compare", label: "Compare" },
              { href: "/map", label: "Map" },
              { href: "/architects", label: "Architects" },
              { href: "/fairway", label: "The Fairway" },
              { href: "/performance", label: "Performance" },
              { href: "/shop", label: "Pro Shop" },
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
              <UserDropdown session={session} />
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
                { href: "/compare", label: "Compare" },
                { href: "/map", label: "Map" },
                { href: "/architects", label: "Architects" },
                { href: "/fairway", label: "The Fairway" },
                { href: "/performance", label: "Performance" },
                { href: "/shop", label: "Pro Shop" },
                { href: "/about", label: "How It Works" },
                ...(session
                  ? [
                      { href: "/feed", label: "Feed" },
                      { href: "/circles", label: "Circles" },
                      { href: "/journal", label: "Score Journal" },
                      { href: "/profile", label: "Profile" },
                      { href: "/settings/profile", label: "Settings" },
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
              {session ? (
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-left"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => signIn("google")}
                  className="text-left"
                  style={{ color: "var(--cg-accent)" }}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
