"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useCallback } from "react";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  Home,
  Compass,
  Medal,
  MapPin,
  PenTool,
  SlidersHorizontal,
  Plane,
  BarChart3,
  Users,
  Calendar,
  Newspaper,
  Heart,
  Coins,
  ShoppingBag,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogIn,
  Shield,
  Rss,
  NotebookPen,
  GraduationCap,
  Flame,
  FileCheck,
  CloudSun,
  Trophy,
  Sparkles,
  Dna,
  Target,
  DollarSign,
  Footprints,
  TrendingUp,
  Satellite,
  Video,
  Scroll,
  GitCompare,
  Star,
} from "lucide-react";

/* ─── Types ────────────────────────────────────────── */
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
  adminOnly?: boolean;
  badge?: "NEW" | "PRO" | "ELITE";
  highlight?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/* ─── Navigation Config ──────────────────────────── */
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Discover",
    items: [
      { href: "/", label: "Home", icon: Home },
      { href: "/explore", label: "Explore Courses", icon: Compass },
      { href: "/rankings", label: "Rankings", icon: Medal },
      { href: "/map", label: "Map", icon: MapPin },
      { href: "/architects", label: "Architects", icon: PenTool },
      { href: "/conditions", label: "Conditions", icon: CloudSun, badge: "NEW" },
      { href: "/tournaments", label: "Tournaments", icon: Trophy, badge: "NEW" },
      { href: "/aeration", label: "Aeration Tracker", icon: Calendar, badge: "NEW" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/concierge", label: "AI Concierge", icon: Sparkles, badge: "NEW" },
      { href: "/course-dna", label: "Course DNA", icon: Dna, badge: "NEW" },
      { href: "/course-fit", label: "Course-Fit", icon: Target, badge: "NEW" },
      { href: "/trips", label: "Trip Planner", icon: Plane, badge: "NEW" },
      { href: "/green-fee-index", label: "Green Fee Index", icon: DollarSign, badge: "NEW" },
      { href: "/walking-guide", label: "Walking Guide", icon: Footprints, badge: "NEW" },
      { href: "/betting", label: "Betting & DFS", icon: TrendingUp, badge: "PRO" },
      { href: "/satellite", label: "Satellite Analysis", icon: Satellite, badge: "PRO" },
      { href: "/performance", label: "Performance", icon: BarChart3 },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/fairway", label: "The Fairway", icon: Newspaper },
      { href: "/creators", label: "Creators", icon: Video, badge: "NEW" },
      { href: "/looper-guild", label: "Looper Guild", icon: Flame },
      { href: "/events", label: "Events", icon: Calendar },
    ],
  },
  {
    label: "My Golf",
    items: [
      { href: "/eq-wrapped", label: "EQ Wrapped", icon: Scroll, badge: "NEW", requiresAuth: true },
      { href: "/compare", label: "Compare", icon: GitCompare, badge: "NEW", requiresAuth: true },
      { href: "/shop", label: "Pro Shop", icon: ShoppingBag },
      { href: "/settings/chameleon-score", label: "My EQ Score", icon: SlidersHorizontal, requiresAuth: true },
    ],
  },
  {
    label: "Upgrade",
    items: [
      { href: "/pricing", label: "Pricing", icon: Star, badge: "NEW", highlight: true },
    ],
  },
];

/* ─── Badge Colors ─────────────────────────────── */
const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  NEW: { bg: "#00FF8520", color: "#00FF85" },
  PRO: { bg: "#3B82F620", color: "#3B82F6" },
  ELITE: { bg: "#F59E0B20", color: "#F59E0B" },
};

