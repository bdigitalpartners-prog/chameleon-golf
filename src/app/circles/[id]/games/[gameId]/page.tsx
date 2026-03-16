"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Loader2, ArrowLeft, Trophy, Users, MapPin, Clock, Play, CheckCircle,
  UserPlus, BarChart3
} from "lucide-react";

interface GameDetail {
  id: string;
  name: string | null;
  format: string;
  status: string;
  scheduledDate: string | null;
  startDate: string | null;
  endDate: string | null;
  holesPlayed: number;
  config: any;
  results: any;
  courseId: number | null;
  createdById: string;
  course?: { courseName: string } | null;
  players: Array<{
    userId: string;
    team: string | null;
    handicap: number | null;
    position: number | null;
    status: string;
    user: { id: string; name: string | null; image: string | null };
  }>;
  scores: Array<{ userId: string; holeNumber: number; strokes: number; putts: number | null }>;
  sideGames: Array<{ id: string; type: string; stakes: string | null; result: any }>;
}

interface LeaderboardEntry {
  userId: string;
  userName?: string;
  totalStrokes: number;
  netStrokes?: number;
  holesCompleted: number;
  position: number;
  thru: number;
  points?: number;
  skins?: number;
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

export default function GameDetailPage() {
  const { id: circleId, gameId } = useParams<{ id: string; gameId: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [completing, setCompleting] = useState(false);

  const userId = (session?.user as any)?.id;
  const isCreator = game?.createdById === userId;
  const isPlayer = game?.players.some((p) => p.userId === userId);
  const isConfirmed = game?.players.some((p) => p.userId === userId && p.status === "CONFIRMED");

  useEffect(() => {
    fetchGame();
  }, [circleId, gameId]);

  useEffect(() => {
    if (game && (game.status === "IN_PROGRESS" || game.status === "COMPLETED")) {
      fetchLeaderboard();
    }
  }, [game?.status]);

  async function fetchGame() {
    setLoading(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/games/${gameId}`);
      if (res.ok) {
        const data = await res.json();
        setGame(data.game);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchLeaderboard() {
    try {
      const res = await fetch(`/api/circles/${circleId}/games/${gameId}/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard ?? []);
      }
    } catch { /* ignore */ }
  }

  async function handleJoin() {
    setJoining(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/games/${gameId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) await fetchGame();
    } finally {
      setJoining(false);
    }
  }

