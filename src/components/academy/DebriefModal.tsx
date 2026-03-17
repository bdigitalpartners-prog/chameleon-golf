"use client";

import { useState } from "react";

interface DebriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  roundId?: number;
  courseId?: number;
  onSubmitted?: (debrief: any) => void;
}

export default function DebriefModal({ isOpen, onClose, roundId, courseId, onSubmitted }: DebriefModalProps) {
  const [greensQuality, setGreensQuality] = useState<number | null>(null);
  const [fairwayQuality, setFairwayQuality] = useState<number | null>(null);
  const [paceOfPlay, setPaceOfPlay] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [wouldReturn, setWouldReturn] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/academy/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId,
          courseId,
          greensQuality,
          fairwayQuality,
          paceOfPlay,
          difficulty,
          recommendations,
          wouldReturn,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSubmitted?.(data.debrief);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const ratingOptions = [1, 2, 3, 4, 5];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Course Debrief</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Greens Quality</label>
            <div className="flex gap-2">
              {ratingOptions.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setGreensQuality(n)}
                  className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                    greensQuality === n
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Fairway Quality</label>
            <div className="flex gap-2">
              {ratingOptions.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFairwayQuality(n)}
                  className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                    fairwayQuality === n
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Pace of Play</label>
            <select
              value={paceOfPlay}
              onChange={(e) => setPaceOfPlay(e.target.value)}
              className="w-full bg-[#111111] border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="">Select...</option>
              <option value="fast">Fast (under 3.5 hrs)</option>
              <option value="normal">Normal (3.5-4.5 hrs)</option>
              <option value="slow">Slow (over 4.5 hrs)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-[#111111] border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="">Select...</option>
              <option value="easy">Easier than expected</option>
              <option value="as_expected">As expected</option>
              <option value="hard">Harder than expected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Recommendations / Notes</label>
            <textarea
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              rows={3}
              className="w-full bg-[#111111] border border-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:border-emerald-400 focus:outline-none resize-none"
              placeholder="Tips for others playing this course..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Would you return?</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWouldReturn(true)}
                className={`px-5 py-2 rounded-lg border text-sm transition-colors ${
                  wouldReturn === true
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-gray-700 text-gray-400 hover:border-gray-500"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setWouldReturn(false)}
                className={`px-5 py-2 rounded-lg border text-sm transition-colors ${
                  wouldReturn === false
                    ? "bg-red-500 border-red-500 text-white"
                    : "border-gray-700 text-gray-400 hover:border-gray-500"
                }`}
              >
                No
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Debrief"}
          </button>
        </form>
      </div>
    </div>
  );
}
