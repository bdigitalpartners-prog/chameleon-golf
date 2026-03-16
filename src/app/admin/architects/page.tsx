"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Pencil, Users, Sprout, Link2, Search, RefreshCw } from "lucide-react";

interface Architect {
  id: string;
  name: string;
  slug: string;
  bornYear: number | null;
  diedYear: number | null;
  nationality: string | null;
  era: string | null;
  totalCoursesDesigned: number | null;
  bio: string | null;
  isActive: boolean;
  _count: { courses: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const ADMIN_KEY = () => typeof window !== "undefined" ? sessionStorage.getItem("golfEQ_admin_key") || "" : "";

function fetchAdmin(url: string, opts?: RequestInit) {
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_KEY(),
      ...(opts?.headers || {}),
    },
  });
}

export default function AdminArchitectsPage() {
  const [architects, setArchitects] = useState<Architect[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [linkStatus, setLinkStatus] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [linking, setLinking] = useState(false);

  const loadArchitects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "50" });
      if (search) params.set("search", search);
      const res = await fetchAdmin(`/api/admin/architects?${params}`);
      const data = await res.json();
      setArchitects(data.architects || []);
      setPagination(data.pagination || null);
    } catch {
      console.error("Failed to load architects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadArchitects(); }, [page, search]);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedStatus(null);
    try {
      const res = await fetchAdmin("/api/admin/architects/seed", { method: "POST" });
      const data = await res.json();
      setSeedStatus(data.message || "Seeded successfully");
      loadArchitects();
    } catch {
      setSeedStatus("Failed to seed architects");
    } finally {
      setSeeding(false);
    }
  };

  const handleLinkCourses = async () => {
    setLinking(true);
    setLinkStatus(null);
    try {
      const res = await fetchAdmin("/api/admin/architects/link-courses", { method: "POST" });
      const data = await res.json();
      setLinkStatus(data.message || `Linked ${data.linked} courses`);
      loadArchitects();
    } catch {
      setLinkStatus("Failed to link courses");
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Architects</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage golf course architect profiles and bio data.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <Sprout className="h-4 w-4" />
            {seeding ? "Seeding..." : "Seed Architects"}
          </button>
          <button
            onClick={handleLinkCourses}
            disabled={linking}
            className="inline-flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-400 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
          >
            <Link2 className="h-4 w-4" />
            {linking ? "Linking..." : "Link Courses"}
          </button>
        </div>
      </div>

      {/* Status messages */}
      {seedStatus && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-2 text-sm text-green-400">
          {seedStatus}
        </div>
      )}
      {linkStatus && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-2 text-sm text-blue-400">
          {linkStatus}
        </div>
      )}

      {/* Stats */}
      {pagination && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Architects" value={pagination.total} icon={<Pencil className="h-4 w-4 text-green-500" />} />
          <StatCard
            label="With Courses"
            value={architects.filter((a) => a._count.courses > 0).length}
            icon={<Link2 className="h-4 w-4 text-blue-500" />}
          />
          <StatCard
            label="Total Linked Courses"
            value={architects.reduce((sum, a) => sum + a._count.courses, 0)}
            icon={<Users className="h-4 w-4 text-purple-500" />}
          />
          <StatCard
            label="Eras Covered"
            value={new Set(architects.map((a) => a.era).filter(Boolean)).size}
            icon={<RefreshCw className="h-4 w-4 text-amber-500" />}
          />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search architects by name, era, nationality..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full rounded-lg border border-gray-800 bg-[#111111] pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-[#111111]">
              <th className="px-4 py-3 text-left font-medium text-gray-400">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Era</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Nationality</th>
              <th className="px-4 py-3 text-center font-medium text-gray-400">Lifespan</th>
              <th className="px-4 py-3 text-center font-medium text-gray-400">Courses (DB)</th>
              <th className="px-4 py-3 text-center font-medium text-gray-400">Total Designed</th>
              <th className="px-4 py-3 text-center font-medium text-gray-400">Has Bio</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td>
              </tr>
            ) : architects.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No architects found. Use &quot;Seed Architects&quot; to populate initial data.
                </td>
              </tr>
            ) : (
              architects.map((arch) => (
                <tr key={arch.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <a
                      href={`/architects/${arch.slug}`}
                      target="_blank"
                      rel="noopener"
                      className="font-medium text-white hover:text-green-400 transition-colors"
                    >
                      {arch.name}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {arch.era ? (
                      <span className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800/50 px-2 py-0.5 text-xs text-gray-300">
                        {arch.era}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{arch.nationality || "—"}</td>
                  <td className="px-4 py-3 text-center text-gray-400">
                    {arch.bornYear ? `${arch.bornYear}–${arch.diedYear || "present"}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={arch._count.courses > 0 ? "text-green-400 font-medium" : "text-gray-600"}>
                      {arch._count.courses}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">
                    {arch.totalCoursesDesigned || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {arch.bio ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10 text-green-500 text-xs">✓</span>
                    ) : (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-gray-600 text-xs">✗</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-800 px-3 py-1 text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-30"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="rounded-lg border border-gray-800 px-3 py-1 text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-[#111111] p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
