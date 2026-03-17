"use client";

import { usePathname } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CirclesSocialWidget } from "@/components/circles-widget/CirclesSocialWidget";

/**
 * AppShell routes between the new sidebar dashboard layout
 * and a plain passthrough for admin pages (which have their
 * own layout with an admin sidebar).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Admin pages have their own sidebar + layout — skip the dashboard shell
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <DashboardLayout>
      {children}
      <CirclesSocialWidget />
      {/* Looper Guild lambda easter egg — bottom-right of home page */}
      {pathname === "/" && (
        <div className="fixed bottom-4 right-4 z-40">
          <PiEasterEgg />
        </div>
      )}
    </DashboardLayout>
  );
}
