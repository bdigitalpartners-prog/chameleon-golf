"use client";

import { useState } from "react";
import { LeaderboardLauncher } from "./LeaderboardLauncher";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { useLeaderboard } from "./use-leaderboard";
import "./leaderboard-styles.css";

export function LeaderboardWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    leagueData,
    activeLeague,
    setActiveLeague,
    lastUpdated,
    loading,
    isLive,
    hasAnyData,
    currentData,
  } = useLeaderboard();

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  // Don't render the launcher if there's no data at all and we're done loading
  if (!loading && !hasAnyData) return null;

  return (
    <>
      {/* Panel */}
      {isOpen && (
        <LeaderboardPanel
          activeLeague={activeLeague}
          onLeagueChange={setActiveLeague}
          onClose={() => setIsOpen(false)}
          data={currentData}
          lastUpdated={lastUpdated}
        />
      )}

      {/* FAB Launcher */}
      <LeaderboardLauncher
        isOpen={isOpen}
        isLive={isLive}
        onClick={handleToggle}
      />
    </>
  );
}
