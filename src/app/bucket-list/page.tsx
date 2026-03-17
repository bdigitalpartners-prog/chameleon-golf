"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Heart, Filter, ArrowUpDown, Grid3x3, List, MapPin, Trophy, Star,
  CheckCircle, Clock, CalendarDays, Target, ChevronDown, X, Map as MapIcon,
  BookOpen, Users, Sparkles, BarChart3,
} from "lucide-react";
import { useBucketList, BucketListEntry } from "@/contexts/BucketListContext";
import { BucketListButton } from "@/components/bucket-list/BucketListButton";
import { useSession } from "next-auth/react";
import { showToast } from "@/components/ui/Toast";

const STATUS_OPTIONS = ["Want to Play", "Planning", "Booked", "Played"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Must-Play"];

const STATUS_COLORS: Record<string, string> = {
  "Want to Play": "#3b82f6",
  Planning: "#f59e0b",
  Booked: "#8b5cf6",
  Played: "#00E676",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "#6b7280",
  Medium: "#3b82f6",
  High: "#f59e0b",
  "Must-Play": "#ef4444",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || "var(--cg-text-muted)";
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const color = PRIORITY_COLORS[priority] || "var(--cg-text-muted)";
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ color }}
    >
      {priority}
    </span>
  );
}

interface Stats {
  total: number;
  played: number;
  percentComplete: number;
  byStatus: { status: string; count: number }[];
  byState: { state: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent?: boolean }) {
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3"
      style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
    >
      <div
        className="flex items-center justify-center h-10 w-10 rounded-lg"
        style={{ backgroundColor: accent ? "rgba(0,230,118,0.15)" : "var(--cg-bg-tertiary)" }}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: accent ? "var(--cg-accent)" : "var(--cg-text-primary)" }}>
          {value}
        </div>
        <div className="text-xs" style={{ color: "var(--cg-text-muted)" }}>{label}</div>
      </div>
    </div>
  );
}

function TemplateCard({
  name, description, icon, onAdd, loading,
}: { name: string; description: string; icon: React.ReactNode; onAdd: () => void; loading: boolean }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col"
      style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="flex items-center justify-center h-10 w-10 rounded-lg"
          style={{ backgroundColor: "rgba(0,230,118,0.1)" }}
        >
          {icon}
        </div>
        <h3 className="font-semibold text-sm" style={{ color: "var(--cg-text-primary)" }}>{name}</h3>
      </div>
      <p className="text-xs mb-4 flex-1" style={{ color: "var(--cg-text-muted)" }}>{description}</p>
      <button
        onClick={onAdd}
        disabled={loading}
        className="rounded-lg px-4 py-2 text-sm font-medium transition-all w-full"
        style={{
          backgroundColor: loading ? "var(--cg-bg-tertiary)" : "var(--cg-accent)",
          color: loading ? "var(--cg-text-muted)" : "var(--cg-text-inverse)",
        }}
      >
        {loading ? "Adding..." : "Add to My List"}
      </button>
    </div>
  );
}

