"use client";

import { X, ExternalLink } from "lucide-react";
import type { LeagueData, LeagueKey } from "./types";

interface LeaderboardPanelProps {
  activeLeague: LeagueKey;
  onLeagueChange: (league: LeagueKey) => void;
  onClose: () => void;
  data: LeagueData | null;
  lastUpdated: Date | null;
}

function getScoreClass(score: string): string {
  if (!score || score === "E" || score === "--") return "";
  if (score.startsWith("-")) return "text-red-400";
  if (score.startsWith("+")) return "text-green-400";
  return "";
}

function getCurrentRoundScore(rounds: { period: number; score: string }[]): string {
  if (!rounds.length) return "--";
  const last = rounds[rounds.length - 1];
  return last?.score || "--";
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function LeaderboardPanel({
  activeLeague,
  onLeagueChange,
  onClose,
  data,
  lastUpdated,
}: LeaderboardPanelProps) {
  const hasData = data && data.players.length > 0;

  return (
    <div
      className="fixed flex flex-col overflow-hidden lb-slide-up"
      style={{
        bottom: 92,
        left: 24,
        width: 360,
        height: "auto",
        maxHeight: "80vh",
        zIndex: 9998,
        backgroundColor: "var(--cg-bg-secondary)",
        border: "1px solid var(--cg-border)",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--cg-border)" }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            {data?.status.state === "in" ? (
              <div className="flex items-center gap-1.5">
                <span
                  className="lb-pulse-dot inline-block rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: "#ef4444",
                  }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "#ef4444" }}
                >
                  Live
                </span>
              </div>
            ) : data?.status.state === "post" ? (
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "var(--cg-bg-tertiary)",
                  color: "var(--cg-text-secondary)",
                }}
              >
                {data.status.shortDetail || "Final"}
              </span>
            ) : null}

            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "var(--cg-accent-bg)",
                color: "var(--cg-accent)",
              }}
            >
              {data?.league || (activeLeague === "pga" ? "PGA Tour" : "LIV Golf")}
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{
              width: 28,
              height: 28,
              color: "var(--cg-text-muted)",
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {hasData && (
          <>
            <h3
              className="font-bold text-base leading-tight"
              style={{
                color: "var(--cg-text-primary)",
                fontFamily: "Georgia, serif",
              }}
            >
              {data.eventName}
            </h3>
            {data.courseName && (
              <div className="flex items-center gap-1.5 mt-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "var(--cg-accent)", flexShrink: 0 }}
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--cg-text-secondary)" }}
                >
                  {data.courseName}
                </span>
              </div>
            )}
            {data.courseLocation && (
              <span
                className="text-[10px] block mt-0.5"
                style={{ color: "var(--cg-text-muted)", paddingLeft: 18 }}
              >
                {data.courseLocation}
              </span>
            )}
          </>
        )}
      </div>

      {/* League tabs */}
      <div
        className="flex shrink-0"
        style={{ borderBottom: "1px solid var(--cg-border)" }}
      >
        {(["pga", "liv"] as const).map((league) => {
          const isActive = activeLeague === league;
          const label = league === "pga" ? "PGA Tour" : "LIV Golf";
          return (
            <button
              key={league}
              onClick={() => onLeagueChange(league)}
              className="flex-1 py-2 text-xs font-semibold transition-colors relative"
              style={{
                color: isActive
                  ? "var(--cg-text-primary)"
                  : "var(--cg-text-muted)",
              }}
            >
              {label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-3 right-3"
                  style={{
                    height: 2,
                    backgroundColor: "var(--cg-accent)",
                    borderRadius: 1,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Leaderboard content */}
      <div className="flex-1 overflow-y-auto lb-scrollbar">
        {!hasData ? (
          <div className="py-10 px-4 text-center">
            <div className="text-2xl mb-2 opacity-50">⛳</div>
            <div
              className="text-sm font-semibold mb-1"
              style={{ color: "var(--cg-text-primary)" }}
            >
              No Active Tournament
            </div>
            <div
              className="text-xs"
              style={{ color: "var(--cg-text-muted)" }}
            >
              Check back when the next{" "}
              {activeLeague === "pga" ? "PGA Tour" : "LIV Golf"} event begins.
            </div>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div
              className="grid px-3 py-1.5"
              style={{
                gridTemplateColumns: "32px 1fr 52px 48px",
                backgroundColor: "var(--cg-bg-tertiary)",
                borderBottom: "1px solid var(--cg-border-subtle)",
              }}
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--cg-text-muted)" }}
              >
                #
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--cg-text-muted)" }}
              >
                Player
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-wider text-right"
                style={{ color: "var(--cg-text-muted)" }}
              >
                Tot
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-wider text-right"
                style={{ color: "var(--cg-text-muted)" }}
              >
                {data.status.period > 0 ? `R${data.status.period}` : "Day"}
              </span>
            </div>

            {/* Player rows */}
            {data.players.map((player, i) => {
              const roundScore = getCurrentRoundScore(player.rounds);
              return (
                <div
                  key={`${player.name}-${i}`}
                  className="grid items-center px-3 transition-colors"
                  style={{
                    gridTemplateColumns: "32px 1fr 52px 48px",
                    height: 40,
                    borderBottom: "1px solid var(--cg-border-subtle)",
                    backgroundColor:
                      i === 0
                        ? "rgba(34, 197, 94, 0.06)"
                        : "transparent",
                  }}
                >
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{
                      color:
                        i === 0
                          ? "var(--cg-accent)"
                          : "var(--cg-text-muted)",
                    }}
                  >
                    {player.position}
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {player.flag && (
                      <img
                        src={player.flag}
                        alt={player.country}
                        className="rounded-sm flex-shrink-0"
                        style={{ width: 16, height: 11, objectFit: "cover" }}
                        loading="lazy"
                      />
                    )}
                    <span
                      className="text-xs truncate"
                      style={{
                        color: "var(--cg-text-primary)",
                        fontWeight: i === 0 ? 700 : 500,
                      }}
                    >
                      {player.name}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold text-right tabular-nums ${getScoreClass(player.score)}`}
                  >
                    {player.score}
                  </span>
                  <span
                    className={`text-xs text-right tabular-nums ${getScoreClass(roundScore)}`}
                  >
                    {roundScore}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{
          borderTop: "1px solid var(--cg-border)",
          backgroundColor: "var(--cg-bg-tertiary)",
        }}
      >
        <span
          className="text-[10px] flex items-center gap-1"
          style={{ color: "var(--cg-text-muted)" }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          {lastUpdated ? formatTime(lastUpdated) : "Loading..."}
        </span>
        {data?.link && (
          <a
            href={data.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] flex items-center gap-1 transition-colors"
            style={{ color: "var(--cg-accent)" }}
          >
            Full Leaderboard
            <ExternalLink style={{ width: 10, height: 10 }} />
          </a>
        )}
      </div>
    </div>
  );
}
