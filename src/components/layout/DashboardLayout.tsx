"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:block flex-shrink-0 h-full"
        style={{
          backgroundColor: "var(--cg-bg-secondary)",
          borderRight: "1px solid var(--cg-border)",
        }}
      >
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} />
          <aside
            className="relative h-full overflow-y-auto"
            style={{
              width: 280,
              backgroundColor: "var(--cg-bg-secondary)",
              borderRight: "1px solid var(--cg-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar forceExpanded />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 overflow-y-auto overscroll-contain" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
