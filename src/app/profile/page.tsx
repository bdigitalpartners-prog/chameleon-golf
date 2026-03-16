"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  User, Shield, CheckCircle2, Clock, XCircle, Upload,
  Star, Trophy, Loader2, AlertTriangle, Calendar,
} from "lucide-react";

/* ─── Theme styles ─── */
const card: React.CSSProperties = {
  backgroundColor: "var(--cg-bg-card)",
  border: "1px solid var(--cg-border)",
  borderRadius: "0.75rem",
  padding: "1.5rem",
};
const muted: React.CSSProperties = { color: "var(--cg-text-muted)" };
const secondary: React.CSSProperties = { color: "var(--cg-text-secondary)" };
const primary: React.CSSProperties = { color: "var(--cg-text-primary)" };

export default function ProfilePage() {
  const { data: session, status: sessionStatus } = useSession();

  const [ghinData, setGhinData] = useState<any>(null);
  const [ghinNumber, setGhinNumber] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loadingGhin, setLoadingGhin] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user as any;

  /* ── Fetch GHIN status ── */
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    setLoadingGhin(true);
    fetch("/api/ghin/submit")
      .then((r) => r.json())
      .then((data) => {
        setGhinData(data);
        if (data.ghinNumber) setGhinNumber(data.ghinNumber);
      })
      .catch(() => {})
      .finally(() => setLoadingGhin(false));
  }, [sessionStatus]);

  /* ── File to base64 ── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("File must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result as string);
      setSubmitError(null);
    };
    reader.readAsDataURL(file);
  };

  /* ── Submit GHIN ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghinNumber.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const res = await fetch("/api/ghin/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ghinNumber: ghinNumber.trim(),
          screenshotUrl: screenshotPreview || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Submission failed");
      } else {
        setSubmitSuccess(true);
        const refreshRes = await fetch("/api/ghin/submit");
        if (refreshRes.ok) setGhinData(await refreshRes.json());
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading / Unauthenticated ── */
  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (sessionStatus === "unauthenticated" || !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <User className="mx-auto h-16 w-16" style={muted} />
        <h1 className="mt-4 font-display text-2xl font-bold" style={primary}>Sign In Required</h1>
        <p className="mt-2 text-sm" style={secondary}>Please sign in to view your profile.</p>
      </div>
    );
  }

  /* ── GHIN status helpers ── */
  const isVerified = ghinData?.ghinVerified === true;
  const isPending = ghinData?.latestSubmission?.status === "pending";
  const isRejected = ghinData?.latestSubmission?.status === "rejected";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8" style={{ minHeight: "100vh" }}>

      {/* ── Profile Header ── */}
      <div style={card} className="mb-6">
        <div className="flex items-center gap-4">
          {user.image ? (
            <img src={user.image} alt="" className="h-16 w-16 rounded-full" />
          ) : (
            <div className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold" style={{
              backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-muted)",
            }}>
              {(user.name || user.email || "?")[0].toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold" style={primary}>{user.name || "Golfer"}</h1>
            <p className="text-sm" style={muted}>{user.email}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize" style={{
                backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)",
                border: "1px solid var(--cg-border)",
              }}>
                {user.role ?? "user"}
              </span>
              {isVerified && (
                <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{
                  backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)",
                }}>
                  <CheckCircle2 className="h-3 w-3" /> GHIN Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── GHIN Verification ── */}
      <div style={card} className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
          <h2 className="font-display text-lg font-semibold" style={primary}>GHIN Verification</h2>
        </div>

        {loadingGhin ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--cg-accent)" }} />
          </div>
        ) : isVerified ? (
          /* ── Verified ── */
          <div className="rounded-lg p-4" style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8" style={{ color: "#4ade80" }} />
              <div>
                <div className="font-medium" style={primary}>GHIN Verified</div>
                <div className="text-sm" style={secondary}>
                  GHIN #{ghinData.ghinNumber}
                  {ghinData.ghinVerifiedAt && (
                    <> — verified {new Date(ghinData.ghinVerifiedAt).toLocaleDateString()}</>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : isPending ? (
          /* ── Pending ── */
          <div className="rounded-lg p-4" style={{ backgroundColor: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8" style={{ color: "#fbbf24" }} />
              <div>
                <div className="font-medium" style={primary}>Under Review</div>
                <div className="text-sm" style={secondary}>
                  GHIN #{ghinData.ghinNumber} — submitted{" "}
                  {ghinData.latestSubmission?.submittedAt
                    ? new Date(ghinData.latestSubmission.submittedAt).toLocaleDateString()
                    : "recently"}
                </div>
                <div className="text-xs mt-1" style={muted}>
                  An admin will review your verification request shortly.
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Submit form ── */
          <>
            {isRejected && (
              <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 shrink-0" style={{ color: "#f87171" }} />
                  <div>
                    <span className="text-sm font-medium" style={{ color: "#f87171" }}>Previous submission was rejected</span>
                    {ghinData.latestSubmission?.reviewNotes && (
                      <p className="text-xs mt-0.5" style={secondary}>
                        Reason: {ghinData.latestSubmission.reviewNotes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm mb-4" style={secondary}>
              Verify your GHIN number to unlock handicap tracking and verified score posting.
              Upload a screenshot of your GHIN profile for verification.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* GHIN Number */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={muted}>GHIN Number</label>
                <input
                  type="text"
                  value={ghinNumber}
                  onChange={(e) => setGhinNumber(e.target.value)}
                  placeholder="Enter your GHIN number"
                  required
                  className="w-full rounded-lg px-3 py-2.5 text-sm"
                  style={{
                    backgroundColor: "var(--cg-bg-secondary)",
                    border: "1px solid var(--cg-border)",
                    color: "var(--cg-text-primary)",
                    outline: "none",
                  }}
                />
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={muted}>Screenshot (optional)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg p-6 text-center cursor-pointer transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: "var(--cg-bg-secondary)",
                    border: "2px dashed var(--cg-border)",
                  }}
                >
                  {screenshotPreview ? (
                    <div>
                      <img
                        src={screenshotPreview}
                        alt="Screenshot preview"
                        className="max-h-40 mx-auto rounded-lg mb-2"
                      />
                      <p className="text-xs" style={muted}>Click to change</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 mx-auto mb-2" style={muted} />
                      <p className="text-sm" style={secondary}>Click to upload screenshot</p>
                      <p className="text-xs mt-1" style={muted}>PNG, JPG up to 5MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Error / Success */}
              {submitError && (
                <div className="flex items-center gap-2 text-sm rounded-lg p-3" style={{
                  backgroundColor: "rgba(239,68,68,0.08)", color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}>
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="flex items-center gap-2 text-sm rounded-lg p-3" style={{
                  backgroundColor: "rgba(34,197,94,0.08)", color: "#4ade80",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}>
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Verification request submitted! An admin will review it shortly.
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !ghinNumber.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: "var(--cg-accent)",
                  color: "white",
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Shield className="h-4 w-4" /> Submit for Verification</>
                )}
              </button>
            </form>
          </>
        )}
      </div>

      {/* ── My Ratings (placeholder) ── */}
      <div style={card} className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5" style={{ color: "#f59e0b" }} />
          <h2 className="font-display text-lg font-semibold" style={primary}>My Ratings</h2>
        </div>
        <div className="text-center py-8">
          <Star className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--cg-border)" }} />
          <p className="text-sm" style={muted}>Your course ratings will appear here</p>
          <p className="text-xs mt-1" style={muted}>Rate courses to see your personalized rankings</p>
        </div>
      </div>

      {/* ── My Scores (placeholder) ── */}
      <div style={card}>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
          <h2 className="font-display text-lg font-semibold" style={primary}>My Scores</h2>
        </div>
        <div className="text-center py-8">
          <Trophy className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--cg-border)" }} />
          <p className="text-sm" style={muted}>Your posted scores will appear here</p>
          <p className="text-xs mt-1" style={muted}>Post scores to track your handicap progression</p>
        </div>
      </div>
    </div>
  );
}
