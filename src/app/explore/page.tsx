"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo } from "react";
import { CourseCard } from "@/components/course/CourseCard";
import { CourseListRow } from "@/components/course/CourseListRow";
import { CourseListHeader } from "@/components/course/CourseListHeader";
import { ViewToggle, ViewMode } from "@/components/course/ViewToggle";
import CourseMap from "@/components/map";
import type { CourseMapItem } from "@/components/map";
import { PageSizeToggle, PageSize } from "@/components/course/PageSizeToggle";
import { FilterSidebar } from "@/components/filters/FilterSidebar";
import { WeightSliders } from "@/components/filters/WeightSliders";
import { CompareDrawer } from "@/components/course/CompareDrawer";
import { useCourses } from "@/hooks/useCourses";
import { ChevronLeft, ChevronRight, Loader2, PanelRightClose, PanelRightOpen } from "lucide-react";
import type { CourseFilters, WeightSliderValues } from "@/types";

export default function ExplorePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [pageSize, setPageSize] = useState<PageSize>(50);
  const [activeWeights, setActiveWeights] = useState<WeightSliderValues | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setFilters] = useState<CourseFilters>({
    page: 1,
    limit: 50,
    sortBy: "gd100",
    sortDir: "asc",
  });

  const { data, isLoading, error } = useCourses(filters);

  const [filterOptions, setFilterOptions] = useState({
    countries: [] as string[],
    states: [] as string[],
    styles: [] as string[],
    accessTypes: [] as string[],
  });

  useEffect(() => {
    setFilterOptions({
      countries: ["United States", "United Kingdom", "Ireland", "Scotland", "Canada", "Australia", "New Zealand", "Japan", "South Korea", "France", "Spain", "Italy", "Germany", "South Africa", "Mexico"],
      states: ["California", "Florida", "New York", "Texas", "Arizona", "North Carolina", "South Carolina", "Georgia", "Oregon", "Michigan", "Hawaii", "New Jersey", "Pennsylvania", "Colorado", "Virginia", "Wisconsin", "Massachusetts", "Ohio", "Illinois", "Nevada"],
      styles: ["Links", "Parkland", "Desert", "Mountain", "Heathland", "Moorland", "Clifftop", "Woodland", "Tropical"],
      accessTypes: ["Member Only", "Open to Public", "Resort Guest", "Reciprocal"],
    });
  }, []);

  // Persist view + page-size + sidebar preferences
  useEffect(() => {
    try {
      const savedView = localStorage.getItem("cg-view-mode");
      if (savedView === "list" || savedView === "grid") setViewMode(savedView);
      const savedSize = localStorage.getItem("cg-page-size");
      if (savedSize) {
        const parsed = savedSize === "all" ? "all" as PageSize : parseInt(savedSize) as PageSize;
        if (parsed === "all" || parsed === 25 || parsed === 50 || parsed === 100) {
          setPageSize(parsed);
          setFilters((f) => ({ ...f, limit: parsed === "all" ? 2000 : parsed, page: 1 }));
        }
      }
      const savedSidebar = localStorage.getItem("cg-sidebar-open");
      if (savedSidebar !== null) setSidebarOpen(savedSidebar === "true");
    } catch {}
  }, []);

  const handleViewChange = (m: ViewMode) => {
    setViewMode(m);
    try { localStorage.setItem("cg-view-mode", m); } catch {}
  };

  const handlePageSizeChange = (s: PageSize) => {
    setPageSize(s);
    const numericLimit = s === "all" ? 2000 : s;
    setFilters((f) => ({ ...f, limit: numericLimit, page: 1 }));
    try { localStorage.setItem("cg-page-size", String(s)); } catch {}
  };

  const toggleSidebar = () => {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    try { localStorage.setItem("cg-sidebar-open", String(next)); } catch {}
  };

  const handleWeightsChange = useCallback((weights: WeightSliderValues | null) => {
    setActiveWeights(weights);
    setFilters((prev) => {
      const next = { ...prev, page: 1 };
      if (weights) {
        // Apply weights and switch sort to weighted
        return {
          ...next,
          sortBy: "weighted" as CourseFilters["sortBy"],
          w_expert: weights.w_expert,
          w_conditioning: weights.w_conditioning,
          w_layout: weights.w_layout,
          w_aesthetics: weights.w_aesthetics,
          w_challenge: weights.w_challenge,
          w_value: weights.w_value,
          w_walkability: weights.w_walkability,
          w_pace: weights.w_pace,
          w_amenities: weights.w_amenities,
          w_service: weights.w_service,
        };
      } else {
        // Clear weights
        const { w_expert, w_conditioning, w_layout, w_aesthetics, w_challenge, w_value, w_walkability, w_pace, w_amenities, w_service, ...rest } = next;
        return { ...rest, sortBy: "gd100" as CourseFilters["sortBy"], sortDir: "asc" as CourseFilters["sortDir"] };
      }
    });
  }, []);

  const showWeightedScore = activeWeights !== null;
  // Map-ready course data
  const mapCourses = useMemo<CourseMapItem[]>(() => {
    if (!data?.items) return [];
    return data.items
      .filter((c: any) => c.latitude && c.longitude)
      .map((c: any) => ({
        courseId: c.courseId,
        courseName: c.courseName,
        facilityName: c.facilityName || null,
        latitude: parseFloat(c.latitude),
        longitude: parseFloat(c.longitude),
        city: c.city || null,
        state: c.state || null,
        courseType: c.courseType || null,
        accessType: c.accessType || null,
        priceTier: c.priceTier || null,
        greenFeeHigh: c.greenFeeHigh ? parseFloat(c.greenFeeHigh) : null,
        numListsAppeared: c.numListsAppeared || null,
        originalArchitect: c.originalArchitect || null,
        par: c.par || null,
        numHoles: c.numHoles || null,
        overallScore: c.overallScore || c.chameleonScore || null,
      }));
  }, [data?.items]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--cg-bg-primary)" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 pb-24">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="font-display text-3xl font-bold md:text-4xl"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Explore Courses
            </h1>
            <p
              className="mt-2 text-base"
              style={{ color: "var(--cg-text-secondary)" }}
            >
              {data?.total ? `${data.total.toLocaleString()} courses` : "Loading..."} ranked across 4 sources.
              {showWeightedScore && (
                <span
                  className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: "var(--cg-accent-bg)",
                    color: "var(--cg-accent)",
                  }}
                >
                  Custom ranking active
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <PageSizeToggle size={pageSize} onChange={handlePageSizeChange} />
            <ViewToggle mode={viewMode} onChange={handleViewChange} showMap />
            <button
              onClick={toggleSidebar}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: sidebarOpen ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
                color: sidebarOpen ? "var(--cg-text-inverse)" : "var(--cg-text-secondary)",
                border: `1px solid ${sidebarOpen ? "var(--cg-accent)" : "var(--cg-border)"}`,
              }}
              title={sidebarOpen ? "Hide filters" : "Show filters"}
            >
              {sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Results */}
          <div className="flex-1 min-w-0">
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
              </div>
            )}

            {error && (
              <div
                className="rounded-xl p-6 text-center"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "var(--cg-error)",
                }}
              >
                Failed to load courses. Please try again.
              </div>
            )}

            {data && !isLoading && (
              <>
                {/* Grid View */}
                {viewMode === "grid" && (
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {data.items.map((course) => (
                      <CourseCard
                        key={course.courseId}
                        course={course}
                        showWeightedScore={showWeightedScore}
                      />
                    ))}
                  </div>
                )}

                {/* List View */}
                {viewMode === "list" && (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{
                      backgroundColor: "var(--cg-bg-card)",
                      border: "1px solid var(--cg-border)",
                    }}
                  >
                    <CourseListHeader showRank />
                    {data.items.map((course, i) => (
                      <CourseListRow
                        key={course.courseId}
                        course={course}
                        rank={(data.page - 1) * data.limit + i + 1}
                      />
                    ))}
                  </div>
                )}

                {/* Map View */}
                {viewMode === "map" && (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{
                      border: "1px solid var(--cg-border)",
                    }}
                  >
                    {mapCourses.length > 0 ? (
                      <CourseMap
                        courses={mapCourses}
                        height="calc(100vh - 220px)"
                        clusterMarkers={true}
                        colorBy="accessType"
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center py-20"
                        style={{ color: "var(--cg-text-muted)" }}
                      >
                        No courses with location data match your filters.
                      </div>
                    )}
                  </div>
                )}

                {data.items.length === 0 && viewMode !== "map" && (
                  <div
                    className="py-20 text-center"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    No courses match your filters. Try adjusting or resetting them.
                  </div>
                )}

                {/* Pagination */}
                {data.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                      disabled={data.page <= 1}
                      onClick={() => setFilters({ ...filters, page: data.page - 1 })}
                      className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      style={{
                        border: "1px solid var(--cg-border)",
                        color: "var(--cg-text-secondary)",
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </button>
                    <span className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                      Page {data.page} of {data.totalPages}
                      <span className="ml-2 opacity-60">
                        ({data.total.toLocaleString()} courses)
                      </span>
                    </span>
                    <button
                      disabled={data.page >= data.totalPages}
                      onClick={() => setFilters({ ...filters, page: data.page + 1 })}
                      className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      style={{
                        border: "1px solid var(--cg-border)",
                        color: "var(--cg-text-secondary)",
                      }}
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar – right side, collapsible */}
          <div
            className="flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              width: sidebarOpen ? undefined : "0px",
              opacity: sidebarOpen ? 1 : 0,
            }}
          >
            <div className="w-full lg:w-72">
              <WeightSliders onChange={handleWeightsChange} />
              <FilterSidebar filters={filters} onChange={setFilters} filterOptions={filterOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Compare Drawer */}
      <CompareDrawer />
    </div>
  );
}
