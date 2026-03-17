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

const TABS = [
  { key: "pending", label: "Pending Review" },
  { key: "approved", label: "Approved" },
  { key: "all", label: "All" },
];

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
  architects: { architect: { id: number; name: string } }[];
  courses: { course: { courseId: number; courseName: string } }[];
}

export default function AdminContentPage() {
  const [tab, setTab] = useState("pending");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkUrls, setBulkUrls] = useState("");

  // Add form state
  const [newContent, setNewContent] = useState({
    title: "",
    url: "",
    contentType: "article",
    summary: "",
    sourceName: "",
    authorName: "",
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

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleApprove = async (id: number) => {
    await fetch(`/api/admin/content`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-key": getAdminKey() },
      body: JSON.stringify({ id, isApproved: true }),
    });
    fetchContent();
  };

  const handleReject = async (id: number) => {
    await fetch(`/api/admin/content?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": getAdminKey() },
    });
    fetchContent();
  };

  const handleAdd = async () => {
    if (!newContent.title || !newContent.url) return;
    await fetch(`/api/admin/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": getAdminKey() },
      body: JSON.stringify(newContent),
    });
    setShowAddForm(false);
    setNewContent({ title: "", url: "", contentType: "article", summary: "", sourceName: "", authorName: "" });
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
                <option value="instagram">Instagram</option>
                <option value="document">Document</option>
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
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium text-sm">Save</button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-lg border border-[#333] text-gray-400 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111] border border-[#222] rounded-lg p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? "bg-[#22c55e]/10 text-[#22c55e]" : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content List */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-gray-500" size={32} />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No content found</div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {items.map((item) => {
              const TypeIcon = CONTENT_TYPE_ICONS[item.contentType] || FileText;
              return (
                <div key={item.id} className="p-4 hover:bg-[#1a1a1a] transition-colors">
                  <div className="flex items-start gap-4">
                    {item.thumbnailUrl && (
                      <img src={item.thumbnailUrl} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${CONTENT_TYPE_COLORS[item.contentType] || "bg-gray-700/40 text-gray-300"}`}>
                          <TypeIcon size={12} />
                          {item.contentType}
                        </span>
                        {item.isFeatured && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-900/40 text-yellow-400">Featured</span>
                        )}
                        {item.isApproved ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-900/40 text-green-400">Approved</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-900/40 text-orange-400">Pending</span>
                        )}
                      </div>
                      <h3 className="text-white font-medium text-sm truncate">{item.title}</h3>
                      {item.summary && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{item.summary}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {item.sourceName && <span>{item.sourceName}</span>}
                        {item.authorName && <span>by {item.authorName}</span>}
                        {item.publishedAt && <span>{new Date(item.publishedAt).toLocaleDateString()}</span>}
                        {item.architects.length > 0 && (
                          <span className="text-[#22c55e]">
                            {item.architects.map((l) => l.architect.name).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white">
                        <ExternalLink size={14} />
                      </a>
                      {!item.isApproved && (
                        <button onClick={() => handleApprove(item.id)} className="p-1.5 rounded bg-green-900/40 border border-green-800 text-green-400 hover:bg-green-900/60">
                          <Check size={14} />
                        </button>
                      )}
                      <button onClick={() => handleReject(item.id)} className="p-1.5 rounded bg-[#1a1a1a] border border-[#333] text-gray-400 hover:bg-red-900/40 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
    </div>
  );
}
