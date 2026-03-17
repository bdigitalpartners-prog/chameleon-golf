"use client";

import { useState } from "react";

interface TemplateHole {
  id: number;
  holeNumber: number;
  templateName: string;
  description: string | null;
  originalInspiration: string | null;
  educationalNote: string | null;
}

const TEMPLATE_ICONS: Record<string, string> = {
  Redan: "🔻",
  Cape: "🌊",
  Biarritz: "🏖️",
  Short: "🎯",
  Eden: "🌿",
  Alps: "⛰️",
  Punchbowl: "🥣",
  Knoll: "⛳",
  Sahara: "🏜️",
  Long: "📏",
  "Road Hole": "🛤️",
  "Double Plateau": "📊",
  Dell: "🕳️",
  Lido: "🏝️",
  Bottle: "🍾",
};

const TEMPLATE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Redan: { bg: "rgba(239,68,68,0.12)", text: "#f87171", border: "rgba(239,68,68,0.25)" },
  Cape: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", border: "rgba(59,130,246,0.25)" },
  Biarritz: { bg: "rgba(34,211,238,0.12)", text: "#22d3ee", border: "rgba(34,211,238,0.25)" },
  Short: { bg: "rgba(34,197,94,0.12)", text: "#4ade80", border: "rgba(34,197,94,0.25)" },
  Eden: { bg: "rgba(74,222,128,0.12)", text: "#86efac", border: "rgba(74,222,128,0.25)" },
  Alps: { bg: "rgba(168,85,247,0.12)", text: "#c084fc", border: "rgba(168,85,247,0.25)" },
  Punchbowl: { bg: "rgba(249,115,22,0.12)", text: "#fb923c", border: "rgba(249,115,22,0.25)" },
  Knoll: { bg: "rgba(234,179,8,0.12)", text: "#fbbf24", border: "rgba(234,179,8,0.25)" },
};

export function TemplateHolesSection({ holes }: { holes: TemplateHole[] }) {
  const [expandedHole, setExpandedHole] = useState<number | null>(null);

  if (!holes || holes.length === 0) return null;

  const sorted = [...holes].sort((a, b) => a.holeNumber - b.holeNumber);

  return (
    <div className="space-y-3">
      {/* Header callout */}
      <div
        className="rounded-lg p-3 mb-4"
        style={{
          backgroundColor: "rgba(34,197,94,0.06)",
          border: "1px solid rgba(34,197,94,0.15)",
        }}
      >
        <p className="text-xs" style={{ color: "var(--cg-text-secondary)" }}>
          <span className="font-semibold" style={{ color: "var(--cg-accent)" }}>
            Template holes
          </span>{" "}
          are holes inspired by classic designs from golf&apos;s greatest courses.
          Recognizing them deepens your appreciation of golf course architecture.
        </p>
      </div>

      {sorted.map((hole) => {
        const isExpanded = expandedHole === hole.id;
        const colors =
          TEMPLATE_COLORS[hole.templateName] ||
          TEMPLATE_COLORS.Short;
        const icon = TEMPLATE_ICONS[hole.templateName] || "⛳";

        return (
          <div
            key={hole.id}
            className="rounded-xl overflow-hidden transition-all cursor-pointer"
            style={{
              backgroundColor: "var(--cg-bg-secondary)",
              border: `1px solid ${isExpanded ? colors.border : "var(--cg-border)"}`,
            }}
            onClick={() => setExpandedHole(isExpanded ? null : hole.id)}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4">
              <div
                className="flex items-center justify-center h-10 w-10 rounded-lg text-lg flex-shrink-0"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-bold"
                    style={{ color: "var(--cg-text-primary)" }}
                  >
                    Hole {hole.holeNumber}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {hole.templateName}
                  </span>
                </div>
                {hole.description && !isExpanded && (
                  <p
                    className="text-xs mt-0.5 line-clamp-1"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    {hole.description}
                  </p>
                )}
              </div>

              <svg
                className={`h-4 w-4 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                style={{ color: "var(--cg-text-muted)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div
                className="px-4 pb-4 pt-0 space-y-3"
                style={{ borderTop: `1px solid ${colors.border}20` }}
              >
                {hole.description && (
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--cg-text-secondary)" }}
                  >
                    {hole.description}
                  </p>
                )}

                {hole.originalInspiration && (
                  <div
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor: "var(--cg-bg-primary)",
                      border: "1px solid var(--cg-border)",
                    }}
                  >
                    <p
                      className="text-[10px] font-medium uppercase tracking-wide mb-1"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      Original Inspiration
                    </p>
                    <p className="text-xs" style={{ color: "var(--cg-text-secondary)" }}>
                      {hole.originalInspiration}
                    </p>
                  </div>
                )}

                {hole.educationalNote && (
                  <div
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor: colors.bg,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <p
                      className="text-[10px] font-medium uppercase tracking-wide mb-1"
                      style={{ color: colors.text }}
                    >
                      Why This Design Matters
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--cg-text-secondary)" }}>
                      {hole.educationalNote}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
