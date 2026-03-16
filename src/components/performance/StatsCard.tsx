"use client";

import Link from "next/link";
import { BarChart3, ArrowRight } from "lucide-react";
import { DifficultyBadge } from "./DifficultyBadge";

interface StatsCardProps {
  slug: string;
  title: string;
  subtitle?: string | null;
  estimatedTime?: string | null;
  difficulty?: string | null;
  tags: string[];
  statHighlight?: string;
}

export function StatsCard({
  slug,
  title,
  subtitle,
  estimatedTime,
  difficulty,
  tags,
  statHighlight,
}: StatsCardProps) {
  return (
    <Link href={`/performance/${slug}`}>
      <div
        className="group rounded-xl p-6 transition-all"
        style={{
          backgroundColor: "var(--cg-bg-card)",
          border: "1px solid var(--cg-border)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--cg-accent-muted)";
          e.currentTarget.style.backgroundColor = "var(--cg-bg-card-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--cg-border)";
          e.currentTarget.style.backgroundColor = "var(--cg-bg-card)";
        }}
      >
        {/* Stat icon area */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
          >
            <BarChart3 className="h-6 w-6" />
          </div>
          {statHighlight && (
            <span
              className="text-2xl font-bold"
              style={{ color: "var(--cg-accent)" }}
            >
              {statHighlight}
            </span>
          )}
        </div>

        <h3
          className="font-display text-lg font-semibold leading-tight"
          style={{ color: "var(--cg-text-primary)" }}
        >
          {title}
        </h3>

        {subtitle && (
          <p
            className="mt-2 text-sm leading-relaxed line-clamp-2"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            {subtitle}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <DifficultyBadge difficulty={difficulty ?? null} />
          {estimatedTime && (
            <span
              className="text-xs font-medium"
              style={{ color: "var(--cg-text-muted)" }}
            >
              {estimatedTime}
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  color: "var(--cg-text-muted)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div
          className="mt-4 flex items-center gap-1 text-sm font-medium transition-colors"
          style={{ color: "var(--cg-accent)" }}
        >
          Read Analysis
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
