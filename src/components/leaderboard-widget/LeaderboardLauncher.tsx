"use client";

import { Trophy, X } from "lucide-react";

interface LeaderboardLauncherProps {
  isOpen: boolean;
  isLive: boolean;
  onClick: () => void;
}

export function LeaderboardLauncher({ isOpen, isLive, onClick }: LeaderboardLauncherProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? "Close leaderboard" : "Open leaderboard"}
      className="fixed flex items-center justify-center rounded-full transition-all duration-300"
      style={{
        bottom: 24,
        left: 24,
        width: 56,
        height: 56,
        zIndex: 9999,
        backgroundColor: isOpen ? "var(--cg-bg-tertiary)" : "var(--cg-accent)",
        color: isOpen ? "var(--cg-text-primary)" : "var(--cg-text-inverse)",
        boxShadow: isOpen
          ? "0 4px 16px rgba(0,0,0,0.4)"
          : "0 4px 16px rgba(34, 197, 94, 0.3), 0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      {/* Live indicator ring */}
      {!isOpen && isLive && (
        <span
          className="lb-pulse-dot absolute inset-[-4px] rounded-full pointer-events-none"
          style={{ border: "2px solid var(--cg-accent)" }}
        />
      )}

      {/* Icon transition */}
      <span className="relative flex items-center justify-center">
        <Trophy
          className="transition-all duration-300"
          style={{
            width: 24,
            height: 24,
            opacity: isOpen ? 0 : 1,
            transform: isOpen ? "rotate(90deg) scale(0.5)" : "rotate(0deg) scale(1)",
            position: isOpen ? "absolute" : "relative",
          }}
        />
        <X
          className="transition-all duration-300"
          style={{
            width: 24,
            height: 24,
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.5)",
            position: isOpen ? "relative" : "absolute",
          }}
        />
      </span>

      {/* "LIVE" badge when a tournament is in progress */}
      {!isOpen && isLive && (
        <span
          className="absolute flex items-center justify-center text-white font-bold uppercase tracking-wider"
          style={{
            top: -6,
            left: -6,
            minWidth: 32,
            height: 18,
            borderRadius: 9,
            backgroundColor: "#ef4444",
            fontSize: 9,
            padding: "0 6px",
            border: "2px solid var(--cg-bg-primary)",
            letterSpacing: "0.08em",
          }}
        >
          Live
        </span>
      )}
    </button>
  );
}
