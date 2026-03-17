"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  Trophy,
  Globe,
  Shield,
  Medal,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Search,
  X,
} from "lucide-react";

const CIRCLE_TYPES = [
  { key: "CREW", label: "Crew", desc: "Your regular playing group", icon: Users, defaultMax: 12 },
  { key: "GAME", label: "Game", desc: "Competition or match", icon: Trophy, defaultMax: null },
  { key: "NETWORK", label: "Network", desc: "Social sharing group", icon: Globe, defaultMax: null },
  { key: "CLUB", label: "Club", desc: "Private club members", icon: Shield, defaultMax: null },
  { key: "LEAGUE", label: "League", desc: "Organized league play", icon: Medal, defaultMax: null },
];

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

export default function CreateCirclePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    type: "",
    name: "",
    description: "",
    privacy: "",
    maxMembers: "",
    allowMemberInvites: true,
    verificationMethod: "NONE",
    verificationDomain: "",
  });

  // Invite state
  const [inviteSearch, setInviteSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");

  if (status === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
          Sign in to create a circle
        </h1>
      </div>
    );
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          privacy: form.privacy || undefined,
          description: form.description || undefined,
          maxMembers: form.maxMembers ? parseInt(form.maxMembers) : undefined,
          verificationMethod: form.type === "CLUB" ? form.verificationMethod : undefined,
          verificationDomain: form.type === "CLUB" && form.verificationMethod === "EMAIL_DOMAIN" ? form.verificationDomain : undefined,
          config: { allowMemberInvites: form.allowMemberInvites },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create circle");
        setSubmitting(false);
        return;
      }

      const circle = await res.json();

      // Send invites if any
      if (selectedUsers.length > 0 || inviteEmails.length > 0) {
        await fetch(`/api/circles/${circle.id}/invite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userIds: selectedUsers.map((u) => u.id),
            emails: inviteEmails,
          }),
        });
      }

      router.push(`/circles/${circle.id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setSubmitting(false);
    }
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (email && email.includes("@") && !inviteEmails.includes(email)) {
      setInviteEmails([...inviteEmails, email]);
      setEmailInput("");
    }
  };

  const steps = ["Type", "Details", "Privacy", "Settings", "Invite"];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm mb-4"
        style={{ color: "var(--cg-text-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--cg-text-primary)" }}>
        Create a Circle
      </h1>

      {/* Progress */}
      <div className="flex gap-1 mb-6">
        {steps.map((s, i) => (
          <div
            key={s}
            className="h-1 flex-1 rounded-full"
            style={{ backgroundColor: i <= step ? "var(--cg-accent)" : "var(--cg-bg-tertiary)" }}
          />
        ))}
      </div>

      {/* Step 1: Type */}
      {step === 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
            What kind of circle?
          </h2>
          {CIRCLE_TYPES.map((ct) => {
            const Icon = ct.icon;
            const selected = form.type === ct.key;
            return (
              <button
                key={ct.key}
                onClick={() => {
                  setForm({ ...form, type: ct.key });
                  setStep(1);
                }}
                className="w-full flex items-center gap-4 rounded-xl p-4 text-left transition-all"
                style={{
                  backgroundColor: selected ? "var(--cg-accent-bg)" : "var(--cg-bg-card)",
                  border: `2px solid ${selected ? "var(--cg-accent)" : "var(--cg-border)"}`,
                }}
              >
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                >
                  <Icon className="h-6 w-6" style={{ color: "var(--cg-accent)" }} />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                    {ct.label}
                  </p>
                  <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                    {ct.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 2: Details */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
            Circle Details
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Saturday Morning Crew"
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
              placeholder="What is this circle about?"
              rows={3}
              className="w-full rounded-lg px-4 py-2 text-sm resize-none"
              style={{
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-primary)",
                border: "1px solid var(--cg-border)",
              }}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)" }}
            >
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!form.name.trim()}
              className="flex-1 rounded-lg py-2 text-sm font-medium transition-all disabled:opacity-50"
              style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Privacy */}
      {step === 2 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
            Privacy Setting
          </h2>
          {PRIVACY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = form.privacy === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => {
                  setForm({ ...form, privacy: opt.key });
                  setStep(3);
                }}
                className="w-full flex items-center gap-4 rounded-xl p-4 text-left transition-all"
                style={{
                  backgroundColor: selected ? "var(--cg-accent-bg)" : "var(--cg-bg-card)",
                  border: `2px solid ${selected ? "var(--cg-accent)" : "var(--cg-border)"}`,
                }}
              >
                <Icon className="h-5 w-5 flex-shrink-0" style={{ color: "var(--cg-accent)" }} />
                <div>
                  <p className="font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                    {opt.label}
                  </p>
                  <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
          <button
            onClick={() => setStep(1)}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)" }}
          >
            Back
          </button>
        </div>
      )}

      {/* Step 4: Settings */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
            Settings
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
              Max Members (leave blank for unlimited)
            </label>
            <input
              type="number"
              value={form.maxMembers}
              onChange={(e) => setForm({ ...form, maxMembers: e.target.value })}
              placeholder="e.g., 12"
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
          {form.type === "CLUB" && (
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
          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)" }}
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 rounded-lg py-2 text-sm font-medium"
              style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Invite */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
            Invite Members (optional)
          </h2>

          {/* Email invites */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
              Invite by email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
                placeholder="email@example.com"
                className="flex-1 rounded-lg px-4 py-2 text-sm"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  color: "var(--cg-text-primary)",
                  border: "1px solid var(--cg-border)",
                }}
              />
              <button
                onClick={addEmail}
                className="rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)" }}
              >
                Add
              </button>
            </div>
            {inviteEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {inviteEmails.map((email) => (
                  <span
                    key={email}
                    className="flex items-center gap-1 rounded-full px-3 py-1 text-xs"
                    style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
                  >
                    {email}
                    <button onClick={() => setInviteEmails(inviteEmails.filter((e) => e !== email))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--cg-status-error)" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(3)}
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)" }}
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-lg py-2 text-sm font-medium transition-all disabled:opacity-50"
              style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                "Create Circle"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
