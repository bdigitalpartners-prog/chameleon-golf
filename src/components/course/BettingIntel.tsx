"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Target, BarChart3, Loader2, ChevronRight } from "lucide-react";

/* ─── Course type badge styles ─── */
const COURSE_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  bomber_paradise: { bg: "bg-red-500/20", text: "text-red-400", label: "Bomber's Paradise" },
  iron_test: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Iron Test" },
  scramble_course: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Scramble Course" },
  putter_friendly: { bg: "bg-green-500/20", text: "text-green-400", label: "Putter's Paradise" },
  birdie_fest: { bg: "bg-green-500/20", text: "text-green-400", label: "Birdie Fest" },
  all_around: { bg: "bg-purple-500/20", text: "text-purple-400", label: "All-Around Test" },
};

const COURSE_TYPE_DESCRIPTIONS: Record<string, string> = {
  bomber_paradise: "Long hitters gain a significant advantage. Driving distance is the primary differentiator.",
  iron_test: "Precision and accuracy are paramount. GIR% and approach quality determine success.",
  scramble_course: "Short game mastery is essential. Scrambling ability separates contenders.",
  putter_friendly: "The flatstick decides outcomes. Putting efficiency is the #1 predictor.",
  birdie_fest: "Scorable layout where birdie-or-better percentage dominates. Hot putters thrive.",
  all_around: "Complete game required. No single stat dominates — well-rounded players excel.",
};

const STAT_CONFIG: Record<string, { label: string; max: number; unit: string }> = {
  scoring_avg: { label: "Scoring Avg", max: 75, unit: "" },
  fairways_hit_pct: { label: "Fairways Hit %", max: 80, unit: "%" },
  gir_pct: { label: "GIR %", max: 80, unit: "%" },
  driving_distance_avg: { label: "Driving Distance", max: 320, unit: " yds" },
  scrambling_pct: { label: "Scrambling %", max: 70, unit: "%" },
  putts_per_round: { label: "Putts/Round", max: 32, unit: "" },
};

interface BettingIntelProps {
  courseId: number;
}

export default function BettingIntel({ courseId }: BettingIntelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/betting/course-profile?courseId=${courseId}`);
        if (!res.ok) {
          setData(null);
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (!data) return null;

  const { profile, stats, correlatedCourses } = data;
  const typeStyle = COURSE_TYPE_STYLES[profile.courseType] || COURSE_TYPE_STYLES.all_around;

  // Get latest year stats
  const latestYear = stats?.length > 0 ? Math.max(...stats.map((s: any) => s.year)) : null;
  const latestStats = stats?.filter((s: any) => s.year === latestYear) || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5" style={{ color: "#00FF85" }} />
        <h3 className="text-lg font-bold" style={{ color: "var(--cg-text-primary)" }}>
          Betting Intel
        </h3>
      </div>

      {/* Course Type Badge + Description */}
      <div className="rounded-lg p-4 border" style={{ backgroundColor: "var(--cg-bg-card)", borderColor: "var(--cg-border)" }}>
        <div className="flex items-center gap-3 mb-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${typeStyle.bg} ${typeStyle.text}`}>
            {typeStyle.label}
          </span>
          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4" style={{ color: "#00FF85" }} />
            <span className="text-sm font-medium" style={{ color: "#00FF85" }}>
              Key: {profile.keyStat}
            </span>
          </div>
        </div>
        <p className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>
          {COURSE_TYPE_DESCRIPTIONS[profile.courseType] || ""}
        </p>
      </div>

      {/* Key Stats Bar Chart */}
      {latestStats.length > 0 && (
        <div className="rounded-lg p-4 border" style={{ backgroundColor: "var(--cg-bg-card)", borderColor: "var(--cg-border)" }}>
          <h4 className="text-xs font-semibold mb-3" style={{ color: "var(--cg-text-muted)" }}>
            KEY STATS ({latestYear})
          </h4>
          <div className="space-y-3">
            {latestStats.map((s: any) => {
              const cfg = STAT_CONFIG[s.stat_type];
              if (!cfg) return null;
              const pct = Math.min((s.stat_value / cfg.max) * 100, 100);
              return (
                <div key={s.stat_type} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--cg-text-secondary)" }}>{cfg.label}</span>
                    <span className="font-medium" style={{ color: "var(--cg-text-primary)" }}>
                      {s.stat_value}{cfg.unit}
                    </span>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: "#00FF85" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Results */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg p-3 border" style={{ backgroundColor: "var(--cg-bg-card)", borderColor: "var(--cg-border)" }}>
          <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>Typical Winning Score</div>
          <div className="text-lg font-bold" style={{ color: "var(--cg-text-primary)" }}>
            {profile.typicalWinningScore}
          </div>
        </div>
        <div className="rounded-lg p-3 border" style={{ backgroundColor: "var(--cg-bg-card)", borderColor: "var(--cg-border)" }}>
          <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>Historical Cut Line</div>
          <div className="text-lg font-bold" style={{ color: "var(--cg-text-primary)" }}>
            {profile.historicalCutLine}
          </div>
        </div>
      </div>

      {/* Plays Like — Correlated Courses */}
      {correlatedCourses?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold mb-3" style={{ color: "var(--cg-text-muted)" }}>
            PLAYS LIKE
          </h4>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {correlatedCourses.map((c: any) => (
              <Link
                key={c.id}
                href={`/course/${c.id}`}
                className="flex-shrink-0 w-44 rounded-lg p-3 border transition-colors hover:border-[#00FF85]/30"
                style={{ backgroundColor: "var(--cg-bg-card)", borderColor: "var(--cg-border)" }}
              >
                <div className="text-sm font-medium truncate" style={{ color: "var(--cg-text-primary)" }}>
                  {c.name}
                </div>
                <div className="text-xs mb-1" style={{ color: "var(--cg-text-muted)" }}>
                  {c.city}, {c.state}
                </div>
                {c.courseType && (
                  <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    (COURSE_TYPE_STYLES[c.courseType] || COURSE_TYPE_STYLES.all_around).bg
                  } ${(COURSE_TYPE_STYLES[c.courseType] || COURSE_TYPE_STYLES.all_around).text}`}>
                    {(COURSE_TYPE_STYLES[c.courseType] || COURSE_TYPE_STYLES.all_around).label}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {profile.notes && (
        <p className="text-sm leading-relaxed" style={{ color: "var(--cg-text-secondary)" }}>
          {profile.notes}
        </p>
      )}

      <Link
        href="/betting"
        className="inline-flex items-center gap-1 text-sm font-medium"
        style={{ color: "#00FF85" }}
      >
        View Full Betting & DFS Hub <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
