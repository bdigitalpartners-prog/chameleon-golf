"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Video,
  Headphones,
  Globe,
  Check,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  ExternalLink,
  RefreshCw,
  Star,
  Link2,
  Edit2,
  Search,
  Rss,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

const CONTENT_TYPE_ICONS: Record<string, any> = {
  article: FileText,
  video: Video,
  podcast: Headphones,
  social: Globe,
  instagram: Globe,
  document: FileText,
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  article: "bg-blue-900/40 text-blue-400",
  video: "bg-red-900/40 text-red-400",
  podcast: "bg-purple-900/40 text-purple-400",
  social: "bg-pink-900/40 text-pink-400",
  instagram: "bg-orange-900/40 text-orange-400",
  document: "bg-gray-700/40 text-gray-300",
};

const LINK_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ok: { bg: "bg-green-900/40", text: "text-green-400", label: "OK" },
  broken: { bg: "bg-red-900/40", text: "text-red-400", label: "Broken" },
  redirect: { bg: "bg-yellow-900/40", text: "text-yellow-400", label: "Redirect" },
  error: { bg: "bg-red-900/40", text: "text-red-400", label: "Error" },
  unknown: { bg: "bg-gray-700/40", text: "text-gray-400", label: "Unknown" },
};

interface ContentItem {
  id: number;
  contentType: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  summary: string | null;
  sourceName: string | null;
  authorName: string | null;
  publishedAt: string | null;
  isApproved: boolean;
  isFeatured: boolean;
  submittedBy: string | null;
  createdAt: string;
  linkStatus: string | null;
  lastCheckedAt: string | null;
  checkNote: string | null;
  architects: { architect: { id: number; name: string } }[];
  courses: { course: { courseId: number; courseName: string } }[];
}

interface Architect {
  id: number;
  name: string;
}

interface ContentSourceItem {
  id: number;
  name: string;
  feedUrl: string | null;
  websiteUrl: string;
  contentTypes: string[];
  isActive: boolean;
  lastFetchedAt: string | null;
}

interface DiscoveredItem {
  title: string;
  link: string;
  pubDate: string | null;
  source: string;
  contentType: string;
  isNew: boolean;
  matchedArchitects: string[];
  description: string | null;
}

const TOP_TABS = [
  { key: "all-content", label: "All Content" },
  { key: "discover", label: "Discover" },
  { key: "pending", label: "Pending Review" },
  { key: "link-health", label: "Link Health" },
];

const CONTENT_TABS = [
  { key: "all", label: "All" },
  { key: "approved", label: "Approved" },
  { key: "pending", label: "Pending" },
];

