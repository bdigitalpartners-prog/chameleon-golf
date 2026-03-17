"use client";

import Link from "next/link";

interface Renovation {
  id: number;
  year: number | null;
  type: string;
  description: string | null;
  scope: string | null;
  architectId: number | null;
  architect?: { id: number; name: string; slug?: string } | null;
  source: string | null;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Original Design": { bg: "rgba(34,197,94,0.15)", text: "#4ade80", border: "rgba(34,197,94,0.3)" },
  "Major Renovation": { bg: "rgba(234,179,8,0.15)", text: "#fbbf24", border: "rgba(234,179,8,0.3)" },
  Restoration: { bg: "rgba(168,85,247,0.15)", text: "#c084fc", border: "rgba(168,85,247,0.3)" },
  "Bunker Renovation": { bg: "rgba(59,130,246,0.15)", text: "#60a5fa", border: "rgba(59,130,246,0.3)" },
  "Green Rebuild": { bg: "rgba(236,72,153,0.15)", text: "#f472b6", border: "rgba(236,72,153,0.3)" },
  "Routing Change": { bg: "rgba(249,115,22,0.15)", text: "#fb923c", border: "rgba(249,115,22,0.3)" },
};

export function RenovationTimeline({ renovations }: { renovations: Renovation[] }) {
  if (!renovations || renovations.length === 0) return null;

  const sorted = [...renovations].sort((a, b) => (a.year ?? 0) - (b.year ?? 0));

  return (
    <div className="relative">
      {/* Vertical line */}
      <div
        className="absolute left-[19px] top-2 bottom-2 w-px"
        style={{ backgroundColor: "var(--cg-border)" }}
      />

      <div className="space-y-6">
        {sorted.map((ren, idx) => {
          const colors = TYPE_COLORS[ren.type] || TYPE_COLORS["Major Renovation"];

          return (
            <div key={ren.id} className="relative flex gap-4">
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0">
                <div
                  className="h-[10px] w-[10px] rounded-full mt-1.5"
                  style={{
                    backgroundColor: colors.text,
                    boxShadow: `0 0 8px ${colors.text}40`,
                    marginLeft: "15px",
                  }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {ren.year && (
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: "var(--cg-text-primary)" }}
                    >
                      {ren.year}
                    </span>
                  )}
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {ren.type}
                  </span>
                </div>

                {ren.architect && (
                  <div className="mb-1">
                    {ren.architect.slug ? (
                      <Link
                        href={`/architects/${ren.architect.slug}`}
                        className="text-xs font-medium transition-colors hover:underline"
                        style={{ color: "var(--cg-accent)" }}
                      >
                        {ren.architect.name}
                      </Link>
                    ) : (
                      <span
                        className="text-xs font-medium"
                        style={{ color: "var(--cg-accent)" }}
                      >
                        {ren.architect.name}
                      </span>
                    )}
                  </div>
                )}

                {ren.description && (
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--cg-text-secondary)" }}
                  >
                    {ren.description}
                  </p>
                )}

                {ren.scope && (
                  <p className="text-xs mt-1" style={{ color: "var(--cg-text-muted)" }}>
                    Scope: {ren.scope}
                  </p>
                )}

                {ren.source && (
                  <p
                    className="text-[10px] mt-1 italic"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    Source: {ren.source}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
