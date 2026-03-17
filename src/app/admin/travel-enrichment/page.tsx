"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import {
  Plane,
  Utensils,
  Bed,
  Compass,
  Truck,
  Car,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Play,
  RefreshCw,
} from "lucide-react";

interface CoverageData {
  totalCourses: number;
  coverage: {
    dining: { count: number; pct: number };
    lodging: { count: number; pct: number };
    attractions: { count: number; pct: number };
    rvParks: { count: number; pct: number };
    airports: { count: number; pct: number };
    metroDistances: { count: number; pct: number };
  };
}

interface EnrichResult {
  total: number;
  enriched: number;
  skipped: number;
  errors?: string[];
}

export default function TravelEnrichmentPage() {
  const [coverage, setCoverage] = useState<CoverageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [result, setResult] = useState<EnrichResult | null>(null);
  const [batchSize, setBatchSize] = useState(10);
  const [overwrite, setOverwrite] = useState(false);

  const fetchCoverage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/travel-enrich", {
        headers: { "x-admin-key": "admin" },
      });
      if (res.ok) {
        const data = await res.json();
        setCoverage(data);
      }
    } catch (err) {
      console.error("Failed to fetch coverage:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoverage();
  }, [fetchCoverage]);

  const handleEnrich = async () => {
    setEnriching(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/travel-enrich", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": "admin",
        },
        body: JSON.stringify({ limit: batchSize, overwrite }),
      });
      const data = await res.json();
      setResult(data);
      // Refresh coverage after enrichment
      await fetchCoverage();
    } catch (err) {
      console.error("Enrichment failed:", err);
      setResult({ total: 0, enriched: 0, skipped: 0, errors: ["Request failed"] });
    } finally {
      setEnriching(false);
    }
  };

  const coverageItems = coverage
    ? [
        { label: "Dining", icon: <Utensils className="h-4 w-4" />, ...coverage.coverage.dining, color: "#f59e0b" },
        { label: "Lodging", icon: <Bed className="h-4 w-4" />, ...coverage.coverage.lodging, color: "#c084fc" },
        { label: "Attractions", icon: <Compass className="h-4 w-4" />, ...coverage.coverage.attractions, color: "#60a5fa" },
        { label: "RV Parks", icon: <Truck className="h-4 w-4" />, ...coverage.coverage.rvParks, color: "#4ade80" },
        { label: "Airports", icon: <Plane className="h-4 w-4" />, ...coverage.coverage.airports, color: "#38bdf8" },
        { label: "Metro Distances", icon: <Car className="h-4 w-4" />, ...coverage.coverage.metroDistances, color: "#a78bfa" },
      ]
    : [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
            Travel & Stay Enrichment
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--cg-text-muted)" }}>
            AI-powered travel data generation for golf courses
          </p>
        </div>
        <button
          onClick={fetchCoverage}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: "var(--cg-bg-secondary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)" }}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Coverage Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4 animate-pulse" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
              <div className="h-4 w-20 rounded mb-2" style={{ backgroundColor: "var(--cg-bg-tertiary)" }} />
              <div className="h-8 w-16 rounded" style={{ backgroundColor: "var(--cg-bg-tertiary)" }} />
            </div>
          ))
        ) : (
          coverageItems.map((item) => (
            <div key={item.label} className="rounded-xl p-4" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: item.color }}>{item.icon}</span>
                <span className="text-xs font-medium" style={{ color: "var(--cg-text-secondary)" }}>{item.label}</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>{item.count}</span>
                <span className="text-xs mb-1" style={{ color: "var(--cg-text-muted)" }}>
                  / {coverage?.totalCourses} ({item.pct}%)
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Enrichment Controls */}
      <div className="rounded-xl p-6" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--cg-text-primary)" }}>
          Batch Enrich
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--cg-text-muted)" }}>
          Generate travel & stay data for courses using AI. Top-ranked courses are processed first.
        </p>

        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--cg-text-secondary)" }}>
              Batch Size
            </label>
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--cg-bg-secondary)",
                color: "var(--cg-text-primary)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <option value={5}>5 courses</option>
              <option value={10}>10 courses</option>
              <option value={20}>20 courses</option>
              <option value={50}>50 courses</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="overwrite"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="overwrite" className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>
              Overwrite existing data
            </label>
          </div>

          <button
            onClick={handleEnrich}
            disabled={enriching}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: enriching ? "var(--cg-bg-tertiary)" : "#00E676",
              color: enriching ? "var(--cg-text-muted)" : "#111111",
            }}
          >
            {enriching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enriching...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Enrichment
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="rounded-lg p-4" style={{
            backgroundColor: result.errors?.length ? "rgba(239,68,68,0.1)" : "rgba(0,230,118,0.1)",
            border: `1px solid ${result.errors?.length ? "rgba(239,68,68,0.3)" : "rgba(0,230,118,0.3)"}`,
          }}>
            <div className="flex items-center gap-2 mb-2">
              {result.errors?.length ? (
                <AlertCircle className="h-4 w-4" style={{ color: "#f87171" }} />
              ) : (
                <CheckCircle2 className="h-4 w-4" style={{ color: "#00E676" }} />
              )}
              <span className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                Enrichment Complete
              </span>
            </div>
            <div className="text-sm space-y-1" style={{ color: "var(--cg-text-secondary)" }}>
              <p>Total courses: {result.total}</p>
              <p>Enriched: {result.enriched}</p>
              <p>Skipped (already had data): {result.skipped}</p>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium" style={{ color: "#f87171" }}>Errors ({result.errors.length}):</p>
                  <ul className="mt-1 space-y-1 text-xs" style={{ color: "var(--cg-text-muted)" }}>
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                    {result.errors.length > 5 && <li>...and {result.errors.length - 5} more</li>}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
