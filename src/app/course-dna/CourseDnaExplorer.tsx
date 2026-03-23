"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Dna,
  Search,
  X,
  Plus,
  Loader2,
  ChevronRight,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { DnaRadarChart } from "@/components/course-dna/RadarChart";

/* ─── Types ────────────────────────────────────────── */
interface DnaDimension {
  key: string;
  label: string;
  value: number;
  description?: string;
}

interface CourseProfile {
  courseId: number;
  courseName: string;
  city?: string;
  state?: string;
  dimensions: DnaDimension[];
  dataSources?: string[];
  confidenceScore?: number;
}

interface SimilarCourse {
  courseId: number;
  courseName: string;
  city: string;
  state: string;
  similarity: number;
}

interface CourseSearchResult {
  courseId: number;
  courseName: string;
  city: string;
  state: string;
}

/* ─── Constants ────────────────────────────────────── */
const COMPARE_COLORS = ["#00FF85", "#3B82F6", "#F59E0B", "#EF4444"];

/* ─── Skeleton ─────────────────────────────────────── */
function RadarSkeleton() {
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-xl p-6 animate-pulse">
      <div className="h-5 bg-[#222] rounded w-48 mb-6" />
      <div className="w-full h-[400px] bg-[#1A1A1A] rounded-lg" />
    </div>
  );
}

function DimensionBarSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-3 bg-[#222] rounded w-28" />
          <div className="flex-1 h-3 bg-[#1A1A1A] rounded" />
        </div>
      ))}
    </div>
  );
}

/* ─── Dimension Bar ────────────────────────────────── */
function DimensionBar({ dim }: { dim: DnaDimension }) {
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-[#9CA3AF] group-hover:text-white transition-colors">
          {dim.label}
        </span>
        <span className="text-sm font-mono font-semibold text-white">{dim.value}</span>
      </div>
      <div className="w-full h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${dim.value}%`,
            backgroundColor: dim.value >= 80 ? "#00FF85" : dim.value >= 50 ? "#3B82F6" : "#666",
          }}
        />
      </div>
      {dim.description && (
        <p className="text-xs text-[#666] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {dim.description}
        </p>
      )}
    </div>
  );
}

