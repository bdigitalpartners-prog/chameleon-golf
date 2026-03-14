"use client";

import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "grid" | "list";

export function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div
      className="inline-flex rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--cg-border)" }}
    >
      <button
        onClick={() => onChange("grid")}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors"
        style={{
          backgroundColor: mode === "grid" ? "var(--cg-accent-bg)" : "transparent",
          color: mode === "grid" ? "var(--cg-accent)" : "var(--cg-text-muted)",
        }}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Cards
      </button>
      <button
        onClick={() => onChange("list")}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors"
        style={{
          backgroundColor: mode === "list" ? "var(--cg-accent-bg)" : "transparent",
          color: mode === "list" ? "var(--cg-accent)" : "var(--cg-text-muted)",
          borderLeft: "1px solid var(--cg-border)",
        }}
      >
        <List className="h-3.5 w-3.5" />
        List
      </button>
    </div>
  );
}
