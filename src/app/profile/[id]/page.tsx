"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import {
  User,
  Loader2,
  MapPin,
  Trophy,
  Users,
  UserPlus,
  Check,
  Clock,
  Ban,
} from "lucide-react";
import Link from "next/link";

interface ProfileData {
  id: string;
  name: string | null;
  image: string | null;
  createdAt: string;
  profile: {
    bio: string | null;
    handicap: number | null;
    homeClub: string | null;
    avatarUrl: string | null;
    coverUrl: string | null;
    location: string | null;
    isAvailableToPlay: boolean;
    tags: { tag: { id: string; name: string; slug: string; category: string | null } }[];
  } | null;
  connectionsCount: number;
  connectionStatus: string | null;
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  const currentUserId = (session?.user as any)?.id;
  const isSelf = currentUserId === id;

  useEffect(() => {
    fetch(`/api/profile/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setConnectionStatus(data.connectionStatus);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleConnect = async () => {
    setConnectLoading(true);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: id }),
      });
      if (res.ok) setConnectionStatus("PENDING");
    } catch (err) {
      console.error(err);
    } finally {
      setConnectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: "var(--cg-accent)" }}
        />
      </div>
    );
  }

  if (!profile || profile.id === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <User className="mx-auto h-16 w-16" style={{ color: "var(--cg-text-muted)" }} />
        <h1
          className="mt-4 font-display text-2xl font-bold"
          style={{ color: "var(--cg-text-primary)" }}
        >
          User Not Found
        </h1>
      </div>
    );
  }

  const p = profile.profile;
  const avatarUrl = p?.avatarUrl || profile.image;
  const tags = p?.tags ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Cover photo */}
      <div
        className="relative h-48 sm:h-60 rounded-xl overflow-hidden"
        style={{
          background: p?.coverUrl
            ? `url(${p.coverUrl}) center / cover`
            : "linear-gradient(135deg, var(--cg-accent), var(--cg-accent-muted))",
        }}
      />

      {/* Avatar + basic info */}
      <div className="relative -mt-16 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6">
          {/* Avatar */}
          <div
            className="h-28 w-28 rounded-full border-4 overflow-hidden flex-shrink-0"
            style={{
              borderColor: "var(--cg-bg-primary)",
              backgroundColor: "var(--cg-bg-tertiary)",
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile.name ?? ""}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-12 w-12" style={{ color: "var(--cg-text-muted)" }} />
              </div>
            )}
          </div>

          {/* Name row */}
          <div className="mt-3 sm:mt-0 flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                className="font-display text-2xl font-bold truncate"
                style={{ color: "var(--cg-text-primary)" }}
              >
                {profile.name ?? "Golfer"}
              </h1>
              {p?.isAvailableToPlay && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--cg-accent-bg)",
                    color: "var(--cg-accent)",
                  }}
                >
                  Available to Play
                </span>
              )}
            </div>

            <div
              className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
              style={{ color: "var(--cg-text-secondary)" }}
            >
              {p?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {p.location}
                </span>
              )}
              {p?.handicap !== null && p?.handicap !== undefined && (
                <span className="flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5" /> Handicap: {p.handicap}
                </span>
              )}
              {p?.homeClub && (
                <span className="flex items-center gap-1">Home: {p.homeClub}</span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {profile.connectionsCount} connection
                {profile.connectionsCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Action button */}
          <div className="mt-3 sm:mt-0 flex-shrink-0">
            {isSelf ? (
              <Link
                href="/settings/profile"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  color: "var(--cg-text-primary)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                Edit Profile
              </Link>
            ) : session ? (
              <ConnectButton
                status={connectionStatus}
                loading={connectLoading}
                onClick={handleConnect}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Bio */}
      {p?.bio && (
        <div className="mt-6 px-4 sm:px-6">
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--cg-text-secondary)" }}
          >
            {p.bio}
          </p>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mt-4 px-4 sm:px-6 flex flex-wrap gap-2">
          {tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: "var(--cg-accent-bg)",
                color: "var(--cg-accent)",
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Activity feed placeholder */}
      <div
        className="mt-8 mx-4 sm:mx-6 rounded-xl p-8 text-center"
        style={{
          backgroundColor: "var(--cg-bg-card)",
          border: "1px solid var(--cg-border)",
        }}
      >
        <Users className="mx-auto h-10 w-10" style={{ color: "var(--cg-text-muted)" }} />
        <h3
          className="mt-3 font-display text-lg font-semibold"
          style={{ color: "var(--cg-text-primary)" }}
        >
          Activity Feed
        </h3>
        <p className="mt-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>
          Coming soon in Sprint 3
        </p>
      </div>
    </div>
  );
}

function ConnectButton({
  status,
  loading,
  onClick,
}: {
  status: string | null;
  loading: boolean;
  onClick: () => void;
}) {
  if (status === "ACCEPTED") {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
        style={{
          backgroundColor: "var(--cg-accent-bg)",
          color: "var(--cg-accent)",
        }}
      >
        <Check className="h-4 w-4" /> Connected
      </button>
    );
  }

  if (status === "PENDING") {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
        style={{
          backgroundColor: "var(--cg-bg-tertiary)",
          color: "var(--cg-text-muted)",
        }}
      >
        <Clock className="h-4 w-4" /> Pending
      </button>
    );
  }

  if (status === "BLOCKED") {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
        style={{
          backgroundColor: "var(--cg-bg-tertiary)",
          color: "var(--cg-text-muted)",
        }}
      >
        <Ban className="h-4 w-4" /> Blocked
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
      style={{
        backgroundColor: "var(--cg-accent)",
        color: "var(--cg-text-inverse)",
      }}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      Connect
    </button>
  );
}
