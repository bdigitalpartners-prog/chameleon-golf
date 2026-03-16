"use client";

import Link from "next/link";
import { ChevronRight, BarChart3 } from "lucide-react";
import { useState } from "react";
import { StatsCard } from "@/components/performance/StatsCard";
import { CategoryFilter } from "@/components/performance/CategoryFilter";

interface Article {
  slug: string;
  title: string;
  subtitle: string | null;
  category: string;
  subcategory: string;
  difficulty: string | null;
  estimatedTime: string | null;
  tags: string[];
  featured: boolean;
}

const subcategories = [
  { value: "all", label: "All" },
  { value: "know-your-numbers", label: "Know Your Numbers" },
  { value: "strokes-gained", label: "Strokes Gained" },
  { value: "handicap", label: "Handicap Intelligence" },
  { value: "practice-metrics", label: "Practice Metrics" },
];

const statHighlights: Record<string, string> = {
  "key-golf-stats-to-track": "7",
  "strokes-gained-explained": "SG",
  "handicap-index-intelligence": "WHS",
  "practice-metrics-guide": "%",
};

export function StatsPageClient({ articles }: { articles: Article[] }) {
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered =
    activeFilter === "all"
      ? articles
      : articles.filter((a) => a.subcategory === activeFilter);

  return (
    <div style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      {/* Breadcrumb */}
      <div
        className="border-b"
        style={{
          backgroundColor: "var(--cg-bg-secondary)",
          borderColor: "var(--cg-border)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-3">
          <nav className="flex items-center gap-2 text-sm" style={{ color: "var(--cg-text-muted)" }}>
            <Link
              href="/performance"
              className="transition-colors hover:underline"
              style={{ color: "var(--cg-text-secondary)" }}
            >
              Performance Center
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span style={{ color: "var(--cg-text-muted)" }}>The Stats Center</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 50% -30%, var(--cg-accent-glow), transparent),
              var(--cg-bg-primary)
            `,
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-12 sm:pt-20 sm:pb-16">
          <div
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
          >
            <BarChart3 className="h-7 w-7" />
          </div>
          <h1
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: "var(--cg-text-primary)" }}
          >
            The Stats Center
          </h1>
          <p
            className="mt-4 max-w-2xl text-lg leading-relaxed"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            Understanding and using golf statistics — key metrics, strokes gained methodology, handicap intelligence, and practice measurement.
          </p>
        </div>
      </section>

      {/* Articles */}
      <section
        className="py-12 sm:py-16"
        style={{ backgroundColor: "var(--cg-bg-secondary)" }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8">
            <CategoryFilter
              categories={subcategories}
              active={activeFilter}
              onSelect={setActiveFilter}
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((article) => (
              <StatsCard
                key={article.slug}
                slug={article.slug}
                title={article.title}
                subtitle={article.subtitle}
                estimatedTime={article.estimatedTime}
                difficulty={article.difficulty}
                tags={article.tags}
                statHighlight={statHighlights[article.slug]}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p style={{ color: "var(--cg-text-muted)" }}>
                No articles found in this category.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
