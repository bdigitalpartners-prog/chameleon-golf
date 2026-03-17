"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MapPin,
  Filter,
  X,
  ChevronRight,
  Loader2,
  List,
} from "lucide-react";
import CourseMap from "@/components/map";
import type { CourseMapItem } from "@/components/map";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const PRESET_QUERIES = [
  { key: "all", label: "All Courses" },
  { key: "top100", label: "Top 100" },
  { key: "top50", label: "Top 50" },
  { key: "bucket-list", label: "Bucket List" },
  { key: "hidden-gems", label: "Hidden Gems" },
];

const ACCESS_TYPES = [
  "Open to Public",
  "Member Only",
  "Resort Guest",
  "Semi-Private",
  "Reciprocal",
];

interface Filters {
  query: string;
  state: string;
  access: string[];
  priceMax: string;
  architect: string;
  search: string;
}

function filtersToParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.query && f.query !== "all") p.set("query", f.query);
  if (f.state) p.set("state", f.state);
  if (f.access.length > 0) p.set("access", f.access.join(","));
  if (f.priceMax) p.set("priceMax", f.priceMax);
  if (f.architect) p.set("architect", f.architect);
  if (f.search) p.set("search", f.search);
  return p;
}

function paramsToFilters(sp: URLSearchParams): Filters {
  return {
    query: sp.get("query") || "all",
    state: sp.get("state") || "",
    access: sp.get("access") ? sp.get("access")!.split(",") : [],
    priceMax: sp.get("priceMax") || "",
    architect: sp.get("architect") || "",
    search: sp.get("search") || "",
  };
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            height: "calc(100vh - 64px)",
            background: "var(--cg-bg-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader2
            className="h-8 w-8 animate-spin"
            style={{ color: "var(--cg-accent)" }}
          />
        </div>
      }
    >
      <MapPageInner />
    </Suspense>
  );
}

function MapPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() =>
    paramsToFilters(searchParams)
  );
  const [courses, setCourses] = useState<CourseMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [listOpen, setListOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchCourses = useCallback(async (f: Filters) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const apiParams = new URLSearchParams();
      apiParams.set("query", f.query || "all");
      if (f.state) apiParams.set("state", f.state);
      // Only send the first access filter via the API (single-value param)
      if (f.access.length === 1) apiParams.set("access", f.access[0]);
      if (f.priceMax) apiParams.set("priceMax", f.priceMax);
      if (f.architect) apiParams.set("architect", f.architect);
      if (f.search) apiParams.set("search", f.search);
      apiParams.set("limit", "1500");

      const res = await fetch(`/api/courses/map?${apiParams}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      let items: CourseMapItem[] = data.items || [];

      // Client-side filter for multiple access types
      if (f.access.length > 1) {
        items = items.filter(
          (c) => c.accessType && f.access.includes(c.accessType)
        );
      }

      setCourses(items);
    } catch (err: any) {
      if (err.name !== "AbortError") console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount, read filters from the actual browser URL (useSearchParams may
  // be empty during initial hydration in a Suspense boundary).
  const didInitialFetch = useRef(false);
  useEffect(() => {
    if (didInitialFetch.current) return;
    didInitialFetch.current = true;
    const sp =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : searchParams;
    const initF = paramsToFilters(sp);
    setFilters(initF);
    fetchCourses(initF);
  }, [fetchCourses, searchParams]);

  // Sync URL → state on subsequent param changes
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const newF = paramsToFilters(searchParams);
    setFilters(newF);
    fetchCourses(newF);
  }, [searchParams, fetchCourses]);

  const applyFilters = (newFilters: Filters) => {
    setFilters(newFilters);
    const p = filtersToParams(newFilters);
    const qs = p.toString();
    router.replace(qs ? `/map?${qs}` : "/map", { scroll: false });
  };

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    applyFilters({ ...filters, [key]: value });
  };

  const toggleAccess = (type: string) => {
    const next = filters.access.includes(type)
      ? filters.access.filter((a) => a !== type)
      : [...filters.access, type];
    updateFilter("access", next);
  };

  const clearFilters = () => {
    applyFilters({
      query: "all",
      state: "",
      access: [],
      priceMax: "",
      architect: "",
      search: "",
    });
  };

  const hasActiveFilters =
    filters.query !== "all" ||
    filters.state ||
    filters.access.length > 0 ||
    filters.priceMax ||
    filters.architect ||
    filters.search;

  return (
    <div
      className="flex"
      style={{
        height: "calc(100vh - 64px)",
        background: "var(--cg-bg-primary)",
      }}
    >
      {/* Filter Sidebar */}
      {sidebarOpen && (
        <div
          className="flex flex-col overflow-y-auto shrink-0"
          style={{
            width: "300px",
            background: "var(--cg-bg-secondary)",
            borderRight: "1px solid var(--cg-border)",
          }}
        >
          {/* Sidebar Header */}
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: "1px solid var(--cg-border)" }}
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" style={{ color: "var(--cg-accent)" }} />
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--cg-text-primary)" }}
              >
                Filters
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs px-2 py-1 rounded"
                  style={{ color: "var(--cg-accent)" }}
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded"
                style={{ color: "var(--cg-text-muted)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-5">
            {/* Search */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                placeholder="Course name…"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: "var(--cg-bg-tertiary)",
                  border: "1px solid var(--cg-border)",
                  color: "var(--cg-text-primary)",
                }}
              />
            </div>

            {/* Preset Queries */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                Preset
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_QUERIES.map((pq) => (
                  <button
                    key={pq.key}
                    onClick={() => updateFilter("query", pq.key)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={{
                      background:
                        filters.query === pq.key
                          ? "var(--cg-accent)"
                          : "var(--cg-bg-tertiary)",
                      color:
                        filters.query === pq.key
                          ? "var(--cg-text-inverse)"
                          : "var(--cg-text-secondary)",
                      border: `1px solid ${filters.query === pq.key ? "var(--cg-accent)" : "var(--cg-border)"}`,
                    }}
                  >
                    {pq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* State */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                State
              </label>
              <select
                value={filters.state}
                onChange={(e) => updateFilter("state", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: "var(--cg-bg-tertiary)",
                  border: "1px solid var(--cg-border)",
                  color: "var(--cg-text-primary)",
                }}
              >
                <option value="">All States</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Access Type */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                Access Type
              </label>
              <div className="space-y-1.5">
                {ACCESS_TYPES.map((at) => (
                  <label
                    key={at}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.access.includes(at)}
                      onChange={() => toggleAccess(at)}
                      className="rounded"
                      style={{ accentColor: "var(--cg-accent)" }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: "var(--cg-text-secondary)" }}
                    >
                      {at}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                Max Green Fee
              </label>
              <select
                value={filters.priceMax}
                onChange={(e) => updateFilter("priceMax", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: "var(--cg-bg-tertiary)",
                  border: "1px solid var(--cg-border)",
                  color: "var(--cg-text-primary)",
                }}
              >
                <option value="">Any Price</option>
                <option value="50">Under $50</option>
                <option value="100">Under $100</option>
                <option value="200">Under $200</option>
                <option value="300">Under $300</option>
                <option value="500">Under $500</option>
              </select>
            </div>

            {/* Architect */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                Architect
              </label>
              <input
                type="text"
                value={filters.architect}
                onChange={(e) => updateFilter("architect", e.target.value)}
                placeholder="e.g. Pete Dye"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: "var(--cg-bg-tertiary)",
                  border: "1px solid var(--cg-border)",
                  color: "var(--cg-text-primary)",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Bar */}
        <div
          className="flex items-center justify-between px-4 py-2 shrink-0"
          style={{
            background: "var(--cg-bg-secondary)",
            borderBottom: "1px solid var(--cg-border)",
          }}
        >
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: "var(--cg-bg-tertiary)",
                  border: "1px solid var(--cg-border)",
                  color: "var(--cg-text-secondary)",
                }}
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <MapPin
                className="h-4 w-4"
                style={{ color: "var(--cg-accent)" }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: "var(--cg-text-primary)" }}
              >
                {loading ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading…
                  </span>
                ) : (
                  `${courses.length.toLocaleString()} courses`
                )}
              </span>
            </div>
          </div>

          <button
            onClick={() => setListOpen(!listOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: listOpen
                ? "var(--cg-accent)"
                : "var(--cg-bg-tertiary)",
              color: listOpen
                ? "var(--cg-text-inverse)"
                : "var(--cg-text-secondary)",
              border: `1px solid ${listOpen ? "var(--cg-accent)" : "var(--cg-border)"}`,
            }}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
        </div>

        {/* Map + List */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative">
            <CourseMap
              courses={courses}
              height="100%"
              clusterMarkers
              colorBy="accessType"
              selectedCourseId={selectedCourseId}
            />
          </div>

          {/* Course List Panel */}
          {listOpen && (
            <div
              className="overflow-y-auto shrink-0"
              style={{
                width: "320px",
                background: "var(--cg-bg-secondary)",
                borderLeft: "1px solid var(--cg-border)",
              }}
            >
              <div
                className="p-3 text-xs font-medium"
                style={{
                  color: "var(--cg-text-muted)",
                  borderBottom: "1px solid var(--cg-border)",
                }}
              >
                {courses.length.toLocaleString()} results
              </div>
              {courses.map((c) => (
                <a
                  key={c.courseId}
                  href={`/course/${c.courseId}`}
                  className="block px-3 py-3 transition-colors"
                  style={{
                    borderBottom: "1px solid var(--cg-border-subtle)",
                    background:
                      selectedCourseId === c.courseId
                        ? "var(--cg-accent-bg)"
                        : "transparent",
                  }}
                  onMouseEnter={() => setSelectedCourseId(c.courseId)}
                  onMouseLeave={() => setSelectedCourseId(null)}
                >
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--cg-text-primary)" }}
                  >
                    {c.courseName}
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    {[c.city, c.state].filter(Boolean).join(", ")}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {c.accessType && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "var(--cg-bg-tertiary)",
                          color: "var(--cg-text-secondary)",
                        }}
                      >
                        {c.accessType}
                      </span>
                    )}
                    {c.greenFeeHigh != null && (
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--cg-text-muted)" }}
                      >
                        ${c.greenFeeHigh}
                      </span>
                    )}
                    <ChevronRight
                      className="h-3 w-3 ml-auto"
                      style={{ color: "var(--cg-text-muted)" }}
                    />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
