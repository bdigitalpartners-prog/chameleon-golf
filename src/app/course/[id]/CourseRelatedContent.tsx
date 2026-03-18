"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Video, Headphones, ExternalLink } from "lucide-react";

interface ContentItem {
  id: number;
  contentType: string;
  title: string;
  url: string;
  sourceName?: string | null;
  summary?: string | null;
  publishedAt?: string | null;
}

const TYPE_ICONS: Record<string, any> = {
  article: FileText,
  video: Video,
  podcast: Headphones,
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  article: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
  video: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
  podcast: { bg: "rgba(168,85,247,0.15)", text: "#c084fc" },
};

const MAX_ITEMS = 4;

export function CourseRelatedContent({ courseId }: { courseId: number }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch(`/api/content?courseId=${courseId}`)
      .then((r) => r.json())
      .then((data) => {
        const all = data.content || [];
        setTotal(all.length);
        setItems(all.slice(0, MAX_ITEMS));
      })
      .catch(() => {});
  }, [courseId]);

  if (items.length === 0) return null;

  return (
    <section
      className="mb-6 rounded-xl p-6"
      style={{
        backgroundColor: "var(--cg-bg-card)",
        border: "1px solid var(--cg-border)",
      }}
    >
      <h2
        className="mb-4 text-lg font-semibold"
        style={{ color: "var(--cg-text-primary)" }}
      >
        Related Content
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = TYPE_ICONS[item.contentType] || FileText;
          const colors = TYPE_COLORS[item.contentType] || {
            bg: "var(--cg-bg-secondary)",
            text: "var(--cg-text-muted)",
          };
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-4 transition-all hover:ring-1 hover:ring-emerald-500/40"
              style={{
                backgroundColor: "var(--cg-bg-secondary)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="flex items-center justify-center h-8 w-8 rounded-lg"
                  style={{ backgroundColor: colors.bg }}
                >
                  <Icon className="h-4 w-4" style={{ color: colors.text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className="text-[10px] font-medium rounded-full px-2 py-0.5"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {item.contentType}
                  </span>
                  {item.sourceName && (
                    <span
                      className="text-[10px] ml-1.5"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      {item.sourceName}
                    </span>
                  )}
                </div>
              </div>
              <h3
                className="text-sm font-medium line-clamp-2"
                style={{ color: "var(--cg-text-primary)" }}
              >
                {item.title}
              </h3>
              {item.summary && (
                <p
                  className="text-xs mt-1 line-clamp-2"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  {item.summary}
                </p>
              )}
            </a>
          );
        })}
      </div>
      {total > MAX_ITEMS && (
        <div className="mt-4 text-center">
          <Link
            href="/fairway"
            className="text-sm font-medium transition-colors hover:underline"
            style={{ color: "var(--cg-accent)" }}
          >
            View all on The Fairway →
          </Link>
        </div>
      )}
    </section>
  );
}
