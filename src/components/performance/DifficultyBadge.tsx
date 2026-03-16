"use client";

const config: Record<string, { bg: string; text: string; label: string }> = {
  beginner: { bg: "rgba(34,197,94,0.15)", text: "#22c55e", label: "Beginner" },
  intermediate: { bg: "rgba(234,179,8,0.15)", text: "#eab308", label: "Intermediate" },
  advanced: { bg: "rgba(239,68,68,0.15)", text: "#ef4444", label: "Advanced" },
};

export function DifficultyBadge({ difficulty }: { difficulty: string | null }) {
  if (!difficulty || !config[difficulty]) return null;
  const c = config[difficulty];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}
