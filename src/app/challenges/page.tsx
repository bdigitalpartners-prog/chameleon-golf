"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Target,
  MapPin,
  MessageCircle,
  Star,
  Loader2,
  Users,
  Coins,
  CheckCircle2,
  ChevronRight,
  Zap,
} from "lucide-react";

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: string;
  criteria: any;
  rewardTokens: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  imageUrl: string | null;
  badge: { id: string; name: string; icon: string; tier: string } | null;
  participantCount: number;
  userParticipation: {
    id: string;
    progressPct: string;
    status: string;
    completedAt: string | null;
    tokensEarned: number;
    joinedAt: string;
  } | null;
}

const TYPE_ICONS: Record<string, any> = {
  prediction: Target,
  exploration: MapPin,
  social: MessageCircle,
  review: Star,
};

const TYPE_COLORS: Record<string, string> = {
  prediction: "text-blue-400",
  exploration: "text-green-400",
  social: "text-purple-400",
  review: "text-amber-400",
};

const TYPE_BG: Record<string, string> = {
  prediction: "bg-blue-500/10 border-blue-500/30",
  exploration: "bg-green-500/10 border-green-500/30",
  social: "bg-purple-500/10 border-purple-500/30",
  review: "bg-amber-500/10 border-amber-500/30",
};

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchChallenges();
  }, []);

  async function fetchChallenges() {
    try {
      setLoading(true);
      const res = await fetch("/api/challenges");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load challenges");
      }
      const data = await res.json();
      setChallenges(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered =
    filter === "all"
      ? challenges
      : filter === "joined"
        ? challenges.filter((c) => c.userParticipation)
        : challenges.filter((c) => c.type === filter);

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
            onClick={fetchChallenges}
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
            <Trophy className="w-8 h-8 text-green-400" />
            <h1 className="text-3xl font-bold">Challenges</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Complete challenges to earn EQ Tokens and unlock exclusive badges.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {challenges.filter((c) => c.userParticipation).length}
            </div>
            <div className="text-sm text-gray-400">Joined</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">
              {challenges.filter((c) => c.userParticipation?.status === "completed").length}
            </div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {challenges.reduce((sum, c) => sum + (c.userParticipation?.tokensEarned ?? 0), 0)}
            </div>
            <div className="text-sm text-gray-400">Tokens Earned</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: "all", label: "All" },
            { key: "joined", label: "My Challenges" },
            { key: "prediction", label: "Prediction" },
            { key: "exploration", label: "Exploration" },
            { key: "social", label: "Social" },
            { key: "review", label: "Review" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                filter === tab.key
                  ? "bg-green-600 text-white"
                  : "bg-[#1a1a1a] text-gray-400 border border-gray-800 hover:border-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Challenges Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No challenges found for this filter.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((challenge) => {
              const Icon = TYPE_ICONS[challenge.type] || Trophy;
              const colorClass = TYPE_COLORS[challenge.type] || "text-gray-400";
              const bgClass = TYPE_BG[challenge.type] || "bg-gray-500/10 border-gray-500/30";
              const isJoined = !!challenge.userParticipation;
              const isCompleted = challenge.userParticipation?.status === "completed";
              const progressPct = parseFloat(challenge.userParticipation?.progressPct ?? "0");

              return (
                <Link
                  key={challenge.id}
                  href={`/challenges/${challenge.id}`}
                  className="block"
                >
                  <div
                    className={`bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition group relative ${
                      isCompleted ? "border-green-500/30" : ""
                    }`}
                  >
                    {/* Completed badge */}
                    {isCompleted && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      </div>
                    )}

                    {/* Type icon */}
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border mb-3 ${bgClass}`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
                      <span className={colorClass}>
                        {challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-green-400 transition pr-8">
                      {challenge.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {challenge.description}
                    </p>

                    {/* Progress bar (if joined) */}
                    {isJoined && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-white font-medium">
                            {Math.round(progressPct)}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCompleted ? "bg-green-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-amber-400">
                          <Coins className="w-4 h-4" />
                          {challenge.rewardTokens}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Users className="w-4 h-4" />
                          {challenge.participantCount}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-green-400 transition" />
                    </div>

                    {/* Badge reward */}
                    {challenge.badge && (
                      <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2 text-xs text-gray-500">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          Unlocks{" "}
                          <span className="text-amber-400 font-medium">
                            {challenge.badge.name}
                          </span>{" "}
                          badge
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
