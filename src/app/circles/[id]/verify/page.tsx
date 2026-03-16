"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  Upload,
  Users,
  Mail,
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
} from "lucide-react";

export default function VerifyPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const circleId = params.id as string;

  const [circle, setCircle] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [domainEmail, setDomainEmail] = useState("");

  useEffect(() => {
    if (!circleId) return;
    Promise.all([
      fetch(`/api/circles/${circleId}`).then((r) => r.json()),
      fetch(`/api/circles/${circleId}/verification`).then((r) => r.json()),
    ])
      .then(([circleData, verData]) => {
        setCircle(circleData);
        setVerification(verData.verification ?? null);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [circleId]);

  const handleUploadAndSubmit = async () => {
    if (!evidenceFile) return;
    setSubmitting(true);
    setError("");
    try {
      // Get presigned upload URL
      const ext = evidenceFile.name.split(".").pop();
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: `verification.${ext}`, contentType: evidenceFile.type }),
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url, publicUrl } = await uploadRes.json();

      await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": evidenceFile.type },
        body: evidenceFile,
      });

      const res = await fetch(`/api/circles/${circleId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "DOCUMENT", evidenceUrl: publicUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setVerification(data.verification);
      setSuccess("Verification submitted for review!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVouchingSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/circles/${circleId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "VOUCHING" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setVerification(data.verification);
      setSuccess("Vouch request submitted! Ask 2 verified members to vouch for you.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDomainSubmit = async () => {
    if (!domainEmail) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/circles/${circleId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "DOMAIN", domainEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setVerification(data.verification);
      setSuccess("Verification email sent! Check your club email inbox.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminManualSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/circles/${circleId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "ADMIN_MANUAL" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setVerification(data.verification);
      setSuccess("Request sent to circle admins for review.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  const method = circle?.verificationMethod;
  const statusIcon = {
    PENDING: <Clock className="h-6 w-6" style={{ color: "var(--cg-status-warning, #f59e0b)" }} />,
    APPROVED: <CheckCircle2 className="h-6 w-6" style={{ color: "#22c55e" }} />,
    REJECTED: <XCircle className="h-6 w-6" style={{ color: "var(--cg-status-error, #ef4444)" }} />,
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <button
        onClick={() => router.push(`/circles/${circleId}`)}
        className="flex items-center gap-1 text-sm mb-4"
        style={{ color: "var(--cg-text-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Circle
      </button>

      <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--cg-text-primary)" }}>
        Verify Your Membership
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--cg-text-muted)" }}>
        Verify that you&apos;re a member of {circle?.name ?? "this club"} to unlock full access.
      </p>

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

      {/* Status tracker if already submitted */}
      {verification && (
        <div
          className="rounded-xl p-6 mb-6"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <div className="flex items-center gap-3 mb-4">
            {statusIcon[verification.status as keyof typeof statusIcon]}
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                {verification.status === "PENDING" && "Verification Pending"}
                {verification.status === "APPROVED" && "You're Verified!"}
                {verification.status === "REJECTED" && "Verification Rejected"}
              </h3>
              <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                Submitted {new Date(verification.createdAt).toLocaleDateString()}
                {verification.method === "VOUCHING" &&
                  ` · ${verification.vouchedBy?.length ?? 0}/2 vouches`}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            {["Submitted", "Under Review", verification.status === "REJECTED" ? "Rejected" : "Approved"].map(
              (step, i) => {
                const current =
                  verification.status === "PENDING"
                    ? 1
                    : verification.status === "APPROVED"
                    ? 2
                    : verification.status === "REJECTED"
                    ? 2
                    : 0;
                const isActive = i <= current;
                const isError = i === 2 && verification.status === "REJECTED";
                return (
                  <div key={step} className="flex-1">
                    <div
                      className="h-1.5 rounded-full mb-1"
                      style={{
                        backgroundColor: isError
                          ? "var(--cg-status-error, #ef4444)"
                          : isActive
                          ? "var(--cg-accent)"
                          : "var(--cg-bg-tertiary)",
                      }}
                    />
                    <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                      {step}
                    </p>
                  </div>
                );
              }
            )}
          </div>

          {verification.reviewNotes && (
            <p className="mt-3 text-sm" style={{ color: "var(--cg-text-secondary)" }}>
              Note: {verification.reviewNotes}
            </p>
          )}
        </div>
      )}

      {/* Verification forms — only show if not yet submitted or rejected */}
      {(!verification || verification.status === "REJECTED") && (
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          {/* Document upload */}
          {(!method || method === "admin_approval") && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
                <h3 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                  Admin Verification
                </h3>
              </div>
              <p className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>
                Submit a request to the circle admins. They will review and approve your membership.
              </p>
              <button
                onClick={handleAdminManualSubmit}
                disabled={submitting}
                className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request Verification"}
              </button>
            </div>
          )}

          {method === "document" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
                <h3 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                  Upload Membership Proof
                </h3>
              </div>
              <p className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>
                Upload a photo of your membership card, welcome letter, or other proof.
              </p>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
                style={{ borderColor: "var(--cg-border)" }}
                onClick={() => document.getElementById("evidence-upload")?.click()}
              >
                <Upload className="mx-auto h-8 w-8 mb-2" style={{ color: "var(--cg-text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                  {evidenceFile ? evidenceFile.name : "Click to upload image or PDF"}
                </p>
                <input
                  id="evidence-upload"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <button
                onClick={handleUploadAndSubmit}
                disabled={submitting || !evidenceFile}
                className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for Review"}
              </button>
            </div>
          )}

          {method === "vouching" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
                <h3 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                  Member Vouching
                </h3>
              </div>
              <p className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>
                Ask 2 verified members of this circle to vouch for you. Once both vouch, you&apos;ll be
                automatically verified.
              </p>
              <button
                onClick={handleVouchingSubmit}
                disabled={submitting}
                className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request Vouches"}
              </button>
            </div>
          )}

          {method === "email_domain" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
                <h3 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                  Email Domain Verification
                </h3>
              </div>
              <p className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>
                Enter your club email address. We&apos;ll verify your membership through the club&apos;s email
                domain.
              </p>
              <input
                type="email"
                value={domainEmail}
                onChange={(e) => setDomainEmail(e.target.value)}
                placeholder={`you@${circle?.verificationDomain ?? "clubdomain.com"}`}
                className="w-full rounded-lg px-4 py-2 text-sm"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  color: "var(--cg-text-primary)",
                  border: "1px solid var(--cg-border)",
                }}
              />
              <button
                onClick={handleDomainSubmit}
                disabled={submitting || !domainEmail}
                className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Verification Email"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
