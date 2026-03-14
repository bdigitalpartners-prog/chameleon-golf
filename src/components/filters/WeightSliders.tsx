"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import type { WeightSliderValues } from "@/types";

const STORAGE_KEY = "cg-weights";

const DEFAULT_WEIGHTS: WeightSliderValues = {
  w_expert: 50,
  w_conditioning: 50,
  w_layout: 50,
  w_aesthetics: 50,
  w_challenge: 50,
  w_value: 50,
  w_walkability: 50,
  w_pace: 50,
  w_amenities: 50,
  w_service: 50,
};

const DIMENSIONS: { key: keyof WeightSliderValues; label: string; color: string }[] = [
  { key: "w_expert", label: "Expert Rankings", color: "#a855f7" },
  { key: "w_conditioning", label: "Conditioning", color: "#22c55e" },
  { key: "w_layout", label: "Layout & Design", color: "#3b82f6" },
  { key: "w_aesthetics", label: "Aesthetics", color: "#f59e0b" },
  { key: "w_challenge", label: "Challenge", color: "#ef4444" },
  { key: "w_value", label: "Value", color: "#14b8a6" },
  { key: "w_walkability", label: "Walkability", color: "#84cc16" },
  { key: "w_pace", label: "Pace of Play", color: "#f97316" },
  { key: "w_amenities", label: "Amenities", color: "#06b6d4" },
  { key: "w_service", label: "Service", color: "#ec4899" },
];

const PERSONAS: { label: string; weights: WeightSliderValues }[] = [
  {
    label: "Balanced",
    weights: { ...DEFAULT_WEIGHTS },
  },
  {
    label: "The Purist",
    weights: {
      ...DEFAULT_WEIGHTS,
      w_expert: 80,
      w_layout: 90,
      w_aesthetics: 85,
      w_challenge: 70,
      w_conditioning: 60,
      w_value: 20,
      w_amenities: 20,
      w_service: 20,
    },
  },
  {
    label: "The Value Seeker",
    weights: {
      ...DEFAULT_WEIGHTS,
      w_value: 100,
      w_expert: 30,
      w_layout: 60,
      w_aesthetics: 40,
      w_amenities: 70,
      w_service: 70,
    },
  },
  {
    label: "The Traveler",
    weights: {
      ...DEFAULT_WEIGHTS,
      w_walkability: 80,
      w_amenities: 90,
      w_aesthetics: 70,
      w_service: 80,
      w_pace: 70,
      w_value: 60,
    },
  },
  {
    label: "The Walker",
    weights: {
      ...DEFAULT_WEIGHTS,
      w_walkability: 100,
      w_pace: 80,
      w_conditioning: 60,
    },
  },
];

function isCustom(weights: WeightSliderValues): boolean {
  return DIMENSIONS.some((d) => weights[d.key] !== DEFAULT_WEIGHTS[d.key]);
}

interface WeightSlidersProps {
  onChange: (weights: WeightSliderValues | null) => void;
}

export function WeightSliders({ onChange }: WeightSlidersProps) {
  const [open, setOpen] = useState(false);
  const [weights, setWeights] = useState<WeightSliderValues>(DEFAULT_WEIGHTS);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WeightSliderValues;
        setWeights(parsed);
        if (isCustom(parsed)) {
          onChange(parsed);
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyWeights = useCallback(
    (w: WeightSliderValues) => {
      setWeights(w);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
      } catch {}
      onChange(isCustom(w) ? w : null);
    },
    [onChange]
  );

  const handleSlider = (key: keyof WeightSliderValues, value: number) => {
    applyWeights({ ...weights, [key]: value });
  };

  const handlePersona = (persona: (typeof PERSONAS)[0]) => {
    applyWeights(persona.weights);
  };

  const handleReset = () => {
    applyWeights({ ...DEFAULT_WEIGHTS });
  };

  const active = isCustom(weights);

  return (
    <div
      className="rounded-xl overflow-hidden mb-4"
      style={{
        backgroundColor: "var(--cg-bg-card)",
        border: `1px solid ${active ? "var(--cg-accent)" : "var(--cg-border)"}`,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-bold"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Personalized Ranking
          </span>
          {active && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{
                backgroundColor: "var(--cg-accent-bg)",
                color: "var(--cg-accent)",
              }}
            >
              Custom
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {active && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-opacity hover:opacity-80"
              style={{
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-muted)",
              }}
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            style={{ color: "var(--cg-text-muted)" }}
          />
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div
          className="px-5 pb-5"
          style={{ borderTop: "1px solid var(--cg-border)" }}
        >
          {/* Persona Buttons */}
          <div className="mt-4 mb-5 flex flex-wrap gap-2">
            {PERSONAS.map((p) => {
              const isActive =
                DIMENSIONS.every((d) => weights[d.key] === p.weights[d.key]);
              return (
                <button
                  key={p.label}
                  onClick={() => handlePersona(p)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: isActive
                      ? "var(--cg-accent)"
                      : "var(--cg-bg-tertiary)",
                    color: isActive
                      ? "var(--cg-text-inverse)"
                      : "var(--cg-text-secondary)",
                    border: `1px solid ${isActive ? "var(--cg-accent)" : "var(--cg-border)"}`,
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Sliders Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {DIMENSIONS.map((dim) => {
              const val = weights[dim.key];
              return (
                <div key={dim.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-xs font-medium"
                      style={{ color: "var(--cg-text-secondary)" }}
                    >
                      {dim.label}
                    </label>
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: dim.color }}
                    >
                      {val}
                    </span>
                  </div>
                  <div className="relative h-5 flex items-center">
                    {/* Track */}
                    <div
                      className="absolute h-1.5 w-full rounded-full"
                      style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                    />
                    {/* Fill */}
                    <div
                      className="absolute h-1.5 rounded-full transition-all"
                      style={{
                        width: `${val}%`,
                        backgroundColor: dim.color,
                      }}
                    />
                    {/* Range input */}
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={val}
                      onChange={(e) =>
                        handleSlider(dim.key, parseInt(e.target.value))
                      }
                      className="absolute w-full appearance-none bg-transparent cursor-pointer"
                      style={
                        {
                          "--thumb-color": dim.color,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
