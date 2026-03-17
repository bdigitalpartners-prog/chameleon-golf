"use client";

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, X, Plus, Share2, Trophy, MapPin, Loader2,
  ChevronDown, ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

/* ─── Types ─── */

interface CompareCourse {
  courseId: number;
  courseName: string;
  facilityName: string | null;
  city: string | null;
  state: string | null;
  country: string;
  courseStyle: string | null;
  courseType: string | null;
  accessType: string | null;
  par: number | null;
  numHoles: number | null;
  yearOpened: number | null;
  originalArchitect: string | null;
  greenFeeLow: number | null;
  greenFeeHigh: number | null;
  greenFeePeak: number | null;
  greenFeeOffPeak: number | null;
  greenFeeTwilight: number | null;
  greenFeeCurrency: string | null;
  walkingPolicy: string | null;
  dressCode: string | null;
  caddieAvailability: string | null;
  primaryImageUrl: string | null;
  bestTimeToPlay: string | null;
  bestConditionMonths: string | null;
  golfSeason: string | null;
  bestMonths: unknown;
  latitude: number | null;
  longitude: number | null;
  yardage: number | null;
  slopeRating: number | null;
  courseRating: number | null;
  architect: { id: number; name: string; slug: string } | null;
  rankings: { rank: number | null; list: string; source: string; prestigeTier: string }[];
  chameleonScore: number | null;
  prestigeScore: number | null;
  totalRatings: number;
  dimensions: {
    conditioning: number | null;
    layoutDesign: number | null;
    aesthetics: number | null;
    challenge: number | null;
    value: number | null;
    walkability: number | null;
    pace: number | null;
    amenities: number | null;
    service: number | null;
  } | null;
}

interface SearchResult {
  courseId: number;
  courseName: string;
  city: string | null;
  state: string | null;
  country: string;
}

/* ─── Dimension config ─── */

const DIMENSIONS = [
  { key: "conditioning", label: "Conditioning" },
  { key: "layoutDesign", label: "Layout & Design" },
  { key: "aesthetics", label: "Aesthetics" },
  { key: "challenge", label: "Challenge" },
  { key: "value", label: "Value" },
  { key: "walkability", label: "Walkability" },
  { key: "pace", label: "Pace of Play" },
  { key: "amenities", label: "Amenities" },
  { key: "service", label: "Service" },
] as const;

const COURSE_COLORS = ["#a855f7", "#22c55e", "#3b82f6", "#f59e0b"];

/* ─── Suggested comparisons ─── */

const SUGGESTIONS = [
  { label: "Augusta vs Pine Valley vs Cypress Point", ids: [1, 2, 3] },
  { label: "Pebble Beach vs Pinehurst No. 2 vs TPC Sawgrass", ids: [4, 5, 6] },
  { label: "St Andrews vs Royal County Down", ids: [7, 8] },
];

/* ─── Radar Chart (overlay) ─── */

