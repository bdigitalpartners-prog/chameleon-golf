"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Trophy,
  List,
  Database,
  Clock,
  ChevronRight,
} from "lucide-react";

interface RankingListRow {
  listId: number;
  sourceName: string;
  sourceId: number;
  listName: string;
  listType: string | null;
  region: string | null;
  yearPublished: number;
  cycleLabel: string | null;
  prestigeTier: string;
  listWeight: number;
  entriesCount: number;
}

interface SourceOption {
  sourceId: number;
  sourceName: string;
  listsCount: number;
}

interface FreshnessRow {
  sourceId: number;
  sourceName: string;
  totalLists: number;
  totalEntries: number;
  lastYear: number | null;
}

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

export default function RankingsPage() {
  const [lists, setLists] = useState<RankingListRow[]>([]);
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [freshness, setFreshness] = useState<FreshnessRow[]>([]);
  const [totalSources, setTotalSources] = useState(0);
  const [totalLists, setTotalLists] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (sourceFilter) params.set("source", sourceFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (yearFilter) params.set("year", yearFilter);

      const res = await fetch(`/api/admin/rankings?${params}`, {
        headers: { "x-admin-key": getAdminKey() },
      });
      const data = await res.json();
      setLists(data.lists || []);
      setSources(data.sources || []);
      setFreshness(data.freshness || []);
      setTotalSources(data.totalSources || 0);
      setTotalLists(data.totalLists || 0);
      setTotalEntries(data.totalEntries || 0);
    } catch {
      setLists([]);
    } finally {
      setLoading(false);
    }
  }, [search, sourceFilter, typeFilter, yearFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const uniqueTypes = [...new Set(lists.map((l) => l.listType).filter(Boolean))];
  const uniqueYears = [...new Set(lists.map((l) => l.yearPublished))].sort((a, b) => b - a);

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rankings & Data</h1>
          <p className="text-sm text-gray-400 mt-1">Manage ranking lists and track data freshness</p>
        </div>
        <Link
          href="/admin/rankings/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium hover:bg-[#16a34a] transition-colors"
        >
          <Plus size={16} />
          Add List
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Database className="h-5 w-5" />} label="Total Sources" value={totalSources.toLocaleString()} />
        <StatCard icon={<List className="h-5 w-5" />} label="Total Lists" value={totalLists.toLocaleString()} />
        <StatCard icon={<Trophy className="h-5 w-5" />} label="Total Entries" value={totalEntries.toLocaleString()} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Latest Year" value={uniqueYears[0]?.toString() || "—"} />
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
              placeholder="Search by list name..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e]"
            />
          </div>
        </form>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Source</label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
          >
            <option value="">All Sources</option>
            {sources.map((s) => (
              <option key={s.sourceId} value={s.sourceId}>{s.sourceName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
          >
            <option value="">All Types</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t!}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Year</label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
          >
            <option value="">All Years</option>
            {uniqueYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">List Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Region</th>
                <th className="px-4 py-3 font-medium">Year</th>
                <th className="px-4 py-3 font-medium text-right">Entries</th>
                <th className="px-4 py-3 font-medium">Prestige</th>
                <th className="px-4 py-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">Loading...</td>
                </tr>
              ) : lists.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">No ranking lists found</td>
                </tr>
              ) : (
                lists.map((l) => (
                  <tr
                    key={l.listId}
                    className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-gray-400">{l.sourceName}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/rankings/${l.listId}`} className="text-white font-medium hover:text-[#22c55e]">
                        {l.listName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{l.listType || "—"}</td>
                    <td className="px-4 py-3 text-gray-400">{l.region || "—"}</td>
                    <td className="px-4 py-3 text-gray-400">{l.yearPublished}</td>
                    <td className="px-4 py-3 text-right text-white font-mono">{l.entriesCount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        l.prestigeTier === "elite" ? "bg-purple-900/40 text-purple-400" :
                        l.prestigeTier === "national" ? "bg-blue-900/40 text-blue-400" :
                        "bg-gray-800 text-gray-400"
                      }`}>
                        {l.prestigeTier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/rankings/${l.listId}`}>
                        <ChevronRight size={16} className="text-gray-600" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Freshness Tracker */}
      {freshness.length > 0 && (
        <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
          <div className="border-b border-[#222] px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-400">Data Freshness by Source</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium text-right">Lists</th>
                <th className="px-4 py-3 font-medium text-right">Entries</th>
                <th className="px-4 py-3 font-medium text-right">Latest Year</th>
                <th className="px-4 py-3 font-medium">Staleness</th>
              </tr>
            </thead>
            <tbody>
              {freshness.map((f) => {
                const staleness = f.lastYear ? currentYear - f.lastYear : null;
                const color = staleness === null ? "text-gray-500" :
                  staleness <= 1 ? "text-green-500" :
                  staleness <= 3 ? "text-yellow-500" : "text-red-500";
                return (
                  <tr key={f.sourceId} className="border-b border-[#1a1a1a]">
                    <td className="px-4 py-3 text-white">{f.sourceName}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{f.totalLists}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{f.totalEntries}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{f.lastYear || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${color}`}>
                        {staleness === null ? "No data" :
                         staleness === 0 ? "Current" :
                         `${staleness} year${staleness > 1 ? "s" : ""} ago`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#111111] p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="text-green-500">{icon}</div>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}
