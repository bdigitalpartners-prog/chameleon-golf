"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Video, Play, ExternalLink, Eye, Calendar, ChevronRight, Podcast, BookOpen } from "lucide-react";
import { PlatformBadge, ContentTypeBadge } from "./PlatformBadge";
import { CreatorAvatar } from "./CreatorAvatar";

interface ContentItem {
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
}

export function CourseCreatorContent({ courseId, courseName }: { courseId: number; courseName?: string }) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/creators/content?courseId=${courseId}`)
      .then((r) => r.json())
      .then((data) => {
        setContent(data.content || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-lg animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
        ))}
      </div>
    );
  }

  if (content.length === 0) return null;

  return (
    <div>
      <h3 className="font-display text-base font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--cg-text-primary)" }}>
        <Video className="w-4 h-4" style={{ color: "#00FF85" }} />
        Creator Content
      </h3>

      <div className="space-y-2">
        {content.slice(0, 5).map((item) => (
          <ContentCompactCard key={item.id} item={item} />
        ))}
      </div>

      {content.length > 5 && (
        <Link
          href={`/creators?courseId=${courseId}`}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold"
          style={{ color: "#00FF85" }}
        >
          See all {content.length} pieces of content for this course
          <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

function ContentCompactCard({ item }: { item: ContentItem }) {
  const isVideo = item.platform === "youtube";
  const isPodcast = item.platform === "podcast";
  const formattedViews = item.view_count ? formatViewsCompact(item.view_count) : null;

  return (
    <a
      href={item.content_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-lg p-2.5 transition-all duration-200"
      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid transparent" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,133,0.2)"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"; }}
    >
      {/* Thumbnail or icon */}
      {isVideo && item.thumbnail_url ? (
        <div className="relative flex-shrink-0 w-[100px] aspect-video rounded overflow-hidden" style={{ backgroundColor: "#1a1a1a" }}>
          <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-red-600/90 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
          {isPodcast ? <Podcast className="w-4 h-4" style={{ color: "#7C3AED" }} /> : <BookOpen className="w-4 h-4" style={{ color: "#2563EB" }} />}
        </div>
      )}

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <PlatformBadge platform={item.platform} />
          {item.content_type && <ContentTypeBadge contentType={item.content_type} />}
        </div>
        <div className="text-xs font-medium truncate" style={{ color: "var(--cg-text-primary)" }}>
          {item.title || "Untitled"}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-semibold" style={{ color: "#00FF85" }}>{item.creator_name}</span>
          {formattedViews && (
            <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "var(--cg-text-muted)" }}>
              <Eye className="w-2.5 h-2.5" /> {formattedViews}
            </span>
          )}
        </div>
      </div>

      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: "var(--cg-text-muted)" }} />
    </a>
  );
}

function formatViewsCompact(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return `${count}`;
}
