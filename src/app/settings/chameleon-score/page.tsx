"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, RotateCcw, Sliders } from "lucide-react";

interface CircleWeight {
  circleId: string;
  circleName: string;
  avatarUrl: string | null;
  weight: number;
  enabled: boolean;
}

export default function ChameleonScoreSettingsPage() {
  const { data: session, status: authStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weights, setWeights] = useState<CircleWeight[]>([]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    fetch("/api/settings/circle-weights")
      .then((r) => r.json())
      .then((data) => setWeights(data.weights || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authStatus]);

  const updateWeight = (circleId: string, weight: number) => {
    setWeights((prev) =>
      prev.map((w) => (w.circleId === circleId ? { ...w, weight } : w))
    );
  };

  const toggleEnabled = (circleId: string) => {
    setWeights((prev) =>
      prev.map((w) =>
        w.circleId === circleId ? { ...w, enabled: !w.enabled } : w
      )
    );
  };

  const resetDefaults = () => {
    setWeights((prev) => prev.map((w) => ({ ...w, weight: 0.5, enabled: true })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings/circle-weights", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weights: weights.map((w) => ({
            circleId: w.circleId,
            weight: w.weight,
            enabled: w.enabled,
          })),
        }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center" style={{ color: "var(--cg-text-primary)" }}>
        <p>Please sign in to manage your Chameleon Score settings.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
            Chameleon Score Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--cg-text-muted)" }}>
            Control how your circles influence your personalized course scores
          </p>
        </div>
        <Sliders className="h-6 w-6" style={{ color: "var(--cg-accent)" }} />
      </div>

      {/* Explanation card */}
      <div
        className="rounded-xl p-4 mb-6"
        style={{ backgroundColor: "var(--cg-accent-muted)", border: "1px solid var(--cg-accent)" }}
      >
        <p className="text-sm" style={{ color: "var(--cg-text-primary)" }}>
          Your Chameleon Score blends editorial rankings, your personal ratings, and your circle ratings.
          Adjust the weight of each circle to fine-tune how much their opinions influence your score.
        </p>
        <p className="text-xs mt-2" style={{ color: "var(--cg-text-secondary)" }}>
          Default weights: Editorial 30% &middot; Personal 30% &middot; Circles 40%
        </p>
      </div>

      {weights.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <p style={{ color: "var(--cg-text-muted)" }}>
            Join a circle to start personalizing your Chameleon Score.
          </p>
        </div>
      ) : (
        <>
          <div
            className="rounded-xl divide-y"
            style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)", "--tw-divide-opacity": 1 } as React.CSSProperties}
          >
            {weights.map((w) => (
              <div key={w.circleId} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: w.avatarUrl ? "transparent" : "var(--cg-accent-muted)",
                        color: "var(--cg-accent)",
                        backgroundImage: w.avatarUrl ? `url(${w.avatarUrl})` : undefined,
                        backgroundSize: "cover",
                      }}
                    >
                      {!w.avatarUrl && w.circleName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: w.enabled ? "var(--cg-text-primary)" : "var(--cg-text-muted)" }}
                      >
                        {w.circleName}
                      </span>
                      <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                        Weight: {Math.round(w.weight * 100)}%
                      </p>
                    </div>
                  </div>
                  {/* Enable/disable toggle */}
                  <button
                    onClick={() => toggleEnabled(w.circleId)}
                    className="relative h-6 w-11 rounded-full transition-colors"
                    style={{
                      backgroundColor: w.enabled ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
                    }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                      style={{ transform: w.enabled ? "translateX(1.25rem)" : "translateX(0)" }}
                    />
                  </button>
                </div>

                {/* Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-xs w-6 text-right" style={{ color: "var(--cg-text-muted)" }}>0</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(w.weight * 100)}
                    onChange={(e) => updateWeight(w.circleId, parseInt(e.target.value) / 100)}
                    disabled={!w.enabled}
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      accentColor: "var(--cg-accent)",
                      opacity: w.enabled ? 1 : 0.4,
                    }}
                  />
                  <span className="text-xs w-10" style={{ color: "var(--cg-text-muted)" }}>100%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={resetDefaults}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                color: "var(--cg-text-secondary)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all"
              style={{
                backgroundColor: "var(--cg-accent)",
                color: "var(--cg-text-inverse)",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
