"use client";

import { useState } from "react";
import { ArticleCard } from "./ArticleCard";
import { CategoryFilter } from "./CategoryFilter";

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

interface ArticleGridProps {
  articles: Article[];
  subcategories: { value: string; label: string }[];
  showCategoryFilter?: boolean;
}

export function ArticleGrid({ articles, subcategories, showCategoryFilter = true }: ArticleGridProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  const allOption = { value: "all", label: "All" };
  const filterOptions = [allOption, ...subcategories];

  const filtered =
    activeFilter === "all"
      ? articles
      : articles.filter((a) => a.subcategory === activeFilter);

  return (
    <div>
      {showCategoryFilter && subcategories.length > 1 && (
        <div className="mb-8">
          <CategoryFilter
            categories={filterOptions}
            active={activeFilter}
            onSelect={setActiveFilter}
          />
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((article) => (
          <ArticleCard key={article.slug} {...article} />
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
  );
}
