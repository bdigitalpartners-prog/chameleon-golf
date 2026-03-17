"use client";

import { useState } from "react";
import {
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Loader2,
  Coins,
  Zap,
  Brain,
  ArrowRight,
} from "lucide-react";

interface PredictionCardProps {
  courseId: number;
  courseName: string;
  coursePar?: number;
  /** If provided, the prediction has already been made */
  prediction?: {
    id: string;
    predictedScore: number;
    eqBaseline: number | null;
    actualScore: number | null;
    accuracy: number | null;
    beatAlgorithm: boolean | null;
    status: string;
    tokensEarned: number;
  };
  onPredictionSubmitted?: () => void;
}

export default function PredictionCard({
  courseId,
  courseName,
  coursePar,
  prediction,
  onPredictionSubmitted,
}: PredictionCardProps) {
  const [predictedScore, setPredictedScore] = useState<string>("");
  const [actualScore, setActualScore] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [localPrediction, setLocalPrediction] = useState(prediction ?? null);

  const isCompleted = localPrediction?.status === "completed";
  const isPending = localPrediction?.status === "pending";

  async function handleSubmitPrediction() {
    if (!predictedScore) return;
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          predictedScore: parseInt(predictedScore, 10),
          playDate: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit prediction");
      }
      const data = await res.json();
      setLocalPrediction(data);
      onPredictionSubmitted?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecordScore() {
    if (!actualScore || !localPrediction) return;
    try {
      setScoring(true);
      setError(null);
      const res = await fetch(`/api/predictions/${localPrediction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actualScore: parseInt(actualScore, 10) }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to record score");
      }
      const data = await res.json();
      setLocalPrediction(data.prediction);
      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setScoring(false);
    }
  }

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Score Prediction</h3>
        </div>
        {isCompleted && (
          <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Scored
          </span>
        )}
      </div>

      <div className="p-5">
        {/* Course info */}
        <div className="mb-4">
          <p className="text-sm text-gray-400">Course</p>
          <p className="text-white font-medium">{courseName}</p>
          {coursePar && (
            <p className="text-xs text-gray-500">Par {coursePar}</p>
          )}
        </div>

        {/* New Prediction Input */}
        {!localPrediction && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              What will you shoot today?
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={predictedScore}
                onChange={(e) => setPredictedScore(e.target.value)}
                placeholder="e.g. 85"
                className="flex-1 px-4 py-3 bg-[#111111] border border-gray-700 rounded-lg text-white text-center text-lg font-semibold placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
                min={50}
                max={150}
              />
              <button
                onClick={handleSubmitPrediction}
                disabled={!predictedScore || submitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Predict
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Pending Prediction — record actual score */}
        {isPending && localPrediction && (
          <div>
            {/* Show prediction vs EQ baseline */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#111111] rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Your Prediction</p>
                <p className="text-2xl font-bold text-blue-400">
                  {localPrediction.predictedScore}
                </p>
              </div>
              <div className="bg-[#111111] rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                  <Brain className="w-3 h-3" />
                  EQ Baseline
                </p>
                <p className="text-2xl font-bold text-gray-400">
                  {localPrediction.eqBaseline ?? "—"}
                </p>
              </div>
            </div>

            <label className="block text-sm text-gray-400 mb-2">
              Record your actual score
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={actualScore}
                onChange={(e) => setActualScore(e.target.value)}
                placeholder="Actual score"
                className="flex-1 px-4 py-3 bg-[#111111] border border-gray-700 rounded-lg text-white text-center text-lg font-semibold placeholder-gray-600 focus:outline-none focus:border-green-500 transition"
                min={50}
                max={150}
              />
              <button
                onClick={handleRecordScore}
                disabled={!actualScore || scoring}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {scoring ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Score
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Completed Prediction — show results */}
        {isCompleted && localPrediction && (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-[#111111] rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Predicted</p>
                <p className="text-xl font-bold text-blue-400">
                  {localPrediction.predictedScore}
                </p>
              </div>
              <div className="bg-[#111111] rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Actual</p>
                <p className="text-xl font-bold text-white">
                  {localPrediction.actualScore}
                </p>
              </div>
              <div className="bg-[#111111] rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                  <Brain className="w-3 h-3" />
                  EQ Baseline
                </p>
                <p className="text-xl font-bold text-gray-400">
                  {localPrediction.eqBaseline ?? "—"}
                </p>
              </div>
            </div>

            {/* Accuracy meter */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Accuracy</span>
                <span className="text-white font-semibold">
                  {localPrediction.accuracy != null
                    ? `${Number(localPrediction.accuracy).toFixed(0)}%`
                    : "—"}
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    Number(localPrediction.accuracy ?? 0) >= 80
                      ? "bg-green-500"
                      : Number(localPrediction.accuracy ?? 0) >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.max(0, Number(localPrediction.accuracy ?? 0))}%`,
                  }}
                />
              </div>
            </div>

            {/* Beat the Algorithm indicator */}
            <div
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                localPrediction.beatAlgorithm
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/5 border-gray-800"
              }`}
            >
              {localPrediction.beatAlgorithm ? (
                <>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-semibold text-green-400">
                      You Beat the Algorithm!
                    </p>
                    <p className="text-xs text-green-300/70">
                      Your prediction was more accurate than EQ Baseline
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <TrendingDown className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Algorithm Wins This Time
                    </p>
                    <p className="text-xs text-gray-500">
                      EQ Baseline was closer to your actual score
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Tokens earned */}
            {localPrediction.tokensEarned > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-amber-400">
                <Coins className="w-4 h-4" />
                <span>+{localPrediction.tokensEarned} EQ Tokens earned</span>
              </div>
            )}

            {/* Result details from scoring */}
            {result && (
              <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-4 text-xs text-gray-500">
                <span>
                  Off by {result.difference} stroke
                  {result.difference !== 1 ? "s" : ""}
                </span>
                <span>
                  Algorithm off by {result.algorithmDifference} stroke
                  {result.algorithmDifference !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
