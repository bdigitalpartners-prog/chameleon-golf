"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Database,
} from "lucide-react";

interface FieldStats {
  total_courses: number;
  has_description: number;
  has_par: number;
  has_year_opened: number;
  has_architect: number;
  has_course_type: number;
  has_access_type: number;
  has_course_style: number;
  has_green_fee_low: number;
  has_green_fee_high: number;
  has_walking_policy: number;
  has_dress_code: number;
  has_caddie: number;
  has_practice: number;
  has_best_time: number;
  has_best_months: number;
  has_golf_season: number;
  has_round_time: number;
  has_fairway_grass: number;
  has_green_grass: number;
  has_website: number;
  has_phone: number;
  has_coordinates: number;
  has_address: number;
}

interface TierCounts {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  minimal: number;
}

interface CourseEnrichment {
  courseId: number;
  courseName: string;
  city: string | null;
  state: string | null;
  accessType: string | null;
  enrichmentPct: number;
  tier: string;
  missingFields: string[];
  hasDescription: boolean;
}

interface EnrichResult {
  courseId: number;
  courseName: string;
  fieldsEnriched: number;
  beforePct: number;
  afterPct: number;
  status: string;
  error?: string;
}

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  excellent: { label: "Excellent (80%+)", color: "text-green-400", bg: "bg-green-900/40" },
  good: { label: "Good (60-79%)", color: "text-blue-400", bg: "bg-blue-900/40" },
  fair: { label: "Fair (40-59%)", color: "text-yellow-400", bg: "bg-yellow-900/40" },
  poor: { label: "Poor (20-39%)", color: "text-orange-400", bg: "bg-orange-900/40" },
  minimal: { label: "Minimal (<20%)", color: "text-red-400", bg: "bg-red-900/40" },
};

const FIELD_LABELS: Record<string, string> = {
  has_description: "Description",
  has_par: "Par",
  has_year_opened: "Year Opened",
  has_architect: "Architect",
  has_course_type: "Course Type",
  has_access_type: "Access Type",
  has_course_style: "Course Style",
  has_green_fee_low: "Green Fee (Low)",
  has_green_fee_high: "Green Fee (High)",
  has_walking_policy: "Walking Policy",
  has_dress_code: "Dress Code",
  has_caddie: "Caddie Availability",
  has_practice: "Practice Facilities",
  has_best_time: "Best Time to Play",
  has_best_months: "Best Months",
  has_golf_season: "Golf Season",
  has_round_time: "Round Time",
  has_fairway_grass: "Fairway Grass",
  has_green_grass: "Green Grass",
  has_website: "Website",
  has_phone: "Phone",
  has_coordinates: "Coordinates",
  has_address: "Address",
};

