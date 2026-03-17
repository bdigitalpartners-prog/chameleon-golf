"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Menu, Bell } from "lucide-react";
import { useState, useMemo } from "react";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { ThemeSettings } from "@/components/layout/ThemeSettings";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { LeaderboardWidget } from "@/components/leaderboard-widget/LeaderboardWidget";

/* ─── Breadcrumb mapping ──────────────────────────── */
const BREADCRUMB_MAP: Record<string, { section: string; label: string }> = {
  "/": { section: "", label: "Home" },
  "/explore": { section: "Discover", label: "Explore Courses" },
  "/rankings": { section: "Discover", label: "Rankings" },
  "/map": { section: "Discover", label: "Map" },
  "/architects": { section: "Discover", label: "Architects" },
  "/settings/chameleon-score": { section: "Intelligence", label: "My EQ Score" },
  "/trips": { section: "Intelligence", label: "Trip Planner" },
  "/performance": { section: "Intelligence", label: "Performance" },
  "/academy": { section: "Intelligence", label: "Academy" },
  "/feed": { section: "Community", label: "Feed" },
  "/circles": { section: "Community", label: "Circles" },
  "/events": { section: "Community", label: "Events" },
  "/fairway": { section: "Community", label: "The Fairway" },
  "/bucket-list": { section: "My Golf", label: "My Courses" },
  "/journal": { section: "My Golf", label: "Score Journal" },
  "/badges": { section: "My Golf", label: "EQ Tokens" },
  "/shop": { section: "My Golf", label: "Pro Shop" },
  "/about": { section: "", label: "How It Works" },
  "/profile": { section: "", label: "Profile" },
  "/settings/profile": { section: "", label: "Settings" },
  "/admin": { section: "", label: "Admin" },
  "/compare": { section: "Discover", label: "Compare" },
  "/discover": { section: "Discover", label: "Discover" },
};

function getBreadcrumb(pathname: string): { section: string; label: string } {
  // Exact match first
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname];

  // Try matching the first two segments
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 1) {
    const firstLevel = `/${segments[0]}`;
    if (BREADCRUMB_MAP[firstLevel]) {
      return {
        section: BREADCRUMB_MAP[firstLevel].section,
        label: BREADCRUMB_MAP[firstLevel].label,
      };
    }
  }

  return { section: "", label: "golfEQUALIZER" };
}

/* ─── TopBar Component ──────────────────────────── */
interface TopBarProps {
  onMobileMenuToggle: () => void;
}

export function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  const breadcrumb = useMemo(() => getBreadcrumb(pathname), [pathname]);

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between h-12 px-4 md:px-6 backdrop-blur"
        style={{
          backgroundColor: "var(--cg-bg-nav)",
          borderBottom: "1px solid var(--cg-border)",
        }}
      >
        {/* Left: Mobile menu + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-md transition-colors"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 text-sm min-w-0">
            {breadcrumb.section && (
              <>
                <span style={{ color: "var(--cg-text-muted)" }}>{breadcrumb.section}</span>
                <span style={{ color: "var(--cg-text-muted)", fontSize: "10px" }}>/</span>
              </>
            )}
            <span className="font-medium truncate" style={{ color: "var(--cg-text-primary)" }}>
              {breadcrumb.label}
            </span>
          </div>
        </div>

        {/* Center: Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors max-w-[400px] w-full mx-8"
          style={{
            backgroundColor: "var(--cg-bg-tertiary)",
            border: "1px solid var(--cg-border)",
            color: "var(--cg-text-muted)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--cg-text-muted)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--cg-border)";
          }}
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Search courses, architects, regions...</span>
          <kbd
            className="hidden lg:inline ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              border: "1px solid var(--cg-border)",
              color: "var(--cg-text-muted)",
            }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Mobile search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="sm:hidden flex items-center justify-center w-8 h-8 rounded-md transition-colors"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            <Search className="w-4 h-4" />
          </button>

          {session && <NotificationBell />}

          <ThemeSettings />

          {/* User avatar (small, in topbar) */}
          {session?.user && (
            <div className="ml-1">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="h-7 w-7 rounded-full ring-1"
                  style={{ ringColor: "var(--cg-border)" } as any}
                />
              ) : (
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: "var(--cg-accent)",
                    color: "var(--cg-text-inverse)",
                  }}
                >
                  {session.user.name?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
              )}
            </div>
          )}

          <LeaderboardWidget />
        </div>
      </header>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
