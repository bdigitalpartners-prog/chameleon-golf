"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Shield,
  CheckCircle,
  X,
  Loader2,
  FileText,
  Mail,
  Users,
} from "lucide-react";

interface VouchUser {
  id: string;
  name: string;
}

interface Verification {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    image?: string | null;
  };
  method: "NONE" | "ADMIN_APPROVAL" | "CODE" | "EMAIL_DOMAIN";
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  evidenceUrl?: string | null;
  domainEmail?: string | null;
  vouchedBy?: VouchUser[];
  createdAt: string;
}

interface QueueData {
  verifications: Verification[];
  verifiedCount: number;
}

interface VerificationQueueProps {
  circleId: string;
}

const METHOD_LABELS: Record<string, string> = {
  NONE: "None",
  ADMIN_APPROVAL: "Admin Review",
  CODE: "Invite Code",
  EMAIL_DOMAIN: "Domain Email",
};

export default function VerificationQueue({ circleId }: VerificationQueueProps) {
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/circles/${circleId}/verification/queue`
      );
      if (!res.ok) throw new Error("Failed to fetch verification queue");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load verification queue");
    } finally {
      setLoading(false);
    }
  }, [circleId]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleAction = async (
    verificationId: string,
    action: "approve" | "reject"
  ) => {
    try {
      setActionLoading(verificationId);
      setError(null);

      const res = await fetch(
        `/api/circles/${circleId}/verification/${verificationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || `Failed to ${action} verification`);
      }

      // Refresh the queue after action
      await fetchQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "3rem 1rem",
        }}
      >
        <Loader2
          size={28}
          style={{
            color: "var(--cg-accent)",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: "1.5rem", textAlign: "center" }}>
        <p style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</p>
      </div>
    );
  }

  const verifications = data?.verifications ?? [];
  const verifiedCount = data?.verifiedCount ?? 0;

  return (
    <div>
      {/* Header with verified count */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Shield size={18} style={{ color: "var(--cg-accent)" }} />
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--cg-text-primary)",
              margin: 0,
            }}
          >
            Verification Queue
          </h3>
          {verifications.length > 0 && (
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                background: "var(--cg-accent)",
                color: "var(--cg-text-inverse)",
                borderRadius: 9999,
                padding: "0.125rem 0.5rem",
                minWidth: 20,
                textAlign: "center",
              }}
            >
              {verifications.length}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: "0.813rem",
            color: "var(--cg-text-muted)",
          }}
        >
          {verifiedCount} verified member{verifiedCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "0.75rem",
            marginBottom: "1rem",
            fontSize: "0.813rem",
            color: "#ef4444",
          }}
        >
          {error}
        </div>
      )}

      {/* Empty state */}
      {verifications.length === 0 && (
        <div
          style={{
            background: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
            borderRadius: 12,
            padding: "2.5rem 1.5rem",
            textAlign: "center",
          }}
        >
          <Shield
            size={36}
            style={{ color: "var(--cg-text-muted)", marginBottom: "0.75rem" }}
          />
          <p
            style={{
              color: "var(--cg-text-muted)",
              fontSize: "0.875rem",
              margin: 0,
            }}
          >
            No pending verifications
          </p>
        </div>
      )}

      {/* Verification list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {verifications.map((v) => (
          <div
            key={v.id}
            style={{
              background: "var(--cg-bg-card)",
              border: "1px solid var(--cg-border)",
              borderRadius: 12,
              padding: "1rem",
            }}
          >
            {/* User info row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              {/* Avatar */}
              {v.user.image ? (
                <img
                  src={v.user.image}
                  alt={v.user.name}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--cg-bg-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--cg-text-secondary)",
                  }}
                >
                  {v.user.name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--cg-text-primary)",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {v.user.name}
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--cg-text-muted)",
                    margin: 0,
                  }}
                >
                  Requested {formatDate(v.createdAt)}
                </p>
              </div>
            </div>

            {/* Method badge and details */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {v.method === "CODE" && (
                  <FileText size={14} style={{ color: "var(--cg-text-secondary)" }} />
                )}
                {v.method === "EMAIL_DOMAIN" && (
                  <Mail size={14} style={{ color: "var(--cg-text-secondary)" }} />
                )}
                {v.method === "NONE" && (
                  <Users size={14} style={{ color: "var(--cg-text-secondary)" }} />
                )}
                {v.method === "ADMIN_APPROVAL" && (
                  <Shield size={14} style={{ color: "var(--cg-text-secondary)" }} />
                )}
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: "var(--cg-text-secondary)",
                    background: "var(--cg-bg-tertiary)",
                    borderRadius: 6,
                    padding: "0.125rem 0.5rem",
                  }}
                >
                  {METHOD_LABELS[v.method] ?? v.method}
                </span>
              </div>

              {/* Evidence link for CODE */}
              {v.method === "CODE" && v.evidenceUrl && (
                <a
                  href={v.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "0.813rem",
                    color: "var(--cg-accent)",
                    textDecoration: "underline",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "block",
                  }}
                >
                  View evidence document
                </a>
              )}

              {/* Domain email for EMAIL_DOMAIN */}
              {v.method === "EMAIL_DOMAIN" && v.domainEmail && (
                <p
                  style={{
                    fontSize: "0.813rem",
                    color: "var(--cg-text-secondary)",
                    margin: 0,
                  }}
                >
                  Email: {v.domainEmail}
                </p>
              )}

              {/* Vouch count for NONE */}
              {v.method === "NONE" && v.vouchedBy && (
                <p
                  style={{
                    fontSize: "0.813rem",
                    color: "var(--cg-text-secondary)",
                    margin: 0,
                  }}
                >
                  Vouches: {v.vouchedBy.length} / 2
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => handleAction(v.id, "approve")}
                disabled={actionLoading === v.id}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.375rem",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.813rem",
                  fontWeight: 600,
                  borderRadius: 8,
                  border: "none",
                  background: "#22c55e",
                  color: "#fff",
                  cursor: actionLoading === v.id ? "not-allowed" : "pointer",
                  opacity: actionLoading === v.id ? 0.7 : 1,
                }}
              >
                {actionLoading === v.id ? (
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <CheckCircle size={14} />
                )}
                Approve
              </button>
              <button
                onClick={() => handleAction(v.id, "reject")}
                disabled={actionLoading === v.id}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.375rem",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.813rem",
                  fontWeight: 600,
                  borderRadius: 8,
                  border: "1px solid var(--cg-border)",
                  background: "var(--cg-bg-card)",
                  color: "#ef4444",
                  cursor: actionLoading === v.id ? "not-allowed" : "pointer",
                  opacity: actionLoading === v.id ? 0.7 : 1,
                }}
              >
                {actionLoading === v.id ? (
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <X size={14} />
                )}
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
