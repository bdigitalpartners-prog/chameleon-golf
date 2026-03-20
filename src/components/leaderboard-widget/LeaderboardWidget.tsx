"use client";

import { useState, useRef, useEffect } from "react";
import { Trophy, X, ExternalLink } from "lucide-react";
import { useLeaderboard } from "./use-leaderboard";
import type { LeagueKey, LeagueData } from "./types";
import "./leaderboard-styles.css";

/* ─── Score color helpers ──────────────────────── */
function getScoreClass(score: string): string {
  if (!score || score === "E" || score === "--") return "";
  if (score.startsWith("-")) return "text-red-400";
  if (score.startsWith("+")) return "text-green-400";
  return "";
}

// getCurrentRoundScore is now computed in use-leaderboard.ts and stored on PlayerData

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/* ─── Main Widget ──────────────────────────────── */
export function LeaderboardWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const {
    activeLeague,
    setActiveLeague,
    lastUpdated,
    loading,
    isLive,
    hasAnyData,
    currentData,
  } = useLeaderboard();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Don't render if no data and done loading
  if (!loading && !hasAnyData) return null;

  return (
    <div className="relative">
      {/* Trigger button — fits in the TopBar actions row */}
      <button
        ref={btnRef}
        onClick={() => setIsOpen((p) => !p)}
        aria-label={isOpen ? "Close leaderboard" : "Open leaderboard"}
        className="flex items-center justify-center w-8 h-8 rounded-md transition-colors relative"
        style={{
          color: isOpen ? "var(--cg-accent)" : "var(--cg-text-secondary)",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.color = "var(--cg-text-primary)";
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.color = "var(--cg-text-secondary)";
        }}
      >
        <Trophy className="w-4 h-4" />
        {/* Live dot */}
        {isLive && !isOpen && (
          <span
            className="lb-pulse-dot absolute rounded-full"
            style={{
              top: 2,
              right: 2,
              width: 6,
              height: 6,
              backgroundColor: "#ef4444",
              border: "1.5px solid var(--cg-bg-nav)",
            }}
          />
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="lb-slide-down absolute flex flex-col overflow-hidden"
          style={{
            top: "calc(100% + 8px)",
            right: 0,
            width: 340,
            maxHeight: "min(600px, calc(100dvh - 70px))",
            zIndex: 9998,
            backgroundColor: "var(--cg-bg-secondary)",
            border: "1px solid var(--cg-border)",
            borderRadius: 12,
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {/* Panel header */}
          <PanelHeader
            data={currentData}
            activeLeague={activeLeague}
            onClose={() => setIsOpen(false)}
          />

          {/* League tabs */}
          <div
            className="flex shrink-0"
            style={{ borderBottom: "1px solid var(--cg-border)" }}
          >
            {(["pga", "liv"] as const).map((league) => {
              const active = activeLeague === league;
              const label = league === "pga" ? "PGA Tour" : "LIV Golf";
              return (
                <button
                  key={league}
                  onClick={() => setActiveLeague(league)}
                  className="flex-1 py-2 text-xs font-semibold transition-colors relative"
                  style={{
                    color: active
                      ? "var(--cg-text-primary)"
                      : "var(--cg-text-muted)",
                  }}
                >
                  {label}
                  {active && (
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto lb-scrollbar">
            {!currentData || currentData.players.length === 0 ? (
              <EmptyState activeLeague={activeLeague} />
            ) : (
              <LeaderboardTable data={currentData} />
            )}
          </div>

          {/* Footer */}
          <PanelFooter
            lastUpdated={lastUpdated}
            link={currentData?.link}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ───────────────────────────── */

function PanelHeader({
  data,
  activeLeague,
  onClose,
}: {
  data: LeagueData | null;
  activeLeague: LeagueKey;
  onClose: () => void;
}) {
  return (
    <div
      className="px-3 py-2.5 shrink-0"
      style={{ borderBottom: "1px solid var(--cg-border)" }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {data?.status.state === "in" ? (
            <div className="flex items-center gap-1.5">
              <span
                className="lb-pulse-dot inline-block rounded-full"
                style={{ width: 7, height: 7, backgroundColor: "#ef4444" }}
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
          className="flex items-center justify-center rounded-md transition-colors"
          style={{ width: 24, height: 24, color: "var(--cg-text-muted)" }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {data && data.players.length > 0 && (
        <>
          <h3
            className="font-bold text-sm leading-snug"
            style={{
              color: "var(--cg-text-primary)",
              fontFamily: "Georgia, serif",
            }}
          >
            {data.eventName}
          </h3>
          {data.courseName && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--cg-accent)", flexShrink: 0 }}
              >
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
              <span
                className="text-[11px] font-medium"
                style={{ color: "var(--cg-text-secondary)" }}
              >
                {data.courseName}
              </span>
            </div>
          )}
          {data.courseLocation && (
            <span
              className="text-[10px] block mt-0.5"
              style={{ color: "var(--cg-text-muted)", paddingLeft: 17 }}
            >
              {data.courseLocation}
            </span>
          )}
        </>
      )}
    </div>
  );
}

function LeaderboardTable({ data }: { data: LeagueData }) {
  return (
    <>
      {/* Column headers */}
      <div
        className="grid px-3 py-1"
        style={{
          gridTemplateColumns: "28px 1fr 48px 44px",
          backgroundColor: "var(--cg-bg-tertiary)",
          borderBottom: "1px solid var(--cg-border-subtle)",
        }}
      >
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--cg-text-muted)" }}>#</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--cg-text-muted)" }}>Player</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-right" style={{ color: "var(--cg-text-muted)" }}>Tot</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-right" style={{ color: "var(--cg-text-muted)" }}>
          {data.status.period > 0 ? `R${data.status.period}` : "Day"}
        </span>
      </div>

      {/* Player rows */}
      {data.players.map((player, i) => {
        const roundScore = player.currentRoundScore;
        return (
          <div
            key={`${player.name}-${i}`}
            className="grid items-center px-3 transition-colors"
            style={{
              gridTemplateColumns: "28px 1fr 48px 44px",
              height: 36,
              borderBottom: "1px solid var(--cg-border-subtle)",
              backgroundColor: i === 0 ? "rgba(34, 197, 94, 0.06)" : "transparent",
            }}
          >
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{ color: i === 0 ? "var(--cg-accent)" : "var(--cg-text-muted)" }}
            >
              {player.position}
            </span>
            <div className="flex items-center gap-1.5 min-w-0">
              {player.flag && (
                <img
                  src={player.flag}
                  alt={player.country}
                  className="rounded-sm flex-shrink-0"
                  style={{ width: 14, height: 10, objectFit: "cover" }}
                  loading="lazy"
                />
              )}
              <span
                className="text-[11px] truncate"
                style={{
                  color: "var(--cg-text-primary)",
                  fontWeight: i === 0 ? 700 : 500,
                }}
              >
                {player.name}
              </span>
            </div>
            <span className={`text-[11px] font-semibold text-right tabular-nums ${getScoreClass(player.score)}`}>
              {player.score}
            </span>
            <span className={`text-[11px] text-right tabular-nums ${getScoreClass(roundScore)}`}>
              {roundScore}
            </span>
          </div>
        );
      })}
    </>
  );
}

function EmptyState({ activeLeague }: { activeLeague: LeagueKey }) {
  return (
    <div className="py-8 px-4 text-center">
      <div className="text-xl mb-2 opacity-50">⛳</div>
      <div className="text-xs font-semibold mb-1" style={{ color: "var(--cg-text-primary)" }}>
        No Active Tournament
      </div>
      <div className="text-[11px]" style={{ color: "var(--cg-text-muted)" }}>
        Check back when the next {activeLeague === "pga" ? "PGA Tour" : "LIV Golf"} event begins.
      </div>
    </div>
  );
}

function PanelFooter({
  lastUpdated,
  link,
}: {
  lastUpdated: Date | null;
  link?: string;
}) {
  return (
    <div
      className="flex items-center justify-between px-3 py-1.5 shrink-0"
      style={{
        borderTop: "1px solid var(--cg-border)",
        backgroundColor: "var(--cg-bg-tertiary)",
      }}
    >
      <span className="text-[9px] flex items-center gap-1" style={{ color: "var(--cg-text-muted)" }}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        {lastUpdated ? formatTime(lastUpdated) : "Loading..."}
      </span>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] flex items-center gap-1 transition-colors"
          style={{ color: "var(--cg-accent)" }}
        >
          Full Leaderboard
          <ExternalLink style={{ width: 9, height: 9 }} />
        </a>
      )}
    </div>
  );
}
