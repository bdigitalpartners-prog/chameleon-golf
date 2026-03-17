"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback } from "react";
import {
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sun,
  CloudRain,
  Wind,
  Thermometer,
  Play,
  RefreshCw,
  Calendar,
} from "lucide-react";

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

interface WeatherStats {
  totalCourses: number;
  coursesWithWeather: number;
  coveragePercent: number;
}

interface GenerateResult {
  success: boolean;
  total: number;
  generated: number;
  skipped: number;
  errors?: string[];
  results?: Array<{
    courseId: number;
    courseName: string;
    status: "generated" | "skipped" | "error";
    bestMonths?: number[];
    error?: string;
  }>;
}

interface MonthData {
  month: number;
  avgHighF: string;
  avgLowF: string;
  avgPrecipInches: string;
  avgPrecipDays: number;
  avgSunnyDays: number;
  humidity: number;
  windSpeedMph: string;
  playabilityScore: number;
  bestTimeOfDay: string | null;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#84cc16";
  if (score >= 50) return "#eab308";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

export default function AdminWeatherPage() {
  const [stats, setStats] = useState<WeatherStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState("");
  const [batchLimit, setBatchLimit] = useState(25);
  const [batchOverwrite, setBatchOverwrite] = useState(false);
  const [courseIdInput, setCourseIdInput] = useState("");
  const [courseWeather, setCourseWeather] = useState<{
    courseId: number;
    courseName: string;
    bestMonths: number[];
    worstMonths: number[];
    months: MonthData[];
  } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    "x-admin-key": getAdminKey(),
  };

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/weather-enrich", { headers });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const batchGenerate = async () => {
    setGenerating(true);
    setGenerateResult(null);
    setError("");
    try {
      const body: any = { limit: batchLimit, overwrite: batchOverwrite };
      if (courseIdInput.trim()) {
        body.courseIds = courseIdInput.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
      }
      const res = await fetch("/api/admin/weather-enrich", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setGenerateResult(data);
      loadStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const lookupCourse = async () => {
    if (!courseIdInput.trim()) return;
    const id = parseInt(courseIdInput.trim(), 10);
    if (isNaN(id)) return;
    setLookupLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/weather-enrich?courseId=${id}`, { headers });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setCourseWeather(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "#111111", color: "#e5e5e5" }}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Sun className="h-7 w-7" style={{ color: "#00E676" }} />
            Weather & Playability
          </h1>
          <p className="text-sm mt-1" style={{ color: "#888" }}>
            Generate monthly weather data and playability scores for golf courses using AI.
          </p>
        </div>

        {/* Stats Card */}
        <div className="rounded-xl p-6" style={{ backgroundColor: "#1a1a1a", border: "1px solid #222" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#888" }}>
              Coverage
            </h2>
            <button
              onClick={loadStats}
              disabled={loading}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: "#222", color: "#00E676", border: "1px solid #333" }}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Refresh
            </button>
          </div>
          {stats ? (
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-bold tabular-nums" style={{ color: "#e5e5e5" }}>{stats.totalCourses}</div>
                <div className="text-xs" style={{ color: "#888" }}>Total Courses</div>
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums" style={{ color: "#00E676" }}>{stats.coursesWithWeather}</div>
                <div className="text-xs" style={{ color: "#888" }}>With Weather Data</div>
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums" style={{ color: "#00E676" }}>{stats.coveragePercent}%</div>
                <div className="text-xs" style={{ color: "#888" }}>Coverage</div>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "#666" }}>Click Refresh to load stats</p>
          )}
        </div>

        {/* Batch Generate */}
        <div className="rounded-xl p-6" style={{ backgroundColor: "#1a1a1a", border: "1px solid #222" }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "#888" }}>
            Generate Weather Data
          </h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs mb-1" style={{ color: "#888" }}>Course IDs (comma-sep, optional)</label>
              <input
                value={courseIdInput}
                onChange={(e) => setCourseIdInput(e.target.value)}
                placeholder="e.g. 1,2,3 or leave blank for batch"
                className="px-3 py-2 rounded-lg text-sm w-64"
                style={{ backgroundColor: "#222", border: "1px solid #333", color: "#e5e5e5" }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "#888" }}>Batch Limit</label>
              <input
                type="number"
                value={batchLimit}
                onChange={(e) => setBatchLimit(Number(e.target.value))}
                min={1}
                max={200}
                className="px-3 py-2 rounded-lg text-sm w-24"
                style={{ backgroundColor: "#222", border: "1px solid #333", color: "#e5e5e5" }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={batchOverwrite}
                onChange={(e) => setBatchOverwrite(e.target.checked)}
                className="accent-green-500"
                id="overwrite"
              />
              <label htmlFor="overwrite" className="text-xs" style={{ color: "#888" }}>Overwrite existing</label>
            </div>
            <button
              onClick={batchGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ backgroundColor: "#00E676", color: "#000" }}
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {generating ? "Generating..." : "Generate"}
            </button>
            <button
              onClick={lookupCourse}
              disabled={lookupLoading || !courseIdInput.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ backgroundColor: "#222", color: "#00E676", border: "1px solid #333" }}
            >
              {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Lookup
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "#ef4444" }} />
            <span className="text-sm" style={{ color: "#f87171" }}>{error}</span>
          </div>
        )}

        {/* Generate Results */}
        {generateResult && (
          <div className="rounded-xl p-6" style={{ backgroundColor: "#1a1a1a", border: "1px solid #222" }}>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5" style={{ color: "#00E676" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#e5e5e5" }}>Generation Results</h2>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="rounded-lg p-3" style={{ backgroundColor: "#222" }}>
                <div className="text-xl font-bold tabular-nums" style={{ color: "#e5e5e5" }}>{generateResult.total}</div>
                <div className="text-[10px] uppercase" style={{ color: "#888" }}>Processed</div>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: "#222" }}>
                <div className="text-xl font-bold tabular-nums" style={{ color: "#00E676" }}>{generateResult.generated}</div>
                <div className="text-[10px] uppercase" style={{ color: "#888" }}>Generated</div>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: "#222" }}>
                <div className="text-xl font-bold tabular-nums" style={{ color: "#888" }}>{generateResult.skipped}</div>
                <div className="text-[10px] uppercase" style={{ color: "#888" }}>Skipped</div>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: "#222" }}>
                <div className="text-xl font-bold tabular-nums" style={{ color: generateResult.errors?.length ? "#ef4444" : "#888" }}>
                  {generateResult.errors?.length || 0}
                </div>
                <div className="text-[10px] uppercase" style={{ color: "#888" }}>Errors</div>
              </div>
            </div>

            {generateResult.results && generateResult.results.length > 0 && (
              <div className="max-h-80 overflow-y-auto rounded-lg" style={{ border: "1px solid #333" }}>
                <table className="w-full text-xs">
                  <thead className="sticky top-0" style={{ backgroundColor: "#222" }}>
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold" style={{ color: "#888" }}>Course</th>
                      <th className="text-center py-2 px-3 font-semibold" style={{ color: "#888" }}>Status</th>
                      <th className="text-left py-2 px-3 font-semibold" style={{ color: "#888" }}>Best Months</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generateResult.results.map((r) => (
                      <tr key={r.courseId} style={{ borderTop: "1px solid #333" }}>
                        <td className="py-2 px-3" style={{ color: "#e5e5e5" }}>
                          <span className="font-medium">{r.courseName}</span>
                          <span className="ml-1.5 text-[10px]" style={{ color: "#666" }}>#{r.courseId}</span>
                        </td>
                        <td className="text-center py-2 px-3">
                          {r.status === "generated" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: "rgba(0,230,118,0.15)", color: "#00E676" }}>
                              <CheckCircle2 className="h-3 w-3" /> Generated
                            </span>
                          )}
                          {r.status === "skipped" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#333", color: "#888" }}>Skipped</span>
                          )}
                          {r.status === "error" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                              <AlertCircle className="h-3 w-3" /> Error
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {r.bestMonths && r.bestMonths.length > 0 ? (
                            <div className="flex gap-1">
                              {r.bestMonths.map((m) => (
                                <span key={m} className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "rgba(0,230,118,0.15)", color: "#00E676" }}>
                                  {MONTH_LABELS[m - 1]}
                                </span>
                              ))}
                            </div>
                          ) : r.error ? (
                            <span className="text-[10px]" style={{ color: "#f87171" }}>{r.error.slice(0, 60)}</span>
                          ) : (
                            <span style={{ color: "#666" }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Course Weather Lookup Results */}
        {courseWeather && courseWeather.months?.length > 0 && (
          <div className="rounded-xl p-6" style={{ backgroundColor: "#1a1a1a", border: "1px solid #222" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#e5e5e5" }}>
              <Calendar className="h-4 w-4 inline mr-2" style={{ color: "#00E676" }} />
              {courseWeather.courseName} — Weather Data
            </h2>

            {/* Best Months */}
            {courseWeather.bestMonths?.length > 0 && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-xs font-semibold" style={{ color: "#888" }}>Best months:</span>
                {courseWeather.bestMonths.map((m: number) => (
                  <span key={m} className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: "rgba(0,230,118,0.15)", color: "#00E676", border: "1px solid rgba(0,230,118,0.3)" }}>
                    {MONTH_LABELS[m - 1]}
                  </span>
                ))}
              </div>
            )}

            {/* Playability Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2 mb-6">
              {courseWeather.months.map((m: MonthData) => {
                const score = m.playabilityScore;
                const color = getScoreColor(score);
                return (
                  <div key={m.month} className="rounded-lg p-2 text-center" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}33` }}>
                    <div className="text-[10px] font-semibold uppercase" style={{ color: "#888" }}>{MONTH_LABELS[m.month - 1]}</div>
                    <div className="text-lg font-bold tabular-nums" style={{ color }}>{score}</div>
                    <div className="text-[9px]" style={{ color: "#666" }}>
                      {Math.round(Number(m.avgHighF))}°/{Math.round(Number(m.avgLowF))}°
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Table */}
            <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid #333" }}>
              <table className="w-full text-xs">
                <thead style={{ backgroundColor: "#222" }}>
                  <tr>
                    <th className="text-left py-2 px-3 font-semibold" style={{ color: "#888" }}>Month</th>
                    <th className="text-center py-2 px-3 font-semibold" style={{ color: "#888" }}>
                      <Thermometer className="h-3 w-3 inline mr-0.5" />Hi/Lo
                    </th>
                    <th className="text-center py-2 px-3 font-semibold" style={{ color: "#888" }}>
                      <CloudRain className="h-3 w-3 inline mr-0.5" />Rain
                    </th>
                    <th className="text-center py-2 px-3 font-semibold" style={{ color: "#888" }}>
                      <Sun className="h-3 w-3 inline mr-0.5" />Sun
                    </th>
                    <th className="text-center py-2 px-3 font-semibold" style={{ color: "#888" }}>
                      <Wind className="h-3 w-3 inline mr-0.5" />Wind
                    </th>
                    <th className="text-center py-2 px-3 font-semibold" style={{ color: "#888" }}>Humidity</th>
                    <th className="text-center py-2 px-3 font-semibold" style={{ color: "#888" }}>Score</th>
                    <th className="text-left py-2 px-3 font-semibold" style={{ color: "#888" }}>Best Time</th>
                  </tr>
                </thead>
                <tbody>
                  {courseWeather.months.map((m: MonthData) => {
                    const score = m.playabilityScore;
                    const color = getScoreColor(score);
                    return (
                      <tr key={m.month} style={{ borderTop: "1px solid #333" }}>
                        <td className="py-2 px-3 font-medium" style={{ color: "#e5e5e5" }}>{MONTH_LABELS[m.month - 1]}</td>
                        <td className="text-center py-2 px-3 tabular-nums" style={{ color: "#ccc" }}>
                          {Math.round(Number(m.avgHighF))}° / {Math.round(Number(m.avgLowF))}°
                        </td>
                        <td className="text-center py-2 px-3 tabular-nums" style={{ color: "#ccc" }}>
                          {Number(m.avgPrecipInches).toFixed(1)}&quot; ({m.avgPrecipDays}d)
                        </td>
                        <td className="text-center py-2 px-3 tabular-nums" style={{ color: "#ccc" }}>{m.avgSunnyDays}d</td>
                        <td className="text-center py-2 px-3 tabular-nums" style={{ color: "#ccc" }}>{Number(m.windSpeedMph).toFixed(0)} mph</td>
                        <td className="text-center py-2 px-3 tabular-nums" style={{ color: "#ccc" }}>{m.humidity}%</td>
                        <td className="text-center py-2 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums" style={{ backgroundColor: `${color}22`, color }}>
                            {score}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[10px]" style={{ color: "#888" }}>{m.bestTimeOfDay || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
