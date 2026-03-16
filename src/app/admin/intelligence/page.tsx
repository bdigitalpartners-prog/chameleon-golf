"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Lightbulb,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  X,
  Save,
} from "lucide-react";

interface IntelligenceNote {
  id: number;
  courseId: number;
  category: string;
  title: string;
  content: string;
  icon: string | null;
  generatedAt: string;
  source: string;
  isVisible: boolean;
  course: { courseName: string };
}

interface GenerateResult {
  courseId: number;
  courseName: string;
  notesGenerated: number;
}

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  BEST_TIME_TO_VISIT: { label: "Best Time", color: "text-blue-400" },
  INSIDER_TIP: { label: "Insider Tip", color: "text-yellow-400" },
  SIMILAR_COURSES: { label: "Similar", color: "text-purple-400" },
  COURSE_STRATEGY: { label: "Strategy", color: "text-green-400" },
  WHAT_TO_EXPECT: { label: "Expect", color: "text-orange-400" },
  ACCESS_GUIDE: { label: "Access", color: "text-red-400" },
};

export default function IntelligencePage() {
  const [notes, setNotes] = useState<IntelligenceNote[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [courseIdFilter, setCourseIdFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Generate state
  const [generating, setGenerating] = useState(false);
  const [generateResults, setGenerateResults] = useState<{
    coursesProcessed: number;
    totalNotesGenerated: number;
    results: GenerateResult[];
  } | null>(null);
  const [generateError, setGenerateError] = useState("");
  const [batchLimit, setBatchLimit] = useState("50");

  // Edit state
  const [editingNote, setEditingNote] = useState<IntelligenceNote | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (courseIdFilter) params.set("courseId", courseIdFilter);

      const res = await fetch(`/api/admin/intelligence-notes?${params}`, {
        headers: { "x-admin-key": getAdminKey() },
      });
      const data = await res.json();
      setNotes(data.notes || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [page, courseIdFilter]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleGenerate = async (dryRun = false) => {
    setGenerating(true);
    setGenerateResults(null);
    setGenerateError("");
    try {
      const body: any = { limit: parseInt(batchLimit) || 50, dryRun };
      const res = await fetch("/api/admin/intelligence-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": getAdminKey(),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(data.error || "Generation failed");
        return;
      }
      setGenerateResults({
        coursesProcessed: data.coursesProcessed,
        totalNotesGenerated: data.totalNotesGenerated,
        results: data.results || [],
      });
      if (!dryRun) fetchNotes();
    } catch (err: any) {
      setGenerateError(err.message || "Network error");
    } finally {
      setGenerating(false);
    }
  };

  const toggleVisibility = async (note: IntelligenceNote) => {
    try {
      const res = await fetch(`/api/admin/intelligence-notes/${note.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": getAdminKey(),
        },
        body: JSON.stringify({ isVisible: !note.isVisible }),
      });
      if (res.ok) {
        setNotes((prev) =>
          prev.map((n) => (n.id === note.id ? { ...n, isVisible: !n.isVisible } : n))
        );
      }
    } catch {}
  };

  const deleteNote = async (noteId: number) => {
    if (!confirm("Delete this intelligence note?")) return;
    try {
      const res = await fetch(`/api/admin/intelligence-notes/${noteId}`, {
        method: "DELETE",
        headers: { "x-admin-key": getAdminKey() },
      });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        setTotal((t) => t - 1);
      }
    } catch {}
  };

  const startEdit = (note: IntelligenceNote) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const saveEdit = async () => {
    if (!editingNote) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/intelligence-notes/${editingNote.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": getAdminKey(),
        },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      if (res.ok) {
        setNotes((prev) =>
          prev.map((n) =>
            n.id === editingNote.id ? { ...n, title: editTitle, content: editContent } : n
          )
        );
        setEditingNote(null);
      }
    } catch {}
    setSaving(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCourseIdFilter(search);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Course Intelligence</h1>
          <p className="text-sm text-gray-400 mt-1">
            {total.toLocaleString()} intelligence notes across all courses
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleGenerate(true)}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Lightbulb size={16} />}
            Dry Run
          </button>
          <button
            onClick={() => handleGenerate(false)}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium hover:bg-[#16a34a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Generate Notes
          </button>
        </div>
      </div>

      {/* Batch Config */}
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Batch Size</label>
          <input
            type="number"
            value={batchLimit}
            onChange={(e) => setBatchLimit(e.target.value)}
            min={1}
            max={200}
            className="w-24 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
          />
        </div>
        <p className="text-xs text-gray-500 mt-5">
          Generates notes for top courses by ranking count. Max 200 per batch.
        </p>
      </div>

      {/* Generate Results */}
      {generateResults && (
        <div className="rounded-xl border border-[#222] bg-[#111] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400" />
              Generation Complete
            </h3>
            <button
              onClick={() => setGenerateResults(null)}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            <div className="rounded-lg bg-[#1a1a1a] p-2">
              <div className="text-lg font-bold text-white">{generateResults.coursesProcessed}</div>
              <div className="text-gray-500">Courses Processed</div>
            </div>
            <div className="rounded-lg bg-[#1a1a1a] p-2">
              <div className="text-lg font-bold text-green-400">
                {generateResults.totalNotesGenerated}
              </div>
              <div className="text-gray-500">Notes Generated</div>
            </div>
          </div>
          {generateResults.results.length > 0 && (
            <div className="mt-3 max-h-40 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 text-left">
                    <th className="pb-1">Course</th>
                    <th className="pb-1 text-right">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {generateResults.results.slice(0, 30).map((r) => (
                    <tr key={r.courseId} className="text-gray-300">
                      <td className="py-0.5 truncate max-w-[300px]">{r.courseName}</td>
                      <td className="py-0.5 text-right text-green-400">{r.notesGenerated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {generateError && (
        <div className="rounded-xl border border-red-900/50 bg-red-900/20 p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{generateError}</p>
          <button
            onClick={() => setGenerateError("")}
            className="ml-auto text-xs text-red-400 hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search / Filter */}
      <form onSubmit={handleSearch} className="flex gap-3 items-end">
        <div className="flex-1 max-w-xs">
          <label className="block text-xs text-gray-500 mb-1">Filter by Course ID</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Enter course ID..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e]"
            />
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222] text-sm"
        >
          Filter
        </button>
        {courseIdFilter && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCourseIdFilter("");
              setPage(1);
            }}
            className="px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222] text-sm"
          >
            Clear
          </button>
        )}
      </form>

      {/* Notes Table */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Content</th>
                <th className="px-4 py-3 font-medium text-center">Visible</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <Loader2 size={20} className="animate-spin inline-block mr-2" />
                    Loading notes...
                  </td>
                </tr>
              ) : notes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No intelligence notes found.{" "}
                    {!courseIdFilter && "Click \"Generate Notes\" to create them."}
                  </td>
                </tr>
              ) : (
                notes.map((note) => {
                  const catConfig = CATEGORY_LABELS[note.category] || {
                    label: note.category,
                    color: "text-gray-400",
                  };
                  return (
                    <tr
                      key={note.id}
                      className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-white font-medium text-xs">
                          {note.course?.courseName || `Course #${note.courseId}`}
                        </div>
                        <div className="text-[10px] text-gray-600">ID: {note.courseId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium bg-[#1a1a1a] ${catConfig.color}`}
                        >
                          {catConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white text-xs max-w-[180px] truncate">
                        {note.title}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[300px] truncate">
                        {note.content}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleVisibility(note)}
                          className={`p-1 rounded ${
                            note.isVisible
                              ? "text-green-400 hover:text-green-300"
                              : "text-gray-600 hover:text-gray-400"
                          }`}
                          title={note.isVisible ? "Hide note" : "Show note"}
                        >
                          {note.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(note)}
                            className="p-1 rounded text-gray-400 hover:text-white"
                            title="Edit note"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="p-1 rounded text-gray-400 hover:text-red-400"
                            title="Delete note"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
              Page {page} of {totalPages} ({total.toLocaleString()} notes)
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

      {/* Edit Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#111] border border-[#333] rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Edit Intelligence Note</h3>
              <button
                onClick={() => setEditingNote(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e] resize-y"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#222] text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium hover:bg-[#16a34a] text-sm disabled:opacity-40"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
