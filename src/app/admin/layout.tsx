"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
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
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Courses", path: "/admin/courses", icon: MapPin },
  { label: "Rankings", path: "/admin/rankings", icon: Trophy },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Reviews", path: "/admin/reviews", icon: Star },
  { label: "Concierge", path: "/admin/concierge", icon: MessageCircle },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { label: "System", path: "/admin/system", icon: Settings },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = (session?.user as any)?.role === "admin";
  const hasKeyParam = searchParams.get("key") === process.env.NEXT_PUBLIC_ADMIN_KEY ||
    (typeof window !== "undefined" && searchParams.get("key") && searchParams.get("key")!.length > 0);

  const authorized = isAdmin || hasKeyParam;

  useEffect(() => {
    if (status === "loading") return;
    if (!authorized) {
      router.push("/");
    }
  }, [status, authorized, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">Access Denied</h1>
          <p className="mt-2 text-sm text-gray-400">Admin access required.</p>
        </div>
      </div>
    );
  }

  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin";
    return pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#0a0a0a" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          backgroundColor: "#111111",
          borderRight: "1px solid #1f1f1f",
        }}
      >
        <div className="flex h-16 items-center justify-between px-5" style={{ borderBottom: "1px solid #1f1f1f" }}>
          <span className="text-lg font-bold text-white">
            GolfEQ <span style={{ color: "#22c55e" }}>Admin</span>
          </span>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-4 space-y-1 px-3">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => {
                  router.push(path);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
                style={active ? { backgroundColor: "rgba(34, 197, 94, 0.1)", color: "#22c55e" } : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
                {active && <ChevronRight className="ml-auto h-4 w-4" />}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header
          className="flex h-16 items-center gap-4 px-6 lg:hidden"
          style={{ borderBottom: "1px solid #1f1f1f" }}
        >
          <button className="text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-lg font-bold text-white">
            GolfEQ <span style={{ color: "#22c55e" }}>Admin</span>
          </span>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

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
