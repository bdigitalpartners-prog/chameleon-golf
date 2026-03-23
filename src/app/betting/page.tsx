"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Search,
  BarChart3,
  ArrowRight,
  Target,
  Loader2,
  Zap,
  ChevronRight,
} from "lucide-react";

/* ─── Type badges ─── */
const COURSE_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  bomber_paradise: { bg: "bg-red-500/20", text: "text-red-400", label: "Bomber's Paradise" },
  iron_test: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Iron Test" },
  scramble_course: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Scramble Course" },
  putter_friendly: { bg: "bg-green-500/20", text: "text-green-400", label: "Putter's Paradise" },
  birdie_fest: { bg: "bg-green-500/20", text: "text-green-400", label: "Birdie Fest" },
  all_around: { bg: "bg-purple-500/20", text: "text-purple-400", label: "All-Around Test" },
};

function CourseTypeBadge({ type }: { type: string }) {
  const style = COURSE_TYPE_STYLES[type] || COURSE_TYPE_STYLES.all_around;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

/* ─── Stat bar ─── */
function StatBar({ label, value, max, unit }: { label: string; value: number; max: number; unit?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span style={{ color: "var(--cg-text-secondary)" }}>{label}</span>
        <span className="font-medium" style={{ color: "var(--cg-text-primary)" }}>
          {value}{unit || ""}
        </span>
      </div>
      <div className="h-2 rounded-full" style={{ backgroundColor: "var(--cg-bg-card)" }}>
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: "#00FF85" }}
        />
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function BettingPage() {
  const [thisWeek, setThisWeek] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [correlationCourse, setCorrelationCourse] = useState<any>(null);
  const [correlations, setCorrelations] = useState<any>(null);
  const [correlationLoading, setCorrelationLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [twRes, allRes] = await Promise.all([
          fetch("/api/betting/this-week"),
          fetch("/api/betting/course-stats?courseId=0").catch(() => null),
        ]);

        const twData = await twRes.json();
        setThisWeek(twData.thisWeek);

        // Load all profiles by fetching from the correlations endpoint for each known type
        const types = ["bomber_paradise", "iron_test", "scramble_course", "birdie_fest", "all_around"];
        const allProfiles: any[] = [];

        // Fetch profiles by getting course-profile for known courses
        // Instead, we'll use a simpler approach: fetch course-stats endpoint
        // and aggregate. For the directory, we query all DFS profiles.
        const dirRes = await fetch("/api/satellite/search?limit=100");
        const dirData = await dirRes.json();

        // For each course with satellite data, try to get its betting profile
        if (dirData.courses) {
          const profilePromises = dirData.courses.map(async (c: any) => {
            try {
              const res = await fetch(`/api/betting/course-profile?courseId=${c.courseId}`);
              if (res.ok) {
                const data = await res.json();
                return data.profile;
              }
            } catch {}
            return null;
          });

          const results = await Promise.all(profilePromises);
          allProfiles.push(...results.filter(Boolean));
        }

        setProfiles(allProfiles);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function loadCorrelations(courseId: number) {
    setCorrelationLoading(true);
    try {
      const res = await fetch(`/api/betting/correlations?courseId=${courseId}`);
      const data = await res.json();
      setCorrelations(data);
      setCorrelationCourse(data.sourceCourse);
    } catch (e) {
      console.error(e);
    } finally {
      setCorrelationLoading(false);
    }
  }

  const filteredProfiles = profiles.filter((p) => {
    if (search && !p.courseName?.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && p.courseType !== typeFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
             style={{ backgroundColor: "rgba(0,255,133,0.1)", color: "#00FF85" }}>
          <TrendingUp className="w-3.5 h-3.5" />
          BETTING & DFS INTELLIGENCE
        </div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
          Betting & DFS Course Intelligence
        </h1>
        <p className="text-lg" style={{ color: "var(--cg-text-secondary)" }}>
          The data edge for golf wagering
        </p>
      </div>

      {/* This Week */}
      {thisWeek && (
        <section className="rounded-xl p-6 border" style={{ backgroundColor: "var(--cg-bg-card)", borderColor: "var(--cg-border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5" style={{ color: "#00FF85" }} />
            <h2 className="text-lg font-bold" style={{ color: "var(--cg-text-primary)" }}>This Week</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
                  {thisWeek.courseName}
                </h3>
                <CourseTypeBadge type={thisWeek.courseType} />
              </div>
              <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                {thisWeek.city}, {thisWeek.state}
              </p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(0,255,133,0.08)" }}>
                <Target className="w-4 h-4" style={{ color: "#00FF85" }} />
                <span className="text-sm font-medium" style={{ color: "#00FF85" }}>
                  {thisWeek.keyStat} is the #1 predictor at this course
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
                  <div style={{ color: "var(--cg-text-muted)" }}>Typical Winning Score</div>
                  <div className="font-bold text-lg" style={{ color: "var(--cg-text-primary)" }}>
                    {thisWeek.typicalWinningScore}
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
                  <div style={{ color: "var(--cg-text-muted)" }}>Historical Cut Line</div>
                  <div className="font-bold text-lg" style={{ color: "var(--cg-text-primary)" }}>
                    {thisWeek.historicalCutLine}
                  </div>
                </div>
              </div>
              {thisWeek.notes && (
                <p className="text-sm leading-relaxed" style={{ color: "var(--cg-text-secondary)" }}>
                  {thisWeek.notes}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold" style={{ color: "var(--cg-text-muted)" }}>
                KEY STATS
              </h4>
              {thisWeek.latestStats?.map((s: any) => {
                const maxes: Record<string, number> = {
                  scoring_avg: 75, fairways_hit_pct: 80, gir_pct: 80,
                  driving_distance_avg: 320, scrambling_pct: 70, putts_per_round: 32,
                };
                const labels: Record<string, string> = {
                  scoring_avg: "Scoring Avg", fairways_hit_pct: "Fairways Hit %",
                  gir_pct: "GIR %", driving_distance_avg: "Driving Distance",
                  scrambling_pct: "Scrambling %", putts_per_round: "Putts/Round",
                };
                return (
                  <StatBar
                    key={s.statType}
                    label={labels[s.statType] || s.statType}
                    value={s.value}
                    max={maxes[s.statType] || 100}
                    unit={s.statType === "driving_distance_avg" ? " yds" : ""}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Course Profiles Directory */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
          Course Profiles
        </h2>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--cg-text-muted)" }} />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm border outline-none"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                borderColor: "var(--cg-border)",
                color: "var(--cg-text-primary)",
              }}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border outline-none"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              borderColor: "var(--cg-border)",
              color: "var(--cg-text-primary)",
            }}
          >
            <option value="">All Types</option>
            <option value="bomber_paradise">Bomber&apos;s Paradise</option>
            <option value="iron_test">Iron Test</option>
            <option value="scramble_course">Scramble Course</option>
            <option value="birdie_fest">Birdie Fest</option>
            <option value="all_around">All-Around Test</option>
          </select>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map((p: any) => (
            <div
              key={p.courseId}
              className="rounded-xl p-4 border transition-all duration-200 cursor-pointer hover:border-[#00FF85]/30"
              style={{ backgroundColor: "var(--cg-bg-card)", borderColor: "var(--cg-border)" }}
              onClick={() => loadCorrelations(p.courseId)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-bold leading-tight" style={{ color: "var(--cg-text-primary)" }}>
                  {p.courseName}
                </h3>
                <CourseTypeBadge type={p.courseType} />
              </div>
              <p className="text-xs mb-3" style={{ color: "var(--cg-text-muted)" }}>
                {p.city}, {p.state}
              </p>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5" style={{ color: "#00FF85" }} />
                <span className="text-xs font-medium" style={{ color: "#00FF85" }}>
                  Key Stat: {p.keyStat}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs" style={{ color: "var(--cg-text-secondary)" }}>
                <span>Winning: {p.typicalWinningScore}</span>
                <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--cg-text-muted)" }} />
              </div>
            </div>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: "var(--cg-text-muted)" }} />
            <p style={{ color: "var(--cg-text-muted)" }}>No course profiles found</p>
          </div>
        )}
      </section>

      {/* Correlation Finder */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
          Correlation Finder
        </h2>
        <p className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>
          Click a course above to see which other courses play most similarly.
          Useful for DFS: &quot;If a player performs well at X, they&apos;ll likely perform well at Y.&quot;
        </p>

        {correlationLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
          </div>
        )}

        {correlations && !correlationLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: "var(--cg-text-muted)" }}>Showing correlations for:</span>
              <span className="font-bold" style={{ color: "var(--cg-text-primary)" }}>
                {correlationCourse?.name}
              </span>
              <CourseTypeBadge type={correlationCourse?.courseType || "all_around"} />
            </div>

            {correlations.directCorrelations?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--cg-text-muted)" }}>
                  DIRECT CORRELATIONS
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {correlations.directCorrelations.map((c: any) => (
                    <div
                      key={c.id}
                      className="rounded-lg p-3 border flex items-center gap-3"
                      style={{ backgroundColor: "var(--cg-bg-card)", borderColor: "var(--cg-border)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: "var(--cg-text-primary)" }}>
                          {c.name}
                        </div>
                        <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                          {c.city}, {c.state}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold" style={{ color: "#00FF85" }}>
                          {c.similarityPct}%
                        </div>
                        <div className="text-[10px]" style={{ color: "var(--cg-text-muted)" }}>match</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {correlations.typeMatches?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--cg-text-muted)" }}>
                  SAME COURSE TYPE
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {correlations.typeMatches.map((c: any) => (
                    <div
                      key={c.id}
                      className="rounded-lg p-3 border flex items-center gap-3"
                      style={{ backgroundColor: "var(--cg-bg-card)", borderColor: "var(--cg-border)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: "var(--cg-text-primary)" }}>
                          {c.name}
                        </div>
                        <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                          {c.city}, {c.state}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold" style={{ color: "var(--cg-text-secondary)" }}>
                          {c.similarityPct}%
                        </div>
                        <div className="text-[10px]" style={{ color: "var(--cg-text-muted)" }}>match</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!correlations && !correlationLoading && (
          <div className="text-center py-8 rounded-xl border" style={{ backgroundColor: "var(--cg-bg-card)", borderColor: "var(--cg-border)" }}>
            <ArrowRight className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: "var(--cg-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
              Select a course from the profiles above to find correlations
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