export default function BucketListPage() {
  const { items, loading, refresh, updateItem, removeFromBucketList } = useBucketList();
  const { data: session } = useSession();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [filterState, setFilterState] = useState<string>("");
  const [filterAccess, setFilterAccess] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("addedAt");
  const [sortDir, setSortDir] = useState<string>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [editingItem, setEditingItem] = useState<number | string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [addingTemplate, setAddingTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "played" | "stats" | "suggestions">("list");

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/bucket-list/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, [session, items.length]);

  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    items.forEach((i) => { if (i.course?.state) states.add(i.course.state); });
    return Array.from(states).sort();
  }, [items]);

  const uniqueAccessTypes = useMemo(() => {
    const types = new Set<string>();
    items.forEach((i) => { if (i.course?.accessType) types.add(i.course.accessType); });
    return Array.from(types).sort();
  }, [items]);

  const filtered = useMemo(() => {
    let result = [...items];
    if (activeTab === "played") {
      result = result.filter((i) => i.status === "Played");
    } else if (activeTab === "list") {
      result = result.filter((i) => i.status !== "Played");
    }
    if (filterStatus) result = result.filter((i) => i.status === filterStatus);
    if (filterPriority) result = result.filter((i) => i.priority === filterPriority);
    if (filterState) result = result.filter((i) => i.course?.state === filterState);
    if (filterAccess) result = result.filter((i) => i.course?.accessType === filterAccess);

    result.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "addedAt") return dir * (new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
      if (sortBy === "priority") {
        const order = { "Must-Play": 4, High: 3, Medium: 2, Low: 1 };
        return dir * ((order[a.priority as keyof typeof order] || 0) - (order[b.priority as keyof typeof order] || 0));
      }
      if (sortBy === "alphabetical") return dir * (a.course?.courseName || "").localeCompare(b.course?.courseName || "");
      if (sortBy === "ranking") return dir * ((a.course?.bestRank || 999) - (b.course?.bestRank || 999));
      return 0;
    });

    return result;
  }, [items, filterStatus, filterPriority, filterState, filterAccess, sortBy, sortDir, activeTab]);

  const playedItems = useMemo(() => items.filter((i) => i.status === "Played"), [items]);

  const handleAddTemplate = async (templateId: string) => {
    setAddingTemplate(templateId);
    try {
      const res = await fetch("/api/bucket-list/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Added ${data.added} courses to your bucket list!`);
        refresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to add template", "error");
      }
    } catch {
      showToast("Failed to add template", "error");
    } finally {
      setAddingTemplate(null);
    }
  };

  const handleStatusChange = async (item: BucketListEntry, newStatus: string) => {
    await updateItem(item.id, { status: newStatus } as any);
    if (newStatus === "Played") {
      showToast(`Marked "${item.course?.courseName}" as played!`);
    }
  };

  const handlePriorityChange = async (item: BucketListEntry, newPriority: string) => {
    await updateItem(item.id, { priority: newPriority } as any);
  };

  const hasFilters = filterStatus || filterPriority || filterState || filterAccess;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      {/* Hero */}
      <div
        className="relative py-12 md:py-16"
        style={{
          background: "linear-gradient(135deg, rgba(0,230,118,0.08) 0%, rgba(0,0,0,0) 60%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8" style={{ color: "var(--cg-accent)", fill: "var(--cg-accent)" }} />
            <h1 className="font-display text-3xl md:text-4xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
              Bucket List
            </h1>
          </div>
          <p className="text-sm md:text-base max-w-xl" style={{ color: "var(--cg-text-muted)" }}>
            Your personal golf course bucket list. Track courses you want to play, plan your trips, and celebrate the ones you have conquered.
          </p>
          {items.length > 0 && (
            <div className="flex items-center gap-6 mt-4">
              <div className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>
                <span className="text-2xl font-bold" style={{ color: "var(--cg-accent)" }}>{items.length}</span> courses
              </div>
              <div className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>
                <span className="text-2xl font-bold" style={{ color: "var(--cg-accent)" }}>{playedItems.length}</span> played
              </div>
              {items.length > 0 && (
                <div className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>
                  <span className="text-2xl font-bold" style={{ color: "var(--cg-accent)" }}>
                    {Math.round((playedItems.length / items.length) * 100)}%
                  </span> complete
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {([
            { key: "list", label: "Bucket List", icon: <Heart className="h-4 w-4" />, count: items.length - playedItems.length },
            { key: "played", label: "Played It", icon: <CheckCircle className="h-4 w-4" />, count: playedItems.length },
            { key: "stats", label: "Stats", icon: <BarChart3 className="h-4 w-4" /> },
            { key: "suggestions", label: "Suggestions", icon: <Sparkles className="h-4 w-4" /> },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeTab === tab.key ? "rgba(0,230,118,0.15)" : "transparent",
                color: activeTab === tab.key ? "var(--cg-accent)" : "var(--cg-text-muted)",
                border: activeTab === tab.key ? "1px solid rgba(0,230,118,0.3)" : "1px solid transparent",
              }}
            >
              {tab.icon}
              {tab.label}
              {"count" in tab && tab.count !== undefined && (
                <span
                  className="text-[10px] rounded-full px-1.5 py-0.5"
                  style={{
                    backgroundColor: activeTab === tab.key ? "rgba(0,230,118,0.2)" : "var(--cg-bg-tertiary)",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Heart className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />} label="Total Courses" value={stats?.total ?? items.length} accent />
              <StatCard icon={<CheckCircle className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />} label="Played" value={stats?.played ?? playedItems.length} />
              <StatCard icon={<Target className="h-5 w-5" style={{ color: "var(--cg-text-muted)" }} />} label="% Complete" value={`${stats?.percentComplete ?? (items.length > 0 ? Math.round((playedItems.length / items.length) * 100) : 0)}%`} />
              <StatCard icon={<MapPin className="h-5 w-5" style={{ color: "var(--cg-text-muted)" }} />} label="States" value={uniqueStates.length} />
            </div>

            {stats?.byStatus && stats.byStatus.length > 0 && (
              <div className="rounded-xl p-5" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--cg-text-primary)" }}>By Status</h3>
                <div className="space-y-2">
                  {stats.byStatus.map((s) => (
                    <div key={s.status} className="flex items-center gap-3">
                      <StatusBadge status={s.status} />
                      <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.max(4, (s.count / (stats.total || 1)) * 100)}%`,
                            backgroundColor: STATUS_COLORS[s.status] || "var(--cg-accent)",
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium" style={{ color: "var(--cg-text-secondary)" }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats?.byState && stats.byState.length > 0 && (
              <div className="rounded-xl p-5" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--cg-text-primary)" }}>Courses by State/Region</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {stats.byState.slice(0, 16).map((s) => (
                    <div key={s.state} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
                      <span className="text-xs" style={{ color: "var(--cg-text-secondary)" }}>{s.state}</span>
                      <span className="text-xs font-bold" style={{ color: "var(--cg-accent)" }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === "suggestions" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--cg-text-primary)" }}>Pre-Built Bucket Lists</h2>
              <p className="text-sm mb-4" style={{ color: "var(--cg-text-muted)" }}>Clone an entire list to your personal bucket list with one click.</p>
              <div className="grid md:grid-cols-3 gap-4">
                <TemplateCard
                  name="The Ultimate Top 100"
                  description="All Golf Digest Top 100 courses in America — the gold standard of golf rankings."
                  icon={<Trophy className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />}
                  onAdd={() => handleAddTemplate("top-100")}
                  loading={addingTemplate === "top-100"}
                />
                <TemplateCard
                  name="State by State Challenge"
                  description="Best course in each state — 50 courses across 50 states."
                  icon={<MapIcon className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />}
                  onAdd={() => handleAddTemplate("state-challenge")}
                  loading={addingTemplate === "state-challenge"}
                />
                <TemplateCard
                  name="Public Bucket List"
                  description="The best public-access courses you can play without a membership."
                  icon={<Users className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />}
                  onAdd={() => handleAddTemplate("public-bucket-list")}
                  loading={addingTemplate === "public-bucket-list"}
                />
              </div>
            </div>

            {items.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--cg-text-primary)" }}>If You Like These...</h2>
                <p className="text-sm mb-4" style={{ color: "var(--cg-text-muted)" }}>
                  Based on your bucket list, you might also enjoy these courses.
                </p>
                <div
                  className="rounded-xl p-6 text-center"
                  style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
                >
                  <Sparkles className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--cg-text-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                    Personalized suggestions coming soon. Add more courses to improve recommendations.
                  </p>
                </div>
              </div>
            )}

            {!session?.user && (
              <div
                className="rounded-xl p-6 text-center"
                style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
              >
                <p className="text-sm mb-2" style={{ color: "var(--cg-text-secondary)" }}>
                  Sign in to use pre-built lists and get personalized suggestions.
                </p>
                <Link
                  href="/auth/signin"
                  className="inline-block rounded-lg px-4 py-2 text-sm font-medium"
                  style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        )}

        {/* List / Played Tabs */}
        {(activeTab === "list" || activeTab === "played") && (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: hasFilters ? "rgba(0,230,118,0.15)" : "var(--cg-bg-card)",
                    color: hasFilters ? "var(--cg-accent)" : "var(--cg-text-secondary)",
                    border: `1px solid ${hasFilters ? "rgba(0,230,118,0.3)" : "var(--cg-border)"}`,
                  }}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasFilters && (
                    <span className="text-[10px] rounded-full px-1.5 py-0.5" style={{ backgroundColor: "rgba(0,230,118,0.2)" }}>
                      {[filterStatus, filterPriority, filterState, filterAccess].filter(Boolean).length}
                    </span>
                  )}
                </button>
                {hasFilters && (
                  <button
                    onClick={() => { setFilterStatus(""); setFilterPriority(""); setFilterState(""); setFilterAccess(""); }}
                    className="text-xs"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={`${sortBy}-${sortDir}`}
                  onChange={(e) => {
                    const [s, d] = e.target.value.split("-");
                    setSortBy(s);
                    setSortDir(d);
                  }}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{
                    backgroundColor: "var(--cg-bg-card)",
                    color: "var(--cg-text-secondary)",
                    border: "1px solid var(--cg-border)",
                  }}
                >
                  <option value="addedAt-desc">Newest First</option>
                  <option value="addedAt-asc">Oldest First</option>
                  <option value="priority-desc">Highest Priority</option>
                  <option value="priority-asc">Lowest Priority</option>
                  <option value="ranking-asc">Best Ranking</option>
                  <option value="alphabetical-asc">A-Z</option>
                  <option value="alphabetical-desc">Z-A</option>
                </select>
                <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--cg-border)" }}>
                  <button
                    onClick={() => setView("grid")}
                    className="p-2 transition-all"
                    style={{
                      backgroundColor: view === "grid" ? "var(--cg-accent)" : "var(--cg-bg-card)",
                      color: view === "grid" ? "var(--cg-text-inverse)" : "var(--cg-text-muted)",
                    }}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className="p-2 transition-all"
                    style={{
                      backgroundColor: view === "list" ? "var(--cg-accent)" : "var(--cg-bg-card)",
                      color: view === "list" ? "var(--cg-text-inverse)" : "var(--cg-text-muted)",
                    }}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div
                className="rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3"
                style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
              >
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--cg-text-muted)" }}>Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--cg-bg-secondary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)" }}
                  >
                    <option value="">All</option>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--cg-text-muted)" }}>Priority</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--cg-bg-secondary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)" }}
                  >
                    <option value="">All</option>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--cg-text-muted)" }}>State/Region</label>
                  <select
                    value={filterState}
                    onChange={(e) => setFilterState(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--cg-bg-secondary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)" }}
                  >
                    <option value="">All</option>
                    {uniqueStates.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--cg-text-muted)" }}>Access Type</label>
                  <select
                    value={filterAccess}
                    onChange={(e) => setFilterAccess(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--cg-bg-secondary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)" }}
                  >
                    <option value="">All</option>
                    {uniqueAccessTypes.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Empty State */}
            {filtered.length === 0 && !loading && (
              <div
                className="rounded-xl p-12 text-center"
                style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
              >
                <Heart className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--cg-text-muted)" }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--cg-text-primary)" }}>
                  {hasFilters ? "No courses match your filters" : activeTab === "played" ? "No courses played yet" : "Your bucket list is empty"}
                </h3>
                <p className="text-sm mb-4" style={{ color: "var(--cg-text-muted)" }}>
                  {hasFilters
                    ? "Try adjusting your filters to see more results."
                    : "Start by exploring courses and tapping the heart icon to add them."}
                </p>
                {!hasFilters && (
                  <Link
                    href="/explore"
                    className="inline-block rounded-lg px-6 py-2.5 text-sm font-medium"
                    style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
                  >
                    Explore Courses
                  </Link>
                )}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl h-64 animate-pulse" style={{ backgroundColor: "var(--cg-bg-card)" }} />
                ))}
              </div>
            )}

            {/* Grid View */}
            {filtered.length > 0 && view === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl overflow-hidden transition-all group"
                    style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
                  >
                    <Link href={`/course/${item.courseId}`}>
                      <div className="relative aspect-[16/10]" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
                        {item.course?.primaryImageUrl ? (
                          <img
                            src={item.course.primaryImageUrl}
                            alt={item.course.courseName}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <MapPin className="h-8 w-8" style={{ color: "var(--cg-text-muted)" }} />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <StatusBadge status={item.status} />
                        </div>
                        <div className="absolute top-3 right-3">
                          <BucketListButton courseId={item.courseId} size="sm" />
                        </div>
                        {item.course?.chameleonScore && (
                          <div
                            className="absolute bottom-3 right-3 flex items-center justify-center h-10 w-10 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: Number(item.course.chameleonScore) >= 80 ? "var(--cg-accent)" : Number(item.course.chameleonScore) >= 50 ? "#eab308" : "var(--cg-bg-card)",
                              color: Number(item.course.chameleonScore) >= 50 ? "white" : "var(--cg-text-primary)",
                            }}
                          >
                            {Math.round(Number(item.course.chameleonScore))}
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link href={`/course/${item.courseId}`}>
                        <h3 className="font-semibold text-sm mb-1 hover:underline" style={{ color: "var(--cg-text-primary)" }}>
                          {item.course?.courseName || `Course #${item.courseId}`}
                        </h3>
                      </Link>
                      {item.course?.city && (
                        <div className="flex items-center gap-1 text-xs mb-2" style={{ color: "var(--cg-text-muted)" }}>
                          <MapPin className="h-3 w-3" />
                          {[item.course.city, item.course.state].filter(Boolean).join(", ")}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <PriorityBadge priority={item.priority} />
                        <div className="flex items-center gap-2">
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item, e.target.value)}
                            className="rounded px-2 py-1 text-[11px]"
                            style={{
                              backgroundColor: "var(--cg-bg-secondary)",
                              color: "var(--cg-text-secondary)",
                              border: "1px solid var(--cg-border)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <select
                            value={item.priority}
                            onChange={(e) => handlePriorityChange(item, e.target.value)}
                            className="rounded px-2 py-1 text-[11px]"
                            style={{
                              backgroundColor: "var(--cg-bg-secondary)",
                              color: "var(--cg-text-secondary)",
                              border: "1px solid var(--cg-border)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>
                      {item.status === "Played" && item.rating && (
                        <div className="mt-2 flex items-center gap-1">
                          <Star className="h-3.5 w-3.5" style={{ color: "#f59e0b", fill: "#f59e0b" }} />
                          <span className="text-xs font-medium" style={{ color: "var(--cg-text-secondary)" }}>
                            {item.rating}/10
                          </span>
                        </div>
                      )}
                      {item.notes && (
                        <p className="mt-2 text-xs line-clamp-2" style={{ color: "var(--cg-text-muted)" }}>
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {filtered.length > 0 && view === "list" && (
              <div className="space-y-2">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl flex items-center gap-4 p-3 transition-all"
                    style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
                  >
                    <Link href={`/course/${item.courseId}`} className="shrink-0">
                      <div className="h-16 w-24 rounded-lg overflow-hidden" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
                        {item.course?.primaryImageUrl ? (
                          <img src={item.course.primaryImageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <MapPin className="h-4 w-4" style={{ color: "var(--cg-text-muted)" }} />
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/course/${item.courseId}`}>
                        <h3 className="font-medium text-sm truncate hover:underline" style={{ color: "var(--cg-text-primary)" }}>
                          {item.course?.courseName || `Course #${item.courseId}`}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.course?.city && (
                          <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                            {[item.course.city, item.course.state].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={item.priority} />
                      <StatusBadge status={item.status} />
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item, e.target.value)}
                        className="rounded px-2 py-1 text-[11px]"
                        style={{
                          backgroundColor: "var(--cg-bg-secondary)",
                          color: "var(--cg-text-secondary)",
                          border: "1px solid var(--cg-border)",
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <BucketListButton courseId={item.courseId} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
