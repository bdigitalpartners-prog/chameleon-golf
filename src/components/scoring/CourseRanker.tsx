"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Compass,
  Sprout,
  Target,
  Mountain,
  DollarSign,
  Coffee,
  DoorOpen,
  Award,
  Smile,
  RotateCcw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  type DimensionWeights,
  type DimensionScores,
  type DimensionKey,
  DEFAULT_DIMENSION_WEIGHTS,
  DIMENSION_META,
  PRESET_PROFILES,
  computeDimensionScores,
  computeChameleonScore,
} from "@/lib/chameleon-score";
import { CoursePlaceholder } from "@/components/course/CoursePlaceholder";

const STORAGE_KEY = "cg-chameleon-weights";
const ITEMS_PER_PAGE = 25;
const DEBOUNCE_MS = 300;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Compass,
  Sprout,
  Target,
  Mountain,
  DollarSign,
  Coffee,
  DoorOpen,
  Award,
  Smile,
};

const TEAL = "#01696F";

interface RankedCourse {
  courseId: number;
  courseName: string;
  facilityName: string | null;
  city: string | null;
  state: string | null;
  country: string;
  accessType: string | null;
  courseStyle: string | null;
  originalArchitect: string | null;
  greenFeeLow: number | null;
  greenFeeHigh: number | null;
  numListsAppeared: number;
  primaryImageUrl: string | null;
  prestigeScore: number;
  chameleonScore: number;
  dimensionScores: DimensionScores;
  breakdown: { dimension: DimensionKey; weight: number; score: number; contribution: number }[];
  bestRank: number | null;
  bestSource: string | null;
  // Raw data for client-side recomputation
  walkingPolicy?: string | null;
  practiceFacilities?: unknown;
  yearOpened?: number | null;
  renovationYear?: number | null;
  maxSlopeRating?: number | null;
  maxCourseRating?: number | null;
}

interface PrecomputedDimensionScores {
  avgConditioning: number | null;
  avgLayoutDesign: number | null;
  avgPace: number | null;
  avgAesthetics: number | null;
  avgChallenge: number | null;
  avgValue: number | null;
  avgAmenities: number | null;
  avgWalkability: number | null;
  avgService: number | null;
  avgOverall: number | null;
}

interface PrestigeCourse {
  courseId: number;
  courseName: string;
  facilityName: string | null;
  city: string | null;
  state: string | null;
  country: string;
  accessType: string | null;
  courseStyle: string | null;
  originalArchitect: string | null;
  greenFeeLow: number | null;
  greenFeeHigh: number | null;
  walkingPolicy: string | null;
  practiceFacilities: unknown;
  numListsAppeared: number;
  primaryImageUrl: string | null;
  prestigeScore: number;
  chameleonScore: number;
  maxSlopeRating: number | null;
  maxCourseRating: number | null;
  bestRank: number | null;
  bestSource: string | null;
  yearOpened?: number | null;
  renovationYear?: number | null;
  dimensionScores?: PrecomputedDimensionScores | null;
}

