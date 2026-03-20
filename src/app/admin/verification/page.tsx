"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Loader2,
} from "lucide-react";

interface VerificationRow {
  id: string;
  ghinNumber: string;
  handicapIndex: number | null;
  screenshotUrl: string;
  status: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  reviewer: { id: string; name: string | null; email: string | null } | null;
}

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

export default function VerificationQueuePage() {
  const [verifications, setVerifications] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  // Modal state
  const [screenshotModal, setScreenshotModal] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      params.set("page", String(page));

      const res = await fetch(`/api/admin/ghin/queue?${params}`, {
        headers: { "x-admin-key": getAdminKey() },
      });
      const data = await res.json();
      setVerifications(data.verifications || []);
      setTotalPages(data.totalPages || 1);
      if (data.stats) setStats(data.stats);
    } catch {
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/ghin/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": getAdminKey(),
        },
        body: JSON.stringify({ verificationId: id, action: "approve" }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectNote.trim()) return;
    setActionLoading(rejectModal);
    try {
      const res = await fetch("/api/admin/ghin/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": getAdminKey(),
        },
        body: JSON.stringify({
          verificationId: rejectModal,
          action: "reject",
          note: rejectNote.trim(),
        }),
      });
      if (res.ok) {
        setRejectModal(null);
        setRejectNote("");
        await fetchData();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">GHIN Verification Queue</h1>
        <p className="text-sm text-gray-400 mt-1">
          Review and approve handicap verification requests
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Pending"
          value={stats.pending}
          color="text-amber-400"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Approved"
          value={stats.approved}
          color="text-green-500"
        />
        <StatCard
          icon={<XCircle className="h-5 w-5" />}
          label="Rejected"
          value={stats.rejected}
          color="text-red-400"
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {["pending", "approved", "rejected", "all"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors"
            style={{
              backgroundColor:
                statusFilter === s ? "#01696F" : "#1a1a1a",
              color: statusFilter === s ? "white" : "#9ca3af",
              border: `1px solid ${statusFilter === s ? "#01696F" : "#333"}`,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#222] text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">GHIN #</th>
                <th className="px-4 py-3 font-medium text-right">Handicap</th>
                <th className="px-4 py-3 font-medium">Screenshot</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {statusFilter === "pending" && (
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={statusFilter === "pending" ? 7 : 6}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : verifications.length === 0 ? (
                <tr>
                  <td
                    colSpan={statusFilter === "pending" ? 7 : 6}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    No verifications found
                  </td>
                </tr>
              ) : (
                verifications.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-white font-medium">
                          {v.user.name || "Unknown"}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {v.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 font-mono">
                      {v.ghinNumber}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-mono">
                      {v.handicapIndex?.toFixed(1) ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {v.screenshotUrl ? (
                        <button
                          onClick={() => setScreenshotModal(v.screenshotUrl)}
                          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded border border-[#333] text-gray-400 hover:text-white hover:border-[#01696F] transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      ) : (
                        <span className="text-xs text-gray-600">No image</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(v.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={v.status} />
                    </td>
                    {statusFilter === "pending" && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(v.id)}
                            disabled={actionLoading === v.id}
                            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: "rgba(1, 105, 111, 0.2)",
                              color: "#01696F",
                              border: "1px solid rgba(1, 105, 111, 0.3)",
                            }}
                          >
                            {actionLoading === v.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Approve"
                            )}
                          </button>
                          <button
                            onClick={() => setRejectModal(v.id)}
                            disabled={actionLoading === v.id}
                            className="px-3 py-1.5 rounded text-xs font-medium bg-red-900/20 text-red-400 border border-red-900/30 transition-colors hover:bg-red-900/30"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-[#333] text-gray-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-[#333] text-gray-400 hover:text-white disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Screenshot Modal */}
      {screenshotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setScreenshotModal(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] overflow-auto rounded-xl"
            style={{ backgroundColor: "#111", border: "1px solid #333" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-[#222]" style={{ backgroundColor: "#111" }}>
              <h3 className="text-sm font-semibold text-white">
                GHIN Profile Screenshot
              </h3>
              <button
                onClick={() => setScreenshotModal(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={screenshotModal}
                alt="GHIN profile screenshot"
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => {
            setRejectModal(null);
            setRejectNote("");
          }}
        >
          <div
            className="relative max-w-md w-full rounded-xl p-6"
            style={{ backgroundColor: "#111", border: "1px solid #333" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Reject Verification
            </h3>
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1.5">
                Reason for rejection (required)
              </label>
              <textarea
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="e.g., Screenshot does not match GHIN number..."
                className="w-full rounded-lg px-3 py-2 text-sm bg-[#1a1a1a] border border-[#333] text-white placeholder-gray-600 resize-none focus:outline-none focus:border-[#01696F]"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectNote("");
                }}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 border border-[#333] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectNote.trim() || !!actionLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#111111] p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className={color}>{icon}</div>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    pending: { bg: "bg-amber-900/30", text: "text-amber-400" },
    approved: { bg: "bg-green-900/30", text: "text-green-400" },
    rejected: { bg: "bg-red-900/30", text: "text-red-400" },
  };
  const s = styles[status] || styles.pending;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${s.bg} ${s.text}`}
    >
      {status}
    </span>
  );
}
