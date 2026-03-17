"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Search,
  Layers,
  Clock,
  Compass,
} from "lucide-react";

function getAdminKey(): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("key") || sessionStorage.getItem("golfEQ_admin_key") || "";
}

interface Stats {
  totalCourses: number;
  withDesignDna: number;
  withRenovations: number;
  withTemplateHoles: number;
  totalRenovations: number;
  totalTemplateHoles: number;
  coveragePct: number;
}

interface UnenrichedCourse {
  courseId: number;
  courseName: string;
  numListsAppeared: number | null;
  originalArchitect: string | null;
}

interface EnrichResult {
  courseId: number;
  courseName: string;
  success: boolean;
  designDna?: boolean;
  renovations?: number;
  templateHoles?: number;
  error?: string;
}

export default function ArchitectureIntelligencePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [unenrichedCourses, setUnenrichedCourses] = useState<UnenrichedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [results, setResults] = useState<EnrichResult[]>([]);
  const [batchSize, setBatchSize] = useState(5);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const key = getAdminKey();
      const res = await fetch(`/api/admin/architecture-enrich?key=${key}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setUnenrichedCourses(data.unenrichedCourses || []);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const runEnrichment = async () => {
    setEnriching(true);
    setResults([]);
    try {
      const key = getAdminKey();
      const body: any = { limit: batchSize, topRankedFirst: true };
      if (selectedCourseIds.length > 0) {
        body.courseIds = selectedCourseIds;
      }
      const res = await fetch(`/api/admin/architecture-enrich?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        await fetchStats(); // Refresh stats
      } else {
        const errData = await res.json().catch(() => ({ error: "Unknown error" }));
        setResults([{ courseId: 0, courseName: "Error", success: false, error: errData.error }]);
      }
    } catch (err: any) {
      setResults([{ courseId: 0, courseName: "Error", success: false, error: err.message }]);
    } finally {
      setEnriching(false);
      setSelectedCourseIds([]);
    }
  };

  const toggleCourseSelection = (courseId: number) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const filteredCourses = unenrichedCourses.filter(
    (c) =>
      c.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.originalArchitect?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#141414",
    border: "1px solid #262626",
    borderRadius: "0.75rem",
    padding: "1.5rem",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="h-7 w-7 text-green-500" />
            Architecture Intelligence
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Design DNA, renovation history, and template hole enrichment
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Compass className="h-5 w-5" />}
            label="Design DNA Coverage"
            value={`${stats.withDesignDna}/${stats.totalCourses}`}
            subValue={`${stats.coveragePct}%`}
            color="green"
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="With Renovations"
            value={`${stats.withRenovations} courses`}
            subValue={`${stats.totalRenovations} total entries`}
            color="yellow"
          />
          <StatCard
            icon={<Layers className="h-5 w-5" />}
            label="With Template Holes"
            value={`${stats.withTemplateHoles} courses`}
            subValue={`${stats.totalTemplateHoles} holes identified`}
            color="purple"
          />
          <StatCard
            icon={<Building2 className="h-5 w-5" />}
            label="Unenriched"
            value={`${stats.totalCourses - stats.withDesignDna}`}
            subValue="courses remaining"
            color="red"
          />
        </div>
      )}

      {/* Enrichment Controls */}
      <div style={cardStyle}>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Play className="h-5 w-5 text-green-500" />
          Run Architecture Enrichment
        </h2>
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Batch Size</label>
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value))}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            >
              {[1, 3, 5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} courses
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={runEnrichment}
            disabled={enriching}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {enriching ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {enriching
              ? "Enriching..."
              : selectedCourseIds.length > 0
                ? `Enrich ${selectedCourseIds.length} Selected`
                : `Enrich Top ${batchSize}`}
          </button>
        </div>

        {selectedCourseIds.length > 0 && (
          <p className="text-xs text-green-400 mb-2">
            {selectedCourseIds.length} course{selectedCourseIds.length !== 1 ? "s" : ""} selected
            <button
              className="ml-2 underline text-gray-400 hover:text-white"
              onClick={() => setSelectedCourseIds([])}
            >
              Clear
            </button>
          </p>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div style={cardStyle}>
          <h2 className="text-lg font-semibold text-white mb-4">Enrichment Results</h2>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg p-3"
                style={{
                  backgroundColor: r.success ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                  border: `1px solid ${r.success ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                }}
              >
                {r.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white">
                    {r.courseName}
                  </span>
                  {r.success ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {r.designDna && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-green-500/15 text-green-400 border border-green-500/30">
                          Design DNA
                        </span>
                      )}
                      {(r.renovations ?? 0) > 0 && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                          {r.renovations} renovations
                        </span>
                      )}
                      {(r.templateHoles ?? 0) > 0 && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30">
                          {r.templateHoles} template holes
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-red-400 mt-0.5">{r.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unenriched Courses */}
      <div style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Top Unenriched Courses
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-gray-700 bg-gray-800 pl-9 pr-3 py-1.5 text-sm text-white w-48"
            />
          </div>
        </div>
        <div className="space-y-1">
          {filteredCourses.map((course) => {
            const isSelected = selectedCourseIds.includes(course.courseId);
            return (
              <div
                key={course.courseId}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                style={{
                  backgroundColor: isSelected ? "rgba(34,197,94,0.08)" : "transparent",
                  border: `1px solid ${isSelected ? "rgba(34,197,94,0.2)" : "transparent"}`,
                }}
                onClick={() => toggleCourseSelection(course.courseId)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCourseSelection(course.courseId)}
                  className="h-4 w-4 rounded border-gray-600 accent-green-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white">
                    {course.courseName}
                  </span>
                  {course.originalArchitect && (
                    <span className="text-xs text-gray-500 ml-2">
                      by {course.originalArchitect}
                    </span>
                  )}
                </div>
                {course.numListsAppeared != null && course.numListsAppeared > 0 && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    {course.numListsAppeared} lists
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-gray-600 flex-shrink-0" />
              </div>
            );
          })}
          {filteredCourses.length === 0 && (
            <p className="text-sm text-gray-500 py-4 text-center">
              {searchTerm ? "No matching courses" : "All courses have been enriched!"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  color: "green" | "yellow" | "purple" | "red";
}) {
  const colorMap = {
    green: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)", text: "#4ade80" },
    yellow: { bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.2)", text: "#fbbf24" },
    purple: { bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.2)", text: "#c084fc" },
    red: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", text: "#f87171" },
  };
  const c = colorMap[color];

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: "#141414", border: "1px solid #262626" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="flex items-center justify-center h-8 w-8 rounded-lg"
          style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.text }}
        >
          {icon}
        </div>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{subValue}</div>
    </div>
  );
}