export default function AdminContentPage() {
  const [topTab, setTopTab] = useState("all-content");
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkUrls, setBulkUrls] = useState("");
  const [checkingLinks, setCheckingLinks] = useState(false);
  const [linkCheckResult, setLinkCheckResult] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [architects, setArchitects] = useState<Architect[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  // Discover tab state
  const [sources, setSources] = useState<ContentSourceItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ items: DiscoveredItem[]; [key: string]: any } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [newContent, setNewContent] = useState({
    title: "",
    url: "",
    contentType: "article",
    summary: "",
    sourceName: "",
    authorName: "",
    architectIds: [] as number[],
  });

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25", status: tab });
      const res = await fetch(`/api/admin/content?${params}`, {
        headers: { "x-admin-key": getAdminKey() },
      });
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, tab]);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/content?status=pending&limit=1", {
        headers: { "x-admin-key": getAdminKey() },
      });
      const data = await res.json();
      setPendingCount(data.total || 0);
    } catch {}
  }, []);

  const fetchArchitects = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/architects?limit=500", {
        headers: { "x-admin-key": getAdminKey() },
      });
      const data = await res.json();
      setArchitects(data.architects || data.items || []);
    } catch {
      setArchitects([]);
    }
  }, []);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/content-sources", {
        headers: { "x-admin-key": getAdminKey() },
      });
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchContent();
    fetchPendingCount();
  }, [fetchContent, fetchPendingCount]);

  useEffect(() => {
    fetchArchitects();
  }, [fetchArchitects]);

  useEffect(() => {
    if (topTab === "discover") fetchSources();
  }, [topTab, fetchSources]);

  const handleApprove = async (id: number) => {
    await fetch(`/api/admin/content`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-key": getAdminKey() },
      body: JSON.stringify({ id, isApproved: true }),
    });
    fetchContent();
    fetchPendingCount();
  };

  const handleReject = async (id: number) => {
    if (!confirm("Delete this content item?")) return;
    await fetch(`/api/admin/content?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": getAdminKey() },
    });
    fetchContent();
    fetchPendingCount();
  };

  const handleToggleFeatured = async (id: number, current: boolean) => {
    await fetch(`/api/admin/content`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-key": getAdminKey() },
      body: JSON.stringify({ id, isFeatured: !current }),
    });
    fetchContent();
  };

  const handleAdd = async () => {
    if (!newContent.title || !newContent.url) return;
    const { architectIds, ...data } = newContent;
    await fetch(`/api/admin/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": getAdminKey() },
      body: JSON.stringify({ ...data, architectIds: architectIds.length ? architectIds : undefined }),
    });
    setShowAddForm(false);
    setNewContent({ title: "", url: "", contentType: "article", summary: "", sourceName: "", authorName: "", architectIds: [] });
    fetchContent();
  };

  const handleEdit = async () => {
    if (!editingItem) return;
    await fetch(`/api/admin/content`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-key": getAdminKey() },
      body: JSON.stringify({
        id: editingItem.id,
        title: editingItem.title,
        url: editingItem.url,
        contentType: editingItem.contentType,
        summary: editingItem.summary,
        sourceName: editingItem.sourceName,
        isFeatured: editingItem.isFeatured,
      }),
    });
    setEditingItem(null);
    fetchContent();
  };

  const handleBulkImport = async () => {
    const urls = bulkUrls.split("\n").map((u) => u.trim()).filter(Boolean);
    for (const url of urls) {
      await fetch(`/api/admin/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": getAdminKey() },
        body: JSON.stringify({ title: url.split("/").pop() || "Imported", url, contentType: "article" }),
      });
    }
    setShowBulkImport(false);
    setBulkUrls("");
    fetchContent();
  };

  const handleCheckLinks = async () => {
    setCheckingLinks(true);
    setLinkCheckResult(null);
    try {
      const res = await fetch("/api/admin/check-links", {
        method: "POST",
        headers: { "x-admin-key": getAdminKey() },
      });
      const data = await res.json();
      setLinkCheckResult(data);
      fetchContent();
    } catch (err) {
      setLinkCheckResult({ error: "Failed to check links" });
    } finally {
      setCheckingLinks(false);
    }
  };

  const handleApproveAll = async () => {
    if (!confirm("Approve all pending items?")) return;
    try {
      const res = await fetch("/api/admin/content?status=pending&limit=500", {
        headers: { "x-admin-key": getAdminKey() },
      });
      const data = await res.json();
      for (const item of data.items || []) {
        await fetch("/api/admin/content", {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-admin-key": getAdminKey() },
          body: JSON.stringify({ id: item.id, isApproved: true }),
        });
      }
      fetchContent();
      fetchPendingCount();
    } catch {}
  };

  // Discover tab handlers
  const handleSeedSources = async () => {
    setSeeding(true);
    try {
      await fetch("/api/admin/seed-content-sources", {
        method: "POST",
        headers: { "x-admin-key": getAdminKey() },
      });
      fetchSources();
    } catch {}
    setSeeding(false);
  };

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);
    setSelectedItems(new Set());
    try {
      const res = await fetch("/api/admin/enrich-fairway", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": getAdminKey() },
        body: JSON.stringify({ dryRun: true }),
      });
      const data = await res.json();
      setScanResult(data);
      // Auto-select all new items
      const newItems = new Set<string>();
      for (const item of data.items || []) {
        if (item.isNew) newItems.add(item.link);
      }
      setSelectedItems(newItems);
    } catch {
      setScanResult({ error: "Scan failed" } as any);
    }
    setScanning(false);
  };

  const handleImportSelected = async () => {
    if (selectedItems.size === 0) return;
    setImporting(true);
    try {
      await fetch("/api/admin/enrich-fairway", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": getAdminKey() },
        body: JSON.stringify({ dryRun: false }),
      });
      setScanResult(null);
      setSelectedItems(new Set());
      fetchContent();
      fetchPendingCount();
    } catch {}
    setImporting(false);
  };

  const toggleSelect = (link: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(link)) next.delete(link);
      else next.add(link);
      return next;
    });
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Management</h1>
          <p className="text-sm text-gray-400 mt-1">{total} content items</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="px-4 py-2 rounded-lg border border-[#333] text-gray-300 hover:bg-[#1a1a1a] text-sm"
          >
            Bulk Import
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium hover:bg-[#16a34a] transition-colors"
          >
            <Plus size={16} />
            Add Content
          </button>
        </div>
      </div>

      {/* Bulk Import */}
      {showBulkImport && (
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Bulk Import URLs</h3>
          <textarea
            rows={5}
            value={bulkUrls}
            onChange={(e) => setBulkUrls(e.target.value)}
            placeholder="Paste URLs, one per line..."
            className={inputClass}
          />
          <div className="flex gap-2">
            <button onClick={handleBulkImport} className="px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium text-sm">
              Import
            </button>
            <button onClick={() => setShowBulkImport(false)} className="px-4 py-2 rounded-lg border border-[#333] text-gray-400 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Add Content</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Title</label>
              <input type="text" value={newContent.title} onChange={(e) => setNewContent({ ...newContent, title: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">URL</label>
              <input type="url" value={newContent.url} onChange={(e) => setNewContent({ ...newContent, url: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select value={newContent.contentType} onChange={(e) => setNewContent({ ...newContent, contentType: e.target.value })} className={inputClass}>
                <option value="article">Article</option>
                <option value="video">Video</option>
                <option value="podcast">Podcast</option>
                <option value="social">Social</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Source Name</label>
              <input type="text" value={newContent.sourceName} onChange={(e) => setNewContent({ ...newContent, sourceName: e.target.value })} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Summary</label>
              <textarea rows={2} value={newContent.summary} onChange={(e) => setNewContent({ ...newContent, summary: e.target.value })} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Architects</label>
              <select
                multiple
                value={newContent.architectIds.map(String)}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (opt) => parseInt(opt.value));
                  setNewContent({ ...newContent, architectIds: selected });
                }}
                className={`${inputClass} h-24`}
              >
                {architects.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium text-sm">Save</button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-lg border border-[#333] text-gray-400 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Edit Content</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Title</label>
              <input type="text" value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">URL</label>
              <input type="url" value={editingItem.url} onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select value={editingItem.contentType} onChange={(e) => setEditingItem({ ...editingItem, contentType: e.target.value })} className={inputClass}>
                <option value="article">Article</option>
                <option value="video">Video</option>
                <option value="podcast">Podcast</option>
                <option value="social">Social</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Source Name</label>
              <input type="text" value={editingItem.sourceName || ""} onChange={(e) => setEditingItem({ ...editingItem, sourceName: e.target.value })} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Summary</label>
              <textarea rows={2} value={editingItem.summary || ""} onChange={(e) => setEditingItem({ ...editingItem, summary: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleEdit} className="px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium text-sm">Save</button>
            <button onClick={() => setEditingItem(null)} className="px-4 py-2 rounded-lg border border-[#333] text-gray-400 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Top-Level Tabs */}
      <div className="flex gap-1 bg-[#111] border border-[#222] rounded-lg p-1">
        {TOP_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTopTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
              topTab === t.key ? "bg-[#22c55e]/10 text-[#22c55e]" : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
            {t.key === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-orange-500 text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: ALL CONTENT ─── */}
      {topTab === "all-content" && (
        <>
          {/* Sub-tabs */}
          <div className="flex gap-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-1">
            {CONTENT_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setPage(1); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  tab === t.key ? "bg-[#22c55e]/10 text-[#22c55e]" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content Table */}
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-gray-500" size={32} />
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No content found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#222] text-left">
                      <th className="px-4 py-3 text-xs font-medium text-gray-400">Title</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-400">Type</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-400">Status</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-400">Link</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-400">Featured</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {items.map((item) => {
                      const TypeIcon = CONTENT_TYPE_ICONS[item.contentType] || FileText;
                      const linkStyle = LINK_STATUS_STYLES[item.linkStatus || "unknown"] || LINK_STATUS_STYLES.unknown;
                      return (
                        <tr key={item.id} className="hover:bg-[#1a1a1a] transition-colors">
                          <td className="px-4 py-3">
                            <div className="max-w-xs">
                              <p className="text-white font-medium truncate">{item.title}</p>
                              <p className="text-gray-500 text-xs truncate">{item.url}</p>
                              {item.architects.length > 0 && (
                                <p className="text-[#22c55e] text-xs mt-0.5 truncate">
                                  {item.architects.map((l) => l.architect.name).join(", ")}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${CONTENT_TYPE_COLORS[item.contentType] || "bg-gray-700/40 text-gray-300"}`}>
                              <TypeIcon size={12} />
                              {item.contentType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {item.isApproved ? (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-900/40 text-green-400">Approved</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-900/40 text-orange-400">Pending</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${linkStyle.bg} ${linkStyle.text}`}
                              title={item.checkNote || undefined}
                            >
                              {linkStyle.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleFeatured(item.id, item.isFeatured)}
                              className={`p-1 rounded transition-colors ${
                                item.isFeatured
                                  ? "text-yellow-400 hover:text-yellow-300"
                                  : "text-gray-600 hover:text-gray-400"
                              }`}
                            >
                              <Star size={16} fill={item.isFeatured ? "currentColor" : "none"} />
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white">
                                <ExternalLink size={14} />
                              </a>
                              <button onClick={() => setEditingItem(item)} className="p-1.5 rounded bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white">
                                <Edit2 size={14} />
                              </button>
                              {!item.isApproved && (
                                <button onClick={() => handleApprove(item.id)} className="p-1.5 rounded bg-green-900/40 border border-green-800 text-green-400 hover:bg-green-900/60">
                                  <Check size={14} />
                                </button>
                              )}
                              <button onClick={() => handleReject(item.id)} className="p-1.5 rounded bg-[#1a1a1a] border border-[#333] text-gray-400 hover:bg-red-900/40 hover:text-red-400">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#222]">
                <p className="text-xs text-gray-500">Page {page} of {totalPages} ({total} items)</p>
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
      )}

      {/* ─── TAB 2: DISCOVER ─── */}
      {topTab === "discover" && (
        <div className="space-y-6">
          {/* Content Sources Table */}
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">Content Sources</h3>
              {sources.length === 0 && (
                <button
                  onClick={handleSeedSources}
                  disabled={seeding}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#22c55e] text-black text-xs font-medium hover:bg-[#16a34a] disabled:opacity-50"
                >
                  {seeding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Seed Default Sources
                </button>
              )}
            </div>
            {sources.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                No content sources configured. Click "Seed Default Sources" to add 10 golf content feeds.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#222] text-left">
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-400">Name</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-400">Feed URL</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-400">Types</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-400">Last Fetched</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-gray-400">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {sources.map((s) => (
                      <tr key={s.id} className="hover:bg-[#1a1a1a]">
                        <td className="px-4 py-2.5 text-white font-medium">{s.name}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[200px] truncate">{s.feedUrl || "—"}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1">
                            {s.contentTypes.map((ct) => (
                              <span key={ct} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CONTENT_TYPE_COLORS[ct] || "bg-gray-700/40 text-gray-300"}`}>
                                {ct}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">
                          {s.lastFetchedAt ? new Date(s.lastFetchedAt).toLocaleDateString() : "Never"}
                        </td>
                        <td className="px-4 py-2.5">
                          {s.isActive ? (
                            <span className="text-green-400 text-xs">Active</span>
                          ) : (
                            <span className="text-gray-500 text-xs">Inactive</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Scan Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleScan}
              disabled={scanning || sources.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#22c55e] text-black font-medium hover:bg-[#16a34a] disabled:opacity-50 transition-colors"
            >
              {scanning ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {scanning ? "Scanning Feeds..." : "Scan for New Content"}
            </button>
            {scanResult && !scanResult.error && (
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{scanResult.sourcesScanned} sources scanned</span>
                <span>{scanResult.itemsFound} items found</span>
                <span className="text-[#22c55e]">{scanResult.newItems} new</span>
                <span>{scanResult.duplicateSkipped} duplicates skipped</span>
              </div>
            )}
          </div>

          {/* Scan Results */}
          {scanResult && scanResult.items && (
            <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">
                  Discovered Content ({scanResult.items.filter((i: DiscoveredItem) => i.isNew).length} new)
                </h3>
                <button
                  onClick={handleImportSelected}
                  disabled={importing || selectedItems.size === 0}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#22c55e] text-black text-xs font-medium hover:bg-[#16a34a] disabled:opacity-50"
                >
                  {importing ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Import Selected ({selectedItems.size})
                </button>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {scanResult.items.map((item: DiscoveredItem) => (
                  <div
                    key={item.link}
                    className={`px-4 py-3 border-b border-[#1a1a1a] flex items-start gap-3 ${
                      !item.isNew ? "opacity-50" : ""
                    }`}
                  >
                    {item.isNew && (
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.link)}
                        onChange={() => toggleSelect(item.link)}
                        className="mt-1 accent-[#22c55e]"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CONTENT_TYPE_COLORS[item.contentType] || "bg-gray-700/40 text-gray-300"}`}>
                          {item.contentType}
                        </span>
                        <span className="text-xs text-gray-500">{item.source}</span>
                        {item.pubDate && (
                          <span className="text-xs text-gray-600">{new Date(item.pubDate).toLocaleDateString()}</span>
                        )}
                        {item.isNew ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-900/40 text-green-400">New</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-700/40 text-gray-400">Exists</span>
                        )}
                      </div>
                      <p className="text-white text-sm font-medium truncate">{item.title}</p>
                      {item.description && (
                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{item.description}</p>
                      )}
                      {item.matchedArchitects.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {item.matchedArchitects.map((name) => (
                            <span key={name} className="text-[10px] px-1.5 py-0.5 rounded bg-[#22c55e]/10 text-[#22c55e]">
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: PENDING REVIEW ─── */}
      {topTab === "pending" && (
        <PendingReviewTab
          onApprove={handleApprove}
          onReject={handleReject}
          onApproveAll={handleApproveAll}
          pendingCount={pendingCount}
          onRefresh={() => { fetchContent(); fetchPendingCount(); }}
        />
      )}

      {/* ─── TAB 4: LINK HEALTH ─── */}
      {topTab === "link-health" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCheckLinks}
              disabled={checkingLinks}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#22c55e] text-black font-medium hover:bg-[#16a34a] disabled:opacity-50 transition-colors"
            >
              {checkingLinks ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Link2 size={16} />
              )}
              {checkingLinks ? "Checking Links..." : "Run Link Check"}
            </button>
          </div>

          {linkCheckResult && (
            <div className="bg-[#111] border border-[#222] rounded-xl p-4">
              {linkCheckResult.error ? (
                <p className="text-red-400 text-sm">{linkCheckResult.error}</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-white font-medium">Link Check Complete</span>
                    <span className="text-green-400">{linkCheckResult.ok} OK</span>
                    <span className="text-red-400">{linkCheckResult.broken} Broken</span>
                    <span className="text-yellow-400">{linkCheckResult.redirect} Redirect</span>
                    <span className="text-gray-400">{linkCheckResult.total} Total</span>
                  </div>
                  {linkCheckResult.brokenItems?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 font-medium">Broken Links:</p>
                      {linkCheckResult.brokenItems.map((item: any) => (
                        <div key={item.id} className="text-xs text-red-400 flex items-center gap-2">
                          <span className="truncate max-w-md">{item.title}</span>
                          <span className="text-gray-500">{item.note}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Pending Review sub-component */
function PendingReviewTab({
  onApprove,
  onReject,
  onApproveAll,
  pendingCount,
  onRefresh,
}: {
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onApproveAll: () => void;
  pendingCount: number;
  onRefresh: () => void;
}) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content?status=pending&limit=100", {
        headers: { "x-admin-key": getAdminKey() },
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (id: number) => {
    await onApprove(id);
    fetchPending();
  };

  const handleReject = async (id: number) => {
    await onReject(id);
    fetchPending();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{items.length} items awaiting review</p>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-lg border border-[#333] text-gray-400 text-xs hover:bg-[#1a1a1a]"
          >
            <RefreshCw size={12} />
          </button>
          {items.length > 0 && (
            <button
              onClick={async () => {
                await onApproveAll();
                fetchPending();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-900/40 border border-green-800 text-green-400 text-xs font-medium hover:bg-green-900/60"
            >
              <CheckCircle2 size={12} />
              Approve All
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-gray-500" size={32} />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No pending items</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#222] text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-400">Title</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400">URL</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400">Source</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400">Type</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400">Submitted</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {items.map((item) => {
                  const TypeIcon = CONTENT_TYPE_ICONS[item.contentType] || FileText;
                  return (
                    <tr key={item.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium truncate max-w-[250px]">{item.title}</p>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 text-xs truncate max-w-[200px] inline-block hover:text-blue-400"
                        >
                          {item.url.replace(/^https?:\/\//, "").slice(0, 40)}...
                        </a>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{item.sourceName || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${CONTENT_TYPE_COLORS[item.contentType] || "bg-gray-700/40 text-gray-300"}`}>
                          <TypeIcon size={12} />
                          {item.contentType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="p-1.5 rounded bg-green-900/40 border border-green-800 text-green-400 hover:bg-green-900/60"
                            title="Approve"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            className="p-1.5 rounded bg-red-900/40 border border-red-800 text-red-400 hover:bg-red-900/60"
                            title="Reject"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
