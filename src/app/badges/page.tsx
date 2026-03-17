"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  Loader2,
  Star,
  Target,
  MapPin,
  Globe,
  MessageCircle,
  Zap,
  Trophy,
  Flag,
  Crosshair,
  Lock,
  ChevronDown,
  ChevronUp,
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
  totalEarners: number;
  rarity: number;
}

interface BadgeStats {
  earned: number;
  total: number;
  percentage: number;
}

const TIER_STYLES: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  bronze: {
    border: "border-amber-700/50",
    bg: "bg-amber-900/20",
    text: "text-amber-600",
    glow: "shadow-amber-900/20",
  },
  silver: {
    border: "border-gray-400/50",
    bg: "bg-gray-600/10",
    text: "text-gray-300",
    glow: "shadow-gray-500/20",
  },
  gold: {
    border: "border-yellow-500/50",
    bg: "bg-yellow-900/20",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/20",
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

const CATEGORY_ICONS: Record<string, any> = {
  Explorer: MapPin,
  Achiever: Target,
  Social: MessageCircle,
  Expert: Star,
};

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [categories, setCategories] = useState<Record<string, Badge[]>>({});
  const [stats, setStats] = useState<BadgeStats>({ earned: 0, total: 0, percentage: 0 });
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchBadges();
  }, []);

  async function fetchBadges() {
    try {
      setLoading(true);
      const res = await fetch("/api/badges");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load badges");
      }
      const data = await res.json();
      setBadges(data.badges);
      setCategories(data.categories);
      setStats(data.stats);
      setNewBadges(data.newBadges || []);

      // Expand all categories by default
      if (data.categories) {
        setExpandedCategory(Object.keys(data.categories)[0] || null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchBadges}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8 text-amber-400" />
            <h1 className="text-3xl font-bold">Badge Gallery</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Collect badges by achieving milestones in your golf journey.
          </p>
        </div>

        {/* New Badges Alert */}
        {newBadges.length > 0 && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-green-400" />
              <div>
                <p className="font-semibold text-green-400">
                  New Badge{newBadges.length > 1 ? "s" : ""} Earned!
                </p>
                <p className="text-sm text-green-300">
                  {newBadges.join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-amber-400">
              {stats.earned}
            </div>
            <div className="text-sm text-gray-400 mt-1">Badges Earned</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-gray-300">
              {stats.total}
            </div>
            <div className="text-sm text-gray-400 mt-1">Total Badges</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 text-center">
            <div className="text-3xl font-bold text-green-400">
              {stats.percentage}%
            </div>
            <div className="text-sm text-gray-400 mt-1">Completion</div>
            <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Badge Categories */}
        <div className="space-y-6">
          {Object.entries(categories).map(([category, categoryBadges]) => {
            const CategoryIcon = CATEGORY_ICONS[category] || Award;
            const earnedInCategory = categoryBadges.filter((b) => b.earned).length;
            const isExpanded = expandedCategory === category;

            return (
              <div
                key={category}
                className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden"
              >
                {/* Category header */}
                <button
                  onClick={() =>
                    setExpandedCategory(isExpanded ? null : category)
                  }
                  className="w-full flex items-center justify-between p-5 hover:bg-[#222222] transition"
                >
                  <div className="flex items-center gap-3">
                    <CategoryIcon className="w-5 h-5 text-green-400" />
                    <h2 className="text-lg font-semibold">{category}</h2>
                    <span className="text-sm text-gray-500">
                      {earnedInCategory} / {categoryBadges.length}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {/* Badge grid */}
                {isExpanded && (
                  <div className="p-5 pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {categoryBadges.map((badge) => {
                        const tierStyle = TIER_STYLES[badge.tier] || TIER_STYLES.bronze;
                        const BadgeIcon = ICON_MAP[badge.icon ?? "award"] || Award;

                        return (
                          <button
                            key={badge.id}
                            onClick={() => setSelectedBadge(badge)}
                            className={`relative p-4 rounded-xl border text-center transition hover:scale-105 ${
                              badge.earned
                                ? `${tierStyle.border} ${tierStyle.bg} shadow-lg ${tierStyle.glow}`
                                : "border-gray-800 bg-[#111111] opacity-50"
                            }`}
                          >
                            {/* Lock icon for unearned */}
                            {!badge.earned && (
                              <div className="absolute top-2 right-2">
                                <Lock className="w-3.5 h-3.5 text-gray-600" />
                              </div>
                            )}

                            <div
                              className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                                badge.earned
                                  ? `${tierStyle.bg} border ${tierStyle.border}`
                                  : "bg-gray-800 border border-gray-700"
                              }`}
                            >
                              <BadgeIcon
                                className={`w-6 h-6 ${
                                  badge.earned
                                    ? tierStyle.text
                                    : "text-gray-600"
                                }`}
                              />
                            </div>

                            <h3
                              className={`font-semibold text-sm mb-1 ${
                                badge.earned ? "text-white" : "text-gray-500"
                              }`}
                            >
                              {badge.name}
                            </h3>

                            <span
                              className={`text-xs capitalize ${tierStyle.text}`}
                            >
                              {badge.tier}
                            </span>

                            {badge.earned && badge.earnedAt && (
                              <div className="mt-2 text-xs text-gray-500">
                                {new Date(badge.earnedAt).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Badge Detail Modal */}
        {selectedBadge && (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedBadge(null)}
          >
            <div
              className="bg-[#1a1a1a] border border-gray-800 rounded-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const tierStyle =
                  TIER_STYLES[selectedBadge.tier] || TIER_STYLES.bronze;
                const BadgeIcon =
                  ICON_MAP[selectedBadge.icon ?? "award"] || Award;

                return (
                  <>
                    <div className="text-center mb-6">
                      <div
                        className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                          selectedBadge.earned
                            ? `${tierStyle.bg} border-2 ${tierStyle.border}`
                            : "bg-gray-800 border-2 border-gray-700"
                        }`}
                      >
                        <BadgeIcon
                          className={`w-10 h-10 ${
                            selectedBadge.earned
                              ? tierStyle.text
                              : "text-gray-600"
                          }`}
                        />
                      </div>
                      <h2 className="text-xl font-bold mb-1">
                        {selectedBadge.name}
                      </h2>
                      <span
                        className={`text-sm capitalize font-medium ${tierStyle.text}`}
                      >
                        {selectedBadge.tier} Badge
                      </span>
                    </div>

                    <p className="text-gray-300 text-center mb-6">
                      {selectedBadge.description}
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Category</span>
                        <span className="text-white">
                          {selectedBadge.category}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Rarity</span>
                        <span className="text-white">
                          {selectedBadge.rarity}% of users
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Earners</span>
                        <span className="text-white">
                          {selectedBadge.totalEarners}
                        </span>
                      </div>
                      {selectedBadge.earned && selectedBadge.earnedAt && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Earned On</span>
                          <span className="text-green-400">
                            {new Date(
                              selectedBadge.earnedAt
                            ).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {!selectedBadge.earned &&
                      selectedBadge.criteria?.description && (
                        <div className="bg-[#111111] rounded-lg p-4 mb-6">
                          <p className="text-sm text-gray-400">
                            <span className="text-white font-medium">
                              How to earn:
                            </span>{" "}
                            {selectedBadge.criteria.description}
                          </p>
                        </div>
                      )}

                    <button
                      onClick={() => setSelectedBadge(null)}
                      className="w-full py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition"
                    >
                      Close
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
