"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
  Crown,
  Users,
  Ticket,
  Shield,
  Copy,
  Check,
  Plus,
} from "lucide-react";

/* ── Types ── */

interface FounderMember {
  id: string;
  memberNumber: number;
  joinedAt: string;
  tier: string;
  status: string;
  vaultAccess: boolean;
  badgeAwarded: boolean;
  user: { id: string; name: string | null; email: string | null; image: string | null };
}

interface FoundersStats {
  totalMembers: number;
  maxCapacity: number;
  spotsRemaining: number;
  nextMemberNumber: number;
  invitesGenerated: number;
  invitesUsed: number;
  invitesByPhase: Array<{ phase: string; count: number }>;
}

interface Invite {
  id: string;
  code: string;
  phase: string;
  usedAt: string | null;
  createdAt: string;
  creator: { id: string; name: string | null; email: string | null };
  usedByUser: { id: string; name: string | null; email: string | null } | null;
}

/* ── Helpers ── */

const ADMIN_KEY = () => typeof window !== "undefined" ? sessionStorage.getItem("golfEQ_admin_key") || "" : "";

function fetchAdmin(url: string) {
  return fetch(url, {
    headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY() },
  });
}

const PHASE_LABELS: Record<string, string> = {
  GROUND_ZERO: "Ground Zero",
  CHARTER_CLASS: "Charter Class",
  LAST_CALL: "Last Call",
};

const PHASE_COLORS: Record<string, string> = {
  GROUND_ZERO: "bg-purple-500/10 text-purple-500",
  CHARTER_CLASS: "bg-blue-500/10 text-blue-500",
  LAST_CALL: "bg-orange-500/10 text-orange-500",
};

/* ── Page Component ── */

