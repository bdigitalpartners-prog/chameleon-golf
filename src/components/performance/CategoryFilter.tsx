"use client";

interface CategoryFilterProps {
  categories: { value: string; label: string }[];
  active: string;
  onSelect: (value: string) => void;
}

export function CategoryFilter({ categories, active, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(cat.value)}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
          style={{
            backgroundColor: active === cat.value ? "var(--cg-accent-bg)" : "var(--cg-bg-tertiary)",
            color: active === cat.value ? "var(--cg-accent)" : "var(--cg-text-secondary)",
            border: `1px solid ${active === cat.value ? "var(--cg-accent)" : "var(--cg-border)"}`,
          }}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
