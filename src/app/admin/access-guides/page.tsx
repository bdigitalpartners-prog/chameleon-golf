"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Key, Shield, Loader2, CheckCircle, XCircle, RefreshCw,
  Search, AlertTriangle, BarChart3,
} from "lucide-react";

const card: React.CSSProperties = {
  backgroundColor: "var(--cg-bg-card)",
  border: "1px solid var(--cg-border)",
  borderRadius: "0.75rem",
  padding: "1.5rem",
};
const muted: React.CSSProperties = { color: "var(--cg-text-muted)" };
const secondary: React.CSSProperties = { color: "var(--cg-text-secondary)" };
const primary: React.CSSProperties = { color: "var(--cg-text-primary)" };

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Walk-On Friendly",
  2: "Easy Access",
  3: "Moderate",
  4: "Difficult",
  5: "Nearly Impossible",
};

const DIFFICULTY_COLORS: Record<number, string> = {
  1: "#22c55e",
  2: "#4ade80",
  3: "#eab308",
  4: "#f97316",
  5: "#ef4444",
};

export default function AccessGuidesAdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [courseIds, setCourseIds] = useState("");
  const [limit, setLimit] = useState(10);
  const [overwrite, setOverwrite] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/access-guide-enrich", {
        headers: { "x-admin-key": localStorage.getItem("adminKey") || "" },
      });
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);
    try {
      const body: any = { limit, overwrite };
      if (courseIds.trim()) {
        body.courseIds = courseIds.split(",").map((id) => parseInt(id.trim())).filter((n) => !isNaN(n));
      }
      const res = await fetch("/api/admin/access-guide-enrich", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": localStorage.getItem("adminKey") || "",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data);
      fetchStats();
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={primary}>
            <Key className="h-6 w-6" style={{ color: "var(--cg-accent)" }} />
            Access Guides
          </h1>
          <p className="text-sm mt-1" style={muted}>
            Generate "How to Get On" guides for courses using AI
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2 rounded-lg hover:opacity-80"
          style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
        >
          <RefreshCw className="h-4 w-4" style={muted} />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div style={card}>
            <div className="text-xs font-medium uppercase tracking-wider" style={muted}>Total Guides</div>
            <div className="text-2xl font-bold mt-1" style={{ color: "var(--cg-accent)" }}>{stats.totalGuides}</div>
          </div>
          <div style={card}>
            <div className="text-xs font-medium uppercase tracking-wider" style={muted}>Coverage</div>
            <div className="text-2xl font-bold mt-1" style={{ color: "var(--cg-accent)" }}>{stats.coveragePct}%</div>
            <div className="text-xs" style={muted}>{stats.totalGuides} / {stats.totalCourses} courses</div>
          </div>
          <div style={card}>
            <div className="text-xs font-medium uppercase tracking-wider mb-2" style={muted}>By Difficulty</div>
            <div className="space-y-1">
              {Object.entries(stats.difficultyBreakdown || {}).map(([label, count]) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span style={secondary}>{label}</span>
                  <span className="font-semibold tabular-nums" style={primary}>{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Generate Form */}
      <div style={card}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={primary}>
          <BarChart3 className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
          Generate Access Guides
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={secondary}>
              Course IDs (optional, comma-separated)
            </label>
            <input
              type="text"
              value={courseIds}
              onChange={(e) => setCourseIds(e.target.value)}
              placeholder="Leave empty to auto-select top courses"
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--cg-bg-secondary)", border: "1px solid var(--cg-border)", color: "var(--cg-text-primary)" }}
            />
          </div>

          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={secondary}>Limit</label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
                min={1}
                max={50}
                className="w-24 rounded-lg px-3 py-2 text-sm"
                style={{ backgroundColor: "var(--cg-bg-secondary)", border: "1px solid var(--cg-border)", color: "var(--cg-text-primary)" }}
              />
            </div>

            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={secondary}>
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  className="rounded"
                />
                Overwrite existing
              </label>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
            style={{
              backgroundColor: "var(--cg-accent)",
              color: "white",
              opacity: generating ? 0.5 : 1,
              cursor: generating ? "not-allowed" : "pointer",
            }}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Key className="h-4 w-4" />
                Generate Guides
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div style={card}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={primary}>
            {result.error ? (
              <XCircle className="h-5 w-5" style={{ color: "var(--cg-error)" }} />
            ) : (
              <CheckCircle className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
            )}
            Results
          </h3>

          {result.error ? (
            <div className="text-sm" style={{ color: "var(--cg-error)" }}>{result.error}</div>
          ) : (
            <>
              <div className="flex gap-6 mb-4 text-sm">
                <div>
                  <span style={muted}>Processed: </span>
                  <span className="font-semibold" style={primary}>{result.processed}</span>
                </div>
                <div>
                  <span style={muted}>Created: </span>
                  <span className="font-semibold" style={{ color: "var(--cg-accent)" }}>{result.created}</span>
                </div>
                <div>
                  <span style={muted}>Updated: </span>
                  <span className="font-semibold" style={primary}>{result.updated}</span>
                </div>
              </div>

              {result.results?.map((r: any) => (
                <div
                  key={r.courseId}
                  className="flex items-center justify-between py-2 border-b"
                  style={{ borderColor: "var(--cg-border)" }}
                >
                  <div>
                    <span className="text-sm font-medium" style={primary}>{r.courseName}</span>
                    <span className="text-xs ml-2" style={muted}>#{r.courseId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.difficultyRating && (
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${DIFFICULTY_COLORS[r.difficultyRating]}20`,
                          color: DIFFICULTY_COLORS[r.difficultyRating],
                        }}
                      >
                        {DIFFICULTY_LABELS[r.difficultyRating]}
                      </span>
                    )}
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: r.status === "error"
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(34,197,94,0.15)",
                        color: r.status === "error" ? "#ef4444" : "#22c55e",
                      }}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}

              {result.errors && (
                <div className="mt-4 space-y-1">
                  <div className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--cg-error)" }}>
                    <AlertTriangle className="h-3 w-3" /> Errors:
                  </div>
                  {result.errors.map((err: string, i: number) => (
                    <div key={i} className="text-xs" style={{ color: "var(--cg-error)" }}>{err}</div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
