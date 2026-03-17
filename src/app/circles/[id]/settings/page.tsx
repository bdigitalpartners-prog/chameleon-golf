"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  Trash2,
  Globe,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
} from "lucide-react";

const PRIVACY_OPTIONS = [
  { key: "PUBLIC", label: "Public", desc: "Anyone can find and join", icon: Globe },
  { key: "PRIVATE", label: "Private", desc: "Invite only, visible in search", icon: Eye },
  { key: "SECRET", label: "Secret", desc: "Invite only, hidden from search", icon: EyeOff },
];

const VERIFICATION_METHODS = [
  { key: "NONE", label: "None" },
  { key: "ADMIN_APPROVAL", label: "Admin Approval" },
  { key: "CODE", label: "Invite Code" },
  { key: "EMAIL_DOMAIN", label: "Email Domain" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const circleId = params.id as string;

  const [circle, setCircle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const [verQueue, setVerQueue] = useState<any[]>([]);
  const [verQueueLoading, setVerQueueLoading] = useState(false);
  const [verActionLoading, setVerActionLoading] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    privacy: "",
    maxMembers: "",
    allowMemberInvites: true,
    verificationMethod: "NONE",
    verificationDomain: "",
  });

  useEffect(() => {
    fetch(`/api/circles/${circleId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setCircle(data);
        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          privacy: data.privacy ?? "PUBLIC",
          maxMembers: data.maxMembers ? String(data.maxMembers) : "",
          allowMemberInvites: data.config?.allowMemberInvites ?? true,
          verificationMethod: data.verificationMethod ?? "NONE",
          verificationDomain: data.verificationDomain ?? "",
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [circleId]);

  // Fetch verification queue for CLUB circles
  useEffect(() => {
    if (!circle || circle.type !== "CLUB") return;
    setVerQueueLoading(true);
    fetch(`/api/circles/${circleId}/verification/queue`)
      .then((r) => r.json())
      .then((data) => setVerQueue(data.verifications ?? []))
      .catch(console.error)
      .finally(() => setVerQueueLoading(false));
  }, [circle, circleId]);

  const handleVerAction = async (verificationId: string, action: "approve" | "reject", notes?: string) => {
    setVerActionLoading(verificationId);
    try {
      const res = await fetch(`/api/circles/${circleId}/verification/${verificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      if (res.ok) {
        // Refresh queue
        const qRes = await fetch(`/api/circles/${circleId}/verification/queue`);
        const qData = await qRes.json();
        setVerQueue(qData.verifications ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerActionLoading(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/circles/${circleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          privacy: form.privacy,
          maxMembers: form.maxMembers ? parseInt(form.maxMembers) : null,
          verificationMethod: circle.type === "CLUB" ? form.verificationMethod : undefined,
          verificationDomain:
            circle.type === "CLUB" && form.verificationMethod === "EMAIL_DOMAIN"
              ? form.verificationDomain
              : undefined,
          config: { allowMemberInvites: form.allowMemberInvites },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
      } else {
        setSuccess("Settings saved");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this circle? This cannot be undone.")) return;
    if (!confirm("This will remove all members and data. Type 'delete' to confirm... (clicking OK to proceed)")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/circles/${circleId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/circles");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/invite-code`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setInviteCode(data.code);
      } else {
        setError(data.error || "Failed to generate code");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}/circles/join/${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (!circle || (circle.userRole !== "OWNER" && circle.userRole !== "ADMIN")) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
          Access Denied
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--cg-text-muted)" }}>
          Only circle owners and admins can access settings.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <button
        onClick={() => router.push(`/circles/${circleId}`)}
        className="flex items-center gap-1 text-sm mb-4"
        style={{ color: "var(--cg-text-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Circle
      </button>

      <h1 className="font-display text-2xl font-bold mb-6" style={{ color: "var(--cg-text-primary)" }}>
        Circle Settings
      </h1>

      {error && (
        <div className="mb-4 rounded-lg p-3 text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--cg-status-error, #ef4444)" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg p-3 text-sm" style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic info */}
        <section
          className="rounded-xl p-6 space-y-4"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <h2 className="text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
            General
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg px-4 py-2 text-sm"
              style={{
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-primary)",
                border: "1px solid var(--cg-border)",
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg px-4 py-2 text-sm resize-none"
              style={{
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-primary)",
                border: "1px solid var(--cg-border)",
              }}
            />
          </div>
        </section>

        {/* Privacy */}
        <section
          className="rounded-xl p-6 space-y-3"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <h2 className="text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
            Privacy
          </h2>
          {PRIVACY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = form.privacy === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setForm({ ...form, privacy: opt.key })}
                className="w-full flex items-center gap-3 rounded-lg p-3 text-left transition-all"
                style={{
                  backgroundColor: selected ? "var(--cg-accent-bg)" : "transparent",
                  border: `1px solid ${selected ? "var(--cg-accent)" : "var(--cg-border)"}`,
                }}
              >
                <Icon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--cg-accent)" }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>{opt.label}</p>
                  <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </section>

        {/* Member settings */}
        <section
          className="rounded-xl p-6 space-y-4"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <h2 className="text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
            Members
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
              Max Members (blank for unlimited)
            </label>
            <input
              type="number"
              value={form.maxMembers}
              onChange={(e) => setForm({ ...form, maxMembers: e.target.value })}
              placeholder="Unlimited"
              className="w-full rounded-lg px-4 py-2 text-sm"
              style={{
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-primary)",
                border: "1px solid var(--cg-border)",
              }}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allowMemberInvites}
              onChange={(e) => setForm({ ...form, allowMemberInvites: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>
              Allow members to invite others
            </span>
          </label>

          {circle.type === "CLUB" && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
                Verification Method
              </label>
              <div className="space-y-2">
                {VERIFICATION_METHODS.map((vm) => (
                  <label key={vm.key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="verification"
                      checked={form.verificationMethod === vm.key}
                      onChange={() => setForm({ ...form, verificationMethod: vm.key })}
                      className="h-4 w-4"
                    />
                    <span className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>
                      {vm.label}
                    </span>
                  </label>
                ))}
              </div>
              {form.verificationMethod === "EMAIL_DOMAIN" && (
                <input
                  type="text"
                  value={form.verificationDomain}
                  onChange={(e) => setForm({ ...form, verificationDomain: e.target.value })}
                  placeholder="e.g., rodeodunes.com"
                  className="mt-2 w-full rounded-lg px-4 py-2 text-sm"
                  style={{
                    backgroundColor: "var(--cg-bg-tertiary)",
                    color: "var(--cg-text-primary)",
                    border: "1px solid var(--cg-border)",
                  }}
                />
              )}
            </div>
          )}
        </section>

        {/* Invite code */}
        <section
          className="rounded-xl p-6 space-y-4"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <h2 className="text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
            Invite Code
          </h2>
          <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
            Generate a shareable link that lets anyone join this circle.
          </p>
          {inviteCode ? (
            <div className="flex items-center gap-2">
              <code
                className="flex-1 rounded-lg px-4 py-2 text-sm font-mono"
                style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)" }}
              >
                {window.location.origin}/circles/join/{inviteCode}
              </code>
              <button
                onClick={copyInviteLink}
                className="rounded-lg p-2"
                style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-accent)" }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateCode}
              disabled={generatingCode}
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
            >
              {generatingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Invite Code"}
            </button>
          )}
        </section>

        {/* Verification queue (CLUB only) */}
        {circle.type === "CLUB" && (
          <section
            className="rounded-xl p-6 space-y-4"
            style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
          >
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
              <h2 className="text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                Verification Queue
              </h2>
            </div>
            {verQueueLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--cg-accent)" }} />
              </div>
            ) : verQueue.filter((v) => v.status === "PENDING").length === 0 ? (
              <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                No pending verifications.
              </p>
            ) : (
              <div className="space-y-3">
                {verQueue
                  .filter((v) => v.status === "PENDING")
                  .map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 rounded-lg p-3"
                      style={{ backgroundColor: "var(--cg-bg-tertiary)", border: "1px solid var(--cg-border)" }}
                    >
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{ backgroundColor: "var(--cg-bg-card)" }}
                      >
                        {v.user?.image ? (
                          <img src={v.user.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-medium" style={{ color: "var(--cg-text-muted)" }}>
                            {v.user?.name?.[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--cg-text-primary)" }}>
                          {v.user?.name ?? "Unknown"}
                        </p>
                        <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                          {v.method === "CODE" && "Invite code"}
                          {v.method === "NONE" && `Vouching (${v.vouchedBy?.length ?? 0}/2)`}
                          {v.method === "EMAIL_DOMAIN" && "Email domain"}
                          {v.method === "ADMIN_APPROVAL" && "Admin review"}
                          {" · "}
                          {new Date(v.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleVerAction(v.id, "approve")}
                          disabled={verActionLoading === v.id}
                          className="rounded-lg p-1.5"
                          style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                          title="Approve"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleVerAction(v.id, "reject")}
                          disabled={verActionLoading === v.id}
                          className="rounded-lg p-1.5"
                          style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--cg-status-error, #ef4444)" }}
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg py-2.5 text-sm font-medium transition-all disabled:opacity-50"
          style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save Settings"}
        </button>

        {/* Danger zone */}
        {circle.userRole === "OWNER" && (
          <section
            className="rounded-xl p-6 space-y-4"
            style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <h2 className="text-lg font-semibold" style={{ color: "var(--cg-status-error, #ef4444)" }}>
              Danger Zone
            </h2>
            <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
              Deleting this circle is permanent and cannot be undone. All members, invites, and data will be removed.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
              style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--cg-status-error, #ef4444)", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete Circle"}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
