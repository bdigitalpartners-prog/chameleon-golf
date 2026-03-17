"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface CourseItem {
  courseId: number;
  courseName: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  accessType?: string | null;
  yearOpened?: number | null;
  chameleonScores?: { chameleonScore: string } | null;
  media?: { url?: string | null }[];
}

type SortKey = "name" | "score" | "year";

export function ArchitectPortfolio({
  courses,
  architectName,
}: {
  courses: CourseItem[];
  architectName: string;
}) {
  const [sortBy, setSortBy] = useState<SortKey>("score");

  const sorted = useMemo(() => {
    const arr = [...courses];
    switch (sortBy) {
      case "name":
        return arr.sort((a, b) => a.courseName.localeCompare(b.courseName));
      case "year":
        return arr.sort(
          (a, b) => (b.yearOpened ?? 0) - (a.yearOpened ?? 0)
        );
      case "score":
      default:
        return arr.sort((a, b) => {
          const sa = a.chameleonScores
            ? parseFloat(a.chameleonScores.chameleonScore)
            : 0;
          const sb = b.chameleonScores
            ? parseFloat(b.chameleonScores.chameleonScore)
            : 0;
          return sb - sa;
        });
    }
  }, [courses, sortBy]);

  if (courses.length === 0) return null;

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--cg-bg-card)",
    border: "1px solid var(--cg-border)",
    borderRadius: "0.75rem",
    padding: "1.5rem",
  };

  return (
    <section style={cardStyle} className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--cg-text-primary)" }}
        >
          Courses in Our Database
          <span
            className="ml-2 text-sm font-normal"
            style={{ color: "var(--cg-text-muted)" }}
          >
            ({courses.length})
          </span>
        </h2>
        <div className="flex gap-1.5">
          {(
            [
              ["score", "EQ Score"],
              ["name", "A–Z"],
              ["year", "Year"],
            ] as [SortKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor:
                  sortBy === key
                    ? "var(--cg-accent)"
                    : "var(--cg-bg-secondary)",
                color:
                  sortBy === key ? "#000" : "var(--cg-text-secondary)",
                border: "1px solid var(--cg-border)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((course) => {
          const thumb = course.media?.[0]?.url;
          const score = course.chameleonScores
            ? parseFloat(course.chameleonScores.chameleonScore)
            : null;
          const location = [course.city, course.state, course.country]
            .filter(Boolean)
            .join(", ");

          return (
            <Link
              key={course.courseId}
              href={`/course/${course.courseId}`}
              className="group rounded-lg overflow-hidden transition-all hover:ring-1 hover:ring-emerald-500"
              style={{
                backgroundColor: "var(--cg-bg-secondary)",
                border: "1px solid var(--cg-border)",
              }}
            >
              {thumb && (
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={thumb}
                    alt={course.courseName}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  {score !== null && (
                    <div
                      className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.75)",
                        color: "var(--cg-accent)",
                      }}
                    >
                      {score.toFixed(1)}
                    </div>
                  )}
                </div>
              )}
              <div className="p-3">
                <div
                  className="text-sm font-medium truncate group-hover:text-emerald-400 transition-colors"
                  style={{ color: "var(--cg-text-primary)" }}
                >
                  {course.courseName}
                </div>
                {location && (
                  <div
                    className="text-xs mt-0.5 truncate"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    {location}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {course.accessType && (
                    <span
                      className="text-xs rounded-full px-2 py-0.5"
                      style={{
                        backgroundColor: "var(--cg-bg-primary)",
                        color: "var(--cg-text-muted)",
                        border: "1px solid var(--cg-border)",
                      }}
                    >
                      {course.accessType}
                    </span>
                  )}
                  {course.yearOpened && (
                    <span
                      className="text-xs"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      Est. {course.yearOpened}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
