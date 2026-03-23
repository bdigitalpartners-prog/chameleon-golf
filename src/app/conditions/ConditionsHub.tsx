"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Cloud,
  ThumbsUp,
  TrendingUp,
  Clock,
  Star,
  ChevronRight,
  Loader2,
  Plus,
  Wind,
  Droplets,
  TreePine,
  X,
} from "lucide-react";

/* ─── Types ─────────────────────────────────── */
interface ConditionReport {
  id: number;
  course_id: number;
  course_name: string;
  city: string;
  state: string;
  user_name: string;
  user_image: string | null;
  green_speed: string | null;
  green_firmness: string | null;
  fairway_condition: string | null;
  bunker_condition: string | null;
  rough_height: string | null;
  pace_of_play: number | null;
  wind_conditions: string | null;
  overall_rating: number | null;
  notes: string | null;
  reported_at: string;
  helpful_count: number;
}

interface TrendingCourse {
  course_id: number;
  course_name: string;
  city: string;
  state: string;
  report_count: number;
  avg_rating: number;
  latest_report: string;
}

/* ─── Helpers ───────────────────────────────── */
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function conditionLabel(value: string | null) {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ratingStars(rating: number | null) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= rating ? "text-[#00FF85] fill-[#00FF85]" : "text-[#333]"}`}
        />
      ))}
    </div>
  );
}

/* ─── Condition Badge ───────────────────────── */
function ConditionBadge({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null;
  icon: React.ComponentType<{ className?: string }>;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#1a1a1a] border border-[#222]">
      <Icon className="w-3 h-3 text-[#00FF85]" />
      <span className="text-[11px] text-[#9CA3AF]">{label}</span>
      <span className="text-[11px] text-white font-medium">
        {conditionLabel(value)}
      </span>
    </div>
  );
}

/* ─── Report Card ───────────────────────────── */
function ReportCard({
  report,
  onVote,
}: {
  report: ConditionReport;
  onVote: (id: number) => void;
}) {
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-xl p-4 hover:border-[#00FF85]/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {report.user_image ? (
            <img
              src={report.user_image}
              alt=""
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#00FF85] flex items-center justify-center text-black text-xs font-bold">
              {report.user_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
          <div>
            <div className="text-sm text-white font-medium">
              {report.user_name || "Anonymous"}
            </div>
            <div className="text-xs text-[#9CA3AF] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(report.reported_at)}
            </div>
          </div>
        </div>
        {ratingStars(report.overall_rating)}
      </div>

      {/* Course Name */}
      <div className="mb-3">
        <span className="text-[#00FF85] text-sm font-semibold">
          {report.course_name || `Course #${report.course_id}`}
        </span>
        {report.city && report.state && (
          <span className="text-xs text-[#9CA3AF] ml-2">
            {report.city}, {report.state}
          </span>
        )}
      </div>

      {/* Condition Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <ConditionBadge
          label="Greens"
          value={report.green_speed}
          icon={Droplets}
        />
        <ConditionBadge
          label="Firmness"
          value={report.green_firmness}
          icon={Cloud}
        />
        <ConditionBadge
          label="Fairways"
          value={report.fairway_condition}
          icon={TreePine}
        />
        <ConditionBadge
          label="Bunkers"
          value={report.bunker_condition}
          icon={Cloud}
        />
        <ConditionBadge
          label="Rough"
          value={report.rough_height}
          icon={TreePine}
        />
        <ConditionBadge
          label="Wind"
          value={report.wind_conditions}
          icon={Wind}
        />
        {report.pace_of_play && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#1a1a1a] border border-[#222]">
            <Clock className="w-3 h-3 text-[#00FF85]" />
            <span className="text-[11px] text-[#9CA3AF]">Pace</span>
            <span className="text-[11px] text-white font-medium">
              {Math.floor(report.pace_of_play / 60)}h{" "}
              {report.pace_of_play % 60}m
            </span>
          </div>
        )}
      </div>

      {/* Notes */}
      {report.notes && (
        <p className="text-sm text-[#ccc] mb-3 line-clamp-2">
          {report.notes}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 pt-2 border-t border-[#222]">
        <button
          onClick={() => onVote(report.id)}
          className="flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-[#00FF85] transition-colors"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>Helpful ({report.helpful_count})</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Report Form Modal ─────────────────────── */
function ReportFormModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [step, setStep] = useState(1);
  const [courseId, setCourseId] = useState("");
  const [greenSpeed, setGreenSpeed] = useState("");
  const [greenFirmness, setGreenFirmness] = useState("");
  const [fairwayCondition, setFairwayCondition] = useState("");
  const [bunkerCondition, setBunkerCondition] = useState("");
  const [roughHeight, setRoughHeight] = useState("");
  const [paceOfPlay, setPaceOfPlay] = useState("");
  const [windConditions, setWindConditions] = useState("");
  const [overallRating, setOverallRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!courseId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/conditions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: Number(courseId),
          greenSpeed: greenSpeed || undefined,
          greenFirmness: greenFirmness || undefined,
          fairwayCondition: fairwayCondition || undefined,
          bunkerCondition: bunkerCondition || undefined,
          roughHeight: roughHeight || undefined,
          paceOfPlay: paceOfPlay ? Number(paceOfPlay) : undefined,
          windConditions: windConditions || undefined,
          overallRating: overallRating || undefined,
          notes: notes || undefined,
        }),
      });
      if (res.ok) {
        onSubmit();
        onClose();
        // Reset form
        setStep(1);
        setCourseId("");
        setGreenSpeed("");
        setGreenFirmness("");
        setFairwayCondition("");
        setBunkerCondition("");
        setRoughHeight("");
        setPaceOfPlay("");
        setWindConditions("");
        setOverallRating(0);
        setNotes("");
      }
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectClass =
    "w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:border-[#00FF85] focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#222]">
          <h3 className="text-lg font-bold text-white">
            Report Course Conditions
          </h3>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Step indicators */}
          <div className="flex gap-2 mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${s <= step ? "bg-[#00FF85]" : "bg-[#333]"}`}
              />
            ))}
          </div>

          {step === 1 && (
            <>
              <div>
                <label className="text-xs text-[#9CA3AF] mb-1 block">
                  Course ID
                </label>
                <input
                  type="number"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  placeholder="Enter course ID"
                  className={selectClass}
                />
              </div>
              <button
                onClick={() => courseId && setStep(2)}
                disabled={!courseId}
                className="w-full py-2.5 rounded-lg bg-[#00FF85] text-black font-semibold text-sm disabled:opacity-40"
              >
                Next — Conditions
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#9CA3AF] mb-1 block">
                    Green Speed
                  </label>
                  <select
                    value={greenSpeed}
                    onChange={(e) => setGreenSpeed(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select...</option>
                    <option value="slow">Slow</option>
                    <option value="medium">Medium</option>
                    <option value="fast">Fast</option>
                    <option value="tournament">Tournament</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#9CA3AF] mb-1 block">
                    Green Firmness
                  </label>
                  <select
                    value={greenFirmness}
                    onChange={(e) => setGreenFirmness(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select...</option>
                    <option value="soft">Soft</option>
                    <option value="medium">Medium</option>
                    <option value="firm">Firm</option>
                    <option value="very_firm">Very Firm</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#9CA3AF] mb-1 block">
                    Fairway Condition
                  </label>
                  <select
                    value={fairwayCondition}
                    onChange={(e) => setFairwayCondition(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select...</option>
                    <option value="poor">Poor</option>
                    <option value="fair">Fair</option>
                    <option value="good">Good</option>
                    <option value="excellent">Excellent</option>
                    <option value="pristine">Pristine</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#9CA3AF] mb-1 block">
                    Bunker Condition
                  </label>
                  <select
                    value={bunkerCondition}
                    onChange={(e) => setBunkerCondition(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select...</option>
                    <option value="poor">Poor</option>
                    <option value="fair">Fair</option>
                    <option value="good">Good</option>
                    <option value="excellent">Excellent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#9CA3AF] mb-1 block">
                    Rough Height
                  </label>
                  <select
                    value={roughHeight}
                    onChange={(e) => setRoughHeight(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select...</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="us_open">US Open</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#9CA3AF] mb-1 block">
                    Wind Conditions
                  </label>
                  <select
                    value={windConditions}
                    onChange={(e) => setWindConditions(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select...</option>
                    <option value="calm">Calm</option>
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="strong">Strong</option>
                    <option value="extreme">Extreme</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9CA3AF] mb-1 block">
                  Pace of Play (minutes for 18)
                </label>
                <input
                  type="number"
                  value={paceOfPlay}
                  onChange={(e) => setPaceOfPlay(e.target.value)}
                  placeholder="e.g. 270"
                  className={selectClass}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 rounded-lg border border-[#333] text-white text-sm"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 rounded-lg bg-[#00FF85] text-black font-semibold text-sm"
                >
                  Next — Details
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="text-xs text-[#9CA3AF] mb-1 block">
                  Overall Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      onClick={() => setOverallRating(i)}
                      className="p-1"
                    >
                      <Star
                        className={`w-7 h-7 ${i <= overallRating ? "text-[#00FF85] fill-[#00FF85]" : "text-[#333]"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9CA3AF] mb-1 block">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional observations..."
                  rows={3}
                  className={selectClass + " resize-none"}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 rounded-lg border border-[#333] text-white text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-[#00FF85] text-black font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Report
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Hub ──────────────────────────────── */
export function ConditionsHub() {
  const { data: session } = useSession();
  const [feed, setFeed] = useState<ConditionReport[]>([]);
  const [trending, setTrending] = useState<TrendingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [feedRes, trendingRes] = await Promise.all([
        fetch("/api/conditions/feed?limit=20"),
        fetch("/api/conditions/trending?limit=8"),
      ]);
      const [feedData, trendingData] = await Promise.all([
        feedRes.json(),
        trendingRes.json(),
      ]);
      setFeed(feedData.reports || []);
      setTrending(trendingData.trending || []);
    } catch (err) {
      console.error("Failed to load conditions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVote = async (id: number) => {
    if (!session) return;
    try {
      await fetch(`/api/conditions/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType: "helpful" }),
      });
      // Optimistic update
      setFeed((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, helpful_count: r.helpful_count + 1 } : r
        )
      );
    } catch (err) {
      console.error("Vote failed:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Course Conditions
            </h1>
            <p className="text-[#9CA3AF] mt-1">
              Real-time course conditions reported by golfers. The Waze of golf.
            </p>
          </div>
          {session && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#00FF85] text-black font-semibold text-sm hover:bg-[#00FF85]/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Report Conditions
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="w-5 h-5 text-[#00FF85]" />
            <h2 className="text-lg font-semibold text-white">Recent Reports</h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#111111] border border-[#222222] rounded-xl p-4 animate-pulse"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#222]" />
                    <div className="h-4 w-24 bg-[#222] rounded" />
                  </div>
                  <div className="h-4 w-48 bg-[#222] rounded mb-2" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 bg-[#222] rounded" />
                    <div className="h-6 w-20 bg-[#222] rounded" />
                    <div className="h-6 w-20 bg-[#222] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="bg-[#111111] border border-[#222222] rounded-xl p-8 text-center">
              <Cloud className="w-12 h-12 text-[#333] mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-1">
                No reports yet
              </h3>
              <p className="text-sm text-[#9CA3AF] mb-4">
                Be the first to report conditions at your local course.
              </p>
              {session && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 rounded-lg bg-[#00FF85] text-black font-semibold text-sm"
                >
                  Report Conditions
                </button>
              )}
            </div>
          ) : (
            feed.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onVote={handleVote}
              />
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Courses */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[#00FF85]" />
              <h3 className="text-sm font-semibold text-white">
                Trending Courses
              </h3>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-[#1a1a1a] rounded animate-pulse" />
                ))}
              </div>
            ) : trending.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">
                No trending courses yet.
              </p>
            ) : (
              <div className="space-y-2">
                {trending.map((course, idx) => (
                  <div
                    key={course.course_id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                  >
                    <span className="text-xs font-bold text-[#00FF85] w-5 text-center">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">
                        {course.course_name}
                      </div>
                      <div className="text-xs text-[#9CA3AF]">
                        {course.city}, {course.state} &middot;{" "}
                        {course.report_count} reports
                      </div>
                    </div>
                    {course.avg_rating && (
                      <div className="flex items-center gap-1 text-xs text-[#00FF85]">
                        <Star className="w-3 h-3 fill-[#00FF85]" />
                        {course.avg_rating}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How It Works */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">
              How It Works
            </h3>
            <div className="space-y-3">
              {[
                {
                  step: "1",
                  title: "Play a round",
                  desc: "Visit any course in our database",
                },
                {
                  step: "2",
                  title: "Report conditions",
                  desc: "Share green speed, fairway quality, pace & more",
                },
                {
                  step: "3",
                  title: "Help the community",
                  desc: "Other golfers see real-time conditions before they book",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#00FF85]/10 border border-[#00FF85]/30 flex items-center justify-center text-xs font-bold text-[#00FF85] flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium">
                      {item.title}
                    </div>
                    <div className="text-xs text-[#9CA3AF]">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Report Form Modal */}
      <ReportFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={fetchData}
      />
    </div>
  );
}
