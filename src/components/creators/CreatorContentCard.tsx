"use client";

import Link from "next/link";
import { Play, ExternalLink, Eye, Calendar } from "lucide-react";
import { PlatformBadge, ContentTypeBadge } from "./PlatformBadge";

interface CreatorContentItem {
  id: number;
  course_id: number;
  platform: string;
  creator_name: string;
  creator_handle?: string;
  content_url: string;
  title?: string;
  thumbnail_url?: string;
  published_at?: string;
  view_count?: number;
  content_type?: string;
  course_name?: string;
  city?: string;
  state?: string;
}

export function CreatorContentCard({ item, showCourse = true }: { item: CreatorContentItem; showCourse?: boolean }) {
  const hasThumb = item.thumbnail_url && item.platform === "youtube";
  const formattedViews = item.view_count ? formatViews(item.view_count) : null;
  const formattedDate = item.published_at ? formatDate(item.published_at) : null;

  return (
    <div
      className="group flex gap-4 rounded-xl p-3 transition-all duration-200"
      style={{
        backgroundColor: "var(--cg-bg-card)",
        border: "1px solid var(--cg-border)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(0, 255, 133, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--cg-border)";
      }}
    >
      {/* Thumbnail / Play overlay */}
      {hasThumb ? (
        <a
          href={item.content_url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex-shrink-0 w-[160px] aspect-video rounded-lg overflow-hidden"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <img src={item.thumbnail_url!} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        </a>
      ) : (
        <a
          href={item.content_url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex-shrink-0 w-[160px] aspect-video rounded-lg overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <div className="text-center">
            <PlatformBadge platform={item.platform} size="md" />
          </div>
        </a>
      )}

      {/* Content details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PlatformBadge platform={item.platform} />
            {item.content_type && <ContentTypeBadge contentType={item.content_type} />}
          </div>
          <a
            href={item.content_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium leading-snug line-clamp-2 hover:underline"
            style={{ color: "var(--cg-text-primary)" }}
          >
            {item.title || "Untitled"}
            <ExternalLink className="inline-block w-3 h-3 ml-1 opacity-50" />
          </a>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Link
            href={`/creators/${item.creator_handle || item.creator_name.toLowerCase().replace(/\s+/g, "-")}`}
            className="text-xs font-semibold hover:underline"
            style={{ color: "#00FF85" }}
          >
            {item.creator_name}
          </Link>

          {showCourse && item.course_name && (
            <Link
              href={`/course/${item.course_id}`}
              className="text-xs hover:underline"
              style={{ color: "var(--cg-text-secondary)" }}
            >
              📍 {item.course_name}
            </Link>
          )}

          {formattedViews && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--cg-text-muted)" }}>
              <Eye className="w-3 h-3" />
              {formattedViews}
            </span>
          )}

          {formattedDate && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--cg-text-muted)" }}>
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K views`;
  return `${count} views`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
