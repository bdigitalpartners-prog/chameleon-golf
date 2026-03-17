"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin, Globe, Phone, Trophy, Plane, Star, Calendar,
  Lightbulb, Utensils, Bed, Compass, Flag, ChevronRight,
  Clock, Sun, CloudRain, Wind, Leaf, SlidersHorizontal,
  Building2, Map, Mail, ExternalLink, DollarSign,
  Home, Camera, Image, MessageSquare, Brain, Briefcase, Truck, Pencil,
  Award, ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CoursePlaceholder } from "./CoursePlaceholder";
import { CircleRatingsSection } from "./CircleRatingsSection";
import { PoweredByBadge } from "@/components/brand/PoweredByBadge";
import { CourseContentSections } from "./CourseContentSections";
import { BucketListButton } from "@/components/bucket-list/BucketListButton";
import { BucketListCounter } from "@/components/bucket-list/BucketListCounter";

/* ─── Safe Text Helper ─── */

function safeText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value);
  if (str === "undefined" || str === "null" || str.trim() === "") return null;
  return str;
}

/* ─── Empty State ─── */

function EmptyState({ icon, title, description, cta }: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className="flex items-center justify-center h-16 w-16 rounded-2xl mb-4"
        style={{ backgroundColor: "var(--cg-bg-tertiary)", border: "1px solid var(--cg-border)" }}
      >
        <span style={{ color: "var(--cg-text-muted)" }}>{icon}</span>
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--cg-text-secondary)" }}>{title}</p>
      {description && (
        <p className="mt-1.5 text-xs max-w-xs" style={{ color: "var(--cg-text-muted)" }}>{description}</p>
      )}
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

/* ─── Last Updated ─── */

function LastUpdated({ date }: { date: string | Date | null | undefined }) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const relative = getRelativeTime(d);
  return (
    <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--cg-text-muted)" }}>
      <Clock className="h-2.5 w-2.5" />
      Updated {relative}
    </span>
  );
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

/* ─── Section Skeleton ─── */

function SectionSkeleton({ rows = 3, showTitle = true }: { rows?: number; showTitle?: boolean }) {
  return (
    <div className="rounded-xl p-6 animate-pulse" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
      {showTitle && <div className="h-5 w-40 rounded mb-4" style={{ backgroundColor: "var(--cg-bg-tertiary)" }} />}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-3 rounded" style={{ backgroundColor: "var(--cg-bg-tertiary)", width: `${85 - i * 10}%` }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Shared Styles ─── */

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--cg-bg-card)",
  border: "1px solid var(--cg-border)",
  borderRadius: "0.75rem",
  padding: "1.5rem",
};

const sectionTitle: React.CSSProperties = { color: "var(--cg-text-primary)" };
const mutedText: React.CSSProperties = { color: "var(--cg-text-muted)" };
const secondaryText: React.CSSProperties = { color: "var(--cg-text-secondary)" };
const primaryText: React.CSSProperties = { color: "var(--cg-text-primary)" };

/* ─── Tier Badge ─── */

function tierBadgeStyle(tier: string): React.CSSProperties {
  switch (tier) {
    case "flagship":
      return { backgroundColor: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" };
    case "major":
      return { backgroundColor: "rgba(234,179,8,0.15)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.3)" };
    case "specialty":
      return { backgroundColor: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)" };
    default:
      return { backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-muted)", border: "1px solid var(--cg-border)" };
  }
}

function accessBadgeStyle(access: string): React.CSSProperties {
  const lower = (access || "").toLowerCase();
  if (lower.includes("private"))
    return { backgroundColor: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" };
  if (lower.includes("resort"))
    return { backgroundColor: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" };
  return { backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" };
}

/* ─── Radar Chart ─── */

const RADAR_DIMENSIONS = [
  { key: "avgConditioning", label: "Cond.", fullLabel: "Conditioning" },
  { key: "avgLayoutDesign", label: "Layout", fullLabel: "Layout & Design" },
  { key: "avgAesthetics", label: "Aesth.", fullLabel: "Aesthetics" },
  { key: "avgChallenge", label: "Challenge", fullLabel: "Challenge" },
  { key: "avgValue", label: "Value", fullLabel: "Value" },
  { key: "avgWalkability", label: "Walk.", fullLabel: "Walkability" },
  { key: "avgPace", label: "Pace", fullLabel: "Pace" },
  { key: "avgAmenities", label: "Amen.", fullLabel: "Amenities" },
  { key: "avgService", label: "Service", fullLabel: "Service" },
];

function RadarChart({ scores }: { scores: Record<string, number> }) {
  const n = RADAR_DIMENSIONS.length;
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 78;

  const angleStep = (2 * Math.PI) / n;
  const getPoint = (i: number, radius: number) => {
    const angle = i * angleStep - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPath = (level: number) => {
    const pts = RADAR_DIMENSIONS.map((_, i) => getPoint(i, level * r));
    return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + "Z";
  };

  const dataPath = () => {
    const pts = RADAR_DIMENSIONS.map((dim, i) => {
      const val = scores[dim.key] ?? 0;
      return getPoint(i, (val / 10) * r);
    });
    return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + "Z";
  };

  const hasData = RADAR_DIMENSIONS.some((d) => (scores[d.key] ?? 0) > 0);
  if (!hasData) return null;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[220px] mx-auto">
      {gridLevels.map((level) => (
        <path key={level} d={gridPath(level)} fill="none" stroke="var(--cg-border)" strokeWidth="0.5" />
      ))}
      {RADAR_DIMENSIONS.map((_, i) => {
        const pt = getPoint(i, r);
        return <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="var(--cg-border)" strokeWidth="0.5" />;
      })}
      <path d={dataPath()} fill="rgba(34,197,94,0.2)" stroke="var(--cg-accent)" strokeWidth="1.5" />
      {RADAR_DIMENSIONS.map((dim, i) => {
        const pt = getPoint(i, r + 16);
        return (
          <text key={dim.key} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="var(--cg-text-muted)">
            {dim.label}
          </text>
        );
      })}
    </svg>
  );
}

/* ─── Score Dimension Bar ─── */

function ScoreDimRow({ label, value }: { label: string; value: number | null }) {
  if (!value) return null;
  const pct = Math.min(100, (value / 10) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs" style={mutedText}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "var(--cg-accent)" }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold tabular-nums" style={primaryText}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

/* ─── Info Row helper ─── */

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined) return null;
  const display = typeof value === "string" ? safeText(value) : value;
  if (display === null) return null;
  return (
    <div>
      <dt className="mb-0.5 text-xs" style={mutedText}>{label}</dt>
      <dd className="font-medium text-sm" style={primaryText}>{display}</dd>
    </div>
  );
}

/* ─── Section Heading ─── */

function SectionHeading({ icon, children, lastUpdated }: { icon?: React.ReactNode; children: React.ReactNode; lastUpdated?: string | Date | null }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-display text-xl font-semibold flex items-center gap-2" style={sectionTitle}>
        {icon}
        {children}
      </h2>
      {lastUpdated && <LastUpdated date={lastUpdated} />}
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-base font-semibold mb-3 flex items-center gap-2" style={sectionTitle}>
      {children}
    </h3>
  );
}

/* ─── Intelligence Note Card ─── */

const NOTE_ICONS: Record<string, React.ReactNode> = {
  Calendar: <Calendar className="h-4 w-4" />,
  Lightbulb: <Lightbulb className="h-4 w-4" />,
  Map: <Map className="h-4 w-4" />,
  Flag: <Flag className="h-4 w-4" />,
  Compass: <Compass className="h-4 w-4" />,
  DollarSign: <DollarSign className="h-4 w-4" />,
};

function IntelligenceNoteCard({ note }: { note: { id: number; category: string; title: string; content: string; icon?: string | null } }) {
  const icon = note.icon ? NOTE_ICONS[note.icon] || <Lightbulb className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />;

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{
        backgroundColor: "var(--cg-bg-secondary)",
        border: "1px solid var(--cg-border)",
      }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--cg-accent)" }}>{icon}</span>
        <h4 className="text-sm font-semibold" style={primaryText}>{note.title}</h4>
      </div>
      <p className="text-xs leading-relaxed" style={secondaryText}>{note.content}</p>
    </div>
  );
}

/* ─── Weather Bar Chart ─── */

function WeatherChart({ weatherData }: { weatherData: Record<string, any> }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const data = months.map((m) => ({ month: m, ...(weatherData[m] || {}) })).filter((d) => d.avg_high != null);
  if (data.length === 0) return null;
  const maxTemp = Math.max(...data.map((d) => d.avg_high || 0));
  const barWidth = 100 / data.length;

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: 120 }}>
        {data.map((d) => {
          const highPct = maxTemp > 0 ? ((d.avg_high || 0) / maxTemp) * 100 : 0;
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] tabular-nums" style={mutedText}>{d.avg_high ? `${Math.round(d.avg_high)}°` : ""}</span>
              <div className="w-full rounded-t" style={{
                height: `${highPct}%`,
                minHeight: 4,
                backgroundColor: "var(--cg-accent)",
                opacity: 0.7,
              }} />
              <span className="text-[9px]" style={mutedText}>{d.month}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs" style={mutedText}>
        {data[0]?.rain_inches != null && (
          <span className="flex items-center gap-1"><CloudRain className="h-3 w-3" /> Avg rain shown per month</span>
        )}
        {data[0]?.wind_mph != null && (
          <span className="flex items-center gap-1"><Wind className="h-3 w-3" /> Wind data available</span>
        )}
      </div>
    </div>
  );
}

