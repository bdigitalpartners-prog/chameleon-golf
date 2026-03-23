"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Footprints,
  Car,
  Users,
  Accessibility,
  Mountain,
  Search,
  Loader2,
  MapPin,
  ChevronDown,
  Check,
  X,
  DollarSign,
} from "lucide-react";

/* ─── Types ─────────────────────────────────── */
interface WalkingPolicy {
  id: number;
  course_id: number;
  course_name: string;
  city: string;
  state: string;
  courseStyle: string;
  accessType: string;
  greenFeeLow: number | null;
  greenFeeHigh: number | null;
  walking_allowed: boolean;
  walking_restrictions: string | null;
  cart_included: boolean;
  cart_fee: number | null;
  caddie_available: boolean;
  caddie_fee: number | null;
  caddie_required: boolean;
  pull_cart_allowed: boolean;
  push_cart_allowed: boolean;
  ada_accessible: boolean;
  ada_details: string | null;
  terrain_difficulty: string | null;
  estimated_walk_distance_miles: number | null;
}

/* ─── Constants ─────────────────────────────── */
const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const TERRAIN_OPTIONS = [
  { value: "flat", label: "Flat", icon: "🟢" },
  { value: "moderate", label: "Moderate", icon: "🟡" },
  { value: "hilly", label: "Hilly", icon: "🟠" },
  { value: "very_hilly", label: "Very Hilly", icon: "🔴" },
  { value: "mountainous", label: "Mountainous", icon: "⛰️" },
];

/* ─── Helpers ───────────────────────────────── */
function restrictionLabel(value: string | null) {
  if (!value) return "Unknown";
  const map: Record<string, string> = {
    anytime: "Walking Anytime",
    after_noon: "Walking After Noon",
    weekdays_only: "Weekdays Only",
    not_allowed: "No Walking",
    caddie_required: "Caddie Required",
  };
  return map[value] || value.replace(/_/g, " ");
}

function terrainLabel(value: string | null) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Policy Card ───────────────────────────── */
function PolicyCard({ policy }: { policy: WalkingPolicy }) {
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-xl p-4 hover:border-[#00FF85]/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold text-sm">
            {policy.course_name || `Course #${policy.course_id}`}
          </h3>
          {policy.city && policy.state && (
            <div className="flex items-center gap-1 text-xs text-[#9CA3AF] mt-0.5">
              <MapPin className="w-3 h-3" />
              {policy.city}, {policy.state}
            </div>
          )}
        </div>
        {/* Walking status badge */}
        <div
          className={`px-2 py-1 rounded-md text-xs font-medium ${
            policy.walking_allowed
              ? "bg-[#00FF85]/10 text-[#00FF85] border border-[#00FF85]/30"
              : "bg-red-500/10 text-red-400 border border-red-500/30"
          }`}
        >
          {policy.walking_allowed ? "Walkable" : "Cart Required"}
        </div>
      </div>

      {/* Policy Icons Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <PolicyIcon
          icon={Footprints}
          label="Walking"
          value={restrictionLabel(policy.walking_restrictions)}
          active={policy.walking_allowed}
        />
        <PolicyIcon
          icon={Mountain}
          label="Terrain"
          value={terrainLabel(policy.terrain_difficulty)}
          active
        />
        <PolicyIcon
          icon={Users}
          label="Caddie"
          value={
            policy.caddie_required
              ? "Required"
              : policy.caddie_available
                ? `Available${policy.caddie_fee ? ` ($${policy.caddie_fee})` : ""}`
                : "Not Available"
          }
          active={policy.caddie_available}
        />
        <PolicyIcon
          icon={Car}
          label="Cart"
          value={
            policy.cart_included
              ? "Included"
              : policy.cart_fee
                ? `$${policy.cart_fee}`
                : "Available"
          }
          active
        />
      </div>

      {/* Extra info */}
      <div className="flex flex-wrap gap-2">
        {policy.push_cart_allowed && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#333] text-[#9CA3AF]">
            Push Cart OK
          </span>
        )}
        {policy.pull_cart_allowed && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#333] text-[#9CA3AF]">
            Pull Cart OK
          </span>
        )}
        {policy.ada_accessible && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center gap-1">
            <Accessibility className="w-2.5 h-2.5" />
            ADA Accessible
          </span>
        )}
        {policy.estimated_walk_distance_miles && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#333] text-[#9CA3AF]">
            {policy.estimated_walk_distance_miles} mi walk
          </span>
        )}
      </div>
    </div>
  );
}

