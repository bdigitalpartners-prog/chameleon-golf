"use client";

import { LayoutGrid, List, MapIcon } from "lucide-react";

export type ViewMode = "grid" | "list" | "map";

export function ViewToggle({ mode, onChange, showMap = false }: { mode: ViewMode; onChange: (m: ViewMode) => void; showMap?: boolean }) {
  const buttons = [
    { key: "grid" as const, label: "Cards", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
    { key: "list" as const, label: "List", icon: <List className="h-3.5 w-3.5" /> },
    ...(showMap ? [{ key: "map" as const, label: "Map", icon: <MapIcon className="h-3.5 w-3.5" /> }] : []),
  ];

  return (
    <div
      className="inline-flex rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--cg-border)" }}
    >
      {buttons.map((btn, i) => (
        <button
          key={btn.key}
          onClick={() => onChange(btn.key)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors"
          style={{
            backgroundColor: mode === btn.key ? "var(--cg-accent-bg)" : "transparent",
            color: mode === btn.key ? "var(--cg-accent)" : "var(--cg-text-muted)",
            borderLeft: i > 0 ? "1px solid var(--cg-border)" : "none",
          }}
        >
          {btn.icon}
          {btn.label}
        </button>
      ))}
    </div>
  );
}
