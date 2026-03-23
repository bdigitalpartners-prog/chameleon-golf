"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ScanLine,
  Loader2,
  Search,
  Droplets,
  TreePine,
  Mountain,
  Circle,
  Waves,
  Sun,
  MapPin,
  Award,
} from "lucide-react";

/* ─── Routing type labels ─── */
const ROUTING_LABELS: Record<string, string> = {
  out_and_back: "Out and Back",
  loop: "Loop",
  figure_eight: "Figure Eight",
  point_to_point: "Point to Point",
};

/* ─── Leaderboard component ─── */
function Leaderboard({
  title,
  icon: Icon,
  data,
  valueKey,
  unit,
  maxValue,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  data: any[];
  valueKey: string;
  unit: string;
  maxValue: number;
}) {
  return (
    <div className="rounded-xl p-5 border" style={{ backgroundColor: "var(--cg-bg-card)", borderColor: "var(--cg-border)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5" style={{ color: "#00FF85" }} />
        <h3 className="font-bold" style={{ color: "var(--cg-text-primary)" }}>{title}</h3>
      </div>
      <div className="space-y-3">
        {data.slice(0, 10).map((item: any, i: number) => {
          const val = item[valueKey] || 0;
          const pct = Math.min((val / maxValue) * 100, 100);
          return (
            <div key={item.courseId} className="flex items-center gap-3">
              <span className="w-6 text-xs font-bold text-right" style={{ color: i < 3 ? "#00FF85" : "var(--cg-text-muted)" }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate" style={{ color: "var(--cg-text-primary)" }}>
                    {item.courseName}
                  </span>
                  <span className="text-xs font-bold ml-2 whitespace-nowrap" style={{ color: "#00FF85" }}>
                    {typeof val === "number" ? val.toLocaleString() : val}{unit}
                  </span>
                </div>
                <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
                  <div
                    className="h-1.5 rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: i < 3 ? "#00FF85" : "rgba(0,255,133,0.5)",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Feature badge ─── */
function FeatureBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
        active
          ? "bg-[#00FF85]/20 text-[#00FF85]"
          : "bg-[#222] text-[#666]"
      }`}
    >
      {label}
    </span>
  );
}

/* ─── Course feature card ─── */
function CourseFeatureCard({ course }: { course: any }) {
  return (
    <div
      className="rounded-xl p-4 border transition-all duration-200 hover:border-[#00FF85]/30"
      style={{ backgroundColor: "var(--cg-bg-card)", borderColor: "var(--cg-border)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-bold" style={{ color: "var(--cg-text-primary)" }}>
            {course.courseName}
          </h4>
          <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
            {course.city}, {course.state}
          </p>
        </div>
        {course.routingType && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: "rgba(0,255,133,0.1)", color: "#00FF85" }}>
            {ROUTING_LABELS[course.routingType] || course.routingType}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3" style={{ color: "var(--cg-text-muted)" }} />
          <span style={{ color: "var(--cg-text-secondary)" }}>{course.totalAcreage?.toLocaleString()} acres</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Circle className="w-3 h-3" style={{ color: "var(--cg-text-muted)" }} />
          <span style={{ color: "var(--cg-text-secondary)" }}>{course.bunkerCount} bunkers</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3 h-3" style={{ color: "var(--cg-text-muted)" }} />
          <span style={{ color: "var(--cg-text-secondary)" }}>{course.waterCoveragePct}% water</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TreePine className="w-3 h-3" style={{ color: "var(--cg-text-muted)" }} />
          <span style={{ color: "var(--cg-text-secondary)" }}>{course.treeCoveragePct}% trees</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Mountain className="w-3 h-3" style={{ color: "var(--cg-text-muted)" }} />
          <span style={{ color: "var(--cg-text-secondary)" }}>{course.elevationRangeFt}ft elevation</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        <FeatureBadge label="Island Green" active={course.hasIslandGreen} />
        <FeatureBadge label="Coastal" active={course.hasCoastalHoles} />
        <FeatureBadge label="Desert" active={course.hasDesertTerrain} />
      </div>
    </div>
  );
}

/* ─── Fun Facts ─── */
const FUN_FACTS = [
  "Whistling Straits has over 1,000 bunkers — more than any other championship course.",
  "Sand Hills Golf Club sits on 8,000 acres in the Nebraska Sandhills, one of the largest golf properties in the world.",
  "Pine Valley has 143 bunkers covering 12% of the course area.",
  "TPC Sawgrass's famous 17th is the most recognizable island green in golf.",
  "Pebble Beach's coastal holes experience elevation changes of over 350 feet.",
  "Oakmont's 210 bunkers include the iconic church pew bunkers between holes 3 and 4.",
  "Torrey Pines South has 380 feet of elevation change overlooking the Pacific Ocean.",
];

/* ─── Main Page ─── */
export default function SatellitePage() {
  const [leaderboards, setLeaderboards] = useState<Record<string, any[]>>({});
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    minBunkers: "",
    hasWater: false,
    hasCoastal: false,
    hasIslandGreen: false,
    hasDesert: false,
  });
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const metrics = ["bunker_count", "water_coverage", "tree_coverage", "elevation"];
        const results = await Promise.all(
          metrics.map(async (m) => {
            const res = await fetch(`/api/satellite/leaderboard?metric=${m}&limit=10`);
            const data = await res.json();
            return { metric: m, data: data.leaderboard || [] };
          })
        );

        const boards: Record<string, any[]> = {};
        for (const r of results) {
          boards[r.metric] = r.data;
        }
        setLeaderboards(boards);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();

    // Rotate fun facts
    const interval = setInterval(() => {
      setFactIndex((i) => (i + 1) % FUN_FACTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleSearch() {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchFilters.minBunkers) params.set("minBunkers", searchFilters.minBunkers);
      if (searchFilters.hasWater) params.set("hasWater", "true");
      if (searchFilters.hasCoastal) params.set("hasCoastal", "true");
      if (searchFilters.hasIslandGreen) params.set("hasIslandGreen", "true");
      if (searchFilters.hasDesert) params.set("hasDesert", "true");

      const res = await fetch(`/api/satellite/search?${params.toString()}`);
      const data = await res.json();
      setSearchResults(data.courses || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
             style={{ backgroundColor: "rgba(0,255,133,0.1)", color: "#00FF85" }}>
          <ScanLine className="w-3.5 h-3.5" />
          SATELLITE ANALYSIS
        </div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
          Course Feature Analysis
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--cg-text-secondary)" }}>
          Every bunker counted. Every water hazard mapped. Every acre measured.
        </p>
      </div>

      {/* Fun Fact */}
      <div className="rounded-xl p-4 border text-center" style={{ backgroundColor: "rgba(0,255,133,0.05)", borderColor: "rgba(0,255,133,0.15)" }}>
        <div className="flex items-center justify-center gap-2">
          <Award className="w-4 h-4" style={{ color: "#00FF85" }} />
          <span className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
            {FUN_FACTS[factIndex]}
          </span>
        </div>
      </div>

      {/* Leaderboards */}
      <section>
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--cg-text-primary)" }}>
          Feature Leaderboards
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Leaderboard
            title="Most Bunkered Courses"
            icon={Circle}
            data={leaderboards.bunker_count || []}
            valueKey="bunkerCount"
            unit=""
            maxValue={1100}
          />
          <Leaderboard
            title="Highest Water Coverage"
            icon={Droplets}
            data={leaderboards.water_coverage || []}
            valueKey="waterCoveragePct"
            unit="%"
            maxValue={12}
          />
          <Leaderboard
            title="Most Tree-Lined"
            icon={TreePine}
            data={leaderboards.tree_coverage || []}
            valueKey="treeCoveragePct"
            unit="%"
            maxValue={70}
          />
          <Leaderboard
            title="Greatest Elevation Change"
            icon={Mountain}
            data={leaderboards.elevation || []}
            valueKey="elevationRangeFt"
            unit="ft"
            maxValue={450}
          />
        </div>
      </section>

      {/* Feature Search */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
          Feature Search
        </h2>
        <div className="rounded-xl p-5 border" style={{ backgroundColor: "var(--cg-bg-card)", borderColor: "var(--cg-border)" }}>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--cg-text-muted)" }}>Min Bunkers</label>
              <input
                type="number"
                placeholder="e.g. 50"
                value={searchFilters.minBunkers}
                onChange={(e) => setSearchFilters({ ...searchFilters, minBunkers: e.target.value })}
                className="w-28 px-3 py-2 rounded-lg text-sm border outline-none"
                style={{
                  backgroundColor: "var(--cg-bg-primary)",
                  borderColor: "var(--cg-border)",
                  color: "var(--cg-text-primary)",
                }}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={searchFilters.hasWater}
                onChange={(e) => setSearchFilters({ ...searchFilters, hasWater: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>Water Hazards</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={searchFilters.hasCoastal}
                onChange={(e) => setSearchFilters({ ...searchFilters, hasCoastal: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>Coastal</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={searchFilters.hasIslandGreen}
                onChange={(e) => setSearchFilters({ ...searchFilters, hasIslandGreen: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>Island Green</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={searchFilters.hasDesert}
                onChange={(e) => setSearchFilters({ ...searchFilters, hasDesert: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>Desert</span>
            </label>
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{ backgroundColor: "#00FF85", color: "#000" }}
            >
              {searchLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </button>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((c: any) => (
              <CourseFeatureCard key={c.courseId} course={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
