"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { LeagueKey, LeagueData, PlayerData } from "./types";

const API_CONFIG = {
  pga: {
    scoreboard: "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard",
    header: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=golf&league=pga",
    label: "PGA Tour",
  },
  liv: {
    scoreboard: "https://site.api.espn.com/apis/site/v2/sports/golf/liv/scoreboard",
    header: "https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=golf&league=liv",
    label: "LIV Golf",
  },
} as const;

const REFRESH_INTERVAL_LIVE = 60_000; // 60 seconds when live
const REFRESH_INTERVAL_IDLE = 300_000; // 5 minutes when not live

async function fetchLeagueData(league: LeagueKey): Promise<LeagueData | null> {
  try {
    const [scoreboardRes, headerRes] = await Promise.all([
      fetch(API_CONFIG[league].scoreboard),
      fetch(API_CONFIG[league].header),
    ]);

    const scoreboard = await scoreboardRes.json();
    const header = await headerRes.json();

    // Extract header event for venue/purse info
    let headerEvent: Record<string, unknown> | null = null;
    const sports = header?.sports as Array<Record<string, unknown>> | undefined;
    if (sports) {
      for (const s of sports) {
        const leagues = s.leagues as Array<Record<string, unknown>> | undefined;
        if (leagues) {
          for (const l of leagues) {
            const events = l.events as Array<Record<string, unknown>> | undefined;
            if (events?.length) {
              headerEvent = events[0];
            }
          }
        }
      }
    }

    const events = scoreboard?.events as Array<Record<string, unknown>> | undefined;
    if (!events?.length) return null;

    const event = events[0];
    const competitions = event.competitions as Array<Record<string, unknown>> | undefined;
    const competition = competitions?.[0];
    if (!competition) return null;

    const statusObj = competition.status as Record<string, unknown> | undefined;
    const statusType = statusObj?.type as Record<string, unknown> | undefined;
    const competitors = competition.competitors as Array<Record<string, unknown>> | undefined;

    // Build top 10
    const top10: PlayerData[] = (competitors || []).slice(0, 10).map((c, i) => {
      const athlete = c.athlete as Record<string, unknown> | undefined;
      const flag = athlete?.flag as Record<string, unknown> | undefined;
      const linescores = c.linescores as Array<Record<string, unknown>> | undefined;

      return {
        position: (c.order as number) || i + 1,
        name: (athlete?.displayName as string) || "Unknown",
        shortName: (athlete?.shortName as string) || "",
        flag: (flag?.href as string) || "",
        country: (flag?.alt as string) || "",
        score: (c.score as string) || "E",
        rounds: (linescores || []).map((ls) => ({
          period: ls.period as number,
          score: ls.displayValue as string,
          strokes: ls.value as number,
        })),
      };
    });

    // Parse venue from header
    const locationStr = (headerEvent?.location as string) || "";
    let courseName = "";
    let courseLocation = "";
    if (locationStr.includes(" - ")) {
      const parts = locationStr.split(" - ");
      courseName = parts[0].trim();
      courseLocation = parts.slice(1).join(" - ").trim();
    } else {
      courseName = locationStr;
    }

    const eventLinks = event.links as Array<Record<string, unknown>> | undefined;

    return {
      league: API_CONFIG[league].label,
      leagueSlug: league,
      eventName: (event.name as string) || "",
      courseName,
      courseLocation,
      purse: (headerEvent?.displayPurse as string) || "",
      defendingChamp: (headerEvent?.defendingChampion as string) || "",
      status: {
        state: (statusType?.state as "pre" | "in" | "post") || "pre",
        detail: (statusType?.detail as string) || "",
        shortDetail: (statusType?.shortDetail as string) || "",
        completed: (statusType?.completed as boolean) || false,
        period: (statusObj?.period as number) || 0,
      },
      broadcast: (headerEvent?.broadcast as string) || (competition.broadcast as string) || "",
      players: top10,
      link:
        (headerEvent?.link as string) || (eventLinks?.[0]?.href as string) || "",
    };
  } catch (err) {
    console.error(`[Leaderboard] Failed to fetch ${league} data:`, err);
    return null;
  }
}

export function useLeaderboard() {
  const [leagueData, setLeagueData] = useState<Record<LeagueKey, LeagueData | null>>({
    pga: null,
    liv: null,
  });
  const [activeLeague, setActiveLeague] = useState<LeagueKey>("pga");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    const [pga, liv] = await Promise.all([
      fetchLeagueData("pga"),
      fetchLeagueData("liv"),
    ]);

    setLeagueData({ pga, liv });
    setLastUpdated(new Date());
    setLoading(false);

    // Auto-select: prefer live event, then whichever has data
    if (pga?.status.state === "in") {
      setActiveLeague("pga");
    } else if (liv?.status.state === "in") {
      setActiveLeague("liv");
    }
  }, []);

  useEffect(() => {
    fetchAll();

    // Dynamic refresh interval based on live status
    const scheduleRefresh = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const isLive =
        leagueData.pga?.status.state === "in" ||
        leagueData.liv?.status.state === "in";
      const interval = isLive ? REFRESH_INTERVAL_LIVE : REFRESH_INTERVAL_IDLE;
      intervalRef.current = setInterval(fetchAll, interval);
    };

    scheduleRefresh();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAll]);

  const isLive =
    leagueData.pga?.status.state === "in" ||
    leagueData.liv?.status.state === "in";

  const hasAnyData =
    (leagueData.pga?.players?.length ?? 0) > 0 ||
    (leagueData.liv?.players?.length ?? 0) > 0;

  return {
    leagueData,
    activeLeague,
    setActiveLeague,
    lastUpdated,
    loading,
    isLive,
    hasAnyData,
    currentData: leagueData[activeLeague],
  };
}
