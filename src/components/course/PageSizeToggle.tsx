"use client";

export type PageSize = 25 | 50 | 100 | "all";

const OPTIONS: { label: string; value: PageSize }[] = [
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "All", value: "all" },
];

export function PageSizeToggle({
  size,
  onChange,
}: {
  size: PageSize;
  onChange: (s: PageSize) => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--cg-border)" }}
    >
      <span
        className="px-2.5 py-2 text-xs font-medium"
        style={{ color: "var(--cg-text-muted)" }}
      >
        Show
      </span>
      {OPTIONS.map((opt, i) => (
        <button
          key={opt.label}
          onClick={() => onChange(opt.value)}
          className="px-3 py-2 text-xs font-medium transition-colors"
          style={{
            backgroundColor:
              size === opt.value ? "var(--cg-accent-bg)" : "transparent",
            color:
              size === opt.value ? "var(--cg-accent)" : "var(--cg-text-muted)",
            borderLeft: "1px solid var(--cg-border)",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
