"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Settings,
  Globe,
  Shield,
  Eye,
  EyeOff,
  Trophy,
  Medal,
  Loader2,
  Calendar,
  LogOut,
  UserPlus,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { PostCard } from "@/components/social/PostCard";
import { PostComposer } from "@/components/social/PostComposer";

const TYPE_META: Record<string, { label: string; icon: any }> = {
  CREW: { label: "Crew", icon: Users },
  GAME: { label: "Game", icon: Trophy },
  NETWORK: { label: "Network", icon: Globe },
  CLUB: { label: "Club", icon: Shield },
  LEAGUE: { label: "League", icon: Medal },
};

const PRIVACY_META: Record<string, { label: string; icon: any }> = {
  PUBLIC: { label: "Public", icon: Globe },
  PRIVATE: { label: "Private", icon: Eye },
  SECRET: { label: "Secret", icon: EyeOff },
};

type Tab = "feed" | "members" | "about";

export default function CircleDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const circleId = params.id as string;

  const [circle, setCircle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("about");
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!circleId) return;
    fetch(`/api/circles/${circleId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Circle not found");
        return r.json();
      })
      .then(setCircle)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [circleId]);

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
          {error || "Circle not found"}
        </h1>
        <Link href="/circles" className="mt-4 inline-block text-sm underline" style={{ color: "var(--cg-accent)" }}>
          Back to Circles
        </Link>
      </div>
    );
  }

  const userRole = circle.userRole;
  const isMember = userRole && userRole !== "PENDING";
  const isAdmin = userRole === "OWNER" || userRole === "ADMIN";
  const isPending = userRole === "PENDING";

  const TypeIcon = TYPE_META[circle.type]?.icon ?? Users;
  const PrivacyIcon = PRIVACY_META[circle.privacy]?.icon ?? Globe;

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/join`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        // Refetch circle
        const r = await fetch(`/api/circles/${circleId}`);
        setCircle(await r.json());
      } else {
        setError(data.error || "Failed to join");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this circle?")) return;
    setLeaving(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/leave`, { method: "POST" });
      if (res.ok) {
        router.push("/circles");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to leave");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLeaving(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "feed", label: "Feed" },
    { key: "members", label: "Members" },
    { key: "about", label: "About" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <button
        onClick={() => router.push("/circles")}
        className="flex items-center gap-1 text-sm mb-4"
        style={{ color: "var(--cg-text-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Circles
      </button>

      {/* Hero */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--cg-border)" }}
      >
        {/* Cover */}
        <div
          className="h-32 sm:h-48 relative"
          style={{
            background: circle.coverUrl
              ? `url(${circle.coverUrl}) center/cover`
              : "linear-gradient(135deg, var(--cg-accent) 0%, var(--cg-bg-tertiary) 100%)",
          }}
        />

        {/* Info bar */}
        <div
          className="px-4 sm:px-6 pb-4 -mt-8 relative"
          style={{ backgroundColor: "var(--cg-bg-card)" }}
        >
          <div className="flex items-end gap-4">
            <div
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center flex-shrink-0 border-4"
              style={{
                backgroundColor: "var(--cg-bg-tertiary)",
                borderColor: "var(--cg-bg-card)",
              }}
            >
              {circle.avatarUrl ? (
                <img src={circle.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                <TypeIcon className="h-8 w-8" style={{ color: "var(--cg-accent)" }} />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-10">
              <h1 className="font-display text-xl sm:text-2xl font-bold truncate" style={{ color: "var(--cg-text-primary)" }}>
                {circle.name}
              </h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5"
                  style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
                >
                  <TypeIcon className="h-3 w-3" />
                  {TYPE_META[circle.type]?.label}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-xs"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  <PrivacyIcon className="h-3 w-3" />
                  {PRIVACY_META[circle.privacy]?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 mt-4 text-sm" style={{ color: "var(--cg-text-secondary)" }}>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {circle.memberCount} member{circle.memberCount !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created {new Date(circle.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-4">
            {!session ? (
              <span className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                Sign in to join
              </span>
            ) : isPending ? (
              <span
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
              >
                <Lock className="h-4 w-4" /> Pending Approval
              </span>
            ) : !isMember ? (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
                style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
              >
                {joining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : circle.privacy === "PUBLIC" ? (
                  "Join Circle"
                ) : (
                  "Request to Join"
                )}
              </button>
            ) : (
              <>
                {isAdmin && (
                  <Link
                    href={`/circles/${circleId}/settings`}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
                    style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                )}
                {userRole !== "OWNER" && (
                  <button
                    onClick={handleLeave}
                    disabled={leaving}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
                    style={{
                      backgroundColor: "var(--cg-bg-tertiary)",
                      color: "var(--cg-text-secondary)",
                      border: "1px solid var(--cg-border)",
                    }}
                  >
                    <LogOut className="h-4 w-4" /> Leave
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content + sidebar */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div
            className="flex gap-1 rounded-lg p-1 mb-4"
            style={{ backgroundColor: "var(--cg-bg-secondary)" }}
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all"
                style={{
                  backgroundColor: tab === t.key ? "var(--cg-bg-card)" : "transparent",
                  color: tab === t.key ? "var(--cg-text-primary)" : "var(--cg-text-muted)",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "feed" && (
            <CircleFeed circleId={circleId} isMember={!!isMember} currentUserId={(session?.user as any)?.id} />
          )}

          {tab === "members" && <MembersPreview circleId={circleId} />}

          {tab === "about" && (
            <div
              className="rounded-xl p-6 space-y-4"
              style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
            >
              {circle.description ? (
                <div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--cg-text-primary)" }}>
                    Description
                  </h3>
                  <p className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>
                    {circle.description}
                  </p>
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                  No description provided.
                </p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--cg-text-muted)" }}>Type</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                    {TYPE_META[circle.type]?.label}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--cg-text-muted)" }}>Privacy</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                    {PRIVACY_META[circle.privacy]?.label}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--cg-text-muted)" }}>Max Members</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                    {circle.maxMembers ?? "Unlimited"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--cg-text-muted)" }}>Created</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                    {new Date(circle.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick member list */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                Members
              </h3>
              <Link
                href={`/circles/${circleId}/members`}
                className="text-xs"
                style={{ color: "var(--cg-accent)" }}
              >
                View all
              </Link>
            </div>
            {circle.members && circle.members.length > 0 ? (
              <div className="flex -space-x-2">
                {circle.members.slice(0, 5).map((m: any) => (
                  <div
                    key={m.user?.id ?? m.id}
                    className="h-8 w-8 rounded-full border-2 flex items-center justify-center overflow-hidden"
                    style={{ borderColor: "var(--cg-bg-card)", backgroundColor: "var(--cg-bg-tertiary)" }}
                    title={m.user?.name ?? "Member"}
                  >
                    {m.user?.image ? (
                      <img src={m.user.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Users className="h-3 w-3" style={{ color: "var(--cg-text-muted)" }} />
                    )}
                  </div>
                ))}
                {circle.memberCount > 5 && (
                  <div
                    className="h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-medium"
                    style={{
                      borderColor: "var(--cg-bg-card)",
                      backgroundColor: "var(--cg-bg-tertiary)",
                      color: "var(--cg-text-muted)",
                    }}
                  >
                    +{circle.memberCount - 5}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                No members to show
              </p>
            )}
          </div>

          {/* Invite button */}
          {isMember && (
            <Link
              href={`/circles/${circleId}/members`}
              className="flex items-center justify-center gap-2 rounded-xl p-3 text-sm font-medium transition-all w-full"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                color: "var(--cg-accent)",
                border: "1px solid var(--cg-border)",
              }}
            >
              <UserPlus className="h-4 w-4" /> Invite Members
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function MembersPreview({ circleId }: { circleId: string }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/circles/${circleId}/members?limit=10`)
      .then((r) => r.json())
      .then((data) => setMembers(data.members ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [circleId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-xl p-3"
            style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
          >
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
            >
              {m.user?.image ? (
                <img src={m.user.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <Users className="h-4 w-4" style={{ color: "var(--cg-text-muted)" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--cg-text-primary)" }}>
                {m.user?.name ?? "Unknown"}
              </p>
              <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                {m.role} · Joined {new Date(m.joinedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
      <Link
        href={`/circles/${circleId}/members`}
        className="mt-3 block text-center text-sm font-medium"
        style={{ color: "var(--cg-accent)" }}
      >
        View all members
      </Link>
    </div>
  );
}

function CircleFeed({
  circleId,
  isMember,
  currentUserId,
}: {
  circleId: string;
  isMember: boolean;
  currentUserId?: string;
}) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchPosts = useCallback(
    async (cursorParam?: string) => {
      const isInitial = !cursorParam;
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({ circleId, limit: "15" });
        if (cursorParam) params.set("cursor", cursorParam);

        const res = await fetch(`/api/posts?${params}`);
        const data = await res.json();
        const newPosts = data.posts ?? [];

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
    [circleId]
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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

  return (
    <div className="space-y-4">
      {isMember && (
        <PostComposer circleId={circleId} onPostCreated={() => fetchPosts()} />
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
        </div>
      ) : posts.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
            No posts yet. Be the first to share!
          </p>
        </div>
      ) : (
        <>
          {posts.map((post: any) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onDeleted={() => setPosts((prev) => prev.filter((p) => p.id !== post.id))}
            />
          ))}

          <div ref={sentinelRef} className="h-4" />

          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--cg-accent)" }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
