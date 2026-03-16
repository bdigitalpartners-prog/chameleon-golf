"use client";

import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

interface PerformanceCategoryCardProps {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  articleCount: number;
}

export function PerformanceCategoryCard({
  href,
  title,
  description,
  icon: Icon,
  articleCount,
}: PerformanceCategoryCardProps) {
  return (
    <Link href={href}>
      <div
        className="group h-full rounded-2xl p-8 transition-all"
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
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
        >
          <Icon className="h-6 w-6" />
        </div>

        <h3
          className="mt-5 text-lg font-semibold"
          style={{ color: "var(--cg-text-primary)" }}
        >
          {title}
        </h3>

        <p
          className="mt-3 text-sm leading-relaxed"
          style={{ color: "var(--cg-text-secondary)" }}
        >
          {description}
        </p>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: "var(--cg-text-muted)" }}>
            {articleCount} {articleCount === 1 ? "guide" : "guides"}
          </span>
          <span
            className="inline-flex items-center gap-1 text-sm font-medium transition-colors"
            style={{ color: "var(--cg-accent)" }}
          >
            Explore
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
