"use client";

import { Activity, Zap } from "lucide-react";

export function PerformanceHero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, var(--cg-accent-glow), transparent),
            radial-gradient(ellipse 60% 40% at 80% 80%, var(--cg-accent-bg), transparent),
            var(--cg-bg-primary)
          `,
        }}
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--cg-text-primary) 1px, transparent 1px),
            linear-gradient(90deg, var(--cg-text-primary) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="max-w-3xl">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
            style={{
              backgroundColor: "var(--cg-accent-bg)",
              color: "var(--cg-accent)",
              border: "1px solid var(--cg-accent-muted)",
            }}
          >
            <Activity className="h-3.5 w-3.5" />
            The Performance Center
          </div>

          <h1
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Elevate Your Game.{" "}
            <span style={{ color: "var(--cg-accent)" }}>Every Shot.</span>
          </h1>

          <p
            className="mt-6 text-lg leading-relaxed sm:text-xl max-w-2xl"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            A comprehensive golf training hub — from swing mechanics and fitness
            to mental game strategy and equipment intelligence. Data-driven
            insights to lower your scores.
          </p>

          {/* Stats bar */}
          <div
            className="mt-10 flex flex-wrap gap-6 text-sm"
            style={{ color: "var(--cg-text-muted)" }}
          >
            <span>
              <strong style={{ color: "var(--cg-accent)" }}>5</strong> training sections
            </span>
            <span>
              <strong style={{ color: "var(--cg-accent)" }}>20+</strong> guides & drills
            </span>
            <span>
              <strong style={{ color: "var(--cg-accent)" }}>All</strong> skill levels
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
