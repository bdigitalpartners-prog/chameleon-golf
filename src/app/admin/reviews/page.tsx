"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import nextDynamic from "next/dynamic";
import {
  Search,
  Star,
  TrendingUp,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";

const BarChart = nextDynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false }
);
const Bar = nextDynamic(
  () => import("recharts").then((mod) => mod.Bar),
  { ssr: false }
);
const LineChart = nextDynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false }
);
const Line = nextDynamic(
  () => import("recharts").then((mod) => mod.Line),
  { ssr: false }
);
const XAxis = nextDynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = nextDynamic(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
);
const CartesianGrid = nextDynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = nextDynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
);
const ResponsiveContainer = nextDynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

interface RatingRow {
  ratingId: number;
  userId: string;
  userName: string | null;
  courseId: number;
  courseName: string;
  overallRating: number;
  conditioning: number | null;
  layoutDesign: number | null;
  value: number | null;
  reviewTitle: string | null;
  isPublished: boolean;
  createdAt: string;
}

interface ScoreRow {
  scoreId: number;
  userId: string;
  userName: string | null;
  courseId: number;
  courseName: string;
  totalScore: number;
  datePlayed: string;
  verificationMethod: string | null;
  verificationStatus: string;
  screenshotUrl: string | null;
  createdAt: string;
}

interface Analytics {
  topRated: Array<{ courseId: number; courseName: string; avgRating: number; ratingsCount: number }>;
  ratingDistribution: Array<{ rating: number; count: number }>;
  mostActive: Array<{ userId: string; name: string; ratingsCount: number }>;
  monthlyActivity: Array<{ month: string; count: number }>;
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

export default function ReviewsPage() {
  const [tab, setTab] = useState<"all" | "scores" | "analytics">("all");

  // All reviews state
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [ratingSearch, setRatingSearch] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("");
  const [ratingPage, setRatingPage] = useState(1);
  const [ratingTotalPages, setRatingTotalPages] = useState(1);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [stats, setStats] = useState({
    totalRatings: 0,
    avgOverallRating: 0,
    ratingsThisMonth: 0,
    pendingScores: 0,
  });

  // Scores state
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [scoreStatus, setScoreStatus] = useState("unverified");
  const [scorePage, setScorePage] = useState(1);
  const [scoreTotalPages, setScoreTotalPages] = useState(1);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);

  // Analytics state
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [error, setError] = useState("");

  const fetchRatings = useCallback(async () => {
    setRatingLoading(true);
    try {
      const params = new URLSearchParams({ tab: "all", page: String(ratingPage) });
      if (ratingSearch) params.set("search", ratingSearch);
      if (publishedFilter) params.set("published", publishedFilter);
      const res = await fetchAdmin(`/api/admin/reviews?${params}`);
      const data = await res.json();
      setRatings(data.ratings || []);
      setRatingTotalPages(data.totalPages || 1);
      if (data.stats) setStats(data.stats);
    } catch {
      setRatings([]);
    } finally {
      setRatingLoading(false);
    }
  }, [ratingSearch, publishedFilter, ratingPage]);

