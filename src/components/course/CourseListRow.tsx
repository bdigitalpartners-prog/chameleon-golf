"use client";

import Link from "next/link";
import { MapPin, Trophy } from "lucide-react";
import type { CourseCard as CourseCardType } from "@/types";
import { formatCurrency } from "@/lib/utils";

export function CourseListRow({ course, rank }: { course: CourseCardType; rank?: number }) {
  return (
    <Link href={`/course/${course.courseId}`} className="group block">
      <div
        className="flex items-center gap-4 px-4 py-3 transition-colors rounded-lg"
        style={{
          borderBottom: "1px solid var(--cg-border-subtle)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--cg-bg-card-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        {/* Rank number */}
        {rank !== undefined && (
          <div
            className="w-8 text-center text-sm font-bold tabular-nums flex-shrink-0"
            style={{ color: "var(--cg-text-muted)" }}
          >
            {rank}
          </div>
        )}

        {/* Thumbnail */}
        <div
          className="h-10 w-14 rounded-md overflow-hidden flex-shrink-0"
          style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
        >
          {course.primaryImageUrl ? (
            <img
              src={course.primaryImageUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ display: course.primaryImageUrl ? "none" : "flex" }}
          >
            <Trophy className="h-4 w-4" style={{ color: "var(--cg-text-muted)" }} />
          </div>
        </div>

        {/* Name + Location */}
        <div className="min-w-0 flex-1">
          <div
            className="text-sm font-semibold truncate group-hover:underline"
            style={{ color: "var(--cg-text-primary)" }}
          >
            {course.courseName}
          </div>
          <div className="flex items-center gap-1 text-xs truncate" style={{ color: "var(--cg-text-muted)" }}>
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {[course.city, course.state, course.country].filter(Boolean).join(", ")}
          </div>
        </div>

        {/* Style */}
        <div className="hidden sm:block w-20 flex-shrink-0">
          {course.courseStyle && (
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
            >
              {course.courseStyle}
            </span>
          )}
        </div>

        {/* Access */}
        <div className="hidden md:block w-24 flex-shrink-0">
          {course.accessType && (
            <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
              {course.accessType}
            </span>
          )}
        </div>

        {/* Architect */}
        <div className="hidden lg:block w-40 flex-shrink-0 truncate">
          <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
            {course.originalArchitect
              ? course.originalArchitect.length > 30
                ? course.originalArchitect.slice(0, 30) + "..."
                : course.originalArchitect
              : "\u2014"}
          </span>
        </div>

        {/* Year */}
        <div className="hidden lg:block w-12 text-center flex-shrink-0">
          <span className="text-xs tabular-nums" style={{ color: "var(--cg-text-muted)" }}>
            {course.yearOpened ?? "\u2014"}
          </span>
        </div>

        {/* Fee */}
        <div className="hidden sm:block w-20 text-right flex-shrink-0">
          <span className="text-xs font-medium" style={{ color: "var(--cg-text-secondary)" }}>
            {course.greenFeeLow ? formatCurrency(course.greenFeeLow) : "\u2014"}
          </span>
        </div>

        {/* Best Ranking */}
        <div className="w-20 text-right flex-shrink-0">
          {course.bestRank && course.bestSource ? (
            <div className="text-right">
              <span className="text-xs font-bold" style={{ color: "var(--cg-accent)" }}>
                #{course.bestRank}
              </span>
              <div className="text-[10px] leading-tight" style={{ color: "var(--cg-text-muted)" }}>
                {course.bestSource.replace("Top100GolfCourses.com", "T100")}
              </div>
            </div>
          ) : (
            <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>\u2014</span>
          )}
        </div>

        {/* Lists count */}
        <div className="w-8 text-center flex-shrink-0">
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: course.numListsAppeared && course.numListsAppeared > 3 ? "var(--cg-accent)" : "var(--cg-text-muted)" }}
          >
            {course.numListsAppeared ?? 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
