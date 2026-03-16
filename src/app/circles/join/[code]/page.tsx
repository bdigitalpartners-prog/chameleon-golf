"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Loader2,
  Trophy,
  Globe,
  Shield,
  Medal,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

const TYPE_META: Record<string, { label: string; icon: any }> = {
  CREW: { label: "Crew", icon: Users },
  GAME: { label: "Game", icon: Trophy },
  NETWORK: { label: "Network", icon: Globe },
  CLUB: { label: "Club", icon: Shield },
  LEAGUE: { label: "League", icon: Medal },
};

export default function JoinByCodePage() {
  const { data: session, status: authStatus } = useSession();
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [circle, setCircle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!code) return;
    fetch(`/api/circles/join/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          if (data.error.includes("expired")) setExpired(true);
          else if (data.error.includes("already")) setAlreadyMember(true);
          else setError(data.error);
        } else {
          setCircle(data.circle ?? data);
          if (data.alreadyMember) setAlreadyMember(true);
        }
      })
      .catch(() => setError("Failed to load invite"))
      .finally(() => setLoading(false));
  }, [code]);

  const handleJoin = async () => {
    setJoining(true);
    setError("");
    try {
      const res = await fetch(`/api/circles/join/${code}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setJoined(true);
        setTimeout(() => {
          router.push(`/circles/${data.circleId}`);
        }, 1500);
      } else {
        setError(data.error || "Failed to join");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setJoining(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  const TypeIcon = circle ? (TYPE_META[circle.type]?.icon ?? Users) : Users;

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div
        className="rounded-xl p-6 text-center"
        style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
      >
        {/* Expired */}
        {expired && (
          <>
            <Clock className="mx-auto h-12 w-12" style={{ color: "var(--cg-status-error, #ef4444)" }} />
            <h1 className="mt-4 font-display text-xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
              Invite Expired
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--cg-text-muted)" }}>
              This invite link has expired. Ask the circle admin for a new one.
            </p>
            <Link
              href="/circles"
              className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
            >
              Browse Circles
            </Link>
          </>
        )}

        {/* Already member */}
        {alreadyMember && (
          <>
            <CheckCircle className="mx-auto h-12 w-12" style={{ color: "var(--cg-accent)" }} />
            <h1 className="mt-4 font-display text-xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
              You&apos;re already in this circle
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--cg-text-muted)" }}>
              {circle?.name ? `You're a member of ${circle.name}.` : "You're already a member of this circle."}
            </p>
            {circle && (
              <Link
                href={`/circles/${circle.id}`}
                className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
              >
                Go to Circle
              </Link>
            )}
          </>
        )}

        {/* Error */}
        {error && !expired && !alreadyMember && (
          <>
            <XCircle className="mx-auto h-12 w-12" style={{ color: "var(--cg-status-error, #ef4444)" }} />
            <h1 className="mt-4 font-display text-xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
              Invalid Invite
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--cg-text-muted)" }}>
              {error}
            </p>
            <Link
              href="/circles"
              className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
            >
              Browse Circles
            </Link>
          </>
        )}

        {/* Joined success */}
        {joined && (
          <>
            <CheckCircle className="mx-auto h-12 w-12" style={{ color: "var(--cg-accent)" }} />
            <h1 className="mt-4 font-display text-xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
              Welcome!
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--cg-text-muted)" }}>
              You&apos;ve joined {circle?.name}. Redirecting...
            </p>
          </>
        )}

        {/* Join prompt */}
        {circle && !expired && !alreadyMember && !error && !joined && (
          <>
            <div
              className="mx-auto h-16 w-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--cg-accent-bg)" }}
            >
              {circle.avatarUrl ? (
                <img src={circle.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <TypeIcon className="h-8 w-8" style={{ color: "var(--cg-accent)" }} />
              )}
            </div>
            <h1 className="mt-4 font-display text-xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
              {circle.name}
            </h1>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className="text-xs font-medium" style={{ color: "var(--cg-accent)" }}>
                {TYPE_META[circle.type]?.label}
              </span>
              <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                {circle.memberCount} member{circle.memberCount !== 1 ? "s" : ""}
              </span>
            </div>
            {circle.description && (
              <p className="mt-3 text-sm" style={{ color: "var(--cg-text-secondary)" }}>
                {circle.description}
              </p>
            )}

            {!session ? (
              <p className="mt-6 text-sm" style={{ color: "var(--cg-text-muted)" }}>
                Sign in to join this circle
              </p>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="mt-6 w-full rounded-lg py-2.5 text-sm font-medium transition-all disabled:opacity-50"
                style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
              >
                {joining ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Join Circle"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
