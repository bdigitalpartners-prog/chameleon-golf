"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, ArrowLeft, Save, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";

interface GameData {
  id: string;
  name: string | null;
  format: string;
  status: string;
  holesPlayed: number;
  course?: { courseName: string } | null;
  players: Array<{
    userId: string;
    status: string;
    user: { id: string; name: string | null; image: string | null };
  }>;
  scores: Array<{
    userId: string;
    holeNumber: number;
    strokes: number;
    putts: number | null;
  }>;
}

export default function ScoringPage() {
  const { id: circleId, gameId } = useParams<{ id: string; gameId: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentHole, setCurrentHole] = useState(1);
  const [scores, setScores] = useState<Record<string, Record<number, { strokes: number; putts: number }>>>({});
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    fetchGame();
  }, [circleId, gameId]);

  async function fetchGame() {
    setLoading(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/games/${gameId}`);
      if (res.ok) {
        const data = await res.json();
        setGame(data.game);
        // Initialize scores from existing data
        const scoreMap: typeof scores = {};
        for (const s of data.game.scores ?? []) {
          if (!scoreMap[s.userId]) scoreMap[s.userId] = {};
          scoreMap[s.userId][s.holeNumber] = { strokes: s.strokes, putts: s.putts ?? 0 };
        }
        // Ensure all confirmed players have entries
        for (const p of data.game.players ?? []) {
          if (p.status === "CONFIRMED" && !scoreMap[p.userId]) {
            scoreMap[p.userId] = {};
          }
        }
        setScores(scoreMap);
      }
    } finally {
      setLoading(false);
    }
  }

  function updateScore(userId: string, hole: number, field: "strokes" | "putts", delta: number) {
    setScores((prev) => {
      const userScores = { ...prev[userId] };
      const current = userScores[hole] ?? { strokes: 4, putts: 0 };
      const newVal = Math.max(field === "strokes" ? 1 : 0, current[field] + delta);
      userScores[hole] = { ...current, [field]: newVal };
      return { ...prev, [userId]: userScores };
    });
  }

  function setStrokesDirectly(userId: string, hole: number, value: number) {
    setScores((prev) => {
      const userScores = { ...prev[userId] };
      const current = userScores[hole] ?? { strokes: 4, putts: 0 };
      userScores[hole] = { ...current, strokes: Math.max(1, value) };
      return { ...prev, [userId]: userScores };
    });
  }

  const saveScores = useCallback(async () => {
    if (!game) return;
    setSaving(true);
    setSaveMessage("");
    try {
      // Collect all scores for current hole
      const confirmedPlayers = game.players.filter((p) => p.status === "CONFIRMED");
      const holeScores = confirmedPlayers
        .map((p) => {
          const s = scores[p.userId]?.[currentHole];
          if (!s) return null;
          return { userId: p.userId, holeNumber: currentHole, strokes: s.strokes, putts: s.putts || undefined };
        })
        .filter(Boolean);

      if (holeScores.length === 0) {
        setSaveMessage("Enter scores first");
        return;
      }

      const res = await fetch(`/api/circles/${circleId}/games/${gameId}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: holeScores }),
      });

      if (res.ok) {
        setSaveMessage("Saved!");
        setTimeout(() => setSaveMessage(""), 2000);
      } else {
        const data = await res.json();
        setSaveMessage(data.error ?? "Save failed");
      }
    } finally {
      setSaving(false);
    }
  }, [game, scores, currentHole, circleId, gameId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex justify-center py-20">
        <p style={{ color: "var(--cg-text-muted)" }}>Game not found</p>
      </div>
    );
  }

  const confirmedPlayers = game.players.filter((p) => p.status === "CONFIRMED");
  const totalHoles = game.holesPlayed;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push(`/circles/${circleId}/games/${gameId}`)}
            className="rounded-lg p-2"
            style={{ backgroundColor: "var(--cg-bg-card)" }}
          >
            <ArrowLeft className="h-5 w-5" style={{ color: "var(--cg-text-primary)" }} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold" style={{ color: "var(--cg-text-primary)" }}>
              {game.name ?? "Score Entry"}
            </h1>
            <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
              {game.course?.courseName ?? "No course"} · {game.holesPlayed} holes
            </p>
          </div>
        </div>

        {/* Hole navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentHole((h) => Math.max(1, h - 1))}
            disabled={currentHole === 1}
            className="rounded-lg p-2 disabled:opacity-30"
            style={{ backgroundColor: "var(--cg-bg-card)" }}
          >
            <ChevronLeft className="h-5 w-5" style={{ color: "var(--cg-text-primary)" }} />
          </button>

          <div className="text-center">
            <p className="text-3xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
              Hole {currentHole}
            </p>
            <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
              of {totalHoles}
            </p>
          </div>

          <button
            onClick={() => setCurrentHole((h) => Math.min(totalHoles, h + 1))}
            disabled={currentHole === totalHoles}
            className="rounded-lg p-2 disabled:opacity-30"
            style={{ backgroundColor: "var(--cg-bg-card)" }}
          >
            <ChevronRight className="h-5 w-5" style={{ color: "var(--cg-text-primary)" }} />
          </button>
        </div>

        {/* Hole selector strip */}
        <div className="flex gap-1 overflow-x-auto pb-3 mb-4">
          {Array.from({ length: totalHoles }, (_, i) => i + 1).map((hole) => {
            const hasScores = confirmedPlayers.some((p) => scores[p.userId]?.[hole]?.strokes);
            return (
              <button
                key={hole}
                onClick={() => setCurrentHole(hole)}
                className="flex-shrink-0 w-8 h-8 rounded-full text-xs font-medium"
                style={{
                  backgroundColor:
                    hole === currentHole
                      ? "var(--cg-accent)"
                      : hasScores
                      ? "var(--cg-accent-bg)"
                      : "var(--cg-bg-tertiary)",
                  color:
                    hole === currentHole
                      ? "var(--cg-text-inverse)"
                      : hasScores
                      ? "var(--cg-accent)"
                      : "var(--cg-text-muted)",
                }}
              >
                {hole}
              </button>
            );
          })}
        </div>

        {/* Score entry cards */}
        <div className="space-y-3 mb-6">
          {confirmedPlayers.map((player) => {
            const holeScore = scores[player.userId]?.[currentHole] ?? { strokes: 4, putts: 0 };
            return (
              <div
                key={player.userId}
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  {player.user.image ? (
                    <img src={player.user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
                    >
                      {player.user.name?.charAt(0) ?? "?"}
                    </div>
                  )}
                  <span className="font-medium" style={{ color: "var(--cg-text-primary)" }}>
                    {player.user.name ?? "Player"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Strokes */}
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: "var(--cg-text-muted)" }}>
                      Strokes
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateScore(player.userId, currentHole, "strokes", -1)}
                        className="rounded-lg p-2"
                        style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                      >
                        <Minus className="h-4 w-4" style={{ color: "var(--cg-text-primary)" }} />
                      </button>
                      <input
                        type="number"
                        value={holeScore.strokes}
                        onChange={(e) => setStrokesDirectly(player.userId, currentHole, parseInt(e.target.value) || 1)}
                        className="w-14 text-center text-xl font-bold rounded-lg py-1"
                        style={{
                          backgroundColor: "var(--cg-bg-tertiary)",
                          color: "var(--cg-text-primary)",
                          border: "1px solid var(--cg-border)",
                        }}
                        min={1}
                      />
                      <button
                        onClick={() => updateScore(player.userId, currentHole, "strokes", 1)}
                        className="rounded-lg p-2"
                        style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                      >
                        <Plus className="h-4 w-4" style={{ color: "var(--cg-text-primary)" }} />
                      </button>
                    </div>
                  </div>

                  {/* Putts */}
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: "var(--cg-text-muted)" }}>
                      Putts
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateScore(player.userId, currentHole, "putts", -1)}
                        className="rounded-lg p-2"
                        style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                      >
                        <Minus className="h-4 w-4" style={{ color: "var(--cg-text-primary)" }} />
                      </button>
                      <span
                        className="w-14 text-center text-xl font-bold"
                        style={{ color: "var(--cg-text-primary)" }}
                      >
                        {holeScore.putts}
                      </span>
                      <button
                        onClick={() => updateScore(player.userId, currentHole, "putts", 1)}
                        className="rounded-lg p-2"
                        style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                      >
                        <Plus className="h-4 w-4" style={{ color: "var(--cg-text-primary)" }} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Running total */}
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--cg-border)" }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--cg-text-muted)" }}>Total through {currentHole}</span>
                    <span className="font-bold" style={{ color: "var(--cg-accent)" }}>
                      {Object.entries(scores[player.userId] ?? {})
                        .filter(([h]) => parseInt(h) <= currentHole)
                        .reduce((sum, [, s]) => sum + s.strokes, 0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save button */}
        <div className="sticky bottom-4">
          <button
            onClick={saveScores}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-medium shadow-lg"
            style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Hole {currentHole}
          </button>
          {saveMessage && (
            <p className="text-center text-sm mt-2" style={{ color: "var(--cg-accent)" }}>
              {saveMessage}
            </p>
          )}
        </div>

        {/* Scorecard overview */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--cg-text-primary)" }}>
            Scorecard
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th
                    className="sticky left-0 px-2 py-1.5 text-left font-medium"
                    style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-muted)" }}
                  >
                    Player
                  </th>
                  {Array.from({ length: totalHoles }, (_, i) => i + 1).map((hole) => (
                    <th
                      key={hole}
                      className="px-2 py-1.5 text-center font-medium min-w-[28px]"
                      style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-muted)" }}
                    >
                      {hole}
                    </th>
                  ))}
                  <th
                    className="px-2 py-1.5 text-center font-medium"
                    style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)" }}
                  >
                    TOT
                  </th>
                </tr>
              </thead>
              <tbody>
                {confirmedPlayers.map((player) => {
                  const playerScores = scores[player.userId] ?? {};
                  const total = Object.values(playerScores).reduce((sum, s) => sum + s.strokes, 0);
                  return (
                    <tr key={player.userId}>
                      <td
                        className="sticky left-0 px-2 py-1.5 font-medium truncate max-w-[100px]"
                        style={{ backgroundColor: "var(--cg-bg-card)", color: "var(--cg-text-primary)" }}
                      >
                        {player.user.name?.split(" ")[0] ?? "—"}
                      </td>
                      {Array.from({ length: totalHoles }, (_, i) => i + 1).map((hole) => (
                        <td
                          key={hole}
                          className="px-2 py-1.5 text-center"
                          style={{
                            backgroundColor: hole === currentHole ? "var(--cg-accent-bg)" : "var(--cg-bg-card)",
                            color: playerScores[hole] ? "var(--cg-text-primary)" : "var(--cg-text-muted)",
                            borderBottom: "1px solid var(--cg-border)",
                          }}
                        >
                          {playerScores[hole]?.strokes ?? "–"}
                        </td>
                      ))}
                      <td
                        className="px-2 py-1.5 text-center font-bold"
                        style={{ backgroundColor: "var(--cg-bg-card)", color: "var(--cg-accent)" }}
                      >
                        {total || "–"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
