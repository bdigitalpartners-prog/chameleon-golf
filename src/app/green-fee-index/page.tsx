"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Loader2,
  BarChart3,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ValueCourse {
  courseId: number;
  name: string;
  location: string;
  style: string;
  accessType: string;
  greenFee: string;
  currentAvgFee: number | null;
  valueScore: number | null;
  priceTrend: string | null;
  yoyChangePct: number | null;
  percentileInState: number | null;
  percentileInTier: number | null;
  bestValueTime: string | null;
  logoUrl: string | null;
  architect: string | null;
}

interface TrendData {
  series: Record<string, { date: string; amount: number; season: string }[]>;
  valueIndex: any;
  dataPoints: number;
}

export default function GreenFeeIndexPage() {
  const [courses, setCourses] = useState<ValueCourse[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("value_score");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50", sortBy });
      if (selectedState) params.set("state", selectedState);
      if (maxPrice) params.set("maxPrice", maxPrice);

      const res = await fetch(`/api/green-fees/value-index?${params}`);
      const data = await res.json();
      setCourses(data.courses || []);
      if (data.states) setStates(data.states);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [selectedState, maxPrice, sortBy]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const fetchTrend = async (courseId: number) => {
    setSelectedCourseId(courseId);
    setTrendLoading(true);
    try {
      const res = await fetch(`/api/green-fees/trends?courseId=${courseId}`);
      const data = await res.json();
      setTrendData(data);
    } catch {
      setTrendData(null);
    } finally {
      setTrendLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#00FF85]/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-[#00FF85]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Green Fee Intelligence Index
            </h1>
            <p className="text-sm text-[#9CA3AF]">
              Know what you should pay before you book
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-xl bg-[#111] border border-[#222]">
        <Filter className="w-4 h-4 text-[#666]" />

        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF85]/50"
        >
          <option value="">All States</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Max Price"
          className="bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#00FF85]/50 w-28"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF85]/50"
        >
          <option value="value_score">Best Value</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-[#111] border border-[#222] animate-pulse"
                />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-10 h-10 text-[#333] mx-auto mb-3" />
              <p className="text-[#666]">
                No green fee data available yet.
              </p>
              <p className="text-[#555] text-sm mt-1">
                Fee data will appear here as it&apos;s collected.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course, idx) => (
                <ValueCourseRow
                  key={course.courseId}
                  course={course}
                  rank={idx + 1}
                  isSelected={selectedCourseId === course.courseId}
                  onSelect={() => fetchTrend(course.courseId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Trend Chart Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="rounded-xl bg-[#111] border border-[#222] p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00FF85]" />
                Price Trends
              </h3>

              {trendLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-[#333] animate-spin" />
                </div>
              ) : trendData && trendData.dataPoints > 0 ? (
                <div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={
                        Object.values(trendData.series)[0]?.map((d) => ({
                          date: d.date,
                          price: d.amount,
                        })) || []
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#666", fontSize: 10 }}
                        tickFormatter={(v) =>
                          new Date(v).toLocaleDateString("en-US", {
                            month: "short",
                            year: "2-digit",
                          })
                        }
                      />
                      <YAxis
                        tick={{ fill: "#666", fontSize: 10 }}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#111",
                          border: "1px solid #333",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(v: number) => [`$${v}`, "Green Fee"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#00FF85"
                        strokeWidth={2}
                        dot={{ fill: "#00FF85", r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {trendData.valueIndex && (
                    <div className="mt-3 space-y-2">
                      {trendData.valueIndex.percentile_in_state && (
                        <p className="text-xs text-[#9CA3AF]">
                          Charges more than{" "}
                          <span className="text-white font-medium">
                            {trendData.valueIndex.percentile_in_state}%
                          </span>{" "}
                          of courses in state
                        </p>
                      )}
                      {trendData.valueIndex.best_value_time && (
                        <p className="text-xs text-[#9CA3AF]">
                          Best value:{" "}
                          <span className="text-[#00FF85] font-medium">
                            {trendData.valueIndex.best_value_time
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-[#666]">
                    {selectedCourseId
                      ? "No trend data available for this course"
                      : "Select a course to view price trends"}
                  </p>
                </div>
              )}
            </div>

            {/* Stats */}
            {courses.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#111] border border-[#222] p-3 text-center">
                  <p className="text-xs text-[#9CA3AF]">Avg Fee</p>
                  <p className="text-lg font-bold text-white">
                    $
                    {Math.round(
                      courses.reduce(
                        (a, c) => a + (c.currentAvgFee || 0),
                        0
                      ) / courses.filter((c) => c.currentAvgFee).length || 0
                    )}
                  </p>
                </div>
                <div className="rounded-xl bg-[#111] border border-[#222] p-3 text-center">
                  <p className="text-xs text-[#9CA3AF]">Courses</p>
                  <p className="text-lg font-bold text-[#00FF85]">
                    {courses.length}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ValueCourseRow({
  course,
  rank,
  isSelected,
  onSelect,
}: {
  course: ValueCourse;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const TrendIcon =
    course.priceTrend === "rising"
      ? TrendingUp
      : course.priceTrend === "declining"
        ? TrendingDown
        : Minus;

  const trendColor =
    course.priceTrend === "rising"
      ? "#FF4444"
      : course.priceTrend === "declining"
        ? "#00FF85"
        : "#9CA3AF";

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${
        isSelected
          ? "bg-[#111] border-[#00FF85]/30"
          : "bg-[#111] border-[#222] hover:border-[#00FF85]/20"
      }`}
    >
      {/* Rank */}
      <div className="w-8 text-center flex-shrink-0">
        <span className="text-sm font-bold text-[#666]">#{rank}</span>
      </div>

      {/* Course Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/course/${course.courseId}`}
          className="text-sm font-semibold text-white hover:text-[#00FF85] transition-colors truncate block"
          onClick={(e) => e.stopPropagation()}
        >
          {course.name}
        </Link>
        <p className="text-[11px] text-[#9CA3AF] truncate flex items-center gap-1">
          <MapPin className="w-3 h-3 inline" />
          {course.location}
        </p>
      </div>

      {/* Green Fee */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-white">
          {course.currentAvgFee ? `$${Math.round(course.currentAvgFee)}` : course.greenFee}
        </p>
        {course.priceTrend && (
          <div className="flex items-center gap-1 justify-end">
            <TrendIcon className="w-3 h-3" style={{ color: trendColor }} />
            {course.yoyChangePct !== null && (
              <span className="text-[10px]" style={{ color: trendColor }}>
                {course.yoyChangePct > 0 ? "+" : ""}
                {course.yoyChangePct.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Value Score */}
      <div className="flex-shrink-0">
        {course.valueScore !== null ? (
          <div
            className="w-12 h-12 rounded-full flex flex-col items-center justify-center border-2"
            style={{
              borderColor:
                course.valueScore >= 80
                  ? "#00FF85"
                  : course.valueScore >= 60
                    ? "#FFD700"
                    : "#FF8C00",
            }}
          >
            <span
              className="text-sm font-bold"
              style={{
                color:
                  course.valueScore >= 80
                    ? "#00FF85"
                    : course.valueScore >= 60
                      ? "#FFD700"
                      : "#FF8C00",
              }}
            >
              {course.valueScore}
            </span>
            <span className="text-[7px] text-[#9CA3AF] -mt-0.5">VALUE</span>
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full flex items-center justify-center border border-[#333]">
            <span className="text-[10px] text-[#666]">N/A</span>
          </div>
        )}
      </div>
    </div>
  );
}
