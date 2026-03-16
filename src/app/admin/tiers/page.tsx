"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
  Layers,
  Users,
  Edit2,
  Save,
  X,
} from "lucide-react";
import nextDynamic from "next/dynamic";

/* ── Dynamic recharts imports ── */

const BarChartComponent = nextDynamic(
  () =>
    import("recharts").then((mod) => {
      const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } = mod;
      function Chart({ data }: { data: Array<{ name: string; count: number }> }) {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
              <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }
      return Chart;
    }),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-500 text-sm">Loading chart...</div> }
);

const PieChartComponent = nextDynamic(
  () =>
    import("recharts").then((mod) => {
      const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } = mod;
      const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
      function Chart({ data }: { data: Array<{ name: string; value: number }> }) {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: any) => `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        );
      }
      return Chart;
    }),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-500 text-sm">Loading chart...</div> }
);

/* ── Types ── */

interface TierConfig {
  id: string;
  name: string;
  threshold: number;
  sortOrder: number;
  features: string[];
  color: string | null;
  icon: string | null;
  isActive: boolean;
}

interface TierStats {
  totalUsers: number;
  usersWithTokens: number;
  usersWithoutTokens: number;
}

/* ── Helpers ── */

const ADMIN_KEY = () => typeof window !== "undefined" ? sessionStorage.getItem("golfEQ_admin_key") || "" : "";

function fetchAdmin(url: string) {
  return fetch(url, {
    headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY() },
  });
}

const DEFAULT_TIERS = [
  { name: "Birdie", threshold: 0, sortOrder: 1, features: ["Basic access", "Course search", "Community forums"], color: "#22c55e", icon: "circle" },
  { name: "Eagle", threshold: 500, sortOrder: 2, features: ["Priority concierge", "Advanced filters", "Trip planning"], color: "#3b82f6", icon: "award" },
  { name: "Albatross", threshold: 2500, sortOrder: 3, features: ["Insider tips", "Course intelligence", "Private circles"], color: "#a855f7", icon: "star" },
  { name: "Condor", threshold: 10000, sortOrder: 4, features: ["The Vault access", "Personal caddie AI", "VIP events", "All features"], color: "#f59e0b", icon: "crown" },
];

/* ── Page Component ── */

export default function TiersPage() {
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<TierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TierConfig>>({});
  const [seeding, setSeeding] = useState(false);

  const loadData = () => {
    setLoading(true);
    fetchAdmin("/api/admin/tiers")
      .then((r) => r.json())
      .then((data) => {
        setTiers(data.tiers || []);
        setDistribution(data.distribution || {});
        setStats(data.stats || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSeedTiers = async () => {
    setSeeding(true);
    try {
      for (const tier of DEFAULT_TIERS) {
        await fetch("/api/admin/tiers", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY() },
          body: JSON.stringify(tier),
        });
      }
      loadData();
    } catch (err) {
      console.error("Failed to seed tiers:", err);
    } finally {
      setSeeding(false);
    }
  };

  const handleEditSave = async () => {
    if (!editingTier) return;
    try {
      await fetch("/api/admin/tiers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY() },
        body: JSON.stringify({ id: editingTier, ...editForm }),
      });
      setEditingTier(null);
      setEditForm({});
      loadData();
    } catch (err) {
      console.error("Failed to update tier:", err);
    }
  };

  const distributionData = Object.entries(distribution)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => ({ name, count }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-500">Loading tier data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Membership Tiers</h1>
        <p className="mt-1 text-sm text-gray-400">Tier configuration and user distribution (not enforced — infrastructure only)</p>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={<Users className="h-5 w-5" />} label="Total Users" value={stats.totalUsers.toLocaleString()} />
          <StatCard icon={<Layers className="h-5 w-5" />} label="Users with Tokens" value={stats.usersWithTokens.toLocaleString()} />
          <StatCard icon={<Users className="h-5 w-5" />} label="Users without Tokens" value={stats.usersWithoutTokens.toLocaleString()} />
        </div>
      )}

      {/* Distribution visualizations */}
      {distributionData.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-800 bg-[#111111] p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-400">User Distribution by Tier</h3>
            <div className="h-64">
              <BarChartComponent data={distributionData} />
            </div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-[#111111] p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-400">Tier Breakdown</h3>
            <div className="h-64">
              <PieChartComponent data={distributionData.map((d) => ({ name: d.name, value: d.count }))} />
            </div>
          </div>
        </div>
      )}

      {/* Tier config table */}
      <div className="rounded-xl border border-gray-800 bg-[#111111] overflow-hidden">
        <div className="border-b border-gray-800 px-5 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-400">Tier Configuration</h3>
          {tiers.length === 0 && (
            <button
              onClick={handleSeedTiers}
              disabled={seeding}
              className="rounded-md bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500 hover:bg-green-500/20 transition-colors disabled:opacity-50"
            >
              {seeding ? "Seeding..." : "Seed Default Tiers"}
            </button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Tier</th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">EQ Threshold</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Features</th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">Users</th>
              <th className="px-5 py-3 text-center text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-5 py-3 text-center text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => (
              <tr key={tier.id} className="border-b border-gray-800/50">
                {editingTier === tier.id ? (
                  <>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {tier.color && <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tier.color }} />}
                        <span className="font-medium text-white">{tier.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <input
                        type="number"
                        value={editForm.threshold ?? tier.threshold}
                        onChange={(e) => setEditForm({ ...editForm, threshold: parseInt(e.target.value) || 0 })}
                        className="w-24 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-right text-sm text-white"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={(editForm.features ?? tier.features)?.join(", ") || ""}
                        onChange={(e) => setEditForm({ ...editForm, features: e.target.value.split(",").map((f) => f.trim()) })}
                        className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-white"
                        placeholder="Comma-separated features"
                      />
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-400">{distribution[tier.name] || 0}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${tier.isActive ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"}`}>
                        {tier.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={handleEditSave} className="rounded p-1 text-green-500 hover:bg-green-500/10">
                          <Save className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setEditingTier(null); setEditForm({}); }} className="rounded p-1 text-gray-400 hover:bg-gray-800">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {tier.color && <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tier.color }} />}
                        <span className="font-medium text-white">{tier.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-green-500">{tier.threshold.toLocaleString()} EQ</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(tier.features) ? tier.features : []).map((f, i) => (
                          <span key={i} className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300">{f}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-400">{distribution[tier.name] || 0}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${tier.isActive ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"}`}>
                        {tier.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => { setEditingTier(tier.id); setEditForm({}); }}
                        className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {tiers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                  No tiers configured. Click &quot;Seed Default Tiers&quot; to set up Birdie, Eagle, Albatross, and Condor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Info banner */}
      <div className="mt-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
        <p className="text-sm text-yellow-500/80">
          <strong>Note:</strong> Tiers are not enforced on any features. Everything remains free. This is infrastructure for future monetization only.
        </p>
      </div>
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
      <div className="text-lg font-bold text-white truncate">{value}</div>
    </div>
  );
}
