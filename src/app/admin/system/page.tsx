"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Database,
  Key,
  Shield,
  Mail,
  BarChart3,
  Bug,
  Server,
  Settings,
  Clock,
  Trash2,
  Plus,
  Save,
  ChevronLeft,
  ChevronRight,
  Filter,
  ExternalLink,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

/* ── Types ── */

type TabKey = "health" | "config" | "audit" | "email";

interface HealthCheck {
  name: string;
  status: boolean;
  detail: string;
}

interface HealthData {
  checks: Record<string, HealthCheck>;
  environment: string;
  nodeVersion: string;
}

interface ConfigRow {
  key: string;
  value: string;
  updatedAt: string;
  updatedBy: string | null;
}

interface AuditLogEntry {
  id: number;
  adminUser: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

/* ── Helpers ── */

const ADMIN_KEY = () => typeof window !== "undefined" ? sessionStorage.getItem("golfEQ_admin_key") || "" : "";

function fetchAdmin(url: string, opts: RequestInit = {}) {
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_KEY(),
      ...(opts.headers || {}),
    },
  });
}

/* ── Page Component ── */

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("health");

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "health", label: "API Health" },
    { key: "config", label: "Admin Config" },
    { key: "audit", label: "Audit Log" },
    { key: "email", label: "Email Templates" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">System</h1>
        <p className="mt-1 text-sm text-gray-400">Health checks, configuration, audit log, and email templates</p>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-lg bg-[#111111] p-1 w-fit border border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t.key ? "bg-green-500 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "health" && <HealthTab />}
      {activeTab === "config" && <ConfigTab />}
      {activeTab === "audit" && <AuditTab />}
      {activeTab === "email" && <EmailTab />}
    </div>
  );
}

/* ── Health Tab ── */

const HEALTH_ICONS: Record<string, React.ReactNode> = {
  database: <Database className="h-5 w-5" />,
  perplexity: <Activity className="h-5 w-5" />,
  adminKey: <Key className="h-5 w-5" />,
  nextAuth: <Shield className="h-5 w-5" />,
  resend: <Mail className="h-5 w-5" />,
  posthog: <BarChart3 className="h-5 w-5" />,
  sentry: <Bug className="h-5 w-5" />,
};

