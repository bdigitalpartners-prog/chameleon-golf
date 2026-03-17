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
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  AlertTriangle,
  Merge,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("golfEQ_admin_key") ||
    sessionStorage.getItem("golfEQ_admin_key") ||
    ""
  );
}

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

interface DuplicatePair {
  courseA: {
    courseId: number;
    courseName: string;
    facilityName: string | null;
    city: string | null;
    state: string | null;
    accessType: string | null;
    isEnriched: boolean;
    numListsAppeared: number | null;
  };
  courseB: {
    courseId: number;
    courseName: string;
    facilityName: string | null;
    city: string | null;
    state: string | null;
    accessType: string | null;
    isEnriched: boolean;
    numListsAppeared: number | null;
  };
  score: number;
  reasons: string[];
}

type SortField =
  | "courseName"
  | "city"
  | "accessType"
  | "courseType"
  | "chameleonScore"
  | "enrichment";
type SortOrder = "asc" | "desc";

const COLUMNS: { key: SortField; label: string; align?: "right" }[] = [
  { key: "courseName", label: "Name" },
  { key: "city", label: "Location" },
  { key: "accessType", label: "Access" },
  { key: "courseType", label: "Type" },
  { key: "chameleonScore", label: "CF Score", align: "right" },
  { key: "enrichment", label: "Enrichment", align: "right" },
];

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
  const [sortBy, setSortBy] = useState<SortField>("courseName");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Duplicate management state
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [merging, setMerging] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
      sortBy,
      sortOrder,
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (stateFilter) params.set("state", stateFilter);
    if (accessFilter) params.set("accessType", accessFilter);

    try {
      const res = await fetch(`/api/admin/courses?${params}`, {
        headers: { "x-admin-key": getAdminKey() },
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
  }, [page, debouncedSearch, stateFilter, accessFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Reset page on filter / sort change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, stateFilter, accessFilter, sortBy, sortOrder]);

  // Handle column header click
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder(field === "chameleonScore" || field === "enrichment" ? "desc" : "asc");
    }
  };

  // Fetch duplicates
  const fetchDuplicates = async () => {
    setLoadingDuplicates(true);
    try {
      const res = await fetch("/api/admin/courses/duplicates", {
        headers: { "x-admin-key": getAdminKey() },
      });
      const data = await res.json();
      setDuplicates(data.pairs || []);
    } catch (err) {
      console.error("Failed to fetch duplicates:", err);
    } finally {
      setLoadingDuplicates(false);
    }
  };

  const toggleDuplicates = () => {
    const next = !showDuplicates;
    setShowDuplicates(next);
    if (next && duplicates.length === 0) fetchDuplicates();
  };

  // Merge courses
  const handleMerge = async (primaryId: number, secondaryId: number) => {
    if (
      !confirm(
        `Merge course #${secondaryId} into #${primaryId}? The secondary course will be deleted and its data merged into the primary.`
      )
    )
      return;

    setMerging(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/courses/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": getAdminKey(),
        },
        body: JSON.stringify({ primaryId, secondaryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Merge failed");

      setActionMessage({ type: "success", text: data.message });
      // Remove this pair from the list
      setDuplicates((prev) =>
        prev.filter(
          (p) =>
            !(
              (p.courseA.courseId === primaryId && p.courseB.courseId === secondaryId) ||
              (p.courseA.courseId === secondaryId && p.courseB.courseId === primaryId)
            )
        )
      );
      fetchCourses();
    } catch (err: unknown) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Merge failed",
      });
    } finally {
      setMerging(false);
    }
  };

  // Delete a single course
  const handleDelete = async (courseId: number, courseName: string) => {
    if (!confirm(`Delete "${courseName}" (#${courseId})? This cannot be undone.`)) return;

    setDeleting(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "DELETE",
        headers: { "x-admin-key": getAdminKey() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      setActionMessage({ type: "success", text: `Deleted "${courseName}"` });
      setDuplicates((prev) =>
        prev.filter(
          (p) => p.courseA.courseId !== courseId && p.courseB.courseId !== courseId
        )
      );
      fetchCourses();
    } catch (err: unknown) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Delete failed",
      });
    } finally {
      setDeleting(false);
    }
  };

  const pairKey = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;
  const visibleDuplicates = duplicates.filter(
    (p) => !dismissed.has(pairKey(p.courseA.courseId, p.courseB.courseId))
  );

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Courses</h1>
        <div className="flex gap-2">
          <button
            onClick={toggleDuplicates}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{
              border: "1px solid #252525",
              color: showDuplicates ? "#f59e0b" : "#9ca3af",
              backgroundColor: showDuplicates ? "rgba(245,158,11,0.1)" : "transparent",
            }}
          >
            <AlertTriangle className="h-4 w-4" />
            Duplicates
            {visibleDuplicates.length > 0 && (
              <span
                className="ml-1 text-xs px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(245,158,11,0.2)", color: "#f59e0b" }}
              >
                {visibleDuplicates.length}
              </span>
            )}
          </button>
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

      {/* Action message toast */}
      {actionMessage && (
        <div
          className="mb-4 flex items-center justify-between rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor:
              actionMessage.type === "success"
                ? "rgba(34,197,94,0.12)"
                : "rgba(239,68,68,0.12)",
            color: actionMessage.type === "success" ? "#22c55e" : "#ef4444",
            border: `1px solid ${actionMessage.type === "success" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
          }}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="ml-4 opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Duplicates Panel */}
      {showDuplicates && (
        <div
          className="mb-6 rounded-xl overflow-hidden"
          style={{ backgroundColor: "#111111", border: "1px solid #352a00" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid #352a00" }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" style={{ color: "#f59e0b" }} />
              <span className="text-sm font-medium" style={{ color: "#f59e0b" }}>
                Potential Duplicates
              </span>
              <span className="text-xs text-gray-500">
                {loadingDuplicates
                  ? "Scanning..."
                  : `${visibleDuplicates.length} pair${visibleDuplicates.length !== 1 ? "s" : ""} found`}
              </span>
            </div>
            <button
              onClick={() => setShowDuplicates(false)}
              className="text-gray-500 hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {loadingDuplicates ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : visibleDuplicates.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              No duplicates detected.
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              {visibleDuplicates.map((pair, idx) => (
                <DuplicateRow
                  key={idx}
                  pair={pair}
                  onMerge={handleMerge}
                  onDelete={handleDelete}
                  onDismiss={() => {
                    setDismissed((prev) => {
                      const next = new Set(prev);
                      next.add(pairKey(pair.courseA.courseId, pair.courseB.courseId));
                      return next;
                    });
                  }}
                  disabled={merging || deleting}
                />
              ))}
            </div>
          )}
        </div>
      )}

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
            <option key={s} value={s}>
              {s}
            </option>
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
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`px-4 py-3 text-xs font-medium uppercase tracking-wide cursor-pointer select-none transition-colors hover:text-gray-300 ${
                        col.align === "right" ? "text-right" : "text-left"
                      }`}
                      style={{ color: sortBy === col.key ? "#22c55e" : "#6b7280" }}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        <SortIcon field={col.key} sortBy={sortBy} sortOrder={sortOrder} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No courses found
                    </td>
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
                      <td
                        className="px-4 py-3 text-right font-mono"
                        style={{ color: "#22c55e" }}
                      >
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

/* ── Sort indicator icon ─── */
function SortIcon({
  field,
  sortBy,
  sortOrder,
}: {
  field: SortField;
  sortBy: SortField;
  sortOrder: SortOrder;
}) {
  if (sortBy !== field)
    return <ArrowUpDown className="h-3 w-3 opacity-30" />;
  return sortOrder === "asc" ? (
    <ArrowUp className="h-3 w-3" />
  ) : (
    <ArrowDown className="h-3 w-3" />
  );
}

/* ── Enrichment bar ─── */
function EnrichmentBadge({ pct }: { pct: number }) {
  const color = pct >= 75 ? "#22c55e" : pct >= 40 ? "#eab308" : "#ef4444";
  return (
    <div className="flex items-center justify-end gap-2">
      <div
        className="w-16 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

/* ── Duplicate pair row ─── */
function DuplicateRow({
  pair,
  onMerge,
  onDelete,
  onDismiss,
  disabled,
}: {
  pair: DuplicatePair;
  onMerge: (primaryId: number, secondaryId: number) => void;
  onDelete: (courseId: number, courseName: string) => void;
  onDismiss: () => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { courseA, courseB, score, reasons } = pair;

  // Determine which is likely the "better" course (more enriched / more list appearances)
  const aScore =
    (courseA.isEnriched ? 10 : 0) + (courseA.numListsAppeared || 0);
  const bScore =
    (courseB.isEnriched ? 10 : 0) + (courseB.numListsAppeared || 0);

  return (
    <div style={{ borderBottom: "1px solid #1f1f1f" }}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white font-medium truncate">{courseA.courseName}</span>
            <span className="text-gray-600 text-xs">#{courseA.courseId}</span>
            <span className="text-gray-600 mx-1">↔</span>
            <span className="text-white font-medium truncate">{courseB.courseName}</span>
            <span className="text-gray-600 text-xs">#{courseB.courseId}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">
              {[courseA.city, courseA.state].filter(Boolean).join(", ") || "—"}{" "}
              / {[courseB.city, courseB.state].filter(Boolean).join(", ") || "—"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-mono"
            style={{
              backgroundColor:
                score >= 70
                  ? "rgba(239,68,68,0.15)"
                  : score >= 50
                  ? "rgba(245,158,11,0.15)"
                  : "rgba(255,255,255,0.08)",
              color:
                score >= 70 ? "#ef4444" : score >= 50 ? "#f59e0b" : "#9ca3af",
            }}
          >
            {score}%
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          {/* Reasons */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {reasons.map((r, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#9ca3af" }}
              >
                {r}
              </span>
            ))}
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <CourseCard course={courseA} isPrimary={aScore >= bScore} />
            <CourseCard course={courseB} isPrimary={bScore > aScore} />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const primary = aScore >= bScore ? courseA : courseB;
                const secondary = aScore >= bScore ? courseB : courseA;
                onMerge(primary.courseId, secondary.courseId);
              }}
              disabled={disabled}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
              style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}
            >
              <Merge className="h-3.5 w-3.5" />
              Merge (keep {aScore >= bScore ? "A" : "B"})
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const toDelete = aScore >= bScore ? courseB : courseA;
                onDelete(toDelete.courseId, toDelete.courseName);
              }}
              disabled={disabled}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
              style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete {aScore >= bScore ? "B" : "A"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-300"
              style={{ border: "1px solid #252525" }}
            >
              Not a duplicate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Course comparison card ─── */
function CourseCard({
  course,
  isPrimary,
}: {
  course: DuplicatePair["courseA"];
  isPrimary: boolean;
}) {
  return (
    <div
      className="rounded-lg p-3 text-xs"
      style={{
        backgroundColor: "#0a0a0a",
        border: isPrimary ? "1px solid rgba(34,197,94,0.3)" : "1px solid #1f1f1f",
      }}
    >
      {isPrimary && (
        <span
          className="text-[10px] font-medium uppercase tracking-wider mb-1.5 inline-block px-1.5 py-0.5 rounded"
          style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#22c55e" }}
        >
          Recommended Primary
        </span>
      )}
      <div className="text-white font-medium">{course.courseName}</div>
      <div className="text-gray-500 mt-1">
        ID: #{course.courseId} · {[course.city, course.state].filter(Boolean).join(", ") || "No location"}
      </div>
      <div className="flex gap-3 mt-1.5 text-gray-500">
        <span>
          Access: <span className="text-gray-300">{course.accessType || "—"}</span>
        </span>
        <span>
          Enriched:{" "}
          <span style={{ color: course.isEnriched ? "#22c55e" : "#ef4444" }}>
            {course.isEnriched ? "Yes" : "No"}
          </span>
        </span>
        <span>
          Lists: <span className="text-gray-300">{course.numListsAppeared || 0}</span>
        </span>
      </div>
    </div>
  );
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];
