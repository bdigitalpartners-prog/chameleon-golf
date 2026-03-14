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
    // Fetch distinct filter values on mount
    fetch("/api/courses?limit=1")
      .then((r) => r.json())
      .catch(() => null);

    // We will derive filter options from initial data load or a separate endpoint
    // For V1, use hardcoded common values
    setFilterOptions({
      countries: ["United States", "United Kingdom", "Ireland", "Scotland", "Canada", "Australia", "New Zealand", "Japan", "South Korea", "France", "Spain", "Italy", "Germany", "South Africa", "Mexico"],
      states: ["California", "Florida", "New York", "Texas", "Arizona", "North Carolina", "South Carolina", "Georgia", "Oregon", "Michigan", "Hawaii", "New Jersey", "Pennsylvania", "Colorado", "Virginia", "Wisconsin", "Massachusetts", "Ohio", "Illinois", "Nevada"],
      styles: ["Links", "Parkland", "Desert", "Mountain", "Heathland", "Moorland", "Clifftop", "Woodland", "Tropical"],
      accessTypes: ["Member Only", "Open to Public", "Resort Guest", "Reciprocal"],
    });
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-stone-900 md:text-4xl">
          Explore the World&apos;s Best Golf Courses
        </h1>
        <p className="mt-2 text-lg text-stone-500">
          {data?.total ? `${data.total.toLocaleString()} courses` : "Loading courses..."} ranked across Golf Digest, Golfweek, GOLF.com & Top100GolfCourses.
          Adjust filters to find your perfect round.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <FilterSidebar filters={filters} onChange={setFilters} filterOptions={filterOptions} />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
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
                <div className="py-20 text-center text-stone-500">
                  No courses match your filters. Try adjusting or resetting them.
                </div>
              )}

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button
                    disabled={data.page <= 1}
                    onClick={() => setFilters({ ...filters, page: data.page - 1 })}
                    className="flex items-center gap-1 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>
                  <span className="text-sm text-stone-500">
                    Page {data.page} of {data.totalPages}
                  </span>
                  <button
                    disabled={data.page >= data.totalPages}
                    onClick={() => setFilters({ ...filters, page: data.page + 1 })}
                    className="flex items-center gap-1 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
  );
}
