"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, ChevronLeft, ChevronRight, Trash2, ExternalLink } from "lucide-react";

interface ArchitectRow {
  id: number;
  name: string;
  slug: string;
  nationality: string | null;
  era: string | null;
  bornYear: number | null;
  diedYear: number | null;
  totalCoursesDesigned: number | null;
}

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

export default function AdminArchitectsPage() {
  const [architects, setArchitects] = useState<ArchitectRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchArchitects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/architects?${params}`, {
        headers: { "x-admin-key": getAdminKey() },
      });
      const data = await res.json();
      setArchitects(data.architects || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setArchitects([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchArchitects();
  }, [fetchArchitects]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchArchitects();
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete architect "${name}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/admin/architects/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": getAdminKey() },
      });
      fetchArchitects();
    } catch {
      alert("Failed to delete architect");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Architect Management</h1>
          <p className="text-sm text-gray-400 mt-1">{total.toLocaleString()} architects total</p>
        </div>
        <Link
          href="/admin/architects/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium hover:bg-[#16a34a] transition-colors"
        >
          <Plus size={16} />
          Add Architect
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="max-w-md">
        <label className="block text-xs text-gray-500 mb-1">Search</label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by architect name..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e]"
          />
        </div>
      </form>

      {/* Table */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Nationality</th>
                <th className="px-4 py-3 font-medium">Era</th>
                <th className="px-4 py-3 font-medium">Years</th>
                <th className="px-4 py-3 font-medium text-right">Total Courses</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : architects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No architects found
                  </td>
                </tr>
              ) : (
                architects.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/architects/${a.id}`}
                        className="text-white font-medium hover:text-[#22c55e]"
                      >
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{a.nationality || "—"}</td>
                    <td className="px-4 py-3">
                      {a.era ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-900/40 text-green-400">
                          {a.era}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {a.bornYear
                        ? `${a.bornYear}${a.diedYear ? `–${a.diedYear}` : "–present"}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 font-mono">
                      {a.totalCoursesDesigned ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/architects/${a.slug}`}
                          className="p-1.5 rounded bg-[#1a1a1a] border border-[#333] text-gray-400 hover:bg-[#222] hover:text-white"
                          title="View public profile"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(a.id, a.name)}
                          className="p-1.5 rounded bg-[#1a1a1a] border border-[#333] text-gray-400 hover:bg-red-900/40 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
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
              Page {page} of {totalPages} ({total.toLocaleString()} architects)
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
