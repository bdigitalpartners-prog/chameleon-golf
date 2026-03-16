"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, ChevronDown, ChevronUp, Cloud, Droplets } from "lucide-react";

interface ConditionReport {
  id: number;
  courseId: number;
  courseName: string;
  greensSpeed: number;
  fairwayFirmness: number;
  roughHeight: number;
  bunkerCondition: number;
  overallCondition: number;
  weatherImpact: string | null;
  notes: string | null;
  author: {
    id: string;
    name: string;
    image: string | null;
  };
  createdAt: string;
}

interface ConditionsResponse {
  reports: ConditionReport[];
  total: number;
  page: number;
  limit: number;
}

interface Props {
  circleId: string;
}

const DIMENSIONS = [
  { key: "greensSpeed", label: "Greens Speed" },
  { key: "fairwayFirmness", label: "Fairway Firmness" },
  { key: "roughHeight", label: "Rough Height" },
  { key: "bunkerCondition", label: "Bunker Condition" },
  { key: "overallCondition", label: "Overall Condition" },
] as const;

type DimensionKey = (typeof DIMENSIONS)[number]["key"];

export function ConditionsTab({ circleId }: Props) {
  const [reports, setReports] = useState<ConditionReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [greensSpeed, setGreensSpeed] = useState(5);
  const [fairwayFirmness, setFairwayFirmness] = useState(5);
  const [roughHeight, setRoughHeight] = useState(5);
  const [bunkerCondition, setBunkerCondition] = useState(5);
  const [overallCondition, setOverallCondition] = useState(5);
  const [weatherImpact, setWeatherImpact] = useState("");
  const [notes, setNotes] = useState("");

  const limit = 20;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/circles/${circleId}/conditions?days=30&limit=${limit}&page=${page}`
      );
      if (!res.ok) throw new Error("Failed to load condition reports");
      const data: ConditionsResponse = await res.json();
      setReports(data.reports);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [circleId, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const resetForm = () => {
    setCourseId("");
    setGreensSpeed(5);
    setFairwayFirmness(5);
    setRoughHeight(5);
    setBunkerCondition(5);
    setOverallCondition(5);
    setWeatherImpact("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/conditions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: Number(courseId),
          greensSpeed,
          fairwayFirmness,
          roughHeight,
          bunkerCondition,
          overallCondition,
          weatherImpact: weatherImpact.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit report");
      resetForm();
      setFormOpen(false);
      setPage(1);
      await fetchReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate trend averages from displayed reports
  const averages = DIMENSIONS.reduce(
    (acc, dim) => {
      if (reports.length === 0) {
        acc[dim.key] = 0;
        return acc;
      }
      const sum = reports.reduce(
        (s, r) => s + (r[dim.key as DimensionKey] ?? 0),
        0
      );
      acc[dim.key] = Math.round((sum / reports.length) * 10) / 10;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const sliderSetter: Record<DimensionKey, (v: number) => void> = {
    greensSpeed: setGreensSpeed,
    fairwayFirmness: setFairwayFirmness,
    roughHeight: setRoughHeight,
    bunkerCondition: setBunkerCondition,
    overallCondition: setOverallCondition,
  };

  const sliderValue: Record<DimensionKey, number> = {
    greensSpeed,
    fairwayFirmness,
    roughHeight,
    bunkerCondition,
    overallCondition,
  };

  return (
    <div className="space-y-6">
      {/* Trend Indicators */}
      {!loading && reports.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--cg-bg-card)" }}
        >
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--cg-text-primary)" }}
          >
            30-Day Averages
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {DIMENSIONS.map((dim) => (
              <div
                key={dim.key}
                className="rounded-lg p-3 text-center"
                style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
              >
                <div
                  className="text-xs font-medium mb-1"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  {dim.label}
                </div>
                <div
                  className="text-lg font-bold"
                  style={{ color: "var(--cg-accent)" }}
                >
                  {averages[dim.key].toFixed(1)}
                  <span
                    className="text-xs font-normal"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    /10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Conditions Toggle Button */}
      <button
        onClick={() => setFormOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        style={{
          backgroundColor: "var(--cg-accent)",
          color: "var(--cg-text-inverse)",
        }}
      >
        {formOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Report Conditions
      </button>

      {/* Submit Form */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-5 space-y-4"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
          }}
        >
          {/* Course ID input */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Course ID
            </label>
            <input
              type="number"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="Enter course ID"
              required
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-primary)",
                border: "1px solid var(--cg-border)",
              }}
            />
          </div>

          {/* Sliders */}
          {DIMENSIONS.map((dim) => (
            <div key={dim.key}>
              <div className="flex items-center justify-between mb-1">
                <label
                  className="text-sm font-medium"
                  style={{ color: "var(--cg-text-primary)" }}
                >
                  {dim.label}
                </label>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--cg-accent)" }}
                >
                  {sliderValue[dim.key]}/10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={sliderValue[dim.key]}
                onChange={(e) =>
                  sliderSetter[dim.key](Number(e.target.value))
                }
                className="w-full accent-current"
                style={{ color: "var(--cg-accent)" }}
              />
            </div>
          ))}

          {/* Weather Impact */}
          <div>
            <label
              className="flex items-center gap-1.5 text-sm font-medium mb-1"
              style={{ color: "var(--cg-text-primary)" }}
            >
              <Cloud className="h-4 w-4" />
              Weather Impact
            </label>
            <input
              type="text"
              value={weatherImpact}
              onChange={(e) => setWeatherImpact(e.target.value)}
              placeholder="Dry, Wet, Frost delay..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-primary)",
                border: "1px solid var(--cg-border)",
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional observations..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-primary)",
                border: "1px solid var(--cg-border)",
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !courseId.trim()}
            className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: "var(--cg-accent)",
              color: "var(--cg-text-inverse)",
            }}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      )}

      {/* Report Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2
            className="h-6 w-6 animate-spin"
            style={{ color: "var(--cg-accent)" }}
          />
        </div>
      ) : error ? (
        <div
          className="rounded-xl p-6 text-center text-sm"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            color: "var(--cg-status-error, #ef4444)",
          }}
        >
          {error}
        </div>
      ) : reports.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: "var(--cg-bg-card)" }}
        >
          <Droplets
            className="h-10 w-10 mx-auto mb-3"
            style={{ color: "var(--cg-text-muted)" }}
          />
          <p
            className="text-sm font-medium"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            No condition reports yet
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--cg-text-muted)" }}
          >
            Be the first to report course conditions for your circle.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl p-4 space-y-3"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
            >
              {/* Author row */}
              <div className="flex items-center gap-3">
                {report.author.image ? (
                  <img
                    src={report.author.image}
                    alt={report.author.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: "var(--cg-accent-bg)",
                      color: "var(--cg-accent)",
                    }}
                  >
                    {report.author.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--cg-text-primary)" }}
                  >
                    {report.author.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    {new Date(report.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Course name */}
              <p
                className="text-sm font-medium"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                {report.courseName}
              </p>

              {/* Rating bars */}
              <div className="space-y-2">
                {DIMENSIONS.map((dim) => {
                  const value = report[dim.key as DimensionKey] ?? 0;
                  return (
                    <div key={dim.key}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className="text-xs"
                          style={{ color: "var(--cg-text-muted)" }}
                        >
                          {dim.label}
                        </span>
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "var(--cg-text-primary)" }}
                        >
                          {value}/10
                        </span>
                      </div>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(value / 10) * 100}%`,
                            backgroundColor: "var(--cg-accent)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Weather impact */}
              {report.weatherImpact && (
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                  style={{
                    backgroundColor: "var(--cg-accent-bg)",
                    color: "var(--cg-text-secondary)",
                  }}
                >
                  <Cloud className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{report.weatherImpact}</span>
                </div>
              )}

              {/* Notes */}
              {report.notes && (
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--cg-text-secondary)" }}
                >
                  {report.notes}
                </p>
              )}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-40"
                style={{
                  backgroundColor: "var(--cg-bg-secondary)",
                  color: "var(--cg-text-primary)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                <ChevronDown className="h-3.5 w-3.5 rotate-90" />
              </button>
              <span
                className="text-xs"
                style={{ color: "var(--cg-text-muted)" }}
              >
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-40"
                style={{
                  backgroundColor: "var(--cg-bg-secondary)",
                  color: "var(--cg-text-primary)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                <ChevronUp className="h-3.5 w-3.5 rotate-90" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
