"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Pencil, ArrowRight, Flag, Star, ChevronDown, ChevronUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  safeText, EmptyState, ComingSoon, cardStyle, mutedText, secondaryText, primaryText,
  SectionHeading, InfoRow, HoleCard,
} from "./shared";

export function TheCourseTab({ course }: { course: any }) {
  const [expandedHole, setExpandedHole] = useState<number | null>(null);

  const holes = course.holes || [];
  const teeBoxes = course.teeBoxes || [];
  const renovationHistory = Array.isArray(course.renovationHistory) ? course.renovationHistory : [];
  const templateHoles = Array.isArray(course.templateHoles) ? course.templateHoles : [];

  return (
    <div className="max-w-4xl space-y-8">

      {/* Architect Profile Card */}
      {(course.architect || safeText(course.originalArchitect)) && (
        <section style={cardStyle}>
          <SectionHeading icon={<Pencil className="h-5 w-5" style={{ color: "#2ECC71" }} />}>
            Architect
          </SectionHeading>
          <div className="flex items-start gap-4">
            {course.architect?.portraitUrl || course.architect?.imageUrl ? (
              <img
                src={course.architect.portraitUrl || course.architect.imageUrl}
                alt={course.architect?.name || course.originalArchitect}
                className="h-24 w-24 rounded-xl object-cover flex-shrink-0"
                style={{ border: "1px solid var(--cg-border)" }}
              />
            ) : (
              <div
                className="h-24 w-24 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl font-bold"
                style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "#2ECC71" }}
              >
                {(course.architect?.name || course.originalArchitect || "").split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {course.architect?.slug ? (
                  <Link
                    href={`/architects/${course.architect.slug}`}
                    className="font-semibold text-lg transition-colors hover:underline"
                    style={{ color: "#2ECC71" }}
                  >
                    {course.architect?.name || course.originalArchitect}
                  </Link>
                ) : (
                  <span className="font-semibold text-lg" style={{ color: "var(--cg-text-primary)" }}>
                    {course.originalArchitect}
                  </span>
                )}
                {course.architect?.era && (
                  <span
                    className="text-[10px] rounded-full px-2 py-0.5 font-medium"
                    style={{ backgroundColor: "rgba(46,204,113,0.15)", color: "#2ECC71", border: "1px solid rgba(46,204,113,0.3)" }}
                  >
                    {course.architect.era}
                  </span>
                )}
              </div>
              {course.architect?.nationality && (
                <p className="text-xs mb-1" style={mutedText}>
                  {course.architect.nationality}
                  {course.architect.bornYear ? ` · ${course.architect.bornYear}${course.architect.diedYear ? `–${course.architect.diedYear}` : "–present"}` : ""}
                </p>
              )}
              {course.architect?.firmName && (
                <p className="text-xs mb-2" style={secondaryText}>Firm: {course.architect.firmName}</p>
              )}
              {course.architect?.bio && (
                <p className="text-sm leading-relaxed line-clamp-4" style={secondaryText}>{course.architect.bio}</p>
              )}
              {course.architect?.slug && (
                <Link
                  href={`/architects/${course.architect.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-medium mt-3 transition-colors hover:opacity-80"
                  style={{ color: "#2ECC71" }}
                >
                  View full profile <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Design Philosophy */}
      {(safeText(course.designPhilosophy) || safeText(course.architect?.designPhilosophy)) && (
        <section style={cardStyle}>
          <SectionHeading icon={<Pencil className="h-5 w-5" style={{ color: "#60a5fa" }} />}>
            Design Philosophy
          </SectionHeading>
          <p className="text-sm leading-relaxed italic" style={secondaryText}>
            &ldquo;{safeText(course.designPhilosophy) || safeText(course.architect?.designPhilosophy)}&rdquo;
          </p>
        </section>
      )}

      {/* Renovation Timeline */}
      {(renovationHistory.length > 0 || safeText(course.renovationArchitect)) && (
        <section style={cardStyle}>
          <SectionHeading icon={<Pencil className="h-5 w-5" style={{ color: "#c084fc" }} />}>
            Renovation History
          </SectionHeading>

          {renovationHistory.length > 0 ? (
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2 top-0 bottom-0 w-px" style={{ backgroundColor: "var(--cg-border)" }} />
              {renovationHistory.map((item: any, i: number) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[18px] top-1 h-3 w-3 rounded-full" style={{ backgroundColor: "#c084fc", border: "2px solid var(--cg-bg-card)" }} />
                  <div className="rounded-lg p-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      {item.year && <span className="text-sm font-bold" style={{ color: "#c084fc" }}>{item.year}</span>}
                      {item.architect && <span className="text-xs" style={mutedText}>by {item.architect}</span>}
                    </div>
                    {item.description && <p className="text-sm" style={secondaryText}>{item.description}</p>}
                    {item.notes && <p className="text-xs mt-1" style={mutedText}>{item.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg p-4" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
              <div className="flex items-center gap-2 mb-1">
                {course.renovationYear && <span className="text-sm font-bold" style={{ color: "#c084fc" }}>{course.renovationYear}</span>}
              </div>
              {safeText(course.renovationArchitect) && (
                <p className="text-sm" style={secondaryText}>Renovated by {course.renovationArchitect}</p>
              )}
              {safeText(course.renovationNotes) && (
                <p className="text-xs mt-1" style={mutedText}>{course.renovationNotes}</p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Signature Holes */}
      {(course.signatureHoleNumber || course.bestPar3 || course.bestPar4 || course.bestPar5) && (
        <section style={cardStyle}>
          <SectionHeading icon={<Flag className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />}>
            Signature Holes
          </SectionHeading>

          {course.signatureHoleNumber && (
            <div className="rounded-xl p-5 mb-4" style={{
              backgroundColor: "var(--cg-bg-secondary)",
              border: "1px solid rgba(34,197,94,0.3)",
            }}>
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
                <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--cg-accent)" }}>
                  Signature Hole
                </span>
              </div>
              <div className="text-2xl font-bold mb-2" style={primaryText}>
                Hole {course.signatureHoleNumber}
              </div>
              {course.signatureHoleDescription && (
                <p className="text-sm leading-relaxed" style={secondaryText}>
                  {course.signatureHoleDescription}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <HoleCard title="Best Par 3" holeData={course.bestPar3} accent="#60a5fa" />
            <HoleCard title="Best Par 4" holeData={course.bestPar4} accent="#fbbf24" />
            <HoleCard title="Best Par 5" holeData={course.bestPar5} accent="#c084fc" />
          </div>
        </section>
      )}

      {/* Hole-by-Hole Data (Accordion) */}
      {holes.length > 0 && (
        <section style={cardStyle}>
          <SectionHeading icon={<Flag className="h-5 w-5" style={{ color: "#60a5fa" }} />}>
            Hole-by-Hole
          </SectionHeading>
          <div className="space-y-2">
            {holes.sort((a: any, b: any) => a.holeNumber - b.holeNumber).map((hole: any) => (
              <div key={hole.holeId} className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--cg-border)" }}>
                <button
                  onClick={() => setExpandedHole(expandedHole === hole.holeNumber ? null : hole.holeNumber)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                  style={{ backgroundColor: expandedHole === hole.holeNumber ? "var(--cg-bg-secondary)" : "var(--cg-bg-card)" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm tabular-nums w-8" style={primaryText}>#{hole.holeNumber}</span>
                    <span className="text-sm" style={secondaryText}>Par {hole.par}</span>
                  </div>
                  {expandedHole === hole.holeNumber ? (
                    <ChevronUp className="h-4 w-4" style={mutedText} />
                  ) : (
                    <ChevronDown className="h-4 w-4" style={mutedText} />
                  )}
                </button>
                {expandedHole === hole.holeNumber && hole.teeYardages?.length > 0 && (
                  <div className="px-4 py-3 border-t" style={{ borderColor: "var(--cg-border)", backgroundColor: "var(--cg-bg-secondary)" }}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {hole.teeYardages.map((ty: any) => (
                        <div key={ty.id} className="text-xs">
                          <span style={mutedText}>{ty.tee?.teeName || "Tee"}: </span>
                          <span className="font-medium" style={primaryText}>{ty.yardage} yds</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Scorecard / Tee Sets */}
      {teeBoxes.length > 0 && (
        <section style={cardStyle}>
          <SectionHeading icon={<Flag className="h-5 w-5" style={{ color: "#fbbf24" }} />}>
            Scorecard — Tee Sets
          </SectionHeading>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--cg-border)" }}>
                  <th className="text-left py-2 pr-4 text-xs font-medium" style={mutedText}>Tee</th>
                  <th className="text-right py-2 px-2 text-xs font-medium" style={mutedText}>Yardage</th>
                  <th className="text-right py-2 px-2 text-xs font-medium" style={mutedText}>Rating</th>
                  <th className="text-right py-2 pl-2 text-xs font-medium" style={mutedText}>Slope</th>
                </tr>
              </thead>
              <tbody>
                {teeBoxes.map((tee: any) => (
                  <tr key={tee.teeId} style={{ borderBottom: "1px solid var(--cg-border)" }}>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        {tee.color && (
                          <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: tee.color.toLowerCase() }} />
                        )}
                        <span className="font-medium" style={primaryText}>{tee.teeName}</span>
                        {tee.gender && <span className="text-[10px]" style={mutedText}>({tee.gender})</span>}
                      </div>
                    </td>
                    <td className="text-right py-2 px-2 tabular-nums" style={primaryText}>
                      {tee.totalYardage ? Number(tee.totalYardage).toLocaleString() : "—"}
                    </td>
                    <td className="text-right py-2 px-2 tabular-nums" style={secondaryText}>
                      {tee.courseRating ? parseFloat(tee.courseRating).toFixed(1) : "—"}
                    </td>
                    <td className="text-right py-2 pl-2 tabular-nums" style={secondaryText}>
                      {tee.slopeRating ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Course Style Tags */}
      <section style={cardStyle}>
        <SectionHeading>Course Details</SectionHeading>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <InfoRow label="Style" value={safeText(course.courseStyle)} />
          <InfoRow label="Type" value={safeText(course.courseType)} />
          <InfoRow label="Holes" value={course.numHoles} />
          <InfoRow label="Par" value={course.par} />
          <InfoRow label="Year Opened" value={course.yearOpened} />
          <InfoRow label="Fairway Grass" value={safeText(course.fairwayGrass)} />
          <InfoRow label="Green Grass" value={safeText(course.greenGrass)} />
          <InfoRow label="Green Speed" value={safeText(course.greenSpeed)} />
        </dl>
      </section>

      {/* Template Holes */}
      {templateHoles.length > 0 && (
        <section style={cardStyle}>
          <SectionHeading icon={<Flag className="h-5 w-5" style={{ color: "#60a5fa" }} />}>
            Template Holes
          </SectionHeading>
          <div className="space-y-3">
            {templateHoles.map((th: any, i: number) => (
              <div key={i} className="rounded-lg p-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                {th.hole && <span className="text-sm font-bold" style={primaryText}>Hole {th.hole}</span>}
                {th.name && <span className="text-sm ml-2" style={secondaryText}>— {th.name}</span>}
                {th.description && <p className="text-xs mt-1" style={mutedText}>{th.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* More by This Architect */}
      {course.architectCourses?.length > 0 && course.architect && (
        <section style={cardStyle}>
          <SectionHeading icon={<Pencil className="h-5 w-5" style={{ color: "#2ECC71" }} />}>
            More by {course.architect.name || course.originalArchitect}
          </SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {course.architectCourses.map((ac: any) => {
              const thumb = ac.media?.[0]?.url;
              const csScore = ac.chameleonScores?.chameleonScore;
              const scoreVal = csScore ? parseFloat(csScore) : null;
              return (
                <Link
                  key={ac.courseId}
                  href={`/course/${ac.courseId}`}
                  className="group rounded-xl overflow-hidden transition-all hover:opacity-90"
                  style={{ backgroundColor: "var(--cg-bg-secondary)", border: "1px solid var(--cg-border)" }}
                >
                  {thumb ? (
                    <div className="aspect-[16/10] overflow-hidden" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
                      <img src={thumb} alt={ac.courseName} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] flex items-center justify-center" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
                      <Flag className="h-8 w-8" style={{ color: "var(--cg-text-muted)" }} />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate" style={{ color: "var(--cg-text-primary)" }}>{ac.courseName}</div>
                        {(ac.city || ac.state) && (
                          <div className="text-xs mt-0.5 truncate" style={mutedText}>
                            {[ac.city, ac.state].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                      {scoreVal != null && (
                        <span
                          className="text-xs font-bold rounded-full px-2 py-0.5 shrink-0"
                          style={{
                            backgroundColor: scoreVal >= 80 ? "rgba(46,204,113,0.2)" : scoreVal >= 50 ? "rgba(234,179,8,0.2)" : "var(--cg-bg-tertiary)",
                            color: scoreVal >= 80 ? "#2ECC71" : scoreVal >= 50 ? "#fbbf24" : "var(--cg-text-muted)",
                          }}
                        >
                          {Math.round(scoreVal)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state if no architecture data */}
      {!course.architect && !safeText(course.originalArchitect) && holes.length === 0 && teeBoxes.length === 0 && (
        <section style={cardStyle}>
          <ComingSoon
            title="Architecture & design data coming soon"
            description="Help us enrich this course — architect details, hole data, and design philosophy will be added soon"
          />
        </section>
      )}
    </div>
  );
}
