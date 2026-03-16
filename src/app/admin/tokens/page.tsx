"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";
import nextDynamic from "next/dynamic";

/* ── Dynamic recharts imports ── */

const PieChartComponent = nextDynamic(
  () =>
    import("recharts").then((mod) => {
      const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } = mod;
      const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
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

const BarChartComponent = nextDynamic(
  () =>
    import("recharts").then((mod) => {
      const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } = mod;
      function Chart({ data }: { data: Array<{ source: string; amount: number }> }) {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="source" tick={{ fill: "#888", fontSize: 10 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
              <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }
      return Chart;
    }),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-500 text-sm">Loading chart...</div> }
);

/* ── Types ── */

interface TokenStats {
  totalInCirculation: number;
  totalEarned: number;
  totalSpent: number;
  totalExpired: number;
  earningRate30d: number;
  spendingRate30d: number;
  earningRate7d: number;
}

interface SourceBreakdown {
  source: string;
  totalAmount: number;
  count: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  source: string;
  description: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null };
}

interface EarningRule {
  id: string;
  source: string;
  action: string;
  amount: number;
  description: string | null;
  isActive: boolean;
}

/* ── Helpers ── */

const ADMIN_KEY = () => typeof window !== "undefined" ? sessionStorage.getItem("golfEQ_admin_key") || "" : "";

function fetchAdmin(url: string) {
  return fetch(url, {
    headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY() },
  });
}

/* ── Page Component ── */

export default function TokensPage() {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [sourceBreakdown, setSourceBreakdown] = useState<SourceBreakdown[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rules, setRules] = useState<EarningRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "rules">("overview");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAdmin("/api/admin/tokens").then((r) => r.json()),
      fetchAdmin("/api/admin/tokens/rules").then((r) => r.json()),
    ])
      .then(([tokenData, rulesData]) => {
        setStats(tokenData.stats);
        setSourceBreakdown(tokenData.sourceBreakdown || []);
        setTransactions(tokenData.transactions || []);
        setRules(Array.isArray(rulesData) ? rulesData : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: "overview" as const, label: "Economy Overview" },
    { key: "transactions" as const, label: "Transactions" },
    { key: "rules" as const, label: "Earning Rules" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-500">Loading token economy data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">EQ Token Economy</h1>
        <p className="mt-1 text-sm text-gray-400">Token circulation, earning/spending rates, and distribution analytics</p>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-lg bg-[#111111] p-1 w-fit border border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t.key ? "bg-green-500 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && stats && (
        <div>
          {/* Stat cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Coins className="h-5 w-5" />} label="Tokens in Circulation" value={(stats.totalInCirculation || 0).toLocaleString()} />
            <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Total Earned" value={(stats.totalEarned || 0).toLocaleString()} />
            <StatCard icon={<TrendingDown className="h-5 w-5" />} label="Total Spent" value={(stats.totalSpent || 0).toLocaleString()} />
            <StatCard icon={<Clock className="h-5 w-5" />} label="Total Expired" value={(stats.totalExpired || 0).toLocaleString()} />
          </div>

          {/* Rate cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-800 bg-[#111111] p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpRight className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-gray-500">Earning Rate (7d)</span>
              </div>
              <div className="text-lg font-bold text-green-500">+{(stats.earningRate7d || 0).toLocaleString()} EQ</div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#111111] p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpRight className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-gray-500">Earning Rate (30d)</span>
              </div>
              <div className="text-lg font-bold text-green-500">+{(stats.earningRate30d || 0).toLocaleString()} EQ</div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#111111] p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownRight className="h-4 w-4 text-red-500" />
                <span className="text-xs font-medium text-gray-500">Spending Rate (30d)</span>
              </div>
              <div className="text-lg font-bold text-red-500">-{(stats.spendingRate30d || 0).toLocaleString()} EQ</div>
            </div>
          </div>

          {/* Source breakdown charts */}
          {sourceBreakdown.length > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-800 bg-[#111111] p-6">
                <h3 className="mb-4 text-sm font-semibold text-gray-400">Tokens by Source</h3>
                <div className="h-64">
                  <BarChartComponent
                    data={sourceBreakdown.map((s) => ({
                      source: s.source.replace("_", " "),
                      amount: s.totalAmount,
                    }))}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-gray-800 bg-[#111111] p-6">
                <h3 className="mb-4 text-sm font-semibold text-gray-400">Distribution by Source</h3>
                <div className="h-64">
                  <PieChartComponent
                    data={sourceBreakdown.map((s) => ({
                      name: s.source.replace("_", " "),
                      value: s.totalAmount,
                    }))}
                  />
                </div>
              </div>
            </div>
          )}

          {sourceBreakdown.length === 0 && (
            <div className="rounded-xl border border-gray-800 bg-[#111111] p-8 text-center">
              <CircleDollarSign className="mx-auto h-12 w-12 text-gray-600" />
              <h3 className="mt-4 text-lg font-semibold text-white">No Token Activity Yet</h3>
              <p className="mt-2 text-sm text-gray-400">Token transactions will appear here once users start earning EQ tokens.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Transactions Tab ── */}
      {activeTab === "transactions" && (
        <div className="rounded-xl border border-gray-800 bg-[#111111] overflow-hidden">
          <div className="border-b border-gray-800 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-400">Recent Transactions</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">User</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Source</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-gray-800/50">
                  <td className="px-5 py-3 text-white">{t.user.name || t.user.email || "Unknown"}</td>
                  <td className={`px-5 py-3 text-right font-mono ${t.type === "EARNED" ? "text-green-500" : t.type === "SPENT" ? "text-red-500" : "text-yellow-500"}`}>
                    {t.type === "EARNED" ? "+" : "-"}{t.amount}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      t.type === "EARNED" ? "bg-green-500/10 text-green-500" :
                      t.type === "SPENT" ? "bg-red-500/10 text-red-500" :
                      "bg-yellow-500/10 text-yellow-500"
                    }`}>{t.type}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{t.source}</td>
                  <td className="px-5 py-3 text-gray-400 max-w-xs truncate">{t.description || "—"}</td>
                  <td className="px-5 py-3 text-gray-400 whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500">No transactions yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Earning Rules Tab ── */}
      {activeTab === "rules" && (
        <div className="rounded-xl border border-gray-800 bg-[#111111] overflow-hidden">
          <div className="border-b border-gray-800 px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-400">Token Earning Rules</h3>
            <SeedRulesButton onSeeded={() => {
              fetchAdmin("/api/admin/tokens/rules").then((r) => r.json()).then((data) => setRules(Array.isArray(data) ? data : []));
            }} />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Source</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Action</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">EQ Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                <th className="px-5 py-3 text-center text-xs font-medium uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-b border-gray-800/50">
                  <td className="px-5 py-3 text-white">{r.source}</td>
                  <td className="px-5 py-3 text-gray-400">{r.action.replace(/_/g, " ")}</td>
                  <td className="px-5 py-3 text-right font-mono text-green-500">+{r.amount}</td>
                  <td className="px-5 py-3 text-gray-400 max-w-xs truncate">{r.description || "—"}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${r.isActive ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"}`}>
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-500">No earning rules configured. Click &quot;Seed Default Rules&quot; to populate.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SeedRulesButton({ onSeeded }: { onSeeded: () => void }) {
  const [seeding, setSeeding] = useState(false);

  const defaultRules = [
    { source: "REVIEW", action: "submit_review", amount: 50, description: "Submit a course review" },
    { source: "CHECK_IN", action: "check_in", amount: 25, description: "Check in at a course" },
    { source: "REFERRAL", action: "refer_friend", amount: 100, description: "Refer a friend who signs up" },
    { source: "PROFILE", action: "complete_profile", amount: 75, description: "Complete your profile" },
    { source: "ACHIEVEMENT", action: "badge_basic", amount: 25, description: "Earn a basic achievement badge" },
    { source: "ACHIEVEMENT", action: "badge_rare", amount: 100, description: "Earn a rare achievement badge" },
    { source: "ACHIEVEMENT", action: "badge_epic", amount: 250, description: "Earn an epic achievement badge" },
    { source: "ACHIEVEMENT", action: "badge_legendary", amount: 500, description: "Earn a legendary achievement badge" },
  ];

  const seed = async () => {
    setSeeding(true);
    const key = typeof window !== "undefined" ? sessionStorage.getItem("golfEQ_admin_key") || "" : "";
    try {
      for (const rule of defaultRules) {
        await fetch("/api/admin/tokens/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-key": key },
          body: JSON.stringify(rule),
        });
      }
      onSeeded();
    } catch (err) {
      console.error("Failed to seed rules:", err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <button
      onClick={seed}
      disabled={seeding}
      className="rounded-md bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500 hover:bg-green-500/20 transition-colors disabled:opacity-50"
    >
      {seeding ? "Seeding..." : "Seed Default Rules"}
    </button>
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
