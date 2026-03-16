"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
  Eye,
  MapPin,
  Trophy,
  Search,
  TrendingUp,
  MessageCircle,
  Clock,
  DollarSign,
  Bot,
  Info,
} from "lucide-react";
import dynamic from "next/dynamic";

/* ── Dynamic recharts imports ── */

const CourseViewsChart = dynamic(
  () =>
    import("recharts").then((mod) => {
      const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } = mod;
      function Chart({ data }: { data: Array<{ name: string; views: number }> }) {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={180} tick={{ fill: "#888", fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
              <Bar dataKey="views" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }
      return Chart;
    }),
  { ssr: false, loading: () => <div className="h-96 flex items-center justify-center text-gray-500 text-sm">Loading chart...</div> }
);

const PieChartComponent = dynamic(
  () =>
    import("recharts").then((mod) => {
      const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } = mod;
      const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
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

const BarChartHorizontal = dynamic(
  () =>
    import("recharts").then((mod) => {
      const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } = mod;
      function Chart({ data }: { data: Array<{ bucket: string; count: number }> }) {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="bucket" tick={{ fill: "#888", fontSize: 10 }} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }
      return Chart;
    }),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-500 text-sm">Loading chart...</div> }
);

const LineChartComponent = dynamic(
  () =>
    import("recharts").then((mod) => {
      const { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } = mod;
      function Chart({ data }: { data: Array<{ date: string; count: number }> }) {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
              <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      }
      return Chart;
    }),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-gray-500 text-sm">Loading chart...</div> }
);

/* ── Types ── */

type TabKey = "overview" | "courses" | "search" | "concierge";

interface OverviewData {
  totalViews: number;
  uniqueCoursesViewed: number;
  mostPopularCourse: string;
  mostSearchedState: string;
  topCourses: Array<{ name: string; views: number }>;
  geographicDistribution: Array<{ state: string; courseCount: number; avgScore: number | null; topCourse: string | null }>;
}

interface CourseData {
  mostListed: Array<{ name: string; listsAppeared: number; bestRank: number | null; chameleonScore: number | null }>;
  courseTypes: Array<{ type: string; count: number }>;
  accessTypes: Array<{ type: string; count: number }>;
  priceDistribution: Array<{ bucket: string; count: number }>;
}

interface ConciergeData {
  recentQueries: Array<{ id: number; time: string; messagePreview: string; model: string; cost: number }>;
  dailyTrends: Array<{ date: string; count: number }>;
  modelUsage: Array<{ model: string; count: number }>;
}

/* ── Helpers ── */

const ADMIN_KEY = () => typeof window !== "undefined" ? sessionStorage.getItem("golfEQ_admin_key") || "" : "";

function fetchAdmin(url: string) {
  return fetch(url, {
    headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY() },
  });
}

/* ── Page Component ── */

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [conciergeData, setConciergeData] = useState<ConciergeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === "overview" && !overviewData) {
      setLoading(true);
      fetchAdmin("/api/admin/analytics/overview")
        .then((r) => r.json())
        .then(setOverviewData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [activeTab, overviewData]);

  useEffect(() => {
    if (activeTab === "courses" && !courseData) {
      setLoading(true);
      fetchAdmin("/api/admin/analytics/courses")
        .then((r) => r.json())
        .then(setCourseData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [activeTab, courseData]);

  useEffect(() => {
    if (activeTab === "concierge" && !conciergeData) {
      setLoading(true);
      fetchAdmin("/api/admin/analytics/concierge")
        .then((r) => r.json())
        .then(setConciergeData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [activeTab, conciergeData]);

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "courses", label: "Course Analytics" },
    { key: "concierge", label: "Concierge Insights" },
    { key: "search", label: "Search Insights" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Site Analytics</h1>
        <p className="mt-1 text-sm text-gray-400">Platform usage, course data insights, and engagement metrics</p>
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

      {/* Loading state */}
      {loading && activeTab !== "search" && (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-gray-500">Loading analytics...</div>
        </div>
      )}

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && overviewData && !loading && (
        <div>
          {/* Stat cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Eye className="h-5 w-5" />} label="Total Page Views (est.)" value={overviewData.totalViews.toLocaleString()} />
            <StatCard icon={<MapPin className="h-5 w-5" />} label="Unique Courses Viewed" value={overviewData.uniqueCoursesViewed.toLocaleString()} />
            <StatCard icon={<Trophy className="h-5 w-5" />} label="Most Popular Course" value={overviewData.mostPopularCourse} />
            <StatCard icon={<Search className="h-5 w-5" />} label="Top State" value={overviewData.mostSearchedState} />
          </div>

          {/* Course Views Chart */}
          {overviewData.topCourses.length > 0 && (
            <div className="mb-6 rounded-xl border border-gray-800 bg-[#111111] p-6">
              <h3 className="mb-4 text-sm font-semibold text-gray-400">Top 20 Most-Viewed Courses (by ranking entries)</h3>
              <div className="h-[500px]">
                <CourseViewsChart data={overviewData.topCourses} />
              </div>
            </div>
          )}

          {/* Geographic Distribution */}
          {overviewData.geographicDistribution.length > 0 && (
            <div className="rounded-xl border border-gray-800 bg-[#111111] overflow-hidden">
              <div className="border-b border-gray-800 px-5 py-3">
                <h3 className="text-sm font-semibold text-gray-400">Geographic Distribution</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">State</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">Course Count</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">Avg CourseFACTOR</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Top Course</th>
                  </tr>
                </thead>
                <tbody>
                  {overviewData.geographicDistribution.map((row) => (
                    <tr key={row.state} className="border-b border-gray-800/50">
                      <td className="px-5 py-3 font-medium text-white">{row.state}</td>
                      <td className="px-5 py-3 text-right text-gray-400">{row.courseCount}</td>
                      <td className="px-5 py-3 text-right font-mono text-green-500">{row.avgScore ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-400 max-w-xs truncate">{row.topCourse || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Course Analytics Tab ── */}
      {activeTab === "courses" && courseData && !loading && (
        <div>
          {/* Most Listed Courses */}
          <div className="mb-6 rounded-xl border border-gray-800 bg-[#111111] overflow-hidden">
            <div className="border-b border-gray-800 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-400">Most Prestigious Courses (by Lists Appeared)</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Course Name</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">Lists Appeared</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">Best Rank</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">CourseFACTOR</th>
                </tr>
              </thead>
              <tbody>
                {courseData.mostListed.map((c) => (
                  <tr key={c.name} className="border-b border-gray-800/50">
                    <td className="px-5 py-3 font-medium text-white">{c.name}</td>
                    <td className="px-5 py-3 text-right text-gray-400">{c.listsAppeared}</td>
                    <td className="px-5 py-3 text-right font-mono text-green-500">#{c.bestRank || "—"}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-400">{c.chameleonScore ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Charts row */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Course Type Breakdown */}
            <div className="rounded-xl border border-gray-800 bg-[#111111] p-6">
              <h3 className="mb-4 text-sm font-semibold text-gray-400">Course Type Breakdown</h3>
              <div className="h-64">
                <PieChartComponent data={courseData.courseTypes.filter((t) => t.type !== "Unknown").map((t) => ({ name: t.type, value: t.count }))} />
              </div>
            </div>

            {/* Access Type Breakdown */}
            <div className="rounded-xl border border-gray-800 bg-[#111111] p-6">
              <h3 className="mb-4 text-sm font-semibold text-gray-400">Access Type Breakdown</h3>
              <div className="h-64">
                <PieChartComponent data={courseData.accessTypes.filter((t) => t.type !== "Unknown").map((t) => ({ name: t.type, value: t.count }))} />
              </div>
            </div>
          </div>

          {/* Price Distribution */}
          <div className="rounded-xl border border-gray-800 bg-[#111111] p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-400">Green Fee Price Distribution</h3>
            <div className="h-64">
              <BarChartHorizontal data={courseData.priceDistribution} />
            </div>
          </div>
        </div>
      )}

      {/* ── Search Insights Tab (placeholder) ── */}
      {activeTab === "search" && (
        <div className="rounded-xl border border-gray-800 bg-[#111111] p-8">
          <div className="mx-auto max-w-lg text-center">
            <Search className="mx-auto h-12 w-12 text-gray-600" />
            <h3 className="mt-4 text-lg font-semibold text-white">Search Analytics Coming Soon</h3>
            <p className="mt-2 text-sm text-gray-400">
              Search analytics will be available once PostHog event tracking is configured.
            </p>

            <div className="mt-6 rounded-lg border border-gray-700 bg-gray-900/50 p-4 text-left">
              <div className="mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-green-500" />
                <h4 className="text-sm font-medium text-white">PostHog Events to Track</h4>
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <code className="rounded bg-gray-800 px-2 py-0.5 text-xs text-green-400">course_search</code>
                  <span>When a user performs a search query</span>
                </li>
                <li className="flex items-center gap-2">
                  <code className="rounded bg-gray-800 px-2 py-0.5 text-xs text-green-400">filter_applied</code>
                  <span>When a user applies filters (state, type, etc.)</span>
                </li>
                <li className="flex items-center gap-2">
                  <code className="rounded bg-gray-800 px-2 py-0.5 text-xs text-green-400">course_detail_view</code>
                  <span>When a user views a course detail page</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Concierge Insights Tab ── */}
      {activeTab === "concierge" && conciergeData && !loading && (
        <div>
          {/* Charts row */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Usage Trends */}
            <div className="rounded-xl border border-gray-800 bg-[#111111] p-6">
              <h3 className="mb-4 text-sm font-semibold text-gray-400">Daily Query Count (Last 30 Days)</h3>
              <div className="h-64">
                {conciergeData.dailyTrends.length > 0 ? (
                  <LineChartComponent
                    data={conciergeData.dailyTrends.map((d) => ({
                      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                      count: d.count,
                    }))}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500 text-sm">No usage data</div>
                )}
              </div>
            </div>

            {/* Model Usage */}
            <div className="rounded-xl border border-gray-800 bg-[#111111] p-6">
              <h3 className="mb-4 text-sm font-semibold text-gray-400">Model Usage Distribution</h3>
              <div className="h-64">
                {conciergeData.modelUsage.length > 0 ? (
                  <PieChartComponent data={conciergeData.modelUsage.map((m) => ({ name: m.model, value: m.count }))} />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500 text-sm">No model data</div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Queries Table */}
          <div className="rounded-xl border border-gray-800 bg-[#111111] overflow-hidden">
            <div className="border-b border-gray-800 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-400">Recent Concierge Queries (Last 20)</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Time</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Message Preview</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Model</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">Cost</th>
                </tr>
              </thead>
              <tbody>
                {conciergeData.recentQueries.map((q) => (
                  <tr key={q.id} className="border-b border-gray-800/50">
                    <td className="px-5 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(q.time).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-white max-w-sm truncate">{q.messagePreview}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-300">{q.model}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-green-500">${q.cost.toFixed(4)}</td>
                  </tr>
                ))}
                {conciergeData.recentQueries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500">No concierge queries yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
      <div className="text-lg font-bold text-white truncate">{value}</div>
    </div>
  );
}
