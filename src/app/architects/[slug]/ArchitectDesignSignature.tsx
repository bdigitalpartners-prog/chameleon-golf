"use client";

import Link from "next/link";
import { DesignDNASummary } from "@/components/course/DesignDNACard";

interface Renovation {
  id: number;
  courseId: number;
  year: number | null;
  type: string;
  description: string | null;
  course: { courseId: number; courseName: string };
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--cg-bg-card)",
  border: "1px solid var(--cg-border)",
  borderRadius: "0.75rem",
  padding: "1.5rem",
};

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Original Design": { bg: "rgba(34,197,94,0.15)", text: "#4ade80", border: "rgba(34,197,94,0.3)" },
  "Major Renovation": { bg: "rgba(234,179,8,0.15)", text: "#fbbf24", border: "rgba(234,179,8,0.3)" },
  Restoration: { bg: "rgba(168,85,247,0.15)", text: "#c084fc", border: "rgba(168,85,247,0.3)" },
  "Bunker Renovation": { bg: "rgba(59,130,246,0.15)", text: "#60a5fa", border: "rgba(59,130,246,0.3)" },
  "Green Rebuild": { bg: "rgba(236,72,153,0.15)", text: "#f472b6", border: "rgba(236,72,153,0.3)" },
  "Routing Change": { bg: "rgba(249,115,22,0.15)", text: "#fb923c", border: "rgba(249,115,22,0.3)" },
};

export function ArchitectDesignSignature({
  dnaList,
  renovations,
}: {
  dnaList: any[];
  renovations: Renovation[];
}) {
  const hasDna = dnaList && dnaList.length > 0;
  const hasRenovations = renovations && renovations.length > 0;

  if (!hasDna && !hasRenovations) return null;

  return (
    <div className="space-y-6 mb-6">
      {/* Design Signature */}
      {hasDna && (
        <section style={cardStyle}>
          <h2
            className="mb-3 text-lg font-semibold flex items-center gap-2"
            style={{ color: "var(--cg-text-primary)" }}
          >
            <span
              className="flex items-center justify-center h-7 w-7 rounded-lg text-sm"
              style={{
                backgroundColor: "var(--cg-accent-bg)",
                border: "1px solid var(--cg-accent-muted)",
              }}
            >
              🧬
            </span>
            Design Signature
          </h2>
          <p
            className="text-xs mb-4"
            style={{ color: "var(--cg-text-muted)" }}
          >
            Common design characteristics across {dnaList.length}{" "}
            {dnaList.length === 1 ? "course" : "courses"} in our database.
          </p>
          <DesignDNASummary dnaList={dnaList} />
        </section>
      )}

      {/* Renovation History */}
      {hasRenovations && (
        <section style={cardStyle}>
          <h2
            className="mb-3 text-lg font-semibold flex items-center gap-2"
            style={{ color: "var(--cg-text-primary)" }}
          >
            <span
              className="flex items-center justify-center h-7 w-7 rounded-lg text-sm"
              style={{
                backgroundColor: "rgba(234,179,8,0.1)",
                border: "1px solid rgba(234,179,8,0.2)",
              }}
            >
              📜
            </span>
            Renovation Work
          </h2>
          <p
            className="text-xs mb-4"
            style={{ color: "var(--cg-text-muted)" }}
          >
            Courses this architect has renovated, restored, or redesigned.
          </p>
          <div className="space-y-3">
            {renovations.map((ren) => {
              const colors = TYPE_COLORS[ren.type] || TYPE_COLORS["Major Renovation"];
              return (
                <div
                  key={ren.id}
                  className="flex items-start gap-3 rounded-lg p-3"
                  style={{
                    backgroundColor: "var(--cg-bg-secondary)",
                    border: "1px solid var(--cg-border)",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Link
                        href={`/course/${ren.course.courseId}`}
                        className="text-sm font-medium transition-colors hover:underline"
                        style={{ color: "var(--cg-text-primary)" }}
                      >
                        {ren.course.courseName}
                      </Link>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        {ren.type}
                      </span>
                      {ren.year && (
                        <span
                          className="text-xs tabular-nums"
                          style={{ color: "var(--cg-text-muted)" }}
                        >
                          {ren.year}
                        </span>
                      )}
                    </div>
                    {ren.description && (
                      <p
                        className="text-xs"
                        style={{ color: "var(--cg-text-secondary)" }}
                      >
                        {ren.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
