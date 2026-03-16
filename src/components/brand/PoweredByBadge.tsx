"use client";

type BadgeVariant = "ratings" | "intelligence" | "powered";

interface PoweredByBadgeProps {
  variant?: BadgeVariant;
  className?: string;
}

const labels: Record<BadgeVariant, string> = {
  ratings: "Ratings powered by",
  intelligence: "Course Intelligence by",
  powered: "powered by",
};

export function PoweredByBadge({ variant = "powered", className = "" }: PoweredByBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] tracking-wide ${className}`}
      style={{
        backgroundColor: "rgba(74, 222, 128, 0.08)",
        border: "1px solid rgba(74, 222, 128, 0.15)",
      }}
    >
      <span style={{ color: "var(--cg-text-muted)", fontWeight: 400 }}>{labels[variant]}</span>
      <span style={{ fontFamily: "Inter, sans-serif" }}>
        <span style={{ color: "var(--cg-text-primary)", fontWeight: 800, fontSize: "10px" }}>COURSE</span>
        <span style={{ color: "var(--cg-text-muted)", fontWeight: 300, fontSize: "10px" }}>factor.ai</span>
      </span>
    </span>
  );
}
