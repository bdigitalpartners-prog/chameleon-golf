"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback } from "react";
import {
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Utensils,
  Bed,
  Compass,
  Truck,
  Trash2,
  Play,
  RefreshCw,
} from "lucide-react";

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

interface POISummary {
  courseId: number;
  courseName: string;
  dining: number;
  lodging: number;
  attractions: number;
  rvParks: number;
  total: number;
}

interface GenerateResult {
  total: number;
  generated: number;
  skipped: number;
  errors?: string[];
}

export default function AdminPOIsPage() {
  const [courseSearch, setCourseSearch] = useState("");
  const [courseId, setCourseId] = useState<number | null>(null);
  const [pois, setPois] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState("");
  const [batchLimit, setBatchLimit] = useState(50);
  const [batchOverwrite, setBatchOverwrite] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    "x-admin-key": getAdminKey(),
  };

  const loadPOIs = useCallback(async (id: number) => {
    setLoading(true);
    setError("");
    setPois(null);
    setCourseId(id);
    try {
      const res = await fetch(`/api/admin/pois?courseId=${id}`, { headers });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPois(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => {
    const id = parseInt(courseSearch);
    if (!isNaN(id)) loadPOIs(id);
  };

  const generateForCourse = async () => {
    if (!courseId) return;
    setGenerating(true);
    setGenerateResult(null);
    try {
      const res = await fetch("/api/admin/pois/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ courseIds: [courseId], overwrite: true }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setGenerateResult(data);
      loadPOIs(courseId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const batchGenerate = async () => {
    setGenerating(true);
    setGenerateResult(null);
    setError("");
    try {
      const res = await fetch("/api/admin/pois/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ limit: batchLimit, overwrite: batchOverwrite }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setGenerateResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const deleteAllForCourse = async () => {
    if (!courseId || !confirm(`Delete ALL POIs for course ${courseId}?`)) return;
    try {
      const res = await fetch("/api/admin/pois", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) throw new Error(await res.text());
      loadPOIs(courseId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteSinglePOI = async (id: number, category: string) => {
    if (!confirm(`Delete this ${category} POI?`)) return;
    try {
      const res = await fetch(`/api/admin/pois/${id}?category=${category}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error(await res.text());
      if (courseId) loadPOIs(courseId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const totalCount = pois
    ? (pois.dining?.length || 0) + (pois.lodging?.length || 0) + (pois.attractions?.length || 0) + (pois.rvParks?.length || 0)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">POI Management</h1>
        <p className="text-sm text-gray-400 mt-1">
          Generate and manage nearby Points of Interest for courses
        </p>
      </div>

      {/* Batch Generation */}
      <div className="rounded-xl border border-gray-800 bg-[#111111] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Batch Generation</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Limit (max 200)</label>
            <input
              type="number"
              min={1}
              max={200}
              value={batchLimit}
              onChange={(e) => setBatchLimit(Math.min(200, parseInt(e.target.value) || 50))}
              className="w-24 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={batchOverwrite}
              onChange={(e) => setBatchOverwrite(e.target.checked)}
              className="rounded border-gray-700"
            />
            Overwrite existing
          </label>
          <button
            onClick={batchGenerate}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Generate Top {batchLimit} Courses
          </button>
        </div>

        {generateResult && (
          <div className="mt-4 rounded-lg border border-gray-700 bg-gray-900/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-white">Generation Complete</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Total processed:</span>{" "}
                <span className="text-white font-medium">{generateResult.total}</span>
              </div>
              <div>
                <span className="text-gray-400">Generated:</span>{" "}
                <span className="text-green-400 font-medium">{generateResult.generated}</span>
              </div>
              <div>
                <span className="text-gray-400">Skipped:</span>{" "}
                <span className="text-yellow-400 font-medium">{generateResult.skipped}</span>
              </div>
            </div>
            {generateResult.errors && generateResult.errors.length > 0 && (
              <div className="mt-2 text-xs text-red-400">
                {generateResult.errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Course Lookup */}
      <div className="rounded-xl border border-gray-800 bg-[#111111] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Course POIs</h2>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Enter Course ID..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 pl-10 pr-3 py-2 text-sm text-white placeholder-gray-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load"}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {courseId && pois && (
          <div className="space-y-4">
            {/* Summary bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-white font-medium">Course #{courseId}</span>
                <span className="text-gray-400">{totalCount} POIs total</span>
                <span className="flex items-center gap-1 text-yellow-400">
                  <Utensils className="h-3.5 w-3.5" /> {pois.dining?.length || 0}
                </span>
                <span className="flex items-center gap-1 text-purple-400">
                  <Bed className="h-3.5 w-3.5" /> {pois.lodging?.length || 0}
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <Compass className="h-3.5 w-3.5" /> {pois.attractions?.length || 0}
                </span>
                <span className="flex items-center gap-1 text-green-400">
                  <Truck className="h-3.5 w-3.5" /> {pois.rvParks?.length || 0}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={generateForCourse}
                  disabled={generating}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600/20 border border-green-600/30 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-600/30 disabled:opacity-50 transition-colors"
                >
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Regenerate
                </button>
                <button
                  onClick={deleteAllForCourse}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600/20 border border-red-600/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-600/30 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete All
                </button>
              </div>
            </div>

            {/* Dining */}
            {pois.dining?.length > 0 && (
              <POISection
                title="Dining"
                icon={<Utensils className="h-4 w-4 text-yellow-400" />}
                items={pois.dining}
                category="dining"
                onDelete={deleteSinglePOI}
                renderItem={(d: any) => (
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="text-sm text-white font-medium">{d.name}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        {d.cuisineType && <span>{d.cuisineType}</span>}
                        {d.priceLevel && <span className="text-yellow-400">{d.priceLevel}</span>}
                        {d.rating && <span>★ {parseFloat(d.rating).toFixed(1)}</span>}
                        {d.distanceMiles && <span>{parseFloat(d.distanceMiles).toFixed(1)} mi</span>}
                        {d.isOnSite && <span className="text-green-400">On-Site</span>}
                      </div>
                    </div>
                  </div>
                )}
              />
            )}

            {/* Lodging */}
            {pois.lodging?.length > 0 && (
              <POISection
                title="Lodging"
                icon={<Bed className="h-4 w-4 text-purple-400" />}
                items={pois.lodging}
                category="lodging"
                onDelete={deleteSinglePOI}
                renderItem={(l: any) => (
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="text-sm text-white font-medium">{l.name}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        {l.lodgingType && <span>{l.lodgingType}</span>}
                        {l.priceTier && <span className="text-yellow-400">{l.priceTier}</span>}
                        {l.rating && <span>★ {parseFloat(l.rating).toFixed(1)}</span>}
                        {l.distanceMiles && <span>{parseFloat(l.distanceMiles).toFixed(1)} mi</span>}
                        {l.isOnSite && <span className="text-green-400">On-Site</span>}
                        {l.isPartner && <span className="text-purple-400">Partner</span>}
                      </div>
                    </div>
                  </div>
                )}
              />
            )}

            {/* Attractions */}
            {pois.attractions?.length > 0 && (
              <POISection
                title="Attractions"
                icon={<Compass className="h-4 w-4 text-blue-400" />}
                items={pois.attractions}
                category="attraction"
                onDelete={deleteSinglePOI}
                renderItem={(a: any) => (
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="text-sm text-white font-medium">{a.name}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        {a.category && <span>{a.category}</span>}
                        {a.rating && <span>★ {parseFloat(a.rating).toFixed(1)}</span>}
                        {a.distanceMiles && <span>{parseFloat(a.distanceMiles).toFixed(1)} mi</span>}
                      </div>
                    </div>
                  </div>
                )}
              />
            )}

            {/* RV Parks */}
            {pois.rvParks?.length > 0 && (
              <POISection
                title="RV Parks"
                icon={<Truck className="h-4 w-4 text-green-400" />}
                items={pois.rvParks}
                category="rv_park"
                onDelete={deleteSinglePOI}
                renderItem={(r: any) => (
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="text-sm text-white font-medium">{r.name}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        {r.priceLevel && <span className="text-yellow-400">{r.priceLevel}</span>}
                        {r.rating && <span>★ {parseFloat(r.rating).toFixed(1)}</span>}
                        {r.distanceMiles && <span>{parseFloat(r.distanceMiles).toFixed(1)} mi</span>}
                        {r.numSites && <span>{r.numSites} sites</span>}
                        {r.hookups && <span>{r.hookups}</span>}
                      </div>
                    </div>
                  </div>
                )}
              />
            )}

            {totalCount === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No POIs found for this course. Click &quot;Regenerate&quot; to create them.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function POISection({
  title,
  icon,
  items,
  category,
  onDelete,
  renderItem,
}: {
  title: string;
  icon: React.ReactNode;
  items: any[];
  category: string;
  onDelete: (id: number, category: string) => void;
  renderItem: (item: any) => React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-xs text-gray-500">({items.length})</span>
      </div>
      <div className="space-y-1">
        {items.map((item: any) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg px-3 py-2 group hover:bg-gray-800/50"
            style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
          >
            <div className="flex-1 min-w-0">{renderItem(item)}</div>
            <button
              onClick={() => onDelete(item.id, category)}
              className="opacity-0 group-hover:opacity-100 ml-2 text-red-400 hover:text-red-300 transition-opacity"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
