"use client";

import { useState } from "react";
import {
  Award,
  Flag,
  MapPin,
  Globe,
  Target,
  Crosshair,
  Zap,
  MessageCircle,
  Star,
  Trophy,
  Lock,
} from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  tier: string;
  criteria: any;
  sortOrder: number;
  earned: boolean;
  earnedAt: string | null;
  totalEarners?: number;
  rarity?: number;
  progress?: {
    current: number;
    threshold: number;
    percentage: number;
  };
}

interface BadgeGridProps {
  badges: Badge[];
  compact?: boolean;
  onBadgeClick?: (badge: Badge) => void;
}

const TIER_STYLES: Record<
  string,
  { border: string; bg: string; text: string; ring: string }
> = {
  bronze: {
    border: "border-amber-700/50",
    bg: "bg-amber-900/20",
    text: "text-amber-600",
    ring: "ring-amber-700/30",
  },
  silver: {
    border: "border-gray-400/50",
    bg: "bg-gray-600/10",
    text: "text-gray-300",
    ring: "ring-gray-400/30",
  },
  gold: {
    border: "border-yellow-500/50",
    bg: "bg-yellow-900/20",
    text: "text-yellow-400",
    ring: "ring-yellow-500/30",
  },
};

const ICON_MAP: Record<string, any> = {
  flag: Flag,
  "map-pin": MapPin,
  globe: Globe,
  target: Target,
  crosshair: Crosshair,
  zap: Zap,
  "message-circle": MessageCircle,
  award: Award,
  star: Star,
  trophy: Trophy,
};

export default function BadgeGrid({
  badges,
  compact = false,
  onBadgeClick,
}: BadgeGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (badges.length === 0) {
    return (
      <div className="text-center py-8">
        <Award className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No badges to display</p>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-3 ${
        compact
          ? "grid-cols-4 md:grid-cols-6"
          : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      }`}
    >
      {badges.map((badge) => {
        const tierStyle = TIER_STYLES[badge.tier] || TIER_STYLES.bronze;
        const BadgeIcon = ICON_MAP[badge.icon ?? "award"] || Award;
        const isHovered = hoveredId === badge.id;

        return (
          <button
            key={badge.id}
            onClick={() => onBadgeClick?.(badge)}
            onMouseEnter={() => setHoveredId(badge.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`relative rounded-xl border text-center transition-all duration-200 ${
              compact ? "p-3" : "p-4"
            } ${
              badge.earned
                ? `${tierStyle.border} ${tierStyle.bg} hover:ring-2 ${tierStyle.ring}`
                : "border-gray-800 bg-[#111111] grayscale hover:grayscale-[50%]"
            }`}
          >
            {/* Lock icon for unearned */}
            {!badge.earned && !compact && (
              <div className="absolute top-2 right-2">
                <Lock className="w-3 h-3 text-gray-700" />
              </div>
            )}

            {/* Badge icon */}
            <div
              className={`mx-auto rounded-full flex items-center justify-center ${
                compact ? "w-10 h-10 mb-2" : "w-14 h-14 mb-3"
              } ${
                badge.earned
                  ? `${tierStyle.bg} border ${tierStyle.border}`
                  : "bg-gray-800/50 border border-gray-700/50"
              }`}
            >
              <BadgeIcon
                className={`${compact ? "w-5 h-5" : "w-7 h-7"} ${
                  badge.earned ? tierStyle.text : "text-gray-600"
                }`}
              />
            </div>

            {/* Badge name */}
            <h4
              className={`font-medium leading-tight ${
                compact ? "text-xs" : "text-sm"
              } ${badge.earned ? "text-white" : "text-gray-500"}`}
            >
              {badge.name}
            </h4>

            {/* Tier label */}
            {!compact && (
              <span className={`text-xs capitalize mt-1 block ${tierStyle.text}`}>
                {badge.tier}
              </span>
            )}

            {/* Progress bar for unearned (non-compact) */}
            {!compact && !badge.earned && badge.progress && badge.progress.percentage > 0 && (
              <div className="mt-2">
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-600 rounded-full"
                    style={{ width: `${badge.progress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {badge.progress.current}/{badge.progress.threshold}
                </p>
              </div>
            )}

            {/* Earned date */}
            {!compact && badge.earned && badge.earnedAt && (
              <div className="mt-2 text-xs text-gray-500">
                {new Date(badge.earnedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            )}

            {/* Tooltip on hover */}
            {isHovered && badge.description && !compact && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#222222] border border-gray-700 rounded-lg p-3 text-xs text-gray-300 w-48 z-10 shadow-xl pointer-events-none">
                {badge.description}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-700" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
