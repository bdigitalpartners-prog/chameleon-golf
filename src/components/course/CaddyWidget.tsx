"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Star, UserPlus, X, Calendar, Users, MessageSquare } from "lucide-react";

interface CaddyWidgetProps {
  courseId: number;
  courseName: string;
}

export function CaddyWidget({ courseId, courseName }: CaddyWidgetProps) {
  const { data: session } = useSession();
  const [caddies, setCaddies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  // Rating modal state
  const [ratingModal, setRatingModal] = useState<{ caddyId: string; caddyName: string } | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  // Request modal state
  const [requestModal, setRequestModal] = useState(false);
  const [requestDate, setRequestDate] = useState("");
  const [requestGroupSize, setRequestGroupSize] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [requestCaddyIds, setRequestCaddyIds] = useState<string[]>([]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/looper-guild/caddies?courseId=${courseId}`)
      .then((r) => r.json())
      .then((data) => setCaddies(Array.isArray(data) ? data : []))
      .catch(() => setCaddies([]))
      .finally(() => setLoading(false));
  }, [courseId]);

  async function submitRating() {
    if (!ratingModal || ratingValue === 0) return;
    setRatingLoading(true);
    try {
      const res = await fetch(`/api/looper-guild/caddies/${ratingModal.caddyId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: ratingValue,
          comment: ratingComment || null,
          courseId,
        }),
      });
      if (res.ok) {
        setRatingSuccess(true);
        // Refresh caddies
        const refreshed = await fetch(`/api/looper-guild/caddies?courseId=${courseId}`);
        if (refreshed.ok) {
          const data = await refreshed.json();
          setCaddies(Array.isArray(data) ? data : []);
        }
        setTimeout(() => {
          setRatingModal(null);
          setRatingValue(0);
          setRatingComment("");
          setRatingSuccess(false);
        }, 1500);
      }
    } catch {
      // ignore
    } finally {
      setRatingLoading(false);
    }
  }

  async function submitRequest() {
    setRequestLoading(true);
    try {
      const res = await fetch("/api/looper-guild/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          playDate: requestDate || null,
          groupSize: requestGroupSize || null,
          notes: requestNotes || null,
          caddyIds: requestCaddyIds.length > 0 ? requestCaddyIds : undefined,
        }),
      });
      if (res.ok) {
        setRequestSuccess(true);
        setTimeout(() => {
          setRequestModal(false);
          setRequestDate("");
          setRequestGroupSize("");
          setRequestNotes("");
          setRequestCaddyIds([]);
          setRequestSuccess(false);
        }, 2000);
      }
    } catch {
      // ignore
    } finally {
      setRequestLoading(false);
    }
  }

  if (loading) return null;

  const hasCaddies = caddies.length > 0;

  return (
    <section
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "var(--cg-bg-card)",
        border: "1px solid var(--cg-border)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors"
        style={{ backgroundColor: "var(--cg-bg-card)" }}
      >
        <div className="flex items-center gap-3">
          <img
            src="/looper-guild-lambda.png"
            alt=""
            className="h-6 w-6 object-contain opacity-70"
          />
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Looper Guild Caddies at {courseName}
          </span>
        </div>
        <svg
          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          style={{ color: "var(--cg-text-muted)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div
          className="px-5 pb-5"
          style={{ borderTop: "1px solid var(--cg-border)" }}
        >
          {hasCaddies ? (
            <>
              {/* Caddy list */}
              <div className="space-y-3 mt-4">
                {caddies.map((caddy) => (
                  <div
                    key={caddy.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5"
                    style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                  >
                    <div className="flex items-center gap-3">
                      {caddy.photoUrl ? (
                        <img
                          src={caddy.photoUrl}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-semibold"
                          style={{
                            backgroundColor: "var(--cg-accent)",
                            color: "var(--cg-text-inverse)",
                          }}
                        >
                          {caddy.firstName?.[0]}{caddy.lastName?.[0]}
                        </div>
                      )}
                      <div>
                        <div
                          className="text-sm font-medium"
                          style={{ color: "var(--cg-text-primary)" }}
                        >
                          {caddy.firstName} {caddy.lastName}
                        </div>
                        <div className="flex items-center gap-2">
                          {caddy.avgRating !== null && (
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className="h-3 w-3"
                                  style={{
                                    color: s <= Math.round(caddy.avgRating) ? "#f59e0b" : "var(--cg-border)",
                                    fill: s <= Math.round(caddy.avgRating) ? "#f59e0b" : "none",
                                  }}
                                />
                              ))}
                              <span className="text-[10px] ml-1" style={{ color: "var(--cg-text-muted)" }}>
                                ({caddy.totalRatings})
                              </span>
                            </div>
                          )}
                          {caddy.yearsExperience && (
                            <span className="text-[10px]" style={{ color: "var(--cg-text-muted)" }}>
                              {caddy.yearsExperience}yr exp
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {session && (
                      <button
                        onClick={() =>
                          setRatingModal({
                            caddyId: caddy.id,
                            caddyName: `${caddy.firstName} ${caddy.lastName}`,
                          })
                        }
                        className="rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: "var(--cg-accent-bg)",
                          color: "var(--cg-accent)",
                          border: "1px solid var(--cg-accent-muted)",
                        }}
                      >
                        Rate
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Request button */}
              {session && (
                <button
                  onClick={() => setRequestModal(true)}
                  className="mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "var(--cg-accent)",
                    color: "var(--cg-text-inverse)",
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  Request a Caddy
                </button>
              )}
            </>
          ) : (
            /* No caddies state */
            <div className="text-center py-6">
              <p
                className="text-sm mb-1"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                No caddies listed yet
              </p>
              <p
                className="text-xs mb-4"
                style={{ color: "var(--cg-text-muted)" }}
              >
                Request via our concierge and we&apos;ll find one for you
              </p>
              {session ? (
                <button
                  onClick={() => setRequestModal(true)}
                  className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-2"
                  style={{
                    backgroundColor: "var(--cg-accent)",
                    color: "var(--cg-text-inverse)",
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Request via Concierge
                </button>
              ) : (
                <p
                  className="text-xs"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  Sign in to request a caddy
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div
            className="rounded-xl p-6 max-w-sm w-full"
            style={{
              backgroundColor: "var(--cg-bg-secondary)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-base font-semibold"
                style={{ color: "var(--cg-text-primary)" }}
              >
                Rate {ratingModal.caddyName}
              </h3>
              <button
                onClick={() => {
                  setRatingModal(null);
                  setRatingValue(0);
                  setRatingComment("");
                }}
              >
                <X className="h-4 w-4" style={{ color: "var(--cg-text-muted)" }} />
              </button>
            </div>

            {ratingSuccess ? (
              <div className="text-center py-4">
                <div className="text-2xl mb-2" style={{ color: "var(--cg-accent)" }}>&#10003;</div>
                <p className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>Rating submitted!</p>
              </div>
            ) : (
              <>
                {/* Stars */}
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onMouseEnter={() => setRatingHover(s)}
                      onMouseLeave={() => setRatingHover(0)}
                      onClick={() => setRatingValue(s)}
                    >
                      <Star
                        className="h-8 w-8 transition-colors"
                        style={{
                          color: s <= (ratingHover || ratingValue) ? "#f59e0b" : "var(--cg-border)",
                          fill: s <= (ratingHover || ratingValue) ? "#f59e0b" : "none",
                        }}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Add a comment (optional)"
                  rows={3}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-y mb-4"
                  style={{
                    backgroundColor: "var(--cg-bg-tertiary)",
                    color: "var(--cg-text-primary)",
                    border: "1px solid var(--cg-border)",
                  }}
                />

                <button
                  onClick={submitRating}
                  disabled={ratingValue === 0 || ratingLoading}
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--cg-accent)",
                    color: "var(--cg-text-inverse)",
                  }}
                >
                  {ratingLoading ? "Submitting..." : "Submit Rating"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Request Modal */}
      {requestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div
            className="rounded-xl p-6 max-w-md w-full"
            style={{
              backgroundColor: "var(--cg-bg-secondary)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-base font-semibold"
                style={{ color: "var(--cg-text-primary)" }}
              >
                {hasCaddies ? "Request a Caddy" : "Caddy Concierge Request"}
              </h3>
              <button
                onClick={() => {
                  setRequestModal(false);
                  setRequestSuccess(false);
                }}
              >
                <X className="h-4 w-4" style={{ color: "var(--cg-text-muted)" }} />
              </button>
            </div>

            {requestSuccess ? (
              <div className="text-center py-4">
                <div className="text-2xl mb-2" style={{ color: "var(--cg-accent)" }}>&#10003;</div>
                <p className="text-sm" style={{ color: "var(--cg-text-secondary)" }}>
                  Request submitted! We&apos;ll be in touch.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p
                  className="text-xs"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  Course: {courseName}
                </p>

                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: "var(--cg-text-secondary)" }}
                  >
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Play Date
                  </label>
                  <input
                    type="date"
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      backgroundColor: "var(--cg-bg-tertiary)",
                      color: "var(--cg-text-primary)",
                      border: "1px solid var(--cg-border)",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: "var(--cg-text-secondary)" }}
                  >
                    <Users className="h-3 w-3 inline mr-1" />
                    Group Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={requestGroupSize}
                    onChange={(e) => setRequestGroupSize(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      backgroundColor: "var(--cg-bg-tertiary)",
                      color: "var(--cg-text-primary)",
                      border: "1px solid var(--cg-border)",
                    }}
                  />
                </div>

                {hasCaddies && (
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: "var(--cg-text-secondary)" }}
                    >
                      Preferred Caddies (optional)
                    </label>
                    <div className="space-y-1">
                      {caddies.map((caddy) => (
                        <label
                          key={caddy.id}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer text-sm"
                          style={{
                            backgroundColor: requestCaddyIds.includes(caddy.id)
                              ? "var(--cg-accent-bg)"
                              : "transparent",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={requestCaddyIds.includes(caddy.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRequestCaddyIds((prev) => [...prev, caddy.id]);
                              } else {
                                setRequestCaddyIds((prev) => prev.filter((id) => id !== caddy.id));
                              }
                            }}
                            className="sr-only"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px]"
                            style={{
                              borderColor: requestCaddyIds.includes(caddy.id)
                                ? "var(--cg-accent)"
                                : "var(--cg-border)",
                              backgroundColor: requestCaddyIds.includes(caddy.id)
                                ? "var(--cg-accent)"
                                : "transparent",
                              color: "var(--cg-text-inverse)",
                            }}
                          >
                            {requestCaddyIds.includes(caddy.id) && "✓"}
                          </span>
                          <span style={{ color: "var(--cg-text-primary)" }}>
                            {caddy.firstName} {caddy.lastName}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: "var(--cg-text-secondary)" }}
                  >
                    Notes
                  </label>
                  <textarea
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    placeholder="Any preferences or special requests..."
                    rows={2}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                    style={{
                      backgroundColor: "var(--cg-bg-tertiary)",
                      color: "var(--cg-text-primary)",
                      border: "1px solid var(--cg-border)",
                    }}
                  />
                </div>

                <button
                  onClick={submitRequest}
                  disabled={requestLoading}
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--cg-accent)",
                    color: "var(--cg-text-inverse)",
                  }}
                >
                  {requestLoading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
