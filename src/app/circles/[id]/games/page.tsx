"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Gamepad2, Plus, Trophy, Users, MapPin, Clock, ChevronRight, ArrowLeft } from "lucide-react";

interface GameData {
  id: string;
  name: string | null;
  format: string;
  status: string;
  scheduledDate: string | null;
  startDate: string | null;
  endDate: string | null;
  course?: { courseName: string } | null;
  _count?: { players: number; scores: number };
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

export default function GamesHubPage() {
  const { id: circleId } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "IN_PROGRESS" | "PENDING" | "COMPLETED">("all");
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
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/circles/${circleId}/games?${params}`);
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

  if (!session) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push(`/circles/${circleId}`)}
            className="rounded-lg p-2"
            style={{ backgroundColor: "var(--cg-bg-card)" }}
          >
            <ArrowLeft className="h-5 w-5" style={{ color: "var(--cg-text-primary)" }} />
          </button>
          <h1 className="text-2xl font-bold flex-1" style={{ color: "var(--cg-text-primary)" }}>
            Games
          </h1>
          <a
            href={`/circles/${circleId}/games/create`}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
          >
            <Plus className="h-4 w-4" /> New Game
          </a>
        </div>

        {/* Filter tabs */}
        <div
          className="flex gap-1 rounded-lg p-1 mb-6"
          style={{ backgroundColor: "var(--cg-bg-secondary)" }}
        >
          {[
            { key: "all", label: "All" },
            { key: "IN_PROGRESS", label: "Live" },
            { key: "PENDING", label: "Upcoming" },
            { key: "COMPLETED", label: "History" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all"
              style={{
                backgroundColor: filter === f.key ? "var(--cg-bg-card)" : "transparent",
                color: filter === f.key ? "var(--cg-text-primary)" : "var(--cg-text-muted)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Games list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
          </div>
        ) : games.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center"
            style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
          >
            <Gamepad2 className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--cg-text-muted)" }} />
            <p className="text-lg font-medium mb-2" style={{ color: "var(--cg-text-primary)" }}>
              No games found
            </p>
            <p className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
              Create a new game to get started!
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
                      <div className="flex items-center gap-2 mb-2">
                        <h3
                          className="font-semibold truncate"
                          style={{ color: "var(--cg-text-primary)" }}
                        >
                          {game.name ?? FORMAT_LABELS[game.format] ?? game.format}
                        </h3>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
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
                      className="h-5 w-5 flex-shrink-0 ml-2 mt-1"
                      style={{ color: "var(--cg-text-muted)" }}
                    />
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40"
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
              className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40"
              style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-primary)" }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
