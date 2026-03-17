"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Trophy, Star, Lightbulb, Flag, ChevronRight, SlidersHorizontal,
  Phone, Globe, Mail, Calendar, ExternalLink, Plane, Camera, Image,
  Pencil, Award, ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PoweredByBadge } from "@/components/brand/PoweredByBadge";
import { CourseContentSections } from "../CourseContentSections";
import {
  safeText, EmptyState, cardStyle, sectionTitle, mutedText, secondaryText, primaryText,
  tierBadgeStyle, SectionHeading, SubHeading, InfoRow, RadarChart,
  RADAR_DIMENSIONS, IntelligenceNoteCard, HoleCard,
} from "./shared";

export function OverviewTab({ course }: { course: any }) {
  /* ── Chameleon Scores ── */
  const csData = Array.isArray(course.chameleonScores) ? course.chameleonScores[0] : course.chameleonScores;
  const chameleonScore = csData?.chameleonScore;
  const scoreNum = chameleonScore ? parseFloat(chameleonScore) : null;

  const radarScores: Record<string, number> = {};
  if (csData) {
    for (const dim of RADAR_DIMENSIONS) {
      if (csData[dim.key]) radarScores[dim.key] = parseFloat(csData[dim.key]);
    }
  }
  const hasDimensions = Object.values(radarScores).some((v) => v > 0);

  /* ── Equalizer Sliders ── */
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    RADAR_DIMENSIONS.forEach((d) => { init[d.key] = 11; });
    return init;
  });

  const totalWeight = useMemo(() => Object.values(weights).reduce((s, w) => s + w, 0), [weights]);

  const equalizerScore = useMemo(() => {
    if (!hasDimensions || totalWeight === 0) return null;
    let weighted = 0;
    let wSum = 0;
    for (const dim of RADAR_DIMENSIONS) {
      const val = radarScores[dim.key] ?? 0;
      const w = weights[dim.key] ?? 0;
      weighted += val * w;
      wSum += w;
    }
    return wSum > 0 ? (weighted / wSum) * 10 : null;
  }, [radarScores, weights, hasDimensions, totalWeight]);

  const updateWeight = (key: string, val: number) => {
    setWeights((prev) => ({ ...prev, [key]: val }));
  };

  /* ── Derived data ── */
  const practiceFacilities = Array.isArray(course.practiceFacilities) ? course.practiceFacilities : [];
  const nearbyCourses = course.nearbyCourses || [];

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main Column */}
      <div className="lg:col-span-2 space-y-8">

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {course.par != null && (
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
              <div className="text-xs mb-1" style={mutedText}>Par</div>
              <div className="text-lg font-bold" style={primaryText}>{course.par}</div>
            </div>
          )}
          {course.teeBoxes?.[0]?.totalYardage && (
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
              <div className="text-xs mb-1" style={mutedText}>Yardage</div>
              <div className="text-lg font-bold" style={primaryText}>{Number(course.teeBoxes[0].totalYardage).toLocaleString()}</div>
            </div>
          )}
          {safeText(course.originalArchitect) && (
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
              <div className="text-xs mb-1" style={mutedText}>Architect</div>
              <div className="text-sm font-bold truncate" style={{ color: "#00E676" }}>
                {course.architect?.slug ? (
                  <Link href={`/architects/${course.architect.slug}`} className="hover:underline">
                    {course.architect?.name || course.originalArchitect}
                  </Link>
                ) : (
                  course.originalArchitect
                )}
              </div>
            </div>
          )}
          {course.yearOpened && (
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
              <div className="text-xs mb-1" style={mutedText}>Year Built</div>
              <div className="text-lg font-bold" style={primaryText}>{course.yearOpened}</div>
            </div>
          )}
          {safeText(course.accessType) && (
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
              <div className="text-xs mb-1" style={mutedText}>Access</div>
              <div className="text-sm font-bold" style={primaryText}>{course.accessType}</div>
            </div>
          )}
          {scoreNum !== null && (
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)" }}>
              <div className="text-xs mb-1" style={{ color: "#00E676" }}>CF Score</div>
              <div className="text-lg font-bold" style={{ color: "#00E676" }}>{Math.round(scoreNum)}</div>
            </div>
          )}
        </div>

        {/* About */}
        {safeText(course.description) && (
          <section style={cardStyle}>
            <SectionHeading lastUpdated={course.updatedAt}>About {course.courseName}</SectionHeading>
            <p className="text-sm leading-relaxed" style={{ color: "var(--cg-text-secondary)", lineHeight: "1.75" }}>
              {safeText(course.description)}
            </p>
          </section>
        )}

        {/* Rankings Dashboard */}
        <section style={cardStyle}>
          <SectionHeading icon={<Trophy className="h-5 w-5" style={{ color: "#f59e0b" }} />}>
            Rankings
          </SectionHeading>
          {course.rankings?.length > 0 ? (() => {
            const tierOrder = ["flagship", "major", "specialty", "regional"];
            const sorted = [...course.rankings].sort((a: any, b: any) => {
              const tA = tierOrder.indexOf(a.list?.prestigeTier || "regional");
              const tB = tierOrder.indexOf(b.list?.prestigeTier || "regional");
              if (tA !== tB) return tA - tB;
              return (a.rankPosition ?? 999) - (b.rankPosition ?? 999);
            });
            return (
              <div className="space-y-2">
                {sorted.map((r: any) => (
                  <Link
                    key={r.entryId}
                    href={`/rankings/${r.list?.listId || ""}`}
                    className="flex items-center justify-between rounded-lg px-4 py-3 transition-colors hover:opacity-90 block"
                    style={{ backgroundColor: "var(--cg-bg-secondary)" }}
                  >
                    <div className="flex items-center gap-3 flex-wrap min-w-0">
                      <span
                        className="font-bold text-lg tabular-nums flex items-center justify-center h-9 w-9 rounded-lg shrink-0"
                        style={{
                          backgroundColor: "rgba(46,204,113,0.15)",
                          color: "#2ECC71",
                        }}
                      >
                        {r.rankPosition != null ? `#${r.rankPosition}` : "—"}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate" style={primaryText}>{r.list?.listName || "Unknown List"}</span>
                          {r.list?.prestigeTier && (
                            <span className="rounded px-1.5 py-0.5 text-[10px] capitalize font-medium" style={tierBadgeStyle(r.list.prestigeTier)}>
                              {r.list.prestigeTier}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs" style={mutedText}>{r.list?.source?.sourceName || ""}</span>
                          {r.list?.yearPublished && (
                            <span className="text-xs" style={mutedText}>· {r.list.yearPublished}</span>
                          )}
                          {r.rankChange != null && r.rankChange !== 0 && (
                            <span className="text-[10px] font-medium" style={{ color: r.rankChange > 0 ? "#2ECC71" : "#ef4444" }}>
                              {r.rankChange > 0 ? `▲${r.rankChange}` : `▼${Math.abs(r.rankChange)}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0" style={mutedText} />
                  </Link>
                ))}
              </div>
            );
          })() : (
            <EmptyState
              icon={<Trophy className="h-10 w-10" />}
              title="Not yet ranked"
              description="This course has not appeared on any major ranking lists yet"
            />
          )}
        </section>

        {/* 7-Dimension Radar Chart */}
        {hasDimensions && (
          <section style={cardStyle}>
            <SectionHeading icon={<Star className="h-5 w-5" style={{ color: "#f59e0b" }} />}>
              EQ Dimensions
            </SectionHeading>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <RadarChart scores={radarScores} />
              </div>
              <div className="flex-1 space-y-2 w-full">
                {RADAR_DIMENSIONS.map((dim) => {
                  const val = radarScores[dim.key];
                  if (!val) return null;
                  const pct = Math.min(100, (val / 10) * 100);
                  return (
                    <div key={dim.key} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-xs" style={mutedText}>{dim.fullLabel}</span>
                      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "var(--cg-accent)" }} />
                      </div>
                      <span className="w-8 text-right text-xs font-semibold tabular-nums" style={primaryText}>
                        {val.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 3 Things to Know */}
        {course.intelligenceNotes?.length >= 3 && (
          <section style={cardStyle}>
            <SectionHeading icon={<Lightbulb className="h-5 w-5" style={{ color: "#4ade80" }} />}>
              3 Things to Know
            </SectionHeading>
            <div className="grid gap-4 sm:grid-cols-3">
              {course.intelligenceNotes.slice(0, 3).map((note: any) => (
                <IntelligenceNoteCard key={note.id} note={note} />
              ))}
            </div>
          </section>
        )}

        {/* Course Intelligence Notes */}
        {course.intelligenceNotes?.length > 0 && (
          <section style={cardStyle}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
              <SectionHeading
                icon={<Lightbulb className="h-5 w-5" style={{ color: "#4ade80" }} />}
                lastUpdated={course.intelligenceNotes[0]?.generatedAt}
              >
                Course Intelligence
              </SectionHeading>
              <PoweredByBadge variant="intelligence" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {course.intelligenceNotes.map((note: any) => (
                <IntelligenceNoteCard key={note.id} note={note} />
              ))}
            </div>
            <p className="text-[10px] mt-4 text-center" style={mutedText}>
              AI-generated insights based on course data. Always verify details with the course directly.
            </p>
          </section>
        )}

        {/* Nearby Courses */}
        {nearbyCourses.length > 0 && (
          <section style={cardStyle}>
            <SectionHeading icon={<Flag className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />}>
              Nearby Courses
            </SectionHeading>
            <div className="space-y-3">
              {nearbyCourses.slice(0, 6).map((nc: any) => {
                const nearby = nc.nearbyCourse;
                if (!nearby) return null;
                const img = nearby.media?.[0];
                return (
                  <a
                    key={nc.id}
                    href={`/course/${nearby.courseId}`}
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:opacity-90"
                    style={{ backgroundColor: "var(--cg-bg-secondary)" }}
                  >
                    {img && (
                      <div className="h-14 w-20 rounded-md overflow-hidden shrink-0" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
                        <img src={img.url} alt={nearby.courseName} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate" style={primaryText}>{nearby.courseName}</div>
                      {nearby.city && <div className="text-xs" style={mutedText}>{[nearby.city, nearby.state].filter(Boolean).join(", ")}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      {nc.distanceMiles && <div className="text-sm font-medium" style={secondaryText}>{parseFloat(nc.distanceMiles).toFixed(0)} mi</div>}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0" style={mutedText} />
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* CTAs */}
        <div className="flex flex-wrap gap-3">
          <button
            className="flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: "#00E676", color: "#111111" }}
          >
            <Star className="h-4 w-4" /> Add to Bucket List
          </button>
          <button
            className="flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--cg-bg-card)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
          >
            <Star className="h-4 w-4" /> Rate This Course
          </button>
        </div>

        {/* Articles, Media & Books */}
        <CourseContentSections courseId={course.courseId} />
      </div>

      {/* Sidebar */}
      <div className="space-y-6">

        {/* Equalizer Score */}
        <section style={cardStyle}>
          <SectionHeading icon={<SlidersHorizontal className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />}>
            Your Score
          </SectionHeading>

          {hasDimensions ? (
            <>
              <div className="flex items-center justify-center mb-5">
                <div className="flex items-center justify-center rounded-full h-20 w-20 text-2xl font-bold" style={{
                  backgroundColor: equalizerScore && equalizerScore >= 80 ? "var(--cg-accent)" : equalizerScore && equalizerScore >= 50 ? "#eab308" : "var(--cg-bg-tertiary)",
                  color: equalizerScore && equalizerScore >= 50 ? "white" : "var(--cg-text-primary)",
                }}>
                  {equalizerScore != null ? Math.round(equalizerScore) : "—"}
                </div>
              </div>

              <div className="mb-5">
                <RadarChart scores={radarScores} />
              </div>

              <div className="space-y-3">
                {RADAR_DIMENSIONS.map((dim) => {
                  const w = weights[dim.key] ?? 0;
                  const pct = totalWeight > 0 ? Math.round((w / totalWeight) * 100) : 0;
                  return (
                    <div key={dim.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs" style={mutedText}>{dim.fullLabel}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs tabular-nums font-medium" style={primaryText}>
                            {radarScores[dim.key]?.toFixed(1) ?? "—"}
                          </span>
                          <span className="text-[10px] tabular-nums w-8 text-right" style={mutedText}>{pct}%</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={w}
                        onChange={(e) => updateWeight(dim.key, parseInt(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, var(--cg-accent) 0%, var(--cg-accent) ${w}%, var(--cg-bg-tertiary) ${w}%, var(--cg-bg-tertiary) 100%)`,
                          accentColor: "var(--cg-accent)",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-center">
                <PoweredByBadge variant="ratings" />
              </div>
            </>
          ) : (
            <p className="text-sm text-center py-4" style={mutedText}>
              Rate this course to see your personalized score
            </p>
          )}
        </section>

        {/* Quick Info */}
        {(course.phone || course.websiteUrl || course.bookingUrl || course.email) && (
          <section style={cardStyle}>
            <h3 className="font-display text-base font-semibold mb-3" style={sectionTitle}>Quick Info</h3>
            <div className="space-y-3">
              {course.phone && (
                <a href={`tel:${course.phone}`} className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity" style={secondaryText}>
                  <Phone className="h-4 w-4 shrink-0" /> {course.phone}
                </a>
              )}
              {course.email && (
                <a href={`mailto:${course.email}`} className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity" style={secondaryText}>
                  <Mail className="h-4 w-4 shrink-0" /> {course.email}
                </a>
              )}
              {course.websiteUrl && (
                <a href={course.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity" style={secondaryText}>
                  <Globe className="h-4 w-4 shrink-0" /> Website <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {course.bookingUrl && (
                <a href={course.bookingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium rounded-lg px-4 py-2.5 transition-opacity hover:opacity-90" style={{
                  backgroundColor: "var(--cg-accent)", color: "white",
                }}>
                  <Calendar className="h-4 w-4" /> Book Tee Time <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}
            </div>
          </section>
        )}

        {/* Nearby Airports sidebar */}
        {course.airports?.length > 0 && (
          <section style={cardStyle}>
            <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2" style={sectionTitle}>
              <Plane className="h-4 w-4" style={{ color: "#60a5fa" }} /> Nearby Airports
            </h3>
            <div className="space-y-3">
              {course.airports.slice(0, 5).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between text-sm" style={{ borderBottom: "1px solid var(--cg-border)", paddingBottom: "0.5rem" }}>
                  <div>
                    <div className="font-medium" style={primaryText}>
                      {a.airport.iataCode ? `${a.airport.iataCode} — ` : ""}{a.airport.airportName}
                    </div>
                    <div className="text-xs" style={mutedText}>{a.airport.airportType}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium" style={secondaryText}>{parseFloat(a.distanceMiles).toFixed(0)} mi</div>
                    {a.driveTimeMinutes && <div className="text-xs" style={mutedText}>{a.driveTimeMinutes} min drive</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
