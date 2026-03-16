"use client";

import Link from "next/link";
import {
  ChevronRight,
  Crosshair,
  Dumbbell,
  Brain,
  Wrench,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { ArticleGrid } from "@/components/performance/ArticleGrid";

const iconMap: Record<string, LucideIcon> = {
  Crosshair,
  Dumbbell,
  Brain,
  Wrench,
  BarChart3,
};

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

interface CategoryPageLayoutProps {
  title: string;
  description: string;
  iconName: string;
  articles: Article[];
  subcategories: { value: string; label: string }[];
}

export function CategoryPageLayout({
  title,
  description,
  iconName,
  articles,
  subcategories,
}: CategoryPageLayoutProps) {
  const Icon = iconMap[iconName] || Crosshair;
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
            <span style={{ color: "var(--cg-text-muted)" }}>{title}</span>
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
            <Icon className="h-7 w-7" />
          </div>
          <h1
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: "var(--cg-text-primary)" }}
          >
            {title}
          </h1>
          <p
            className="mt-4 max-w-2xl text-lg leading-relaxed"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            {description}
          </p>
        </div>
      </section>

      {/* Articles */}
      <section
        className="py-12 sm:py-16"
        style={{ backgroundColor: "var(--cg-bg-secondary)" }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <ArticleGrid
            articles={articles}
            subcategories={subcategories}
          />
        </div>
      </section>
    </div>
  );
}