function ScoreRing({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const bg = score >= 80 ? TEAL : score >= 50 ? "#eab308" : "var(--cg-bg-tertiary)";
  const fg = score >= 50 ? "#fff" : "var(--cg-text-secondary)";
  const sizeClass = size === "sm" ? "h-10 w-10 text-xs" : "h-12 w-12 text-sm";
  return (
    <div className={`score-ring ${sizeClass}`} style={{ backgroundColor: bg, color: fg }}>
      {Math.round(score)}
    </div>
  );
}

export function CourseRanker() {
  const [weights, setWeights] = useState<DimensionWeights>({ ...DEFAULT_DIMENSION_WEIGHTS });
  const [courses, setCourses] = useState<PrestigeCourse[]>([]);
  const [ranked, setRanked] = useState<RankedCourse[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved weights from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DimensionWeights;
        setWeights(parsed);
      }
    } catch {}
  }, []);

  // Fetch all courses on mount
  useEffect(() => {
    fetch("/api/scores/prestige")
      .then((r) => r.json())
      .then((data: PrestigeCourse[]) => {
        setCourses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Map pre-computed DB dimension scores (0-10) to client DimensionScores (0-100)
  const mapPrecomputedToDimensionScores = useCallback(
    (ds: PrecomputedDimensionScores, prestigeScore: number): DimensionScores => ({
      design: (ds.avgLayoutDesign ?? 5) * 10,
      conditions: (ds.avgConditioning ?? 5) * 10,
      challenge: (ds.avgChallenge ?? 5) * 10,
      scenery: (ds.avgAesthetics ?? 5) * 10,
      value: (ds.avgValue ?? 5) * 10,
      amenities: (ds.avgAmenities ?? 5) * 10,
      accessibility: (ds.avgWalkability ?? 5) * 10,
      prestige: Math.min(prestigeScore, 100),
      vibe: (ds.avgService ?? 5) * 10,
    }),
    []
  );

  // Recompute scores client-side when weights or courses change
  const rerank = useCallback(
    (w: DimensionWeights) => {
      if (courses.length === 0) return;
      const scored: RankedCourse[] = courses.map((c) => {
        // Use pre-computed dimension scores when available, fall back to client-side computation
        const dimScores = c.dimensionScores?.avgOverall != null
          ? mapPrecomputedToDimensionScores(c.dimensionScores, c.prestigeScore)
          : computeDimensionScores(
              {
                accessType: c.accessType,
                greenFeeLow: c.greenFeeLow,
                greenFeeHigh: c.greenFeeHigh,
                practiceFacilities: c.practiceFacilities,
                walkingPolicy: c.walkingPolicy,
                yearOpened: c.yearOpened ?? null,
                renovationYear: c.renovationYear ?? null,
                originalArchitect: c.originalArchitect,
                maxSlopeRating: c.maxSlopeRating,
                maxCourseRating: c.maxCourseRating,
              },
              c.prestigeScore
            );
        const { score, breakdown } = computeChameleonScore(dimScores, w, c.prestigeScore);
        return {
          courseId: c.courseId,
          courseName: c.courseName,
          facilityName: c.facilityName,
          city: c.city,
          state: c.state,
          country: c.country,
          accessType: c.accessType,
          courseStyle: c.courseStyle,
          originalArchitect: c.originalArchitect,
          greenFeeLow: c.greenFeeLow,
          greenFeeHigh: c.greenFeeHigh,
          numListsAppeared: c.numListsAppeared,
          primaryImageUrl: c.primaryImageUrl,
          prestigeScore: c.prestigeScore,
          chameleonScore: score,
          dimensionScores: dimScores,
          breakdown,
          bestRank: c.bestRank,
          bestSource: c.bestSource,
        };
      });
      scored.sort((a, b) => b.chameleonScore - a.chameleonScore);
      setRanked(scored);
    },
    [courses, mapPrecomputedToDimensionScores]
  );

  // Trigger rerank when courses load or weights change
  useEffect(() => {
    rerank(weights);
  }, [weights, rerank]);

  const handleWeightChange = (key: DimensionKey, value: number) => {
    const newWeights = { ...weights, [key]: value };
    setWeights(newWeights);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newWeights));
      } catch {}
    }, DEBOUNCE_MS);
  };

  const applyPreset = (preset: (typeof PRESET_PROFILES)[0]) => {
    setWeights(preset.weights);
    setPage(1);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preset.weights));
    } catch {}
  };

  const resetWeights = () => {
    const def = { ...DEFAULT_DIMENSION_WEIGHTS };
    setWeights(def);
    setPage(1);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
    } catch {}
  };

  const isCustom = Object.keys(DEFAULT_DIMENSION_WEIGHTS).some(
    (k) => weights[k as DimensionKey] !== DEFAULT_DIMENSION_WEIGHTS[k as DimensionKey]
  );

  const totalPages = Math.ceil(ranked.length / ITEMS_PER_PAGE);
  const paginated = ranked.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const activePreset = PRESET_PROFILES.find((p) =>
    (Object.keys(p.weights) as DimensionKey[]).every((k) => p.weights[k] === weights[k])
  );

  // ── Slider panel (shared between desktop sidebar and mobile drawer) ──
  const sliderPanel = (
    <div className="space-y-5">
      {/* Preset buttons */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--cg-text-muted)" }}>
          Profiles
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_PROFILES.map((p) => {
            const active = activePreset?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: active ? TEAL : "var(--cg-bg-tertiary)",
                  color: active ? "#fff" : "var(--cg-text-secondary)",
                  border: `1px solid ${active ? TEAL : "var(--cg-border)"}`,
                }}
                title={p.description}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset */}
      {isCustom && (
        <button
          onClick={resetWeights}
          className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ color: "var(--cg-text-muted)" }}
        >
          <RotateCcw className="h-3 w-3" />
          Reset to Default
        </button>
      )}

      {/* Dimension sliders */}
      <div className="space-y-4">
        {DIMENSION_META.map((dim) => {
          const Icon = ICON_MAP[dim.icon];
          const val = weights[dim.key];
          return (
            <div key={dim.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {Icon && <Icon className="h-3.5 w-3.5" style={{ color: TEAL }} />}
                  <label className="text-xs font-medium" style={{ color: "var(--cg-text-secondary)" }}>
                    {dim.label}
                  </label>
                </div>
                <span className="text-xs font-bold tabular-nums" style={{ color: TEAL }}>
                  {val}
                </span>
              </div>
              <div className="relative h-5 flex items-center">
                <div className="absolute h-1.5 w-full rounded-full" style={{ backgroundColor: "var(--cg-bg-tertiary)" }} />
                <div
                  className="absolute h-1.5 rounded-full transition-all"
                  style={{ width: `${(val / 10) * 100}%`, backgroundColor: TEAL }}
                />
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={val}
                  onChange={(e) => handleWeightChange(dim.key, parseInt(e.target.value))}
                  className="absolute w-full appearance-none bg-transparent cursor-pointer"
                  style={{ "--thumb-color": TEAL } as React.CSSProperties}
                  title={dim.description}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── Desktop sidebar (30%) ── */}
      <aside
        className="hidden lg:block lg:w-[30%] shrink-0 sticky top-24 self-start rounded-xl p-5 overflow-y-auto"
        style={{
          backgroundColor: "var(--cg-bg-card)",
          border: "1px solid var(--cg-border)",
          maxHeight: "calc(100vh - 7rem)",
        }}
      >
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--cg-text-primary)" }}>
          Your Preferences
        </h2>
        {sliderPanel}
      </aside>

      {/* ── Mobile drawer toggle ── */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-4 py-3 shadow-lg"
        style={{ backgroundColor: TEAL, color: "#fff" }}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span className="text-sm font-semibold">Preferences</span>
      </button>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "var(--cg-bg-overlay)" }}
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl p-5 overflow-y-auto"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              maxHeight: "85vh",
              animation: "slideUp 0.3s ease-out",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: "var(--cg-text-primary)" }}>
                Your Preferences
              </h2>
              <button onClick={() => setDrawerOpen(false)} style={{ color: "var(--cg-text-muted)" }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {sliderPanel}
          </div>
        </div>
      )}

      {/* ── Results panel (70%) ── */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
              Chameleon Rankings
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--cg-text-muted)" }}>
              {ranked.length} courses ranked by your preferences
              {activePreset && (
                <span style={{ color: TEAL }}> &middot; {activePreset.label}</span>
              )}
            </p>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${TEAL} transparent ${TEAL} ${TEAL}` }} />
          </div>
        )}

        {/* Course list */}
        {!loading && (
          <div className="space-y-3">
            {paginated.map((course, idx) => {
              const globalRank = (page - 1) * ITEMS_PER_PAGE + idx + 1;
              const expanded = expandedCourse === course.courseId;
              return (
                <div
                  key={course.courseId}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{
                    backgroundColor: "var(--cg-bg-card)",
                    border: `1px solid ${expanded ? TEAL : "var(--cg-border)"}`,
                  }}
                >
                  {/* Main row */}
                  <div className="flex items-center gap-4 p-4">
                    {/* Rank */}
                    <div
                      className="shrink-0 w-8 text-center text-sm font-bold tabular-nums"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      {globalRank}
                    </div>

                    {/* Image */}
                    <div className="shrink-0 w-16 h-12 rounded-lg overflow-hidden" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
                      {course.primaryImageUrl ? (
                        <img
                          src={course.primaryImageUrl}
                          alt={course.courseName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <CoursePlaceholder courseName={course.courseName} courseStyle={course.courseStyle} size="card" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/course/${course.courseId}`}
                        className="text-sm font-semibold hover:underline truncate block"
                        style={{ color: "var(--cg-text-primary)" }}
                      >
                        {course.courseName}
                      </Link>
                      <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: "var(--cg-text-muted)" }}>
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{[course.city, course.state, course.country].filter(Boolean).join(", ")}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      {course.accessType && (
                        <span
                          className="rounded-md px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
                        >
                          {course.accessType}
                        </span>
                      )}
                      {course.bestRank && course.bestSource && (
                        <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                          #{course.bestRank} {course.bestSource}
                        </span>
                      )}
                    </div>

                    {/* Score */}
                    <ScoreRing score={course.chameleonScore} />

                    {/* Expand */}
                    <button
                      onClick={() => setExpandedCourse(expanded ? null : course.courseId)}
                      className="shrink-0"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {/* Expanded breakdown */}
                  {expanded && (
                    <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--cg-border)" }}>
                      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 pt-4">
                        {course.breakdown.map((b) => {
                          const meta = DIMENSION_META.find((m) => m.key === b.dimension);
                          const Icon = meta ? ICON_MAP[meta.icon] : null;
                          return (
                            <div key={b.dimension} className="text-center">
                              <div className="flex justify-center mb-1">
                                {Icon && <Icon className="h-4 w-4" style={{ color: TEAL }} />}
                              </div>
                              <div className="text-xs font-bold tabular-nums" style={{ color: "var(--cg-text-primary)" }}>
                                {Math.round(b.score)}
                              </div>
                              <div className="text-[10px] leading-tight mt-0.5" style={{ color: "var(--cg-text-muted)" }}>
                                {meta?.label.split(" / ")[0] || b.dimension}
                              </div>
                              <div className="text-[10px]" style={{ color: "var(--cg-text-muted)" }}>
                                w:{Math.round(b.weight)}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: "var(--cg-text-muted)" }}>
                        <span>Prestige: <strong style={{ color: "var(--cg-text-secondary)" }}>{Math.round(course.prestigeScore)}</strong></span>
                        <span>Lists: <strong style={{ color: "var(--cg-text-secondary)" }}>{course.numListsAppeared}</strong></span>
                        {course.greenFeeHigh != null && (
                          <span>Fee: <strong style={{ color: "var(--cg-text-secondary)" }}>${course.greenFeeHigh}</strong></span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-30"
              style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="text-sm tabular-nums" style={{ color: "var(--cg-text-muted)" }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-30"
              style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
