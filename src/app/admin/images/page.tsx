"use client";

import { useState, useEffect, useCallback } from "react";
import { ImageIcon, Search, Filter } from "lucide-react";

interface CourseMediaImage {
  mediaId: number;
  courseId: number;
  url: string;
  caption: string | null;
  credit: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  isActive: boolean;
  isPrimary: boolean;
  course: { courseId: number; courseName: string };
}

interface SourceGroup {
  total: number;
  active: number;
}

function getAdminKey(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("key") || sessionStorage.getItem("golfEQ_admin_key");
}

function adminHeaders(): HeadersInit {
  const key = getAdminKey();
  return key ? { "Content-Type": "application/json", "x-admin-key": key } : { "Content-Type": "application/json" };
}

export default function AdminImagesPage() {
  const [images, setImages] = useState<CourseMediaImage[]>([]);
  const [sourceGroups, setSourceGroups] = useState<Record<string, SourceGroup>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<Set<number>>(new Set());
  const [togglingSource, setTogglingSource] = useState<Set<string>>(new Set());

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "active") params.set("isActive", "true");
      if (filter === "inactive") params.set("isActive", "false");

      const res = await fetch(`/api/admin/images?${params}`, { headers: adminHeaders() });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setImages(data.images);
      setSourceGroups(data.sourceGroups);
    } catch (err) {
      console.error("Fetch images error:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const toggleImage = async (mediaId: number, newActive: boolean) => {
    setToggling((prev) => new Set(prev).add(mediaId));
    try {
      const res = await fetch("/api/admin/images/toggle", {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ ids: [mediaId], isActive: newActive }),
      });
      if (res.ok) {
        setImages((prev) =>
          prev.map((img) => (img.mediaId === mediaId ? { ...img, isActive: newActive } : img))
        );
        // Update source group counts
        setSourceGroups((prev) => {
          const updated = { ...prev };
          const img = images.find((i) => i.mediaId === mediaId);
          if (img?.sourceName && updated[img.sourceName]) {
            updated[img.sourceName] = {
              ...updated[img.sourceName],
              active: updated[img.sourceName].active + (newActive ? 1 : -1),
            };
          }
          return updated;
        });
      }
    } catch (err) {
      console.error("Toggle error:", err);
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(mediaId);
        return next;
      });
    }
  };

  const toggleSource = async (sourceName: string, newActive: boolean) => {
    setTogglingSource((prev) => new Set(prev).add(sourceName));
    try {
      const res = await fetch("/api/admin/images/toggle-source", {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ sourceName, isActive: newActive }),
      });
      if (res.ok) {
        setImages((prev) =>
          prev.map((img) => (img.sourceName === sourceName ? { ...img, isActive: newActive } : img))
        );
        setSourceGroups((prev) => {
          const updated = { ...prev };
          if (updated[sourceName]) {
            updated[sourceName] = {
              ...updated[sourceName],
              active: newActive ? updated[sourceName].total : 0,
            };
          }
          return updated;
        });
      }
    } catch (err) {
      console.error("Source toggle error:", err);
    } finally {
      setTogglingSource((prev) => {
        const next = new Set(prev);
        next.delete(sourceName);
        return next;
      });
    }
  };

  const filteredImages = images.filter((img) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      img.course.courseName.toLowerCase().includes(q) ||
      (img.credit && img.credit.toLowerCase().includes(q)) ||
      (img.sourceName && img.sourceName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Affiliate Images</h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage affiliate course images and takedown controls
        </p>
      </div>

      {/* Source-level toggles */}
      {Object.keys(sourceGroups).length > 0 && (
        <div className="rounded-lg border border-gray-800 bg-[#111111] p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Source Controls</h2>
          <div className="space-y-3">
            {Object.entries(sourceGroups).map(([source, counts]) => {
              const allActive = counts.active === counts.total;
              const isSourceToggling = togglingSource.has(source);
              return (
                <div key={source} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-white">{source}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {counts.active}/{counts.total} active
                    </span>
                  </div>
                  <button
                    onClick={() => toggleSource(source, !allActive)}
                    disabled={isSourceToggling}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      allActive ? "bg-green-500" : "bg-gray-600"
                    } ${isSourceToggling ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        allActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by course, photographer, or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-[#111111] py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-green-500/10 text-green-500 border border-green-500/30"
                  : "bg-[#111111] text-gray-400 border border-gray-700 hover:text-white"
              }`}
            >
              <Filter className="inline h-3 w-3 mr-1" />
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Images table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-sm text-gray-400">Loading images...</div>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ImageIcon className="h-12 w-12 text-gray-600 mb-3" />
          <p className="text-sm text-gray-400">No affiliate images found</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#111111]">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Photographer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredImages.map((img) => {
                const isToggling = toggling.has(img.mediaId);
                return (
                  <tr key={img.mediaId} className="hover:bg-gray-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="h-12 w-20 overflow-hidden rounded bg-gray-800">
                        <img
                          src={img.url}
                          alt={img.course.courseName}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-white">{img.course.courseName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400">{img.sourceName || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400">{img.credit || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          img.isActive
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {img.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleImage(img.mediaId, !img.isActive)}
                        disabled={isToggling}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          img.isActive ? "bg-green-500" : "bg-gray-600"
                        } ${isToggling ? "opacity-50" : ""}`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            img.isActive ? "translate-x-4.5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
