"use client";

import { useState, useEffect } from "react";
import { Loader2, Gamepad2, Plus, Trophy, Users, MapPin, Clock, ChevronRight } from "lucide-react";

interface GameData {
  id: string;
  name: string | null;
  format: string;
  status: string;
  scheduledDate: string | null;
  startDate: string | null;
  endDate: string | null;
  courseId: number | null;
  course?: { courseName: string } | null;
  _count?: { players: number; scores: number };
  results?: Array<{ userId: string; position: number; totalStrokes: number }>;
}

const FORMAT_LABELS: Record<string, string> = {
  STROKE_PLAY: "Stroke Play",
  SKINS: "Skins",
  NASSAU: "Nassau",
  MATCH_PLAY: "Match Play",
  STABLEFORD: "Stableford",
  BEST_BALL: "Best Ball",
  SCRAMBLE: "Scramble",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "rgba(234, 179, 8, 0.15)", text: "rgb(234, 179, 8)", label: "Upcoming" },
  IN_PROGRESS: { bg: "rgba(34, 197, 94, 0.15)", text: "rgb(34, 197, 94)", label: "Live" },
  COMPLETED: { bg: "rgba(107, 114, 128, 0.15)", text: "rgb(107, 114, 128)", label: "Completed" },
  CANCELLED: { bg: "rgba(239, 68, 68, 0.15)", text: "rgb(239, 68, 68)", label: "Cancelled" },
};

export function CircleGamesTab({ circleId, isAdmin }: { circleId: string; isAdmin: boolean }) {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"active" | "upcoming" | "completed">("active");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    fetchGames();
  }, [circleId, filter, page]);

  async function fetchGames() {
    setLoading(true);
    try {
      const statusParam =
        filter === "active" ? "IN_PROGRESS" : filter === "upcoming" ? "PENDING" : "COMPLETED";
      const res = await fetch(
        `/api/circles/${circleId}/games?status=${statusParam}&page=${page}&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        setGames(data.games ?? []);
        setTotalPages(data.totalPages ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
          Games
        </h3>
        {isAdmin && (
          <a
            href={`/circles/${circleId}/games/create`}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
          >
            <Plus className="h-4 w-4" /> New Game
          </a>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4">
        {(["active", "upcoming", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
            style={{
              backgroundColor: filter === f ? "var(--cg-accent)" : "var(--cg-bg-tertiary)",
              color: filter === f ? "var(--cg-text-inverse)" : "var(--cg-text-muted)",
            }}
          >
            {f === "active" ? "Live" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
        </div>
      ) : games.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <Gamepad2 className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--cg-text-muted)" }} />
          <p style={{ color: "var(--cg-text-muted)" }}>
            {filter === "active"
              ? "No live games right now."
              : filter === "upcoming"
              ? "No upcoming games scheduled."
              : "No completed games yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => {
            const status = STATUS_STYLES[game.status] ?? STATUS_STYLES.PENDING;
            return (
              <a
                key={game.id}
                href={`/circles/${circleId}/games/${game.id}`}
                className="block rounded-xl p-4 transition-all hover:opacity-90"
                style={{
                  backgroundColor: "var(--cg-bg-card)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className="font-semibold truncate"
                        style={{ color: "var(--cg-text-primary)" }}
                      >
                        {game.name ?? FORMAT_LABELS[game.format] ?? game.format}
                      </h4>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
                        style={{ backgroundColor: status.bg, color: status.text }}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div
                      className="flex flex-wrap items-center gap-3 text-sm"
                      style={{ color: "var(--cg-text-muted)" }}
                    >
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3.5 w-3.5" />
                        {FORMAT_LABELS[game.format] ?? game.format}
                      </span>
                      {game.course && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {game.course.courseName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {game._count?.players ?? 0} players
                      </span>
                      {(game.scheduledDate || game.startDate) && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(game.scheduledDate ?? game.startDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    className="h-5 w-5 flex-shrink-0 ml-2"
                    style={{ color: "var(--cg-text-muted)" }}
                  />
                </div>
              </a>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-40"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)" }}
          >
            Previous
          </button>
          <span className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-40"
            style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
