"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Compass,
  Mail,
  Loader2,
  Shield,
  Trophy,
  Globe,
  Medal,
  UserCheck,
  ChevronDown,
} from "lucide-react";

const TYPE_LABELS: Record<string, { label: string; icon: any }> = {
  CREW: { label: "Crew", icon: Users },
  GAME: { label: "Game", icon: Trophy },
  NETWORK: { label: "Network", icon: Globe },
  CLUB: { label: "Club", icon: Shield },
  LEAGUE: { label: "League", icon: Medal },
};

const TABS = ["My Circles", "Discover", "Invitations"] as const;
type Tab = (typeof TABS)[number];

export default function CirclesHubPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("My Circles");
  const [typeFilter, setTypeFilter] = useState<string>("");

  if (status === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Users className="mx-auto h-16 w-16" style={{ color: "var(--cg-text-muted)" }} />
        <h1 className="mt-4 font-display text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
          Sign in to view Circles
        </h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
          Circles
        </h1>
        <Link
          href="/circles/create"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
          style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
        >
          <Plus className="h-4 w-4" /> Create Circle
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 rounded-lg p-1" style={{ backgroundColor: "var(--cg-bg-secondary)" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all"
            style={{
              backgroundColor: tab === t ? "var(--cg-bg-card)" : "transparent",
              color: tab === t ? "var(--cg-text-primary)" : "var(--cg-text-muted)",
            }}
          >
            {t === "My Circles" && <Users className="h-4 w-4" />}
            {t === "Discover" && <Compass className="h-4 w-4" />}
            {t === "Invitations" && <Mail className="h-4 w-4" />}
            {t}
          </button>
        ))}
      </div>

      {/* Type filter for My Circles and Discover */}
      {(tab === "My Circles" || tab === "Discover") && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setTypeFilter("")}
            className="rounded-full px-3 py-1 text-xs font-medium transition-all"
            style={{
              backgroundColor: !typeFilter ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
              color: !typeFilter ? "var(--cg-text-inverse)" : "var(--cg-text-secondary)",
            }}
          >
            All
          </button>
          {Object.entries(TYPE_LABELS).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className="rounded-full px-3 py-1 text-xs font-medium transition-all"
              style={{
                backgroundColor: typeFilter === key ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
                color: typeFilter === key ? "var(--cg-text-inverse)" : "var(--cg-text-secondary)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {tab === "My Circles" && <MyCirclesTab typeFilter={typeFilter} />}
      {tab === "Discover" && <DiscoverTab typeFilter={typeFilter} />}
      {tab === "Invitations" && <InvitationsTab />}
    </div>
  );
}

function MyCirclesTab({ typeFilter }: { typeFilter: string }) {
  const [circles, setCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    fetch(`/api/circles?${params}`)
      .then((r) => r.json())
      .then(setCircles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [typeFilter]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (circles.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
        <Users className="mx-auto h-10 w-10" style={{ color: "var(--cg-text-muted)" }} />
        <h3 className="mt-3 font-display text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
          No circles yet
        </h3>
        <p className="mt-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>
          Create a circle or join one to get started
        </p>
        <Link
          href="/circles/create"
          className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
        >
          <Plus className="h-4 w-4" /> Create Circle
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {circles.map((circle) => (
        <CircleCard key={circle.id} circle={circle} showRole />
      ))}
    </div>
  );
}

function DiscoverTab({ typeFilter }: { typeFilter: string }) {
  const [circles, setCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("members");
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (search) params.set("search", search);
    params.set("sort", sort);
    fetch(`/api/circles/discover?${params}`)
      .then((r) => r.json())
      .then((data) => setCircles(data.circles ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [typeFilter, search, sort]);

  const handleJoin = async (circleId: string) => {
    setJoiningId(circleId);
    try {
      const res = await fetch(`/api/circles/${circleId}/join`, { method: "POST" });
      if (res.ok) {
        setCircles((prev) => prev.filter((c) => c.id !== circleId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--cg-text-muted)" }} />
          <input
            type="text"
            placeholder="Search circles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg pl-10 pr-4 py-2 text-sm"
            style={{
              backgroundColor: "var(--cg-bg-tertiary)",
              color: "var(--cg-text-primary)",
              border: "1px solid var(--cg-border)",
            }}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm"
          style={{
            backgroundColor: "var(--cg-bg-tertiary)",
            color: "var(--cg-text-primary)",
            border: "1px solid var(--cg-border)",
          }}
        >
          <option value="members">Most Members</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
        </div>
      ) : circles.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
          <Compass className="mx-auto h-10 w-10" style={{ color: "var(--cg-text-muted)" }} />
          <h3 className="mt-3 font-display text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
            No circles found
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {circles.map((circle) => (
            <div
              key={circle.id}
              className="rounded-xl p-4 transition-all hover:scale-[1.01]"
              style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "var(--cg-accent-bg)" }}
                >
                  {circle.avatarUrl ? (
                    <img src={circle.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <TypeIcon type={circle.type} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/circles/${circle.id}`}
                    className="font-semibold text-sm truncate block hover:underline"
                    style={{ color: "var(--cg-text-primary)" }}
                  >
                    {circle.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: "var(--cg-accent)" }}>
                      {TYPE_LABELS[circle.type]?.label}
                    </span>
                    <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                      {circle.memberCount} member{circle.memberCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
              {circle.description && (
                <p className="mt-2 text-xs line-clamp-2" style={{ color: "var(--cg-text-secondary)" }}>
                  {circle.description}
                </p>
              )}
              <button
                onClick={() => handleJoin(circle.id)}
                disabled={joiningId === circle.id}
                className="mt-3 w-full rounded-lg py-1.5 text-sm font-medium transition-all"
                style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
              >
                {joiningId === circle.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  "Join"
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InvitationsTab() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/circles/invitations")
      .then((r) => r.json())
      .then(setInvitations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: string, action: "accept" | "decline") => {
    setActionId(id);
    try {
      const res = await fetch(`/api/circles/invitations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setInvitations((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}>
        <Mail className="mx-auto h-10 w-10" style={{ color: "var(--cg-text-muted)" }} />
        <h3 className="mt-3 font-display text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
          No pending invitations
        </h3>
        <p className="mt-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>
          When someone invites you to a circle, it will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invitations.map((inv) => (
        <div
          key={inv.id}
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--cg-accent-bg)" }}
          >
            {inv.circle.avatarUrl ? (
              <img src={inv.circle.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <TypeIcon type={inv.circle.type} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm" style={{ color: "var(--cg-text-primary)" }}>
              {inv.circle.name}
            </p>
            <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
              Invited by {inv.inviter.name ?? "Unknown"} · {new Date(inv.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => handleAction(inv.id, "accept")}
              disabled={actionId === inv.id}
              className="rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
            >
              Accept
            </button>
            <button
              onClick={() => handleAction(inv.id, "decline")}
              disabled={actionId === inv.id}
              className="rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-secondary)",
                border: "1px solid var(--cg-border)",
              }}
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CircleCard({ circle, showRole }: { circle: any; showRole?: boolean }) {
  return (
    <Link
      href={`/circles/${circle.id}`}
      className="rounded-xl p-4 block transition-all hover:scale-[1.01]"
      style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--cg-accent-bg)" }}
        >
          {circle.avatarUrl ? (
            <img src={circle.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <TypeIcon type={circle.type} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm truncate" style={{ color: "var(--cg-text-primary)" }}>
            {circle.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs" style={{ color: "var(--cg-accent)" }}>
              {TYPE_LABELS[circle.type]?.label}
            </span>
            <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
              {circle.memberCount} member{circle.memberCount !== 1 ? "s" : ""}
            </span>
            {showRole && circle.userRole && (
              <span
                className="text-xs rounded-full px-2 py-0.5"
                style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
              >
                {circle.userRole}
              </span>
            )}
          </div>
        </div>
      </div>
      {circle.description && (
        <p className="mt-2 text-xs line-clamp-2" style={{ color: "var(--cg-text-secondary)" }}>
          {circle.description}
        </p>
      )}
    </Link>
  );
}

function TypeIcon({ type }: { type: string }) {
  const Icon = TYPE_LABELS[type]?.icon ?? Users;
  return <Icon className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />;
}
