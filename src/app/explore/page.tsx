"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Globe,
  Trophy,
  Loader2,
  Filter,
} from "lucide-react";

interface Course {
  courseId: number;
  courseName: string;
  facilityName: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  courseStyle: string | null;
  accessType: string | null;
  originalArchitect: string | null;
  yearOpened: number | null;
  greenFeeLow: string | null;
  primaryImageUrl: string | null;
  rankingCount: number;
  bestRank: number | null;
}

interface Stats {
  totalCourses: number;
  totalRankings: number;
  totalLists: number;
  countries: number;
}

const ACCESS_TYPES = ["Public", "Private", "Resort", "Semi-Private"];
const STYLES = ["Links", "Parkland", "Desert", "Mountain", "Heathland"];
const SORT_OPTIONS = [
  { value: "rankings", label: "Most Ranked" },
  { value: "best_rank", label: "Best Rank" },
  { value: "year", label: "Newest" },
  { value: "name", label: "Name A–Z" },
];

export default function ExplorePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [accessFilter, setAccessFilter] = useState<string | null>(null);
  const [styleFilter, setStyleFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("rankings");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, accessFilter, styleFilter, sortBy, pageSize]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (accessFilter) params.set("access", accessFilter);
    if (styleFilter) params.set("style", styleFilter);
    params.set("sort", sortBy);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    fetch(`/api/courses?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCourses(data.courses ?? []);
        setTotalCount(data.total ?? 0);
        if (data.stats) setStats(data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [debouncedSearch, accessFilter, styleFilter, sortBy, page, pageSize]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--cg-bg-primary)" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1
            className="font-display text-3xl font-bold md:text-4xl mb-2"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Explore Courses
          </h1>
          <p
            className="text-base mb-6"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            Search and filter{" "}
            <span style={{ color: "var(--cg-accent)" }}>
              {stats?.totalCourses?.toLocaleString() ?? "…"}
            </span>{" "}
            courses ranked across{" "}
            <span style={{ color: "var(--cg-accent)" }}>
              {stats?.totalLists ?? "…"}
            </span>{" "}
            lists.
          </p>

          <div className="relative max-w-2xl">
            <Search
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--cg-text-muted)" }}
            />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by course name, architect, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1.5px solid var(--cg-border)",
                color: "var(--cg-text-primary)",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--cg-accent)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--cg-border)")
              }
            />
          </div>
        </div>

        {stats && (
          <div
            className="mb-6 flex flex-wrap gap-6 text-sm"
            style={{ color: "var(--cg-text-muted)" }}
          >
            <span>
              <strong style={{ color: "var(--cg-accent)" }}>
                {stats.totalCourses.toLocaleString()}
              </strong>{" "}
              Courses
            </span>
            <span>
              <strong style={{ color: "var(--cg-accent)" }}>
                {stats.totalRankings.toLocaleString()}
              </strong>{" "}
              Rankings
            </span>
            <span>
              <strong style={{ color: "var(--cg-accent)" }}>
                {stats.totalLists}
              </strong>{" "}
              Lists
            </span>
            <span>
              <strong style={{ color: "var(--cg-accent)" }}>
                {stats.countries}
              </strong>{" "}
              Countries
            </span>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: showFilters
                ? "var(--cg-accent-bg)"
                : "var(--cg-bg-card)",
              color: showFilters
                ? "var(--cg-accent)"
                : "var(--cg-text-secondary)",
              border: `1px solid ${
                showFilters ? "var(--cg-accent)" : "var(--cg-border)"
              }`,
            }}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {(accessFilter || styleFilter) && (
              <span
                className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: "var(--cg-accent)" }}
              >
                {(accessFilter ? 1 : 0) + (styleFilter ? 1 : 0)}
              </span>
            )}
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm font-medium outline-none cursor-pointer"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              border: "1px solid var(--cg-border)",
              color: "var(--cg-text-secondary)",
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {!loading && (
            <span
              className="text-sm ml-auto"
              style={{ color: "var(--cg-text-muted)" }}
            >
              {totalCount.toLocaleString()} courses
            </span>
          )}
        </div>

        {showFilters && (
          <div
            className="mb-6 rounded-xl p-4"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <div className="flex flex-wrap gap-6">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  Access
                </p>
                <div className="flex flex-wrap gap-2">
                  {ACCESS_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() =>
                        setAccessFilter(accessFilter === t ? null : t)
                      }
                      className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                      style={{
                        backgroundColor:
                          accessFilter === t
                            ? "var(--cg-accent-bg)"
                            : "var(--cg-bg-tertiary)",
                        color:
                          accessFilter === t
                            ? "var(--cg-accent)"
                            : "var(--cg-text-secondary)",
                        border: `1px solid ${
                          accessFilter === t
                            ? "var(--cg-accent)"
                            : "var(--cg-border)"
                        }`,
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  Style
                </p>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        setStyleFilter(styleFilter === s ? null : s)
                      }
                      className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                      style={{
                        backgroundColor:
                          styleFilter === s
                            ? "var(--cg-accent-bg)"
                            : "var(--cg-bg-tertiary)",
                        color:
                          styleFilter === s
                            ? "var(--cg-accent)"
                            : "var(--cg-text-secondary)",
                        border: `1px solid ${
                          styleFilter === s
                            ? "var(--cg-accent)"
                            : "var(--cg-border)"
                        }`,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {(accessFilter || styleFilter) && (
              <button
                onClick={() => {
                  setAccessFilter(null);
                  setStyleFilter(null);
                }}
                className="mt-3 text-xs font-medium"
                style={{ color: "var(--cg-accent)" }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Page size toggle */}
        <div className="mb-4 flex items-center justify-end gap-2">
          <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
            Per page:
          </span>
          {[12, 24, 48].map((size) => (
            <button
              key={size}
              onClick={() => setPageSize(size)}
              className="rounded px-2.5 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor:
                  pageSize === size
                    ? "var(--cg-accent-bg)"
                    : "var(--cg-bg-tertiary)",
                color:
                  pageSize === size
                    ? "var(--cg-accent)"
                    : "var(--cg-text-muted)",
                border: `1px solid ${
                  pageSize === size ? "var(--cg-accent)" : "var(--cg-border)"
                }`,
              }}
            >
              {size}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2
              className="h-8 w-8 animate-spin"
              style={{ color: "var(--cg-accent)" }}
            />
          </div>
        ) : courses.length === 0 ? (
          <div
            className="py-20 text-center"
            style={{ color: "var(--cg-text-muted)" }}
          >
            No courses found.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <Link
                key={course.courseId}
                href={`/course/${course.courseId}`}
                className="group rounded-xl overflow-hidden transition-all hover:-translate-y-0.5"
                style={{
                  backgroundColor: "var(--cg-bg-card)",
                  border: "1px solid var(--cg-border)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--cg-accent)";
                  e.currentTarget.style.backgroundColor =
                    "var(--cg-bg-card-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--cg-border)";
                  e.currentTarget.style.backgroundColor = "var(--cg-bg-card)";
                }}
              >
                <div
                  className="h-36 overflow-hidden"
                  style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                >
                  {course.primaryImageUrl ? (
                    <img
                      src={course.primaryImageUrl}
                      alt={course.courseName}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="h-full w-full flex items-center justify-center"
                      style={{ backgroundColor: "var(--cg-bg-secondary)" }}
                    >
                      <Globe
                        className="h-8 w-8"
                        style={{ color: "var(--cg-border)" }}
                      />
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <h3
                    className="text-sm font-semibold truncate mb-0.5"
                    style={{ color: "var(--cg-text-primary)" }}
                  >
                    {course.courseName}
                  </h3>

                  {course.facilityName &&
                    course.facilityName !== course.courseName && (
                      <p
                        className="text-xs truncate mb-1"
                        style={{ color: "var(--cg-text-muted)" }}
                      >
                        {course.facilityName}
                      </p>
                    )}

                  <div
                    className="flex items-center gap-1 text-xs mb-2"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {[course.city, course.state, course.country]
                        .filter(Boolean)
                        .join(", ") || "Unknown"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {course.rankingCount > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            backgroundColor: "var(--cg-accent-muted)",
                            color: "var(--cg-accent)",
                          }}
                        >
                          <Trophy className="h-2.5 w-2.5" />
                          {course.rankingCount === 1
                            ? "1 list"
                            : `${course.rankingCount} lists`}
                        </span>
                      )}
                      {course.bestRank && (
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: "var(--cg-text-muted)" }}
                        >
                          Best #{course.bestRank}
                        </span>
                      )}
                    </div>

                    {course.accessType && (
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: "var(--cg-bg-tertiary)",
                          color: "var(--cg-text-muted)",
                        }}
                      >
                        {course.accessType}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
                color: "var(--cg-text-secondary)",
              }}
            >
              Previous
            </button>

            <span
              className="text-sm px-4"
              style={{ color: "var(--cg-text-muted)" }}
            >
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
                color: "var(--cg-text-secondary)",
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
