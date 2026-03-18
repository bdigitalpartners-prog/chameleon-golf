"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Save, Star, Trophy, Heart, Shield, Ban,
  CheckCircle, Trash2, AlertTriangle, MessageSquare,
  Clock, Users as UsersIcon, Eye, MapPin,
} from "lucide-react";
import Link from "next/link";

interface UserDetail {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  status: string;
  isActive: boolean;
  adminNotes: string | null;
  ghinNumber: string | null;
  handicapIndex: number | null;
  homeState: string | null;
  ghinVerified: boolean;
  ghinVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  instagramUrl: string | null;
  twitterUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  websiteUrl: string | null;
  stats: {
    ratings: number;
    scores: number;
    wishlists: number;
    circles: number;
  };
  ratings: Array<{
    ratingId: number;
    courseId: number;
    courseName: string;
    overallRating: number;
    reviewTitle: string | null;
    createdAt: string;
  }>;
  scores: Array<{
    scoreId: number;
    courseId: number;
    courseName: string;
    totalScore: number;
    datePlayed: string;
    verificationStatus: string;
  }>;
  wishlists: Array<{
    id: number;
    courseId: number;
    courseName: string;
    status: string | null;
    createdAt: string;
  }>;
  circles: Array<{
    circleId: string;
    circleName: string;
    role: string;
    joinedAt: string;
  }>;
  activityLog: Array<{
    id: number;
    adminEmail: string;
    action: string;
    previousValue: string | null;
    newValue: string | null;
    reason: string | null;
    createdAt: string;
  }>;
}

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

function fetchAdmin(url: string, opts: RequestInit = {}) {
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": getAdminKey(),
      ...(opts.headers || {}),
    },
  });
}

