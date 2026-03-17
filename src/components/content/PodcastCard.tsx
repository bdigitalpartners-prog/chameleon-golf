"use client";

import { Headphones, ExternalLink } from "lucide-react";

interface PodcastCardProps {
  title: string;
  url: string;
  sourceName?: string | null;
  duration?: string | null;
  publishedAt?: string | null;
  summary?: string | null;
}

export function PodcastCard({ title, url, sourceName, duration, publishedAt, summary }: PodcastCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 rounded-xl p-4 transition-all duration-200"
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
      <div
        className="flex-shrink-0 rounded-lg p-3"
        style={{ backgroundColor: "rgba(168, 85, 247, 0.1)" }}
      >
        <Headphones className="h-5 w-5" style={{ color: "#a855f7" }} />
      </div>
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
          {duration && <span>{duration}</span>}
          {publishedAt && <span>{new Date(publishedAt).toLocaleDateString()}</span>}
        </div>
      </div>
    </a>
  );
}
