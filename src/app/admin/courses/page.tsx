"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, Upload, ChevronLeft, ChevronRight } from "lucide-react";

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

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [accessFilter, setAccessFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (search) params.set("search", search);
      if (stateFilter) params.set("state", stateFilter);
      if (accessFilter) params.set("accessType", accessFilter);

      const res = await fetch(`/api/admin/courses?${params}`, {
        headers: { "x-admin-key": getAdminKey() },
      });
      const data = await res.json();
      setCourses(data.courses || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, stateFilter, accessFilter]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCourses();
  };

  const US_STATES = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
    "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
    "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
    "VA","WA","WV","WI","WY",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Course Management</h1>
          <p className="text-sm text-gray-400 mt-1">{total.toLocaleString()} courses total</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/courses/import"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222] transition-colors"
          >
            <Upload size={16} />
            Bulk Import
          </Link>
          <Link
            href="/admin/courses/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium hover:bg-[#16a34a] transition-colors"
          >
            <Plus size={16} />
            Add Course
          </Link>
        </div>
      </div>

      {/* Filters */}
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
          <label className="block text-xs text-gray-500 mb-1">State</label>
          <select
            value={stateFilter}
            onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
          >
            <option value="">All States</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Access</label>
          <select
            value={accessFilter}
            onChange={(e) => { setAccessFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
          >
            <option value="">All Access</option>
            <option value="Public">Public</option>
            <option value="Private">Private</option>
            <option value="Resort">Resort</option>
            <option value="Semi-Private">Semi-Private</option>
            <option value="Military">Military</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Course Name</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Access</th>
                <th className="px-4 py-3 font-medium text-right">Score</th>
                <th className="px-4 py-3 font-medium text-right">Enrichment</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No courses found
                  </td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr
                    key={c.courseId}
                    className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/admin/courses/${c.courseId}`} className="text-white font-medium hover:text-[#22c55e]">
                        {c.courseName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{c.courseType || "—"}</td>
                    <td className="px-4 py-3">
                      {c.accessType ? (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          c.accessType === "Public" ? "bg-green-900/40 text-green-400" :
                          c.accessType === "Private" ? "bg-red-900/40 text-red-400" :
                          c.accessType === "Resort" ? "bg-blue-900/40 text-blue-400" :
                          "bg-yellow-900/40 text-yellow-400"
                        }`}>
                          {c.accessType}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-mono">
                      {c.chameleonScore != null ? c.chameleonScore.toFixed(1) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[#222] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${c.enrichmentPct}%`,
                              backgroundColor: c.enrichmentPct >= 80 ? "#22c55e" : c.enrichmentPct >= 50 ? "#eab308" : "#ef4444",
                            }}
                          />
                        </div>
                        <span className="text-gray-400 text-xs w-8 text-right">{c.enrichmentPct}%</span>
                      </div>
                    </td>
                  </tr>
                ))
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
