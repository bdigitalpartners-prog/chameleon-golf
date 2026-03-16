"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { PostCard } from "@/components/social/PostCard";
import { PostComposer } from "@/components/social/PostComposer";

interface Post {
  id: string;
  authorId: string;
  content: string | null;
  type: string;
  mediaUrls: string[];
  createdAt: string;
  fistBumpCount: number;
  commentCount: number;
  hasFistBumped: boolean;
  author: {
    id: string;
    name: string;
    image: string | null;
    handicapIndex: number | null;
  };
  circle: { id: string; name: string } | null;
  course: { courseId: number; courseName: string } | null;
  fistBumps: { user: { id: string; name: string; image: string | null } }[];
}

export default function FeedPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = (session?.user as any)?.id;

  const fetchPosts = useCallback(
    async (cursorParam?: string) => {
      const isInitial = !cursorParam;
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({ limit: "15" });
        if (cursorParam) params.set("cursor", cursorParam);

        const res = await fetch(`/api/feed?${params}`);
        const data = await res.json();
        const newPosts: Post[] = data.posts ?? [];

        setPosts((prev) => (isInitial ? newPosts : [...prev, ...newPosts]));
        setCursor(data.nextCursor ?? null);
        setHasMore(!!data.nextCursor);
      } catch {
        // ignore
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    if (status === "authenticated") fetchPosts();
  }, [status, fetchPosts]);

  // Infinite scroll observer
  const lastCursorRef = useRef(cursor);
  lastCursorRef.current = cursor;
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;
  const loadingMoreRef = useRef(loadingMore);
  loadingMoreRef.current = loadingMore;

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !loadingMoreRef.current &&
          lastCursorRef.current
        ) {
          fetchPosts(lastCursorRef.current);
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [fetchPosts]);

  if (status === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
          Sign in to see your feed
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--cg-text-muted)" }}>
          Join circles and connect with fellow golfers.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="font-display text-2xl font-bold mb-6" style={{ color: "var(--cg-text-primary)" }}>
        Feed
      </h1>

      <div className="mb-6">
        <PostComposer onPostCreated={() => fetchPosts()} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
        </div>
      ) : posts.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
            No posts yet. Join circles and start sharing!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onDeleted={() => setPosts((prev) => prev.filter((p) => p.id !== post.id))}
            />
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />

          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--cg-accent)" }} />
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <p className="text-center text-xs py-4" style={{ color: "var(--cg-text-muted)" }}>
              You&apos;re all caught up!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