/* ─── Hole Card ─── */

function HoleCard({ title, holeData, accent }: { title: string; holeData: any; accent: string }) {
  if (!holeData) return null;
  const hole = typeof holeData === "object" ? holeData : null;
  if (!hole) return null;
  return (
    <div className="rounded-xl p-4" style={{
      backgroundColor: "var(--cg-bg-secondary)",
      border: `1px solid ${accent}33`,
    }}>
      <div className="flex items-center gap-2 mb-2">
        <Flag className="h-4 w-4" style={{ color: accent }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>{title}</span>
      </div>
      {hole.hole && (
        <div className="text-lg font-bold mb-1" style={primaryText}>Hole {hole.hole}</div>
      )}
      {hole.notes && (
        <p className="text-sm leading-relaxed" style={secondaryText}>{hole.notes}</p>
      )}
    </div>
  );
}

/* ─── TABS ─── */

const TABS = ["Overview", "Insider Tips", "Travel & Stay", "Reviews"] as const;
type Tab = (typeof TABS)[number];

/* ════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════ */

export function CourseDetailClient({ course }: { course: any }) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [travelSubTab, setTravelSubTab] = useState<string>("overview");

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
    return wSum > 0 ? (weighted / wSum) * 10 : null; // scale to 0-100
  }, [radarScores, weights, hasDimensions, totalWeight]);

  const updateWeight = (key: string, val: number) => {
    setWeights((prev) => ({ ...prev, [key]: val }));
  };

  /* ── Derived data ── */
  const activeMedia = course.media?.filter((m: any) => m.isActive !== false);
  const primaryImage = activeMedia?.find((m: any) => m.isPrimary) ?? activeMedia?.[0];
  const location = [course.city, course.state].filter(Boolean).join(", ");
  const maxTeeYardage = course.teeBoxes?.[0]?.totalYardage;
  const championshipHistory = Array.isArray(course.championshipHistory) ? course.championshipHistory : [];
  const famousMoments = Array.isArray(course.famousMoments) ? course.famousMoments : [];
  const insiderTips = Array.isArray(course.insiderTips) ? course.insiderTips : [];
  const practiceFacilities = Array.isArray(course.practiceFacilities) ? course.practiceFacilities : [];
  const nearbyDining = course.nearbyDining || [];
  const nearbyLodging = course.nearbyLodging || [];
  const nearbyAttractions = course.nearbyAttractions || [];
  const nearbyRvParks = course.nearbyRvParks || [];
  const nearbyCourses = course.nearbyCourses || [];

  /* ─────────── RENDER ─────────── */

  return (
    <div style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      {/* ══════ BREADCRUMBS ══════ */}
      <nav className="mx-auto max-w-7xl px-4 py-3" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-xs" style={{ color: "var(--cg-text-muted)" }}>
          <li>
            <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: "var(--cg-text-muted)" }}>
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
          </li>
          <li><ChevronRight className="h-3 w-3" /></li>
          <li>
            <Link href="/discover" className="hover:opacity-80 transition-opacity" style={{ color: "var(--cg-text-muted)" }}>
              Courses
            </Link>
          </li>
          <li><ChevronRight className="h-3 w-3" /></li>
          <li className="truncate max-w-[200px]" style={{ color: "var(--cg-text-secondary)" }}>
            {course.courseName || "Course"}
          </li>
        </ol>
      </nav>

      {/* ══════ HERO ══════ */}
      <div className="relative overflow-hidden" style={{ minHeight: primaryImage ? undefined : 200 }}>
        {primaryImage ? (
          <>
            <div className="aspect-[21/9] max-h-[480px] w-full">
              <img
                src={primaryImage.url}
                alt={course.courseName}
                className="h-full w-full object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
            {primaryImage.credit && (
              <div className="absolute bottom-3 right-3 z-10 rounded px-2 py-1 text-xs text-white/90 bg-black/50 backdrop-blur-sm">
                Photo: {primaryImage.credit}
              </div>
            )}
          </>
        ) : (
          <div className="h-48 md:h-64">
            <CoursePlaceholder
              courseName={course.courseName}
              courseStyle={course.courseStyle}
              size="card"
            />
          </div>
        )}

        {/* Hero badges - top left */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-2">
          {course.accessType && (
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={accessBadgeStyle(course.accessType)}>
              {course.accessType}
            </span>
          )}
          {course.priceTier && (
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{
              backgroundColor: "rgba(234,179,8,0.15)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.3)",
            }}>
              {course.priceTier}
            </span>
          )}
        </div>

        {/* CF Score ring + Bucket List - top right */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2">
          <BucketListButton courseId={course.courseId} courseName={course.courseName} size="lg" />
          {scoreNum !== null && (
            <div
              className="flex items-center justify-center rounded-full h-16 w-16 text-lg font-bold shadow-lg"
              style={{
                backgroundColor: scoreNum >= 80 ? "var(--cg-accent)" : scoreNum >= 50 ? "#eab308" : "var(--cg-bg-card)",
                color: scoreNum >= 50 ? "white" : "var(--cg-text-primary)",
              }}
            >
              {Math.round(scoreNum)}
            </div>
          )}
        </div>

        {/* Hero text - bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 md:px-6 md:pb-6">
          <div className="mx-auto max-w-7xl">
            <h1 className="font-display text-3xl font-bold text-white md:text-4xl lg:text-5xl drop-shadow-lg">
              {course.courseName}
            </h1>
            {course.tagline && (
              <p className="mt-1 text-base text-white/80 italic">{course.tagline}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/90">
              {(location || course.country) && (
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{location}{course.country && location ? `, ${course.country}` : course.country || ""}</span>
              )}
              {course.par != null && <span>Par {course.par}</span>}
              {maxTeeYardage != null && <span>{Number(maxTeeYardage).toLocaleString()} yards</span>}
              {course.numHoles != null && <span>{course.numHoles} holes</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ══════ ARCHITECT CARD — HERO AREA ══════ */}
      {(course.architect || safeText(course.originalArchitect)) && (
        <div className="mx-auto max-w-7xl px-4 -mt-6 relative z-10">
          <div
            className="rounded-xl p-4 flex items-center gap-4 backdrop-blur-sm"
            style={{
              backgroundColor: "rgba(26,26,26,0.95)",
              border: "1px solid var(--cg-border)",
            }}
          >
            {/* Architect avatar */}
            {course.architect?.portraitUrl || course.architect?.imageUrl ? (
              <img
                src={course.architect.portraitUrl || course.architect.imageUrl}
                alt={course.architect?.name || course.originalArchitect}
                className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
                style={{ border: "1px solid var(--cg-border)" }}
              />
            ) : (
              <div
                className="h-14 w-14 rounded-lg flex items-center justify-center flex-shrink-0 text-lg font-bold"
                style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-accent)" }}
              >
                <Pencil className="h-6 w-6" />
              </div>
            )}

            {/* Architect info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--cg-text-muted)" }}>
                  Designed by
                </span>
                {course.architect?.era && (
                  <span
                    className="text-[10px] rounded-full px-2 py-0.5 font-medium"
                    style={{ backgroundColor: "rgba(46,204,113,0.15)", color: "#2ECC71", border: "1px solid rgba(46,204,113,0.3)" }}
                  >
                    {course.architect.era}
                  </span>
                )}
              </div>
              {course.architect?.slug ? (
                <Link
                  href={`/architects/${course.architect.slug}`}
                  className="font-semibold text-base transition-colors hover:underline mt-0.5 block truncate"
                  style={{ color: "#2ECC71" }}
                >
                  {course.architect?.name || course.originalArchitect}
                </Link>
              ) : (
                <div className="font-semibold text-base mt-0.5 truncate" style={{ color: "var(--cg-text-primary)" }}>
                  {course.originalArchitect}
                </div>
              )}
              {course.architect?.totalCoursesDesigned && (
                <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                  {course.architect.totalCoursesDesigned} courses designed
                </span>
              )}
            </div>

            {/* Arrow link */}
            {course.architect?.slug && (
              <Link
                href={`/architects/${course.architect.slug}`}
                className="flex items-center justify-center h-10 w-10 rounded-lg shrink-0 transition-colors hover:opacity-80"
                style={{ backgroundColor: "rgba(46,204,113,0.15)", color: "#2ECC71" }}
              >
                <ArrowRight className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ══════ TAB BAR ══════ */}
      <div className="sticky top-0 z-30 mt-4" style={{ backgroundColor: "var(--cg-bg-primary)", borderBottom: "1px solid var(--cg-border)" }}>
        <div className="mx-auto max-w-7xl px-4">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="shrink-0 px-4 py-3 text-sm font-medium transition-colors relative"
                style={{
                  color: activeTab === tab ? "var(--cg-accent)" : "var(--cg-text-muted)",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: "var(--cg-accent)" }} />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ══════ TAB CONTENT ══════ */}
      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* ────── OVERVIEW TAB ────── */}
        {activeTab === "Overview" && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-8">

              {/* About */}
              {safeText(course.description) && (
                <section style={cardStyle}>
                  <SectionHeading lastUpdated={course.updatedAt}>About {course.courseName}</SectionHeading>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--cg-text-secondary)", lineHeight: "1.75" }}>
                    {safeText(course.description)}
                  </p>
                </section>
              )}

              {/* Course Information */}
              <section style={cardStyle}>
                <SectionHeading lastUpdated={course.updatedAt}>Course Information</SectionHeading>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <InfoRow label="Style" value={safeText(course.courseStyle)} />
                  <InfoRow label="Access" value={safeText(course.accessType)} />
                  <InfoRow label="Holes" value={course.numHoles} />
                  <InfoRow label="Par" value={course.par} />
                  <InfoRow label="Architect" value={
                    safeText(course.originalArchitect) ? (
                      <Link
                        href={`/architects/${course.originalArchitect.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}
                        className="transition-colors hover:underline"
                        style={{ color: "var(--cg-accent)" }}
                      >
                        {course.originalArchitect}
                      </Link>
                    ) : null
                  } />
                  <InfoRow label="Year Opened" value={course.yearOpened} />
                  <InfoRow label="Renovation" value={
                    safeText(course.renovationArchitect)
                      ? `${safeText(course.renovationArchitect)}${safeText(course.renovationYear) ? ` (${safeText(course.renovationYear)})` : ""}`
                      : null
                  } />
                  <InfoRow label="Walking" value={safeText(course.walkingPolicy)} />
                  <InfoRow label="Dress Code" value={safeText(course.dressCode)} />
                  <InfoRow label="Caddie" value={
                    safeText(course.caddieAvailability)
                      ? `${safeText(course.caddieAvailability)}${safeText(course.caddieFee) ? ` — ${safeText(course.caddieFee)}` : ""}`
                      : null
                  } />
                  <InfoRow label="Cart Policy" value={
                    safeText(course.cartPolicy)
                      ? `${safeText(course.cartPolicy)}${safeText(course.cartFee) ? ` — ${safeText(course.cartFee)}` : ""}`
                      : null
                  } />
                  <InfoRow label="Green Fees" value={
                    (course.greenFeeLow || course.greenFeeHigh)
                      ? `${formatCurrency(course.greenFeeLow)}${course.greenFeeHigh && course.greenFeeLow !== course.greenFeeHigh ? ` – ${formatCurrency(course.greenFeeHigh)}` : ""}`
                      : null
                  } />
                  <InfoRow label="Club Rental" value={course.clubRentalAvailable != null ? (course.clubRentalAvailable ? "Available" : "Not available") : null} />
                  <InfoRow label="Cell Phone" value={safeText(course.cellPhonePolicy)} />
                </dl>

                {/* Practice Facilities */}
                {practiceFacilities.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-sm font-semibold mb-2" style={secondaryText}>Practice Facilities</h3>
                    <div className="flex flex-wrap gap-2">
                      {practiceFacilities.map((f: any, i: number) => {
                        const label = typeof f === 'string' ? f : (f.details || f.type || 'Facility');
                        return (
                          <span key={i} className="rounded-full px-3 py-1 text-xs" style={{
                            backgroundColor: "var(--cg-bg-tertiary)",
                            color: "var(--cg-text-secondary)",
                            border: "1px solid var(--cg-border)",
                          }}>
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tee Boxes */}
                {course.teeBoxes?.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-sm font-semibold mb-3" style={secondaryText}>Tee Boxes</h3>
                    <div className="flex flex-wrap gap-2">
                      {course.teeBoxes.map((tee: any) => (
                        <div key={tee.teeId} className="rounded-lg px-3 py-2 text-xs" style={{
                          backgroundColor: "var(--cg-bg-tertiary)", border: "1px solid var(--cg-border)",
                        }}>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {tee.color && (
                              <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: tee.color.toLowerCase() }} />
                            )}
                            <span className="font-semibold" style={primaryText}>{tee.teeName}</span>
                          </div>
                          {tee.totalYardage && <div style={mutedText}>{Number(tee.totalYardage).toLocaleString()} yds</div>}
                          {tee.courseRating && tee.slopeRating && (
                            <div style={mutedText}>{parseFloat(tee.courseRating).toFixed(1)} / {tee.slopeRating}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

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

              {/* Rankings */}
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

              {/* Championship History */}
              {(championshipHistory.length > 0 || famousMoments.length > 0) && (
                <section style={cardStyle}>
                  <SectionHeading icon={<Calendar className="h-5 w-5" style={{ color: "#f59e0b" }} />}>
                    Championship History
                  </SectionHeading>

                  {championshipHistory.length > 0 && (
                    <div className="space-y-3 mb-6">
                      {championshipHistory.map((evt: any, i: number) => (
                        <div key={i} className="flex items-start gap-4 rounded-lg px-4 py-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                          <span className="text-lg font-bold tabular-nums shrink-0" style={{ color: "var(--cg-accent)" }}>
                            {evt.year}
                          </span>
                          <div>
                            <div className="font-medium text-sm" style={primaryText}>{evt.event}</div>
                            {evt.winner && <div className="text-xs mt-0.5" style={mutedText}>Winner: {evt.winner}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {famousMoments.length > 0 && (
                    <div>
                      <SubHeading>Famous Moments</SubHeading>
                      <ul className="space-y-2">
                        {famousMoments.map((moment: any, i: number) => {
                          const text = typeof moment === 'string' ? moment : (moment.year ? `${moment.year}: ${moment.description}` : moment.description || String(moment));
                          return (
                            <li key={i} className="flex items-start gap-2 text-sm" style={secondaryText}>
                              <Star className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                              {text}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              {/* Photo Gallery */}
              <section style={cardStyle}>
                <SectionHeading icon={<Camera className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />}>Photos</SectionHeading>
                {course.media?.length > 1 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {course.media.slice(0, 9).map((m: any) => (
                      <div key={m.mediaId} className="aspect-[4/3] overflow-hidden rounded-lg" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
                        <img
                          src={m.url}
                          alt={m.caption || course.courseName}
                          className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Image className="h-10 w-10" />}
                    title="Photos coming soon"
                    description="Course photos will be added as they become available"
                  />
                )}
              </section>

              {/* Course Intelligence */}
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

              {/* About the Architect */}
              {safeText(course.originalArchitect) && (
                <section style={cardStyle}>
                  <SectionHeading icon={<Pencil className="h-5 w-5" style={{ color: "#2ECC71" }} />}>
                    About the Architect
                  </SectionHeading>
                  <div className="flex items-start gap-4">
                    {course.architect?.portraitUrl || course.architect?.imageUrl ? (
                      <img
                        src={course.architect.portraitUrl || course.architect.imageUrl}
                        alt={course.architect?.name || course.originalArchitect}
                        className="h-20 w-20 rounded-xl object-cover flex-shrink-0"
                        style={{ border: "1px solid var(--cg-border)" }}
                      />
                    ) : (
                      <div
                        className="h-20 w-20 rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-bold"
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
                            className="font-semibold text-base transition-colors hover:underline"
                            style={{ color: "#2ECC71" }}
                          >
                            {course.architect?.name || course.originalArchitect}
                          </Link>
                        ) : (
                          <span className="font-semibold text-base" style={{ color: "var(--cg-text-primary)" }}>
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
                      {course.architect?.bio && (
                        <p className="text-sm leading-relaxed line-clamp-3" style={secondaryText}>{course.architect.bio}</p>
                      )}
                      {course.architect?.designPhilosophy && (
                        <p className="text-xs mt-2 italic line-clamp-2" style={mutedText}>
                          &ldquo;{course.architect.designPhilosophy}&rdquo;
                        </p>
                      )}
                      {course.architect?.slug && (
                        <Link
                          href={`/architects/${course.architect.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-medium mt-2 transition-colors hover:opacity-80"
                          style={{ color: "#2ECC71" }}
                        >
                          View full profile <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* More by This Architect */}
              {course.architectCourses?.length > 0 && course.architect && (
                <section style={cardStyle}>
                  <SectionHeading icon={<Award className="h-5 w-5" style={{ color: "#2ECC71" }} />}>
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
                  {course.architect?.slug && (
                    <div className="mt-4 text-center">
                      <Link
                        href={`/architects/${course.architect.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
                        style={{ color: "#2ECC71" }}
                      >
                        View all courses by {course.architect.name || course.originalArchitect} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </section>
              )}

              {/* Articles, Media & Books for this Course */}
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
                    {/* Big score display */}
                    <div className="flex items-center justify-center mb-5">
                      <div className="flex items-center justify-center rounded-full h-20 w-20 text-2xl font-bold" style={{
                        backgroundColor: equalizerScore && equalizerScore >= 80 ? "var(--cg-accent)" : equalizerScore && equalizerScore >= 50 ? "#eab308" : "var(--cg-bg-tertiary)",
                        color: equalizerScore && equalizerScore >= 50 ? "white" : "var(--cg-text-primary)",
                      }}>
                        {equalizerScore != null ? Math.round(equalizerScore) : "—"}
                      </div>
                    </div>

                    {/* Radar */}
                    <div className="mb-5">
                      <RadarChart scores={radarScores} />
                    </div>

                    {/* Sliders */}
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

              {/* Nearby Airports */}
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
        )}

        {/* ────── INSIDER TIPS TAB ────── */}
        {activeTab === "Insider Tips" && (
          <div className="max-w-3xl space-y-8">

            {/* Empty state for entire tab */}
            {!safeText(course.howToGetOn) && !safeText(course.resortAffiliateAccess) && !safeText(course.guestPolicy) &&
             insiderTips.length === 0 && !safeText(course.courseStrategy) && !safeText(course.whatToExpect) &&
             !safeText(course.bestTimeToPlay) && !course.weatherData && !safeText(course.bestConditionMonths) &&
             !safeText(course.fairwayGrass) && !safeText(course.greenGrass) && !safeText(course.greenSpeed) &&
             !safeText(course.aerationSchedule) && !safeText(course.golfSeason) && !safeText(course.paceOfPlayNotes) && (
              <section style={cardStyle}>
                <EmptyState
                  icon={<Brain className="h-8 w-8" />}
                  title="Course Intelligence coming soon"
                  description="Our team is gathering insider tips, strategy notes, and local knowledge for this course"
                />
              </section>
            )}

            {/* How to Get On */}
            {(safeText(course.howToGetOn) || safeText(course.resortAffiliateAccess) || safeText(course.guestPolicy)) && (
              <section style={cardStyle}>
                <SectionHeading icon={<Compass className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />} lastUpdated={course.updatedAt}>
                  How to Get On
                </SectionHeading>
                {safeText(course.howToGetOn) && (
                  <p className="text-sm leading-relaxed mb-4" style={secondaryText}>{safeText(course.howToGetOn)}</p>
                )}
                {safeText(course.resortAffiliateAccess) && (
                  <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                    <span className="text-xs font-semibold" style={mutedText}>Resort / Affiliate Access</span>
                    <p className="text-sm mt-1" style={primaryText}>{safeText(course.resortAffiliateAccess)}</p>
                  </div>
                )}
                {safeText(course.guestPolicy) && (
                  <div className="rounded-lg p-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                    <span className="text-xs font-semibold" style={mutedText}>Guest Policy</span>
                    <p className="text-sm mt-1" style={primaryText}>{safeText(course.guestPolicy)}</p>
                  </div>
                )}
              </section>
            )}

            {/* Insider Tips */}
            {insiderTips.length > 0 && (
              <section style={cardStyle}>
                <SectionHeading icon={<Lightbulb className="h-5 w-5" style={{ color: "#fbbf24" }} />}>
                  Insider Tips
                </SectionHeading>
                <ol className="space-y-3">
                  {insiderTips.map((tip: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                      <span className="flex items-center justify-center h-6 w-6 rounded-full shrink-0 text-xs font-bold" style={{
                        backgroundColor: "rgba(234,179,8,0.15)", color: "#fbbf24",
                      }}>
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed" style={secondaryText}>{tip}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Course Strategy */}
            {safeText(course.courseStrategy) && (
              <section style={cardStyle}>
                <SectionHeading icon={<Map className="h-5 w-5" style={{ color: "#60a5fa" }} />}>
                  Course Strategy
                </SectionHeading>
                <p className="text-sm leading-relaxed" style={secondaryText}>{safeText(course.courseStrategy)}</p>
              </section>
            )}

            {/* What to Expect */}
            {safeText(course.whatToExpect) && (
              <section style={cardStyle}>
                <SectionHeading icon={<Flag className="h-5 w-5" style={{ color: "#c084fc" }} />}>
                  What to Expect
                </SectionHeading>
                <p className="text-sm leading-relaxed" style={secondaryText}>{safeText(course.whatToExpect)}</p>
              </section>
            )}

            {/* Best Time to Play & Weather */}
            {(safeText(course.bestTimeToPlay) || course.weatherData || safeText(course.bestConditionMonths)) && (
              <section style={cardStyle}>
                <SectionHeading icon={<Sun className="h-5 w-5" style={{ color: "#fbbf24" }} />}>
                  Best Time to Play
                </SectionHeading>
                {safeText(course.bestTimeToPlay) && (
                  <p className="text-sm leading-relaxed mb-4" style={secondaryText}>{safeText(course.bestTimeToPlay)}</p>
                )}
                {safeText(course.bestConditionMonths) && (
                  <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                    <span className="text-xs font-semibold" style={mutedText}>Best Condition Months</span>
                    <p className="text-sm mt-1" style={primaryText}>{safeText(course.bestConditionMonths)}</p>
                  </div>
                )}
                {course.weatherData && typeof course.weatherData === "object" && (
                  <div>
                    <SubHeading>Average Monthly Temperatures</SubHeading>
                    <WeatherChart weatherData={course.weatherData} />
                  </div>
                )}
              </section>
            )}

            {/* Conditions */}
            {(safeText(course.fairwayGrass) || safeText(course.greenGrass) || safeText(course.greenSpeed) || safeText(course.aerationSchedule) || safeText(course.golfSeason)) && (
              <section style={cardStyle}>
                <SectionHeading icon={<Leaf className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />}>
                  Course Conditions
                </SectionHeading>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <InfoRow label="Fairway Grass" value={safeText(course.fairwayGrass)} />
                  <InfoRow label="Green Grass" value={safeText(course.greenGrass)} />
                  <InfoRow label="Green Speed" value={safeText(course.greenSpeed)} />
                  <InfoRow label="Aeration Schedule" value={safeText(course.aerationSchedule)} />
                  <InfoRow label="Golf Season" value={safeText(course.golfSeason)} />
                </dl>
              </section>
            )}

            {/* Pace of Play */}
            {safeText(course.paceOfPlayNotes) && (
              <section style={cardStyle}>
                <SectionHeading icon={<Clock className="h-5 w-5" style={{ color: "#60a5fa" }} />}>
                  Pace of Play
                </SectionHeading>
                <p className="text-sm leading-relaxed" style={secondaryText}>{safeText(course.paceOfPlayNotes)}</p>
              </section>
            )}

            {/* Course Intelligence badge */}
            <div className="flex justify-end">
              <PoweredByBadge variant="intelligence" />
            </div>
          </div>
        )}

        {/* ────── TRAVEL & STAY TAB ────── */}
        {activeTab === "Travel & Stay" && (() => {
          const poiSubTabs = [
            { key: "overview", label: "Overview", icon: <Plane className="h-4 w-4" /> },
            { key: "dining", label: "Dining", icon: <Utensils className="h-4 w-4" />, count: nearbyDining.length },
            { key: "lodging", label: "Lodging", icon: <Bed className="h-4 w-4" />, count: nearbyLodging.length },
            { key: "attractions", label: "Attractions", icon: <Compass className="h-4 w-4" />, count: nearbyAttractions.length },
            { key: "rv", label: "RV Parks", icon: <Truck className="h-4 w-4" />, count: nearbyRvParks.length },
          ];
          return (
          <div className="space-y-6">
            {/* Sub-navigation tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
              {poiSubTabs.map((tab) => {
                const isActive = (travelSubTab || "overview") === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setTravelSubTab(tab.key)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0"
                    style={{
                      backgroundColor: isActive ? "rgba(74,222,128,0.15)" : "transparent",
                      color: isActive ? "#4ade80" : "var(--cg-text-muted)",
                      border: isActive ? "1px solid rgba(74,222,128,0.3)" : "1px solid transparent",
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="text-[10px] rounded-full px-1.5 py-0.5 ml-0.5" style={{
                        backgroundColor: isActive ? "rgba(74,222,128,0.2)" : "var(--cg-bg-tertiary)",
                        color: isActive ? "#4ade80" : "var(--cg-text-muted)",
                      }}>{tab.count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Overview sub-tab ── */}
            {(travelSubTab || "overview") === "overview" && (
              <div className="grid gap-8 lg:grid-cols-2">
                {!course.airports?.length && nearbyCourses.length === 0 &&
                 nearbyLodging.length === 0 && nearbyDining.length === 0 &&
                 nearbyAttractions.length === 0 && nearbyRvParks.length === 0 && (
                  <div className="lg:col-span-2">
                    <section style={cardStyle}>
                      <EmptyState
                        icon={<Briefcase className="h-8 w-8" />}
                        title="Trip planning data being curated"
                        description="We're gathering airport proximity, lodging, dining, and attraction recommendations for this course"
                      />
                    </section>
                  </div>
                )}

                {/* Left column */}
                <div className="space-y-8">
                  {/* Getting There */}
                  {course.airports?.length > 0 && (
                    <section style={cardStyle}>
                      <SectionHeading icon={<Plane className="h-5 w-5" style={{ color: "#60a5fa" }} />}>
                        Getting There
                      </SectionHeading>
                      <div className="space-y-3">
                        {course.airports.slice(0, 8).map((a: any) => (
                          <div key={a.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                            <div>
                              <div className="font-medium text-sm" style={primaryText}>
                                {a.airport.iataCode ? `${a.airport.iataCode} — ` : ""}{a.airport.airportName}
                              </div>
                              <div className="text-xs" style={mutedText}>{a.airport.airportType}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-sm" style={secondaryText}>
                                {parseFloat(a.distanceMiles).toFixed(0)} mi
                              </div>
                              {a.driveTimeMinutes && <div className="text-xs" style={mutedText}>{a.driveTimeMinutes} min</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Nearby Courses */}
                  {nearbyCourses.length > 0 && (
                    <section style={cardStyle}>
                      <SectionHeading icon={<Flag className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />}>
                        Nearby Courses
                      </SectionHeading>
                      <div className="space-y-3">
                        {nearbyCourses.map((nc: any) => {
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
                                {nc.driveTimeMinutes && <div className="text-xs" style={mutedText}>{nc.driveTimeMinutes} min</div>}
                              </div>
                              <ChevronRight className="h-4 w-4 shrink-0" style={mutedText} />
                            </a>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </div>

                {/* Right column — quick glance cards */}
                <div className="space-y-8">
                  {/* Lodging preview */}
                  {nearbyLodging.length > 0 && (
                    <section style={cardStyle}>
                      <div className="flex items-center justify-between mb-4">
                        <SectionHeading icon={<Bed className="h-5 w-5" style={{ color: "#c084fc" }} />}>
                          Where to Stay
                        </SectionHeading>
                        <button onClick={() => setTravelSubTab("lodging")} className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: "var(--cg-accent)" }}>
                          View all <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {nearbyLodging.slice(0, 3).map((lodge: any) => (
                          <div key={lodge.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate" style={primaryText}>{lodge.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                {lodge.lodgingType && <span className="text-[10px]" style={mutedText}>{lodge.lodgingType}</span>}
                                {lodge.isOnSite && (
                                  <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{
                                    backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80",
                                  }}>On-Site</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {lodge.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3" style={{ color: "#f59e0b" }} />
                                  <span className="text-xs font-medium" style={primaryText}>{parseFloat(lodge.rating).toFixed(1)}</span>
                                </div>
                              )}
                              {lodge.priceTier && <div className="text-xs" style={{ color: "#fbbf24" }}>{lodge.priceTier}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Dining preview */}
                  {nearbyDining.length > 0 && (
                    <section style={cardStyle}>
                      <div className="flex items-center justify-between mb-4">
                        <SectionHeading icon={<Utensils className="h-5 w-5" style={{ color: "#f59e0b" }} />}>
                          Where to Eat
                        </SectionHeading>
                        <button onClick={() => setTravelSubTab("dining")} className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: "var(--cg-accent)" }}>
                          View all <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {nearbyDining.slice(0, 3).map((dining: any) => (
                          <div key={dining.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate" style={primaryText}>{dining.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                {dining.cuisineType && <span className="text-[10px]" style={mutedText}>{dining.cuisineType}</span>}
                                {dining.isOnSite && (
                                  <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{
                                    backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80",
                                  }}>On-Site</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {dining.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3" style={{ color: "#f59e0b" }} />
                                  <span className="text-xs font-medium" style={primaryText}>{parseFloat(dining.rating).toFixed(1)}</span>
                                </div>
                              )}
                              {dining.priceLevel && <div className="text-xs" style={{ color: "#fbbf24" }}>{dining.priceLevel}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Attractions preview */}
                  {nearbyAttractions.length > 0 && (
                    <section style={cardStyle}>
                      <div className="flex items-center justify-between mb-4">
                        <SectionHeading icon={<Compass className="h-5 w-5" style={{ color: "#60a5fa" }} />}>
                          What to Do
                        </SectionHeading>
                        <button onClick={() => setTravelSubTab("attractions")} className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: "var(--cg-accent)" }}>
                          View all <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {nearbyAttractions.slice(0, 3).map((attr: any) => (
                          <div key={attr.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate" style={primaryText}>{attr.name}</div>
                              {attr.category && <div className="text-[10px] mt-0.5" style={mutedText}>{attr.category}</div>}
                            </div>
                            {attr.distanceMiles && (
                              <span className="text-xs shrink-0" style={mutedText}>{parseFloat(attr.distanceMiles).toFixed(1)} mi</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}

            {/* ── Dining sub-tab ── */}
            {travelSubTab === "dining" && (
              <div>
                {nearbyDining.length === 0 ? (
                  <section style={cardStyle}>
                    <EmptyState icon={<Utensils className="h-8 w-8" />} title="No dining data yet" description="Restaurant recommendations are being curated for this course" />
                  </section>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {nearbyDining.map((dining: any) => (
                      <div key={dining.id} className="rounded-xl p-5" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="font-medium text-sm" style={primaryText}>{dining.name}</div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {dining.cuisineType && (
                                <span className="text-[10px] rounded-full px-2 py-0.5" style={{
                                  backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)",
                                }}>{dining.cuisineType}</span>
                              )}
                              {dining.isOnSite && (
                                <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{
                                  backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)",
                                }}>On-Site</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {dining.priceLevel && <div className="text-sm" style={{ color: "#fbbf24" }}>{dining.priceLevel}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mb-2 text-xs">
                          {dining.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" style={{ color: "#f59e0b" }} />
                              <span style={primaryText}>{parseFloat(dining.rating).toFixed(1)}</span>
                            </span>
                          )}
                          {dining.distanceMiles && <span style={mutedText}>{parseFloat(dining.distanceMiles).toFixed(1)} mi</span>}
                        </div>
                        {dining.description && <p className="text-xs leading-relaxed" style={mutedText}>{dining.description}</p>}
                        {(dining.websiteUrl || dining.phone) && (
                          <div className="flex gap-3 mt-3">
                            {dining.websiteUrl && (
                              <a href={dining.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 hover:opacity-80" style={secondaryText}>
                                Website <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {dining.phone && (
                              <a href={`tel:${dining.phone}`} className="text-xs flex items-center gap-1 hover:opacity-80" style={secondaryText}>
                                <Phone className="h-3 w-3" /> {dining.phone}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Lodging sub-tab ── */}
            {travelSubTab === "lodging" && (
              <div>
                {nearbyLodging.length === 0 ? (
                  <section style={cardStyle}>
                    <EmptyState icon={<Bed className="h-8 w-8" />} title="No lodging data yet" description="Hotel and lodging recommendations are being curated for this course" />
                  </section>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {nearbyLodging.map((lodge: any) => (
                      <div key={lodge.id} className="rounded-xl p-5" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="font-medium text-sm" style={primaryText}>{lodge.name}</div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {lodge.lodgingType && (
                                <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{
                                  backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)",
                                }}>{lodge.lodgingType}</span>
                              )}
                              {lodge.isOnSite && (
                                <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{
                                  backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)",
                                }}>On-Site</span>
                              )}
                              {lodge.isPartner && (
                                <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{
                                  backgroundColor: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)",
                                }}>Partner</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {lodge.priceTier && <div className="text-sm font-medium" style={{ color: "#fbbf24" }}>{lodge.priceTier}</div>}
                            {lodge.avgPricePerNight && <div className="text-xs" style={mutedText}>${lodge.avgPricePerNight}/night</div>}
                          </div>
                        </div>
                        {lodge.rating && (
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="h-3 w-3" style={{ color: "#f59e0b" }} />
                            <span className="text-xs font-medium" style={primaryText}>{parseFloat(lodge.rating).toFixed(1)}</span>
                            {lodge.distanceMiles && (
                              <span className="text-xs ml-2" style={mutedText}>{parseFloat(lodge.distanceMiles).toFixed(1)} mi away</span>
                            )}
                          </div>
                        )}
                        {lodge.description && <p className="text-xs leading-relaxed" style={mutedText}>{lodge.description}</p>}
                        {(lodge.websiteUrl || lodge.bookingUrl) && (
                          <div className="flex gap-2 mt-3">
                            {lodge.bookingUrl && (
                              <a href={lodge.bookingUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: "var(--cg-accent)" }}>
                                Book <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {lodge.websiteUrl && (
                              <a href={lodge.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 hover:opacity-80" style={secondaryText}>
                                Website <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Attractions sub-tab ── */}
            {travelSubTab === "attractions" && (
              <div>
                {nearbyAttractions.length === 0 ? (
                  <section style={cardStyle}>
                    <EmptyState icon={<Compass className="h-8 w-8" />} title="No attractions data yet" description="Nearby attraction recommendations are being curated for this course" />
                  </section>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {nearbyAttractions.map((attr: any) => (
                      <div key={attr.id} className="rounded-xl p-5" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-medium text-sm" style={primaryText}>{attr.name}</div>
                            {attr.category && (
                              <span className="text-[10px] rounded-full px-2 py-0.5 mt-1 inline-block" style={{
                                backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)",
                              }}>{attr.category}</span>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {attr.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3" style={{ color: "#f59e0b" }} />
                                <span className="text-xs font-medium" style={primaryText}>{parseFloat(attr.rating).toFixed(1)}</span>
                              </div>
                            )}
                            {attr.distanceMiles && <span className="text-xs" style={mutedText}>{parseFloat(attr.distanceMiles).toFixed(1)} mi</span>}
                          </div>
                        </div>
                        {attr.description && <p className="text-xs leading-relaxed mt-2" style={mutedText}>{attr.description}</p>}
                        {attr.websiteUrl && (
                          <a href={attr.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 mt-3 hover:opacity-80" style={secondaryText}>
                            Learn more <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── RV Parks sub-tab ── */}
            {travelSubTab === "rv" && (
              <div>
                {nearbyRvParks.length === 0 ? (
                  <section style={cardStyle}>
                    <EmptyState icon={<Truck className="h-8 w-8" />} title="No RV park data yet" description="RV park recommendations are being curated for this course" />
                  </section>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {nearbyRvParks.map((rv: any) => (
                      <div key={rv.id} className="rounded-xl p-5" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="font-medium text-sm" style={primaryText}>{rv.name}</div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {rv.hookups && (
                                <span className="text-[10px] rounded-full px-2 py-0.5" style={{
                                  backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)",
                                }}>{rv.hookups}</span>
                              )}
                              {rv.numSites && (
                                <span className="text-[10px]" style={mutedText}>{rv.numSites} sites</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {rv.priceLevel && <div className="text-sm" style={{ color: "#fbbf24" }}>{rv.priceLevel}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mb-2 text-xs">
                          {rv.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" style={{ color: "#f59e0b" }} />
                              <span style={primaryText}>{parseFloat(rv.rating).toFixed(1)}</span>
                            </span>
                          )}
                          {rv.distanceMiles && <span style={mutedText}>{parseFloat(rv.distanceMiles).toFixed(1)} mi</span>}
                          {rv.driveTimeMinutes && <span style={mutedText}>{rv.driveTimeMinutes} min drive</span>}
                        </div>
                        {rv.description && <p className="text-xs leading-relaxed" style={mutedText}>{rv.description}</p>}
                        {rv.amenities && (
                          <p className="text-xs leading-relaxed mt-1" style={secondaryText}>
                            <span className="font-medium">Amenities:</span> {rv.amenities}
                          </p>
                        )}
                        {(rv.websiteUrl || rv.phone) && (
                          <div className="flex gap-3 mt-3">
                            {rv.websiteUrl && (
                              <a href={rv.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 hover:opacity-80" style={secondaryText}>
                                Website <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {rv.phone && (
                              <a href={`tel:${rv.phone}`} className="text-xs flex items-center gap-1 hover:opacity-80" style={secondaryText}>
                                <Phone className="h-3 w-3" /> {rv.phone}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })()}

        {/* ────── REVIEWS TAB ────── */}
        {activeTab === "Reviews" && (
          <div className="max-w-3xl space-y-8">

            {/* Your Circles */}
            <CircleRatingsSection courseId={course.courseId} courseName={course.courseName} />

            {/* Score Breakdown */}
            {hasDimensions && (
              <section style={cardStyle}>
                <SectionHeading icon={<Star className="h-5 w-5" style={{ color: "#f59e0b" }} />}>
                  Score Breakdown
                </SectionHeading>

                <div className="flex items-center gap-6 mb-6">
                  {scoreNum !== null && (
                    <div className="flex items-center justify-center rounded-full h-20 w-20 text-2xl font-bold shrink-0" style={{
                      backgroundColor: scoreNum >= 80 ? "var(--cg-accent)" : scoreNum >= 50 ? "#eab308" : "var(--cg-bg-tertiary)",
                      color: scoreNum >= 50 ? "white" : "var(--cg-text-primary)",
                    }}>
                      {Math.round(scoreNum)}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium" style={primaryText}>CF Score</div>
                    {csData?.totalRatings > 0 && (
                      <div className="text-xs" style={mutedText}>
                        Based on {csData.totalRatings} rating{csData.totalRatings !== 1 ? "s" : ""}
                      </div>
                    )}
                    {csData?.numListsAppeared > 0 && (
                      <div className="text-xs" style={mutedText}>
                        Appeared on {csData.numListsAppeared} ranking list{csData.numListsAppeared !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <RadarChart scores={radarScores} />
                </div>

                <div className="space-y-2.5">
                  <ScoreDimRow label="Conditioning" value={radarScores.avgConditioning ?? null} />
                  <ScoreDimRow label="Layout & Design" value={radarScores.avgLayoutDesign ?? null} />
                  <ScoreDimRow label="Aesthetics" value={radarScores.avgAesthetics ?? null} />
                  <ScoreDimRow label="Challenge" value={radarScores.avgChallenge ?? null} />
                  <ScoreDimRow label="Value" value={radarScores.avgValue ?? null} />
                  <ScoreDimRow label="Walkability" value={radarScores.avgWalkability ?? null} />
                  <ScoreDimRow label="Pace of Play" value={radarScores.avgPace ?? null} />
                  <ScoreDimRow label="Amenities" value={radarScores.avgAmenities ?? null} />
                  <ScoreDimRow label="Service" value={radarScores.avgService ?? null} />
                </div>
                <div className="mt-4 flex justify-end">
                  <PoweredByBadge variant="ratings" />
                </div>
              </section>
            )}

            {/* Bucket List Social Counters */}
            <BucketListCounter courseId={course.courseId} />

            {/* Community Ratings */}
            <section style={cardStyle}>
              <SectionHeading icon={<Star className="h-5 w-5" style={{ color: "#f59e0b" }} />}>
                Community Reviews
              </SectionHeading>

              {course.ratings?.length > 0 ? (
                <div className="space-y-4">
                  {course.ratings.map((r: any) => (
                    <div key={r.ratingId} className="rounded-lg p-4" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                      <div className="flex items-center gap-3">
                        {r.user?.image && <img src={r.user.image} alt="" className="h-8 w-8 rounded-full" />}
                        <div>
                          <div className="font-medium text-sm" style={primaryText}>
                            {safeText(r.seedReviewerName) || safeText(r.user?.name) || "Anonymous"}
                            {r.isSeed && (
                              <span className="ml-2 text-xs font-normal px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--cg-text-muted)" }}>via GolfPass</span>
                            )}
                          </div>
                          <div className="text-xs" style={mutedText}>{new Date(r.createdAt).toLocaleDateString()}</div>
                        </div>
                        <span className="ml-auto text-lg font-bold" style={{ color: "var(--cg-accent)" }}>
                          {parseFloat(r.overallRating).toFixed(1)}
                        </span>
                      </div>
                      {safeText(r.reviewTitle) && (
                        <div className="mt-2 font-medium text-sm" style={primaryText}>{safeText(r.reviewTitle)}</div>
                      )}
                      {safeText(r.reviewText) && (
                        <p className="mt-1 text-sm leading-relaxed" style={secondaryText}>{safeText(r.reviewText)}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<MessageSquare className="h-8 w-8" />}
                  title="Be the first to rate this course"
                  description="Share your experience and help fellow golfers discover this course"
                  cta={
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="h-7 w-7 cursor-pointer transition-colors hover:scale-110"
                          style={{ color: "var(--cg-border)", fill: "var(--cg-border)" }}
                          onMouseEnter={(e) => {
                            const parent = e.currentTarget.parentElement;
                            if (!parent) return;
                            const stars = parent.querySelectorAll("svg");
                            stars.forEach((s, i) => {
                              if (i <= star - 1) {
                                s.style.color = "#f59e0b";
                                s.style.fill = "#f59e0b";
                              }
                            });
                          }}
                          onMouseLeave={(e) => {
                            const parent = e.currentTarget.parentElement;
                            if (!parent) return;
                            const stars = parent.querySelectorAll("svg");
                            stars.forEach((s) => {
                              s.style.color = "var(--cg-border)";
                              s.style.fill = "var(--cg-border)";
                            });
                          }}
                        />
                      ))}
                    </div>
                  }
                />
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
