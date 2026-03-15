"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, DollarSign, TrendingUp, Calendar, KeyRound } from "lucide-react";

interface UsageData {
  totalQueries: number;
  totalCost: number;
  avgCostPerQuery: number;
  dailyBreakdown: Array<{ date: string; queries: number; cost: number }>;
}

const ADMIN_KEY_STORAGE = "golfEQ_admin_key";

export default function AdminConciergePage() {
  const { data: session, status } = useSession();
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("month");
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [keySubmitted, setKeySubmitted] = useState(false);

  const isAdmin = (session?.user as any)?.role === "admin";

  // Load saved admin key from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(ADMIN_KEY_STORAGE);
    if (saved) {
      setAdminKey(saved);
      setKeySubmitted(true);
    }
  }, []);

  const fetchUsage = useCallback(async (key: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/concierge/usage?period=${period}`, {
        headers: { "x-admin-key": key },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem(ADMIN_KEY_STORAGE);
          setKeySubmitted(false);
          throw new Error("Invalid admin key");
        }
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to fetch usage data");
      }

      const json = await res.json();
      setData(json);
      localStorage.setItem(ADMIN_KEY_STORAGE, key);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    if (!keySubmitted || !adminKey) {
      setLoading(false);
      return;
    }
    fetchUsage(adminKey);
  }, [period, status, isAdmin, keySubmitted, adminKey, fetchUsage]);

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey.trim()) {
      setKeySubmitted(true);
      fetchUsage(adminKey.trim());
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <h2 className="text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
            Access Denied
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--cg-text-muted)" }}>
            You must be an admin to view this page.
          </p>
        </div>
      </div>
    );
  }

  if (!keySubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <form
          onSubmit={handleKeySubmit}
          className="w-full max-w-sm rounded-xl p-8"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
          }}
        >
          <div className="mb-4 flex items-center gap-2" style={{ color: "var(--cg-accent)" }}>
            <KeyRound className="h-5 w-5" />
            <h2 className="text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
              Admin Access
            </h2>
          </div>
          <p className="mb-4 text-sm" style={{ color: "var(--cg-text-muted)" }}>
            Enter your admin API key to view concierge usage data.
          </p>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Admin API key"
            className="mb-3 w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: "var(--cg-bg-tertiary)",
              color: "var(--cg-text-primary)",
              border: "1px solid var(--cg-border)",
            }}
            autoFocus
          />
          <button
            type="submit"
            className="w-full rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "var(--cg-accent)",
              color: "var(--cg-text-inverse)",
            }}
          >
            Continue
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
            Concierge Usage
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>
            AI Concierge cost monitoring dashboard
          </p>
        </div>

        <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
          {(["today", "week", "month", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p ? "" : ""
              }`}
              style={{
                backgroundColor: period === p ? "var(--cg-accent)" : "transparent",
                color: period === p ? "var(--cg-text-inverse)" : "var(--cg-text-secondary)",
              }}
            >
              {p === "today" ? "Today" : p === "week" ? "Week" : p === "month" ? "Month" : "All"}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div
          className="rounded-xl p-6 text-center text-sm"
          style={{ backgroundColor: "var(--cg-bg-card)", color: "var(--cg-error)" }}
        >
          {error}
        </div>
      ) : data ? (
        <>
          {/* Stats Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<MessageCircle className="h-5 w-5" />}
              label="Total Queries"
              value={data.totalQueries.toLocaleString()}
            />
            <StatCard
              icon={<DollarSign className="h-5 w-5" />}
              label="Total Cost"
              value={`$${data.totalCost.toFixed(4)}`}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Avg Cost / Query"
              value={`$${data.avgCostPerQuery.toFixed(6)}`}
            />
            <StatCard
              icon={<Calendar className="h-5 w-5" />}
              label="Days Active"
              value={data.dailyBreakdown.length.toString()}
            />
          </div>

          {/* Daily Breakdown Table */}
          <div
            className="overflow-hidden rounded-xl"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--cg-border)" }}>
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--cg-text-primary)" }}
              >
                Daily Breakdown
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--cg-border)" }}>
                    <th
                      className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      Date
                    </th>
                    <th
                      className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      Queries
                    </th>
                    <th
                      className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      Cost
                    </th>
                    <th
                      className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      Avg / Query
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.dailyBreakdown.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-8 text-center"
                        style={{ color: "var(--cg-text-muted)" }}
                      >
                        No usage data for this period
                      </td>
                    </tr>
                  ) : (
                    data.dailyBreakdown.map((row) => (
                      <tr
                        key={row.date}
                        className="transition-colors"
                        style={{ borderBottom: "1px solid var(--cg-border-subtle)" }}
                      >
                        <td className="px-5 py-3" style={{ color: "var(--cg-text-primary)" }}>
                          {new Date(row.date + "T00:00:00").toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td
                          className="px-5 py-3 text-right"
                          style={{ color: "var(--cg-text-secondary)" }}
                        >
                          {row.queries.toLocaleString()}
                        </td>
                        <td
                          className="px-5 py-3 text-right font-mono"
                          style={{ color: "var(--cg-accent)" }}
                        >
                          ${row.cost.toFixed(4)}
                        </td>
                        <td
                          className="px-5 py-3 text-right font-mono"
                          style={{ color: "var(--cg-text-muted)" }}
                        >
                          ${row.queries > 0 ? (row.cost / row.queries).toFixed(6) : "0.000000"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: "var(--cg-bg-card)",
        border: "1px solid var(--cg-border)",
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <div style={{ color: "var(--cg-accent)" }}>{icon}</div>
        <span className="text-xs font-medium" style={{ color: "var(--cg-text-muted)" }}>
          {label}
        </span>
      </div>
      <div className="text-xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
        {value}
      </div>
    </div>
  );
}
