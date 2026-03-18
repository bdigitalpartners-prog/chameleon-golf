"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, Pause, RefreshCw } from "lucide-react";

function getAdminKey(): string {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("adminApiKey") || "";
  }
  return "";
}

export default function AdminLooperGuildPage() {
  const [tab, setTab] = useState<"applications" | "approved">("applications");
  const [caddies, setCaddies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCaddies = useCallback(async () => {
    setLoading(true);
    try {
      const status = tab === "applications" ? "PENDING" : "APPROVED";
      const key = getAdminKey();
      const url = `/api/admin/looper-guild/caddies?status=${status}${key ? `&key=${key}` : ""}`;
      const res = await fetch(url, {
        headers: key ? { "x-admin-key": key } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCaddies(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchCaddies();
  }, [fetchCaddies]);

  async function updateStatus(id: string, status: string) {
    setActionLoading(id);
    try {
      const key = getAdminKey();
      await fetch("/api/admin/looper-guild/caddies", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(key ? { "x-admin-key": key } : {}),
        },
        body: JSON.stringify({ id, status }),
      });
      fetchCaddies();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6"
      style={{ backgroundColor: "var(--cg-bg-primary)" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Looper Guild Management
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--cg-text-muted)" }}
            >
              Manage caddy applications and profiles
            </p>
          </div>
          <button
            onClick={fetchCaddies}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              color: "var(--cg-text-secondary)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 mb-6 rounded-lg p-1"
          style={{ backgroundColor: "var(--cg-bg-secondary)" }}
        >
          {(
            [
              { key: "applications", label: "Applications" },
              { key: "approved", label: "Approved Caddies" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor:
                  tab === t.key ? "var(--cg-bg-card)" : "transparent",
                color:
                  tab === t.key
                    ? "var(--cg-text-primary)"
                    : "var(--cg-text-muted)",
                border:
                  tab === t.key
                    ? "1px solid var(--cg-border)"
                    : "1px solid transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div
            className="text-center py-12 text-sm"
            style={{ color: "var(--cg-text-muted)" }}
          >
            Loading...
          </div>
        ) : caddies.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <p
              className="text-sm"
              style={{ color: "var(--cg-text-muted)" }}
            >
              {tab === "applications"
                ? "No pending applications"
                : "No approved caddies yet"}
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--cg-border)" }}>
                    {["Name", "Email", "Courses", "Applied", "Status", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "var(--cg-text-muted)" }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {caddies.map((caddy) => (
                    <tr
                      key={caddy.id}
                      style={{ borderBottom: "1px solid var(--cg-border)" }}
                    >
                      <td
                        className="px-4 py-3 font-medium"
                        style={{ color: "var(--cg-text-primary)" }}
                      >
                        {caddy.firstName} {caddy.lastName}
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{ color: "var(--cg-text-secondary)" }}
                      >
                        {caddy.email}
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{ color: "var(--cg-text-secondary)" }}
                      >
                        {caddy.courses
                          ?.map((cc: any) => cc.course.courseName)
                          .join(", ") || "—"}
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{ color: "var(--cg-text-muted)" }}
                      >
                        {new Date(caddy.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                          style={{
                            backgroundColor:
                              caddy.status === "APPROVED"
                                ? "rgba(74, 222, 128, 0.15)"
                                : caddy.status === "PENDING"
                                ? "rgba(250, 204, 21, 0.15)"
                                : caddy.status === "REJECTED"
                                ? "rgba(239, 68, 68, 0.15)"
                                : "rgba(156, 163, 175, 0.15)",
                            color:
                              caddy.status === "APPROVED"
                                ? "#4ade80"
                                : caddy.status === "PENDING"
                                ? "#facc15"
                                : caddy.status === "REJECTED"
                                ? "#ef4444"
                                : "#9ca3af",
                          }}
                        >
                          {caddy.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {tab === "applications" && (
                            <>
                              <button
                                onClick={() =>
                                  updateStatus(caddy.id, "APPROVED")
                                }
                                disabled={actionLoading === caddy.id}
                                className="rounded-md p-1.5 transition-colors"
                                style={{
                                  backgroundColor: "rgba(74, 222, 128, 0.15)",
                                  color: "#4ade80",
                                }}
                                title="Approve"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  updateStatus(caddy.id, "REJECTED")
                                }
                                disabled={actionLoading === caddy.id}
                                className="rounded-md p-1.5 transition-colors"
                                style={{
                                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                                  color: "#ef4444",
                                }}
                                title="Reject"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {tab === "approved" && (
                            <button
                              onClick={() =>
                                updateStatus(caddy.id, "SUSPENDED")
                              }
                              disabled={actionLoading === caddy.id}
                              className="rounded-md p-1.5 transition-colors"
                              style={{
                                backgroundColor: "rgba(250, 204, 21, 0.15)",
                                color: "#facc15",
                              }}
                              title="Suspend"
                            >
                              <Pause className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
