"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Save, Star, Trophy, Heart } from "lucide-react";
import Link from "next/link";

interface UserDetail {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  ghinNumber: string | null;
  handicapIndex: number | null;
  homeState: string | null;
  ghinVerified: boolean;
  ghinVerifiedAt: string | null;
  isActive: boolean;
  createdAt: string;
  instagramUrl: string | null;
  twitterUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  websiteUrl: string | null;
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

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"ratings" | "scores" | "wishlists">("ratings");
  const [role, setRole] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
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
        setIsActive(data.isActive);
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
    fetchUser();
  }, [userId]);

  const saveChanges = async () => {
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetchAdmin(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ role, isActive, instagramUrl, twitterUrl, facebookUrl, tiktokUrl, websiteUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Changes saved");
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

  const toggleGhinVerified = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetchAdmin(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ ghinVerified: !user.ghinVerified }),
      });
      const data = await res.json();
      if (data.success) {
        setUser((prev) => prev ? { ...prev, ghinVerified: !prev.ghinVerified, ghinVerifiedAt: !prev.ghinVerified ? new Date().toISOString() : null } : prev);
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

  if (loading) return <div className="text-center text-gray-500 py-12">Loading...</div>;
  if (!user) return <div className="text-center text-red-400 py-12">{error || "User not found"}</div>;

  const tabClass = (t: string) =>
    `px-4 py-2 text-sm font-medium border-b-2 ${
      tab === t ? "border-[#22c55e] text-white" : "border-transparent text-gray-500 hover:text-gray-300"
    }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{user.name || "Unknown User"}</h1>
          <p className="text-sm text-gray-400 mt-1">{user.email}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {successMsg && (
        <div className="rounded-lg bg-green-900/30 border border-green-800 px-4 py-3 text-sm text-green-400">{successMsg}</div>
      )}

      {/* Profile & Settings */}
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
          </div>
        </div>

        {/* Role & Status */}
        <div className="rounded-xl border border-[#222] bg-[#111] p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-400">Settings</h3>
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
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Active</span>
              <button
                onClick={() => setIsActive(!isActive)}
                className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? "bg-[#22c55e]" : "bg-gray-700"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isActive ? "translate-x-5" : ""}`} />
              </button>
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
      <div className="border-b border-[#222] flex gap-0">
        <button className={tabClass("ratings")} onClick={() => setTab("ratings")}>
          <Star size={14} className="inline mr-1" />
          Ratings ({user.ratings.length})
        </button>
        <button className={tabClass("scores")} onClick={() => setTab("scores")}>
          <Trophy size={14} className="inline mr-1" />
          Scores ({user.scores.length})
        </button>
        <button className={tabClass("wishlists")} onClick={() => setTab("wishlists")}>
          <Heart size={14} className="inline mr-1" />
          Wishlists ({user.wishlists.length})
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
      </div>
    </div>
  );
}
