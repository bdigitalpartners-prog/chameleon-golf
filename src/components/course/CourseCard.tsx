"use client";

import Link from "next/link";
import { MapPin, Trophy } from "lucide-react";
import type { CourseCard as CourseCardType } from "@/types";
import { formatCurrency } from "@/lib/utils";

function ScoreRing({ score }: { score: number | null }) {
  if (score === null)
    return (
      <div
        className="score-ring h-12 w-12 text-xs"
        style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-muted)" }}
      >
        NR
      </div>
    );
  const num = typeof score === "string" ? parseFloat(score) : score;
  const bg = num >= 80 ? "var(--cg-accent)" : num >= 50 ? "#eab308" : "var(--cg-bg-tertiary)";
  const fg = num >= 50 ? "var(--cg-text-inverse)" : "var(--cg-text-secondary)";
  return (
    <div className="score-ring h-12 w-12 text-sm" style={{ backgroundColor: bg, color: fg }}>
      {Math.round(num)}
    </div>
  );
}

export function CourseCard({ course }: { course: CourseCardType }) {
  return (
    <Link href={`/course/${course.courseId}`} className="group block">
      <div
        className="overflow-hidden rounded-xl transition-all"
        style={{
          backgroundColor: "var(--cg-bg-card)",
          border: "1px solid var(--cg-border)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--cg-bg-card-hover)";
          e.currentTarget.style.borderColor = "var(--cg-accent-muted)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--cg-bg-card)";
          e.currentTarget.style.borderColor = "var(--cg-border)";
        }}
      >
        <div className="relative aspect-[16/10]" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
          {course.primaryImageUrl ? (
            <img
              src={course.primaryImageUrl}
              alt={course.courseName}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center" style={{ color: "var(--cg-text-muted)" }}>
              <Trophy className="h-12 w-12" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <ScoreRing score={course.chameleonScore ? parseFloat(course.chameleonScore as any) : null} />
          </div>
          {course.accessType && (
            <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {course.accessType}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3
            className="font-display text-lg font-semibold leading-tight transition-colors"
            style={{ color: "var(--cg-text-primary)" }}
          >
            {course.courseName}
          </h3>
          {course.facilityName && course.facilityName !== course.courseName && (
            <p className="mt-0.5 text-sm" style={{ color: "var(--cg-text-muted)" }}>
              {course.facilityName}
            </p>
          )}
          <div className="mt-2 flex items-center gap-1.5 text-sm" style={{ color: "var(--cg-text-secondary)" }}>
            <MapPin className="h-3.5 w-3.5" />
            <span>{[course.city, course.state, course.country].filter(Boolean).join(", ")}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {course.courseStyle && (
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--cg-bg-tertiary)",
                    color: "var(--cg-text-secondary)",
                  }}
                >
                  {course.courseStyle}
                </span>
              )}
              {course.bestRank && course.bestSource && (
                <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                  #{course.bestRank} {course.bestSource}
                </span>
              )}
            </div>
            {(course.greenFeeLow || course.greenFeeHigh) && (
              <span className="text-sm font-medium" style={{ color: "var(--cg-text-secondary)" }}>
                {formatCurrency(course.greenFeeLow)}
                {course.greenFeeHigh && course.greenFeeLow !== course.greenFeeHigh
                  ? ` - ${formatCurrency(course.greenFeeHigh)}`
                  : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
