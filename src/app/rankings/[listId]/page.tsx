"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Trophy,
  MapPin,
  Loader2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Minus,
  Image as ImageIcon,
} from "lucide-react";

interface ListCourse {
  entryId: number;
  rankPosition: number | null;
  rankTied: boolean;
  previousRank: number | null;
  rankChange: number | null;
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
}

interface ListData {
  listId: number;
  listName: string;
  listType: string | null;
  region: string | null;
  yearPublished: number;
  prestigeTier: string;
  url: string | null;
  source: {
    sourceId: number;
    sourceName: string;
    sourceUrl: string | null;
  };
  totalCourses: number;
  courses: ListCourse[];
}

const SOURCE_COLORS: Record<string, string> = {
  "Golf Digest": "#c41230",
  Golfweek: "#1e5aa8",
  "GOLF.com / GOLF Magazine": "#007a33",
  "Top100GolfCourses.com": "#ff8c00",
};

export default function ListDetailPage() {
  const params = useParams();
  const listId = params.listId as string;
  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/rankings/${listId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [listId]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--cg-bg-primary)" }}
      >
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: "var(--cg-accent)" }}
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--cg-bg-primary)" }}
      >
        <div className="text-center">
          <p
            className="text-lg font-medium mb-4"
            style={{ color: "var(--cg-text-primary)" }}
          >
            List not found
          </p>
          <Link
            href="/rankings"
            className="text-sm font-medium"
            style={{ color: "var(--cg-accent)" }}
          >
            ← Back to all lists
          </Link>
        </div>
      </div>
    );
  }

  const sourceColor =
    SOURCE_COLORS[data.source.sourceName] ?? "var(--cg-accent)";

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--cg-bg-primary)" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/rankings"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors"
          style={{ color: "var(--cg-text-muted)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--cg-accent)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--cg-text-muted)")
          }
        >
          <ArrowLeft className="h-4 w-4" />
          All Ranking Lists
        </Link>

        {/* Header */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-8"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-5 w-5" style={{ color: sourceColor }} />
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded"
                  style={{
                    backgroundColor: sourceColor + "20",
                    color: sourceColor,
                  }}
                >
                  {data.source.sourceName}
                </span>
                {data.prestigeTier && (
                  <span
                    className="text-xs uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: "var(--cg-bg-tertiary)",
                      color: "var(--cg-text-muted)",
                    }}
                  >
                    {data.prestigeTier}
                  </span>
                )}
              </div>

              <h1
                className="font-display text-2xl font-bold sm:text-3xl"
                style={{ color: "var(--cg-text-primary)" }}
              >
                {data.listName}
              </h1>

              <div
                className="mt-2 flex flex-wrap gap-4 text-sm"
                style={{ color: "var(--cg-text-muted)" }}
              >
                <span>
                  <strong style={{ color: "var(--cg-accent)" }}>
                    {data.totalCourses}
                  </strong>{" "}
                  courses
                </span>
                {data.region && <span>{data.region}</span>}
                <span>{data.yearPublished}</span>
              </div>
            </div>

            {data.url && (
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium shrink-0 transition-colors"
                style={{
                  color: "var(--cg-accent)",
                  border: "1px solid var(--cg-accent-muted)",
                }}
              >
                Original Source <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Course list */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
          }}
        >
          {/* Table header */}
          <div
            className="hidden sm:grid items-center gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{
              gridTemplateColumns: "3.5rem 3rem 1fr 10rem 7rem 5rem",
              backgroundColor: "var(--cg-bg-tertiary)",
              color: "var(--cg-text-muted)",
              borderBottom: "1px solid var(--cg-border)",
            }}
          >
            <span>Rank</span>
            <span></span>
            <span>Course</span>
            <span>Location</span>
            <span>Style</span>
            <span>Fee</span>
          </div>

          {data.courses.map((course, i) => (
            <Link
              key={course.entryId}
              href={`/course/${course.courseId}`}
              className="group block transition-colors"
              style={{
                borderBottom:
                  i < data.courses.length - 1
                    ? "1px solid var(--cg-border-subtle)"
                    : "none",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "var(--cg-bg-card-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              {/* Desktop row */}
              <div
                className="hidden sm:grid items-center gap-3 px-4 py-3"
                style={{
                  gridTemplateColumns: "3.5rem 3rem 1fr 10rem 7rem 5rem",
                }}
              >
                {/* Rank */}
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-lg font-bold tabular-nums"
                    style={{ color: "var(--cg-text-primary)" }}
                  >
                    {course.rankPosition ?? "—"}
                  </span>
                  {course.rankChange != null && course.rankChange !== 0 && (
                    <span
                      className="flex items-center text-[10px] font-medium"
                      style={{
                        color:
                          course.rankChange > 0
                            ? "var(--cg-success)"
                            : "var(--cg-error)",
                      }}
                    >
                      {course.rankChange > 0 ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      {Math.abs(course.rankChange)}
                    </span>
                  )}
                </div>

                {/* Thumbnail */}
                <div
                  className="h-8 w-8 rounded overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                >
                  {course.primaryImageUrl ? (
                    <img
                      src={course.primaryImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageIcon
                        className="h-3.5 w-3.5"
                        style={{ color: "var(--cg-text-muted)" }}
                      />
                    </div>
                  )}
                </div>

                {/* Name + architect */}
                <div className="min-w-0">
                  <div
                    className="text-sm font-semibold truncate group-hover:underline"
                    style={{ color: "var(--cg-text-primary)" }}
                  >
                    {course.courseName}
                  </div>
                  {course.originalArchitect && (
                    <div
                      className="text-xs truncate"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      {course.originalArchitect}
                      {course.yearOpened ? ` · ${course.yearOpened}` : ""}
                    </div>
                  )}
                </div>

                {/* Location */}
                <div
                  className="text-xs truncate"
                  style={{ color: "var(--cg-text-secondary)" }}
                >
                  {[course.city, course.state, course.country]
                    .filter(Boolean)
                    .join(", ")}
                </div>

                {/* Style */}
                <div
                  className="text-xs"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  {course.courseStyle ?? "—"}
                </div>

                {/* Fee */}
                <div
                  className="text-xs tabular-nums"
                  style={{ color: "var(--cg-text-secondary)" }}
                >
                  {course.greenFeeLow ? `$${course.greenFeeLow}` : "—"}
                </div>
              </div>

              {/* Mobile row */}
              <div className="sm:hidden px-4 py-3 flex items-center gap-3">
                <span
                  className="text-lg font-bold tabular-nums w-8 text-center shrink-0"
                  style={{ color: "var(--cg-text-primary)" }}
                >
                  {course.rankPosition ?? "—"}
                </span>

                <div
                  className="h-10 w-10 rounded overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                >
                  {course.primaryImageUrl ? (
                    <img
                      src={course.primaryImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageIcon
                        className="h-4 w-4"
                        style={{ color: "var(--cg-text-muted)" }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--cg-text-primary)" }}
                  >
                    {course.courseName}
                  </div>
                  <div
                    className="text-xs truncate"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    {[course.city, course.state].filter(Boolean).join(", ")}
                    {course.greenFeeLow
                      ? ` · $${course.greenFeeLow}`
                      : ""}
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {data.courses.length === 0 && (
            <div
              className="py-16 text-center"
              style={{ color: "var(--cg-text-muted)" }}
            >
              No courses found for this list.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
