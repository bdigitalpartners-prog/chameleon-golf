"use client";

import { ExternalLink } from "lucide-react";

interface ArticleCardProps {
  title: string;
  url: string;
  thumbnailUrl?: string | null;
  sourceName?: string | null;
  publishedAt?: string | null;
  summary?: string | null;
  authorName?: string | null;
}

export function ArticleCard({ title, url, thumbnailUrl, sourceName, publishedAt, summary, authorName }: ArticleCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 rounded-xl p-4 transition-all duration-200"
      style={{
        backgroundColor: "var(--cg-bg-card)",
        border: "1px solid var(--cg-border)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--cg-accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--cg-border)";
      }}
    >
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt=""
          className="h-20 w-28 rounded-lg object-cover flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <h4
          className="font-medium text-sm line-clamp-2"
          style={{ color: "var(--cg-text-primary)" }}
        >
          {title}
          <ExternalLink className="inline ml-1.5 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </h4>
        {summary && (
          <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--cg-text-secondary)" }}>
            {summary}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: "var(--cg-text-muted)" }}>
          {sourceName && <span>{sourceName}</span>}
          {authorName && <span>by {authorName}</span>}
          {publishedAt && <span>{new Date(publishedAt).toLocaleDateString()}</span>}
        </div>
      </div>
    </a>
  );
}
