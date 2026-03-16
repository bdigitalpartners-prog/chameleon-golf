"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Upload, Pencil, X, Check } from "lucide-react";
import Link from "next/link";

interface Entry {
  entryId: number;
  listId: number;
  courseId: number;
  courseName: string;
  city: string | null;
  state: string | null;
  rankPosition: number | null;
  rankTied: boolean;
  score: number | null;
  previousRank: number | null;
  rankChange: number | null;
  notes: string | null;
}

interface ListData {
  listId: number;
  sourceId: number;
  listName: string;
  listType: string | null;
  region: string | null;
  yearPublished: number;
  cycleLabel: string | null;
  prestigeTier: string;
  listWeight: number;
  source: { sourceId: number; sourceName: string };
  entries: Entry[];
}

interface CourseSearchResult {
  courseId: number;
  courseName: string;
  city: string | null;
  state: string | null;
}

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

function fetchAdmin(url: string, opts: RequestInit = {}) {
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": getAdminKey(),
      ...(opts.headers || {}),
    },
  });
}

export default function RankingListEditorPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.listId as string;

  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingMeta, setEditingMeta] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editEntry, setEditEntry] = useState<Partial<Entry>>({});
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [courseResults, setCourseResults] = useState<CourseSearchResult[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseSearchResult | null>(null);
  const [newRank, setNewRank] = useState("");
  const [newScore, setNewScore] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const [meta, setMeta] = useState({
    listName: "",
    listType: "",
    region: "",
    yearPublished: "",
    cycleLabel: "",
    prestigeTier: "regional",
    listWeight: "0.4",
  });

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetchAdmin(`/api/admin/rankings/${listId}`);
      const d = await res.json();
      if (d.error) {
        setError(d.error);
        return;
      }
      setData(d);
      setMeta({
        listName: d.listName || "",
        listType: d.listType || "",
        region: d.region || "",
        yearPublished: String(d.yearPublished),
        cycleLabel: d.cycleLabel || "",
        prestigeTier: d.prestigeTier || "regional",
        listWeight: String(d.listWeight),
      });
    } catch {
      setError("Failed to load list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [listId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMeta = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetchAdmin(`/api/admin/rankings/${listId}`, {
        method: "PUT",
        body: JSON.stringify(meta),
      });
      const d = await res.json();
      if (d.success) {
        setEditingMeta(false);
        fetchList();
      } else {
        setError(d.error || "Failed to save");
      }
    } catch {
      setError("Failed to save metadata");
    } finally {
      setSaving(false);
    }
  };

  const searchCourses = async (q: string) => {
    setCourseSearch(q);
    if (q.length < 2) {
      setCourseResults([]);
      return;
    }
    try {
      const res = await fetchAdmin(`/api/admin/courses?search=${encodeURIComponent(q)}&limit=10`);
      const d = await res.json();
      setCourseResults(
        (d.courses || []).map((c: any) => ({
          courseId: c.courseId,
          courseName: c.courseName,
          city: c.city,
          state: c.state,
        }))
      );
    } catch {
      setCourseResults([]);
    }
  };

  const addEntry = async () => {
    if (!selectedCourse) return;
    setError("");
    try {
      const res = await fetchAdmin(`/api/admin/rankings/${listId}/entries`, {
        method: "POST",
        body: JSON.stringify({
          courseId: selectedCourse.courseId,
          rankPosition: newRank || null,
          score: newScore || null,
          notes: newNotes || null,
        }),
      });
      const d = await res.json();
      if (d.error) {
        setError(d.error);
      } else {
        setShowAddEntry(false);
        setSelectedCourse(null);
        setCourseSearch("");
        setNewRank("");
        setNewScore("");
        setNewNotes("");
        fetchList();
      }
    } catch {
      setError("Failed to add entry");
    }
  };

  const saveEntry = async (entryId: number) => {
    setError("");
    try {
      const res = await fetchAdmin(`/api/admin/rankings/${listId}/entries/${entryId}`, {
        method: "PUT",
        body: JSON.stringify(editEntry),
      });
      const d = await res.json();
      if (d.success) {
        setEditingEntryId(null);
        setEditEntry({});
        fetchList();
      } else {
        setError(d.error || "Failed to update");
      }
    } catch {
      setError("Failed to update entry");
    }
  };

  const deleteEntry = async (entryId: number) => {
    if (!confirm("Remove this entry from the list?")) return;
    try {
      await fetchAdmin(`/api/admin/rankings/${listId}/entries/${entryId}`, { method: "DELETE" });
      fetchList();
    } catch {
      setError("Failed to delete entry");
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    const header = lines[0].toLowerCase();
    const hasHeader = header.includes("rank") || header.includes("course") || header.includes("score");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    let imported = 0;
    let errors = 0;
    for (const line of dataLines) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 2) continue;
      // Format: rank, course_id, score (optional)
      const [rank, courseId, score] = parts;
      try {
        const res = await fetchAdmin(`/api/admin/rankings/${listId}/entries`, {
          method: "POST",
          body: JSON.stringify({
            courseId: parseInt(courseId, 10),
            rankPosition: rank ? parseInt(rank, 10) : null,
            score: score || null,
          }),
        });
        const d = await res.json();
        if (d.error) errors++;
        else imported++;
      } catch {
        errors++;
      }
    }
    alert(`Imported ${imported} entries. ${errors > 0 ? `${errors} errors.` : ""}`);
    fetchList();
    e.target.value = "";
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]";
  const smallInput = "px-2 py-1 rounded bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e] w-20";

  if (loading) {
    return <div className="text-center text-gray-500 py-12">Loading...</div>;
  }

  if (!data) {
    return <div className="text-center text-red-400 py-12">{error || "List not found"}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/rankings" className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{data.listName}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {data.source.sourceName} · {data.yearPublished} · {data.entries.length} entries
          </p>
        </div>
        <button
          onClick={() => setEditingMeta(!editingMeta)}
          className="px-4 py-2 rounded-lg border border-[#333] text-gray-400 hover:text-white text-sm"
        >
          <Pencil size={16} className="inline mr-1" />
          Edit Metadata
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Edit Metadata Panel */}
      {editingMeta && (
        <div className="rounded-xl border border-[#222] bg-[#111] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-400">Edit List Metadata</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">List Name</label>
              <input value={meta.listName} onChange={(e) => setMeta((p) => ({ ...p, listName: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              <input value={meta.listType} onChange={(e) => setMeta((p) => ({ ...p, listType: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Region</label>
              <input value={meta.region} onChange={(e) => setMeta((p) => ({ ...p, region: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Year Published</label>
              <input type="number" value={meta.yearPublished} onChange={(e) => setMeta((p) => ({ ...p, yearPublished: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cycle Label</label>
              <input value={meta.cycleLabel} onChange={(e) => setMeta((p) => ({ ...p, cycleLabel: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prestige Tier</label>
              <select value={meta.prestigeTier} onChange={(e) => setMeta((p) => ({ ...p, prestigeTier: e.target.value }))} className={inputClass}>
                <option value="regional">Regional</option>
                <option value="national">National</option>
                <option value="elite">Elite</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">List Weight</label>
              <input type="number" step="0.01" value={meta.listWeight} onChange={(e) => setMeta((p) => ({ ...p, listWeight: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditingMeta(false)} className="px-4 py-2 rounded-lg border border-[#333] text-gray-400 hover:text-white text-sm">
              Cancel
            </button>
            <button onClick={saveMeta} disabled={saving} className="px-6 py-2 rounded-lg bg-[#22c55e] text-black font-medium text-sm hover:bg-[#16a34a] disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowAddEntry(!showAddEntry)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium text-sm hover:bg-[#16a34a]"
        >
          <Plus size={16} />
          Add Entry
        </button>
        <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#333] text-gray-400 hover:text-white text-sm cursor-pointer">
          <Upload size={16} />
          Import CSV
          <input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
        </label>
      </div>

      {/* Add Entry Panel */}
      {showAddEntry && (
        <div className="rounded-xl border border-[#222] bg-[#111] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-400">Add Entry</h3>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Search Course</label>
            <input
              value={courseSearch}
              onChange={(e) => searchCourses(e.target.value)}
              placeholder="Type to search courses..."
              className={inputClass}
            />
            {courseResults.length > 0 && !selectedCourse && (
              <div className="mt-1 border border-[#333] rounded-lg bg-[#0a0a0a] max-h-48 overflow-y-auto">
                {courseResults.map((c) => (
                  <button
                    key={c.courseId}
                    onClick={() => {
                      setSelectedCourse(c);
                      setCourseSearch(c.courseName);
                      setCourseResults([]);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#1a1a1a] text-sm text-white"
                  >
                    {c.courseName}
                    {c.city && c.state ? <span className="text-gray-500 ml-2">· {c.city}, {c.state}</span> : null}
                  </button>
                ))}
              </div>
            )}
            {selectedCourse && (
              <p className="text-xs text-green-500 mt-1">
                Selected: {selectedCourse.courseName} (ID: {selectedCourse.courseId})
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rank Position</label>
              <input type="number" value={newRank} onChange={(e) => setNewRank(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Score</label>
              <input type="number" step="0.1" value={newScore} onChange={(e) => setNewScore(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              <input value={newNotes} onChange={(e) => setNewNotes(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowAddEntry(false);
                setSelectedCourse(null);
                setCourseSearch("");
              }}
              className="px-4 py-2 rounded-lg border border-[#333] text-gray-400 hover:text-white text-sm"
            >
              Cancel
            </button>
            <button
              onClick={addEntry}
              disabled={!selectedCourse}
              className="px-6 py-2 rounded-lg bg-[#22c55e] text-black font-medium text-sm hover:bg-[#16a34a] disabled:opacity-50"
            >
              Add Entry
            </button>
          </div>
        </div>
      )}

      {/* Entries Table */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] text-gray-400 text-left">
                <th className="px-4 py-3 font-medium w-16">#</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium text-right">Score</th>
                <th className="px-4 py-3 font-medium text-right">Prev Rank</th>
                <th className="px-4 py-3 font-medium text-right">Change</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    No entries yet. Add entries above.
                  </td>
                </tr>
              ) : (
                data.entries.map((entry) => {
                  const isEditing = editingEntryId === entry.entryId;
                  return (
                    <tr key={entry.entryId} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]">
                      <td className="px-4 py-3 text-white font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editEntry.rankPosition ?? ""}
                            onChange={(e) => setEditEntry((p) => ({ ...p, rankPosition: e.target.value ? parseInt(e.target.value) : null }))}
                            className={smallInput}
                          />
                        ) : (
                          entry.rankPosition ?? "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{entry.courseName}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {entry.city && entry.state ? `${entry.city}, ${entry.state}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editEntry.score ?? ""}
                            onChange={(e) => setEditEntry((p) => ({ ...p, score: e.target.value ? parseFloat(e.target.value) : null }))}
                            className={smallInput + " text-right"}
                          />
                        ) : (
                          entry.score ?? "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 font-mono">
                        {entry.previousRank ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {entry.rankChange != null ? (
                          <span className={entry.rankChange > 0 ? "text-green-500" : entry.rankChange < 0 ? "text-red-500" : "text-gray-400"}>
                            {entry.rankChange > 0 ? `+${entry.rankChange}` : entry.rankChange}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {isEditing ? (
                          <input
                            value={editEntry.notes ?? ""}
                            onChange={(e) => setEditEntry((p) => ({ ...p, notes: e.target.value }))}
                            className={smallInput + " w-32"}
                          />
                        ) : (
                          entry.notes || "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEntry(entry.entryId)}
                                className="p-1 rounded hover:bg-green-900/30 text-green-500"
                                title="Save"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => { setEditingEntryId(null); setEditEntry({}); }}
                                className="p-1 rounded hover:bg-gray-800 text-gray-400"
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingEntryId(entry.entryId);
                                  setEditEntry({
                                    rankPosition: entry.rankPosition,
                                    score: entry.score,
                                    notes: entry.notes,
                                  });
                                }}
                                className="p-1 rounded hover:bg-[#222] text-gray-400 hover:text-white"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => deleteEntry(entry.entryId)}
                                className="p-1 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-500"
                                title="Remove"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
