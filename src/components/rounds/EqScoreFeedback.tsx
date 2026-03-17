'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface PerformanceInsight {
  courseId: number;
  courseName: string;
  predictedDifficulty: 'easy' | 'moderate' | 'hard';
  actualDifficulty: 'easy' | 'moderate' | 'hard';
  differential: number;
  averageDifferential: number;
  deviation: number;
}

interface DimensionAdjustment {
  dimension: string;
  currentWeight: number;
  suggestedWeight: number;
  reason: string;
}

interface FeedbackData {
  totalRounds: number;
  averageDifferential: number;
  insights: PerformanceInsight[];
  adjustments: DimensionAdjustment[];
  accuracyScore: number;
}

export default function EqScoreFeedback() {
  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/rounds/history?limit=1');
      if (!res.ok) {
        throw new Error('Failed to fetch round data');
      }

      const historyData = await res.json();

      // If user has no rounds, show empty state
      if (historyData.total === 0) {
        setData({
          totalRounds: 0,
          averageDifferential: 0,
          insights: [],
          adjustments: [],
          accuracyScore: 0,
        });
        return;
      }

      // Fetch all rounds for analysis
      const fullRes = await fetch(`/api/rounds/history?limit=${Math.min(historyData.total, 20)}`);
      if (!fullRes.ok) {
        throw new Error('Failed to fetch round data');
      }

      const fullData = await fullRes.json();
      const rounds = fullData.items;

      // Client-side analysis matching the feedback-loop logic
      const differentials = rounds
        .filter((r: any) => r.differential !== null)
        .map((r: any) => r.differential);
      const averageDifferential =
        differentials.length > 0
          ? differentials.reduce((sum: number, d: number) => sum + d, 0) / differentials.length
          : 0;

      const insights: PerformanceInsight[] = rounds
        .filter((r: any) => r.differential !== null && r.course)
        .map((r: any) => {
          const diff = r.differential;
          const deviation = diff - averageDifferential;
          const slopeRating = r.slopeRating ?? 113;

          const predictedDifficulty: 'easy' | 'moderate' | 'hard' =
            slopeRating < 110 ? 'easy' : slopeRating < 130 ? 'moderate' : 'hard';
          const actualDifficulty: 'easy' | 'moderate' | 'hard' =
            deviation < -2 ? 'easy' : deviation > 2 ? 'hard' : 'moderate';

          return {
            courseId: r.courseId,
            courseName: r.course?.courseName ?? 'Unknown',
            predictedDifficulty,
            actualDifficulty,
            differential: diff,
            averageDifferential,
            deviation: Math.round(deviation * 10) / 10,
          };
        });

      const adjustments: DimensionAdjustment[] = [];
      const mismatches = insights.filter(
        (i) => i.predictedDifficulty !== i.actualDifficulty,
      );
      const mismatchRate = insights.length > 0 ? mismatches.length / insights.length : 0;

      const hardCoursesPlayedWell = insights.filter(
        (i) => i.predictedDifficulty === 'hard' && i.actualDifficulty !== 'hard',
      );
      if (hardCoursesPlayedWell.length >= 2) {
        adjustments.push({
          dimension: 'challenge',
          currentWeight: 50,
          suggestedWeight: 65,
          reason: `You performed better than expected at ${hardCoursesPlayedWell.length} challenging courses. Consider increasing your Challenge weight.`,
        });
      }

      const easyCoursesStruggled = insights.filter(
        (i) => i.predictedDifficulty === 'easy' && i.actualDifficulty === 'hard',
      );
      if (easyCoursesStruggled.length >= 2) {
        adjustments.push({
          dimension: 'conditioning',
          currentWeight: 50,
          suggestedWeight: 70,
          reason: `You scored higher than expected at ${easyCoursesStruggled.length} easier courses. Course conditioning may matter more to your game.`,
        });
      }

      const highDeviation = insights.filter((i) => Math.abs(i.deviation) > 3);
      if (highDeviation.length >= 3) {
        adjustments.push({
          dimension: 'layout',
          currentWeight: 50,
          suggestedWeight: 60,
          reason: `Your scores vary significantly across courses. Layout and design may affect your game more than average.`,
        });
      }

      setData({
        totalRounds: rounds.length,
        averageDifferential: Math.round(averageDifferential * 10) / 10,
        insights,
        adjustments,
        accuracyScore: Math.round((1 - mismatchRate) * 100),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-400';
      case 'moderate':
        return 'text-yellow-400';
      case 'hard':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getDifficultyBg = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/10';
      case 'moderate':
        return 'bg-yellow-500/10';
      case 'hard':
        return 'bg-red-500/10';
      default:
        return 'bg-gray-500/10';
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[#111111] p-8">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
          <span className="ml-3 text-gray-400 text-sm">
            Analyzing round data...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[#111111] p-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!data || data.totalRounds === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[#111111] p-8">
        <div className="text-center">
          <BarChart3 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No round data to analyze yet.</p>
          <p className="text-gray-500 text-xs mt-1">
            Import rounds from GHIN to see EQ Score feedback.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-[#111111]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--cg-accent,#22c55e)]/10">
            <Target className="w-5 h-5 text-[var(--cg-accent,#22c55e)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">EQ Score Feedback</h3>
            <p className="text-xs text-gray-400">
              How your rounds improve EQ Score accuracy
            </p>
          </div>
        </div>
        <button
          onClick={fetchFeedback}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          title="Refresh analysis"
        >
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-gray-800/50">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{data.totalRounds}</p>
          <p className="text-xs text-gray-400 mt-1">Rounds Analyzed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">
            {data.averageDifferential}
          </p>
          <p className="text-xs text-gray-400 mt-1">Avg Differential</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[var(--cg-accent,#22c55e)]">
            {data.accuracyScore}%
          </p>
          <p className="text-xs text-gray-400 mt-1">Prediction Accuracy</p>
        </div>
      </div>

      {/* Predicted vs Actual Comparison */}
      {data.insights.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-800/50">
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Predicted vs Actual Difficulty
          </h4>
          <div className="space-y-2">
            {data.insights.slice(0, 5).map((insight) => (
              <div
                key={`${insight.courseId}-${insight.differential}`}
                className="flex items-center justify-between py-2"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm text-white truncate">
                    {insight.courseName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Diff: {insight.differential.toFixed(1)} (
                    {insight.deviation > 0 ? '+' : ''}
                    {insight.deviation} from avg)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getDifficultyBg(insight.predictedDifficulty)} ${getDifficultyColor(insight.predictedDifficulty)}`}
                    >
                      {insight.predictedDifficulty}
                    </span>
                    <p className="text-[10px] text-gray-500 mt-0.5">Predicted</p>
                  </div>
                  <span className="text-gray-600">vs</span>
                  <div className="text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getDifficultyBg(insight.actualDifficulty)} ${getDifficultyColor(insight.actualDifficulty)}`}
                    >
                      {insight.actualDifficulty}
                    </span>
                    <p className="text-[10px] text-gray-500 mt-0.5">Actual</p>
                  </div>
                  {insight.predictedDifficulty === insight.actualDifficulty ? (
                    <span className="text-green-400 text-xs ml-1">Match</span>
                  ) : (
                    <span className="text-yellow-400 text-xs ml-1">Mismatch</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dimension Adjustments */}
      {data.adjustments.length > 0 && (
        <div className="px-6 py-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Suggested EQ Adjustments
          </h4>
          <div className="space-y-3">
            {data.adjustments.map((adj) => (
              <div
                key={adj.dimension}
                className="p-3 rounded-lg bg-white/[0.03] border border-gray-800/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white capitalize">
                    {adj.dimension}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">{adj.currentWeight}</span>
                    <TrendingUp className="w-3.5 h-3.5 text-[var(--cg-accent,#22c55e)]" />
                    <span className="text-[var(--cg-accent,#22c55e)] font-medium">
                      {adj.suggestedWeight}
                    </span>
                  </div>
                </div>
                {/* Weight comparison bar */}
                <div className="relative h-2 rounded-full bg-gray-800 mb-2">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-gray-600"
                    style={{ width: `${adj.currentWeight}%` }}
                  />
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-[var(--cg-accent,#22c55e)]/60"
                    style={{ width: `${adj.suggestedWeight}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">{adj.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.adjustments.length === 0 && data.insights.length > 0 && (
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <TrendingDown className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-400">
              Your EQ Score dimensions are well-calibrated based on your recent
              rounds. No adjustments suggested.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
