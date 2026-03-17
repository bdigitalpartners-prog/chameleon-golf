"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  ArrowLeft,
  Zap,
  Calendar,
  Clock,
} from "lucide-react";

interface ChallengeDetail {
  challenge: {
    id: string;
    name: string;
    description: string;
    type: string;
    criteria: any;
    rewardTokens: number;
    badge: { id: string; name: string; icon: string; tier: string } | null;
  };
  joined: boolean;
  progress: {
    current: number;
    target: number;
    percentage: number;
    status: string;
    joinedAt: string;
    completedAt: string | null;
    tokensEarned: number;
  } | null;
}

interface LeaderboardEntry {
  userId: string;
  userName: string;
  userImage: string | null;
  progressPct: number;
  status: string;
  joinedAt: string;
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

const TIER_COLORS: Record<string, string> = {
  bronze: "text-amber-600",
  silver: "text-gray-300",
  gold: "text-yellow-400",
};

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;

  const [data, setData] = useState<ChallengeDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (challengeId) {
      fetchProgress();
    }
  }, [challengeId]);

  async function fetchProgress() {
    try {
      setLoading(true);
      const res = await fetch(`/api/challenges/${challengeId}/progress`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to load challenge");
      }
      const result = await res.json();
      setData(result);

      // Fetch leaderboard (participants list from challenges endpoint)
      const challengesRes = await fetch("/api/challenges");
      if (challengesRes.ok) {
        const challenges = await challengesRes.json();
        const thisChallenge = challenges.find((c: any) => c.id === challengeId);
        if (thisChallenge) {
          // We show participant count; actual leaderboard would need a dedicated endpoint
          // For now, set a simple representation
          setLeaderboard([]);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    try {
      setJoining(true);
      const res = await fetch(`/api/challenges/${challengeId}/join`, {
        method: "POST",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to join challenge");
      }
      // Refresh data
      await fetchProgress();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Challenge not found"}</p>
          <button
            onClick={() => router.push("/challenges")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Back to Challenges
          </button>
        </div>
      </div>
    );
  }

  const { challenge, joined, progress } = data;
  const Icon = TYPE_ICONS[challenge.type] || Trophy;
  const colorClass = TYPE_COLORS[challenge.type] || "text-gray-400";
  const isCompleted = progress?.status === "completed";

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/challenges"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Challenges
        </Link>

        {/* Challenge Header */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl ${
                  challenge.type === "prediction"
                    ? "bg-blue-500/10"
                    : challenge.type === "exploration"
                      ? "bg-green-500/10"
                      : challenge.type === "social"
                        ? "bg-purple-500/10"
                        : "bg-amber-500/10"
                }`}
              >
                <Icon className={`w-6 h-6 ${colorClass}`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{challenge.name}</h1>
                <span
                  className={`text-sm font-medium ${colorClass} capitalize`}
                >
                  {challenge.type} Challenge
                </span>
              </div>
            </div>
            {isCompleted && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium text-sm">
                  Completed
                </span>
              </div>
            )}
          </div>

          <p className="text-gray-300 mb-6 leading-relaxed">
            {challenge.description}
          </p>

          {/* Reward info */}
          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 font-semibold">
                {challenge.rewardTokens} EQ Tokens
              </span>
            </div>
            {challenge.badge && (
              <div className="flex items-center gap-2">
                <Zap
                  className={`w-5 h-5 ${TIER_COLORS[challenge.badge.tier] || "text-gray-400"}`}
                />
                <span className="text-gray-300">
                  Unlocks{" "}
                  <span
                    className={`font-medium ${TIER_COLORS[challenge.badge.tier] || "text-gray-300"}`}
                  >
                    {challenge.badge.name}
                  </span>{" "}
                  badge
                </span>
              </div>
            )}
          </div>

          {/* Progress section */}
          {joined && progress ? (
            <div className="bg-[#111111] rounded-xl p-5 mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-400">Your Progress</span>
                <span className="text-lg font-bold">
                  {progress.current}{" "}
                  <span className="text-gray-500 text-sm font-normal">
                    / {progress.target}
                  </span>
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined{" "}
                  {new Date(progress.joinedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <span className="text-white font-medium">
                  {progress.percentage}%
                </span>
              </div>
              {progress.tokensEarned > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2 text-sm">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400">
                    {progress.tokensEarned} tokens earned so far
                  </span>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {joining ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5" />
                  Join Challenge
                </>
              )}
            </button>
          )}
        </div>

        {/* Challenge Criteria */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            How to Complete
          </h2>
          <div className="space-y-3">
            {challenge.criteria && (
              <div className="flex items-start gap-3 text-gray-300">
                <div className="mt-1 w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                <div>
                  <p>
                    {challenge.criteria.type === "consecutive_predictions_within" &&
                      `Predict your score within ${challenge.criteria.margin} strokes for ${challenge.criteria.threshold} consecutive rounds.`}
                    {challenge.criteria.type === "unique_courses_rated" &&
                      `Rate ${challenge.criteria.threshold} unique courses that you have played.`}
                    {challenge.criteria.type === "beat_algorithm_count" &&
                      `Beat the EQ Algorithm prediction in ${challenge.criteria.threshold} rounds.`}
                    {challenge.criteria.type === "intelligence_notes_shared" &&
                      `Share ${challenge.criteria.threshold} intelligence notes about courses.`}
                    {challenge.criteria.type === "detailed_ratings" &&
                      `Submit ${challenge.criteria.threshold} detailed course ratings.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Placeholder */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Participants
          </h2>
          {leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {joined
                  ? "You are among the first participants. More will join soon!"
                  : "Join this challenge to see participants."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.userId}
                  className="flex items-center gap-3 p-3 bg-[#111111] rounded-lg"
                >
                  <span className="text-gray-500 font-mono text-sm w-6 text-right">
                    {idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium">
                    {entry.userName?.charAt(0) ?? "?"}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{entry.userName}</div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${entry.progressPct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {Math.round(entry.progressPct)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
