"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Upload,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
} from "lucide-react";

interface CourseRow {
  courseId: number;
  courseName: string;
  city: string | null;
  state: string | null;
  accessType: string | null;
  courseType: string | null;
  chameleonScore: number | null;
  enrichmentPct: number;
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [accessFilter, setAccessFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "25",
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (stateFilter) params.set("state", stateFilter);
    if (accessFilter) params.set("accessType", accessFilter);

    try {
      const res = await fetch(`/api/admin/courses?${params}`, {
        headers: { "x-admin-key": localStorage.getItem("golfEQ_admin_key") || "" },
      });
      const data = await res.json();
      setCourses(data.courses || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, stateFilter, accessFilter]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, stateFilter, accessFilter]);

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Courses</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/admin/courses/import")}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10"
            style={{ border: "1px solid #252525" }}
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button
            onClick={() => router.push("/admin/courses/new")}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ backgroundColor: "#22c55e", color: "#000" }}
          >
            <Plus className="h-4 w-4" />
            Add Course
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full rounded-lg pl-10 pr-4 py-2 text-sm text-white outline-none"
            style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
          />
        </div>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm text-white outline-none"
          style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
        >
          <option value="">All States</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={accessFilter}
          onChange={(e) => setAccessFilter(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm text-white outline-none"
          style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
        >
          <option value="">All Access Types</option>
          <option value="Public">Public</option>
          <option value="Private">Private</option>
          <option value="Resort">Resort</option>
          <option value="Semi-Private">Semi-Private</option>
          <option value="Military">Military</option>
        </select>
      </div>

      {/* Results count */}
      <div className="text-xs text-gray-500 mb-3">{total} courses found</div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #1f1f1f" }}>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Access</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">CF Score</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Enrichment</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No courses found</td>
                  </tr>
                ) : (
                  courses.map((c) => (
                    <tr
                      key={c.courseId}
                      onClick={() => router.push(`/admin/courses/${c.courseId}`)}
                      className="cursor-pointer transition-colors hover:bg-white/5"
                      style={{ borderBottom: "1px solid #1a1a1a" }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-gray-500" />
                          <span className="text-white font-medium">{c.courseName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {c.accessType ? (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor:
                                c.accessType === "Public"
                                  ? "rgba(34,197,94,0.15)"
                                  : c.accessType === "Private"
                                  ? "rgba(239,68,68,0.15)"
                                  : "rgba(255,255,255,0.1)",
                              color:
                                c.accessType === "Public"
                                  ? "#22c55e"
                                  : c.accessType === "Private"
                                  ? "#ef4444"
                                  : "#9ca3af",
                            }}
                          >
                            {c.accessType}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{c.courseType || "—"}</td>
                      <td className="px-4 py-3 text-right font-mono" style={{ color: "#22c55e" }}>
                        {c.chameleonScore ? c.chameleonScore.toFixed(1) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <EnrichmentBadge pct={c.enrichmentPct} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg px-3 py-1.5 text-xs text-gray-300 disabled:opacity-30"
              style={{ backgroundColor: "#1a1a1a", border: "1px solid #252525" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg px-3 py-1.5 text-xs text-gray-300 disabled:opacity-30"
              style={{ backgroundColor: "#1a1a1a", border: "1px solid #252525" }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EnrichmentBadge({ pct }: { pct: number }) {
  const color = pct >= 75 ? "#22c55e" : pct >= 40 ? "#eab308" : "#ef4444";
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#1a1a1a" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{pct}%</span>
    </div>
  );
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];
