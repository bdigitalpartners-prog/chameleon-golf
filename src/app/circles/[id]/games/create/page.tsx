"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, ArrowLeft, ChevronRight, ChevronLeft, Check, Users, MapPin } from "lucide-react";

const FORMATS = [
  { key: "STROKE_PLAY", label: "Stroke Play", desc: "Lowest total strokes wins" },
  { key: "SKINS", label: "Skins", desc: "Win individual holes outright" },
  { key: "NASSAU", label: "Nassau", desc: "Three bets: front 9, back 9, overall" },
  { key: "MATCH_PLAY", label: "Match Play", desc: "Win individual holes, most holes wins" },
  { key: "STABLEFORD", label: "Stableford", desc: "Points based on score relative to par" },
  { key: "BEST_BALL", label: "Best Ball", desc: "Best score from each team counts" },
  { key: "SCRAMBLE", label: "Scramble", desc: "Team picks best shot each stroke" },
];

interface MemberData {
  userId: string;
  user: { id: string; name: string | null; image: string | null };
  role: string;
}

interface CourseData {
  courseId: number;
  courseName: string;
}

export default function GameCreatePage() {
  const { id: circleId } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(0); // 0: format, 1: details, 2: players, 3: review
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [format, setFormat] = useState("");
  const [name, setName] = useState("");
  const [courseId_form, setCourseId] = useState<number | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [holesPlayed, setHolesPlayed] = useState(18);
  const [handicapEnabled, setHandicapEnabled] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  // Data
  const [members, setMembers] = useState<MemberData[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      try {
        const [membersRes, coursesRes] = await Promise.all([
          fetch(`/api/circles/${circleId}/members?limit=100`),
          fetch(`/api/circles/${circleId}/courses?limit=50`),
        ]);
        if (membersRes.ok) {
          const data = await membersRes.json();
          setMembers(data.members ?? []);
        }
        if (coursesRes.ok) {
          const data = await coursesRes.json();
          const list = (data.courses ?? []).map((c: any) => c.course ?? c);
          setCourses(list);
        }
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [circleId]);

  // Auto-select current user
  useEffect(() => {
    if (session?.user && selectedPlayers.length === 0) {
      const uid = (session.user as any).id;
      if (uid) setSelectedPlayers([uid]);
    }
  }, [session]);

  function togglePlayer(uid: string) {
    setSelectedPlayers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/circles/${circleId}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          name: name || undefined,
          courseId: courseId_form || undefined,
          scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
          holesPlayed,
          config: { handicapEnabled },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create game");
        return;
      }

      const { game } = await res.json();

      // Add selected players (besides creator who's auto-added)
      const currentUserId = (session?.user as any)?.id;
      const otherPlayers = selectedPlayers.filter((id) => id !== currentUserId);
      for (const playerId of otherPlayers) {
        await fetch(`/api/circles/${circleId}/games/${game.id}/players`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: playerId }),
        });
      }

      router.push(`/circles/${circleId}/games/${game.id}`);
    } catch {
      setError("Failed to create game");
    } finally {
      setSubmitting(false);
    }
  }

  const steps = ["Format", "Details", "Players", "Review"];
  const canNext =
    step === 0 ? !!format : step === 1 ? true : step === 2 ? selectedPlayers.length > 0 : true;

  if (!session) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => (step > 0 ? setStep(step - 1) : router.back())}
            className="rounded-lg p-2"
            style={{ backgroundColor: "var(--cg-bg-card)" }}
          >
            <ArrowLeft className="h-5 w-5" style={{ color: "var(--cg-text-primary)" }} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
            New Game
          </h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className="flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: i <= step ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
                  color: i <= step ? "var(--cg-text-inverse)" : "var(--cg-text-muted)",
                }}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className="text-xs font-medium hidden sm:block"
                style={{ color: i <= step ? "var(--cg-text-primary)" : "var(--cg-text-muted)" }}
              >
                {s}
              </span>
              {i < steps.length - 1 && (
                <div
                  className="flex-1 h-0.5 rounded"
                  style={{
                    backgroundColor: i < step ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div
            className="rounded-lg p-3 mb-4 text-sm"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--cg-status-error, #ef4444)" }}
          >
            {error}
          </div>
        )}

        {/* Step 0: Format Selection */}
        {step === 0 && (
          <div className="space-y-2">
            <p className="text-sm mb-4" style={{ color: "var(--cg-text-muted)" }}>
              Choose a game format
            </p>
            {FORMATS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFormat(f.key)}
                className="w-full text-left rounded-xl p-4 transition-all"
                style={{
                  backgroundColor: "var(--cg-bg-card)",
                  border: format === f.key ? "2px solid var(--cg-accent)" : "1px solid var(--cg-border)",
                }}
              >
                <p className="font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                  {f.label}
                </p>
                <p className="text-sm mt-0.5" style={{ color: "var(--cg-text-muted)" }}>
                  {f.desc}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-primary)" }}>
                Game Name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Saturday Morning Round"
                className="w-full rounded-lg px-3 py-2.5 text-sm"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  color: "var(--cg-text-primary)",
                  border: "1px solid var(--cg-border)",
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-primary)" }}>
                Course
              </label>
              {loadingData ? (
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--cg-accent)" }} />
              ) : (
                <select
                  value={courseId_form ?? ""}
                  onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm"
                  style={{
                    backgroundColor: "var(--cg-bg-tertiary)",
                    color: "var(--cg-text-primary)",
                    border: "1px solid var(--cg-border)",
                  }}
                >
                  <option value="">Select a course (optional)</option>
                  {courses.map((c) => (
                    <option key={c.courseId} value={c.courseId}>
                      {c.courseName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-primary)" }}>
                Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  color: "var(--cg-text-primary)",
                  border: "1px solid var(--cg-border)",
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-primary)" }}>
                  Holes
                </label>
                <div className="flex gap-2">
                  {[9, 18].map((h) => (
                    <button
                      key={h}
                      onClick={() => setHolesPlayed(h)}
                      className="flex-1 rounded-lg px-3 py-2 text-sm font-medium"
                      style={{
                        backgroundColor: holesPlayed === h ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
                        color: holesPlayed === h ? "var(--cg-text-inverse)" : "var(--cg-text-muted)",
                      }}
                    >
                      {h} holes
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--cg-text-primary)" }}>
                  Handicaps
                </label>
                <button
                  onClick={() => setHandicapEnabled(!handicapEnabled)}
                  className="w-full rounded-lg px-3 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: handicapEnabled ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
                    color: handicapEnabled ? "var(--cg-text-inverse)" : "var(--cg-text-muted)",
                  }}
                >
                  {handicapEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Players */}
        {step === 2 && (
          <div>
            <p className="text-sm mb-4" style={{ color: "var(--cg-text-muted)" }}>
              Select players for this game ({selectedPlayers.length} selected)
            </p>
            {loadingData ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((m) => {
                  const isSelected = selectedPlayers.includes(m.userId);
                  return (
                    <button
                      key={m.userId}
                      onClick={() => togglePlayer(m.userId)}
                      className="w-full flex items-center gap-3 rounded-xl p-3 transition-all"
                      style={{
                        backgroundColor: "var(--cg-bg-card)",
                        border: isSelected
                          ? "2px solid var(--cg-accent)"
                          : "1px solid var(--cg-border)",
                      }}
                    >
                      {m.user.image ? (
                        <img src={m.user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium"
                          style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
                        >
                          {m.user.name?.charAt(0) ?? "?"}
                        </div>
                      )}
                      <span className="flex-1 text-left font-medium" style={{ color: "var(--cg-text-primary)" }}>
                        {m.user.name ?? "Unknown"}
                      </span>
                      {isSelected && (
                        <Check className="h-5 w-5" style={{ color: "var(--cg-accent)" }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
            >
              <h3 className="font-semibold mb-3" style={{ color: "var(--cg-text-primary)" }}>
                Game Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "var(--cg-text-muted)" }}>Format</span>
                  <span style={{ color: "var(--cg-text-primary)" }}>
                    {FORMATS.find((f) => f.key === format)?.label ?? format}
                  </span>
                </div>
                {name && (
                  <div className="flex justify-between">
                    <span style={{ color: "var(--cg-text-muted)" }}>Name</span>
                    <span style={{ color: "var(--cg-text-primary)" }}>{name}</span>
                  </div>
                )}
                {courseId_form && (
                  <div className="flex justify-between">
                    <span style={{ color: "var(--cg-text-muted)" }}>Course</span>
                    <span style={{ color: "var(--cg-text-primary)" }}>
                      {courses.find((c) => c.courseId === courseId_form)?.courseName ?? "Selected"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span style={{ color: "var(--cg-text-muted)" }}>Holes</span>
                  <span style={{ color: "var(--cg-text-primary)" }}>{holesPlayed}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--cg-text-muted)" }}>Handicaps</span>
                  <span style={{ color: "var(--cg-text-primary)" }}>
                    {handicapEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--cg-text-muted)" }}>Players</span>
                  <span style={{ color: "var(--cg-text-primary)" }}>{selectedPlayers.length}</span>
                </div>
              </div>
            </div>

            {/* Selected players list */}
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
            >
              <h4 className="font-medium mb-2" style={{ color: "var(--cg-text-primary)" }}>
                Players
              </h4>
              <div className="space-y-2">
                {members
                  .filter((m) => selectedPlayers.includes(m.userId))
                  .map((m) => (
                    <div key={m.userId} className="flex items-center gap-2">
                      {m.user.image ? (
                        <img src={m.user.image} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <div
                          className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium"
                          style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
                        >
                          {m.user.name?.charAt(0) ?? "?"}
                        </div>
                      )}
                      <span className="text-sm" style={{ color: "var(--cg-text-primary)" }}>
                        {m.user.name ?? "Unknown"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium"
              style={{
                backgroundColor: "var(--cg-bg-tertiary)",
                color: "var(--cg-text-primary)",
              }}
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-40"
              style={{
                backgroundColor: "var(--cg-accent)",
                color: "var(--cg-text-inverse)",
              }}
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-60"
              style={{
                backgroundColor: "var(--cg-accent)",
                color: "var(--cg-text-inverse)",
              }}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4" /> Create Game
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
