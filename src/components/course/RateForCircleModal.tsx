"use client";

import { useState } from "react";
import { X, Star, Loader2 } from "lucide-react";

interface Circle {
  id: string;
  name: string;
  imageUrl?: string | null;
}

const DIMENSIONS = [
  { key: "conditioning", label: "Conditioning" },
  { key: "design", label: "Design" },
  { key: "difficulty", label: "Difficulty" },
  { key: "amenities", label: "Amenities" },
  { key: "value", label: "Value" },
];

export function RateForCircleModal({
  courseId,
  courseName,
  circles,
  onClose,
  onRated,
}: {
  courseId: number;
  courseName: string;
  circles: Circle[];
  onClose: () => void;
  onRated: () => void;
}) {
  const [selectedCircles, setSelectedCircles] = useState<string[]>(
    circles.length === 1 ? [circles[0].id] : []
  );
  const [overallScore, setOverallScore] = useState(7);
  const [dimensions, setDimensions] = useState<Record<string, number>>({});
  const [reviewText, setReviewText] = useState("");
  const [playDate, setPlayDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleCircle = (id: string) => {
    setSelectedCircles((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedCircles.length === 0) {
      setError("Select at least one circle");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const dimPayload = Object.keys(dimensions).length > 0 ? dimensions : undefined;

      for (const circleId of selectedCircles) {
        const res = await fetch(`/api/circles/${circleId}/ratings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            overallScore,
            dimensions: dimPayload,
            reviewText: reviewText || undefined,
            playDate: playDate || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to submit rating");
        }
      }
      onRated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl p-6"
        style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold" style={{ color: "var(--cg-text-primary)" }}>
            Rate {courseName}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: "var(--cg-text-muted)" }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Circle selection */}
        <div className="mb-5">
          <label className="text-sm font-medium mb-2 block" style={{ color: "var(--cg-text-primary)" }}>
            Share with circles
          </label>
          <div className="flex flex-wrap gap-2">
            {circles.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleCircle(c.id)}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  backgroundColor: selectedCircles.includes(c.id) ? "var(--cg-accent)" : "var(--cg-bg-secondary)",
                  color: selectedCircles.includes(c.id) ? "var(--cg-text-inverse)" : "var(--cg-text-secondary)",
                  border: `1px solid ${selectedCircles.includes(c.id) ? "var(--cg-accent)" : "var(--cg-border)"}`,
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Overall score */}
        <div className="mb-5">
          <label className="text-sm font-medium mb-2 block" style={{ color: "var(--cg-text-primary)" }}>
            Overall Score: <span style={{ color: "var(--cg-accent)" }}>{overallScore.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={overallScore}
            onChange={(e) => setOverallScore(parseFloat(e.target.value))}
            className="w-full accent-green-500"
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: "var(--cg-text-muted)" }}>
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        {/* Dimension ratings */}
        <div className="mb-5">
          <label className="text-sm font-medium mb-2 block" style={{ color: "var(--cg-text-primary)" }}>
            Dimensions <span className="font-normal" style={{ color: "var(--cg-text-muted)" }}>(optional)</span>
          </label>
          <div className="space-y-3">
            {DIMENSIONS.map((dim) => (
              <div key={dim.key} className="flex items-center gap-3">
                <span className="w-24 text-xs shrink-0" style={{ color: "var(--cg-text-secondary)" }}>
                  {dim.label}
                </span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={dimensions[dim.key] ?? 5}
                  onChange={(e) =>
                    setDimensions((prev) => ({ ...prev, [dim.key]: parseFloat(e.target.value) }))
                  }
                  className="flex-1 accent-green-500"
                />
                <span className="w-8 text-right text-xs font-semibold tabular-nums" style={{ color: "var(--cg-text-primary)" }}>
                  {(dimensions[dim.key] ?? 5).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Review text */}
        <div className="mb-5">
          <label className="text-sm font-medium mb-2 block" style={{ color: "var(--cg-text-primary)" }}>
            Review <span className="font-normal" style={{ color: "var(--cg-text-muted)" }}>(optional)</span>
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={3}
            className="w-full rounded-lg p-3 text-sm resize-none"
            style={{
              backgroundColor: "var(--cg-bg-secondary)",
              color: "var(--cg-text-primary)",
              border: "1px solid var(--cg-border)",
            }}
            placeholder="Share your thoughts..."
          />
        </div>

        {/* Play date */}
        <div className="mb-5">
          <label className="text-sm font-medium mb-2 block" style={{ color: "var(--cg-text-primary)" }}>
            Play Date <span className="font-normal" style={{ color: "var(--cg-text-muted)" }}>(optional)</span>
          </label>
          <input
            type="date"
            value={playDate}
            onChange={(e) => setPlayDate(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm"
            style={{
              backgroundColor: "var(--cg-bg-secondary)",
              color: "var(--cg-text-primary)",
              border: "1px solid var(--cg-border)",
            }}
          />
        </div>

        {error && (
          <p className="text-sm mb-4" style={{ color: "#ef4444" }}>
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedCircles.length === 0}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
            style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Rating"}
          </button>
        </div>
      </div>
    </div>
  );
}