/* ─── Main Component ───────────────────────────────── */
export function CourseDnaExplorer() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CourseSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Single course view
  const [selectedProfile, setSelectedProfile] = useState<CourseProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [similarCourses, setSimilarCourses] = useState<SimilarCourse[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareProfiles, setCompareProfiles] = useState<CourseProfile[]>([]);
  const [loadingCompare, setLoadingCompare] = useState(false);

  // Featured profiles
  const [featuredProfiles, setFeaturedProfiles] = useState<CourseProfile[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Search courses from the courses table
  const searchCourses = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/courses/search?q=${encodeURIComponent(query)}&limit=8`);
      const data = await res.json();
      setSearchResults(
        (data.courses ?? data ?? []).map((c: any) => ({
          courseId: c.courseId ?? c.id,
          courseName: c.courseName ?? c.name,
          city: c.city ?? "",
          state: c.state ?? "",
        }))
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => searchCourses(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchCourses]);

  // Load DNA profile
  const loadProfile = useCallback(async (courseId: number) => {
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/course-dna?courseId=${courseId}`);
      if (!res.ok) {
        setSelectedProfile(null);
        return;
      }
      const data = await res.json();
      setSelectedProfile(data);
      setShowSearch(false);
      setSearchQuery("");

      // Load similar courses
      setLoadingSimilar(true);
      const simRes = await fetch(`/api/course-dna/similar?courseId=${courseId}&limit=6`);
      if (simRes.ok) {
        const simData = await simRes.json();
        setSimilarCourses(simData.similar ?? []);
      }
    } catch {
      setSelectedProfile(null);
    } finally {
      setLoadingProfile(false);
      setLoadingSimilar(false);
    }
  }, []);

  // Add to comparison
  const addToCompare = useCallback(
    async (courseId: number) => {
      if (compareProfiles.length >= 4) return;
      if (compareProfiles.some((p) => p.courseId === courseId)) return;

      setLoadingCompare(true);
      try {
        const res = await fetch(`/api/course-dna?courseId=${courseId}`);
        if (res.ok) {
          const data = await res.json();
          setCompareProfiles((prev) => [...prev, data]);
        }
      } catch {
        // ignore
      } finally {
        setLoadingCompare(false);
        setSearchQuery("");
        setShowSearch(false);
      }
    },
    [compareProfiles]
  );

  const removeFromCompare = (courseId: number) => {
    setCompareProfiles((prev) => prev.filter((p) => p.courseId !== courseId));
  };

  // Load featured DNA profiles on mount
  useEffect(() => {
    async function loadFeatured() {
      setLoadingFeatured(true);
      try {
        // Try to get a few known profiles
        const ids = [1, 2, 3, 4, 5, 6];
        const profiles: CourseProfile[] = [];
        for (const id of ids) {
          try {
            const res = await fetch(`/api/course-dna?courseId=${id}`);
            if (res.ok) {
              const data = await res.json();
              profiles.push(data);
              if (profiles.length >= 4) break;
            }
          } catch {
            // skip
          }
        }
        setFeaturedProfiles(profiles);
      } finally {
        setLoadingFeatured(false);
      }
    }
    loadFeatured();
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      {/* ─── Hero Section ─── */}
      <div className="relative overflow-hidden border-b border-[#222]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00FF85]/5 via-transparent to-[#3B82F6]/5" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-20">
          <div className="flex items-center gap-3 mb-4">
            <Dna className="w-8 h-8 text-[#00FF85]" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Course DNA Fingerprint</h1>
          </div>
          <p className="text-[#9CA3AF] text-lg max-w-2xl mb-8">
            Every course has a unique genetic code. We map it across 12 dimensions — from shot variety to conditioning standards — revealing the true character of every layout.
          </p>

          {/* Mode toggles */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setCompareMode(false);
                setCompareProfiles([]);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                !compareMode
                  ? "bg-[#00FF85] text-black"
                  : "bg-[#111111] border border-[#222222] text-[#9CA3AF] hover:text-white"
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => {
                setCompareMode(true);
                setSelectedProfile(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                compareMode
                  ? "bg-[#00FF85] text-black"
                  : "bg-[#111111] border border-[#222222] text-[#9CA3AF] hover:text-white"
              }`}
            >
              Compare DNA
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ─── Search ─── */}
        <section className="mb-8">
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder={
                compareMode
                  ? "Search courses to compare DNA..."
                  : "Search for a course to see its DNA..."
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              className="w-full bg-[#111111] border border-[#222222] rounded-lg pl-9 pr-4 py-3 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#00FF85]/50 transition-colors"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] animate-spin" />
            )}

            {/* Search dropdown */}
            {showSearch && searchResults.length > 0 && (
              <div className="absolute z-20 top-full mt-1 w-full bg-[#111111] border border-[#222222] rounded-lg shadow-xl max-h-64 overflow-y-auto">
                {searchResults.map((c) => (
                  <button
                    key={c.courseId}
                    onClick={() => {
                      if (compareMode) {
                        addToCompare(c.courseId);
                      } else {
                        loadProfile(c.courseId);
                      }
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-[#1A1A1A] transition-colors border-b border-[#222222] last:border-0"
                  >
                    <div className="text-white text-sm font-medium">{c.courseName}</div>
                    {c.city && c.state && (
                      <div className="text-xs text-[#666]">
                        {c.city}, {c.state}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─── Compare Mode ─── */}
        {compareMode && (
          <section className="mb-10">
            {/* Selected courses pills */}
            {compareProfiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {compareProfiles.map((p, i) => (
                  <div
                    key={p.courseId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm"
                    style={{
                      borderColor: COMPARE_COLORS[i],
                      color: COMPARE_COLORS[i],
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COMPARE_COLORS[i] }}
                    />
                    {p.courseName}
                    <button
                      onClick={() => removeFromCompare(p.courseId)}
                      className="ml-1 hover:opacity-70"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {compareProfiles.length < 4 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-[#333] text-[#666] text-sm">
                    <Plus className="w-3.5 h-3.5" />
                    Add course ({4 - compareProfiles.length} remaining)
                  </div>
                )}
              </div>
            )}

            {/* Comparison chart */}
            {compareProfiles.length >= 2 ? (
              <div className="bg-[#111111] border border-[#222222] rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">DNA Comparison</h3>
                <DnaRadarChart
                  courses={compareProfiles.map((p, i) => ({
                    ...p,
                    color: COMPARE_COLORS[i],
                  }))}
                />
              </div>
            ) : (
              <div className="bg-[#111111] border border-[#222222] rounded-xl p-12 text-center">
                <BarChart3 className="w-12 h-12 text-[#333] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Select Courses to Compare</h3>
                <p className="text-[#9CA3AF] text-sm">
                  Search and select 2-4 courses above to see their DNA profiles overlaid.
                </p>
              </div>
            )}
          </section>
        )}

        {/* ─── Single Profile View ─── */}
        {!compareMode && (
          <>
            {loadingProfile ? (
              <RadarSkeleton />
            ) : selectedProfile ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                {/* Radar Chart */}
                <div className="lg:col-span-2 bg-[#111111] border border-[#222222] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{selectedProfile.courseName}</h3>
                      {selectedProfile.city && selectedProfile.state && (
                        <p className="text-sm text-[#9CA3AF]">
                          {selectedProfile.city}, {selectedProfile.state}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/course/${selectedProfile.courseId}`}
                      className="text-sm text-[#00FF85] flex items-center gap-1 hover:underline"
                    >
                      View Course <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <DnaRadarChart
                    courses={[
                      {
                        ...selectedProfile,
                        color: "#00FF85",
                      },
                    ]}
                  />
                </div>

                {/* Dimension breakdown */}
                <div className="bg-[#111111] border border-[#222222] rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Dimension Breakdown</h3>
                  <div className="space-y-4">
                    {selectedProfile.dimensions
                      .sort((a, b) => b.value - a.value)
                      .map((dim) => (
                        <DimensionBar key={dim.key} dim={dim} />
                      ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Similar Courses */}
            {!compareMode && selectedProfile && similarCourses.length > 0 && (
              <section className="mb-10">
                <h3 className="text-xl font-bold text-white mb-4">Similar Courses</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {similarCourses.map((sc) => (
                    <button
                      key={sc.courseId}
                      onClick={() => loadProfile(sc.courseId)}
                      className="bg-[#111111] border border-[#222222] rounded-xl p-4 text-left hover:border-[#00FF85]/30 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-semibold text-sm group-hover:text-[#00FF85] transition-colors">
                          {sc.courseName}
                        </span>
                        <span className="text-[#00FF85] font-bold text-sm">{sc.similarity}%</span>
                      </div>
                      <p className="text-xs text-[#9CA3AF]">
                        {sc.city}, {sc.state}
                      </p>
                      <div className="mt-2 w-full h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#00FF85]"
                          style={{ width: `${sc.similarity}%` }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Featured Profiles */}
            {!selectedProfile && (
              <section>
                <h3 className="text-xl font-bold text-white mb-4">Featured DNA Profiles</h3>
                {loadingFeatured ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <RadarSkeleton key={i} />
                    ))}
                  </div>
                ) : featuredProfiles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {featuredProfiles.map((profile) => (
                      <button
                        key={profile.courseId}
                        onClick={() => loadProfile(profile.courseId)}
                        className="bg-[#111111] border border-[#222222] rounded-xl p-6 text-left hover:border-[#00FF85]/30 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-semibold group-hover:text-[#00FF85] transition-colors">
                            {profile.courseName}
                          </h4>
                          <ChevronRight className="w-4 h-4 text-[#333] group-hover:text-[#00FF85] transition-colors" />
                        </div>
                        {profile.city && profile.state && (
                          <p className="text-sm text-[#9CA3AF] mb-4">
                            {profile.city}, {profile.state}
                          </p>
                        )}
                        <DnaRadarChart
                          courses={[{ ...profile, color: "#00FF85" }]}
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#111111] border border-[#222222] rounded-xl p-12 text-center">
                    <Dna className="w-12 h-12 text-[#333] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No DNA Profiles Yet</h3>
                    <p className="text-[#9CA3AF] text-sm">
                      Course DNA profiles will appear here once they&apos;re calculated. Search for a specific course above.
                    </p>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