  async function handleComplete() {
    if (!confirm("Complete this game and finalize results?")) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/games/${gameId}/complete`, {
        method: "POST",
      });
      if (res.ok) await fetchGame();
    } finally {
      setCompleting(false);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
        <p style={{ color: "var(--cg-text-muted)" }}>Game not found</p>
      </div>
    );
  }

  const status = STATUS_STYLES[game.status] ?? STATUS_STYLES.PENDING;
  const confirmedPlayers = game.players.filter((p) => p.status === "CONFIRMED");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cg-bg-primary)" }}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push(`/circles/${circleId}/games`)}
            className="rounded-lg p-2"
            style={{ backgroundColor: "var(--cg-bg-card)" }}
          >
            <ArrowLeft className="h-5 w-5" style={{ color: "var(--cg-text-primary)" }} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
                {game.name ?? FORMAT_LABELS[game.format] ?? game.format}
              </h1>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ backgroundColor: status.bg, color: status.text }}
              >
                {status.label}
              </span>
            </div>
          </div>
        </div>

        {/* Game info card */}
        <div
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--cg-text-muted)" }}>
            <span className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4" />
              {FORMAT_LABELS[game.format] ?? game.format}
            </span>
            {game.course && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {game.course.courseName}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {confirmedPlayers.length} players
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatDate(game.scheduledDate ?? game.startDate)}
            </span>
            <span>{game.holesPlayed} holes</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          {game.status === "PENDING" && !isPlayer && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
              style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
            >
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Join Game
            </button>
          )}
          {(game.status === "PENDING" || game.status === "IN_PROGRESS") && isConfirmed && (
            <a
              href={`/circles/${circleId}/games/${gameId}/scoring`}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
              style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
            >
              <Play className="h-4 w-4" />
              {game.status === "IN_PROGRESS" ? "Continue Scoring" : "Start Scoring"}
            </a>
          )}
          {game.status === "IN_PROGRESS" && isCreator && (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
              style={{ backgroundColor: "rgba(34, 197, 94, 0.9)", color: "white" }}
            >
              {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Complete Game
            </button>
          )}
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--cg-text-primary)" }}>
              <BarChart3 className="h-5 w-5 inline mr-2" />
              Leaderboard
            </h3>
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
            >
              {/* Header */}
              <div
                className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium"
                style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-muted)" }}
              >
                <div className="col-span-1">#</div>
                <div className="col-span-5">Player</div>
                <div className="col-span-2 text-center">Strokes</div>
                <div className="col-span-2 text-center">Thru</div>
                <div className="col-span-2 text-center">
                  {game.format === "STABLEFORD" ? "Pts" : game.format === "SKINS" ? "Skins" : "Net"}
                </div>
              </div>
              {leaderboard.map((entry, i) => {
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                return (
                  <div
                    key={entry.userId}
                    className="grid grid-cols-12 gap-2 px-4 py-3 items-center"
                    style={{
                      borderBottom: i < leaderboard.length - 1 ? "1px solid var(--cg-border)" : "none",
                    }}
                  >
                    <div className="col-span-1 font-bold" style={{ color: "var(--cg-text-muted)" }}>
                      {medal ?? entry.position}
                    </div>
                    <div className="col-span-5 font-medium truncate" style={{ color: "var(--cg-text-primary)" }}>
                      {entry.userName ?? "Player"}
                    </div>
                    <div className="col-span-2 text-center" style={{ color: "var(--cg-text-primary)" }}>
                      {entry.totalStrokes}
                    </div>
                    <div className="col-span-2 text-center" style={{ color: "var(--cg-text-muted)" }}>
                      {entry.thru === game.holesPlayed ? "F" : entry.thru}
                    </div>
                    <div className="col-span-2 text-center" style={{ color: "var(--cg-accent)" }}>
                      {game.format === "STABLEFORD"
                        ? entry.points ?? "—"
                        : game.format === "SKINS"
                        ? entry.skins ?? "—"
                        : entry.netStrokes ?? "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Players list */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--cg-text-primary)" }}>
            Players ({confirmedPlayers.length})
          </h3>
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
          >
            {game.players.map((player, i) => (
              <div
                key={player.userId}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderBottom: i < game.players.length - 1 ? "1px solid var(--cg-border)" : "none",
                }}
              >
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
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: "var(--cg-text-primary)" }}>
                    {player.user.name ?? "Unknown"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                    {player.team ? `Team ${player.team}` : ""}
                    {player.handicap != null ? ` · HCP ${player.handicap}` : ""}
                  </p>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor:
                      player.status === "CONFIRMED"
                        ? "rgba(34, 197, 94, 0.15)"
                        : player.status === "DECLINED"
                        ? "rgba(239, 68, 68, 0.15)"
                        : "rgba(234, 179, 8, 0.15)",
                    color:
                      player.status === "CONFIRMED"
                        ? "rgb(34, 197, 94)"
                        : player.status === "DECLINED"
                        ? "rgb(239, 68, 68)"
                        : "rgb(234, 179, 8)",
                  }}
                >
                  {player.status}
                </span>
                {player.position != null && (
                  <span className="text-sm font-bold" style={{ color: "var(--cg-accent)" }}>
                    #{player.position}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Side Games */}
        {game.sideGames.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--cg-text-primary)" }}>
              Side Games
            </h3>
            <div className="space-y-2">
              {game.sideGames.map((sg) => (
                <div
                  key={sg.id}
                  className="rounded-xl p-3"
                  style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium" style={{ color: "var(--cg-text-primary)" }}>
                      {sg.type.replace(/_/g, " ")}
                    </span>
                    {sg.stakes && (
                      <span className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                        {sg.stakes}
                      </span>
                    )}
                  </div>
                  {sg.result && (
                    <p className="text-sm mt-1" style={{ color: "var(--cg-accent)" }}>
                      Result: {typeof sg.result === "string" ? sg.result : JSON.stringify(sg.result)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
