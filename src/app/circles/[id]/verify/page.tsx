"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Shield,
  CheckCircle,
  Clock,
  Upload,
  Mail,
  Users,
  ArrowLeft,
  Loader2,
} from "lucide-react";

type VerificationMethod =
  | "NONE"
  | "ADMIN_APPROVAL"
  | "CODE"
  | "EMAIL_DOMAIN"
  | null;

interface Circle {
  id: string;
  name: string;
  verificationMethod: VerificationMethod;
}

interface Verification {
  id: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  method: VerificationMethod;
  evidenceUrl?: string;
  domainEmail?: string;
  vouchedBy?: { id: string; name: string }[];
  createdAt: string;
}

const STATUS_STEPS = ["PENDING", "UNDER_REVIEW", "APPROVED"] as const;

export default function VerifyPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const circleId = params.id as string;

  const [circle, setCircle] = useState<Circle | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [domainEmail, setDomainEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [circleRes, verificationRes] = await Promise.all([
        fetch(`/api/circles/${circleId}`),
        fetch(`/api/circles/${circleId}/verification`),
      ]);

      if (circleRes.ok) {
        const circleData = await circleRes.json();
        setCircle(circleData);
      }

      if (verificationRes.ok) {
        const verificationData = await verificationRes.json();
        setVerification(verificationData);
      }
    } catch {
      setError("Failed to load verification data");
    } finally {
      setLoading(false);
    }
  }, [circleId]);

  useEffect(() => {
    if (session && circleId) {
      fetchData();
    }
  }, [session, circleId, fetchData]);

  const handleSubmit = async () => {
    if (!circle?.verificationMethod) return;

    try {
      setSubmitting(true);
      setError(null);

      const body: Record<string, string> = {
        method: circle.verificationMethod,
      };

      if (circle.verificationMethod === "CODE") {
        if (!evidenceUrl.trim()) {
          setError("Please provide an evidence URL");
          setSubmitting(false);
          return;
        }
        body.evidenceUrl = evidenceUrl.trim();
      }

      if (circle.verificationMethod === "EMAIL_DOMAIN") {
        if (!domainEmail.trim()) {
          setError("Please provide your club email address");
          setSubmitting(false);
          return;
        }
        body.domainEmail = domainEmail.trim();
      }

      const res = await fetch(`/api/circles/${circleId}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Submission failed");
      }

      const data = await res.json();
      setVerification(data);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <Loader2
          size={32}
          style={{ color: "var(--cg-accent)", animation: "spin 1s linear infinite" }}
        />
      </div>
    );
  }

  if (!circle) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--cg-text-secondary)" }}>Circle not found.</p>
      </div>
    );
  }

  const currentStepIndex = verification
    ? STATUS_STEPS.indexOf(
        verification.status as (typeof STATUS_STEPS)[number]
      )
    : -1;

  const isApproved = verification?.status === "APPROVED";
  const isRejected = verification?.status === "REJECTED";
  const isPending =
    verification?.status === "PENDING" ||
    verification?.status === "UNDER_REVIEW";
  const noMethodRequired = !circle.verificationMethod;

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "1.5rem 1rem",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <button
          onClick={() => router.push(`/circles/${circleId}`)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "none",
            border: "none",
            color: "var(--cg-accent)",
            cursor: "pointer",
            padding: 0,
            fontSize: "0.875rem",
            marginBottom: "1rem",
          }}
        >
          <ArrowLeft size={16} />
          Back to {circle.name}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "var(--cg-accent-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={20} style={{ color: "var(--cg-accent)" }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--cg-text-primary)",
                margin: 0,
              }}
            >
              Verification
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--cg-text-secondary)",
                margin: 0,
              }}
            >
              {circle.name}
            </p>
          </div>
        </div>
      </div>

      {/* No verification required */}
      {noMethodRequired && (
        <div
          style={{
            background: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
            borderRadius: 12,
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <CheckCircle
            size={48}
            style={{ color: "#22c55e", marginBottom: "1rem" }}
          />
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "var(--cg-text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            No Verification Required
          </h2>
          <p style={{ color: "var(--cg-text-secondary)", fontSize: "0.875rem" }}>
            This club doesn&apos;t require verification.
          </p>
        </div>
      )}

      {/* Already approved */}
      {isApproved && (
        <div
          style={{
            background: "var(--cg-bg-card)",
            border: "1px solid #22c55e",
            borderRadius: 12,
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <CheckCircle
            size={48}
            style={{ color: "#22c55e", marginBottom: "1rem" }}
          />
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "var(--cg-text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            Verified Member
          </h2>
          <p style={{ color: "var(--cg-text-secondary)", fontSize: "0.875rem" }}>
            Your membership at {circle.name} has been verified. You have full
            access to all circle features.
          </p>
        </div>
      )}

      {/* Rejected */}
      {isRejected && (
        <div
          style={{
            background: "var(--cg-bg-card)",
            border: "1px solid #ef4444",
            borderRadius: 12,
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <Shield
            size={48}
            style={{ color: "#ef4444", marginBottom: "1rem" }}
          />
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "var(--cg-text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            Verification Rejected
          </h2>
          <p
            style={{
              color: "var(--cg-text-secondary)",
              fontSize: "0.875rem",
              marginBottom: "1rem",
            }}
          >
            Your verification request was not approved. You can submit a new
            request below.
          </p>
          <button
            onClick={() => {
              setVerification(null);
              setSubmitted(false);
              setError(null);
            }}
            style={{
              background: "var(--cg-accent)",
              color: "var(--cg-text-inverse)",
              border: "none",
              borderRadius: 8,
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Pending / Under Review - Status Tracker */}
      {isPending && (
        <div
          style={{
            background: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
            borderRadius: 12,
            padding: "1.5rem",
            marginBottom: "1rem",
          }}
        >
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--cg-text-primary)",
              marginBottom: "1.5rem",
            }}
          >
            Verification Status
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              marginBottom: "1rem",
            }}
          >
            {/* Progress line */}
            <div
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                right: 16,
                height: 2,
                background: "var(--cg-border)",
                zIndex: 0,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                width:
                  currentStepIndex >= 1
                    ? currentStepIndex >= 2
                      ? "calc(100% - 32px)"
                      : "50%"
                    : "0%",
                height: 2,
                background: "var(--cg-accent)",
                zIndex: 1,
                transition: "width 0.3s ease",
              }}
            />

            {STATUS_STEPS.map((step, index) => {
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div
                  key={step}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: isActive
                        ? "var(--cg-accent)"
                        : "var(--cg-bg-tertiary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: isCurrent
                        ? "2px solid var(--cg-accent)"
                        : "2px solid transparent",
                      boxShadow: isCurrent
                        ? "0 0 0 4px var(--cg-accent-bg)"
                        : "none",
                    }}
                  >
                    {isActive ? (
                      <CheckCircle
                        size={16}
                        style={{ color: "var(--cg-text-inverse)" }}
                      />
                    ) : (
                      <Clock
                        size={16}
                        style={{ color: "var(--cg-text-muted)" }}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: isActive
                        ? "var(--cg-accent)"
                        : "var(--cg-text-muted)",
                      fontWeight: isCurrent ? 600 : 400,
                      marginTop: "0.5rem",
                      textAlign: "center",
                    }}
                  >
                    {step === "PENDING"
                      ? "Pending"
                      : step === "UNDER_REVIEW"
                        ? "Under Review"
                        : "Approved"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Vouching progress */}
          {verification?.method === "NONE" && verification.vouchedBy && (
            <div
              style={{
                marginTop: "1.5rem",
                padding: "1rem",
                background: "var(--cg-bg-tertiary)",
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                }}
              >
                <Users size={16} style={{ color: "var(--cg-accent)" }} />
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--cg-text-primary)",
                  }}
                >
                  Vouch Progress: {verification.vouchedBy.length} / 2
                </span>
              </div>
              {verification.vouchedBy.length > 0 ? (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {verification.vouchedBy.map((user) => (
                    <li
                      key={user.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.875rem",
                        color: "var(--cg-text-secondary)",
                      }}
                    >
                      <CheckCircle size={14} style={{ color: "#22c55e" }} />
                      {user.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  style={{
                    fontSize: "0.813rem",
                    color: "var(--cg-text-muted)",
                    margin: 0,
                  }}
                >
                  No vouches yet. Ask existing verified members to vouch for you.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Submission form — show when no verification exists and method is required */}
      {!verification && !noMethodRequired && !submitted && (
        <div
          style={{
            background: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
            borderRadius: 12,
            padding: "1.5rem",
          }}
        >
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--cg-text-primary)",
              marginBottom: "0.25rem",
            }}
          >
            Verify Your Membership
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--cg-text-secondary)",
              marginBottom: "1.5rem",
            }}
          >
            Complete verification to unlock all features of this circle.
          </p>

          {/* DOCUMENT method */}
          {circle.verificationMethod === "CODE" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <Upload size={18} style={{ color: "var(--cg-accent)" }} />
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--cg-text-primary)",
                  }}
                >
                  Document Verification
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.813rem",
                  color: "var(--cg-text-muted)",
                  marginBottom: "0.75rem",
                }}
              >
                Provide a URL to your membership document or proof of membership.
              </p>
              <input
                type="text"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://example.com/membership-proof.pdf"
                style={{
                  width: "100%",
                  padding: "0.625rem 0.75rem",
                  fontSize: "0.875rem",
                  borderRadius: 8,
                  border: "1px solid var(--cg-border)",
                  background: "var(--cg-bg-tertiary)",
                  color: "var(--cg-text-primary)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* VOUCHING method */}
          {circle.verificationMethod === "NONE" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <Users size={18} style={{ color: "var(--cg-accent)" }} />
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--cg-text-primary)",
                  }}
                >
                  Member Vouching
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.813rem",
                  color: "var(--cg-text-muted)",
                  marginBottom: "0.75rem",
                }}
              >
                Request vouches from 2 existing verified members to confirm your
                membership.
              </p>
            </div>
          )}

          {/* DOMAIN method */}
          {circle.verificationMethod === "EMAIL_DOMAIN" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <Mail size={18} style={{ color: "var(--cg-accent)" }} />
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--cg-text-primary)",
                  }}
                >
                  Email Domain Verification
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.813rem",
                  color: "var(--cg-text-muted)",
                  marginBottom: "0.75rem",
                }}
              >
                Enter your club email address to verify your membership.
              </p>
              <input
                type="email"
                value={domainEmail}
                onChange={(e) => setDomainEmail(e.target.value)}
                placeholder="yourname@club-domain.com"
                style={{
                  width: "100%",
                  padding: "0.625rem 0.75rem",
                  fontSize: "0.875rem",
                  borderRadius: 8,
                  border: "1px solid var(--cg-border)",
                  background: "var(--cg-bg-tertiary)",
                  color: "var(--cg-text-primary)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* ADMIN_MANUAL method */}
          {circle.verificationMethod === "ADMIN_APPROVAL" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <Shield size={18} style={{ color: "var(--cg-accent)" }} />
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--cg-text-primary)",
                  }}
                >
                  Admin Verification
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.813rem",
                  color: "var(--cg-text-muted)",
                  marginBottom: "0.75rem",
                }}
              >
                Submit a request for an admin to manually verify your membership.
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p
              style={{
                color: "#ef4444",
                fontSize: "0.813rem",
                marginTop: "0.75rem",
                marginBottom: 0,
              }}
            >
              {error}
            </p>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: "100%",
              marginTop: "1.25rem",
              padding: "0.75rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              borderRadius: 8,
              border: "none",
              background: "var(--cg-accent)",
              color: "var(--cg-text-inverse)",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            {submitting ? (
              <>
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Submitting...
              </>
            ) : circle.verificationMethod === "NONE" ? (
              <>
                <Users size={16} />
                Request Vouches
              </>
            ) : circle.verificationMethod === "ADMIN_APPROVAL" ? (
              <>
                <Shield size={16} />
                Request Verification
              </>
            ) : circle.verificationMethod === "CODE" ? (
              <>
                <Upload size={16} />
                Submit Evidence
              </>
            ) : (
              <>
                <Mail size={16} />
                Submit for Verification
              </>
            )}
          </button>
        </div>
      )}

      {/* Post-submit confirmation for ADMIN_MANUAL */}
      {submitted && circle.verificationMethod === "ADMIN_APPROVAL" && (
        <div
          style={{
            background: "var(--cg-bg-card)",
            border: "1px solid var(--cg-border)",
            borderRadius: 12,
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <Clock
            size={48}
            style={{ color: "var(--cg-accent)", marginBottom: "1rem" }}
          />
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "var(--cg-text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            Request Sent
          </h2>
          <p style={{ color: "var(--cg-text-secondary)", fontSize: "0.875rem" }}>
            Request sent &mdash; pending admin review. You&apos;ll be notified
            once your verification has been processed.
          </p>
        </div>
      )}

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