function OverlayRadarChart({ courses }: { courses: CompareCourse[] }) {
  const n = DIMENSIONS.length;
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = 120;
  const angleStep = (2 * Math.PI) / n;

  const getPoint = (i: number, radius: number) => {
    const angle = i * angleStep - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const polygonPoints = (dims: CompareCourse["dimensions"]) => {
    if (!dims) return "";
    return DIMENSIONS.map((d, i) => {
      const val = dims[d.key as keyof typeof dims] ?? 0;
      const pt = getPoint(i, (val / 10) * r);
      return `${pt.x},${pt.y}`;
    }).join(" ");
  };

  const hasAnyData = courses.some(
    (c) => c.dimensions && DIMENSIONS.some((d) => (c.dimensions as any)?.[d.key] != null)
  );

  if (!hasAnyData) {
    return (
      <div className="flex items-center justify-center py-12" style={{ color: "var(--cg-text-muted)" }}>
        <p className="text-sm">No dimension scores available for comparison</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px]">
        {/* Grid */}
        {gridLevels.map((level) => {
          const pts = DIMENSIONS.map((_, i) => getPoint(i, level * r));
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";
          return <path key={level} d={d} fill="none" stroke="var(--cg-border)" strokeWidth="0.5" />;
        })}
        {/* Axes */}
        {DIMENSIONS.map((_, i) => {
          const pt = getPoint(i, r);
          return <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="var(--cg-border)" strokeWidth="0.5" />;
        })}
        {/* Course polygons */}
        {courses.map((course, ci) => {
          const pts = polygonPoints(course.dimensions);
          if (!pts) return null;
          const color = COURSE_COLORS[ci % COURSE_COLORS.length];
          return (
            <polygon
              key={course.courseId}
              points={pts}
              fill={color + "33"}
              stroke={color}
              strokeWidth="2"
            />
          );
        })}
        {/* Labels */}
        {DIMENSIONS.map((dim, i) => {
          const pt = getPoint(i, r + 20);
          return (
            <text
              key={dim.key}
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fill="var(--cg-text-muted)"
            >
              {dim.label.length > 12 ? dim.label.split(" ")[0] : dim.label}
            </text>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        {courses.map((course, ci) => (
          <div key={course.courseId} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: COURSE_COLORS[ci % COURSE_COLORS.length] }}
            />
            <span className="text-xs font-medium" style={{ color: "var(--cg-text-secondary)" }}>
              {course.courseName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Search Autocomplete ─── */

function CourseSearch({
  onSelect,
  excludeIds,
}: {
  onSelect: (id: number) => void;
  excludeIds: number[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (q.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/courses/search?q=${encodeURIComponent(q)}`);
          const data = await res.json();
          const filtered = (data.results as SearchResult[]).filter(
            (r) => !excludeIds.includes(r.courseId)
          );
          setResults(filtered);
          setOpen(filtered.length > 0);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [excludeIds]
  );

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div
        className="flex items-center gap-2 rounded-xl px-4 py-3"
        style={{
          backgroundColor: "var(--cg-bg-tertiary)",
          border: "1px solid var(--cg-border)",
        }}
      >
        <Search className="h-4 w-4 shrink-0" style={{ color: "var(--cg-text-muted)" }} />
        <input
          type="text"
          placeholder="Search courses to compare..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--cg-text-primary)" }}
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--cg-text-muted)" }} />}
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
          >
            <X className="h-4 w-4" style={{ color: "var(--cg-text-muted)" }} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl py-1"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {results.map((r) => (
            <button
              key={r.courseId}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
              style={{ color: "var(--cg-text-primary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--cg-bg-tertiary)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              onClick={() => {
                onSelect(r.courseId);
                setQuery("");
                setResults([]);
                setOpen(false);
              }}
            >
              <Plus className="h-4 w-4 shrink-0" style={{ color: "var(--cg-accent)" }} />
              <div>
                <div className="text-sm font-medium">{r.courseName}</div>
                <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                  {[r.city, r.state, r.country].filter(Boolean).join(", ")}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Comparison Row Helper ─── */

function getBestIndex(values: (number | null)[], mode: "high" | "low"): number | null {
  let bestIdx: number | null = null;
  let bestVal: number | null = null;
  values.forEach((v, i) => {
    if (v == null) return;
    if (bestVal == null || (mode === "high" ? v > bestVal : v < bestVal)) {
      bestVal = v;
      bestIdx = i;
    }
  });
  // Only highlight if there's a clear winner (not all equal)
  const nonNull = values.filter((v) => v != null);
  if (nonNull.length < 2) return null;
  if (new Set(nonNull).size === 1) return null;
  return bestIdx;
}

/* ─── Main Page ─── */

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
        </div>
      }
    >
      <ComparePageContent />
    </Suspense>
  );
}

function ComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<CompareCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const courseIds = useMemo(() => {
    const param = searchParams.get("courses");
    if (!param) return [];
    return param
      .split(",")
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id));
  }, [searchParams]);

  // Fetch comparison data when URL params change
  useEffect(() => {
    if (courseIds.length < 2) {
      setCourses([]);
      return;
    }
    setLoading(true);
    fetch(`/api/compare?courses=${courseIds.join(",")}`)
      .then((r) => r.json())
      .then((data) => {
        setCourses(data.courses ?? []);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [courseIds]);

  const updateUrl = useCallback(
    (ids: number[]) => {
      if (ids.length === 0) {
        router.push("/compare");
      } else {
        router.push(`/compare?courses=${ids.join(",")}`);
      }
    },
    [router]
  );

  const addCourse = useCallback(
    (id: number) => {
      const next = [...courseIds, id].slice(0, 4);
      updateUrl(next);
    },
    [courseIds, updateUrl]
  );

  const removeCourse = useCallback(
    (id: number) => {
      updateUrl(courseIds.filter((cid) => cid !== id));
    },
    [courseIds, updateUrl]
  );

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const hasComparison = courses.length >= 2;

  // Collect all unique ranking sources across courses
  const allRankingSources = useMemo(() => {
    const sources = new Set<string>();
    courses.forEach((c) => c.rankings.forEach((r) => sources.add(`${r.source} — ${r.list}`)));
    return Array.from(sources);
  }, [courses]);

  // Summary stats
  const summary = useMemo(() => {
    if (courses.length < 2) return null;
    const wins: Record<number, number> = {};
    courses.forEach((c) => (wins[c.courseId] = 0));

    // Score comparison
    const scores = courses.map((c) => c.chameleonScore);
    const bestScoreIdx = getBestIndex(scores, "high");
    if (bestScoreIdx != null) wins[courses[bestScoreIdx].courseId]++;

    // Dimension comparisons
    DIMENSIONS.forEach((dim) => {
      const vals = courses.map((c) => c.dimensions?.[dim.key as keyof CompareCourse["dimensions"] & string] as number | null ?? null);
      const best = getBestIndex(vals, "high");
      if (best != null) wins[courses[best].courseId]++;
    });

    // Fee comparison (lower is better)
    const fees = courses.map((c) => c.greenFeeLow);
    const bestFeeIdx = getBestIndex(fees, "low");
    if (bestFeeIdx != null) wins[courses[bestFeeIdx].courseId]++;

    const totalCategories = 1 + DIMENSIONS.length + 1; // score + dims + fee
    let topId = courses[0].courseId;
    let topWins = 0;
    Object.entries(wins).forEach(([id, w]) => {
      if (w > topWins) {
        topId = parseInt(id);
        topWins = w;
      }
    });

    const topCourse = courses.find((c) => c.courseId === topId);
    return { wins, totalCategories, topCourse, topWins };
  }, [courses]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="font-display text-3xl font-bold md:text-4xl"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Course Comparator
          </h1>
          <p className="mt-2 text-base" style={{ color: "var(--cg-text-secondary)" }}>
            Compare up to 4 courses side by side across rankings, scores, and features.
          </p>
        </div>

        {/* Search + Selected Courses */}
        <div className="mb-8 flex flex-col gap-4">
          {courseIds.length < 4 && (
            <CourseSearch onSelect={addCourse} excludeIds={courseIds} />
          )}

          {/* Selected course pills */}
          {courses.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {courses.map((course, i) => (
                <div
                  key={course.courseId}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: "var(--cg-bg-tertiary)",
                    border: `1px solid ${COURSE_COLORS[i % COURSE_COLORS.length]}`,
                  }}
                >
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: COURSE_COLORS[i % COURSE_COLORS.length] }}
                  />
                  <span className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                    {course.courseName}
                  </span>
                  <button onClick={() => removeCourse(course.courseId)}>
                    <X className="h-3.5 w-3.5" style={{ color: "var(--cg-text-muted)" }} />
                  </button>
                </div>
              ))}
              {hasComparison && (
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: "var(--cg-accent)",
                    color: "var(--cg-text-inverse)",
                  }}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {copied ? "Copied!" : "Share Comparison"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
          </div>
        )}

        {/* Empty state with suggestions */}
        {!loading && !hasComparison && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <Trophy className="mx-auto h-12 w-12 mb-4" style={{ color: "var(--cg-text-muted)" }} />
            <h2 className="font-display text-xl font-bold mb-2" style={{ color: "var(--cg-text-primary)" }}>
              {courseIds.length === 1
                ? "Add one more course to start comparing"
                : "Select courses to compare"}
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--cg-text-muted)" }}>
              Search above to add 2-4 courses, or try one of our suggested comparisons.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => updateUrl(s.ids)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--cg-bg-tertiary)",
                    border: "1px solid var(--cg-border)",
                    color: "var(--cg-text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--cg-accent)";
                    e.currentTarget.style.color = "var(--cg-text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--cg-border)";
                    e.currentTarget.style.color = "var(--cg-text-secondary)";
                  }}
                >
                  <ArrowRight className="h-3.5 w-3.5" style={{ color: "var(--cg-accent)" }} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comparison content */}
        {!loading && hasComparison && (
          <div className="space-y-6">
            {/* Summary banner */}
            {summary && summary.topCourse && (
              <div
                className="rounded-xl p-4 flex items-center gap-3"
                style={{
                  backgroundColor: "var(--cg-accent-bg)",
                  border: "1px solid var(--cg-accent-muted)",
                }}
              >
                <Trophy className="h-5 w-5 shrink-0" style={{ color: "var(--cg-accent)" }} />
                <p className="text-sm" style={{ color: "var(--cg-text-primary)" }}>
                  <span className="font-bold" style={{ color: "var(--cg-accent)" }}>
                    {summary.topCourse.courseName}
                  </span>{" "}
                  leads in {summary.topWins}/{summary.totalCategories} categories
                </p>
              </div>
            )}

            {/* Course header cards */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${courses.length}, 1fr)` }}>
              {courses.map((course, i) => (
                <div
                  key={course.courseId}
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: "var(--cg-bg-card)",
                    border: `1px solid var(--cg-border)`,
                    borderTopColor: COURSE_COLORS[i % COURSE_COLORS.length],
                    borderTopWidth: "3px",
                  }}
                >
                  <div className="relative aspect-[16/9]" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
                    {course.primaryImageUrl ? (
                      <img
                        src={course.primaryImageUrl}
                        alt={course.courseName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Trophy className="h-10 w-10" style={{ color: "var(--cg-text-muted)" }} />
                      </div>
                    )}
                    <button
                      onClick={() => removeCourse(course.courseId)}
                      className="absolute top-2 right-2 rounded-full p-1.5"
                      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                    {course.chameleonScore != null && (
                      <div
                        className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                        style={{
                          backgroundColor:
                            course.chameleonScore >= 80
                              ? "var(--cg-accent)"
                              : course.chameleonScore >= 50
                              ? "#eab308"
                              : "var(--cg-bg-tertiary)",
                          color:
                            course.chameleonScore >= 50
                              ? "var(--cg-text-inverse)"
                              : "var(--cg-text-secondary)",
                        }}
                      >
                        {Math.round(course.chameleonScore)}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <Link
                      href={`/course/${course.courseId}`}
                      className="font-display text-base font-bold leading-tight hover:underline"
                      style={{ color: "var(--cg-text-primary)" }}
                    >
                      {course.courseName}
                    </Link>
                    <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: "var(--cg-text-muted)" }}>
                      <MapPin className="h-3 w-3" />
                      {[course.city, course.state].filter(Boolean).join(", ")}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add course card (if < 4) */}
              {courses.length < 4 && (
                <div
                  className="rounded-xl flex flex-col items-center justify-center min-h-[200px] cursor-pointer transition-colors"
                  style={{
                    backgroundColor: "var(--cg-bg-card)",
                    border: "2px dashed var(--cg-border)",
                  }}
                  onClick={() => {
                    const searchInput = document.querySelector<HTMLInputElement>(
                      'input[placeholder*="Search courses"]'
                    );
                    searchInput?.focus();
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--cg-accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--cg-border)")}
                >
                  <Plus className="h-8 w-8 mb-2" style={{ color: "var(--cg-text-muted)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--cg-text-muted)" }}>
                    Add Course
                  </span>
                </div>
              )}
            </div>

            {/* Radar Chart Overlay */}
            <div
              className="rounded-xl p-6"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <h2
                className="font-display text-lg font-bold mb-4"
                style={{ color: "var(--cg-text-primary)" }}
              >
                9-Dimension Score Comparison
              </h2>
              <OverlayRadarChart courses={courses} />
            </div>

            {/* Comparison Table */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--cg-border)" }}>
                      <th
                        className="sticky left-0 z-10 w-40 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{
                          color: "var(--cg-text-muted)",
                          backgroundColor: "var(--cg-bg-card)",
                        }}
                      >
                        Attribute
                      </th>
                      {courses.map((course, i) => (
                        <th
                          key={course.courseId}
                          className="px-4 py-3 text-left text-sm font-bold"
                          style={{
                            color: "var(--cg-text-primary)",
                            borderBottom: `2px solid ${COURSE_COLORS[i % COURSE_COLORS.length]}`,
                          }}
                        >
                          {course.courseName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Basic Info Section */}
                    <SectionHeader label="Basic Info" colSpan={courses.length + 1} />

                    <CompareRow label="Par" values={courses.map((c) => c.par != null ? String(c.par) : null)} />
                    <CompareRow
                      label="Yardage"
                      values={courses.map((c) => c.yardage != null ? c.yardage.toLocaleString() : null)}
                    />
                    <CompareRow label="Holes" values={courses.map((c) => c.numHoles != null ? String(c.numHoles) : null)} />
                    <CompareRow
                      label="Architect"
                      values={courses.map((c) =>
                        c.architect ? c.architect.name : c.originalArchitect ?? null
                      )}
                    />
                    <CompareRow label="Year Opened" values={courses.map((c) => c.yearOpened != null ? String(c.yearOpened) : null)} />
                    <CompareRow label="Access" values={courses.map((c) => c.accessType)} />
                    <CompareRow label="Style" values={courses.map((c) => c.courseStyle)} />

                    {/* Location */}
                    <SectionHeader label="Location" colSpan={courses.length + 1} />
                    <CompareRow
                      label="Location"
                      values={courses.map((c) =>
                        [c.city, c.state, c.country].filter(Boolean).join(", ") || null
                      )}
                    />

                    {/* Rankings & Scores */}
                    <SectionHeader label="Rankings & Scores" colSpan={courses.length + 1} />
                    <CompareRowHighlight
                      label="CF Score"
                      values={courses.map((c) => c.chameleonScore)}
                      format={(v) => Math.round(v).toString()}
                      mode="high"
                    />
                    <CompareRow
                      label="Prestige Score"
                      values={courses.map((c) =>
                        c.prestigeScore != null ? Number(c.prestigeScore).toFixed(1) : null
                      )}
                    />
                    <CompareRow
                      label="Total Ratings"
                      values={courses.map((c) => c.totalRatings > 0 ? String(c.totalRatings) : null)}
                    />

                    {allRankingSources.map((source) => (
                      <CompareRow
                        key={source}
                        label={source}
                        values={courses.map((c) => {
                          const r = c.rankings.find(
                            (r) => `${r.source} — ${r.list}` === source
                          );
                          return r?.rank != null ? `#${r.rank}` : null;
                        })}
                      />
                    ))}

                    {/* Dimensions */}
                    <SectionHeader label="9-Dimension Scores" colSpan={courses.length + 1} />
                    {DIMENSIONS.map((dim) => (
                      <CompareRowHighlight
                        key={dim.key}
                        label={dim.label}
                        values={courses.map(
                          (c) =>
                            (c.dimensions?.[dim.key as keyof CompareCourse["dimensions"] & string] as number | null) ?? null
                        )}
                        format={(v) => v.toFixed(1)}
                        mode="high"
                      />
                    ))}

                    {/* Green Fees */}
                    <SectionHeader label="Green Fees" colSpan={courses.length + 1} />
                    <CompareRowHighlight
                      label="Standard Fee"
                      values={courses.map((c) => c.greenFeeLow)}
                      format={(v) => formatCurrency(v)}
                      mode="low"
                    />
                    <CompareRow
                      label="Peak Fee"
                      values={courses.map((c) =>
                        c.greenFeeHigh != null ? formatCurrency(c.greenFeeHigh) : c.greenFeePeak != null ? formatCurrency(c.greenFeePeak) : null
                      )}
                    />
                    <CompareRow
                      label="Twilight Fee"
                      values={courses.map((c) =>
                        c.greenFeeTwilight != null ? formatCurrency(c.greenFeeTwilight) : null
                      )}
                    />
                    <CompareRow label="Walking Policy" values={courses.map((c) => c.walkingPolicy)} />
                    <CompareRow label="Caddie" values={courses.map((c) => c.caddieAvailability)} />
                    <CompareRow label="Dress Code" values={courses.map((c) => c.dressCode)} />

                    {/* Course Character */}
                    <SectionHeader label="Course Character" colSpan={courses.length + 1} />
                    <CompareRowHighlight
                      label="Slope Rating"
                      values={courses.map((c) => c.slopeRating)}
                      format={(v) => v.toString()}
                      mode="high"
                    />
                    <CompareRow
                      label="Course Rating"
                      values={courses.map((c) =>
                        c.courseRating != null ? c.courseRating.toFixed(1) : null
                      )}
                    />

                    {/* Weather / Season */}
                    <SectionHeader label="Weather & Season" colSpan={courses.length + 1} />
                    <CompareRow label="Golf Season" values={courses.map((c) => c.golfSeason)} />
                    <CompareRow label="Best Time to Play" values={courses.map((c) => c.bestTimeToPlay)} />
                    <CompareRow
                      label="Best Condition Months"
                      values={courses.map((c) => c.bestConditionMonths)}
                    />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Reusable table components ─── */

function SectionHeader({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-5 py-3 text-xs font-bold uppercase tracking-widest"
        style={{
          color: "var(--cg-accent)",
          backgroundColor: "var(--cg-bg-tertiary)",
          borderTop: "1px solid var(--cg-border)",
          borderBottom: "1px solid var(--cg-border)",
        }}
      >
        {label}
      </td>
    </tr>
  );
}

function CompareRow({ label, values }: { label: string; values: (string | null)[] }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--cg-border-subtle)" }}>
      <td
        className="sticky left-0 z-10 px-5 py-2.5 text-xs font-semibold"
        style={{
          color: "var(--cg-text-muted)",
          backgroundColor: "var(--cg-bg-card)",
        }}
      >
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} className="px-4 py-2.5 text-sm" style={{ color: "var(--cg-text-primary)" }}>
          {v ?? <span style={{ color: "var(--cg-text-muted)" }}>N/A</span>}
        </td>
      ))}
    </tr>
  );
}

function CompareRowHighlight({
  label,
  values,
  format,
  mode,
}: {
  label: string;
  values: (number | null)[];
  format: (v: number) => string;
  mode: "high" | "low";
}) {
  const bestIdx = getBestIndex(values, mode);

  return (
    <tr style={{ borderBottom: "1px solid var(--cg-border-subtle)" }}>
      <td
        className="sticky left-0 z-10 px-5 py-2.5 text-xs font-semibold"
        style={{
          color: "var(--cg-text-muted)",
          backgroundColor: "var(--cg-bg-card)",
        }}
      >
        {label}
      </td>
      {values.map((v, i) => (
        <td
          key={i}
          className="px-4 py-2.5 text-sm font-medium"
          style={{
            color:
              v != null && i === bestIdx
                ? "var(--cg-accent)"
                : v != null
                ? "var(--cg-text-primary)"
                : "var(--cg-text-muted)",
            fontWeight: v != null && i === bestIdx ? 700 : 500,
          }}
        >
          {v != null ? format(v) : "N/A"}
        </td>
      ))}
    </tr>
  );
}
