"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Bot,
  Shield,
  FileText,
  Loader2,
  Save,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ADMIN_KEY_STORAGE = "golfEQ_admin_key";

const MODELS = [
  { value: "sonar", label: "Sonar (Basic)", cost: 0.003 },
  { value: "sonar-pro", label: "Sonar Pro (Default)", cost: 0.017 },
  { value: "sonar-reasoning-pro", label: "Sonar Reasoning Pro (Premium)", cost: 0.05 },
];

const DEFAULT_SYSTEM_PROMPT = `You are the GolfEQ Concierge, an AI-powered golf course expert for the CourseFACTOR ranking platform. You have deep knowledge of over 1,500 ranked golf courses worldwide.

Your expertise includes:
- CourseFACTOR rankings, which aggregate data from Golf Digest, Golfweek, GOLF Magazine, and Top100GolfCourses
- Green fees, tee times, and pricing details
- Course architects (original and renovation), design philosophy, and course history
- Golf trip planning: itineraries, best times to visit, nearby courses to combine
- Course comparisons: helping golfers choose between similar courses
- Lodging recommendations near golf courses, including on-site resorts and stay-and-play packages
- Dining recommendations near courses
- Nearby airports and travel logistics
- Course conditions, walking policies, caddie availability, and dress codes
- Championship history and famous moments at courses

Personality: You are knowledgeable, warm, and enthusiastic — like a well-connected golf insider who genuinely loves helping people discover great courses. You speak with authority but remain approachable. You occasionally reference CourseFACTOR data and rankings naturally in conversation.

Guidelines:
- When discussing specific courses, suggest the user explore that course's page on CourseFACTOR/GolfEQ for detailed rankings, photos, and reviews
- Provide specific, actionable advice rather than generic tips
- When comparing courses, reference their CourseFACTOR scores and what makes each unique
- For trip planning, consider logistics like airports, drive times, and course proximity
- Keep responses conversational but informative — aim for helpful depth without overwhelming
- If you don't know something specific, say so honestly rather than guessing
- Use the CourseFACTOR scoring system which rates courses on: Conditioning, Layout/Design, Pace of Play, Aesthetics, Challenge, Value, Amenities, Walkability, and Service`;

interface UsageData {
  totalQueries: number;
  totalCost: number;
  avgCostPerQuery: number;
  dailyBreakdown: Array<{ date: string; queries: number; cost: number }>;
}

