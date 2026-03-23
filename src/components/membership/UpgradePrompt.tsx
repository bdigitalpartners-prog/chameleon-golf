"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

interface UpgradePromptProps {
  tier: "pro" | "elite" | "founders";
  feature?: string;
  compact?: boolean;
}

const TIER_LABELS: Record<string, string> = {
  pro: "EQUALIZER PRO",
  elite: "EQUALIZER ELITE",
  founders: "FOUNDERS FLIGHT",
};

const TIER_COLORS: Record<string, string> = {
  pro: "#00FF85",
  elite: "#3B82F6",
  founders: "#F59E0B",
};

export function UpgradePrompt({ tier, feature, compact }: UpgradePromptProps) {
  const label = TIER_LABELS[tier] || "PRO";
  const color = TIER_COLORS[tier] || "#00FF85";

  if (compact) {
    return (
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
        style={{
          backgroundColor: `${color}15`,
          color,
          border: `1px solid ${color}40`,
        }}
      >
        <Lock className="w-3 h-3" />
        {label}
      </Link>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl p-6 text-center"
      style={{
        backgroundColor: "#111111",
        border: `1px solid ${color}30`,
      }}
    >
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: `radial-gradient(ellipse at center, ${color}, transparent 70%)`,
        }}
      />
      <div className="relative z-10">
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
          style={{ backgroundColor: `${color}15` }}
        >
          <Sparkles className="w-6 h-6" style={{ color }} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          Unlock {feature || "This Feature"}
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          This feature requires {label}. Upgrade to access full golf intelligence.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-105"
          style={{
            backgroundColor: color,
            color: "#0A0A0A",
          }}
        >
          <Sparkles className="w-4 h-4" />
          Upgrade to {label}
        </Link>
      </div>
    </div>
  );
}
