"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Square,
  Download,
  Globe,
  Plus,
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
  ruleBasedFields?: string[];
  aiFields?: string[];
  error?: string;
}

interface DiscoveredCourse {
  name: string;
  city: string | null;
  type: string | null;
  alreadyExists: boolean;
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

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

export default function EnrichmentPage() {
  const [activeTab, setActiveTab] = useState<"enrichment" | "import">("enrichment");

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex gap-1 rounded-lg bg-[#111] border border-[#222] p-1 w-fit">
        <button
          onClick={() => setActiveTab("enrichment")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "enrichment"
              ? "bg-[#22c55e] text-black"
              : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
          }`}
        >
          <Database size={14} className="inline-block mr-2" />
          Enrichment
        </button>
        <button
          onClick={() => setActiveTab("import")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "import"
              ? "bg-[#22c55e] text-black"
              : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
          }`}
        >
          <Globe size={14} className="inline-block mr-2" />
          Course Import
        </button>
      </div>

      {activeTab === "enrichment" ? <EnrichmentTab /> : <CourseImportTab />}
    </div>
  );
}

/* ============================================================
   ENRICHMENT TAB — Fixes #1 (auto-load) and #2 (real AI enrichment)
   ============================================================ */
function EnrichmentTab() {
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
  const [enrichResults, setEnrichResults] = useState<EnrichResult[]>([]);
  const [enrichError, setEnrichError] = useState("");
  const [enrichProgress, setEnrichProgress] = useState({ current: 0, total: 0, currentName: "" });
  const stopRef = useRef(false);

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
      if (!res.ok) throw new Error("Failed to load");
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

  // Auto-load on mount and when filters change
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

  // Batch AI enrichment — calls per-course endpoint sequentially
  const runBatchEnrichment = async (courseIds?: number[]) => {
    setEnriching(true);
    setEnrichResults([]);
    setEnrichError("");
    stopRef.current = false;

    try {
      let idsToEnrich: number[] = [];

      if (courseIds && courseIds.length > 0) {
        idsToEnrich = courseIds;
      } else {
        // Fetch courses needing enrichment (lowest enrichment %, up to 50)
        const res = await fetch(`/api/admin/enrich-smart?limit=50&sortBy=enrichment`, {
          headers: { "x-admin-key": getAdminKey() },
        });
        const data = await res.json();
        idsToEnrich = (data.courses || [])
          .filter((c: CourseEnrichment) => c.enrichmentPct < 80)
          .slice(0, 50)
          .map((c: CourseEnrichment) => c.courseId);
      }

      if (idsToEnrich.length === 0) {
        setEnrichError("No courses need enrichment");
        setEnriching(false);
        return;
      }

      setEnrichProgress({ current: 0, total: idsToEnrich.length, currentName: "" });

      // Process each course sequentially through the AI enrichment endpoint
      for (let i = 0; i < idsToEnrich.length; i++) {
        if (stopRef.current) break;

        const courseId = idsToEnrich[i];
        const courseName = courses.find((c) => c.courseId === courseId)?.courseName || `Course #${courseId}`;
        setEnrichProgress({ current: i + 1, total: idsToEnrich.length, currentName: courseName });

        try {
          const res = await fetch(`/api/admin/courses/${courseId}/enrich`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-key": getAdminKey(),
            },
          });
          const data = await res.json();

          const result: EnrichResult = {
            courseId: data.courseId || courseId,
            courseName: data.courseName || courseName,
            fieldsEnriched: data.fieldsEnriched || 0,
            beforePct: data.beforePct || 0,
            afterPct: data.afterPct || 0,
            status: data.fieldsEnriched > 0 ? "updated" : "no_changes",
            ruleBasedFields: data.ruleBasedFields || [],
            aiFields: data.aiFields || [],
          };

          if (!res.ok) {
            result.status = "error";
            result.error = data.error || "Failed";
          }

          setEnrichResults((prev) => [...prev, result]);
        } catch (err: any) {
          setEnrichResults((prev) => [
            ...prev,
            {
              courseId,
              courseName,
              fieldsEnriched: 0,
              beforePct: 0,
              afterPct: 0,
              status: "error",
              error: err.message || "Network error",
            },
          ]);
        }

        // Small delay between calls to avoid rate limits
        if (i < idsToEnrich.length - 1 && !stopRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Refresh stats after enrichment
      fetchStats();
      setSelectedIds(new Set());
    } catch (err: any) {
      setEnrichError(err.message || "Enrichment failed");
    } finally {
      setEnriching(false);
    }
  };

  const stopEnrichment = () => {
    stopRef.current = true;
  };

  const totalCourses = fieldStats ? Number(fieldStats.total_courses) : 0;
  const completedResults = enrichResults.length;
  const updatedResults = enrichResults.filter((r) => r.status === "updated").length;
  const totalFieldsFilled = enrichResults.reduce((sum, r) => sum + r.fieldsEnriched, 0);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Enrichment</h1>
          <p className="text-sm text-gray-400 mt-1">
            {totalCourses.toLocaleString()} courses &middot; {avgEnrichment}% average enrichment
          </p>
        </div>
        <div className="flex gap-3">
          {enriching ? (
            <button
              onClick={stopEnrichment}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
            >
              <Square size={16} />
              Stop Enrichment
            </button>
          ) : (
            <>
              <button
                onClick={() => runBatchEnrichment(Array.from(selectedIds))}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium hover:bg-[#16a34a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play size={16} />
                Enrich Selected ({selectedIds.size})
              </button>
              <button
                onClick={() => runBatchEnrichment()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222] transition-colors"
              >
                <Database size={16} />
                Batch Enrich (50)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Enrichment Progress */}
      {enriching && enrichProgress.total > 0 && (
        <div className="rounded-xl border border-[#222] bg-[#111] p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-green-400" />
              AI Enrichment in Progress
            </h3>
            <span className="text-sm text-gray-400">
              {enrichProgress.current} of {enrichProgress.total}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#222] overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-[#22c55e] transition-all duration-500"
              style={{ width: `${(enrichProgress.current / enrichProgress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            Currently enriching: <span className="text-gray-300">{enrichProgress.currentName}</span>
          </p>
          {completedResults > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-3 text-center text-xs">
              <div className="rounded-lg bg-[#1a1a1a] p-2">
                <div className="text-lg font-bold text-green-400">{updatedResults}</div>
                <div className="text-gray-500">Updated</div>
              </div>
              <div className="rounded-lg bg-[#1a1a1a] p-2">
                <div className="text-lg font-bold text-gray-400">
                  {enrichResults.filter((r) => r.status === "no_changes").length}
                </div>
                <div className="text-gray-500">No Changes</div>
              </div>
              <div className="rounded-lg bg-[#1a1a1a] p-2">
                <div className="text-lg font-bold text-yellow-400">{totalFieldsFilled}</div>
                <div className="text-gray-500">Fields Filled</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enrichment Results */}
      {!enriching && enrichResults.length > 0 && (
        <div className="rounded-xl border border-[#222] bg-[#111] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400" />
              Enrichment Complete
              {stopRef.current && <span className="text-xs text-yellow-400 ml-2">(Stopped early)</span>}
            </h3>
            <button
              onClick={() => setEnrichResults([])}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            <div className="rounded-lg bg-[#1a1a1a] p-2">
              <div className="text-lg font-bold text-white">{completedResults}</div>
              <div className="text-gray-500">Processed</div>
            </div>
            <div className="rounded-lg bg-[#1a1a1a] p-2">
              <div className="text-lg font-bold text-green-400">{updatedResults}</div>
              <div className="text-gray-500">Updated</div>
            </div>
            <div className="rounded-lg bg-[#1a1a1a] p-2">
              <div className="text-lg font-bold text-gray-400">
                {enrichResults.filter((r) => r.status === "no_changes").length}
              </div>
              <div className="text-gray-500">No Changes</div>
            </div>
            <div className="rounded-lg bg-[#1a1a1a] p-2">
              <div className="text-lg font-bold text-yellow-400">{totalFieldsFilled}</div>
              <div className="text-gray-500">Fields Filled</div>
            </div>
          </div>
          {enrichResults.some((r) => r.status === "updated") && (
            <div className="mt-3 max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 text-left">
                    <th className="pb-1">Course</th>
                    <th className="pb-1 text-right">Fields</th>
                    <th className="pb-1 text-right">Before</th>
                    <th className="pb-1 text-right">After</th>
                    <th className="pb-1 text-right">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichResults
                    .filter((r) => r.status === "updated")
                    .map((r) => (
                      <tr key={r.courseId} className="text-gray-300">
                        <td className="py-0.5 truncate max-w-[200px]">{r.courseName}</td>
                        <td className="py-0.5 text-right text-green-400">+{r.fieldsEnriched}</td>
                        <td className="py-0.5 text-right">{r.beforePct}%</td>
                        <td className="py-0.5 text-right text-green-400">{r.afterPct}%</td>
                        <td className="py-0.5 text-right text-gray-500">
                          {(r.ruleBasedFields?.length || 0) > 0 && (
                            <span className="text-blue-400 mr-1">R:{r.ruleBasedFields?.length}</span>
                          )}
                          {(r.aiFields?.length || 0) > 0 && (
                            <span className="text-purple-400">AI:{r.aiFields?.length}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          {enrichResults.some((r) => r.status === "error") && (
            <div className="mt-2 text-xs text-red-400">
              {enrichResults.filter((r) => r.status === "error").length} courses had errors
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
                        {[c.city, c.state].filter(Boolean).join(", ") || "\u2014"}
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
                          "\u2014"
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
    </>
  );
}

/* ============================================================
   COURSE IMPORT TAB — Feature #3
   ============================================================ */
function CourseImportTab() {
  const [selectedState, setSelectedState] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [discoveredCourses, setDiscoveredCourses] = useState<DiscoveredCourse[]>([]);
  const [discoveryStats, setDiscoveryStats] = useState<{
    totalDiscovered: number;
    newCourses: number;
    alreadyExist: number;
    existingInDb: number;
    stateName: string;
  } | null>(null);
  const [selectedNew, setSelectedNew] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number } | null>(null);
  const [error, setError] = useState("");
  const [totalCoursesInDb, setTotalCoursesInDb] = useState(0);

  // Load total course count on mount
  useEffect(() => {
    const loadCount = async () => {
      try {
        const res = await fetch(`/api/admin/enrich-smart?limit=1`, {
          headers: { "x-admin-key": getAdminKey() },
        });
        const data = await res.json();
        setTotalCoursesInDb(Number(data.fieldStats?.total_courses || 0));
      } catch {}
    };
    loadCount();
  }, []);

  const discoverCourses = async () => {
    if (!selectedState) return;
    setDiscovering(true);
    setDiscoveredCourses([]);
    setDiscoveryStats(null);
    setSelectedNew(new Set());
    setImportResult(null);
    setError("");

    try {
      const res = await fetch("/api/admin/courses/discover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": getAdminKey(),
        },
        body: JSON.stringify({ state: selectedState }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Discovery failed");
        return;
      }

      setDiscoveredCourses(data.courses || []);
      setDiscoveryStats({
        totalDiscovered: data.totalDiscovered,
        newCourses: data.newCourses,
        alreadyExist: data.alreadyExist,
        existingInDb: data.existingInDb,
        stateName: data.stateName,
      });

      // Auto-select all new courses
      const newIndices = new Set<number>();
      (data.courses || []).forEach((c: DiscoveredCourse, i: number) => {
        if (!c.alreadyExists) newIndices.add(i);
      });
      setSelectedNew(newIndices);
    } catch (err: any) {
      setError(err.message || "Discovery failed");
    } finally {
      setDiscovering(false);
    }
  };

  const importSelected = async () => {
    const toImport = discoveredCourses
      .filter((_, i) => selectedNew.has(i))
      .filter((c) => !c.alreadyExists);

    if (toImport.length === 0) return;

    setImporting(true);
    setError("");
    setImportResult(null);

    try {
      const courses = toImport.map((c) => ({
        courseName: c.name,
        city: c.city,
        state: selectedState,
        country: "United States",
        accessType: c.type,
      }));

      const res = await fetch("/api/admin/courses/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": getAdminKey(),
        },
        body: JSON.stringify({ courses }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
        return;
      }

      setImportResult({ created: data.created, skipped: data.skipped });
      setTotalCoursesInDb((prev) => prev + data.created);
    } catch (err: any) {
      setError(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const toggleNewSelect = (idx: number) => {
    setSelectedNew((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAllNew = () => {
    const newIndices = discoveredCourses
      .map((c, i) => (!c.alreadyExists ? i : -1))
      .filter((i) => i >= 0);
    if (selectedNew.size === newIndices.length) {
      setSelectedNew(new Set());
    } else {
      setSelectedNew(new Set(newIndices));
    }
  };

  const newCoursesList = discoveredCourses
    .map((c, i) => ({ ...c, idx: i }))
    .filter((c) => !c.alreadyExists);

  return (
    <>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Course Backlog Import</h1>
        <p className="text-sm text-gray-400 mt-1">
          Discover and import missing golf courses by state using AI research
        </p>
      </div>

      {/* Dashboard Metric */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#222] bg-[#111] p-4">
          <div className="text-xs text-gray-500 mb-1">Courses in Database</div>
          <div className="text-2xl font-bold text-white">{totalCoursesInDb.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-[#222] bg-[#111] p-4">
          <div className="text-xs text-gray-500 mb-1">Estimated US Total</div>
          <div className="text-2xl font-bold text-gray-400">~16,000+</div>
        </div>
        <div className="rounded-xl border border-[#222] bg-[#111] p-4">
          <div className="text-xs text-gray-500 mb-1">Coverage</div>
          <div className="text-2xl font-bold text-yellow-400">
            {totalCoursesInDb > 0 ? Math.round((totalCoursesInDb / 16000) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* State Selector */}
      <div className="rounded-xl border border-[#222] bg-[#111] p-6">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Search size={16} className="text-gray-400" />
          Find Missing Courses by State
        </h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs text-gray-500 mb-1">Select State</label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setDiscoveredCourses([]);
                setDiscoveryStats(null);
                setImportResult(null);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
            >
              <option value="">Choose a state...</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s} - {STATE_NAMES[s]}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={discoverCourses}
            disabled={!selectedState || discovering}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium hover:bg-[#16a34a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {discovering ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Find Missing Courses
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-900/20 p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={() => setError("")} className="ml-auto text-xs text-red-400 hover:text-red-300">
            Dismiss
          </button>
        </div>
      )}

      {/* Discovery Loading */}
      {discovering && (
        <div className="rounded-xl border border-[#222] bg-[#111] p-8 text-center">
          <Loader2 size={24} className="animate-spin text-green-400 mx-auto mb-3" />
          <p className="text-sm text-gray-300">
            Searching for golf courses in {STATE_NAMES[selectedState]}...
          </p>
          <p className="text-xs text-gray-500 mt-1">This may take 15-30 seconds</p>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className="rounded-xl border border-green-900/50 bg-green-900/20 p-4 flex items-center gap-3">
          <CheckCircle2 size={16} className="text-green-400 shrink-0" />
          <p className="text-sm text-green-300">
            Imported <strong>{importResult.created}</strong> new courses
            {importResult.skipped > 0 && ` (${importResult.skipped} duplicates skipped)`}
          </p>
        </div>
      )}

      {/* Discovery Stats */}
      {discoveryStats && !discovering && (
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-[#222] bg-[#111] p-4 text-center">
            <div className="text-2xl font-bold text-white">{discoveryStats.totalDiscovered}</div>
            <div className="text-xs text-gray-500">Discovered</div>
          </div>
          <div className="rounded-xl border border-green-900/50 bg-green-900/10 p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{discoveryStats.newCourses}</div>
            <div className="text-xs text-gray-500">New (Not in DB)</div>
          </div>
          <div className="rounded-xl border border-[#222] bg-[#111] p-4 text-center">
            <div className="text-2xl font-bold text-gray-400">{discoveryStats.alreadyExist}</div>
            <div className="text-xs text-gray-500">Already in DB</div>
          </div>
          <div className="rounded-xl border border-[#222] bg-[#111] p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{discoveryStats.existingInDb}</div>
            <div className="text-xs text-gray-500">Current {selectedState} Courses</div>
          </div>
        </div>
      )}

      {/* Discovered Courses Table */}
      {discoveredCourses.length > 0 && !discovering && (
        <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
            <h3 className="text-sm font-semibold text-white">
              New Courses to Import ({newCoursesList.length})
            </h3>
            <div className="flex gap-3">
              <button
                onClick={selectAllNew}
                className="text-xs text-gray-400 hover:text-white"
              >
                {selectedNew.size === newCoursesList.length ? "Deselect All" : "Select All"}
              </button>
              <button
                onClick={importSelected}
                disabled={importing || selectedNew.size === 0}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#22c55e] text-black text-xs font-medium hover:bg-[#16a34a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {importing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Import Selected ({selectedNew.size})
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#111]">
                <tr className="border-b border-[#222] text-gray-400 text-left">
                  <th className="px-4 py-2 font-medium w-10"></th>
                  <th className="px-4 py-2 font-medium">Course Name</th>
                  <th className="px-4 py-2 font-medium">City</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {discoveredCourses.map((c, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-[#1a1a1a] transition-colors ${
                      c.alreadyExists ? "opacity-40" : "hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <td className="px-4 py-2">
                      {!c.alreadyExists && (
                        <input
                          type="checkbox"
                          checked={selectedNew.has(idx)}
                          onChange={() => toggleNewSelect(idx)}
                          className="rounded border-gray-600 bg-transparent accent-green-500"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2 text-white">{c.name}</td>
                    <td className="px-4 py-2 text-gray-400">{c.city || "\u2014"}</td>
                    <td className="px-4 py-2">
                      {c.type ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            c.type === "Public"
                              ? "bg-green-900/40 text-green-400"
                              : c.type === "Private"
                                ? "bg-red-900/40 text-red-400"
                                : c.type === "Resort"
                                  ? "bg-blue-900/40 text-blue-400"
                                  : "bg-yellow-900/40 text-yellow-400"
                          }`}
                        >
                          {c.type}
                        </span>
                      ) : (
                        "\u2014"
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {c.alreadyExists ? (
                        <span className="text-xs text-gray-500">Already in DB</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400">
                          <Plus size={12} />
                          New
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
