"use client";

import Link from "next/link";
import { Trash2, Share2, Star, MapPin, Heart } from "lucide-react";
import { FistBumpButton } from "./FistBumpButton";
import { CommentThread } from "./CommentThread";

interface PostCardProps {
  post: any;
  currentUserId?: string;
  onDeleted?: () => void;
}

function renderContentWithMentions(content: string) {
  const parts = content.split(/(@\[([^\]]+)\]\(([^)]+)\))/);
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < parts.length) {
    if (i + 3 < parts.length && parts[i + 1]?.startsWith("@[")) {
      elements.push(parts[i]);
      elements.push(
        <Link
          key={i}
          href={`/profile/${parts[i + 3]}`}
          className="font-medium"
          style={{ color: "var(--cg-accent)" }}
        >
          @{parts[i + 2]}
        </Link>
      );
      i += 4;
    } else {
      elements.push(parts[i]);
      i++;
    }
  }
  return elements;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function PhotoGrid({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <div className="mt-3 rounded-lg overflow-hidden">
        <img src={urls[0]} alt="" className="w-full max-h-96 object-cover" />
      </div>
    );
  }

  if (urls.length === 2) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
        {urls.map((url, i) => (
          <img key={i} src={url} alt="" className="w-full h-48 object-cover" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
      {urls.slice(0, 4).map((url, i) => (
        <img key={i} src={url} alt="" className="w-full h-36 object-cover" />
      ))}
    </div>
  );
}

export function PostCard({ post, currentUserId, onDeleted }: PostCardProps) {
  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) onDeleted?.();
    } catch {
      // ignore
    }
  };

  const canDelete = currentUserId === post.authorId || currentUserId === post.author?.id;

  const postTypeMeta: Record<string, { icon: any; label: string; color: string }> = {
    COURSE_RATING: { icon: Star, label: "Rated", color: "#f59e0b" },
    CHECK_IN: { icon: MapPin, label: "Checked In", color: "var(--cg-accent)" },
    WISHLIST_ADD: { icon: Heart, label: "Wishlisted", color: "#f87171" },
  };
  const typeMeta = postTypeMeta[post.type];
  const TypeIcon = typeMeta?.icon;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
    >
      <div className="p-4">
        {/* Author row */}
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.author?.id}`}>
            <div
              className="h-10 w-10 rounded-full flex-shrink-0 overflow-hidden"
              style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
            >
              {post.author?.image ? (
                <img src={post.author.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div
                  className="h-full w-full flex items-center justify-center text-sm font-medium"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  {post.author?.name?.[0] ?? "?"}
                </div>
              )}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${post.author?.id}`}
                className="text-sm font-semibold truncate"
                style={{ color: "var(--cg-text-primary)" }}
              >
                {post.author?.name ?? "Unknown"}
              </Link>
              {post.author?.handicapIndex != null && (
                <span
                  className="text-xs rounded-full px-2 py-0.5"
                  style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
                >
                  {Number(post.author.handicapIndex).toFixed(1)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--cg-text-muted)" }}>
              <Link href={`/circles/${post.circle?.id}`} className="hover:underline">
                {post.circle?.name}
              </Link>
              <span>·</span>
              <span>{timeAgo(post.createdAt)}</span>
            </div>
          </div>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--cg-text-muted)" }}
              title="Delete post"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Post type badge */}
        {typeMeta && TypeIcon && (
          <div
            className="inline-flex items-center gap-1.5 mt-2 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: `${typeMeta.color}20`, color: typeMeta.color }}
          >
            <TypeIcon className="h-3 w-3" />
            {typeMeta.label}
          </div>
        )}

        {/* Content */}
        {post.content && (
          <div className="mt-3 text-sm" style={{ color: "var(--cg-text-secondary)" }}>
            {renderContentWithMentions(post.content)}
          </div>
        )}

        {/* Media */}
        <PhotoGrid urls={post.mediaUrls ?? []} />

        {/* Course tag */}
        {post.course && (
          <Link
            href={`/course/${post.course.courseId}`}
            className="inline-flex items-center gap-1.5 mt-3 rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
          >
            ⛳ {post.course.courseName}
          </Link>
        )}

        {/* Engagement row */}
        <div
          className="flex items-center gap-2 mt-3 pt-3"
          style={{ borderTop: "1px solid var(--cg-border-subtle)" }}
        >
          <FistBumpButton
            postId={post.id}
            initialCount={post.fistBumpCount}
            initialBumped={post.hasFistBumped ?? false}
            recentBumpers={post.fistBumps?.map((fb: any) => fb.user) ?? []}
          />

          <CommentThread
            postId={post.id}
            commentCount={post.commentCount}
            currentUserId={currentUserId}
          />

          <button
            className="ml-auto rounded-lg px-3 py-1.5 text-sm transition-colors"
            style={{ color: "var(--cg-text-muted)" }}
            title="Share (coming soon)"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
