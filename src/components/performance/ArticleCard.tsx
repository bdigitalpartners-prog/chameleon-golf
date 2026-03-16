"use client";

import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { DifficultyBadge } from "./DifficultyBadge";

interface ArticleCardProps {
  slug: string;
  title: string;
  subtitle?: string | null;
  category: string;
  subcategory: string;
  difficulty?: string | null;
  estimatedTime?: string | null;
  tags: string[];
  featured?: boolean;
}

const categoryLabels: Record<string, string> = {
  "swing-lab": "Swing Lab",
  fitness: "Golf Fitness",
  "mental-game": "Mental Game",
  "equipment-intel": "Equipment Intel",
  "stats-center": "Stats Center",
};

export function ArticleCard({
  slug,
  title,
  subtitle,
  category,
  difficulty,
  estimatedTime,
  tags,
  featured,
}: ArticleCardProps) {
  return (
    <Link href={`/performance/${slug}`}>
      <div
        className="group h-full rounded-xl overflow-hidden transition-all"
        style={{
          backgroundColor: "var(--cg-bg-card)",
          border: `1px solid ${featured ? "var(--cg-accent-muted)" : "var(--cg-border)"}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--cg-accent-muted)";
          e.currentTarget.style.backgroundColor = "var(--cg-bg-card-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = featured ? "var(--cg-accent-muted)" : "var(--cg-border)";
          e.currentTarget.style.backgroundColor = "var(--cg-bg-card)";
        }}
      >
        <div className="p-5">
          {/* Top row: category + difficulty */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className="rounded-md px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: "var(--cg-accent-bg)",
                color: "var(--cg-accent)",
              }}
            >
              {categoryLabels[category] || category}
            </span>
            <DifficultyBadge difficulty={difficulty ?? null} />
            {featured && (
              <span
                className="rounded-md px-2 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: "rgba(234,179,8,0.15)",
                  color: "#eab308",
                }}
              >
                Featured
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

          {/* Time + tags */}
          <div className="mt-4 flex items-center gap-3">
            {estimatedTime && (
              <span
                className="inline-flex items-center gap-1 text-xs"
                style={{ color: "var(--cg-text-muted)" }}
              >
                <Clock className="h-3 w-3" />
                {estimatedTime}
              </span>
            )}
          </div>

          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.slice(0, 4).map((tag) => (
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
            Read More
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}
