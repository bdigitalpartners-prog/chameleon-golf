"use client";

import { useState, useEffect } from "react";
import { Loader2, Trophy, BarChart3 } from "lucide-react";

interface LeaderboardEntry {
  userId: string;
  name: string;
  image: string | null;
  gamesPlayed: number;
  avgScore: number;
  wins: number;
  coursesPlayed: number;
}

const MODES = [
  { key: "most_games", label: "Most Games" },
  { key: "best_avg_score", label: "Best Avg" },
  { key: "most_wins", label: "Most Wins" },
  { key: "most_courses", label: "Most Courses" },
] as const;

export function CircleLeaderboardTab({ circleId }: { circleId: string }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<string>("most_games");

  useEffect(() => {
    fetchLeaderboard();
  }, [circleId, mode]);

  async function fetchLeaderboard() {
    setLoading(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/leaderboard?mode=${mode}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  function getStatValue(entry: LeaderboardEntry) {
    switch (mode) {
      case "most_games":
        return `${entry.gamesPlayed} games`;
      case "best_avg_score":
        return `${entry.avgScore} avg`;
      case "most_wins":
        return `${entry.wins} wins`;
      case "most_courses":
        return `${entry.coursesPlayed} courses`;
      default:
        return `${entry.gamesPlayed} games`;
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--cg-text-primary)" }}>
        Leaderboard
      </h3>

      {/* Mode pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className="rounded-full px-4 py-1.5 text-sm font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: mode === m.key ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
              color: mode === m.key ? "var(--cg-text-inverse)" : "var(--cg-text-muted)",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
        </div>
      ) : leaderboard.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <BarChart3 className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--cg-text-muted)" }} />
          <p style={{ color: "var(--cg-text-muted)" }}>
            No leaderboard data yet. Complete some games to see standings!
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          {leaderboard.map((entry, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <div
                key={entry.userId}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderBottom:
                    i < leaderboard.length - 1 ? "1px solid var(--cg-border)" : "none",
                }}
              >
                <span
                  className="w-8 text-center font-bold text-lg"
                  style={{ color: medal ? "inherit" : "var(--cg-text-muted)" }}
                >
                  {medal ?? i + 1}
                </span>
                {entry.image ? (
                  <img
                    src={entry.image}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{
                      backgroundColor: "var(--cg-accent-bg)",
                      color: "var(--cg-accent)",
                    }}
                  >
                    {entry.name?.charAt(0) ?? "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-medium truncate"
                    style={{ color: "var(--cg-text-primary)" }}
                  >
                    {entry.name}
                  </p>
                </div>
                <span
                  className="text-sm font-medium whitespace-nowrap"
                  style={{ color: "var(--cg-accent)" }}
                >
                  {getStatValue(entry)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