/* ─── Sidebar Nav Item ───────────────────────────── */
function SidebarItem({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const highlight = item.highlight;
  return (
    <Link
      href={item.href}
      className={`
        group relative flex items-center gap-3 rounded-lg transition-all duration-200
        ${collapsed ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2"}
      `}
      style={{
        backgroundColor: active
          ? "var(--cg-accent-bg)"
          : highlight
            ? "#00FF8508"
            : "transparent",
        color: active
          ? "var(--cg-accent)"
          : highlight
            ? "#00FF85"
            : "var(--cg-text-secondary)",
        borderLeft:
          active && !collapsed
            ? "3px solid var(--cg-accent)"
            : "3px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = highlight
            ? "#00FF8515"
            : "var(--cg-bg-card-hover)";
          e.currentTarget.style.color = highlight
            ? "#00FF85"
            : "var(--cg-text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = highlight
            ? "#00FF8508"
            : "transparent";
          e.currentTarget.style.color = highlight
            ? "#00FF85"
            : "var(--cg-text-secondary)";
        }
      }}
      title={collapsed ? item.label : undefined}
    >
      <Icon className={`flex-shrink-0 ${collapsed ? "w-5 h-5" : "w-[18px] h-[18px]"}`} />
      {!collapsed && (
        <>
          <span className="text-sm font-medium truncate">{item.label}</span>
          {item.badge && (
            <span
              className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: BADGE_STYLES[item.badge]?.bg || "#00FF8520",
                color: BADGE_STYLES[item.badge]?.color || "#00FF85",
              }}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
      {collapsed && (
        <span
          className="absolute left-full ml-2 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            color: "var(--cg-text-primary)",
            border: "1px solid var(--cg-border)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {item.label}
        </span>
      )}
    </Link>
  );
}

/* ─── Sidebar Component ──────────────────────────── */
interface SidebarProps {
  forceExpanded?: boolean;
}

export function Sidebar({ forceExpanded }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdmin = (session?.user as any)?.role === "admin";
  const { collapsed, toggle } = useSidebar();

  const isCollapsed = forceExpanded ? false : collapsed;

  const isActive = useCallback(
    (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname]
  );

  const shouldShowItem = useCallback(
    (item: NavItem) => {
      if (item.adminOnly && !isAdmin) return false;
      if (item.requiresAuth && !session) return false;
      return true;
    },
    [session, isAdmin]
  );

  return (
    <div
      className="flex flex-col h-full transition-all duration-200 overflow-hidden"
      style={{ width: forceExpanded ? 280 : isCollapsed ? 64 : 260 }}
    >
      {/* ─── Logo + Collapse Toggle ─── */}
      <div
        className="flex items-center justify-between pl-4 pr-[10px] h-16 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--cg-border)" }}
      >
        {!forceExpanded && (
          <button
            onClick={toggle}
            className="flex items-center justify-center w-8 h-8 rounded-md transition-colors flex-shrink-0"
            style={{ color: "var(--cg-text-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--cg-bg-card-hover)";
              e.currentTarget.style.color = "var(--cg-text-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--cg-text-muted)";
            }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
        {!isCollapsed && (
          <Link href="/" className="flex items-center min-w-0 ml-auto">
            <img
              src="/golfEQUALIZER_wordmark.svg"
              alt="golfEQUALIZER"
              className="h-6 w-auto flex-shrink-0"
            />
          </Link>
        )}
      </div>

      {/* ─── Navigation Groups ─── */}
      <nav className="flex-1 overflow-y-auto overscroll-contain py-3 px-2 space-y-5">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(shouldShowItem);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              {!isCollapsed && (
                <div
                  className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[1.5px]"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  {group.label}
                </div>
              )}
              {isCollapsed && (
                <div className="mx-auto mb-1.5 w-6 border-t" style={{ borderColor: "var(--cg-border)" }} />
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <SidebarItem key={item.href} item={item} active={isActive(item.href)} collapsed={isCollapsed} />
                ))}
              </div>
            </div>
          );
        })}

        {isAdmin && (
          <div>
            {!isCollapsed && (
              <div
                className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[1.5px]"
                style={{ color: "var(--cg-text-muted)" }}
              >
                Admin
              </div>
            )}
            <SidebarItem item={{ href: "/admin", label: "Admin", icon: Shield }} active={isActive("/admin")} collapsed={isCollapsed} />
          </div>
        )}
      </nav>

      {/* ─── Bottom: Settings + User ─── */}
      <div className="flex-shrink-0 px-2 py-3 space-y-1" style={{ borderTop: "1px solid var(--cg-border)" }}>
        <SidebarItem
          item={{ href: "/settings/profile", label: "Settings", icon: Settings }}
          active={isActive("/settings")}
          collapsed={isCollapsed}
        />

        {session ? (
          <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${isCollapsed ? "justify-center px-0 mx-1" : ""}`}>
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="h-8 w-8 rounded-full ring-2 flex-shrink-0"
                style={{ ringColor: "var(--cg-accent)" } as any}
              />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold flex-shrink-0"
                style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
              >
                {session.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
            )}
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate" style={{ color: "var(--cg-text-primary)" }}>
                  {session.user?.name ?? "User"}
                </div>
                <div className="text-[11px] truncate" style={{ color: "var(--cg-text-muted)" }}>
                  {session.user?.email}
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => signIn("google")}
            className={`flex items-center gap-3 rounded-lg transition-all duration-200 w-full ${isCollapsed ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2"}`}
            style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
          >
            <LogIn className={`flex-shrink-0 ${isCollapsed ? "w-5 h-5" : "w-[18px] h-[18px]"}`} />
            {!isCollapsed && <span className="text-sm font-semibold">Sign In</span>}
          </button>
        )}
      </div>
    </div>
  );
}
