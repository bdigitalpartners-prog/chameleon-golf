"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Search,
  Loader2,
  ArrowLeft,
  ChevronDown,
  UserPlus,
  Shield,
  Crown,
  X,
  CheckCircle2,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  PENDING: "Pending",
  GUEST: "Guest",
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: "var(--cg-accent)",
  ADMIN: "var(--cg-accent)",
  MEMBER: "var(--cg-text-secondary)",
  PENDING: "var(--cg-status-warning, #f59e0b)",
  GUEST: "var(--cg-text-muted)",
};

export default function MembersPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const circleId = params.id as string;

  const [members, setMembers] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isAdmin = userRole === "OWNER" || userRole === "ADMIN";

  useEffect(() => {
    fetchMembers();
  }, [circleId, search, page]);

  useEffect(() => {
    if (isAdmin) {
      fetch(`/api/circles/${circleId}/members?role=PENDING&limit=50`)
        .then((r) => r.json())
        .then((data) => setPending(data.members ?? []))
        .catch(console.error);
    }
  }, [circleId, isAdmin]);

  const fetchMembers = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("limit", "20");
    fetch(`/api/circles/${circleId}/members?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setMembers(data.members ?? []);
        setTotalPages(data.totalPages ?? 1);
        if (data.userRole) setUserRole(data.userRole);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleMemberAction = async (userId: string, action: string) => {
    setActionLoading(userId);
    setActionMenu(null);
    try {
      const res = await fetch(`/api/circles/${circleId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchMembers();
        if (isAdmin) {
          fetch(`/api/circles/${circleId}/members?role=PENDING&limit=50`)
            .then((r) => r.json())
            .then((data) => setPending(data.members ?? []))
            .catch(console.error);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <button
        onClick={() => router.push(`/circles/${circleId}`)}
        className="flex items-center gap-1 text-sm mb-4"
        style={{ color: "var(--cg-text-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Circle
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
          Members
        </h1>
      </div>

      {/* Pending requests (admin only) */}
      {isAdmin && pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--cg-text-primary)" }}>
            Pending Requests ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((m) => (
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
                    Requested {new Date(m.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleMemberAction(m.userId, "approve")}
                    disabled={actionLoading === m.userId}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium"
                    style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleMemberAction(m.userId, "remove")}
                    disabled={actionLoading === m.userId}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium"
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
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: "var(--cg-text-muted)" }}
        />
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full rounded-lg pl-10 pr-4 py-2 text-sm"
          style={{
            backgroundColor: "var(--cg-bg-tertiary)",
            color: "var(--cg-text-primary)",
            border: "1px solid var(--cg-border)",
          }}
        />
      </div>

      {/* Member list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
        </div>
      ) : members.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <Users className="mx-auto h-10 w-10" style={{ color: "var(--cg-text-muted)" }} />
          <h3 className="mt-3 font-display text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
            No members found
          </h3>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl p-3 relative"
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
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--cg-text-primary)" }}>
                    {m.user?.name ?? "Unknown"}
                  </p>
                  {m.isVerified && (
                    <span title="Verified Member">
                      <CheckCircle2
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: "#22c55e" }}
                      />
                    </span>
                  )}
                  <span
                    className="text-xs font-medium rounded-full px-2 py-0.5"
                    style={{ backgroundColor: "var(--cg-bg-tertiary)", color: ROLE_COLORS[m.role] }}
                  >
                    {ROLE_LABELS[m.role]}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                  {m.user?.profile?.handicap != null && `Handicap: ${m.user.profile.handicap} · `}
                  Joined {new Date(m.joinedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Admin actions */}
              {isAdmin && m.role !== "OWNER" && m.role !== "PENDING" && (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setActionMenu(actionMenu === m.userId ? null : m.userId)}
                    className="rounded-lg p-1.5"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {actionMenu === m.userId && (
                    <div
                      className="absolute right-0 top-full mt-1 w-44 rounded-lg py-1 z-10 shadow-lg"
                      style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
                    >
                      {m.role === "MEMBER" && (
                        <button
                          onClick={() => handleMemberAction(m.userId, "promote")}
                          className="w-full text-left px-4 py-2 text-sm hover:opacity-80"
                          style={{ color: "var(--cg-text-primary)" }}
                        >
                          Promote to Admin
                        </button>
                      )}
                      {m.role === "ADMIN" && (
                        <button
                          onClick={() => handleMemberAction(m.userId, "demote")}
                          className="w-full text-left px-4 py-2 text-sm hover:opacity-80"
                          style={{ color: "var(--cg-text-primary)" }}
                        >
                          Demote to Member
                        </button>
                      )}
                      {userRole === "OWNER" && (
                        <button
                          onClick={() => {
                            if (confirm("Transfer ownership? You will become an Admin.")) {
                              handleMemberAction(m.userId, "transfer_ownership");
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:opacity-80"
                          style={{ color: "var(--cg-accent)" }}
                        >
                          Transfer Ownership
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm("Remove this member?")) {
                            handleMemberAction(m.userId, "remove");
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:opacity-80"
                        style={{ color: "var(--cg-status-error, #ef4444)" }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
          >
            Previous
          </button>
          <span className="flex items-center text-sm" style={{ color: "var(--cg-text-muted)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
