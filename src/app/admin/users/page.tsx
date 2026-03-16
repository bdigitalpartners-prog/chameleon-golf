"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  UserCheck,
  Shield,
  Clock,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  ghinNumber: string | null;
  handicapIndex: number | null;
  ghinVerified: boolean;
  isActive: boolean;
  createdAt: string;
  ratingsCount: number;
}

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [ghinFilter, setGhinFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    ghinVerified: 0,
    usersThisMonth: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (ghinFilter) params.set("ghinStatus", ghinFilter);
      params.set("page", String(page));

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { "x-admin-key": getAdminKey() },
      });
      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      if (data.stats) setStats(data.stats);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, ghinFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage users, roles, and GHIN verification</p>
        </div>
        <Link
          href="/admin/users/verification"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#333] text-gray-400 hover:text-white hover:bg-[#1a1a1a] text-sm"
        >
          <Shield size={16} />
          GHIN Verification Queue
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Users" value={stats.totalUsers.toLocaleString()} />
        <StatCard icon={<UserCheck className="h-5 w-5" />} label="Active Users" value={stats.activeUsers.toLocaleString()} />
        <StatCard icon={<Shield className="h-5 w-5" />} label="GHIN Verified" value={stats.ghinVerified.toLocaleString()} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="New This Month" value={stats.usersThisMonth.toLocaleString()} />
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
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e]"
            />
          </div>
        </form>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Role</label>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">GHIN Status</label>
          <select
            value={ghinFilter}
            onChange={(e) => { setGhinFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
          >
            <option value="">All</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">GHIN #</th>
                <th className="px-4 py-3 font-medium text-right">Handicap</th>
                <th className="px-4 py-3 font-medium">GHIN Verified</th>
                <th className="px-4 py-3 font-medium text-right">Ratings</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${u.id}`} className="text-white font-medium hover:text-[#22c55e]">
                        {u.name || "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{u.email || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        u.role === "admin" ? "bg-purple-900/40 text-purple-400" :
                        u.role === "moderator" ? "bg-blue-900/40 text-blue-400" :
                        "bg-gray-800 text-gray-400"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono">{u.ghinNumber || "—"}</td>
                    <td className="px-4 py-3 text-right text-white font-mono">
                      {u.handicapIndex != null ? u.handicapIndex.toFixed(1) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={u.ghinVerified ? "text-green-500" : "text-gray-500"}>
                        {u.ghinVerified ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-mono">{u.ratingsCount}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={u.isActive ? "text-green-500" : "text-red-400"}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${u.id}`}>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-[#333] text-gray-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-[#333] text-gray-400 hover:text-white disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
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