function PolicyIcon({
  icon: Icon,
  label,
  value,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#1a1a1a]">
      <Icon
        className={`w-4 h-4 flex-shrink-0 ${active ? "text-[#00FF85]" : "text-[#555]"}`}
      />
      <div className="min-w-0">
        <div className="text-[10px] text-[#9CA3AF]">{label}</div>
        <div className="text-xs text-white truncate">{value}</div>
      </div>
    </div>
  );
}

/* ─── Main Hub ──────────────────────────────── */
export function WalkingGuideHub() {
  const [courses, setCourses] = useState<WalkingPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [walkable, setWalkable] = useState<string>("true");
  const [state, setState] = useState("");
  const [terrain, setTerrain] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (walkable) params.set("walkable", walkable);
      if (state) params.set("state", state);
      if (terrain) params.set("terrain", terrain);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/walking-policy/search?${params}`);
      const data = await res.json();
      setCourses(data.courses || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch walking policies:", err);
    } finally {
      setLoading(false);
    }
  }, [walkable, state, terrain, page]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [walkable, state, terrain]);

  const selectClass =
    "px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:border-[#00FF85] focus:outline-none appearance-none";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#00FF85]/10 flex items-center justify-center">
            <Footprints className="w-5 h-5 text-[#00FF85]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              The Walking Golfer&apos;s Guide
            </h1>
            <p className="text-[#9CA3AF] text-sm">
              Find walkable courses. Know the policy before you go.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-[#111111] border border-[#222222] rounded-xl">
        <div>
          <label className="text-[10px] text-[#9CA3AF] block mb-1">
            Walking
          </label>
          <select
            value={walkable}
            onChange={(e) => setWalkable(e.target.value)}
            className={selectClass}
          >
            <option value="">All Courses</option>
            <option value="true">Walkable</option>
            <option value="false">Cart Required</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-[#9CA3AF] block mb-1">
            State
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className={selectClass}
          >
            <option value="">All States</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-[#9CA3AF] block mb-1">
            Terrain
          </label>
          <select
            value={terrain}
            onChange={(e) => setTerrain(e.target.value)}
            className={selectClass}
          >
            <option value="">Any Terrain</option>
            {TERRAIN_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.icon} {t.label}
              </option>
            ))}
          </select>
        </div>

        {(walkable || state || terrain) && (
          <div className="flex items-end">
            <button
              onClick={() => {
                setWalkable("true");
                setState("");
                setTerrain("");
              }}
              className="px-3 py-2 rounded-lg border border-[#333] text-sm text-[#9CA3AF] hover:text-white hover:border-[#555] transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          </div>
        )}

        <div className="flex items-end ml-auto">
          <span className="text-xs text-[#9CA3AF]">
            {total} course{total !== 1 ? "s" : ""} found
          </span>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-[#111111] border border-[#222222] rounded-xl p-4 animate-pulse"
            >
              <div className="h-5 w-40 bg-[#222] rounded mb-2" />
              <div className="h-3 w-28 bg-[#222] rounded mb-4" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 bg-[#1a1a1a] rounded" />
                <div className="h-12 bg-[#1a1a1a] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-8 text-center">
          <Footprints className="w-12 h-12 text-[#333] mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-1">
            No courses found
          </h3>
          <p className="text-sm text-[#9CA3AF]">
            Try adjusting your filters or check back later as more policies are added.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-[#333] text-sm text-white disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-sm text-[#9CA3AF]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-[#333] text-sm text-white disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
