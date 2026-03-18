"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Search, ChevronLeft, ChevronRight, ArrowUpDown,
  Download, Shield, Ban, CheckCircle, UserX, BarChart3,
  TrendingUp, UserPlus, Activity,
} from "lucide-react";
import Link from "next/link";

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  activityCount: number;
  _count: { ratings: number; scores: number; wishlists: number; circleMemberships: number };
}

interface Analytics {
  totalUsers: number;
  newUsers7d: number;
  newUsers30d: number;
  activeUsers7d: number;
  activeUsers30d: number;
  roleBreakdown: { role: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  signupTrend: { date: string; count: number }[];
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

const statusColors: Record<string, string> = {
  active: "bg-green-900/40 text-green-400",
  suspended: "bg-yellow-900/40 text-yellow-400",
  banned: "bg-red-900/40 text-red-400",
  deleted: "bg-gray-800 text-gray-500",
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-900/40 text-purple-400",
  moderator: "bg-blue-900/40 text-blue-400",
  user: "bg-gray-800 text-gray-400",
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [bulkRole, setBulkRole] = useState("user");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [tab, setTab] = useState<"directory" | "activity">("directory");
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
        sortBy,
        sortOrder,
      });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetchAdmin(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, sortBy, sortOrder]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetchAdmin("/api/admin/users/analytics");
      const data = await res.json();
      if (!data.error) setAnalytics(data);
    } catch {
      // Silently fail analytics
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === users.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(users.map((u) => u.id)));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selected.size === 0) return;
    const userIds = Array.from(selected);
    const adminEmail = typeof window !== "undefined" ? sessionStorage.getItem("golfEQ_admin_email") || "admin" : "admin";

    try {
      const body: any = { userIds, action: bulkAction, adminEmail };
      if (bulkAction === "changeRole") body.value = bulkRole;

      const res = await fetchAdmin("/api/admin/users", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSelected(new Set());
        setBulkAction("");
        fetchUsers();
      } else {
        setError(data.error || "Bulk action failed");
      }
    } catch {
      setError("Failed to perform bulk action");
    }
  };

  const handleExport = async () => {
    const params = new URLSearchParams({ export: "csv" });
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetchAdmin(`/api/admin/users?${params}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const initials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  // Compute max value for sparkline
  const maxSignup = analytics ? Math.max(...analytics.signupTrend.map((d) => d.count), 1) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="h-7 w-7 text-green-500" />
            User Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total} total users</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#333] text-gray-400 hover:text-white hover:border-[#555] text-sm"
          >
            <BarChart3 size={14} />
            {showAnalytics ? "Hide" : "Show"} Analytics
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#333] text-gray-400 hover:text-white hover:border-[#555] text-sm"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      {showAnalytics && analytics && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#222] bg-[#111] p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                <Users size={12} /> TOTAL USERS
              </div>
              <p className="text-2xl font-bold text-white">{analytics.totalUsers.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-[#222] bg-[#111] p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                <UserPlus size={12} /> NEW (7D / 30D)
              </div>
              <p className="text-2xl font-bold text-white">
                {analytics.newUsers7d} <span className="text-sm text-gray-500">/ {analytics.newUsers30d}</span>
              </p>
            </div>
            <div className="rounded-xl border border-[#222] bg-[#111] p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                <Activity size={12} /> ACTIVE (7D / 30D)
              </div>
              <p className="text-2xl font-bold text-white">
                {analytics.activeUsers7d} <span className="text-sm text-gray-500">/ {analytics.activeUsers30d}</span>
              </p>
            </div>
            <div className="rounded-xl border border-[#222] bg-[#111] p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
                <TrendingUp size={12} /> SIGNUP TREND (30D)
              </div>
              <div className="flex items-end gap-px h-8 mt-1">
                {analytics.signupTrend.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-green-500/60 rounded-t-sm min-h-[2px]"
                    style={{ height: `${Math.max(8, (d.count / maxSignup) * 100)}%` }}
                    title={`${d.date}: ${d.count} signups`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#222] bg-[#111] p-4">
              <h4 className="text-xs font-medium text-gray-500 mb-3">BY ROLE</h4>
              <div className="space-y-2">
                {analytics.roleBreakdown.map((r) => (
                  <div key={r.role} className="flex items-center justify-between text-sm">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${roleColors[r.role] || "bg-gray-800 text-gray-400"}`}>
                      {r.role}
                    </span>
                    <span className="text-white font-mono">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-[#222] bg-[#111] p-4">
              <h4 className="text-xs font-medium text-gray-500 mb-3">BY STATUS</h4>
              <div className="space-y-2">
                {analytics.statusBreakdown.map((s) => (
                  <div key={s.status} className="flex items-center justify-between text-sm">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[s.status] || "bg-gray-800 text-gray-400"}`}>
                      {s.status}
                    </span>
                    <span className="text-white font-mono">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#222] flex gap-0">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === "directory" ? "border-[#22c55e] text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}
          onClick={() => setTab("directory")}
        >
          User Directory
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === "activity" ? "border-[#22c55e] text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}
          onClick={() => setTab("activity")}
        >
          Activity Log
        </button>
      </div>

      {tab === "directory" ? (
        <>
          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 rounded-lg bg-[#1a1a1a] border border-[#333] px-4 py-3">
              <span className="text-sm text-gray-400">{selected.size} selected</span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-1.5 rounded bg-[#111] border border-[#333] text-white text-sm"
              >
                <option value="">Choose action...</option>
                <option value="changeRole">Change Role</option>
                <option value="suspend">Suspend</option>
                <option value="activate">Activate</option>
              </select>
              {bulkAction === "changeRole" && (
                <select
                  value={bulkRole}
                  onChange={(e) => setBulkRole(e.target.value)}
                  className="px-3 py-1.5 rounded bg-[#111] border border-[#333] text-white text-sm"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              )}
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="px-4 py-1.5 rounded-lg bg-[#22c55e] text-black font-medium text-sm hover:bg-[#16a34a] disabled:opacity-50"
              >
                Apply
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white"
              >
                Clear
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Users Table */}
          <div className="rounded-xl border border-[#222] bg-[#111] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#222] text-gray-400 text-left">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && selected.size === users.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-600 bg-[#1a1a1a]"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button onClick={() => handleSort("name")} className="flex items-center gap-1 hover:text-white">
                      User <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button onClick={() => handleSort("role")} className="flex items-center gap-1 hover:text-white">
                      Role <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button onClick={() => handleSort("status")} className="flex items-center gap-1 hover:text-white">
                      Status <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button onClick={() => handleSort("createdAt")} className="flex items-center gap-1 hover:text-white">
                      Signup <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Activity</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">No users found</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          className="rounded border-gray-600 bg-[#1a1a1a]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
                          {user.image ? (
                            <img src={user.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold text-gray-400">
                              {initials(user.name)}
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium">{user.name || "Unknown"}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${roleColors[user.role] || "bg-gray-800 text-gray-400"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[user.status] || "bg-gray-800 text-gray-400"}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{fmtDate(user.createdAt)}</td>
                      <td className="px-4 py-3 text-right text-gray-400 font-mono">{user.activityCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages} ({total} users)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-[#333] text-gray-400 hover:text-white hover:border-[#555] disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const p = start + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium ${
                        p === page
                          ? "bg-[#22c55e] text-black"
                          : "border border-[#333] text-gray-400 hover:text-white hover:border-[#555]"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-[#333] text-gray-400 hover:text-white hover:border-[#555] disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <ActivityLogTab />
      )}
    </div>
  );
}

/* ===== Activity Log Tab ===== */
function ActivityLogTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (search) params.set("search", search);
      if (actionFilter) params.set("action", actionFilter);

      const res = await fetchAdmin(`/api/admin/users/activity-log?${params}`);
      const data = await res.json();
      if (!data.error) {
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const actionLabels: Record<string, { label: string; color: string }> = {
    role_change: { label: "Role Change", color: "bg-blue-900/40 text-blue-400" },
    suspend: { label: "Suspended", color: "bg-yellow-900/40 text-yellow-400" },
    ban: { label: "Banned", color: "bg-red-900/40 text-red-400" },
    reactivate: { label: "Reactivated", color: "bg-green-900/40 text-green-400" },
    soft_delete: { label: "Deleted", color: "bg-gray-800 text-gray-500" },
    ghin_verify: { label: "GHIN Verified", color: "bg-green-900/40 text-green-400" },
    ghin_unverify: { label: "GHIN Unverified", color: "bg-yellow-900/40 text-yellow-400" },
    suspended: { label: "Suspended", color: "bg-yellow-900/40 text-yellow-400" },
    banned: { label: "Banned", color: "bg-red-900/40 text-red-400" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
        >
          <option value="">All Actions</option>
          <option value="role_change">Role Change</option>
          <option value="suspend">Suspend</option>
          <option value="ban">Ban</option>
          <option value="reactivate">Reactivate</option>
          <option value="soft_delete">Delete</option>
          <option value="ghin_verify">GHIN Verify</option>
        </select>
      </div>

      <div className="rounded-xl border border-[#222] bg-[#111] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#222] text-gray-400 text-left">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Target User</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No activity logs</td></tr>
            ) : (
              logs.map((log) => {
                const al = actionLabels[log.action] || { label: log.action, color: "bg-gray-800 text-gray-400" };
                return (
                  <tr key={log.id} className="border-b border-[#1a1a1a]">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDate(log.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-300">{log.adminEmail}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${al.color}`}>
                        {al.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${log.targetUserId}`} className="text-green-400 hover:underline">
                        {log.targetUserName || log.targetUserEmail || log.targetUserId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {log.previousValue && log.newValue
                        ? `${log.previousValue} → ${log.newValue}`
                        : log.reason || log.details || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-[#333] text-gray-400 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-[#333] text-gray-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
