"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Shield, Users, Trophy, BarChart3, Loader2, CheckCircle2,
  XCircle, Clock, Database, Image, FileText, MapPin, Lightbulb,
  DollarSign, AlertTriangle, RefreshCw, Search, ChevronDown,
  Eye, MessageSquare,
} from "lucide-react";

/* ─── Theme styles ─── */
const card: React.CSSProperties = {
  backgroundColor: "var(--cg-bg-card)",
  border: "1px solid var(--cg-border)",
  borderRadius: "0.75rem",
  padding: "1.5rem",
};
const cardCompact: React.CSSProperties = { ...card, padding: "1rem" };
const muted: React.CSSProperties = { color: "var(--cg-text-muted)" };
const secondary: React.CSSProperties = { color: "var(--cg-text-secondary)" };
const primary: React.CSSProperties = { color: "var(--cg-text-primary)" };

/* ─── Tabs ─── */
const TABS = ["Overview", "Verification", "Users", "Data"] as const;
type Tab = (typeof TABS)[number];

/* ─── Helpers ─── */
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: any; color: string;
}) {
  return (
    <div style={card}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider" style={muted}>{label}</span>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}

function CompletenessBar({ label, pct, icon: Icon }: { label: string; pct: number; icon: any }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0" style={muted} />
      <span className="w-24 shrink-0 text-xs" style={muted}>{label}</span>
      <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(100, pct)}%`,
            backgroundColor: pct >= 80 ? "var(--cg-accent)" : pct >= 50 ? "#eab308" : "var(--cg-error)",
          }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold tabular-nums" style={primary}>{pct}%</span>
    </div>
  );
}

function ScoreDistBar({ label, count, maxCount, color }: {
  label: string; count: number; maxCount: number; color: string;
}) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs font-medium" style={{ color }}>{label}</span>
      <div className="flex-1 h-3 rounded-full" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, minWidth: count > 0 ? 4 : 0 }} />
      </div>
      <span className="w-12 text-right text-xs font-semibold tabular-nums" style={primary}>{count.toLocaleString()}</span>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN ADMIN PAGE
   ════════════════════════════════════════════ */

export default function AdminPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  /* ── Auth: session role OR URL key ── */
  const adminKey = searchParams.get("key");
  const isAdmin =
    (session?.user as any)?.role === "admin" ||
    (adminKey != null && adminKey === process.env.NEXT_PUBLIC_ADMIN_KEY);

  // Build query string to pass admin key to API routes
  const authQs = adminKey ? `?key=${adminKey}` : "";

  /* ── State ── */
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState({ stats: true, users: false, queue: false });
  const [recomputing, setRecomputing] = useState(false);
  const [queueFilter, setQueueFilter] = useState<string>("pending");
  const [userSearch, setUserSearch] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  /* ── Fetchers ── */
  const fetchStats = useCallback(async () => {
    setLoading((p) => ({ ...p, stats: true }));
    try {
      const res = await fetch(`/api/admin/stats${authQs}`);
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading((p) => ({ ...p, stats: false }));
    }
  }, [authQs]);

  const fetchUsers = useCallback(async () => {
    setLoading((p) => ({ ...p, users: true }));
    try {
      const res = await fetch(`/api/admin/users${authQs}`);
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading((p) => ({ ...p, users: false }));
    }
  }, [authQs]);

  const fetchQueue = useCallback(async () => {
    setLoading((p) => ({ ...p, queue: true }));
    try {
      const sep = authQs ? "&" : "?";
      const res = await fetch(`/api/admin/verification${authQs}${sep}status=${queueFilter}`);
      if (res.ok) setQueue(await res.json());
    } finally {
      setLoading((p) => ({ ...p, queue: false }));
    }
  }, [authQs, queueFilter]);

  /* ── Load data on tab change ── */
  useEffect(() => {
    if (!isAdmin) return;
    fetchStats();
  }, [isAdmin, fetchStats]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "Users") fetchUsers();
    if (activeTab === "Verification") fetchQueue();
  }, [isAdmin, activeTab, fetchUsers, fetchQueue]);

  /* ── Recompute scores ── */
  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      await fetch("/api/chameleon-score", { method: "POST" });
      await fetchStats();
    } finally {
      setRecomputing(false);
    }
  };

  /* ── Approve / Reject ── */
  const handleVerificationAction = async (queueId: number, action: "approve" | "reject") => {
    setActionLoading(queueId);
    try {
      const res = await fetch(`/api/admin/verification${authQs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId, action, reviewNotes: reviewNotes[queueId] || "" }),
      });
      if (res.ok) {
        await fetchQueue();
        await fetchStats();
      }
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Not admin ── */
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Shield className="mx-auto h-16 w-16" style={muted} />
        <h1 className="mt-4 font-display text-2xl font-bold" style={primary}>Admin Dashboard</h1>
        <p className="mt-2 text-sm" style={secondary}>You need admin access to view this page.</p>
      </div>
    );
  }

  /* ── Derived ── */
  const scoreDist = stats?.scoreDistribution || {};
  const maxDistCount = Math.max(...Object.values(scoreDist).map(Number), 1);
  const completeness = stats?.dataCompleteness || {};
  const filteredUsers = userSearch
    ? users.filter((u) =>
        (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
      )
    : users;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8" style={{ backgroundColor: "var(--cg-bg-primary)", minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold" style={primary}>Admin Dashboard</h1>
          <p className="text-sm mt-1" style={muted}>golfEQUALIZER management console</p>
        </div>
        {stats?.pendingVerifications > 0 && (
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium" style={{
            backgroundColor: "rgba(234,179,8,0.15)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.3)",
          }}>
            <AlertTriangle className="h-3.5 w-3.5" />
            {stats.pendingVerifications} pending verification{stats.pendingVerifications !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="mb-8" style={{ borderBottom: "1px solid var(--cg-border)" }}>
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="shrink-0 px-4 py-3 text-sm font-medium transition-colors relative"
              style={{
                color: activeTab === tab ? "var(--cg-accent)" : "var(--cg-text-muted)",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              {tab}
              {tab === "Verification" && stats?.pendingVerifications > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[1rem] rounded-full text-[10px] font-bold px-1" style={{
                  backgroundColor: "#eab308", color: "#000",
                }}>
                  {stats.pendingVerifications}
                </span>
              )}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: "var(--cg-accent)" }} />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ────── OVERVIEW TAB ────── */}
      {activeTab === "Overview" && (
        <>
          {loading.stats ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
            </div>
          ) : stats ? (
            <div className="space-y-8">
              {/* Stat cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard label="Total Courses" value={stats.totalCourses?.toLocaleString()} icon={Database} color="var(--cg-accent)" />
                <StatCard label="Enriched" value={`${stats.enrichedPct}%`} icon={FileText} color="#60a5fa" />
                <StatCard label="Ranked Courses" value={stats.rankedCourses?.toLocaleString()} icon={Trophy} color="#f59e0b" />
                <StatCard label="Total Rankings" value={stats.totalRankings?.toLocaleString()} icon={BarChart3} color="#c084fc" />
                <StatCard label="Media Files" value={stats.mediaCoverage?.toLocaleString()} icon={Image} color="#f472b6" />
                <StatCard label="Total Users" value={stats.totalUsers?.toLocaleString()} icon={Users} color="#34d399" />
              </div>

              {/* Score Distribution */}
              <div style={card}>
                <h2 className="font-display text-lg font-semibold mb-4" style={primary}>Score Distribution</h2>
                <div className="space-y-3">
                  <ScoreDistBar label="Elite (90+)" count={scoreDist.elite || 0} maxCount={maxDistCount} color="#22c55e" />
                  <ScoreDistBar label="Excellent (80+)" count={scoreDist.excellent || 0} maxCount={maxDistCount} color="#60a5fa" />
                  <ScoreDistBar label="Strong (70+)" count={scoreDist.strong || 0} maxCount={maxDistCount} color="#c084fc" />
                  <ScoreDistBar label="Good (60+)" count={scoreDist.good || 0} maxCount={maxDistCount} color="#fbbf24" />
                  <ScoreDistBar label="Ranked" count={scoreDist.ranked || 0} maxCount={maxDistCount} color="#f97316" />
                  <ScoreDistBar label="Unranked" count={scoreDist.unranked || 0} maxCount={maxDistCount} color="var(--cg-text-muted)" />
                </div>
              </div>

              {/* Data Completeness */}
              <div style={card}>
                <h2 className="font-display text-lg font-semibold mb-4" style={primary}>Data Completeness</h2>
                <div className="space-y-3">
                  <CompletenessBar label="Descriptions" pct={completeness.descriptions || 0} icon={FileText} />
                  <CompletenessBar label="Green Fees" pct={completeness.greenFees || 0} icon={DollarSign} />
                  <CompletenessBar label="Coordinates" pct={completeness.coordinates || 0} icon={MapPin} />
                  <CompletenessBar label="Photos" pct={completeness.photos || 0} icon={Image} />
                  <CompletenessBar label="Insider Tips" pct={completeness.insiderTips || 0} icon={Lightbulb} />
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* ────── VERIFICATION TAB ────── */}
      {activeTab === "Verification" && (
        <div className="space-y-6">
          {/* Filter */}
          <div className="flex items-center gap-3">
            <span className="text-sm" style={muted}>Status:</span>
            {["pending", "approved", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setQueueFilter(s)}
                className="rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors"
                style={{
                  backgroundColor: queueFilter === s ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
                  color: queueFilter === s ? "white" : "var(--cg-text-secondary)",
                  border: `1px solid ${queueFilter === s ? "var(--cg-accent)" : "var(--cg-border)"}`,
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
            <button onClick={fetchQueue} className="ml-auto p-1.5 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: "var(--cg-bg-tertiary)", border: "none", cursor: "pointer" }}>
              <RefreshCw className="h-4 w-4" style={muted} />
            </button>
          </div>

          {loading.queue ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-16" style={card}>
              <CheckCircle2 className="mx-auto h-10 w-10 mb-3" style={{ color: "var(--cg-accent)" }} />
              <p className="text-sm" style={muted}>No {queueFilter} verifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map((item) => (
                <div key={item.queueId} style={card}>
                  <div className="flex items-start gap-4">
                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.user?.image && (
                          <img src={item.user.image} alt="" className="h-7 w-7 rounded-full" />
                        )}
                        <span className="font-medium text-sm" style={primary}>{item.user?.name || "Unknown"}</span>
                        <span className="text-xs" style={muted}>{item.user?.email}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs mt-1" style={secondary}>
                        <span>GHIN: <strong style={primary}>{item.ghinNumber || "—"}</strong></span>
                        <span>Submitted: {new Date(item.submittedAt).toLocaleDateString()}</span>
                        <span className="capitalize rounded-full px-2 py-0.5 text-[10px] font-medium" style={{
                          backgroundColor: item.status === "pending" ? "rgba(234,179,8,0.15)" : item.status === "approved" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                          color: item.status === "pending" ? "#fbbf24" : item.status === "approved" ? "#4ade80" : "#f87171",
                        }}>
                          {item.status}
                        </span>
                      </div>

                      {/* Screenshot thumbnail */}
                      {item.screenshotUrl && (
                        <div className="mt-3">
                          <a href={item.screenshotUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs hover:opacity-80" style={{ color: "var(--cg-accent)" }}>
                            <Eye className="h-3 w-3" /> View Screenshot
                          </a>
                        </div>
                      )}

                      {/* Review notes (for already reviewed) */}
                      {item.reviewNotes && item.status !== "pending" && (
                        <div className="mt-2 text-xs rounded-lg p-2" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                          <span style={muted}>Review notes:</span>{" "}
                          <span style={secondary}>{item.reviewNotes}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions (only for pending) */}
                    {item.status === "pending" && (
                      <div className="shrink-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVerificationAction(item.queueId, "approve")}
                            disabled={actionLoading === item.queueId}
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                            style={{ backgroundColor: "var(--cg-accent)", color: "white", border: "none", cursor: "pointer" }}
                          >
                            {actionLoading === item.queueId ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleVerificationAction(item.queueId, "reject")}
                            disabled={actionLoading === item.queueId}
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                            style={{ backgroundColor: "var(--cg-error)", color: "white", border: "none", cursor: "pointer" }}
                          >
                            <XCircle className="h-3 w-3" /> Reject
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 shrink-0" style={muted} />
                          <input
                            type="text"
                            placeholder="Review notes..."
                            value={reviewNotes[item.queueId] || ""}
                            onChange={(e) => setReviewNotes((prev) => ({ ...prev, [item.queueId]: e.target.value }))}
                            className="w-full rounded px-2 py-1 text-xs"
                            style={{
                              backgroundColor: "var(--cg-bg-secondary)",
                              border: "1px solid var(--cg-border)",
                              color: "var(--cg-text-primary)",
                              outline: "none",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────── USERS TAB ────── */}
      {activeTab === "Users" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={muted} />
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full rounded-lg pl-10 pr-4 py-2.5 text-sm"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
                color: "var(--cg-text-primary)",
                outline: "none",
              }}
            />
          </div>

          {loading.users ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--cg-border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={muted}>User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={muted}>Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={muted}>GHIN</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={muted}>Ratings</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={muted}>Scores</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={muted}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} style={{ borderTop: "1px solid var(--cg-border)" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.image ? (
                            <img src={u.image} alt="" className="h-8 w-8 rounded-full" />
                          ) : (
                            <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold" style={{
                              backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-muted)",
                            }}>
                              {(u.name || u.email || "?")[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium" style={primary}>{u.name || "—"}</div>
                            <div className="text-xs" style={muted}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize" style={{
                          backgroundColor: u.role === "admin" ? "rgba(239,68,68,0.15)" : "var(--cg-bg-tertiary)",
                          color: u.role === "admin" ? "#f87171" : "var(--cg-text-secondary)",
                          border: `1px solid ${u.role === "admin" ? "rgba(239,68,68,0.3)" : "var(--cg-border)"}`,
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.ghinVerified ? (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--cg-accent)" }}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                          </span>
                        ) : u.ghinNumber ? (
                          <span className="text-xs" style={{ color: "#fbbf24" }}>Pending</span>
                        ) : (
                          <span className="text-xs" style={muted}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums" style={secondary}>{u._count?.ratings ?? 0}</td>
                      <td className="px-4 py-3 text-right tabular-nums" style={secondary}>{u._count?.scores ?? 0}</td>
                      <td className="px-4 py-3 text-right text-xs" style={muted}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm" style={muted}>No users found</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ────── DATA MANAGEMENT TAB ────── */}
      {activeTab === "Data" && (
        <div className="space-y-6">
          {loading.stats ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
            </div>
          ) : stats ? (
            <>
              {/* Quick data quality stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div style={cardCompact}>
                  <div className="text-xs font-medium mb-1" style={muted}>Need Enrichment</div>
                  <div className="text-xl font-bold tabular-nums" style={{ color: "#f59e0b" }}>
                    {(stats.totalCourses - stats.enrichedCourses).toLocaleString()}
                  </div>
                </div>
                <div style={cardCompact}>
                  <div className="text-xs font-medium mb-1" style={muted}>No Photos</div>
                  <div className="text-xl font-bold tabular-nums" style={{ color: "#f472b6" }}>
                    {Math.round(stats.totalCourses * (1 - (completeness.photos || 0) / 100)).toLocaleString()}
                  </div>
                </div>
                <div style={cardCompact}>
                  <div className="text-xs font-medium mb-1" style={muted}>No Description</div>
                  <div className="text-xl font-bold tabular-nums" style={{ color: "#60a5fa" }}>
                    {Math.round(stats.totalCourses * (1 - (completeness.descriptions || 0) / 100)).toLocaleString()}
                  </div>
                </div>
                <div style={cardCompact}>
                  <div className="text-xs font-medium mb-1" style={muted}>No Coordinates</div>
                  <div className="text-xl font-bold tabular-nums" style={{ color: "#c084fc" }}>
                    {Math.round(stats.totalCourses * (1 - (completeness.coordinates || 0) / 100)).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Data completeness (detailed) */}
              <div style={card}>
                <h2 className="font-display text-lg font-semibold mb-4" style={primary}>Data Completeness</h2>
                <div className="space-y-3">
                  <CompletenessBar label="Descriptions" pct={completeness.descriptions || 0} icon={FileText} />
                  <CompletenessBar label="Green Fees" pct={completeness.greenFees || 0} icon={DollarSign} />
                  <CompletenessBar label="Coordinates" pct={completeness.coordinates || 0} icon={MapPin} />
                  <CompletenessBar label="Photos" pct={completeness.photos || 0} icon={Image} />
                  <CompletenessBar label="Insider Tips" pct={completeness.insiderTips || 0} icon={Lightbulb} />
                </div>
              </div>

              {/* Actions */}
              <div style={card}>
                <h2 className="font-display text-lg font-semibold mb-4" style={primary}>Actions</h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleRecompute}
                    disabled={recomputing}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--cg-accent)",
                      color: "white",
                      border: "none",
                      cursor: recomputing ? "not-allowed" : "pointer",
                    }}
                  >
                    {recomputing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {recomputing ? "Computing..." : "Recompute All Scores"}
                  </button>
                  <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: "var(--cg-bg-tertiary)",
                      color: "var(--cg-text-secondary)",
                      border: "1px solid var(--cg-border)",
                      cursor: "pointer",
                    }}
                  >
                    <RefreshCw className="h-4 w-4" /> Refresh Stats
                  </button>
                </div>
              </div>

              {/* Summary info */}
              <div style={card}>
                <h2 className="font-display text-lg font-semibold mb-4" style={primary}>Summary</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-xs mb-0.5" style={muted}>Total Courses</div>
                    <div className="font-bold tabular-nums" style={primary}>{stats.totalCourses?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs mb-0.5" style={muted}>Total Rankings</div>
                    <div className="font-bold tabular-nums" style={primary}>{stats.totalRankings?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs mb-0.5" style={muted}>User Ratings</div>
                    <div className="font-bold tabular-nums" style={primary}>{stats.totalRatings?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs mb-0.5" style={muted}>Posted Scores</div>
                    <div className="font-bold tabular-nums" style={primary}>{stats.totalScores?.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
