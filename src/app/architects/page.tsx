"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpDown,
  X,
  Compass,
} from "lucide-react";

interface Architect {
  id: number;
  name: string;
  slug: string;
  bornYear: number | null;
  diedYear: number | null;
  nationality: string | null;
  bio: string | null;
  era: string | null;
  notableFeatures: string[];
  courseCount: number;
}

interface ApiResponse {
  architects: Architect[];
  total: number;
  page: number;
  totalPages: number;
}

const ERAS = ["All", "Pioneer", "Golden Age", "Post-War", "Modern", "Contemporary"];
const NATIONALITIES = [
  "All",
  "American",
  "Scottish",
  "Scottish-American",
  "English",
  "Australian",
  "Canadian",
  "Irish",
  "South African",
];
const SORT_OPTIONS = [
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "courses-desc", label: "Most Courses" },
  { value: "era", label: "Era" },
];
const LIMIT = 30;

const ERA_ORDER: Record<string, number> = {
  Pioneer: 0,
  "Golden Age": 1,
  "Post-War": 2,
  Modern: 3,
  Contemporary: 4,
};

export default function ArchitectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedEra, setSelectedEra] = useState("All");
  const [selectedNationality, setSelectedNationality] = useState("All");
  const [sortBy, setSortBy] = useState("name-asc");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery]);

  // Fetch architects from API
  const fetchArchitects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (selectedEra !== "All") params.set("era", selectedEra);
      params.set("page", String(page));
      params.set("limit", String(LIMIT));

      const res = await fetch(`/api/architects?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch architects");
      const json: ApiResponse = await res.json();

      // Ensure notableFeatures is always an array
      json.architects = json.architects.map((a) => ({
        ...a,
        notableFeatures: Array.isArray(a.notableFeatures)
          ? (a.notableFeatures as string[])
          : [],
      }));

      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedEra, page]);

  useEffect(() => {
    fetchArchitects();
  }, [fetchArchitects]);

  // Client-side filtering and sorting (nationality + sort applied after fetch)
  const filteredArchitects = data?.architects
    ? (() => {
        let list = [...data.architects];

        // Filter by nationality (client-side since API doesn't support it)
        if (selectedNationality !== "All") {
          list = list.filter(
            (a) =>
              a.nationality &&
              a.nationality.toLowerCase().includes(selectedNationality.toLowerCase())
          );
        }

        // Sort
        switch (sortBy) {
          case "name-asc":
            list.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case "name-desc":
            list.sort((a, b) => b.name.localeCompare(a.name));
            break;
          case "courses-desc":
            list.sort((a, b) => b.courseCount - a.courseCount || a.name.localeCompare(b.name));
            break;
          case "era":
            list.sort(
              (a, b) =>
                (ERA_ORDER[a.era || ""] ?? 99) - (ERA_ORDER[b.era || ""] ?? 99) ||
                a.name.localeCompare(b.name)
            );
            break;
        }

        return list;
      })()
    : [];

  // Total count — use full total from API when no client-side nationality filter
  const displayTotal =
    selectedNationality === "All" ? (data?.total ?? 0) : filteredArchitects.length;

  const hasActiveFilters =
    debouncedSearch || selectedEra !== "All" || selectedNationality !== "All";

  const clearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedEra("All");
    setSelectedNationality("All");
    setSortBy("name-asc");
    setPage(1);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      <div className="mx-auto max-w-7xl px-4 py-8 pb-24">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Compass
              className="h-8 w-8"
              style={{ color: "var(--cg-accent)" }}
            />
            <h1
              className="font-display text-3xl font-bold md:text-4xl"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Golf Course Architects
            </h1>
          </div>
          <p
            className="text-base"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            Explore{" "}
            <span style={{ color: "var(--cg-accent)", fontWeight: 600 }}>
              {data?.total ?? "..."}
            </span>{" "}
            architects spanning centuries of golf course design
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div
            className="relative flex items-center rounded-xl"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <Search
              className="absolute left-4 h-5 w-5"
              style={{ color: "var(--cg-text-muted)" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search architects by name..."
              className="w-full rounded-xl bg-transparent py-3.5 pl-12 pr-10 text-sm outline-none placeholder:opacity-50"
              style={{
                color: "var(--cg-text-primary)",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDebouncedSearch("");
                  setPage(1);
                }}
                className="absolute right-4 rounded-full p-0.5 transition-colors hover:opacity-80"
                style={{ color: "var(--cg-text-muted)" }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div
          className="mb-6 rounded-xl p-4"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
          }}
        >
          {/* Era Pills */}
          <div className="mb-4">
            <span
              className="mb-2 block text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--cg-text-muted)" }}
            >
              Era
            </span>
            <div className="flex flex-wrap gap-2">
              {ERAS.map((era) => {
                const isActive = selectedEra === era;
                return (
                  <button
                    key={era}
                    onClick={() => {
                      setSelectedEra(era);
                      setPage(1);
                    }}
                    className="rounded-full px-3.5 py-1.5 text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isActive
                        ? "var(--cg-accent)"
                        : "var(--cg-bg-tertiary)",
                      color: isActive
                        ? "var(--cg-text-inverse, #000)"
                        : "var(--cg-text-secondary)",
                      border: isActive
                        ? "1px solid var(--cg-accent)"
                        : "1px solid var(--cg-border)",
                    }}
                  >
                    {era === "All" ? "All Eras" : era}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nationality + Sort row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {/* Nationality */}
            <div className="flex-1">
              <span
                className="mb-2 block text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--cg-text-muted)" }}
              >
                <MapPin className="mr-1 inline h-3 w-3" />
                Nationality
              </span>
              <div className="flex flex-wrap gap-2">
                {NATIONALITIES.map((nat) => {
                  const isActive = selectedNationality === nat;
                  return (
                    <button
                      key={nat}
                      onClick={() => {
                        setSelectedNationality(nat);
                        setPage(1);
                      }}
                      className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                      style={{
                        backgroundColor: isActive
                          ? "var(--cg-accent)"
                          : "var(--cg-bg-tertiary)",
                        color: isActive
                          ? "var(--cg-text-inverse, #000)"
                          : "var(--cg-text-secondary)",
                        border: isActive
                          ? "1px solid var(--cg-accent)"
                          : "1px solid var(--cg-border)",
                      }}
                    >
                      {nat === "All" ? "All" : nat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort */}
            <div className="flex-shrink-0">
              <span
                className="mb-2 block text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--cg-text-muted)" }}
              >
                <ArrowUpDown className="mr-1 inline h-3 w-3" />
                Sort
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium outline-none cursor-pointer"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  color: "var(--cg-text-secondary)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count + Clear Filters */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" style={{ color: "var(--cg-text-muted)" }} />
            <span className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
              {isLoading ? (
                "Loading..."
              ) : (
                <>
                  Showing{" "}
                  <span style={{ color: "var(--cg-text-primary)", fontWeight: 600 }}>
                    {filteredArchitects.length}
                  </span>
                  {displayTotal > filteredArchitects.length && (
                    <>
                      {" "}
                      of{" "}
                      <span style={{ color: "var(--cg-text-primary)", fontWeight: 600 }}>
                        {displayTotal}
                      </span>
                    </>
                  )}{" "}
                  architects
                </>
              )}
            </span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: "var(--cg-accent-bg)",
                color: "var(--cg-accent)",
              }}
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2
              className="h-8 w-8 animate-spin"
              style={{ color: "var(--cg-accent)" }}
            />
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div
            className="rounded-xl p-6 text-center"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
            }}
          >
            {error}. Please try again.
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && !error && filteredArchitects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArchitects.map((architect) => (
              <Link
                key={architect.id}
                href={`/architects/${architect.slug}`}
                className="group rounded-xl p-5 transition-all duration-200"
                style={{
                  backgroundColor: "var(--cg-bg-card)",
                  border: "1px solid var(--cg-border)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.borderColor = "var(--cg-accent)";
                  e.currentTarget.style.boxShadow =
                    "0 0 20px rgba(34, 197, 94, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.borderColor = "var(--cg-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3
                      className="truncate font-semibold"
                      style={{ color: "var(--cg-text-primary)" }}
                    >
                      {architect.name}
                    </h3>
                    <div
                      className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      {architect.nationality && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {architect.nationality}
                        </span>
                      )}
                      {architect.bornYear && (
                        <span>
                          {architect.bornYear}
                          {architect.diedYear
                            ? `–${architect.diedYear}`
                            : "–present"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex flex-shrink-0 flex-col items-end gap-1.5">
                    {architect.era && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: "var(--cg-accent-bg)",
                          color: "var(--cg-accent)",
                        }}
                      >
                        {architect.era}
                      </span>
                    )}
                    {architect.courseCount > 0 && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: "var(--cg-accent)",
                          color: "var(--cg-text-inverse, #000)",
                        }}
                      >
                        {architect.courseCount}{" "}
                        {architect.courseCount === 1 ? "course" : "courses"}
                      </span>
                    )}
                  </div>
                </div>

                {architect.bio && (
                  <p
                    className="mt-3 text-xs leading-relaxed line-clamp-3"
                    style={{ color: "var(--cg-text-secondary)" }}
                  >
                    {architect.bio}
                  </p>
                )}

                {architect.notableFeatures.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {architect.notableFeatures.slice(0, 3).map((feature) => (
                      <span
                        key={feature}
                        className="rounded-full px-2 py-0.5 text-[10px]"
                        style={{
                          backgroundColor: "var(--cg-bg-secondary)",
                          color: "var(--cg-text-muted)",
                          border: "1px solid var(--cg-border)",
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredArchitects.length === 0 && (
          <div
            className="rounded-xl py-20 text-center"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <Search
              className="mx-auto mb-4 h-12 w-12"
              style={{ color: "var(--cg-text-muted)", opacity: 0.5 }}
            />
            <h3
              className="mb-2 text-lg font-semibold"
              style={{ color: "var(--cg-text-primary)" }}
            >
              No architects found
            </h3>
            <p
              className="mb-4 text-sm"
              style={{ color: "var(--cg-text-muted)" }}
            >
              Try adjusting your search or filters
            </p>
            <button
              onClick={clearFilters}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
              style={{
                backgroundColor: "var(--cg-accent)",
                color: "var(--cg-text-inverse, #000)",
              }}
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && data && data.totalPages > 1 && selectedNationality === "All" && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                border: "1px solid var(--cg-border)",
                color: "var(--cg-text-secondary)",
              }}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <span
              className="text-sm"
              style={{ color: "var(--cg-text-muted)" }}
            >
              Page {data.page} of {data.totalPages}
              <span className="ml-2 opacity-60">
                ({data.total.toLocaleString()} architects)
              </span>
            </span>
            <button
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                border: "1px solid var(--cg-border)",
                color: "var(--cg-text-secondary)",
              }}
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
