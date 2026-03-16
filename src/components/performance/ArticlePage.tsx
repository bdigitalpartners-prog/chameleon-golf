"use client";

import Link from "next/link";
import { ChevronRight, Clock, ArrowLeft } from "lucide-react";
import { DifficultyBadge } from "./DifficultyBadge";
import { VideoEmbed } from "./VideoEmbed";
import { ArticleCard } from "./ArticleCard";

interface ArticleSummary {
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

interface Article extends ArticleSummary {
  content: string;
  videoUrl: string | null;
  publishedAt: string;
}

interface ArticlePageProps {
  article: Article;
  relatedArticles: ArticleSummary[];
}

const categoryLabels: Record<string, string> = {
  "swing-lab": "Swing Lab",
  fitness: "Golf Fitness",
  "mental-game": "Mental Game",
  "equipment-intel": "Equipment Intel",
  "stats-center": "Stats Center",
};

function renderMarkdown(content: string) {
  // Simple markdown renderer for headings, bold, italic, lists, tables, code
  const lines = content.split("\n");
  const html: string[] = [];
  let inList = false;
  let inTable = false;
  let tableHeader = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Close list if not a list item
    if (inList && !trimmed.startsWith("- ") && !trimmed.match(/^\d+\.\s/)) {
      html.push("</ul>");
      inList = false;
    }

    // Close table
    if (inTable && !trimmed.startsWith("|")) {
      html.push("</tbody></table></div>");
      inTable = false;
      tableHeader = false;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      html.push(`<h3>${formatInline(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      html.push(`<h2>${formatInline(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("#### ")) {
      html.push(`<h4>${formatInline(trimmed.slice(5))}</h4>`);
    }
    // Table
    else if (trimmed.startsWith("|")) {
      if (trimmed.match(/^\|[\s-|]+\|$/)) {
        // Separator row
        tableHeader = false;
        continue;
      }
      const cells = trimmed
        .split("|")
        .filter((c) => c.trim() !== "");
      if (!inTable) {
        html.push('<div class="table-wrap"><table>');
        html.push("<thead><tr>");
        cells.forEach((c) => html.push(`<th>${formatInline(c.trim())}</th>`));
        html.push("</tr></thead><tbody>");
        inTable = true;
        tableHeader = true;
      } else {
        html.push("<tr>");
        cells.forEach((c) => html.push(`<td>${formatInline(c.trim())}</td>`));
        html.push("</tr>");
      }
    }
    // Unordered list
    else if (trimmed.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${formatInline(trimmed.slice(2))}</li>`);
    }
    // Ordered list
    else if (trimmed.match(/^\d+\.\s/)) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${formatInline(trimmed.replace(/^\d+\.\s/, ""))}</li>`);
    }
    // Empty line
    else if (trimmed === "") {
      html.push("<br/>");
    }
    // Regular paragraph
    else {
      html.push(`<p>${formatInline(trimmed)}</p>`);
    }
  }

  if (inList) html.push("</ul>");
  if (inTable) html.push("</tbody></table></div>");

  return html.join("\n");
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

export function ArticlePage({ article, relatedArticles }: ArticlePageProps) {
  const categoryPath = `/performance/${article.category}`;

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
            <Link
              href={categoryPath}
              className="transition-colors hover:underline"
              style={{ color: "var(--cg-text-secondary)" }}
            >
              {categoryLabels[article.category] || article.category}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span style={{ color: "var(--cg-text-muted)" }} className="truncate max-w-[200px]">
              {article.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Article header */}
      <div className="mx-auto max-w-4xl px-4 pt-12 pb-8">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span
            className="rounded-md px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: "var(--cg-accent-bg)",
              color: "var(--cg-accent)",
            }}
          >
            {categoryLabels[article.category] || article.category}
          </span>
          <DifficultyBadge difficulty={article.difficulty} />
          {article.estimatedTime && (
            <span
              className="inline-flex items-center gap-1 text-xs"
              style={{ color: "var(--cg-text-muted)" }}
            >
              <Clock className="h-3 w-3" />
              {article.estimatedTime}
            </span>
          )}
        </div>

        <h1
          className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
          style={{ color: "var(--cg-text-primary)" }}
        >
          {article.title}
        </h1>

        {article.subtitle && (
          <p
            className="mt-4 text-lg leading-relaxed"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            {article.subtitle}
          </p>
        )}

        {article.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md px-2.5 py-1 text-xs font-medium"
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
      </div>

      {/* Video embed */}
      {article.videoUrl && (
        <div className="mx-auto max-w-4xl px-4 pb-8">
          <VideoEmbed url={article.videoUrl} />
        </div>
      )}

      {/* Article content */}
      <div className="mx-auto max-w-4xl px-4 pb-16">
        <div
          className="article-content prose-dark"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
          style={{ color: "var(--cg-text-secondary)" }}
        />
      </div>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section
          className="py-16"
          style={{
            backgroundColor: "var(--cg-bg-secondary)",
            borderTop: "1px solid var(--cg-border)",
          }}
        >
          <div className="mx-auto max-w-7xl px-4">
            <h2
              className="text-2xl font-bold mb-8"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Related Articles
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((a) => (
                <ArticleCard key={a.slug} {...a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back link */}
      <div
        className="py-8"
        style={{
          backgroundColor: "var(--cg-bg-primary)",
          borderTop: "1px solid var(--cg-border)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <Link
            href={categoryPath}
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: "var(--cg-accent)" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {categoryLabels[article.category] || "Performance Center"}
          </Link>
        </div>
      </div>
    </div>
  );
}
