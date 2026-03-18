"use client";

import { useState, useCallback } from "react";
import {
  Brain, ChevronDown, Target, AlertTriangle, Compass,
  Flag, Loader2, BookOpen, Zap,
} from "lucide-react";
import { PoweredByBadge } from "@/components/brand/PoweredByBadge";
import {
  cardStyle, mutedText, secondaryText, primaryText,
  SectionHeading, SubHeading,
} from "./shared";

/* ── Types ── */

interface HoleAdvice {
  holeNumber: number;
  par: number;
  yardage?: number;
  keyChallenge: string;
  advice: string;
  recommendedPlay: string;
}

interface ReadabilityData {
  courseId: number;
  handicapBand: string;
  handicapLabel: string;
  overallStrategy: string;
  holes: HoleAdvice[];
  cached: boolean;
  generatedAt: string;
}

/* ── Par Colors ── */

const PAR_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  3: { bg: "rgba(34,211,238,0.12)", text: "#22d3ee", border: "rgba(34,211,238,0.25)" },
  4: { bg: "rgba(34,197,94,0.12)", text: "#4ade80", border: "rgba(34,197,94,0.25)" },
  5: { bg: "rgba(168,85,247,0.12)", text: "#c084fc", border: "rgba(168,85,247,0.25)" },
};

/* ── Handicap Band Presets ── */

const HANDICAP_PRESETS = [
  { label: "Scratch (0-2)", value: 1 },
  { label: "Low (3-9)", value: 6 },
  { label: "Mid (10-18)", value: 14 },
  { label: "High (19-28)", value: 23 },
  { label: "Beginner (29+)", value: 32 },
];

/* ── Hole Card Component ── */

