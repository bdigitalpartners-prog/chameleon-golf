"use client";

import { useState } from "react";
import { X, BarChart3, Trophy } from "lucide-react";
import { useCompare } from "@/contexts/CompareContext";
import { formatCurrency } from "@/lib/utils";
import type { CourseCard } from "@/types";

const DIMENSION_LABELS: { key: string; label: string; color: string }[] = [
  { key: "avgConditioning", label: "Conditioning", color: "#22c55e" },
  { key: "avgLayoutDesign", label: "Layout & Design", color: "#3b82f6" },
  { key: "avgAesthetics", label: "Aesthetics", color: "#f59e0b" },
  { key: "avgChallenge", label: "Challenge", color: "#ef4444" },
  { key: "avgValue", label: "Value", color: "#14b8a6" },
  { key: "avgWalkability", label: "Walkability", color: "#84cc16" },
  { key: "avgPace", label: "Pace of Play", color: "#f97316" },
  { key: "avgAmenities", label: "Amenities", color: "#06b6d4" },
  { key: "avgService", label: "Service", color: "#ec4899" },
];

const ACCENT_COLORS = ["#a855f7", "#22c55e", "#3b82f6", "#f59e0b"];

function RadarChart({
  courses,
  dimensions,
}: {
  courses: any[];
  dimensions: typeof DIMENSION_LABELS;
}) {
  const n = dimensions.length;
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 80;

  const angleStep = (2 * Math.PI) / n;
  const getPoint = (i: number, radius: number) => {
    const angle = i * angleStep - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  };

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const polygonPoints = (scores: number[]) =>
    scores
      .map((score, i) => {
        const pt = getPoint(i, (score / 10) * r);
        return `${pt.x},${pt.y}`;
      })
      .join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[200px]">
      {/* Grid circles */}
      {gridLevels.map((level) => {
        const pts = dimensions.map((_, i) => getPoint(i, level * r));
        const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";
        return (
          <path
            key={level}
            d={d}
            fill="none"
            stroke="var(--cg-border)"
            strokeWidth="0.5"
          />
        );
      })}
      {/* Axis lines */}
      {dimensions.map((_, i) => {
        const pt = getPoint(i, r);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={pt.x}
            y2={pt.y}
            stroke="var(--cg-border)"
            strokeWidth="0.5"
          />
        );
      })}
      {/* Data polygons */}
      {courses.map((course, ci) => {
        const scores = dimensions.map((d) => {
          const val = course?.chameleonScores?.[d.key];
          return val ? parseFloat(val) : 0;
        });
        const hasData = scores.some((s) => s > 0);
        if (!hasData) return null;
        return (
          <polygon
            key={course.courseId}
            points={polygonPoints(scores)}
            fill={ACCENT_COLORS[ci % ACCENT_COLORS.length] + "33"}
            stroke={ACCENT_COLORS[ci % ACCENT_COLORS.length]}
            strokeWidth="1.5"
          />
        );
      })}
      {/* Labels */}
      {dimensions.map((dim, i) => {
        const pt = getPoint(i, r + 14);
        return (
          <text
            key={dim.key}
            x={pt.x}
            y={pt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="7"
            fill="var(--cg-text-muted)"
          >
            {dim.label.split(" ")[0]}
          </text>
        );
      })}
    </svg>
  );
}

