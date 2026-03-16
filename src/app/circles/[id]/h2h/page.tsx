"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, ArrowLeft, Swords, Trophy, MapPin, Calendar } from "lucide-react";

interface MemberData {
  userId: string;
  user: { id: string; name: string | null; image: string | null };
}

interface H2HData {
  user1: { id: string; name: string; image: string | null };
  user2: { id: string; name: string; image: string | null };
  record: { wins1: number; wins2: number; ties: number };
  lastPlayed: string | null;
  recentGames: Array<{
    id: string;
    name: string;
    course: string | null;
    date: string | null;
    player1Position: number | null;
    player2Position: number | null;
  }>;
}

export default function H2HPage() {
  const { id: circleId } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingH2H, setLoadingH2H] = useState(false);
  const [player1, setPlayer1] = useState<string>("");
  const [player2, setPlayer2] = useState<string>("");
  const [h2h, setH2H] = useState<H2HData | null>(null);

  useEffect(() => {
    async function loadMembers() {
      setLoading(true);
      try {
        const res = await fetch(`/api/circles/${circleId}/members?limit=100`);
        if (res.ok) {
          const data = await res.json();
          setMembers(data.members ?? []);
          // Auto-select current user as player1
          const uid = (session?.user as any)?.id;
          if (uid) setPlayer1(uid);
        }
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, [circleId, session]);

  useEffect(() => {
    if (player1 && player2 && player1 !== player2) {
      fetchH2H();
    } else {
      setH2H(null);
    }
  }, [player1, player2]);

  async function fetchH2H() {
    setLoadingH2H(true);
    try {
      const res = await fetch(
        `/api/circles/${circleId}/h2h?user1=${player1}&user2=${player2}`
      );
      if (res.ok) {
        const data = await res.json();
        setH2H(data);
      }
    } finally {
      setLoadingH2H(false);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  if (loading) {
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
            onClick={() => router.push(`/circles/${circleId}`)}
            className="rounded-lg p-2"
            style={{ backgroundColor: "var(--cg-bg-card)" }}
          >
            <ArrowLeft className="h-5 w-5" style={{ color: "var(--cg-text-primary)" }} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
            Head-to-Head
          </h1>
        </div>

        {/* Player selectors */}
        <div
          className="rounded-xl p-4 mb-6"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--cg-text-muted)" }}>
                Player 1
              </label>
              <select
                value={player1}
                onChange={(e) => setPlayer1(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  color: "var(--cg-text-primary)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                <option value="">Select player</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name ?? "Unknown"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--cg-text-muted)" }}>
                Player 2
              </label>
              <select
                value={player2}
                onChange={(e) => setPlayer2(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  color: "var(--cg-text-primary)",
                  border: "1px solid var(--cg-border)",
                }}
              >
                <option value="">Select player</option>
                {members
                  .filter((m) => m.userId !== player1)
                  .map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name ?? "Unknown"}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {loadingH2H && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--cg-accent)" }} />
          </div>
        )}

        {h2h && !loadingH2H && (
          <>
            {/* Record card */}
            <div
              className="rounded-xl p-6 mb-4 text-center"
              style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
            >
              <Swords className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--cg-accent)" }} />

              <div className="flex items-center justify-center gap-6">
                {/* Player 1 */}
                <div className="text-center">
                  {h2h.user1?.image ? (
                    <img src={h2h.user1.image} alt="" className="h-12 w-12 rounded-full mx-auto mb-2 object-cover" />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
                    >
                      {h2h.user1?.name?.charAt(0) ?? "?"}
                    </div>
                  )}
                  <p className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                    {h2h.user1?.name ?? "Player 1"}
                  </p>
                </div>

                {/* Score */}
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-3xl font-bold"
                      style={{ color: h2h.record.wins1 >= h2h.record.wins2 ? "var(--cg-accent)" : "var(--cg-text-muted)" }}
                    >
                      {h2h.record.wins1}
                    </span>
                    <span className="text-lg" style={{ color: "var(--cg-text-muted)" }}>
                      -
                    </span>
                    <span
                      className="text-3xl font-bold"
                      style={{ color: h2h.record.wins2 >= h2h.record.wins1 ? "var(--cg-accent)" : "var(--cg-text-muted)" }}
                    >
                      {h2h.record.wins2}
                    </span>
                  </div>
                  {h2h.record.ties > 0 && (
                    <p className="text-xs mt-1" style={{ color: "var(--cg-text-muted)" }}>
                      {h2h.record.ties} tie{h2h.record.ties !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {/* Player 2 */}
                <div className="text-center">
                  {h2h.user2?.image ? (
                    <img src={h2h.user2.image} alt="" className="h-12 w-12 rounded-full mx-auto mb-2 object-cover" />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
                    >
                      {h2h.user2?.name?.charAt(0) ?? "?"}
                    </div>
                  )}
                  <p className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                    {h2h.user2?.name ?? "Player 2"}
                  </p>
                </div>
              </div>

              {h2h.lastPlayed && (
                <p className="text-xs mt-4" style={{ color: "var(--cg-text-muted)" }}>
                  Last played: {formatDate(h2h.lastPlayed)}
                </p>
              )}
            </div>

            {/* Recent games */}
            {h2h.recentGames.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--cg-text-primary)" }}>
                  Recent Matchups
                </h3>
                <div className="space-y-2">
                  {h2h.recentGames.map((game) => (
                    <a
                      key={game.id}
                      href={`/circles/${circleId}/games/${game.id}`}
                      className="block rounded-xl p-3"
                      style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                            {game.name ?? "Game"}
                          </p>
                          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--cg-text-muted)" }}>
                            {game.course && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {game.course}
                              </span>
                            )}
                            {game.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {formatDate(game.date)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <span
                            style={{
                              color:
                                (game.player1Position ?? 99) < (game.player2Position ?? 99)
                                  ? "var(--cg-accent)"
                                  : "var(--cg-text-muted)",
                            }}
                          >
                            #{game.player1Position ?? "?"}
                          </span>
                          <span style={{ color: "var(--cg-text-muted)" }}>vs</span>
                          <span
                            style={{
                              color:
                                (game.player2Position ?? 99) < (game.player1Position ?? 99)
                                  ? "var(--cg-accent)"
                                  : "var(--cg-text-muted)",
                            }}
                          >
                            #{game.player2Position ?? "?"}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {h2h.recentGames.length === 0 && h2h.record.wins1 === 0 && h2h.record.wins2 === 0 && (
              <div
                className="rounded-xl p-6 text-center"
                style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
              >
                <p style={{ color: "var(--cg-text-muted)" }}>
                  No head-to-head history yet. Play a game together!
                </p>
              </div>
            )}
          </>
        )}

        {!player1 || !player2 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
          >
            <Swords className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--cg-text-muted)" }} />
            <p style={{ color: "var(--cg-text-muted)" }}>
              Select two players to compare their head-to-head record
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