const statusColors: Record<string, string> = {
  active: "bg-green-900/40 text-green-400 border-green-800",
  suspended: "bg-yellow-900/40 text-yellow-400 border-yellow-800",
  banned: "bg-red-900/40 text-red-400 border-red-800",
  deleted: "bg-gray-800 text-gray-500 border-gray-700",
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-900/40 text-purple-400",
  moderator: "bg-blue-900/40 text-blue-400",
  user: "bg-gray-800 text-gray-400",
};

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [tab, setTab] = useState<"ratings" | "scores" | "wishlists" | "circles" | "log">("ratings");

  // Editable fields
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Confirmation dialogs
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        const res = await fetchAdmin(`/api/admin/users/${userId}`);
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          return;
        }
        setUser(data);
        setRole(data.role);
        setStatus(data.status);
        setAdminNotes(data.adminNotes || "");
        setInstagramUrl(data.instagramUrl || "");
        setTwitterUrl(data.twitterUrl || "");
        setFacebookUrl(data.facebookUrl || "");
        setTiktokUrl(data.tiktokUrl || "");
        setWebsiteUrl(data.websiteUrl || "");
      } catch {
        setError("Failed to load user");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [userId]);

  const saveChanges = async () => {
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetchAdmin(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({
          role,
          status,
          adminNotes,
          instagramUrl,
          twitterUrl,
          facebookUrl,
          tiktokUrl,
          websiteUrl,
          adminEmail: "admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Changes saved");
        // Refresh user data
        const refreshRes = await fetchAdmin(`/api/admin/users/${userId}`);
        const refreshData = await refreshRes.json();
        if (!refreshData.error) setUser(refreshData);
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleAccountAction = async (action: string) => {
    setSaving(true);
    setError("");
    try {
      let newStatus = "";
      if (action === "suspend") newStatus = "suspended";
      else if (action === "ban") newStatus = "banned";
      else if (action === "reactivate") newStatus = "active";
      else if (action === "delete") {
        const res = await fetchAdmin(`/api/admin/users/${userId}`, {
          method: "DELETE",
          body: JSON.stringify({ adminEmail: "admin", reason: actionReason }),
        });
        const data = await res.json();
        if (data.success) {
          setSuccessMsg("Account deleted");
          setStatus("deleted");
          setUser((prev) => prev ? { ...prev, status: "deleted", isActive: false } : prev);
        } else {
          setError(data.error || "Failed");
        }
        setConfirmAction(null);
        setActionReason("");
        setSaving(false);
        return;
      }

      const res = await fetchAdmin(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
          adminEmail: "admin",
          reason: actionReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`User ${action}d successfully`);
        setStatus(newStatus);
        setUser((prev) =>
          prev ? { ...prev, status: newStatus, isActive: newStatus === "active" } : prev
        );
        // Refresh to get updated activity log
        const refreshRes = await fetchAdmin(`/api/admin/users/${userId}`);
        const refreshData = await refreshRes.json();
        if (!refreshData.error) setUser(refreshData);
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.error || "Failed");
      }
    } catch {
      setError("Action failed");
    } finally {
      setConfirmAction(null);
      setActionReason("");
      setSaving(false);
    }
  };

  const toggleGhinVerified = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetchAdmin(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ ghinVerified: !user.ghinVerified, adminEmail: "admin" }),
      });
      const data = await res.json();
      if (data.success) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                ghinVerified: !prev.ghinVerified,
                ghinVerifiedAt: !prev.ghinVerified ? new Date().toISOString() : null,
              }
            : prev
        );
      } else {
        setError(data.error || "Failed to update");
      }
    } catch {
      setError("Failed to update GHIN status");
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const fmtDateTime = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  const initials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>;
  if (!user) return <div className="text-center text-red-400 py-12">{error || "User not found"}</div>;

  const tabClass = (t: string) =>
    `px-4 py-2 text-sm font-medium border-b-2 ${
      tab === t ? "border-[#22c55e] text-white" : "border-transparent text-gray-500 hover:text-gray-300"
    }`;

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-xl border border-[#333] bg-[#111] p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Confirm {confirmAction}
            </h3>
            <p className="text-sm text-gray-400">
              Are you sure you want to <strong>{confirmAction}</strong> this user?
              {confirmAction === "delete" && " This will soft-delete the account."}
            </p>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e] h-20 resize-none"
            />
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => { setConfirmAction(null); setActionReason(""); }}
                className="px-4 py-2 rounded-lg border border-[#333] text-gray-400 hover:text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAccountAction(confirmAction)}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
                  confirmAction === "reactivate"
                    ? "bg-[#22c55e] text-black hover:bg-[#16a34a]"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {saving ? "Processing..." : `Confirm ${confirmAction}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/users" className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            {user.image ? (
              <img src={user.image} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center text-lg font-bold text-gray-400">
                {initials(user.name)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{user.name || "Unknown User"}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium border ${statusColors[user.status] || "bg-gray-800 text-gray-400 border-gray-700"}`}>
            {user.status}
          </span>
          <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${roleColors[user.role] || "bg-gray-800 text-gray-400"}`}>
            {user.role}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {successMsg && (
        <div className="rounded-lg bg-green-900/30 border border-green-800 px-4 py-3 text-sm text-green-400">{successMsg}</div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#222] bg-[#111] p-4 text-center">
          <Star className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{user.stats.ratings}</p>
          <p className="text-xs text-gray-500">Ratings</p>
        </div>
        <div className="rounded-xl border border-[#222] bg-[#111] p-4 text-center">
          <Trophy className="h-5 w-5 text-green-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{user.stats.scores}</p>
          <p className="text-xs text-gray-500">Scores</p>
        </div>
        <div className="rounded-xl border border-[#222] bg-[#111] p-4 text-center">
          <Heart className="h-5 w-5 text-red-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{user.stats.wishlists}</p>
          <p className="text-xs text-gray-500">Wishlists</p>
        </div>
        <div className="rounded-xl border border-[#222] bg-[#111] p-4 text-center">
          <UsersIcon className="h-5 w-5 text-blue-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{user.stats.circles}</p>
          <p className="text-xs text-gray-500">Circles</p>
        </div>
      </div>

      {/* Profile & Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="rounded-xl border border-[#222] bg-[#111] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-400">Profile</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">GHIN Number</span>
              <p className="text-white mt-0.5">{user.ghinNumber || "—"}</p>
            </div>
            <div>
              <span className="text-gray-500">Handicap Index</span>
              <p className="text-white mt-0.5">{user.handicapIndex != null ? user.handicapIndex.toFixed(1) : "—"}</p>
            </div>
            <div>
              <span className="text-gray-500">Home State</span>
              <p className="text-white mt-0.5">{user.homeState || "—"}</p>
            </div>
            <div>
              <span className="text-gray-500">Joined</span>
              <p className="text-white mt-0.5">{fmtDate(user.createdAt)}</p>
            </div>
            <div>
              <span className="text-gray-500">Last Login</span>
              <p className="text-white mt-0.5">{user.lastLoginAt ? fmtDateTime(user.lastLoginAt) : "—"}</p>
            </div>
            <div>
              <span className="text-gray-500">Last Updated</span>
              <p className="text-white mt-0.5">{fmtDate(user.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Role & Status Management */}
        <div className="rounded-xl border border-[#222] bg-[#111] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-400">Role & Status</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </div>
            <button
              onClick={saveChanges}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium text-sm hover:bg-[#16a34a] disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="rounded-xl border border-[#222] bg-[#111] p-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">Account Actions</h3>
        <div className="flex flex-wrap gap-3">
          {user.status !== "suspended" && (
            <button
              onClick={() => setConfirmAction("suspend")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-yellow-800 text-yellow-400 hover:bg-yellow-900/30 text-sm"
            >
              <Ban size={14} />
              Suspend
            </button>
          )}
          {user.status !== "banned" && (
            <button
              onClick={() => setConfirmAction("ban")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-800 text-red-400 hover:bg-red-900/30 text-sm"
            >
              <Shield size={14} />
              Ban
            </button>
          )}
          {(user.status === "suspended" || user.status === "banned") && (
            <button
              onClick={() => setConfirmAction("reactivate")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-800 text-green-400 hover:bg-green-900/30 text-sm"
            >
              <CheckCircle size={14} />
              Reactivate
            </button>
          )}
          {user.status !== "deleted" && (
            <button
              onClick={() => setConfirmAction("delete")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-800 text-red-400 hover:bg-red-900/30 text-sm"
            >
              <Trash2 size={14} />
              Delete Account
            </button>
          )}
        </div>
      </div>

      {/* GHIN Verification */}
      <div className="rounded-xl border border-[#222] bg-[#111] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-400">GHIN Verification</h3>
            <p className="text-sm mt-1">
              <span className={user.ghinVerified ? "text-green-500" : "text-gray-500"}>
                {user.ghinVerified ? "Verified" : "Not Verified"}
              </span>
              {user.ghinVerifiedAt && (
                <span className="text-gray-500 ml-2">· {fmtDate(user.ghinVerifiedAt)}</span>
              )}
            </p>
          </div>
          <button
            onClick={toggleGhinVerified}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              user.ghinVerified
                ? "border border-red-800 text-red-400 hover:bg-red-900/30"
                : "bg-[#22c55e] text-black hover:bg-[#16a34a]"
            } disabled:opacity-50`}
          >
            {user.ghinVerified ? "Unverify" : "Verify"}
          </button>
        </div>
      </div>

      {/* Admin Notes */}
      <div className="rounded-xl border border-[#222] bg-[#111] p-6 space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
          <MessageSquare size={14} />
          Admin Notes
        </h3>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Add private notes about this user..."
          className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e] h-24 resize-none"
        />
        <button
          onClick={saveChanges}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium text-sm hover:bg-[#16a34a] disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? "Saving..." : "Save Notes"}
        </button>
      </div>

      {/* Social Links */}
      <div className="rounded-xl border border-[#222] bg-[#111] p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400">Social Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Instagram URL</label>
            <input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Twitter / X URL</label>
            <input type="url" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://x.com/..." className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Facebook URL</label>
            <input type="url" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">TikTok URL</label>
            <input type="url" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="https://tiktok.com/@..." className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Website URL</label>
            <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]" />
          </div>
        </div>
        <button
          onClick={saveChanges}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium text-sm hover:bg-[#16a34a] disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Activity Tabs */}
      <div className="border-b border-[#222] flex gap-0 overflow-x-auto">
        <button className={tabClass("ratings")} onClick={() => setTab("ratings")}>
          <Star size={14} className="inline mr-1" />
          Ratings ({user.stats.ratings})
        </button>
        <button className={tabClass("scores")} onClick={() => setTab("scores")}>
          <Trophy size={14} className="inline mr-1" />
          Scores ({user.stats.scores})
        </button>
        <button className={tabClass("wishlists")} onClick={() => setTab("wishlists")}>
          <Heart size={14} className="inline mr-1" />
          Wishlists ({user.stats.wishlists})
        </button>
        <button className={tabClass("circles")} onClick={() => setTab("circles")}>
          <UsersIcon size={14} className="inline mr-1" />
          Circles ({user.stats.circles})
        </button>
        <button className={tabClass("log")} onClick={() => setTab("log")}>
          <Clock size={14} className="inline mr-1" />
          Audit Log ({user.activityLog.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        {tab === "ratings" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium text-right">Rating</th>
                <th className="px-4 py-3 font-medium">Review Title</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {user.ratings.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No ratings</td></tr>
              ) : (
                user.ratings.map((r) => (
                  <tr key={r.ratingId} className="border-b border-[#1a1a1a]">
                    <td className="px-4 py-3 text-white">{r.courseName}</td>
                    <td className="px-4 py-3 text-right text-white font-mono">{r.overallRating.toFixed(1)}</td>
                    <td className="px-4 py-3 text-gray-400">{r.reviewTitle || "—"}</td>
                    <td className="px-4 py-3 text-gray-400">{fmtDate(r.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {tab === "scores" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium text-right">Score</th>
                <th className="px-4 py-3 font-medium">Date Played</th>
                <th className="px-4 py-3 font-medium">Verification</th>
              </tr>
            </thead>
            <tbody>
              {user.scores.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No scores</td></tr>
              ) : (
                user.scores.map((s) => (
                  <tr key={s.scoreId} className="border-b border-[#1a1a1a]">
                    <td className="px-4 py-3 text-white">{s.courseName}</td>
                    <td className="px-4 py-3 text-right text-white font-mono">{s.totalScore}</td>
                    <td className="px-4 py-3 text-gray-400">{fmtDate(s.datePlayed)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        s.verificationStatus === "verified" ? "bg-green-900/40 text-green-400" :
                        s.verificationStatus === "rejected" ? "bg-red-900/40 text-red-400" :
                        "bg-yellow-900/40 text-yellow-400"
                      }`}>
                        {s.verificationStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {tab === "wishlists" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Added</th>
              </tr>
            </thead>
            <tbody>
              {user.wishlists.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No wishlist items</td></tr>
              ) : (
                user.wishlists.map((w) => (
                  <tr key={w.id} className="border-b border-[#1a1a1a]">
                    <td className="px-4 py-3 text-white">{w.courseName}</td>
                    <td className="px-4 py-3 text-gray-400">{w.status || "—"}</td>
                    <td className="px-4 py-3 text-gray-400">{fmtDate(w.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {tab === "circles" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Circle</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {user.circles.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No circles</td></tr>
              ) : (
                user.circles.map((c) => (
                  <tr key={c.circleId} className="border-b border-[#1a1a1a]">
                    <td className="px-4 py-3 text-white">{c.circleName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        c.role === "owner" ? "bg-purple-900/40 text-purple-400" :
                        c.role === "admin" ? "bg-blue-900/40 text-blue-400" :
                        "bg-gray-800 text-gray-400"
                      }`}>
                        {c.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{fmtDate(c.joinedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {tab === "log" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {user.activityLog.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No activity logged</td></tr>
              ) : (
                user.activityLog.map((log) => (
                  <tr key={log.id} className="border-b border-[#1a1a1a]">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-300">{log.adminEmail}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {log.previousValue && log.newValue
                        ? `${log.previousValue} → ${log.newValue}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{log.reason || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