function CompareModal({ onClose }: { onClose: () => void }) {
  const { courses, removeCourse } = useCompare();

  const rows: { label: string; key: (c: any) => string | null }[] = [
    { label: "Location", key: (c) => [c.city, c.state, c.country].filter(Boolean).join(", ") },
    { label: "Style", key: (c) => c.courseStyle ?? "—" },
    { label: "Access", key: (c) => c.accessType ?? "—" },
    { label: "Architect", key: (c) => c.originalArchitect ?? "—" },
    { label: "Year Opened", key: (c) => c.yearOpened ? String(c.yearOpened) : "—" },
    { label: "Par", key: (c) => c.par ? String(c.par) : "—" },
    { label: "Green Fees", key: (c) => c.greenFeeLow ? `${formatCurrency(c.greenFeeLow)}${c.greenFeeHigh && c.greenFeeLow !== c.greenFeeHigh ? ` – ${formatCurrency(c.greenFeeHigh)}` : ""}` : "—" },
    { label: "Walking Policy", key: (c) => c.walkingPolicy ?? "—" },
    { label: "Chameleon Score", key: (c) => c.chameleonScore ? Math.round(parseFloat(String(c.chameleonScore))).toString() : "—" },
    { label: "Rankings", key: (c) => c.rankings?.length > 0 ? c.rankings.map((r: any) => `#${r.rank} ${r.source}`).join(" · ") : "—" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--cg-bg-card)",
          border: "1px solid var(--cg-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--cg-border)" }}
        >
          <h2
            className="font-display text-xl font-bold"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Course Comparison
          </h2>
          <button onClick={onClose} style={{ color: "var(--cg-text-muted)" }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            {/* Course headers */}
            <thead>
              <tr>
                <th
                  className="w-36 px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: "var(--cg-text-muted)", borderBottom: "1px solid var(--cg-border)" }}
                />
                {courses.map((course, i) => (
                  <th
                    key={course.courseId}
                    className="px-4 py-4 text-left"
                    style={{ borderBottom: "1px solid var(--cg-border)" }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        {course.primaryImageUrl ? (
                          <div className="mb-2 aspect-[4/3] w-full max-w-[140px] overflow-hidden rounded-lg">
                            <img
                              src={course.primaryImageUrl}
                              alt={course.courseName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className="mb-2 flex aspect-[4/3] w-full max-w-[140px] items-center justify-center rounded-lg"
                            style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                          >
                            <Trophy className="h-8 w-8" style={{ color: "var(--cg-text-muted)" }} />
                          </div>
                        )}
                        <div
                          className="text-sm font-bold leading-tight"
                          style={{ color: "var(--cg-text-primary)" }}
                        >
                          {course.courseName}
                        </div>
                        <div
                          className="mt-0.5 text-xs"
                          style={{ color: "var(--cg-text-muted)" }}
                        >
                          {[course.city, course.state].filter(Boolean).join(", ")}
                        </div>
                        {/* Color indicator */}
                        <div
                          className="mt-1.5 h-1 w-8 rounded-full"
                          style={{ backgroundColor: ACCENT_COLORS[i % ACCENT_COLORS.length] }}
                        />
                      </div>
                      <button
                        onClick={() => removeCourse(course.courseId)}
                        className="shrink-0 rounded-full p-1 transition-opacity hover:opacity-70"
                        style={{
                          backgroundColor: "var(--cg-bg-tertiary)",
                          color: "var(--cg-text-muted)",
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.label}
                  style={{ borderBottom: "1px solid var(--cg-border)" }}
                >
                  <td
                    className="px-6 py-3 text-xs font-semibold"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    {row.label}
                  </td>
                  {courses.map((course) => (
                    <td
                      key={course.courseId}
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--cg-text-primary)" }}
                    >
                      {row.key(course)}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Radar chart row */}
              <tr>
                <td
                  className="px-6 py-4 text-xs font-semibold align-top"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  Score Radar
                </td>
                {courses.map((course) => (
                  <td key={course.courseId} className="px-4 py-4">
                    <RadarChart courses={[course]} dimensions={DIMENSION_LABELS} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function CompareDrawer() {
  const { courses, removeCourse, clearAll } = useCompare();
  const [modalOpen, setModalOpen] = useState(false);

  if (courses.length === 0) return null;

  return (
    <>
      {/* Floating bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="mx-auto max-w-4xl rounded-2xl p-4"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            border: "1px solid var(--cg-accent)",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
            pointerEvents: "all",
          }}
        >
          <div className="flex items-center gap-3">
            {/* Course thumbnails */}
            <div className="flex flex-1 items-center gap-2 flex-wrap">
              {courses.map((course, i) => (
                <div key={course.courseId} className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: ACCENT_COLORS[i % ACCENT_COLORS.length] }}
                  />
                  {course.primaryImageUrl ? (
                    <img
                      src={course.primaryImageUrl}
                      alt={course.courseName}
                      className="h-8 w-8 rounded object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded"
                      style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                    >
                      <Trophy className="h-4 w-4" style={{ color: "var(--cg-text-muted)" }} />
                    </div>
                  )}
                  <span
                    className="hidden text-xs font-medium sm:block max-w-[100px] truncate"
                    style={{ color: "var(--cg-text-primary)" }}
                  >
                    {course.courseName}
                  </span>
                  <button
                    onClick={() => removeCourse(course.courseId)}
                    className="shrink-0"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                {courses.length}/4
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={clearAll}
                className="rounded-lg px-3 py-2 text-xs font-medium transition-opacity hover:opacity-70"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  color: "var(--cg-text-secondary)",
                }}
              >
                Clear All
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: "var(--cg-accent)",
                  color: "var(--cg-text-inverse)",
                }}
              >
                <BarChart3 className="h-4 w-4" />
                Compare
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && <CompareModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
