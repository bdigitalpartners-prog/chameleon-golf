"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  MapPin,
  Trophy,
  Users,
  Star,
  MessageCircle,
  BarChart3,
  Settings,
  Menu,
  X,
  Shield,
  Database,
  Lightbulb,
  Coins,
  Crown,
  Layers,
  Calculator,
  BadgeCheck,
  PenTool,
  Navigation,
  ClipboardList,
  FileText,
  BookOpen,
  ImageIcon,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Courses", href: "/admin/courses", icon: MapPin },
  { label: "Architects", href: "/admin/architects", icon: PenTool },
  { label: "Content", href: "/admin/content", icon: FileText },
  { label: "Books", href: "/admin/books", icon: BookOpen },
  { label: "POIs", href: "/admin/pois", icon: Navigation },
  { label: "Images", href: "/admin/images", icon: ImageIcon },
  { label: "Enrichment", href: "/admin/enrichment", icon: Database },
  { label: "Architecture", href: "/admin/architecture", icon: Layers },
  { label: "Intelligence", href: "/admin/intelligence", icon: Lightbulb },
  { label: "Rankings", href: "/admin/rankings", icon: Trophy },
  { label: "Scores", href: "/admin/scores", icon: Calculator },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Verification", href: "/admin/verification", icon: BadgeCheck },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Concierge", href: "/admin/concierge", icon: MessageCircle },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Tokens", href: "/admin/tokens", icon: Coins },
  { label: "Feedback", href: "/admin/feedback", icon: ClipboardList },
  { label: "Founders", href: "/admin/founders", icon: Crown },
  { label: "Tiers", href: "/admin/tiers", icon: Layers },
  { label: "System", href: "/admin/system", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#0a0a0a" }}>
          <div className="text-sm text-gray-400">Loading...</div>
        </div>
      }
    >
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = (session?.user as any)?.role === "admin";
  const keyParam = searchParams.get("key");
  const hasKeyAccess = keyParam === process.env.NEXT_PUBLIC_ADMIN_API_KEY || !!keyParam;

  // Store the admin key in sessionStorage so all admin pages can use it for API calls
  useEffect(() => {
    if (keyParam) {
      sessionStorage.setItem("golfEQ_admin_key", keyParam);
    }
  }, [keyParam]);

  // Read stored key for navigation (in case key isn't in current URL)
  const storedKey = typeof window !== "undefined" ? sessionStorage.getItem("golfEQ_admin_key") : null;
  const adminKey = keyParam || storedKey;
  const hasAccess = isAdmin || !!adminKey;

  useEffect(() => {
    if (status === "loading") return;
    if (!hasAccess) {
      router.push("/");
    }
  }, [status, hasAccess, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-600" />
          <h1 className="mt-4 text-lg font-semibold text-white">Access Denied</h1>
          <p className="mt-1 text-sm text-gray-400">Admin access required.</p>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#0a0a0a" }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-800 bg-[#111111] transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-gray-800 px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            <span className="text-sm font-bold text-white">GolfEQ Admin</span>
          </div>
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-4 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const navHref = adminKey ? `${item.href}?key=${adminKey}` : item.href;
            return (
              <a
                key={item.href}
                href={navHref}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-green-500/10 text-green-500"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-3">
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2 text-xs text-gray-500">
            Signed in as {session?.user?.email || "admin"}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-gray-800 bg-[#0a0a0a]/80 px-4 backdrop-blur-sm lg:hidden">
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-white">GolfEQ Admin</span>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
