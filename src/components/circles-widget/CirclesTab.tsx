"use client";

import { useEffect, useState } from "react";
import { Users, Loader2, UserPlus } from "lucide-react";
import { stringToColor, getInitials } from "./hooks";

interface CircleItem {
  id: string;
  name: string;
  type: string;
  memberCount: number;
  description?: string | null;
  privacy?: string;
}

export function CirclesTab() {
  const [myCircles, setMyCircles] = useState<CircleItem[]>([]);
  const [suggested, setSuggested] = useState<CircleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [myRes, sugRes] = await Promise.all([
          fetch("/api/circles"),
          fetch("/api/circles/discover?limit=5"),
        ]);
        if (myRes.ok) {
          const data = await myRes.json();
          setMyCircles(Array.isArray(data) ? data : data.circles ?? []);
        }
        if (sugRes.ok) {
          const data = await sugRes.json();
          setSuggested(Array.isArray(data) ? data : data.circles ?? []);
        }
      } catch (err) {
        console.error("Failed to load circles:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleJoin = async (circleId: string) => {
    setJoining(circleId);
    try {
      const res = await fetch(`/api/circles/${circleId}/join`, { method: "POST" });
      if (res.ok) {
        const joined = suggested.find((c) => c.id === circleId);
        if (joined) {
          setSuggested((prev) => prev.filter((c) => c.id !== circleId));
          setMyCircles((prev) => [...prev, joined]);
        }
      }
    } catch (err) {
      console.error("Failed to join circle:", err);
    } finally {
      setJoining(null);
    }
  };

  const typeBadgeColor: Record<string, string> = {
    CREW: "#3b82f6",
    GAME: "#f59e0b",
    NETWORK: "#22c55e",
    CLUB: "#a855f7",
    LEAGUE: "#ef4444",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "var(--cg-accent)" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Your Circles */}
      <div className="px-4 pt-3 pb-1">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--cg-text-muted)" }}>
          Your Circles
        </span>
      </div>

      {myCircles.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-2">
          <Users style={{ width: 32, height: 32, color: "var(--cg-text-muted)" }} />
          <span className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
            Join a circle to start connecting
          </span>
        </div>
      ) : (
        <div className="px-2">
          {myCircles.map((circle) => (
            <div
              key={circle.id}
              className="flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors"
              style={{ cursor: "default" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--cg-bg-card-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              <div
                className="rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ width: 36, height: 36, backgroundColor: stringToColor(circle.name) }}
              >
                {getInitials(circle.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate" style={{ color: "var(--cg-text-primary)" }}>
                    {circle.name}
                  </span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: typeBadgeColor[circle.type] || "var(--cg-text-muted)",
                      color: "white",
                    }}
                  >
                    {circle.type}
                  </span>
                </div>
                <span className="text-[11px]" style={{ color: "var(--cg-text-muted)" }}>
                  {circle.memberCount} {circle.memberCount === 1 ? "member" : "members"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggested Circles */}
      {suggested.length > 0 && (
        <>
          <div className="px-4 pt-4 pb-1" style={{ borderTop: "1px solid var(--cg-border-subtle)" }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--cg-text-muted)" }}>
              Suggested Circles
            </span>
          </div>
          <div className="px-2">
            {suggested.map((circle) => (
              <div
                key={circle.id}
                className="flex items-center gap-3 px-2 py-2.5 rounded-lg"
              >
                <div
                  className="rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ width: 36, height: 36, backgroundColor: stringToColor(circle.name) }}
                >
                  {getInitials(circle.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block" style={{ color: "var(--cg-text-primary)" }}>
                    {circle.name}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--cg-text-muted)" }}>
                    {circle.memberCount} members
                  </span>
                </div>
                <button
                  onClick={() => handleJoin(circle.id)}
                  disabled={joining === circle.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--cg-accent-bg)",
                    color: "var(--cg-accent)",
                    border: "1px solid var(--cg-accent-muted)",
                  }}
                >
                  {joining === circle.id ? (
                    <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />
                  ) : (
                    <>
                      <UserPlus style={{ width: 14, height: 14 }} />
                      Join
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