export default function FoundersPage() {
  const [members, setMembers] = useState<FounderMember[]>([]);
  const [stats, setStats] = useState<FoundersStats | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"members" | "invites" | "generate">("members");
  const [generatePhase, setGeneratePhase] = useState("GROUND_ZERO");
  const [generateCount, setGenerateCount] = useState(5);
  const [generating, setGenerating] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchAdmin("/api/admin/founders").then((r) => r.json()),
      fetchAdmin("/api/admin/founders/invites").then((r) => r.json()),
    ])
      .then(([foundersData, invitesData]) => {
        setMembers(foundersData.members || []);
        setStats(foundersData.stats || null);
        setInvites(invitesData.invites || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleGenerateInvites = async () => {
    setGenerating(true);
    try {
      await fetch("/api/admin/founders/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY() },
        body: JSON.stringify({
          createdBy: "admin",
          phase: generatePhase,
          count: generateCount,
        }),
      });
      loadData();
    } catch (err) {
      console.error("Failed to generate invites:", err);
    } finally {
      setGenerating(false);
    }
  };

  const tabs = [
    { key: "members" as const, label: "Members" },
    { key: "invites" as const, label: "Invite Codes" },
    { key: "generate" as const, label: "Generate Invites" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-500">Loading founders program data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">The Founders&apos; Flight</h1>
        <p className="mt-1 text-sm text-gray-400">Exclusive 200-member founding program management</p>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Crown className="h-5 w-5" />} label="Founders" value={`${stats.totalMembers} / ${stats.maxCapacity}`} />
          <StatCard icon={<Users className="h-5 w-5" />} label="Spots Remaining" value={stats.spotsRemaining.toString()} />
          <StatCard icon={<Ticket className="h-5 w-5" />} label="Invites Generated" value={stats.invitesGenerated.toString()} />
          <StatCard icon={<Shield className="h-5 w-5" />} label="Invites Redeemed" value={stats.invitesUsed.toString()} />
        </div>
      )}

      {/* Phase breakdown */}
      {stats && stats.invitesByPhase.length > 0 && (
        <div className="mb-6 flex gap-3">
          {stats.invitesByPhase.map((p) => (
            <div key={p.phase} className="rounded-lg border border-gray-800 bg-[#111111] px-4 py-2">
              <span className={`rounded-full px-2 py-0.5 text-xs ${PHASE_COLORS[p.phase] || "bg-gray-500/10 text-gray-500"}`}>
                {PHASE_LABELS[p.phase] || p.phase}
              </span>
              <span className="ml-2 text-sm font-bold text-white">{p.count} invites</span>
            </div>
          ))}
        </div>
      )}

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

      {/* ── Members Tab ── */}
      {activeTab === "members" && (
        <div className="rounded-xl border border-gray-800 bg-[#111111] overflow-hidden">
          <div className="border-b border-gray-800 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-400">Founders&apos; Flight Members</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">#</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Member</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Joined</th>
                <th className="px-5 py-3 text-center text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-5 py-3 text-center text-xs font-medium uppercase text-gray-500">Vault</th>
                <th className="px-5 py-3 text-center text-xs font-medium uppercase text-gray-500">Badge</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-gray-800/50">
                  <td className="px-5 py-3 font-mono text-green-500">#{m.memberNumber}</td>
                  <td className="px-5 py-3 font-medium text-white">{m.user.name || "—"}</td>
                  <td className="px-5 py-3 text-gray-400">{m.user.email || "—"}</td>
                  <td className="px-5 py-3 text-gray-400 whitespace-nowrap">{new Date(m.joinedAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${m.status === "ACTIVE" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">{m.vaultAccess ? <Check className="mx-auto h-4 w-4 text-green-500" /> : "—"}</td>
                  <td className="px-5 py-3 text-center">{m.badgeAwarded ? <Check className="mx-auto h-4 w-4 text-green-500" /> : "—"}</td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">No founders yet. Generate invite codes to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Invites Tab ── */}
      {activeTab === "invites" && (
        <div className="rounded-xl border border-gray-800 bg-[#111111] overflow-hidden">
          <div className="border-b border-gray-800 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-400">Invite Codes</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Phase</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Created By</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Used By</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
                <th className="px-5 py-3 text-center text-xs font-medium uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-800/50">
                  <td className="px-5 py-3">
                    <CopyableCode code={inv.code} />
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${PHASE_COLORS[inv.phase] || "bg-gray-500/10 text-gray-500"}`}>
                      {PHASE_LABELS[inv.phase] || inv.phase}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{inv.creator?.name || inv.creator?.email || "Admin"}</td>
                  <td className="px-5 py-3 text-gray-400">{inv.usedByUser?.name || inv.usedByUser?.email || "—"}</td>
                  <td className="px-5 py-3 text-gray-400 whitespace-nowrap">{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${inv.usedAt ? "bg-gray-500/10 text-gray-500" : "bg-green-500/10 text-green-500"}`}>
                      {inv.usedAt ? "Used" : "Available"}
                    </span>
                  </td>
                </tr>
              ))}
              {invites.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500">No invite codes generated yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Generate Invites Tab ── */}
      {activeTab === "generate" && (
        <div className="rounded-xl border border-gray-800 bg-[#111111] p-6 max-w-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Generate Invite Codes</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Phase</label>
              <select
                value={generatePhase}
                onChange={(e) => setGeneratePhase(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
              >
                <option value="GROUND_ZERO">Ground Zero (First 50)</option>
                <option value="CHARTER_CLASS">Charter Class (51-150)</option>
                <option value="LAST_CALL">Last Call (151-200)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Number of Codes</label>
              <input
                type="number"
                value={generateCount}
                onChange={(e) => setGenerateCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                min={1}
                max={50}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">Max 50 codes per batch</p>
            </div>

            <button
              onClick={handleGenerateInvites}
              disabled={generating}
              className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {generating ? "Generating..." : `Generate ${generateCount} Code${generateCount > 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="flex items-center gap-2 group">
      <span className="font-mono text-white">{code}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-gray-600 group-hover:text-gray-400" />
      )}
    </button>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#111111] p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="text-green-500">{icon}</div>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <div className="text-lg font-bold text-white truncate">{value}</div>
    </div>
  );
}
