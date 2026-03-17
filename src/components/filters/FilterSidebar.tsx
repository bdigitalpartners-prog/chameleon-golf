"use client";

import { useState, useEffect, useRef } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import type { CourseFilters } from "@/types";

interface RankingList {
  listId: number;
  listName: string;
  prestigeTier: string;
  yearPublished: number;
  _count: { entries: number };
}

interface RankingSource {
  sourceId: number;
  sourceName: string;
  lists: RankingList[];
}

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
    <div className="py-4" style={{ borderBottom: "1px solid var(--cg-border)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-semibold"
        style={{ color: "var(--cg-text-primary)" }}
      >
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--cg-text-muted)" }} />
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  backgroundColor: "var(--cg-bg-tertiary)",
  border: "1px solid var(--cg-border)",
  color: "var(--cg-text-primary)",
};

const inputStyle = selectStyle;

interface ArchitectSuggestion {
  id: number;
  name: string;
  slug: string;
  courseCount: number;
}

export function FilterSidebar({ filters, onChange, filterOptions }: FilterSidebarProps) {
  const update = (partial: Partial<CourseFilters>) => onChange({ ...filters, ...partial, page: 1 });

  const [rankingSources, setRankingSources] = useState<RankingSource[]>([]);
  const [architectInput, setArchitectInput] = useState(filters.architect || "");
  const [architectSuggestions, setArchitectSuggestions] = useState<ArchitectSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/rankings")
      .then((r) => r.json())
      .then((data: RankingSource[]) => setRankingSources(data))
      .catch(() => {});
  }, []);

  // Architect autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!architectInput || architectInput.length < 2) {
      setArchitectSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetch(`/api/architects?suggest=true&search=${encodeURIComponent(architectInput)}&limit=10`)
        .then((r) => r.json())
        .then((data: ArchitectSuggestion[]) => {
          setArchitectSuggestions(data);
          setShowSuggestions(true);
        })
        .catch(() => {});
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [architectInput]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <aside
      className="w-full rounded-xl p-5"
      style={{
        backgroundColor: "var(--cg-bg-card)",
        border: "1px solid var(--cg-border)",
      }}
    >
      <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid var(--cg-border)" }}>
        <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--cg-text-primary)" }}>
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </div>
        <button
          onClick={() => onChange({ page: 1, limit: filters.limit ?? 24, sortBy: "gd100", sortDir: "asc" })}
          className="text-xs font-medium"
          style={{ color: "var(--cg-accent)" }}
        >
          Reset All
        </button>
      </div>

      <FilterSection title="Country">
        <select
          value={filters.country ?? ""}
          onChange={(e) => update({ country: e.target.value || undefined, state: undefined })}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={selectStyle}
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
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={selectStyle}
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
              className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: filters.courseStyle === s ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
                color: filters.courseStyle === s ? "var(--cg-text-inverse)" : "var(--cg-text-secondary)",
                border: `1px solid ${filters.courseStyle === s ? "var(--cg-accent)" : "var(--cg-border)"}`,
              }}
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
              className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: filters.accessType === a ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
                color: filters.accessType === a ? "var(--cg-text-inverse)" : "var(--cg-text-secondary)",
                border: `1px solid ${filters.accessType === a ? "var(--cg-accent)" : "var(--cg-border)"}`,
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Ranking List */}
      <FilterSection title="Ranking List" defaultOpen={false}>
        <select
          value={filters.listId ?? ""}
          onChange={(e) => update({ listId: e.target.value ? parseInt(e.target.value) : undefined })}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={selectStyle}
        >
          <option value="">All Lists</option>
          {rankingSources.map((source) => (
            <optgroup key={source.sourceId} label={source.sourceName}>
              {source.lists.map((list) => (
                <option key={list.listId} value={list.listId}>
                  {list.listName} ({list._count.entries})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </FilterSection>

      {/* Walking Policy */}
      <FilterSection title="Walking Policy" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {["Walking Only", "Walking Allowed", "Cart Required"].map((policy) => (
            <button
              key={policy}
              onClick={() => update({ walkingPolicy: filters.walkingPolicy === policy ? undefined : policy })}
              className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: filters.walkingPolicy === policy ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
                color: filters.walkingPolicy === policy ? "var(--cg-text-inverse)" : "var(--cg-text-secondary)",
                border: `1px solid ${filters.walkingPolicy === policy ? "var(--cg-accent)" : "var(--cg-border)"}`,
              }}
            >
              {policy}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Architect */}
      <FilterSection title="Architect" defaultOpen={false}>
        <div className="relative" ref={suggestionsRef}>
          <input
            type="text"
            placeholder="e.g. Pete Dye, Alister MacKenzie"
            value={architectInput}
            onChange={(e) => {
              setArchitectInput(e.target.value);
              if (!e.target.value) update({ architect: undefined });
            }}
            onFocus={() => architectSuggestions.length > 0 && setShowSuggestions(true)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
          {showSuggestions && architectSuggestions.length > 0 && (
            <div
              className="absolute z-20 mt-1 w-full rounded-lg overflow-hidden shadow-lg"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
            >
              {architectSuggestions.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setArchitectInput(a.name);
                    setShowSuggestions(false);
                    update({ architect: a.name });
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 flex items-center justify-between"
                  style={{ color: "var(--cg-text-primary)" }}
                >
                  <span>{a.name}</span>
                  <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                    {a.courseCount} {a.courseCount === 1 ? "course" : "courses"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </FilterSection>

      {/* Year Range */}
      <FilterSection title="Year Opened" defaultOpen={false}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="From"
            value={filters.yearMin ?? ""}
            onChange={(e) => update({ yearMin: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
          <span style={{ color: "var(--cg-text-muted)" }}>—</span>
          <input
            type="number"
            placeholder="To"
            value={filters.yearMax ?? ""}
            onChange={(e) => update({ yearMax: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>
      </FilterSection>

      <FilterSection title="Green Fee Range" defaultOpen={false}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.feeMin ?? ""}
            onChange={(e) => update({ feeMin: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
          <span style={{ color: "var(--cg-text-muted)" }}>—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.feeMax ?? ""}
            onChange={(e) => update({ feeMax: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>
      </FilterSection>

      <FilterSection title="Sort By">
        <select
          value={`${filters.sortBy ?? "gd100"}-${filters.sortDir ?? "asc"}`}
          onChange={(e) => {
            const [sortBy, sortDir] = e.target.value.split("-") as [CourseFilters["sortBy"], CourseFilters["sortDir"]];
            update({ sortBy, sortDir });
          }}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={selectStyle}
        >
          <option value="gd100-asc">Golf Digest Top 100</option>
          <option value="chameleon-desc">CF Score (High to Low)</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="rank-desc">Most Ranked</option>
          <option value="fee-asc">Green Fee (Low to High)</option>
          <option value="fee-desc">Green Fee (High to Low)</option>
          <option value="architect-asc">Architect A-Z</option>
          <option value="architect-desc">Architect Z-A</option>
        </select>
      </FilterSection>
    </aside>
  );
}
