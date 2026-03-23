"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ScanLine,
  Loader2,
  Droplets,
  TreePine,
  Mountain,
  Circle,
  MapPin,
  Waves,
  Sun,
  ChevronRight,
  Compass,
} from "lucide-react";

const ROUTING_LABELS: Record<string, string> = {
  out_and_back: "Out and Back",
  loop: "Loop",
  figure_eight: "Figure Eight",
  point_to_point: "Point to Point",
};

interface SatelliteFeaturesProps {
  courseId: number;
}

export default function SatelliteFeatures({ courseId }: SatelliteFeaturesProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/satellite/features?courseId=${courseId}`);
        if (!res.ok) {
          setData(null);
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (!data) return null;

  const { features, averages } = data;

  function FeatureStat({
    icon: Icon,
    label,
    value,
    unit,
    avg,
    maxForBar,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
    unit: string;
    avg?: number;
    maxForBar: number;
  }) {
    const pct = Math.min((value / maxForBar) * 100, 100);
    const avgPct = avg ? Math.min((avg / maxForBar) * 100, 100) : 0;

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color: "#00FF85" }} />
            <span className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>{label}</span>
          </div>
          <span className="text-sm font-bold" style={{ color: "var(--cg-text-primary)" }}>
            {typeof value === "number" ? value.toLocaleString() : value}{unit}
          </span>
        </div>
        <div className="relative h-2.5 rounded-full" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
          <div
            className="h-2.5 rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: "#00FF85" }}
          />
          {avg !== undefined && avg > 0 && (
            <div
              className="absolute top-0 w-0.5 h-2.5 rounded-full"
              style={{ left: `${avgPct}%`, backgroundColor: "var(--cg-text-muted)" }}
              title={`Average: ${avg}${unit}`}
            />
          )}
        </div>
        {avg !== undefined && avg > 0 && (
          <div className="text-[10px]" style={{ color: "var(--cg-text-muted)" }}>
            Course avg: {avg}{unit}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <ScanLine className="w-5 h-5" style={{ color: "#00FF85" }} />
        <h3 className="text-lg font-bold" style={{ color: "var(--cg-text-primary)" }}>
          Course Features
        </h3>
      </div>

      {/* Main Stats */}
      <div className="rounded-lg p-4 border space-y-4" style={{ backgroundColor: "var(--cg-bg-card)", borderColor: "var(--cg-border)" }}>
        <FeatureStat
          icon={MapPin}
          label="Total Acreage"
          value={features.totalAcreage}
          unit=" acres"
          avg={averages.totalAcreage}
          maxForBar={9000}
        />
        <FeatureStat
          icon={Circle}
          label="Bunker Count"
          value={features.bunkerCount}
          unit=""
          avg={averages.bunkerCount}
          maxForBar={1100}
        />
        <FeatureStat
          icon={Droplets}
          label="Water Coverage"
          value={features.waterCoveragePct}
          unit="%"
          avg={averages.waterCoveragePct}
          maxForBar={12}
        />
        <FeatureStat
          icon={TreePine}
          label="Tree Coverage"
          value={features.treeCoveragePct}
          unit="%"
          avg={averages.treeCoveragePct}
          maxForBar={70}
        />
        <FeatureStat
          icon={Mountain}
          label="Elevation Range"
          value={features.elevationRangeFt}
          unit="ft"
          avg={averages.elevationRangeFt}
          maxForBar={450}
        />
      </div>

      {/* Special Features Badges */}
      <div>
        <h4 className="text-xs font-semibold mb-2" style={{ color: "var(--cg-text-muted)" }}>
          SPECIAL FEATURES
        </h4>
        <div className="flex flex-wrap gap-2">
          {features.hasIslandGreen && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#00FF85]/20 text-[#00FF85]">
              <Waves className="w-3 h-3" /> Island Green
            </span>
          )}
          {features.hasCoastalHoles && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">
              <Waves className="w-3 h-3" /> Coastal Holes
            </span>
          )}
          {features.hasDesertTerrain && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">
              <Sun className="w-3 h-3" /> Desert Terrain
            </span>
          )}
          {!features.hasIslandGreen && !features.hasCoastalHoles && !features.hasDesertTerrain && (
            <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
              No special terrain features
            </span>
          )}
        </div>
      </div>

      {/* Routing Type */}
      {features.routingType && (
        <div>
          <h4 className="text-xs font-semibold mb-2" style={{ color: "var(--cg-text-muted)" }}>
            ROUTING TYPE
          </h4>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: "rgba(0,255,133,0.1)", color: "#00FF85" }}>
            <Compass className="w-3 h-3" />
            {ROUTING_LABELS[features.routingType] || features.routingType}
          </span>
        </div>
      )}

      <Link
        href="/satellite"
        className="inline-flex items-center gap-1 text-sm font-medium"
        style={{ color: "#00FF85" }}
      >
        View Full Satellite Analysis <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
