"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Bot,
  Shield,
  Save,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import dynamic from "next/dynamic";

const RechartsChart = dynamic(
  () =>
    import("recharts").then((mod) => {
      const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } = mod;
      function Chart({ data }: { data: Array<{ date: string; cost: number; queries: number }> }) {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v: any) => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }}
                labelStyle={{ color: "#fff" }}
                formatter={(value: any, name: any) =>
                  name === "cost" ? [`$${Number(value).toFixed(4)}`, "Cost"] : [value, "Queries"]
                }
              />
              <Bar dataKey="cost" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }
      return Chart;
    }),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-500 text-sm">Loading chart...</div> }
);

interface UsageData {
  totalQueries: number;
  totalCost: number;
  avgCostPerQuery: number;
  dailyBreakdown: Array<{ date: string; queries: number; cost: number }>;
}

interface Conversation {
  id: number;
  timestamp: string;
  ip: string;
  messagePreview: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

type TabKey = "costs" | "model" | "logs" | "prompt";

const MODELS = [
  { value: "sonar", label: "Sonar (Basic)", cost: "~$0.003/query" },
  { value: "sonar-pro", label: "Sonar Pro", cost: "~$0.017/query" },
  { value: "sonar-reasoning-pro", label: "Sonar Reasoning Pro", cost: "~$0.05/query" },
];

const ADMIN_KEY = () => typeof window !== "undefined" ? sessionStorage.getItem("golfEQ_admin_key") || "" : "";

function fetchAdmin(url: string, opts: RequestInit = {}) {
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_KEY(),
      ...(opts.headers || {}),
    },
  });
}

