"use client";

interface PageSizeToggleProps {
  pageSize: number;
  onChange: (size: number) => void;
  options?: number[];
}

export function PageSizeToggle({
  pageSize,
  onChange,
  options = [12, 24, 48],
}: PageSizeToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-xs"
        style={{ color: "var(--cg-text-muted)" }}
      >
        Per page:
      </span>
      {options.map((size) => (
        <button
          key={size}
          onClick={() => onChange(size)}
          className="rounded px-2.5 py-1 text-xs font-medium transition-colors"
          style={{
            backgroundColor:
              pageSize === size
                ? "var(--cg-accent-bg)"
                : "var(--cg-bg-tertiary)",
            color:
              pageSize === size ? "var(--cg-accent)" : "var(--cg-text-muted)",
            border: `1px solid ${
              pageSize === size ? "var(--cg-accent)" : "var(--cg-border)"
            }`,
          }}
        >
          {size}
        </button>
      ))}
    </div>
  );
}
