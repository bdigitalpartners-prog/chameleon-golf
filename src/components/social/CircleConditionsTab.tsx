"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  X,
  CloudRain,
  Sun,
  Snowflake,
  Droplets,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const WEATHER_OPTIONS = ["Dry", "Wet", "Frost Delay", "Cart Path Only", "Wind Advisory"];

interface ConditionReportData {
  id: string;
  courseId: number;
  greensSpeed: number | null;
  fairwayFirmness: number | null;
  roughHeight: number | null;
  bunkerCondition: number | null;
  overallCondition: number | null;
  weatherImpact: string | null;
  notes: string | null;
  reportDate: string;
  user: { id: string; name: string; image: string | null };
  course: { courseId: number; courseName: string };
}

function RatingBar({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-24 flex-shrink-0" style={{ color: "var(--cg-text-muted)" }}>
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${(value / 10) * 100}%`,
            backgroundColor:
              value >= 7 ? "#22c55e" : value >= 4 ? "var(--cg-accent)" : "var(--cg-status-error, #ef4444)",
          }}
        />
      </div>
      <span className="text-xs font-medium w-6 text-right" style={{ color: "var(--cg-text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

export function CircleConditionsTab({ circleId }: { circleId: string }) {
  const [reports, setReports] = useState<ConditionReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form state
  const [form, setForm] = useState({
    courseId: "",
    greensSpeed: 5,
    fairwayFirmness: 5,
    roughHeight: 5,
    bunkerCondition: 5,
    overallCondition: 5,
    weatherImpact: "",
    notes: "",
  });

  useEffect(() => {
    fetchReports();
  }, [circleId, page]);

  useEffect(() => {
    // Fetch circle courses for the selector
    fetch(`/api/circles/${circleId}/courses?limit=50`)
      .then((r) => r.json())
      .then((data) => {
        const courseList = (data.courses ?? []).map((c: any) => ({
          courseId: c.course?.courseId ?? c.courseId,
          courseName: c.course?.courseName ?? c.courseName,
        }));
        setCourses(courseList);
        if (courseList.length > 0 && !form.courseId) {
          setForm((f) => ({ ...f, courseId: String(courseList[0].courseId) }));
        }
      })
      .catch(console.error);
  }, [circleId]);

  const fetchReports = () => {
    setLoading(true);
    fetch(`/api/circles/${circleId}/conditions?page=${page}&limit=10`)
      .then((r) => r.json())
      .then((data) => {
        setReports(data.reports ?? []);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleSubmit = async () => {
    if (!form.courseId) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/circles/${circleId}/conditions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: Number(form.courseId),
          greensSpeed: form.greensSpeed,
          fairwayFirmness: form.fairwayFirmness,
          roughHeight: form.roughHeight,
          bunkerCondition: form.bunkerCondition,
          overallCondition: form.overallCondition,
          weatherImpact: form.weatherImpact || null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setShowForm(false);
      setForm({ courseId: form.courseId, greensSpeed: 5, fairwayFirmness: 5, roughHeight: 5, bunkerCondition: 5, overallCondition: 5, weatherImpact: "", notes: "" });
      fetchReports();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
          Course Conditions
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium"
          style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
        >
          {showForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {showForm ? "Cancel" : "Report"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--cg-status-error, #ef4444)" }}>
          {error}
        </div>
      )}

      {/* Submit form */}
      {showForm && (
        <div
          className="rounded-xl p-4 space-y-4"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          {/* Course selector */}
          {courses.length > 1 && (
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--cg-text-muted)" }}>
                Course
              </label>
              <select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
              >
                {courses.map((c) => (
                  <option key={c.courseId} value={c.courseId}>
                    {c.courseName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sliders */}
          {[
            { key: "greensSpeed", label: "Greens Speed" },
            { key: "fairwayFirmness", label: "Fairway Firmness" },
            { key: "roughHeight", label: "Rough Height" },
            { key: "bunkerCondition", label: "Bunker Condition" },
            { key: "overallCondition", label: "Overall" },
          ].map(({ key, label }) => (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: "var(--cg-text-muted)" }}>{label}</span>
                <span style={{ color: "var(--cg-text-primary)" }}>{(form as any)[key]}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                className="w-full accent-[var(--cg-accent)]"
              />
            </div>
          ))}

          {/* Weather */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--cg-text-muted)" }}>
              Weather Impact
            </label>
            <div className="flex flex-wrap gap-2">
              {WEATHER_OPTIONS.map((w) => (
                <button
                  key={w}
                  onClick={() => setForm({ ...form, weatherImpact: form.weatherImpact === w ? "" : w })}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-all"
                  style={{
                    backgroundColor: form.weatherImpact === w ? "var(--cg-accent-bg)" : "var(--cg-bg-tertiary)",
                    color: form.weatherImpact === w ? "var(--cg-accent)" : "var(--cg-text-secondary)",
                    border: `1px solid ${form.weatherImpact === w ? "var(--cg-accent)" : "var(--cg-border)"}`,
                  }}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--cg-text-muted)" }}>
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Additional observations..."
              className="w-full rounded-lg px-3 py-2 text-sm resize-none"
              style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)", border: "1px solid var(--cg-border)" }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-lg py-2 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Submit Report"}
          </button>
        </div>
      )}

      {/* Reports list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
        </div>
      ) : reports.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
            No condition reports yet. Be the first to submit one!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl p-4"
              style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                >
                  {report.user?.image ? (
                    <img src={report.user.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-medium" style={{ color: "var(--cg-text-muted)" }}>
                      {report.user?.name?.[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--cg-text-primary)" }}>
                    {report.user?.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                    {report.course?.courseName} · {new Date(report.reportDate).toLocaleDateString()}
                  </p>
                </div>
                {report.weatherImpact && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
                  >
                    {report.weatherImpact}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <RatingBar label="Greens" value={report.greensSpeed} />
                <RatingBar label="Fairways" value={report.fairwayFirmness} />
                <RatingBar label="Rough" value={report.roughHeight} />
                <RatingBar label="Bunkers" value={report.bunkerCondition} />
                <RatingBar label="Overall" value={report.overallCondition} />
              </div>

              {report.notes && (
                <p className="mt-2 text-sm" style={{ color: "var(--cg-text-secondary)" }}>
                  {report.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
          >
            Previous
          </button>
          <span className="flex items-center text-sm" style={{ color: "var(--cg-text-muted)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