export default function ConciergeDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("costs");
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("month");
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convPage, setConvPage] = useState(1);
  const [convTotalPages, setConvTotalPages] = useState(1);
  const [prompt, setPrompt] = useState<string>("");
  const [promptLoaded, setPromptLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load usage data
  useEffect(() => {
    setLoading(true);
    fetchAdmin(`/api/concierge/usage?period=${period}`)
      .then((r) => r.json())
      .then(setUsageData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  // Load config
  useEffect(() => {
    fetchAdmin("/api/admin/config")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setConfig(data);
      })
      .catch(console.error);
  }, []);

  // Load conversations
  useEffect(() => {
    if (activeTab === "logs") {
      fetchAdmin(`/api/admin/concierge/conversations?page=${convPage}`)
        .then((r) => r.json())
        .then((data) => {
          setConversations(data.conversations || []);
          setConvTotalPages(data.totalPages || 1);
        })
        .catch(console.error);
    }
  }, [activeTab, convPage]);

  // Load prompt
  useEffect(() => {
    if (activeTab === "prompt" && !promptLoaded) {
      fetchAdmin("/api/admin/concierge/prompt")
        .then((r) => r.json())
        .then((data) => {
          setPrompt(data.prompt || "");
          setPromptLoaded(true);
        })
        .catch(console.error);
    }
  }, [activeTab, promptLoaded]);

  const updateConfig = async (key: string, value: string) => {
    await fetchAdmin("/api/admin/config", {
      method: "PUT",
      body: JSON.stringify({ key, value }),
    });
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const savePrompt = async () => {
    setSaving(true);
    await fetchAdmin("/api/admin/concierge/prompt", {
      method: "PUT",
      body: JSON.stringify({ prompt }),
    });
    setSaving(false);
  };

  const resetPrompt = async () => {
    setSaving(true);
    await fetchAdmin("/api/admin/concierge/prompt", {
      method: "PUT",
      body: JSON.stringify({ prompt: null }),
    });
    setPrompt("");
    setSaving(false);
  };

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "costs", label: "Cost Dashboard" },
    { key: "model", label: "Model & Budget" },
    { key: "logs", label: "Conversation Log" },
    { key: "prompt", label: "System Prompt" },
  ];

  // Compute projections
  const todaysCost = usageData?.dailyBreakdown?.find(
    (d) => d.date === new Date().toISOString().split("T")[0]
  )?.cost || 0;
  const avgDailyCost = usageData && usageData.dailyBreakdown.length > 0
    ? usageData.totalCost / usageData.dailyBreakdown.length
    : 0;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projectedMonthly = avgDailyCost * daysInMonth;

  const chartData = usageData?.dailyBreakdown
    ?.slice()
    .reverse()
    .slice(-30)
    .map((d) => ({
      date: new Date(d.date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      cost: Number(d.cost.toFixed(4)),
      queries: d.queries,
    })) || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI Concierge</h1>
        <p className="mt-1 text-sm text-gray-400">Model management, cost monitoring, and configuration</p>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-lg bg-[#111111] p-1 w-fit border border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "bg-green-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Cost Dashboard Tab */}
      {activeTab === "costs" && (
        <div>
          {/* Period selector */}
          <div className="mb-6 flex gap-1 rounded-lg bg-[#111111] p-1 w-fit border border-gray-800">
            {(["today", "week", "month", "all"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p ? "bg-green-500 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {p === "today" ? "Today" : p === "week" ? "Week" : p === "month" ? "Month" : "All"}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={<MessageCircle className="h-5 w-5" />} label="Queries" value={usageData?.totalQueries?.toLocaleString() || "0"} />
            <StatCard icon={<DollarSign className="h-5 w-5" />} label="Today's Cost" value={`$${todaysCost.toFixed(4)}`} />
            <StatCard icon={<DollarSign className="h-5 w-5" />} label="Period Cost" value={`$${(usageData?.totalCost || 0).toFixed(4)}`} />
            <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Avg/Query" value={`$${(usageData?.avgCostPerQuery || 0).toFixed(6)}`} />
            <StatCard icon={<Calendar className="h-5 w-5" />} label="Monthly Projection" value={`$${projectedMonthly.toFixed(2)}`} />
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="rounded-xl border border-gray-800 bg-[#111111] p-6">
              <h3 className="mb-4 text-sm font-semibold text-gray-400">Daily Cost (Last 30 days)</h3>
              <div className="h-64">
                <RechartsChart data={chartData} />
              </div>
            </div>
          )}

          {/* Daily Breakdown Table */}
          <div className="mt-6 rounded-xl border border-gray-800 bg-[#111111] overflow-hidden">
            <div className="border-b border-gray-800 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-400">Daily Breakdown</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">Queries</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">Cost</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">Avg/Query</th>
                </tr>
              </thead>
              <tbody>
                {usageData?.dailyBreakdown?.map((row) => (
                  <tr key={row.date} className="border-b border-gray-800/50">
                    <td className="px-5 py-3 text-white">
                      {new Date(row.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-400">{row.queries}</td>
                    <td className="px-5 py-3 text-right font-mono text-green-500">${row.cost.toFixed(4)}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-500">
                      ${row.queries > 0 ? (row.cost / row.queries).toFixed(6) : "0.000000"}
                    </td>
                  </tr>
                ))}
                {(!usageData?.dailyBreakdown || usageData.dailyBreakdown.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500">No usage data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Model & Budget Tab */}
      {activeTab === "model" && (
        <div className="space-y-6">
          {/* Model Switcher */}
          <div className="rounded-xl border border-gray-800 bg-[#111111] p-6">
            <div className="mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5 text-green-500" />
              <h3 className="text-sm font-semibold text-white">Active Model</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {MODELS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => updateConfig("concierge_active_model", m.value)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    config.concierge_active_model === m.value
                      ? "border-green-500 bg-green-500/10"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <div className="text-sm font-medium text-white">{m.label}</div>
                  <div className="mt-1 text-xs text-gray-400">{m.cost}</div>
                  {config.concierge_active_model === m.value && (
                    <div className="mt-2 text-xs font-medium text-green-500">Active</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Cap */}
          <div className="rounded-xl border border-gray-800 bg-[#111111] p-6">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <h3 className="text-sm font-semibold text-white">Budget Cap & Auto-Downgrade</h3>
            </div>

            <div className="mb-4 rounded-lg bg-gray-900 px-4 py-3 text-sm">
              <span className="text-gray-400">Budget: </span>
              <span className="font-mono text-green-500">${todaysCost.toFixed(2)}</span>
              <span className="text-gray-400"> / </span>
              <span className="font-mono text-white">${config.concierge_daily_budget_cap || "50"}.00</span>
              <span className="text-gray-400"> today — Active model: </span>
              <span className="text-white">{config.concierge_active_model || "sonar-pro"}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Daily Budget Cap ($)</label>
                <input
                  type="number"
                  value={config.concierge_daily_budget_cap || "50"}
                  onChange={(e) => updateConfig("concierge_daily_budget_cap", e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">Fallback Model</label>
                <select
                  value={config.concierge_fallback_model || "sonar"}
                  onChange={(e) => updateConfig("concierge_fallback_model", e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-green-500"
                >
                  {MODELS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() =>
                  updateConfig(
                    "concierge_auto_downgrade",
                    config.concierge_auto_downgrade === "true" ? "false" : "true"
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.concierge_auto_downgrade === "true" ? "bg-green-500" : "bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    config.concierge_auto_downgrade === "true" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm text-gray-300">Auto-downgrade when budget exceeded</span>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Log Tab */}
      {activeTab === "logs" && (
        <div className="rounded-xl border border-gray-800 bg-[#111111] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">IP</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Message</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Model</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Tokens</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Cost</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((c) => (
                <tr key={c.id} className="border-b border-gray-800/50">
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {new Date(c.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.ip}</td>
                  <td className="px-4 py-3 text-white max-w-xs truncate">{c.messagePreview}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                      {c.model}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500">
                    {c.inputTokens}/{c.outputTokens}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-green-500">${c.cost.toFixed(4)}</td>
                </tr>
              ))}
              {conversations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No conversations found</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {convTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3">
              <span className="text-xs text-gray-500">
                Page {convPage} of {convTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={convPage <= 1}
                  onClick={() => setConvPage((p) => p - 1)}
                  className="rounded-lg border border-gray-700 p-1.5 text-gray-400 hover:text-white disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={convPage >= convTotalPages}
                  onClick={() => setConvPage((p) => p + 1)}
                  className="rounded-lg border border-gray-700 p-1.5 text-gray-400 hover:text-white disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* System Prompt Tab */}
      {activeTab === "prompt" && (
        <div className="rounded-xl border border-gray-800 bg-[#111111] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">System Prompt</h3>
            <div className="flex gap-2">
              <button
                onClick={resetPrompt}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:text-white disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to Default
              </button>
              <button
                onClick={savePrompt}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={20}
            placeholder="Leave empty to use the default system prompt built into the concierge route..."
            className="w-full rounded-lg border border-gray-700 bg-gray-900 p-4 text-sm text-white font-mono outline-none focus:border-green-500 resize-y"
          />
          <p className="mt-2 text-xs text-gray-500">
            The concierge will use this prompt instead of the default. Leave empty and save to reset.
          </p>
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
