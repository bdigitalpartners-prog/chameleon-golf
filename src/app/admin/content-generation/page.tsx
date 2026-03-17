"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Loader2, CheckCircle2, XCircle, FileText, Eye,
  ChevronLeft, ChevronRight, RefreshCw, Zap, ArrowLeft,
  Filter, Search,
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

interface CourseRow {
  courseId: number;
  courseName: string;
  location: string;
  accessType: string | null;
  chameleonScore: string | null;
  hasContent: boolean;
  contentGeneratedAt: string | null;
  contentModel: string | null;
  contentPreview: string | null;
}

interface ContentPreview {
  richDescription: string;
  whatToExpect: string;
  strategyLowHcp: string;
  strategyMidHcp: string;
  strategyHighHcp: string;
  threeThingsToKnow: string[];
  firstTimerGuide: string;
}

export default function ContentGenerationPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const adminKey = searchParams.get("key");
  const isAdmin =
    (session?.user as any)?.role === "admin" ||
    (adminKey != null && adminKey === process.env.NEXT_PUBLIC_ADMIN_KEY);

  const getHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (adminKey) (headers as Record<string, string>)["x-admin-key"] = adminKey;
    return headers;
  }, [adminKey]);

  // State
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [generating, setGenerating] = useState<number | null>(null);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);
  const [preview, setPreview] = useState<{ courseId: number; courseName: string; content: ContentPreview } | null>(null);
  const [previewLoading, setPreviewLoading] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/generate-content?page=${page}&limit=50&filter=${filter}`,
        { headers: getHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [page, filter, getHeaders]);

  useEffect(() => {
    if (isAdmin) fetchCourses();
  }, [isAdmin, fetchCourses]);

  // Generate for single course
  const handleGenerate = async (courseId: number, previewOnly: boolean = false) => {
    if (previewOnly) {
      setPreviewLoading(courseId);
    } else {
      setGenerating(courseId);
    }

    try {
      const res = await fetch("/api/admin/generate-content", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ courseId, preview: previewOnly }),
      });

      if (res.ok) {
        const data = await res.json();
        if (previewOnly) {
          setPreview({
            courseId,
            courseName: data.courseName,
            content: data.content,
          });
        } else {
          await fetchCourses();
        }
      }
    } finally {
      setGenerating(null);
      setPreviewLoading(null);
    }
  };

  // Save preview content
  const handleSavePreview = async () => {
    if (!preview) return;
    setGenerating(preview.courseId);
    try {
      const res = await fetch("/api/admin/generate-content", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ courseId: preview.courseId }),
      });
      if (res.ok) {
        setPreview(null);
        await fetchCourses();
      }
    } finally {
      setGenerating(null);
    }
  };

  // Batch generate
  const handleBatchGenerate = async (limit: number = 100) => {
    setBatchGenerating(true);
    setBatchResult(null);
    try {
      const res = await fetch("/api/admin/generate-content", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ batch: true, limit }),
      });
      if (res.ok) {
        const data = await res.json();
        setBatchResult(data);
        await fetchCourses();
      }
    } finally {
      setBatchGenerating(false);
    }
  };

  const filtered = searchQuery
    ? courses.filter((c) =>
        c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : courses;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Sparkles className="mx-auto h-16 w-16" style={muted} />
        <h1 className="mt-4 font-display text-2xl font-bold" style={primary}>AI Content Generation</h1>
        <p className="mt-2 text-sm" style={secondary}>Admin access required.</p>
      </div>
    );
  }

  // Preview modal
  if (preview) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8" style={{ minHeight: "100vh" }}>
        <button
          onClick={() => setPreview(null)}
          className="flex items-center gap-2 text-sm mb-6 hover:opacity-80"
          style={{ color: "var(--cg-accent)", background: "none", border: "none", cursor: "pointer" }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to list
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold" style={primary}>Content Preview</h1>
            <p className="text-sm mt-1" style={muted}>{preview.courseName}</p>
          </div>
          <button
            onClick={handleSavePreview}
            disabled={generating === preview.courseId}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--cg-accent)", color: "white", border: "none", cursor: "pointer" }}
          >
            {generating === preview.courseId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Save Content
          </button>
        </div>

        <div className="space-y-6">
          {/* Rich Description */}
          <div style={card}>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2" style={primary}>
              <FileText className="h-4 w-4" style={{ color: "var(--cg-accent)" }} />
              Rich Description
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={secondary}>
              {preview.content.richDescription}
            </p>
          </div>

          {/* What to Expect */}
          <div style={card}>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2" style={primary}>
              <Eye className="h-4 w-4" style={{ color: "#c084fc" }} />
              What to Expect
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={secondary}>
              {preview.content.whatToExpect}
            </p>
          </div>

          {/* 3 Things to Know */}
          <div style={card}>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={primary}>
              <Zap className="h-4 w-4" style={{ color: "#fbbf24" }} />
              3 Things to Know
            </h3>
            <ol className="space-y-3">
              {preview.content.threeThingsToKnow.map((thing, i) => (
                <li key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                  <span className="flex items-center justify-center h-6 w-6 rounded-full shrink-0 text-xs font-bold" style={{
                    backgroundColor: "rgba(234,179,8,0.15)", color: "#fbbf24",
                  }}>{i + 1}</span>
                  <span className="text-sm leading-relaxed" style={secondary}>{thing}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Strategy Tips */}
          <div style={card}>
            <h3 className="font-semibold text-sm mb-3" style={primary}>Strategy by Handicap</h3>
            <div className="space-y-4">
              {[
                { label: "Low Handicap (0-10)", text: preview.content.strategyLowHcp, color: "#22c55e" },
                { label: "Mid Handicap (11-20)", text: preview.content.strategyMidHcp, color: "#60a5fa" },
                { label: "High Handicap (21+)", text: preview.content.strategyHighHcp, color: "#f59e0b" },
              ].map(({ label, text, color }) => (
                <div key={label} className="rounded-lg p-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                  <span className="text-xs font-semibold mb-1 block" style={{ color }}>{label}</span>
                  <p className="text-sm leading-relaxed" style={secondary}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* First-Timer Guide */}
          <div style={card}>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2" style={primary}>
              <Sparkles className="h-4 w-4" style={{ color: "#f472b6" }} />
              First-Timer Guide
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={secondary}>
              {preview.content.firstTimerGuide}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/admin"
              className="text-sm hover:opacity-80"
              style={{ color: "var(--cg-accent)" }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-display text-2xl font-bold" style={primary}>AI Content Generation</h1>
          </div>
          <p className="text-sm ml-7" style={muted}>Generate rich course content using OpenAI</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4 mb-8">
          <div style={{ ...card, padding: "1rem" }}>
            <div className="text-xs font-medium mb-1" style={muted}>Total Courses</div>
            <div className="text-xl font-bold tabular-nums" style={primary}>{stats.totalCourses}</div>
          </div>
          <div style={{ ...card, padding: "1rem" }}>
            <div className="text-xs font-medium mb-1" style={muted}>With Content</div>
            <div className="text-xl font-bold tabular-nums" style={{ color: "var(--cg-accent)" }}>{stats.withContent}</div>
          </div>
          <div style={{ ...card, padding: "1rem" }}>
            <div className="text-xs font-medium mb-1" style={muted}>Without Content</div>
            <div className="text-xl font-bold tabular-nums" style={{ color: "#f59e0b" }}>{stats.withoutContent}</div>
          </div>
          <div style={{ ...card, padding: "1rem" }}>
            <div className="text-xs font-medium mb-1" style={muted}>Coverage</div>
            <div className="text-xl font-bold tabular-nums" style={primary}>{stats.coveragePct}%</div>
            <div className="mt-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${stats.coveragePct}%`,
                  backgroundColor: stats.coveragePct >= 80 ? "var(--cg-accent)" : stats.coveragePct >= 40 ? "#eab308" : "var(--cg-error)",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Batch Actions */}
      <div style={card} className="mb-8">
        <h2 className="font-display text-lg font-semibold mb-4" style={primary}>Batch Generation</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={() => handleBatchGenerate(100)}
            disabled={batchGenerating}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--cg-accent)", color: "white", border: "none", cursor: batchGenerating ? "not-allowed" : "pointer" }}
          >
            {batchGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {batchGenerating ? "Generating..." : "Generate Top 100"}
          </button>
          <button
            onClick={() => handleBatchGenerate(25)}
            disabled={batchGenerating}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)", cursor: batchGenerating ? "not-allowed" : "pointer" }}
          >
            <Zap className="h-4 w-4" /> Quick 25
          </button>
          {batchGenerating && (
            <span className="text-xs" style={muted}>This may take several minutes...</span>
          )}
        </div>
        {batchResult && (
          <div className="mt-4 rounded-lg p-3" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4" style={{ color: "var(--cg-accent)" }} />
              <span style={primary}>
                Generated {batchResult.generated} of {batchResult.total} courses
              </span>
              {batchResult.failed > 0 && (
                <span style={{ color: "var(--cg-error)" }}>({batchResult.failed} failed)</span>
              )}
            </div>
            {batchResult.errors?.length > 0 && (
              <div className="mt-2 space-y-1">
                {batchResult.errors.map((e: any, i: number) => (
                  <div key={i} className="text-xs" style={{ color: "var(--cg-error)" }}>
                    Course #{e.courseId}: {e.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <Filter className="h-4 w-4" style={muted} />
        {[
          { value: "all", label: "All" },
          { value: "with_content", label: "Has Content" },
          { value: "without_content", label: "Needs Content" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={{
              backgroundColor: filter === f.value ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
              color: filter === f.value ? "white" : "var(--cg-text-secondary)",
              border: `1px solid ${filter === f.value ? "var(--cg-accent)" : "var(--cg-border)"}`,
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}

        <div className="ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={muted} />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg pl-9 pr-3 py-1.5 text-xs w-48"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              border: "1px solid var(--cg-border)",
              color: "var(--cg-text-primary)",
              outline: "none",
            }}
          />
        </div>

        <button onClick={fetchCourses} className="p-1.5 rounded-lg hover:opacity-80" style={{ backgroundColor: "var(--cg-bg-tertiary)", border: "none", cursor: "pointer" }}>
          <RefreshCw className="h-4 w-4" style={muted} />
        </button>
      </div>

      {/* Course Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
        </div>
      ) : (
        <>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--cg-border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={muted}>Course</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={muted}>Location</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={muted}>Score</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={muted}>Content</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={muted}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.courseId} style={{ borderTop: "1px solid var(--cg-border)" }}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/course/${c.courseId}`}
                        className="font-medium text-sm hover:underline"
                        style={primary}
                      >
                        {c.courseName}
                      </Link>
                      {c.accessType && (
                        <span className="ml-2 text-[10px] rounded-full px-1.5 py-0.5" style={{
                          backgroundColor: "var(--cg-bg-tertiary)",
                          color: "var(--cg-text-muted)",
                          border: "1px solid var(--cg-border)",
                        }}>
                          {c.accessType}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={secondary}>{c.location}</td>
                    <td className="px-4 py-3 text-center">
                      {c.chameleonScore ? (
                        <span className="text-xs font-bold tabular-nums" style={{ color: "var(--cg-accent)" }}>
                          {parseFloat(c.chameleonScore).toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-xs" style={muted}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.hasContent ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className="h-4 w-4" style={{ color: "var(--cg-accent)" }} />
                          {c.contentGeneratedAt && (
                            <span className="text-[10px] mt-0.5" style={muted}>
                              {new Date(c.contentGeneratedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <XCircle className="h-4 w-4 mx-auto" style={{ color: "var(--cg-text-muted)", opacity: 0.4 }} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleGenerate(c.courseId, true)}
                          disabled={previewLoading === c.courseId || generating === c.courseId}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium hover:opacity-90 disabled:opacity-50"
                          style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)", cursor: "pointer" }}
                        >
                          {previewLoading === c.courseId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                          Preview
                        </button>
                        <button
                          onClick={() => handleGenerate(c.courseId)}
                          disabled={generating === c.courseId || previewLoading === c.courseId}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium hover:opacity-90 disabled:opacity-50"
                          style={{ backgroundColor: "var(--cg-accent)", color: "white", border: "none", cursor: "pointer" }}
                        >
                          {generating === c.courseId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                          {c.hasContent ? "Regenerate" : "Generate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm" style={muted}>No courses found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs" style={muted}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} courses)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg disabled:opacity-30"
                  style={{ backgroundColor: "var(--cg-bg-tertiary)", border: "none", cursor: "pointer" }}
                >
                  <ChevronLeft className="h-4 w-4" style={muted} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="p-1.5 rounded-lg disabled:opacity-30"
                  style={{ backgroundColor: "var(--cg-bg-tertiary)", border: "none", cursor: "pointer" }}
                >
                  <ChevronRight className="h-4 w-4" style={muted} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