function HoleAdviceCard({ hole, isExpanded, onToggle }: {
  hole: HoleAdvice;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const colors = PAR_COLORS[hole.par] || PAR_COLORS[4];

  return (
    <div
      className="rounded-xl overflow-hidden transition-all cursor-pointer"
      style={{
        backgroundColor: "var(--cg-bg-secondary)",
        border: `1px solid ${isExpanded ? colors.border : "var(--cg-border)"}`,
      }}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        {/* Hole number badge */}
        <div
          className="flex items-center justify-center h-10 w-10 rounded-lg text-sm font-bold flex-shrink-0"
          style={{
            backgroundColor: colors.bg,
            color: colors.text,
            border: `1px solid ${colors.border}`,
          }}
        >
          {hole.holeNumber}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: "var(--cg-text-primary)" }}>
              Hole {hole.holeNumber}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.border}`,
              }}
            >
              Par {hole.par}
            </span>
            {hole.yardage && (
              <span className="text-[10px]" style={mutedText}>
                {hole.yardage} yds
              </span>
            )}
          </div>
          {!isExpanded && (
            <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--cg-text-muted)" }}>
              {hole.recommendedPlay}
            </p>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          style={{ color: "var(--cg-text-muted)" }}
        />
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div
          className="px-4 pb-4 pt-0 space-y-3"
          style={{ borderTop: `1px solid ${colors.border}20` }}
        >
          {/* Key Challenge */}
          <div
            className="rounded-lg p-3"
            style={{
              backgroundColor: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3 w-3" style={{ color: "#f87171" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#f87171" }}>
                Key Challenge
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={secondaryText}>
              {hole.keyChallenge}
            </p>
          </div>

          {/* Strategy Advice */}
          <div
            className="rounded-lg p-3"
            style={{
              backgroundColor: "var(--cg-bg-primary)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Compass className="h-3 w-3" style={{ color: "var(--cg-accent)" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--cg-accent)" }}>
                Playing Strategy
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={secondaryText}>
              {hole.advice}
            </p>
          </div>

          {/* Recommended Play callout */}
          <div
            className="rounded-lg p-3 flex items-center gap-2"
            style={{
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Target className="h-4 w-4 flex-shrink-0" style={{ color: colors.text }} />
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: colors.text }}>
                The Play
              </span>
              <span className="text-sm font-medium" style={primaryText}>
                {hole.recommendedPlay}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Readability Tab ── */

export function ReadabilityTab({ course }: { course: any }) {
  const [handicap, setHandicap] = useState<number | null>(null);
  const [customHandicap, setCustomHandicap] = useState("");
  const [data, setData] = useState<ReadabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedHole, setExpandedHole] = useState<number | null>(null);
  const [expandAll, setExpandAll] = useState(false);

  const fetchReadability = useCallback(async (hcp: number) => {
    setLoading(true);
    setError(null);
    setData(null);
    setExpandedHole(null);
    setExpandAll(false);

    try {
      const res = await fetch(`/api/courses/${course.courseId}/readability?handicap=${hcp}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const result: ReadabilityData = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load readability analysis");
    } finally {
      setLoading(false);
    }
  }, [course.courseId]);

  const handlePresetClick = (value: number) => {
    setHandicap(value);
    setCustomHandicap("");
    fetchReadability(value);
  };

  const handleCustomSubmit = () => {
    const val = parseFloat(customHandicap);
    if (isNaN(val) || val < -5 || val > 54) {
      setError("Enter a valid handicap between -5 and 54");
      return;
    }
    setHandicap(val);
    fetchReadability(val);
  };

  const toggleExpandAll = () => {
    setExpandAll(!expandAll);
    if (!expandAll) {
      setExpandedHole(null); // expand all overrides individual
    }
  };

  return (
    <div className="max-w-3xl space-y-8">

      {/* Handicap Selection */}
      <section style={cardStyle}>
        <SectionHeading icon={<Brain className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />}>
          Course Readability
        </SectionHeading>

        <p className="text-sm mb-4" style={secondaryText}>
          Get personalized hole-by-hole playing strategy based on your handicap level.
          Our AI analyzes the course layout, hazards, and design to recommend the smartest play for each hole.
        </p>

        {/* Preset buttons */}
        <div className="mb-4">
          <p className="text-xs font-medium mb-2" style={mutedText}>Select your handicap range:</p>
          <div className="flex flex-wrap gap-2">
            {HANDICAP_PRESETS.map((preset) => {
              const isActive = handicap === preset.value;
              return (
                <button
                  key={preset.value}
                  onClick={() => handlePresetClick(preset.value)}
                  disabled={loading}
                  className="rounded-lg px-4 py-2 text-xs font-medium transition-all"
                  style={{
                    backgroundColor: isActive ? "rgba(34,197,94,0.15)" : "var(--cg-bg-secondary)",
                    color: isActive ? "#4ade80" : "var(--cg-text-secondary)",
                    border: `1px solid ${isActive ? "rgba(34,197,94,0.3)" : "var(--cg-border)"}`,
                    cursor: loading ? "wait" : "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom handicap input */}
        <div className="flex items-center gap-2">
          <span className="text-xs" style={mutedText}>Or enter exact handicap:</span>
          <input
            type="number"
            step="0.1"
            min="-5"
            max="54"
            placeholder="e.g. 12.4"
            value={customHandicap}
            onChange={(e) => setCustomHandicap(e.target.value)}
            disabled={loading}
            className="rounded-lg px-3 py-1.5 text-sm w-24 outline-none"
            style={{
              backgroundColor: "var(--cg-bg-secondary)",
              border: "1px solid var(--cg-border)",
              color: "var(--cg-text-primary)",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCustomSubmit();
            }}
          />
          <button
            onClick={handleCustomSubmit}
            disabled={loading || !customHandicap}
            className="rounded-lg px-4 py-1.5 text-xs font-semibold transition-all"
            style={{
              backgroundColor: customHandicap ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
              color: customHandicap ? "var(--cg-bg-primary)" : "var(--cg-text-muted)",
              cursor: loading || !customHandicap ? "not-allowed" : "pointer",
              opacity: loading || !customHandicap ? 0.5 : 1,
            }}
          >
            Analyze
          </button>
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <section style={cardStyle}>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2
              className="h-8 w-8 animate-spin mb-4"
              style={{ color: "var(--cg-accent)" }}
            />
            <p className="text-sm font-medium" style={primaryText}>
              Analyzing course readability...
            </p>
            <p className="text-xs mt-1" style={mutedText}>
              Our AI is studying every hole to build your personalized strategy
            </p>
          </div>
        </section>
      )}

      {/* Error State */}
      {error && !loading && (
        <section style={cardStyle}>
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{
            backgroundColor: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: "#f87171" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "#f87171" }}>{error}</p>
              <p className="text-xs mt-0.5" style={mutedText}>Try again or select a different handicap range</p>
            </div>
          </div>
        </section>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          {/* Band indicator */}
          <div
            className="rounded-lg p-3 flex items-center gap-2"
            style={{
              backgroundColor: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.15)",
            }}
          >
            <Zap className="h-4 w-4" style={{ color: "#4ade80" }} />
            <span className="text-xs" style={secondaryText}>
              Strategy tailored for <strong style={{ color: "#4ade80" }}>{data.handicapLabel}</strong> golfer
              {data.cached && (
                <span style={mutedText}> · Cached analysis</span>
              )}
            </span>
          </div>

          {/* Overall Strategy */}
          {data.overallStrategy && (
            <section style={cardStyle}>
              <SectionHeading icon={<BookOpen className="h-5 w-5" style={{ color: "#fbbf24" }} />}>
                Overall Strategy
              </SectionHeading>
              <p className="text-sm leading-relaxed" style={secondaryText}>
                {data.overallStrategy}
              </p>
            </section>
          )}

          {/* Hole-by-Hole */}
          <section style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <SectionHeading icon={<Flag className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />}>
                Hole-by-Hole Guide
              </SectionHeading>
              <button
                onClick={toggleExpandAll}
                className="text-xs px-3 py-1 rounded-lg transition-all"
                style={{
                  backgroundColor: "var(--cg-bg-secondary)",
                  color: "var(--cg-text-muted)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                {expandAll ? "Collapse All" : "Expand All"}
              </button>
            </div>

            {/* Front Nine / Back Nine headers */}
            {data.holes.length > 0 && (
              <div className="space-y-6">
                {/* Front Nine */}
                <div>
                  <SubHeading>Front Nine</SubHeading>
                  <div className="space-y-2">
                    {data.holes
                      .filter(h => h.holeNumber <= 9)
                      .sort((a, b) => a.holeNumber - b.holeNumber)
                      .map((hole) => (
                        <HoleAdviceCard
                          key={hole.holeNumber}
                          hole={hole}
                          isExpanded={expandAll || expandedHole === hole.holeNumber}
                          onToggle={() => {
                            if (expandAll) return;
                            setExpandedHole(
                              expandedHole === hole.holeNumber ? null : hole.holeNumber
                            );
                          }}
                        />
                      ))}
                  </div>
                </div>

                {/* Back Nine */}
                {data.holes.some(h => h.holeNumber > 9) && (
                  <div>
                    <SubHeading>Back Nine</SubHeading>
                    <div className="space-y-2">
                      {data.holes
                        .filter(h => h.holeNumber > 9)
                        .sort((a, b) => a.holeNumber - b.holeNumber)
                        .map((hole) => (
                          <HoleAdviceCard
                            key={hole.holeNumber}
                            hole={hole}
                            isExpanded={expandAll || expandedHole === hole.holeNumber}
                            onToggle={() => {
                              if (expandAll) return;
                              setExpandedHole(
                                expandedHole === hole.holeNumber ? null : hole.holeNumber
                              );
                            }}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="flex justify-end">
            <PoweredByBadge variant="intelligence" />
          </div>
        </>
      )}

      {/* Initial Empty State (no handicap selected yet) */}
      {!data && !loading && !error && (
        <section style={cardStyle}>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className="flex items-center justify-center h-16 w-16 rounded-2xl mb-4"
              style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <Brain className="h-7 w-7" style={{ color: "#4ade80" }} />
            </div>
            <p className="text-sm font-medium" style={primaryText}>
              Select your handicap to get started
            </p>
            <p className="mt-1.5 text-xs max-w-xs" style={mutedText}>
              Choose a range above or enter your exact handicap index to receive
              AI-powered hole-by-hole strategy advice customized for your skill level
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