export default function EnrichmentPage() {
  const [fieldStats, setFieldStats] = useState<FieldStats | null>(null);
  const [tierCounts, setTierCounts] = useState<TierCounts | null>(null);
  const [courses, setCourses] = useState<CourseEnrichment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [avgEnrichment, setAvgEnrichment] = useState(0);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [sortBy, setSortBy] = useState("enrichment");
  const [loading, setLoading] = useState(true);

  // Batch enrich state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [enriching, setEnriching] = useState(false);
  const [enrichResults, setEnrichResults] = useState<EnrichResult[] | null>(null);
  const [enrichError, setEnrichError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
        sortBy,
      });
      if (search) params.set("search", search);
      if (tierFilter) params.set("tier", tierFilter);

      const res = await fetch(`/api/admin/enrich-smart?${params}`, {
        headers: { "x-admin-key": getAdminKey() },
      });
      const data = await res.json();
      setFieldStats(data.fieldStats || null);
      setTierCounts(data.tierCounts || null);
      setCourses(data.courses || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setAvgEnrichment(data.avgEnrichment || 0);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, tierFilter, sortBy]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === courses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(courses.map((c) => c.courseId)));
    }
  };

  const runEnrichment = async (courseIds?: number[]) => {
    setEnriching(true);
    setEnrichResults(null);
    setEnrichError("");
    try {
      const body: any = {};
      if (courseIds && courseIds.length > 0) {
        body.courseIds = courseIds;
      } else {
        body.limit = 200;
      }

      const res = await fetch("/api/admin/enrich-smart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": getAdminKey(),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setEnrichError(data.error || "Enrichment failed");
        return;
      }
      setEnrichResults(data.results || []);
      // Refresh stats after enrichment
      fetchStats();
      setSelectedIds(new Set());
    } catch (err: any) {
      setEnrichError(err.message || "Network error");
    } finally {
      setEnriching(false);
    }
  };

  const totalCourses = fieldStats ? Number(fieldStats.total_courses) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Enrichment</h1>
          <p className="text-sm text-gray-400 mt-1">
            {totalCourses.toLocaleString()} courses &middot; {avgEnrichment}% average enrichment
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => runEnrichment(Array.from(selectedIds))}
            disabled={enriching || selectedIds.size === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium hover:bg-[#16a34a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {enriching ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Enrich Selected ({selectedIds.size})
          </button>
          <button
            onClick={() => runEnrichment()}
            disabled={enriching}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {enriching ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
            Batch Enrich (200)
          </button>
        </div>
      </div>

      {/* Enrichment Results Toast */}
      {enrichResults && (
        <div className="rounded-xl border border-[#222] bg-[#111] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400" />
              Enrichment Complete
            </h3>
            <button
              onClick={() => setEnrichResults(null)}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            <div className="rounded-lg bg-[#1a1a1a] p-2">
              <div className="text-lg font-bold text-white">{enrichResults.length}</div>
              <div className="text-gray-500">Processed</div>
            </div>
            <div className="rounded-lg bg-[#1a1a1a] p-2">
              <div className="text-lg font-bold text-green-400">
                {enrichResults.filter((r) => r.status === "updated").length}
              </div>
              <div className="text-gray-500">Updated</div>
            </div>
            <div className="rounded-lg bg-[#1a1a1a] p-2">
              <div className="text-lg font-bold text-gray-400">
                {enrichResults.filter((r) => r.status === "no_changes").length}
              </div>
              <div className="text-gray-500">No Changes</div>
            </div>
            <div className="rounded-lg bg-[#1a1a1a] p-2">
              <div className="text-lg font-bold text-yellow-400">
                {enrichResults.reduce((sum, r) => sum + r.fieldsEnriched, 0)}
              </div>
              <div className="text-gray-500">Fields Filled</div>
            </div>
          </div>
          {enrichResults.some((r) => r.status === "updated") && (
            <div className="mt-3 max-h-40 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 text-left">
                    <th className="pb-1">Course</th>
                    <th className="pb-1 text-right">Fields</th>
                    <th className="pb-1 text-right">Before</th>
                    <th className="pb-1 text-right">After</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichResults
                    .filter((r) => r.status === "updated")
                    .slice(0, 20)
                    .map((r) => (
                      <tr key={r.courseId} className="text-gray-300">
                        <td className="py-0.5 truncate max-w-[200px]">{r.courseName}</td>
                        <td className="py-0.5 text-right text-green-400">+{r.fieldsEnriched}</td>
                        <td className="py-0.5 text-right">{r.beforePct}%</td>
                        <td className="py-0.5 text-right text-green-400">{r.afterPct}%</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {enrichError && (
        <div className="rounded-xl border border-red-900/50 bg-red-900/20 p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{enrichError}</p>
          <button onClick={() => setEnrichError("")} className="ml-auto text-xs text-red-400 hover:text-red-300">
            Dismiss
          </button>
        </div>
      )}

      {/* Tier Distribution Cards */}
      {tierCounts && (
        <div className="grid grid-cols-5 gap-3">
          {(Object.keys(TIER_CONFIG) as Array<keyof TierCounts>).map((tier) => {
            const config = TIER_CONFIG[tier];
            const count = tierCounts[tier] || 0;
            const pct = totalCourses > 0 ? Math.round((count / totalCourses) * 100) : 0;
            const isActive = tierFilter === tier;
            return (
              <button
                key={tier}
                onClick={() => {
                  setTierFilter(isActive ? "" : tier);
                  setPage(1);
                }}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  isActive
                    ? "border-[#22c55e] bg-[#22c55e]/10"
                    : "border-[#222] bg-[#111] hover:border-[#333]"
                }`}
              >
                <div className={`text-xs font-medium ${config.color}`}>{config.label}</div>
                <div className="text-xl font-bold text-white mt-1">{count.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{pct}% of courses</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Field-Level Stats */}
      {fieldStats && (
        <div className="rounded-xl border border-[#222] bg-[#111] p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-white">Field Coverage</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(FIELD_LABELS).map(([key, label]) => {
              const count = Number((fieldStats as any)[key] || 0);
              const pct = totalCourses > 0 ? Math.round((count / totalCourses) * 100) : 0;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{label}</span>
                    <span className="text-xs text-gray-500">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#222] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          pct >= 80 ? "#22c55e" : pct >= 50 ? "#eab308" : pct >= 20 ? "#f97316" : "#ef4444",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-wrap gap-3 items-end">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Search</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by course name..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e]"
            />
          </div>
        </form>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tier</label>
          <select
            value={tierFilter}
            onChange={(e) => {
              setTierFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
          >
            <option value="">All Tiers</option>
            <option value="excellent">Excellent (80%+)</option>
            <option value="good">Good (60-79%)</option>
            <option value="fair">Fair (40-59%)</option>
            <option value="poor">Poor (20-39%)</option>
            <option value="minimal">Minimal (&lt;20%)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
          >
            <option value="enrichment">Lowest Enrichment</option>
            <option value="enrichment_desc">Highest Enrichment</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Course Table */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] text-gray-400 text-left">
                <th className="px-4 py-3 font-medium w-10">
                  <input
                    type="checkbox"
                    checked={courses.length > 0 && selectedIds.size === courses.length}
                    onChange={selectAll}
                    className="rounded border-gray-600 bg-transparent accent-green-500"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Access</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium text-right">Enrichment</th>
                <th className="px-4 py-3 font-medium text-right">Missing Fields</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <Loader2 size={20} className="animate-spin inline-block mr-2" />
                    Loading enrichment data...
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No courses found
                  </td>
                </tr>
              ) : (
                courses.map((c) => {
                  const tierConfig = TIER_CONFIG[c.tier] || TIER_CONFIG.minimal;
                  return (
                    <tr
                      key={c.courseId}
                      className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(c.courseId)}
                          onChange={() => toggleSelect(c.courseId)}
                          className="rounded border-gray-600 bg-transparent accent-green-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{c.courseName}</div>
                        {!c.hasDescription && (
                          <span className="text-xs text-orange-400">No description</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {c.accessType ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              c.accessType === "Public"
                                ? "bg-green-900/40 text-green-400"
                                : c.accessType === "Private"
                                  ? "bg-red-900/40 text-red-400"
                                  : c.accessType === "Resort"
                                    ? "bg-blue-900/40 text-blue-400"
                                    : "bg-yellow-900/40 text-yellow-400"
                            }`}
                          >
                            {c.accessType}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${tierConfig.bg} ${tierConfig.color}`}
                        >
                          {c.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-[#222] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${c.enrichmentPct}%`,
                                backgroundColor:
                                  c.enrichmentPct >= 80
                                    ? "#22c55e"
                                    : c.enrichmentPct >= 60
                                      ? "#3b82f6"
                                      : c.enrichmentPct >= 40
                                        ? "#eab308"
                                        : c.enrichmentPct >= 20
                                          ? "#f97316"
                                          : "#ef4444",
                              }}
                            />
                          </div>
                          <span className="text-gray-300 text-xs w-8 text-right font-mono">
                            {c.enrichmentPct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-gray-500">{c.missingFields.length} fields</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#222]">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages} ({total.toLocaleString()} courses)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded bg-[#1a1a1a] border border-[#333] text-gray-400 disabled:opacity-30 hover:bg-[#222]"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded bg-[#1a1a1a] border border-[#333] text-gray-400 disabled:opacity-30 hover:bg-[#222]"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
