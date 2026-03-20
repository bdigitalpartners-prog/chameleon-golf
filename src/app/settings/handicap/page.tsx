"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  ImageIcon,
  X,
} from "lucide-react";

interface VerificationData {
  id: string;
  ghinNumber: string;
  handicapIndex: number | null;
  status: string;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

interface ProfileData {
  handicapIndex: number | null;
  handicapVerified: boolean;
  ghinNumber: string | null;
}

export default function HandicapVerificationPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [ghinNumber, setGhinNumber] = useState("");
  const [handicapIndex, setHandicapIndex] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/ghin/status");
      const data = await res.json();
      setVerification(data.verification);
      setProfile(data.profile);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchStatus();
    } else if (authStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [authStatus, fetchStatus]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, or WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setError("");
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!ghinNumber || !/^\d{7,8}$/.test(ghinNumber.trim())) {
      setError("GHIN number must be 7 or 8 digits");
      return;
    }

    const parsedHandicap = parseFloat(handicapIndex);
    if (isNaN(parsedHandicap)) {
      setError("Please enter a valid handicap index");
      return;
    }

    if (!screenshotFile) {
      setError("Please upload a screenshot of your GHIN profile");
      return;
    }

    setSubmitting(true);
    try {
      // Upload screenshot to R2 first
      let screenshotUrl = "";
      const uploadForm = new FormData();
      uploadForm.append("file", screenshotFile);
      uploadForm.append("type", "ghin");
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        screenshotUrl = uploadData.url;
      } else {
        // R2 may not be configured — submit without screenshot URL
        console.warn("Screenshot upload failed, submitting without URL");
      }

      const res = await fetch("/api/ghin/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ghinNumber: ghinNumber.trim(),
          handicapIndex: parsedHandicap,
          screenshotUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit");
        return;
      }

      setSuccess("Verification submitted successfully! We'll review it shortly.");
      // Refresh status
      await fetchStatus();
      // Clear form
      setGhinNumber("");
      setHandicapIndex("");
      setScreenshotPreview("");
      setScreenshotFile(null);
    } catch {
      setError("Failed to submit verification. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const clearScreenshot = () => {
    setScreenshotPreview("");
    setScreenshotFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#01696F" }} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center" style={{ color: "var(--cg-text-primary)" }}>
        <p>Please sign in to verify your handicap.</p>
      </div>
    );
  }

  const showForm =
    !verification ||
    verification.status === "rejected" ||
    (profile?.handicapVerified && !verification);

  const isPending = verification?.status === "pending";
  const isApproved = verification?.status === "approved" || profile?.handicapVerified;
  const isRejected = verification?.status === "rejected";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/profile")}
          className="flex items-center gap-1 text-sm mb-4 transition-colors"
          style={{ color: "var(--cg-text-muted)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </button>
        <h1
          className="font-display text-2xl font-bold"
          style={{ color: "var(--cg-text-primary)" }}
        >
          My GHIN
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--cg-text-muted)" }}>
          Link your GHIN number and verify your handicap to unlock verified scoring and course ratings
        </p>
      </div>

      {/* Status display */}
      {isApproved && !isRejected && (
        <div
          className="rounded-xl p-5 mb-6 flex items-start gap-4"
          style={{ backgroundColor: "rgba(1, 105, 111, 0.1)", border: "1px solid rgba(1, 105, 111, 0.3)" }}
        >
          <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" style={{ color: "#01696F" }} />
          <div>
            <h3 className="font-semibold text-green-400">Handicap Verified</h3>
            <p className="text-sm mt-1" style={{ color: "var(--cg-text-secondary)" }}>
              Your handicap index of{" "}
              <span className="font-mono font-bold text-white">
                {profile?.handicapIndex?.toFixed(1) ?? verification?.handicapIndex?.toFixed(1)}
              </span>{" "}
              has been verified. GHIN #{profile?.ghinNumber ?? verification?.ghinNumber}
            </p>
          </div>
        </div>
      )}

      {isPending && (
        <div
          className="rounded-xl p-5 mb-6 flex items-start gap-4"
          style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)" }}
        >
          <Clock className="h-6 w-6 flex-shrink-0 mt-0.5 text-amber-400" />
          <div>
            <h3 className="font-semibold text-amber-400">Verification Under Review</h3>
            <p className="text-sm mt-1" style={{ color: "var(--cg-text-secondary)" }}>
              Your verification request for GHIN #{verification.ghinNumber} (HCP{" "}
              {verification.handicapIndex?.toFixed(1)}) was submitted on{" "}
              {new Date(verification.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              . We&apos;ll review it shortly.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div
          className="rounded-xl p-5 mb-6 flex items-start gap-4"
          style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)" }}
        >
          <XCircle className="h-6 w-6 flex-shrink-0 mt-0.5 text-red-400" />
          <div>
            <h3 className="font-semibold text-red-400">Verification Rejected</h3>
            <p className="text-sm mt-1" style={{ color: "var(--cg-text-secondary)" }}>
              {verification?.reviewNote || "Your verification was not approved."}
            </p>
            <p className="text-sm mt-2" style={{ color: "var(--cg-text-muted)" }}>
              You can resubmit with updated information below.
            </p>
          </div>
        </div>
      )}

      {/* Submission form */}
      {showForm && !isPending && (
        <form onSubmit={handleSubmit}>
          <div
            className="rounded-xl p-6 space-y-5"
            style={{
              backgroundColor: "var(--cg-bg-card)",
              border: "1px solid var(--cg-border)",
            }}
          >
            {/* GHIN Number */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                GHIN Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{7,8}"
                maxLength={8}
                value={ghinNumber}
                onChange={(e) => setGhinNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="1234567"
                className="w-full rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--cg-bg-secondary)",
                  color: "var(--cg-text-primary)",
                  border: "1px solid var(--cg-border)",
                }}
              />
              <p className="text-xs mt-1" style={{ color: "var(--cg-text-muted)" }}>
                7 or 8 digit number from your GHIN profile
              </p>
            </div>

            {/* Handicap Index */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                Handicap Index
              </label>
              <input
                type="number"
                step="0.1"
                min="-10"
                max="54"
                value={handicapIndex}
                onChange={(e) => setHandicapIndex(e.target.value)}
                placeholder="12.3"
                className="w-full rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--cg-bg-secondary)",
                  color: "var(--cg-text-primary)",
                  border: "1px solid var(--cg-border)",
                }}
              />
            </div>

            {/* Screenshot Upload */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                GHIN Profile Screenshot
              </label>

              {screenshotPreview ? (
                <div className="relative rounded-lg overflow-hidden" style={{ border: "1px solid var(--cg-border)" }}>
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="w-full max-h-64 object-contain"
                    style={{ backgroundColor: "var(--cg-bg-secondary)" }}
                  />
                  <button
                    type="button"
                    onClick={clearScreenshot}
                    className="absolute top-2 right-2 rounded-full p-1.5 bg-black/70 text-white hover:bg-black/90 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg py-8 flex flex-col items-center gap-3 transition-colors hover:border-[#01696F]"
                  style={{
                    backgroundColor: "var(--cg-bg-secondary)",
                    border: "2px dashed var(--cg-border)",
                  }}
                >
                  <div
                    className="rounded-full p-3"
                    style={{ backgroundColor: "rgba(1, 105, 111, 0.1)" }}
                  >
                    <Upload className="h-6 w-6" style={{ color: "#01696F" }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                      Click to upload screenshot
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--cg-text-muted)" }}>
                      JPG, PNG, or WebP &bull; Max 5MB
                    </p>
                  </div>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
              <p className="text-xs mt-1.5" style={{ color: "var(--cg-text-muted)" }}>
                Screenshot of your GHIN app or USGA profile showing your handicap index
              </p>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="rounded-lg px-4 py-3 text-sm text-red-400" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg px-4 py-3 text-sm text-green-400" style={{ backgroundColor: "rgba(1, 105, 111, 0.1)" }}>
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: "#01696F",
                color: "white",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Submitting..." : "Submit for Verification"}
            </button>
          </div>
        </form>
      )}

      {/* Info section */}
      <div
        className="mt-6 rounded-xl p-5"
        style={{
          backgroundColor: "var(--cg-bg-card)",
          border: "1px solid var(--cg-border)",
        }}
      >
        <div className="flex items-start gap-3">
          <ImageIcon className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#01696F" }} />
          <div>
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--cg-text-primary)" }}
            >
              How verification works
            </h3>
            <ul
              className="text-xs mt-2 space-y-1.5 list-disc list-inside"
              style={{ color: "var(--cg-text-muted)" }}
            >
              <li>Enter your 7 or 8 digit GHIN number and current handicap index</li>
              <li>Upload a screenshot from the GHIN app or USGA website</li>
              <li>Our team will review and verify within 24-48 hours</li>
              <li>Once verified, a badge will appear on your profile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
