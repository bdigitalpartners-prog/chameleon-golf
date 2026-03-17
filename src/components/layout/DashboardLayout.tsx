"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { PiEasterEgg } from "@/components/layout/PiEasterEgg";

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

          {/* Site footer */}
          <footer
            className="py-8 mt-0"
            style={{
              backgroundColor: "var(--cg-bg-primary)",
              borderTop: "1px solid var(--cg-border)",
            }}
          >
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                  {/* Brand lockup */}
                  <div className="flex items-center gap-3 mb-3 justify-center sm:justify-start">
                    <img
                      src="/golfEQUALIZER_wordmark.svg"
                      alt="golfEQUALIZER"
                      className="h-6 w-auto"
                    />
                    <span className="text-[10px] opacity-50" style={{ color: "var(--cg-text-muted)" }}>|</span>
                    <img
                      src="/powered_by_COURSEfactor_ai.svg"
                      alt="Powered by COURSEfactor.ai"
                      className="h-4 w-auto opacity-70"
                    />
                  </div>
                  {/* Legal text */}
                  <div className="text-xs mb-2" style={{ color: "var(--cg-text-muted)" }}>
                    &copy; 2026 COURSEfactor.ai. golfEQUALIZER is a product of COURSEfactor.ai.
                  </div>
                  <div className="text-xs mb-2" style={{ color: "var(--cg-text-muted)", opacity: 0.7 }}>
                    Rankings powered by Golf Digest, Golfweek, GOLF Magazine &amp; Top100GolfCourses.
                  </div>
                </div>
              </div>
              {/* Bottom row: legal links + Looper Guild lambda */}
              <div className="flex items-center justify-center sm:justify-between mt-4 gap-x-4 gap-y-1 text-xs">
                <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center sm:justify-start">
                  <a href="/privacy" className="transition-colors hover:underline" style={{ color: "var(--cg-text-muted)" }}>Privacy Policy</a>
                  <a href="/terms" className="transition-colors hover:underline" style={{ color: "var(--cg-text-muted)" }}>Terms of Service</a>
                </div>
                <PiEasterEgg />
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
