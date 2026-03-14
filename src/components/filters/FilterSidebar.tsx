"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import type { CourseFilters } from "@/types";

interface FilterSidebarProps {
  filters: CourseFilters;
  onChange: (filters: CourseFilters) => void;
  filterOptions: {
    countries: string[];
    states: string[];
    styles: string[];
    accessTypes: string[];
  };
}

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-stone-200 py-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-sm font-semibold text-stone-800">
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

export function FilterSidebar({ filters, onChange, filterOptions }: FilterSidebarProps) {
  const update = (partial: Partial<CourseFilters>) => onChange({ ...filters, ...partial, page: 1 });

  return (
    <aside className="w-full rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </div>
        <button
          onClick={() => onChange({ page: 1, limit: 24, sortBy: "chameleon", sortDir: "desc" })}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
        >
          Reset All
        </button>
      </div>

      <FilterSection title="Country">
        <select
          value={filters.country ?? ""}
          onChange={(e) => update({ country: e.target.value || undefined, state: undefined })}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All Countries</option>
          {filterOptions.countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </FilterSection>

      {filters.country === "United States" && filterOptions.states.length > 0 && (
        <FilterSection title="State">
          <select
            value={filters.state ?? ""}
            onChange={(e) => update({ state: e.target.value || undefined })}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All States</option>
            {filterOptions.states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </FilterSection>
      )}

      <FilterSection title="Course Style">
        <div className="flex flex-wrap gap-2">
          {filterOptions.styles.map((s) => (
            <button
              key={s}
              onClick={() => update({ courseStyle: filters.courseStyle === s ? undefined : s })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filters.courseStyle === s
                  ? "bg-brand-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Access Type">
        <div className="flex flex-wrap gap-2">
          {filterOptions.accessTypes.map((a) => (
            <button
              key={a}
              onClick={() => update({ accessType: filters.accessType === a ? undefined : a })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filters.accessType === a
                  ? "bg-brand-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Green Fee Range" defaultOpen={false}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.feeMin ?? ""}
            onChange={(e) => update({ feeMin: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <span className="text-stone-400">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.feeMax ?? ""}
            onChange={(e) => update({ feeMax: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </FilterSection>

      <FilterSection title="Sort By">
        <select
          value={`${filters.sortBy ?? "chameleon"}-${filters.sortDir ?? "desc"}`}
          onChange={(e) => {
            const [sortBy, sortDir] = e.target.value.split("-") as [CourseFilters["sortBy"], CourseFilters["sortDir"]];
            update({ sortBy, sortDir });
          }}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        >
          <option value="chameleon-desc">Chameleon Score (High to Low)</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="rank-desc">Most Ranked</option>
          <option value="fee-asc">Green Fee (Low to High)</option>
          <option value="fee-desc">Green Fee (High to Low)</option>
        </select>
      </FilterSection>
    </aside>
  );
}
