"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

interface QueueItem {
  queueId: number;
  scoreId: number;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: number;
  courseName: string;
  ghinNumber: string | null;
  screenshotUrl: string | null;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewNotes: string | null;
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

export default function VerificationQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectId, setShowRejectId] = useState<number | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetchAdmin(`/api/admin/users/verification?status=${statusFilter}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async (queueId: number, action: "approve" | "reject", notes?: string) => {
    setActioningId(queueId);
    setError("");
    try {
      const res = await fetchAdmin(`/api/admin/users/verification/${queueId}`, {
        method: "PUT",
        body: JSON.stringify({ action, notes }),
      });
      const data = await res.json();
      if (data.success) {
        setShowRejectId(null);
        setRejectNotes("");
        fetchQueue();
      } else {
        setError(data.error || "Action failed");
      }
    } catch {
      setError("Failed to process action");
    } finally {
      setActioningId(null);
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">GHIN Verification Queue</h1>
          <p className="text-sm text-gray-400 mt-1">Review and process GHIN verification requests</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div>
        <label className="block text-xs text-gray-500 mb-1">Filter by status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">GHIN #</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Screenshot</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">No items in queue</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.queueId} className="border-b border-[#1a1a1a]">
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{item.userName}</div>
                      <div className="text-xs text-gray-500">{item.userEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{item.courseName}</td>
                    <td className="px-4 py-3 text-white font-mono">{item.ghinNumber || "—"}</td>
                    <td className="px-4 py-3 text-gray-400">{fmtDate(item.submittedAt)}</td>
                    <td className="px-4 py-3">
                      {item.screenshotUrl ? (
                        <a
                          href={item.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#22c55e] hover:underline text-xs"
                        >
                          View <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        item.status === "approved" ? "bg-green-900/40 text-green-400" :
                        item.status === "rejected" ? "bg-red-900/40 text-red-400" :
                        "bg-yellow-900/40 text-yellow-400"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(item.queueId, "approve")}
                            disabled={actioningId === item.queueId}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-green-900/30 text-green-400 text-xs hover:bg-green-900/50 disabled:opacity-50"
                          >
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button
                            onClick={() => setShowRejectId(showRejectId === item.queueId ? null : item.queueId)}
                            disabled={actioningId === item.queueId}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-900/30 text-red-400 text-xs hover:bg-red-900/50 disabled:opacity-50"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      )}
                      {item.reviewNotes && (
                        <p className="text-xs text-gray-500 mt-1">Note: {item.reviewNotes}</p>
                      )}
                      {showRejectId === item.queueId && (
                        <div className="mt-2 space-y-2">
                          <input
                            value={rejectNotes}
                            onChange={(e) => setRejectNotes(e.target.value)}
                            placeholder="Rejection notes (optional)"
                            className="w-full px-2 py-1 rounded bg-[#1a1a1a] border border-[#333] text-white text-xs focus:outline-none focus:border-[#22c55e]"
                          />
                          <button
                            onClick={() => handleAction(item.queueId, "reject", rejectNotes)}
                            disabled={actioningId === item.queueId}
                            className="px-3 py-1 rounded bg-red-900/50 text-red-400 text-xs hover:bg-red-900/70 disabled:opacity-50"
                          >
                            Confirm Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
