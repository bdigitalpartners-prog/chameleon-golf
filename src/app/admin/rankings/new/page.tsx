"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Download, Loader2, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface SourceOption {
  sourceId: number;
  sourceName: string;
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

export default function NewRankingListPage() {
  const router = useRouter();
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showNewSource, setShowNewSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");

  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const [form, setForm] = useState({
    sourceId: "",
    listName: "",
    listType: "",
    region: "",
    yearPublished: new Date().getFullYear().toString(),
    cycleLabel: "",
    prestigeTier: "regional",
    listWeight: "0.4",
    url: "",
  });

  useEffect(() => {
    fetchAdmin("/api/admin/rankings")
      .then((r) => r.json())
      .then((data) => setSources(data.sources || []))
      .catch(console.error);
  }, []);

  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const createSource = async () => {
    if (!newSourceName.trim()) return;
    try {
      const res = await fetchAdmin("/api/admin/rankings/sources", {
        method: "POST",
        body: JSON.stringify({ sourceName: newSourceName, sourceUrl: newSourceUrl }),
      });
      const data = await res.json();
      if (data.sourceId) {
        setSources((prev) => [...prev, { sourceId: data.sourceId, sourceName: data.sourceName }]);
        set("sourceId", String(data.sourceId));
        setShowNewSource(false);
        setNewSourceName("");
        setNewSourceUrl("");
      } else {
        setError(data.error || "Failed to create source");
      }
    } catch {
      setError("Failed to create source");
    }
  };

  const handleImportPreview = async () => {
    const url = importUrl || form.url;
    if (!url) {
      setError("Enter a URL to import from");
      return;
    }
    setImporting(true);
    setError("");
    setImportResult(null);
    try {
      const res = await fetchAdmin("/api/admin/rankings/import", {
        method: "POST",
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setImportResult(data);
      }
    } catch {
      setError("Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleCreateAndImport = async () => {
    if (!form.sourceId || !form.listName || !form.yearPublished) {
      setError("Source, list name, and year are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Step 1: Create the list
      const createRes = await fetchAdmin("/api/admin/rankings", {
        method: "POST",
        body: JSON.stringify({ ...form, url: importUrl || form.url }),
      });
      const listData = await createRes.json();
      if (!listData.listId) {
        setError(listData.error || "Failed to create list");
        return;
      }

      // Step 2: Import entries if we have preview data
      if (importResult?.entries?.length) {
        const importRes = await fetchAdmin("/api/admin/rankings/import", {
          method: "POST",
          body: JSON.stringify({ url: importUrl || form.url, listId: listData.listId }),
        });
        await importRes.json();
      }

      router.push(`/admin/rankings/${listData.listId}`);
    } catch {
      setError("Failed to create list");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (importResult?.entries?.length) {
      await handleCreateAndImport();
    } else {
      if (!form.sourceId || !form.listName || !form.yearPublished) {
        setError("Source, list name, and year are required");
        return;
      }
      setSaving(true);
      setError("");
      try {
        const res = await fetchAdmin("/api/admin/rankings", {
          method: "POST",
          body: JSON.stringify({ ...form, url: importUrl || form.url }),
        });
        const data = await res.json();
        if (data.listId) {
          router.push(`/admin/rankings/${data.listId}`);
        } else {
          setError(data.error || "Failed to create list");
        }
      } catch {
        setError("Failed to create list");
      } finally {
        setSaving(false);
      }
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/rankings" className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">New Ranking List</h1>
          <p className="text-sm text-gray-400 mt-1">Create a new ranking list</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-[#222] bg-[#111] p-6 space-y-4">
          {/* Source */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Source *</label>
            <div className="flex gap-2">
              <select value={form.sourceId} onChange={(e) => set("sourceId", e.target.value)} className={inputClass + " flex-1"}>
                <option value="">Select source...</option>
                {sources.map((s) => (
                  <option key={s.sourceId} value={s.sourceId}>{s.sourceName}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewSource(!showNewSource)}
                className="px-3 py-2 rounded-lg border border-[#333] text-gray-400 hover:text-white hover:bg-[#1a1a1a] text-sm"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* New Source Inline */}
          {showNewSource && (
            <div className="rounded-lg bg-[#0a0a0a] border border-[#333] p-4 space-y-3">
              <p className="text-xs font-medium text-gray-400">Create New Source</p>
              <input
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                placeholder="Source name"
                className={inputClass}
              />
              <input
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                placeholder="Source URL (optional)"
                className={inputClass}
              />
              <button
                type="button"
                onClick={createSource}
                className="px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium text-sm hover:bg-[#16a34a]"
              >
                Create Source
              </button>
            </div>
          )}

          {/* URL + Import */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Source URL</label>
            <div className="flex gap-2">
              <input
                value={importUrl || form.url}
                onChange={(e) => { setImportUrl(e.target.value); set("url", e.target.value); }}
                placeholder="https://www.golfdigest.com/story/americas-100-greatest-golf-courses"
                className={inputClass + " flex-1"}
              />
              <button
                type="button"
                onClick={handleImportPreview}
                disabled={importing}
                className="px-4 py-2 rounded-lg border border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10 text-sm font-medium flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                {importing ? (
                  <><Loader2 size={14} className="animate-spin" /> Importing...</>
                ) : (
                  <><Download size={14} /> Import List</>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">Paste a ranking list URL to auto-extract courses and populate entries</p>
          </div>

          {/* Import Results Preview */}
          {importResult && (
            <div className="rounded-lg bg-[#0a0a0a] border border-[#333] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">Import Preview</p>
                <div className="flex gap-3 text-xs">
                  <span className="text-[#22c55e]">{importResult.matched} matched</span>
                  <span className="text-yellow-500">{importResult.unmatched} unmatched</span>
                  <span className="text-gray-500">{importResult.totalExtracted} total</span>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {importResult.entries?.map((entry: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-xs py-1 border-b border-[#1a1a1a] last:border-0">
                    <span className="text-gray-500 w-8 text-right">#{entry.rank}</span>
                    <span className={entry.matchedCourseId ? "text-white" : "text-gray-500"}>
                      {entry.courseName}
                    </span>
                    {entry.matchedCourseId ? (
                      <span className="ml-auto flex items-center gap-1">
                        {entry.confidence === "exact" && <CheckCircle size={12} className="text-[#22c55e]" />}
                        {entry.confidence === "high" && <CheckCircle size={12} className="text-blue-400" />}
                        {entry.confidence === "partial" && <AlertCircle size={12} className="text-yellow-500" />}
                        <span className="text-gray-500">{entry.matchedCourseName}</span>
                      </span>
                    ) : (
                      <span className="ml-auto flex items-center gap-1 text-gray-600">
                        <XCircle size={12} /> No match
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {importResult.matched > 0 && (
                <p className="text-xs text-gray-500">
                  {importResult.matched} courses will be imported when you create the list (exact + high confidence matches only)
                </p>
              )}
            </div>
          )}

          {/* List Name */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">List Name *</label>
            <input value={form.listName} onChange={(e) => set("listName", e.target.value)} placeholder="e.g., America's 100 Greatest" className={inputClass} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              <input value={form.listType} onChange={(e) => set("listType", e.target.value)} placeholder="e.g., Top 100, Best Of" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Region</label>
              <input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="e.g., USA, World" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Year Published *</label>
              <input type="number" value={form.yearPublished} onChange={(e) => set("yearPublished", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cycle Label</label>
              <input value={form.cycleLabel} onChange={(e) => set("cycleLabel", e.target.value)} placeholder="e.g., 2025-2026" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prestige Tier</label>
              <select value={form.prestigeTier} onChange={(e) => set("prestigeTier", e.target.value)} className={inputClass}>
                <option value="regional">Regional</option>
                <option value="national">National</option>
                <option value="elite">Elite</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">List Weight</label>
              <input type="number" step="0.01" value={form.listWeight} onChange={(e) => set("listWeight", e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/admin/rankings" className="px-4 py-2 rounded-lg border border-[#333] text-gray-400 hover:text-white text-sm">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-[#22c55e] text-black font-medium text-sm hover:bg-[#16a34a] disabled:opacity-50"
          >
            {saving
              ? "Creating..."
              : importResult?.matched
                ? `Create List & Import ${importResult.matched} Courses`
                : "Create List"}
          </button>
        </div>
      </form>
    </div>
  );
}
