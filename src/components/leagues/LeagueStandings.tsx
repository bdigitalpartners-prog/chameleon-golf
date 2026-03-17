"use client";

import { useState, useEffect } from "react";

interface Standing {
  id: string;
  rank: number;
  totalPoints: number;
  roundsPlayed: number;
  avgEqPoints: number;
  user: { id: string; name: string | null; image: string | null; handicapIndex?: number | null };
}

interface LeagueStandingsProps {
  circleId: string;
  seasonId?: string;
}

export default function LeagueStandings({ circleId, seasonId }: LeagueStandingsProps) {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [season, setSeason] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = seasonId ? `?seasonId=${seasonId}` : "";
    fetch(`/api/circles/${circleId}/league/standings${params}`)
      .then((r) => r.json())
      .then((data) => {
        setStandings(data.standings || []);
        setSeason(data.season);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [circleId, seasonId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-emerald-400" />
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No standings yet. Submit rounds to see the leaderboard.</p>
      </div>
    );
  }

  return (
    <div>
      {season && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">{season.name}</h3>
          <p className="text-sm text-gray-500">
            {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-left text-sm text-gray-500">
              <th className="px-4 py-3 w-12">#</th>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3 text-right">Points</th>
              <th className="px-4 py-3 text-right hidden sm:table-cell">Rounds</th>
              <th className="px-4 py-3 text-right hidden sm:table-cell">Avg EQ</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s) => (
              <tr key={s.id} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30">
                <td className="px-4 py-3">
                  <span className={`font-bold ${s.rank <= 3 ? "text-emerald-400" : "text-gray-500"}`}>
                    {s.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {s.user.image ? (
                      <img src={s.user.image} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                        {(s.user.name || "?")[0]}
                      </div>
                    )}
                    <span className="text-white">{s.user.name || "Unknown"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-400">{s.totalPoints.toFixed(1)}</td>
                <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">{s.roundsPlayed}</td>
                <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">{s.avgEqPoints.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