  const fetchScores = useCallback(async () => {
    setScoreLoading(true);
    try {
      const params = new URLSearchParams({ tab: "scores", status: scoreStatus, page: String(scorePage) });
      const res = await fetchAdmin(`/api/admin/reviews?${params}`);
      const data = await res.json();
      setScores(data.scores || []);
      setScoreTotalPages(data.totalPages || 1);
    } catch {
      setScores([]);
    } finally {
      setScoreLoading(false);
    }
  }, [scoreStatus, scorePage]);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetchAdmin("/api/admin/reviews/analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "all") fetchRatings();
  }, [tab, fetchRatings]);

  useEffect(() => {
    if (tab === "scores") fetchScores();
  }, [tab, fetchScores]);

  useEffect(() => {
    if (tab === "analytics" && !analytics) fetchAnalytics();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScoreAction = async (scoreId: number, action: "verify" | "reject") => {
    setActioningId(scoreId);
    setError("");
    try {
      const res = await fetchAdmin(`/api/admin/reviews/scores/${scoreId}`, {
        method: "PUT",
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        fetchScores();
      } else {
        setError(data.error || "Action failed");
      }
    } catch {
      setError("Failed to process action");
    } finally {
      setActioningId(null);
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const tabClass = (t: string) =>
    `px-4 py-2 text-sm font-medium border-b-2 ${
      tab === t ? "border-[#22c55e] text-white" : "border-transparent text-gray-500 hover:text-gray-300"
    }`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reviews & Moderation</h1>
        <p className="text-sm text-gray-400 mt-1">Manage ratings, scores, and review analytics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Star className="h-5 w-5" />} label="Total Ratings" value={stats.totalRatings.toLocaleString()} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Avg Rating" value={stats.avgOverallRating.toFixed(1)} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="This Month" value={stats.ratingsThisMonth.toLocaleString()} />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Pending Scores" value={stats.pendingScores.toLocaleString()} />
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#222] flex gap-0">
        <button className={tabClass("all")} onClick={() => setTab("all")}>All Reviews</button>
        <button className={tabClass("scores")} onClick={() => setTab("scores")}>Pending Scores</button>
        <button className={tabClass("analytics")} onClick={() => setTab("analytics")}>Analytics</button>
      </div>

      {/* ===== ALL REVIEWS TAB ===== */}
      {tab === "all" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <form onSubmit={(e) => { e.preventDefault(); setRatingPage(1); fetchRatings(); }} className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={ratingSearch}
                  onChange={(e) => setRatingSearch(e.target.value)}
                  placeholder="Search by course or user..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e]"
                />
              </div>
            </form>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Published</label>
              <select
                value={publishedFilter}
                onChange={(e) => { setPublishedFilter(e.target.value); setRatingPage(1); }}
                className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
              >
                <option value="">All</option>
                <option value="true">Published</option>
                <option value="false">Unpublished</option>
              </select>
            </div>
          </div>

          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#222] text-gray-400 text-left">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Course</th>
                    <th className="px-4 py-3 font-medium text-right">Overall</th>
                    <th className="px-4 py-3 font-medium text-right">Cond.</th>
                    <th className="px-4 py-3 font-medium text-right">Layout</th>
                    <th className="px-4 py-3 font-medium text-right">Value</th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Published</th>
                  </tr>
                </thead>
                <tbody>
                  {ratingLoading ? (
                    <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
                  ) : ratings.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">No reviews found</td></tr>
                  ) : (
                    ratings.map((r) => (
                      <tr key={r.ratingId} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]">
                        <td className="px-4 py-3 text-gray-400">{r.userName || "—"}</td>
                        <td className="px-4 py-3 text-white">{r.courseName}</td>
                        <td className="px-4 py-3 text-right text-white font-mono">{r.overallRating.toFixed(1)}</td>
                        <td className="px-4 py-3 text-right text-gray-400 font-mono">{r.conditioning?.toFixed(1) ?? "—"}</td>
                        <td className="px-4 py-3 text-right text-gray-400 font-mono">{r.layoutDesign?.toFixed(1) ?? "—"}</td>
                        <td className="px-4 py-3 text-right text-gray-400 font-mono">{r.value?.toFixed(1) ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-400 truncate max-w-[200px]">{r.reviewTitle || "—"}</td>
                        <td className="px-4 py-3 text-gray-400">{fmtDate(r.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className={r.isPublished ? "text-green-500" : "text-gray-500"}>
                            {r.isPublished ? "Yes" : "No"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {ratingTotalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setRatingPage((p) => Math.max(1, p - 1))} disabled={ratingPage === 1} className="p-2 rounded-lg border border-[#333] text-gray-400 hover:text-white disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-400">Page {ratingPage} of {ratingTotalPages}</span>
              <button onClick={() => setRatingPage((p) => Math.min(ratingTotalPages, p + 1))} disabled={ratingPage === ratingTotalPages} className="p-2 rounded-lg border border-[#333] text-gray-400 hover:text-white disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== PENDING SCORES TAB ===== */}
      {tab === "scores" && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={scoreStatus}
              onChange={(e) => { setScoreStatus(e.target.value); setScorePage(1); }}
              className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
            >
              <option value="unverified">Unverified</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#222] text-gray-400 text-left">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Course</th>
                    <th className="px-4 py-3 font-medium text-right">Score</th>
                    <th className="px-4 py-3 font-medium">Date Played</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Screenshot</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreLoading ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
                  ) : scores.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No scores found</td></tr>
                  ) : (
                    scores.map((s) => (
                      <tr key={s.scoreId} className="border-b border-[#1a1a1a]">
                        <td className="px-4 py-3 text-white">{s.userName || "—"}</td>
                        <td className="px-4 py-3 text-gray-400">{s.courseName}</td>
                        <td className="px-4 py-3 text-right text-white font-mono">{s.totalScore}</td>
                        <td className="px-4 py-3 text-gray-400">{fmtDate(s.datePlayed)}</td>
                        <td className="px-4 py-3 text-gray-400">{s.verificationMethod || "—"}</td>
                        <td className="px-4 py-3">
                          {s.screenshotUrl ? (
                            <a href={s.screenshotUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#22c55e] hover:underline text-xs">
                              View <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            s.verificationStatus === "verified" ? "bg-green-900/40 text-green-400" :
                            s.verificationStatus === "rejected" ? "bg-red-900/40 text-red-400" :
                            "bg-yellow-900/40 text-yellow-400"
                          }`}>
                            {s.verificationStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {s.verificationStatus === "unverified" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleScoreAction(s.scoreId, "verify")}
                                disabled={actioningId === s.scoreId}
                                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-green-900/30 text-green-400 text-xs hover:bg-green-900/50 disabled:opacity-50"
                              >
                                <CheckCircle size={12} /> Verify
                              </button>
                              <button
                                onClick={() => handleScoreAction(s.scoreId, "reject")}
                                disabled={actioningId === s.scoreId}
                                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-900/30 text-red-400 text-xs hover:bg-red-900/50 disabled:opacity-50"
                              >
                                <XCircle size={12} /> Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {scoreTotalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setScorePage((p) => Math.max(1, p - 1))} disabled={scorePage === 1} className="p-2 rounded-lg border border-[#333] text-gray-400 hover:text-white disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-400">Page {scorePage} of {scoreTotalPages}</span>
              <button onClick={() => setScorePage((p) => Math.min(scoreTotalPages, p + 1))} disabled={scorePage === scoreTotalPages} className="p-2 rounded-lg border border-[#333] text-gray-400 hover:text-white disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== ANALYTICS TAB ===== */}
      {tab === "analytics" && (
        <div className="space-y-6">
          {analyticsLoading ? (
            <div className="text-center text-gray-500 py-12">Loading analytics...</div>
          ) : analytics ? (
            <>
              {/* Rating Distribution Bar Chart */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">Rating Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.ratingDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="rating" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                        labelStyle={{ color: "#fff" }}
                        itemStyle={{ color: "#22c55e" }}
                      />
                      <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Activity Line Chart */}
              <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">Monthly Activity (Last 12 Months)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.monthlyActivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="month" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                        labelStyle={{ color: "#fff" }}
                        itemStyle={{ color: "#22c55e" }}
                      />
                      <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Rated Courses */}
                <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
                  <div className="border-b border-[#222] px-5 py-3">
                    <h3 className="text-sm font-semibold text-gray-400">Top Rated Courses (min. 3 ratings)</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#222] text-gray-400 text-left">
                        <th className="px-4 py-2 font-medium">#</th>
                        <th className="px-4 py-2 font-medium">Course</th>
                        <th className="px-4 py-2 font-medium text-right">Avg</th>
                        <th className="px-4 py-2 font-medium text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.topRated.map((c, i) => (
                        <tr key={c.courseId} className="border-b border-[#1a1a1a]">
                          <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                          <td className="px-4 py-2 text-white">{c.courseName}</td>
                          <td className="px-4 py-2 text-right text-[#22c55e] font-mono">{c.avgRating.toFixed(1)}</td>
                          <td className="px-4 py-2 text-right text-gray-400">{c.ratingsCount}</td>
                        </tr>
                      ))}
                      {analytics.topRated.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Most Active Reviewers */}
                <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
                  <div className="border-b border-[#222] px-5 py-3">
                    <h3 className="text-sm font-semibold text-gray-400">Most Active Reviewers</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#222] text-gray-400 text-left">
                        <th className="px-4 py-2 font-medium">#</th>
                        <th className="px-4 py-2 font-medium">Name</th>
                        <th className="px-4 py-2 font-medium text-right">Ratings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.mostActive.map((u, i) => (
                        <tr key={u.userId} className="border-b border-[#1a1a1a]">
                          <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                          <td className="px-4 py-2 text-white">{u.name}</td>
                          <td className="px-4 py-2 text-right text-[#22c55e] font-mono">{u.ratingsCount}</td>
                        </tr>
                      ))}
                      {analytics.mostActive.length === 0 && (
                        <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">No data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">Failed to load analytics</div>
          )}
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
