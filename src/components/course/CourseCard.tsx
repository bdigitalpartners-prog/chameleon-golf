"use client";

import Link from "next/link";
import { MapPin, Trophy } from "lucide-react";
import type { CourseCard as CourseCardType } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";

function ScoreRing({ score }: { score: number | null }) {
  if (score === null) return <div className="score-ring h-12 w-12 bg-stone-100 text-stone-400 text-xs">NR</div>;
  const num = typeof score === "string" ? parseFloat(score) : score;
  const color = num >= 80 ? "bg-brand-600 text-white" : num >= 50 ? "bg-amber-500 text-white" : "bg-stone-200 text-stone-700";
  return <div className={cn("score-ring h-12 w-12 text-sm", color)}>{Math.round(num)}</div>;
}

export function CourseCard({ course }: { course: CourseCardType }) {
  return (
    <Link href={`/course/${course.courseId}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-stone-300">
        <div className="relative aspect-[16/10] bg-stone-100">
          {course.primaryImageUrl ? (
            <img
              src={course.primaryImageUrl}
              alt={course.courseName}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
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
          <h3 className="font-display text-lg font-semibold text-stone-900 leading-tight group-hover:text-brand-700 transition-colors">
            {course.courseName}
          </h3>
          {course.facilityName && course.facilityName !== course.courseName && (
            <p className="mt-0.5 text-sm text-stone-500">{course.facilityName}</p>
          )}
          <div className="mt-2 flex items-center gap-1.5 text-sm text-stone-500">
            <MapPin className="h-3.5 w-3.5" />
            <span>{[course.city, course.state, course.country].filter(Boolean).join(", ")}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {course.courseStyle && (
                <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                  {course.courseStyle}
                </span>
              )}
              {course.bestRank && course.bestSource && (
                <span className="text-xs text-stone-500">
                  #{course.bestRank} {course.bestSource}
                </span>
              )}
            </div>
            {(course.greenFeeLow || course.greenFeeHigh) && (
              <span className="text-sm font-medium text-stone-700">
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
