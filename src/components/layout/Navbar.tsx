"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Palette } from "lucide-react";
import { ThemeSettings } from "./ThemeSettings";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/rankings", label: "Rankings" },
  // { href: "/courses", label: "Courses" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          backgroundColor: "var(--cg-bg-primary)",
          borderColor: "var(--cg-border)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link
            href="/"
            className="font-display text-lg font-bold tracking-tight"
            style={{ color: "var(--cg-text-primary)" }}
          >
            ⛳ Chameleon Golf
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  style={{
                    color: active ? "var(--cg-accent)" : "var(--cg-text-secondary)",
                    backgroundColor: active ? "var(--cg-accent-bg)" : "transparent",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setThemeOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
              style={{
                color: "var(--cg-text-muted)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--cg-bg-tertiary)";
                e.currentTarget.style.color = "var(--cg-text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--cg-text-muted)";
              }}
              aria-label="Theme settings"
            >
              <Palette className="h-4.5 w-4.5" />
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ color: "var(--cg-text-secondary)" }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div
            className="md:hidden border-t px-4 py-3 flex flex-col gap-1"
            style={{
              backgroundColor: "var(--cg-bg-primary)",
              borderColor: "var(--cg-border)",
            }}
          >
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-md text-sm font-medium"
                  style={{
                    color: active ? "var(--cg-accent)" : "var(--cg-text-secondary)",
                    backgroundColor: active ? "var(--cg-accent-bg)" : "transparent",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Theme settings panel */}
      <ThemeSettings open={themeOpen} onClose={() => setThemeOpen(false)} />
    </>
  );
}
