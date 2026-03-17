"use client";

import { useState } from "react";

interface LeagueRoundFormProps {
  circleId: string;
  seasonId: string;
  onSubmitted?: () => void;
}

export default function LeagueRoundForm({ circleId, seasonId, onSubmitted }: LeagueRoundFormProps) {
  const [courseId, setCourseId] = useState("");
  const [score, setScore] = useState("");
  const [playDate, setPlayDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/circles/${circleId}/league/rounds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seasonId,
          courseId: parseInt(courseId, 10),
          score: parseInt(score, 10),
          playDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit round");
      setResult(data);
      setCourseId("");
      setScore("");
      onSubmitted?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Submit League Round</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Course ID</label>
          <input
            type="number"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
            className="w-full bg-[#111111] border border-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:border-emerald-400 focus:outline-none"
            placeholder="Enter course ID"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Score</label>
          <input
            type="number"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            required
            min={40}
            max={200}
            className="w-full bg-[#111111] border border-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:border-emerald-400 focus:outline-none"
            placeholder="Your total score"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Play Date</label>
          <input
            type="date"
            value={playDate}
            onChange={(e) => setPlayDate(e.target.value)}
            required
            className="w-full bg-[#111111] border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {result && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <p className="text-emerald-400 font-medium">Round submitted!</p>
            <p className="text-sm text-gray-400 mt-1">EQ Points earned: {Number(result.eqPoints).toFixed(1)}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-lg font-medium transition-colors"
        >
          {submitting ? "Submitting..." : "Submit Round"}
        </button>
      </form>
    </div>
  );
}
