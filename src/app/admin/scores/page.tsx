"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Calculator, RefreshCw, CheckCircle, AlertCircle, Clock, BarChart3 } from "lucide-react";

interface ScoreStatus {
  totalCourses: number;
  coursesWithScores: number;
  coursesWithDimensions: number;
  coursesWithPrestige: number;
  lastComputedAt: string | null;
}

interface ComputeResult {
  success: boolean;
  processed: number;
  withPrestige: number;
  withDimensions: number;
  errors: string[];
  durationMs: number;
}

export default function AdminScoresPage() {
  const [status, setStatus] = useState<ScoreStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [result, setResult] = useState<ComputeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAdminKey = () =>
    typeof window !== "undefined" ? sessionStorage.getItem("golfEQ_admin_key") || "" : "";

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/compute-scores", {
        headers: { "x-admin-key": getAdminKey() },
      });
      if (!res.ok) throw new Error("Failed to fetch status");
      const data = await res.json();
      setStatus(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleCompute = async () => {
    setComputing(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/compute-scores", {
        method: "POST",
        headers: { "x-admin-key": getAdminKey() },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Computation failed");
      }
      const data = await res.json();
      setResult(data);
      await fetchStatus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Computation failed");
    } finally {
      setComputing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-400">Loading score status...</div>
      </div>
    );
  }

  const coverage = status
    ? Math.round((status.coursesWithDimensions / status.totalCourses) * 100)
    : 0;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Chameleon Scores</h1>
          <p className="mt-1 text-sm text-gray-400">
            Compute and manage dimension scores for the Equalizer
          </p>
        </div>
        <button
          onClick={handleCompute}
          disabled={computing}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          {computing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Calculator className="h-4 w-4" />
          )}
          {computing ? "Computing..." : "Compute All Scores"}
        </button>
      </div>

      {/* Status Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Total Courses"
          value={status?.totalCourses?.toLocaleString() || "0"}
          color="text-blue-500"
        />
        <StatusCard
          icon={<CheckCircle className="h-5 w-5" />}
          label="With Dimension Scores"
          value={status?.coursesWithDimensions?.toLocaleString() || "0"}
          subtitle={`${coverage}% coverage`}
          color="text-green-500"
        />
        <StatusCard
          icon={<Calculator className="h-5 w-5" />}
          label="With Prestige Scores"
          value={status?.coursesWithPrestige?.toLocaleString() || "0"}
          color="text-purple-500"
        />
        <StatusCard
          icon={<Clock className="h-5 w-5" />}
          label="Last Computed"
          value={
            status?.lastComputedAt
              ? new Date(status.lastComputedAt).toLocaleDateString()
              : "Never"
          }
          subtitle={
            status?.lastComputedAt
              ? new Date(status.lastComputedAt).toLocaleTimeString()
              : undefined
          }
          color="text-amber-500"
        />
      </div>

      {/* Coverage Progress */}
      <div className="mb-8 rounded-xl border border-gray-800 bg-[#111111] p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Score Coverage
        </h2>
        <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${coverage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{status?.coursesWithDimensions || 0} courses scored</span>
          <span>{status?.totalCourses || 0} total courses</span>
        </div>
      </div>

      {/* Computation Result */}
      {result && (
        <div className="mb-8 rounded-xl border border-green-800/50 bg-green-900/10 p-5">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h2 className="text-sm font-semibold text-green-400">
              Computation Complete
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <div className="text-gray-500">Processed</div>
              <div className="font-bold text-white">{result.processed.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500">With Prestige</div>
              <div className="font-bold text-white">{result.withPrestige.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500">With Dimensions</div>
              <div className="font-bold text-white">{result.withDimensions.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500">Duration</div>
              <div className="font-bold text-white">{(result.durationMs / 1000).toFixed(1)}s</div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4">
              <div className="mb-1 flex items-center gap-1 text-sm text-amber-400">
                <AlertCircle className="h-4 w-4" />
                {result.errors.length} errors
              </div>
              <div className="max-h-40 overflow-y-auto rounded bg-gray-900 p-3 text-xs text-gray-400">
                {result.errors.map((err, i) => (
                  <div key={i} className="mb-1">{err}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-8 rounded-xl border border-red-800/50 bg-red-900/10 p-5">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="rounded-xl border border-gray-800 bg-[#111111] p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Dimension Scoring Engine
        </h2>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          {[
            { dim: "Architecture (Layout & Design)", desc: "Architect reputation, course age, Golden Age bonus" },
            { dim: "Challenge", desc: "Slope rating, course rating, yardage from champion tees" },
            { dim: "Aesthetics", desc: "Location, course style (links/coastal = higher), scenic state" },
            { dim: "Conditioning", desc: "Access type, green fees, grass types, prestige correlation" },
            { dim: "Value", desc: "Fee level inverse to quality — affordable + good = high value" },
            { dim: "Walkability", desc: "Walking policy, course style, terrain indicators" },
            { dim: "Pace of Play", desc: "Access type, walking policy, course style" },
            { dim: "Amenities", desc: "Practice facilities, resort affiliation, fee level" },
            { dim: "Service", desc: "Access type, fee level, prestige correlation" },
            { dim: "Prestige (Expert Rankings)", desc: "Ranking appearances, position weight, source authority" },
          ].map((item) => (
            <div key={item.dim} className="rounded-lg border border-gray-800 p-3">
              <div className="font-medium text-white">{item.dim}</div>
              <div className="mt-1 text-xs text-gray-500">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#111111] p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className={color}>{icon}</div>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
}
