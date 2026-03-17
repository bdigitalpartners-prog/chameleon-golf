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
    </DashboardLayout>
  );
}
