"use client";

import { useState, useEffect } from "react";
import { CourseCard } from "@/components/course/CourseCard";
import { FilterSidebar } from "@/components/filters/FilterSidebar";
import { useCourses } from "@/hooks/useCourses";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { CourseFilters } from "@/types";

export default function ExplorePage() {
  const [filters, setFilters] = useState<CourseFilters>({
    page: 1,
    limit: 24,
    sortBy: "chameleon",
    sortDir: "desc",
  });

  const { data, isLoading, error } = useCourses(filters);

  const [filterOptions, setFilterOptions] = useState({
    countries: [] as string[],
    states: [] as string[],
    styles: [] as string[],
    accessTypes: [] as string[],
  });

  useEffect(() => {
    fetch("/api/courses?limit=1")
      .then((r) => r.json())
      .catch(() => null);

    setFilterOptions({
      countries: ["United States", "United Kingdom", "Ireland", "Scotland", "Canada", "Australia", "New Zealand", "Japan", "South Korea", "France", "Spain", "Italy", "Germany", "South Africa", "Mexico"],
      states: ["California", "Florida", "New York", "Texas", "Arizona", "North Carolina", "South Carolina", "Georgia", "Oregon", "Michigan", "Hawaii", "New Jersey", "Pennsylvania", "Colorado", "Virginia", "Wisconsin", "Massachusetts", "Ohio", "Illinois", "Nevada"],
      styles: ["Links", "Parkland", "Desert", "Mountain", "Heathland", "Moorland", "Clifftop", "Woodland", "Tropical"],
      accessTypes: ["Member Only", "Open to Public", "Resort Guest", "Reciprocal"],
    });
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--cg-bg-primary)" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1
            className="font-display text-3xl font-bold md:text-4xl"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Explore the World&apos;s Best Golf Courses
          </h1>
          <p
            className="mt-2 text-lg"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            {data?.total ? `${data.total.toLocaleString()} courses` : "Loading courses..."} ranked across Golf Digest, Golfweek, GOLF.com & Top100GolfCourses.
            Adjust filters to find your perfect round.
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="w-full lg:w-72 flex-shrink-0">
            <FilterSidebar filters={filters} onChange={setFilters} filterOptions={filterOptions} />
          </div>

          <div className="flex-1">
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
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {data.items.map((course) => (
                    <CourseCard key={course.courseId} course={course} />
                  ))}
                </div>

                {data.items.length === 0 && (
                  <div
                    className="py-20 text-center"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    No courses match your filters. Try adjusting or resetting them.
                  </div>
                )}

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
        </div>
      </div>
    </div>
  );
}