function HealthTab() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmin("/api/admin/system/health")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-500">Running health checks...</div>;
  }

  if (!data) return null;

  return (
    <div>
      {/* Health cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Object.entries(data.checks).map(([key, check]) => (
          <div key={key} className="rounded-xl border border-gray-800 bg-[#111111] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={check.status ? "text-green-500" : "text-red-500"}>
                  {HEALTH_ICONS[key] || <Server className="h-5 w-5" />}
                </div>
                <span className="text-sm font-medium text-white">{check.name}</span>
              </div>
              <div className={`h-3 w-3 rounded-full ${check.status ? "bg-green-500" : "bg-red-500"}`} />
            </div>
            <span className={`text-xs font-medium ${check.status ? "text-green-400" : "text-red-400"}`}>
              {check.detail}
            </span>
          </div>
        ))}
      </div>

      {/* Deployment info */}
      <div className="rounded-xl border border-gray-800 bg-[#111111] p-6">
        <div className="mb-3 flex items-center gap-2">
          <Server className="h-5 w-5 text-green-500" />
          <h3 className="text-sm font-semibold text-white">Deployment Info</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="text-xs font-medium text-gray-500">Environment</span>
            <div className="mt-1">
              <span className="rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-white">
                {data.environment}
              </span>
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500">Node Version</span>
            <div className="mt-1">
              <span className="rounded-full bg-gray-800 px-3 py-1 text-xs font-mono text-white">
                {data.nodeVersion}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Config Tab ── */

function ConfigTab() {
  const [rows, setRows] = useState<ConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const loadConfig = useCallback(() => {
    setLoading(true);
    fetchAdmin("/api/admin/config?format=rows")
      .then((r) => r.json())
      .then((data) => setRows(data.rows || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const saveEdit = async (key: string) => {
    await fetchAdmin("/api/admin/config", {
      method: "PUT",
      body: JSON.stringify({ key, value: editValue }),
    });
    setEditingKey(null);
    loadConfig();
  };

  const addConfig = async () => {
    if (!newKey.trim()) return;
    await fetchAdmin("/api/admin/config", {
      method: "PUT",
      body: JSON.stringify({ key: newKey.trim(), value: newValue }),
    });
    setNewKey("");
    setNewValue("");
    setShowAdd(false);
    loadConfig();
  };

  const deleteConfig = async (key: string) => {
    await fetchAdmin("/api/admin/config", {
      method: "DELETE",
      body: JSON.stringify({ key }),
    });
    loadConfig();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-500">Loading config...</div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400">All Configuration ({rows.length} entries)</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Entry
        </button>
      </div>

      {/* Add new row */}
      {showAdd && (
        <div className="mb-4 flex items-end gap-3 rounded-xl border border-green-500/30 bg-green-500/5 p-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-400">Key</label>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="config_key"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-green-500"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-400">Value</label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="value"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-green-500"
            />
          </div>
          <button
            onClick={addConfig}
            className="flex items-center gap-1.5 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
          <button
            onClick={() => setShowAdd(false)}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="rounded-xl border border-gray-800 bg-[#111111] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Key</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Value</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Updated</th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-gray-800/50">
                <td className="px-5 py-3 font-mono text-xs text-green-400">{row.key}</td>
                <td className="px-5 py-3">
                  {editingKey === row.key ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(row.key); if (e.key === "Escape") setEditingKey(null); }}
                        className="w-full rounded border border-gray-600 bg-gray-900 px-2 py-1 text-sm text-white outline-none focus:border-green-500"
                        autoFocus
                      />
                      <button onClick={() => saveEdit(row.key)} className="text-green-500 hover:text-green-400">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditingKey(null)} className="text-gray-500 hover:text-white">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <span
                      className="cursor-pointer text-white hover:text-green-400"
                      onClick={() => { setEditingKey(row.key); setEditValue(row.value); }}
                    >
                      {row.value}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(row.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => deleteConfig(row.key)}
                    className="text-gray-500 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                  No config entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Audit Log Tab ── */

function AuditTab() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const loadLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (actionFilter) params.set("action", actionFilter);

    fetchAdmin(`/api/admin/system/audit-log?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
        setActionTypes(data.actionTypes || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, actionFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-500">Loading audit log...</div>;
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-white outline-none focus:border-green-500"
          >
            <option value="">All Actions</option>
            {actionTypes.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Log detail viewer */}
      {selectedLog && (
        <div className="mb-4 rounded-xl border border-green-500/30 bg-[#111111] p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Audit Log Entry #{selectedLog.id}</h4>
            <button onClick={() => setSelectedLog(null)} className="text-gray-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-gray-500">Admin:</span>
              <div className="text-white">{selectedLog.adminUser || "—"}</div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Action:</span>
              <div className="text-green-400">{selectedLog.action}</div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Entity Type:</span>
              <div className="text-white">{selectedLog.entityType || "—"}</div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Entity ID:</span>
              <div className="text-white">{selectedLog.entityId || "—"}</div>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-gray-500">Time:</span>
              <div className="text-white">{new Date(selectedLog.createdAt).toLocaleString()}</div>
            </div>
            {selectedLog.details && (
              <div className="col-span-2">
                <span className="text-xs text-gray-500">Details:</span>
                <pre className="mt-1 rounded-lg bg-gray-900 p-3 text-xs text-gray-300 overflow-auto max-h-40">{selectedLog.details}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Log table */}
      <div className="rounded-xl border border-gray-800 bg-[#111111] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Time</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Admin</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Action</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Entity</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-b border-gray-800/50 cursor-pointer hover:bg-gray-800/30"
                onClick={() => setSelectedLog(log)}
              >
                <td className="px-5 py-3 text-gray-400 whitespace-nowrap text-xs">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-5 py-3 text-white">{log.adminUser || "—"}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-green-400">{log.action}</span>
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">
                  {log.entityType ? `${log.entityType}${log.entityId ? `:${log.entityId}` : ""}` : "—"}
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs max-w-xs truncate">{log.details || "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                  No audit log entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3">
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-gray-700 p-1.5 text-gray-400 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-700 p-1.5 text-gray-400 hover:text-white disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Email Templates Tab (placeholder) ── */

const EMAIL_TYPES = [
  { name: "Welcome Email", event: "on signup", configured: false },
  { name: "GHIN Verification Confirmation", event: "on GHIN verification", configured: false },
  { name: "Score Verification Result", event: "on score verification", configured: false },
  { name: "Password Reset", event: "on password reset request", configured: false },
];

function EmailTab() {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#111111] p-8">
      <div className="mx-auto max-w-lg text-center">
        <Mail className="mx-auto h-12 w-12 text-gray-600" />
        <h3 className="mt-4 text-lg font-semibold text-white">Email Templates</h3>
        <p className="mt-2 text-sm text-gray-400">
          Email templates are managed via Resend. Click below to access your Resend dashboard.
        </p>
        <a
          href="https://resend.com/emails"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
        >
          <ExternalLink className="h-4 w-4" />
          Open Resend Dashboard
        </a>
      </div>

      {/* Email types list */}
      <div className="mx-auto mt-8 max-w-lg">
        <h4 className="mb-3 text-sm font-medium text-gray-400">Platform Email Types</h4>
        <div className="space-y-2">
          {EMAIL_TYPES.map((email) => (
            <div key={email.name} className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3">
              <div>
                <span className="text-sm font-medium text-white">{email.name}</span>
                <span className="ml-2 text-xs text-gray-500">({email.event})</span>
              </div>
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                email.configured
                  ? "bg-green-500/10 text-green-400"
                  : "bg-gray-800 text-gray-500"
              }`}>
                {email.configured ? (
                  <><Check className="h-3 w-3" /> Configured</>
                ) : (
                  <><AlertCircle className="h-3 w-3" /> Not yet configured</>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