interface Conversation {
  id: number;
  createdAt: string;
  userIp: string;
  messagePreview: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

export default function AdminConciergePage() {
  const [activeTab, setActiveTab] = useState<"costs" | "model" | "logs" | "prompt">("costs");
  const [adminKey, setAdminKey] = useState("");
  const [keyReady, setKeyReady] = useState(false);

  // Cost dashboard state
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("month");
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  // Config state
  const [config, setConfig] = useState<Record<string, string>>({});
  const [configLoading, setConfigLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Conversation log state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convPage, setConvPage] = useState(1);
  const [convTotal, setConvTotal] = useState(0);
  const [convTotalPages, setConvTotalPages] = useState(1);
  const [convLoading, setConvLoading] = useState(false);

  // Prompt state
  const [systemPrompt, setSystemPrompt] = useState("");
  const [promptIsCustom, setPromptIsCustom] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptSaving, setPromptSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(ADMIN_KEY_STORAGE);
    if (saved) {
      setAdminKey(saved);
      setKeyReady(true);
    } else {
      setKeyReady(true);
    }
  }, []);

  const headers = useCallback(
    () => ({ "x-admin-key": adminKey, "Content-Type": "application/json" }),
    [adminKey]
  );

  // Fetch config
  useEffect(() => {
    if (!adminKey) { setConfigLoading(false); return; }
    setConfigLoading(true);
    fetch("/api/admin/config", { headers: { "x-admin-key": adminKey } })
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setConfig(data);
      })
      .catch(console.error)
      .finally(() => setConfigLoading(false));
  }, [adminKey]);

  // Fetch usage data
  useEffect(() => {
    if (!adminKey || activeTab !== "costs") return;
    setUsageLoading(true);
    fetch(`/api/concierge/usage?period=${period}`, {
      headers: { "x-admin-key": adminKey },
    })
      .then((r) => r.json())
      .then(setUsageData)
      .catch(console.error)
      .finally(() => setUsageLoading(false));
  }, [adminKey, period, activeTab]);

  // Fetch conversations
  useEffect(() => {
    if (!adminKey || activeTab !== "logs") return;
    setConvLoading(true);
    fetch(`/api/admin/concierge/conversations?page=${convPage}`, {
      headers: { "x-admin-key": adminKey },
    })
      .then((r) => r.json())
      .then((data) => {
        setConversations(data.conversations || []);
        setConvTotal(data.total || 0);
        setConvTotalPages(data.totalPages || 1);
      })
      .catch(console.error)
      .finally(() => setConvLoading(false));
  }, [adminKey, convPage, activeTab]);

  // Fetch prompt
  useEffect(() => {
    if (!adminKey || activeTab !== "prompt") return;
    setPromptLoading(true);
    fetch("/api/admin/concierge/prompt", { headers: { "x-admin-key": adminKey } })
      .then((r) => r.json())
      .then((data) => {
        setSystemPrompt(data.prompt || DEFAULT_SYSTEM_PROMPT);
        setPromptIsCustom(data.isCustom);
      })
      .catch(console.error)
      .finally(() => setPromptLoading(false));
  }, [adminKey, activeTab]);

  const updateConfig = async (key: string, value: string) => {
    setSaving(true);
    try {
      await fetch("/api/admin/config", {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ key, value }),
      });
      setConfig((prev) => ({ ...prev, [key]: value }));
    } catch (err) {
      console.error("Failed to update config:", err);
    } finally {
      setSaving(false);
    }
  };

  const savePrompt = async () => {
    setPromptSaving(true);
    try {
      await fetch("/api/admin/concierge/prompt", {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ prompt: systemPrompt }),
      });
      setPromptIsCustom(true);
    } catch (err) {
      console.error("Failed to save prompt:", err);
    } finally {
      setPromptSaving(false);
    }
  };

  const resetPrompt = async () => {
    setPromptSaving(true);
    try {
      await fetch("/api/admin/concierge/prompt", {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ prompt: null }),
      });
      setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
      setPromptIsCustom(false);
    } catch (err) {
      console.error("Failed to reset prompt:", err);
    } finally {
      setPromptSaving(false);
    }
  };

  if (!keyReady) return null;

  const activeModel = config.concierge_active_model || "sonar-pro";
  const budgetCap = parseFloat(config.concierge_daily_budget_cap || "50");
  const fallbackModel = config.concierge_fallback_model || "sonar";
  const autoDowngrade = config.concierge_auto_downgrade === "true";
  const todayCost = usageData?.dailyBreakdown?.[0]?.cost || 0;
  const activeModelInfo = MODELS.find((m) => m.value === activeModel);

  // Cost projection
  const monthlyData = usageData?.dailyBreakdown || [];
  const avgDailyCost =
    monthlyData.length > 0
      ? monthlyData.reduce((s, d) => s + d.cost, 0) / monthlyData.length
      : 0;
  const projectedMonthlyCost = avgDailyCost * 30;

  // Chart data (reverse to show chronological order)
  const chartData = [...(usageData?.dailyBreakdown || [])]
    .reverse()
    .slice(-30)
    .map((d) => ({
      date: new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      cost: d.cost,
      queries: d.queries,
    }));

  const tabs = [
    { key: "costs", label: "Cost Dashboard", icon: DollarSign },
    { key: "model", label: "Model & Budget", icon: Bot },
    { key: "logs", label: "Conversation Log", icon: FileText },
    { key: "prompt", label: "System Prompt", icon: MessageCircle },
  ] as const;

  return (
    <div className="max-w-7xl">
      <h1 className="text-2xl font-bold text-white mb-6">AI Concierge</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg p-1 mb-6 w-fit" style={{ backgroundColor: "#1a1a1a" }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeTab === key ? "#22c55e" : "transparent",
              color: activeTab === key ? "#000" : "#9ca3af",
            }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ===== Cost Dashboard Tab ===== */}
      {activeTab === "costs" && (
        <div>
          {/* Period selector */}
          <div className="flex gap-1 rounded-lg p-1 mb-6 w-fit" style={{ backgroundColor: "#1a1a1a" }}>
            {(["today", "week", "month", "all"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: period === p ? "rgba(34,197,94,0.2)" : "transparent",
                  color: period === p ? "#22c55e" : "#9ca3af",
                }}
              >
                {p === "today" ? "Today" : p === "week" ? "Week" : p === "month" ? "Month" : "All"}
              </button>
            ))}
          </div>

          {usageLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : usageData ? (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
                <CostStatCard icon={<MessageCircle className="h-5 w-5" />} label="Total Queries" value={usageData.totalQueries.toLocaleString()} />
                <CostStatCard icon={<DollarSign className="h-5 w-5" />} label="Total Cost" value={`$${usageData.totalCost.toFixed(4)}`} />
                <CostStatCard icon={<DollarSign className="h-5 w-5" />} label="Today's Cost" value={`$${todayCost.toFixed(4)}`} />
                <CostStatCard icon={<TrendingUp className="h-5 w-5" />} label="Avg / Query" value={`$${usageData.avgCostPerQuery.toFixed(6)}`} />
                <CostStatCard icon={<Calendar className="h-5 w-5" />} label="Projected / Month" value={`$${projectedMonthlyCost.toFixed(2)}`} />
              </div>

              {/* Chart */}
              {chartData.length > 0 && (
                <div className="rounded-xl p-5 mb-8" style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}>
                  <h3 className="text-sm font-semibold text-white mb-4">Daily Cost (Last 30 Days)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                      <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }}
                        labelStyle={{ color: "#fff" }}
                        formatter={(value) => [`$${Number(value).toFixed(4)}`, "Cost"]}
                      />
                      <Bar dataKey="cost" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Daily Breakdown Table */}
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}>
                <div className="px-5 py-4" style={{ borderBottom: "1px solid #1f1f1f" }}>
                  <h3 className="text-sm font-semibold text-white">Daily Breakdown</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1f1f1f" }}>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Date</th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Queries</th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Cost</th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Avg / Query</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageData.dailyBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-gray-500">No usage data</td>
                      </tr>
                    ) : (
                      usageData.dailyBreakdown.map((row) => (
                        <tr key={row.date} style={{ borderBottom: "1px solid #1a1a1a" }}>
                          <td className="px-5 py-3 text-white">
                            {new Date(row.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </td>
                          <td className="px-5 py-3 text-right text-gray-300">{row.queries.toLocaleString()}</td>
                          <td className="px-5 py-3 text-right font-mono" style={{ color: "#22c55e" }}>${row.cost.toFixed(4)}</td>
                          <td className="px-5 py-3 text-right font-mono text-gray-500">
                            ${row.queries > 0 ? (row.cost / row.queries).toFixed(6) : "0.000000"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ===== Model & Budget Tab ===== */}
      {activeTab === "model" && (
        <div className="space-y-6">
          {configLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Current Status Bar */}
              <div
                className="rounded-xl p-4 flex items-center justify-between flex-wrap gap-4"
                style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5" style={{ color: "#22c55e" }} />
                  <span className="text-sm text-white">
                    Budget: <span className="font-mono font-bold" style={{ color: "#22c55e" }}>${todayCost.toFixed(2)}</span>
                    {" / "}
                    <span className="font-mono">${budgetCap.toFixed(2)}</span> today
                    {" — Active model: "}
                    <span className="font-semibold" style={{ color: "#22c55e" }}>{activeModel}</span>
                  </span>
                </div>
                {autoDowngrade && (
                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(34,197,94,0.2)", color: "#22c55e" }}>
                    Auto-downgrade ON
                  </span>
                )}
              </div>

              {/* Model Switcher */}
              <div className="rounded-xl p-5" style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}>
                <h3 className="text-sm font-semibold text-white mb-4">Active Model</h3>
                <div className="grid gap-3">
                  {MODELS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => updateConfig("concierge_active_model", m.value)}
                      disabled={saving}
                      className="flex items-center justify-between rounded-lg p-4 transition-colors text-left"
                      style={{
                        backgroundColor: activeModel === m.value ? "rgba(34,197,94,0.1)" : "#1a1a1a",
                        border: `1px solid ${activeModel === m.value ? "rgba(34,197,94,0.4)" : "#252525"}`,
                      }}
                    >
                      <div>
                        <div className="text-sm font-medium" style={{ color: activeModel === m.value ? "#22c55e" : "#fff" }}>
                          {m.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">~${m.cost}/query</div>
                      </div>
                      {activeModel === m.value && (
                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#22c55e", color: "#000" }}>
                          Active
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {activeModelInfo && usageData && usageData.totalQueries > 0 && (
                  <div className="mt-4 text-xs text-gray-500">
                    Estimated monthly cost at current volume ({Math.round(usageData.totalQueries / Math.max(monthlyData.length, 1))} queries/day):
                    {" "}
                    <span className="font-mono" style={{ color: "#22c55e" }}>
                      ${(Math.round(usageData.totalQueries / Math.max(monthlyData.length, 1)) * activeModelInfo.cost * 30).toFixed(2)}/mo
                    </span>
                  </div>
                )}
              </div>

              {/* Budget Settings */}
              <div className="rounded-xl p-5" style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}>
                <h3 className="text-sm font-semibold text-white mb-4">Budget Cap & Auto-Downgrade</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Daily Budget Cap ($)</label>
                    <input
                      type="number"
                      value={budgetCap}
                      onChange={(e) => updateConfig("concierge_daily_budget_cap", e.target.value)}
                      className="w-48 rounded-lg px-3 py-2 text-sm text-white outline-none"
                      style={{ backgroundColor: "#1a1a1a", border: "1px solid #252525" }}
                      step="5"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Fallback Model (when over budget)</label>
                    <select
                      value={fallbackModel}
                      onChange={(e) => updateConfig("concierge_fallback_model", e.target.value)}
                      className="w-48 rounded-lg px-3 py-2 text-sm text-white outline-none"
                      style={{ backgroundColor: "#1a1a1a", border: "1px solid #252525" }}
                    >
                      {MODELS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateConfig("concierge_auto_downgrade", autoDowngrade ? "false" : "true")}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      style={{ backgroundColor: autoDowngrade ? "#22c55e" : "#333" }}
                    >
                      <span
                        className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
                        style={{ transform: autoDowngrade ? "translateX(24px)" : "translateX(4px)" }}
                      />
                    </button>
                    <span className="text-sm text-gray-300">Auto-downgrade when budget exceeded</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== Conversation Log Tab ===== */}
      {activeTab === "logs" && (
        <div>
          {convLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #1f1f1f" }}>
                  <h3 className="text-sm font-semibold text-white">
                    Conversation Log <span className="text-gray-500 font-normal">({convTotal} total)</span>
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1f1f1f" }}>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">IP</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Message</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Model</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Tokens</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conversations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No conversations found</td>
                        </tr>
                      ) : (
                        conversations.map((c) => (
                          <tr key={c.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                            <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                              {new Date(c.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="px-4 py-3 text-gray-400 font-mono text-xs">{c.userIp}</td>
                            <td className="px-4 py-3 text-white max-w-xs truncate">{c.messagePreview}</td>
                            <td className="px-4 py-3">
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: c.model === "sonar-pro" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.1)",
                                  color: c.model === "sonar-pro" ? "#22c55e" : "#9ca3af",
                                }}
                              >
                                {c.model}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-400 text-xs font-mono">
                              {c.inputTokens}/{c.outputTokens}
                            </td>
                            <td className="px-4 py-3 text-right font-mono" style={{ color: "#22c55e" }}>
                              ${c.totalCost.toFixed(4)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {convTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-gray-500">
                    Page {convPage} of {convTotalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConvPage((p) => Math.max(1, p - 1))}
                      disabled={convPage <= 1}
                      className="rounded-lg px-3 py-1.5 text-xs text-gray-300 disabled:opacity-30"
                      style={{ backgroundColor: "#1a1a1a", border: "1px solid #252525" }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConvPage((p) => Math.min(convTotalPages, p + 1))}
                      disabled={convPage >= convTotalPages}
                      className="rounded-lg px-3 py-1.5 text-xs text-gray-300 disabled:opacity-30"
                      style={{ backgroundColor: "#1a1a1a", border: "1px solid #252525" }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== System Prompt Tab ===== */}
      {activeTab === "prompt" && (
        <div>
          {promptLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="rounded-xl p-5" style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">System Prompt</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {promptIsCustom ? "Using custom prompt" : "Using default prompt"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {promptIsCustom && (
                    <button
                      onClick={resetPrompt}
                      disabled={promptSaving}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10"
                      style={{ border: "1px solid #252525" }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset to Default
                    </button>
                  )}
                  <button
                    onClick={savePrompt}
                    disabled={promptSaving}
                    className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors"
                    style={{ backgroundColor: "#22c55e", color: "#000" }}
                  >
                    {promptSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </button>
                </div>
              </div>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={20}
                className="w-full rounded-lg px-4 py-3 text-sm text-gray-200 outline-none resize-y font-mono"
                style={{ backgroundColor: "#0a0a0a", border: "1px solid #252525" }}
                placeholder="Enter system prompt..."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CostStatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}>
      <div className="mb-2 flex items-center gap-2">
        <div style={{ color: "#22c55e" }}>{icon}</div>
        <span className="text-xs font-medium text-gray-400">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  );
}
