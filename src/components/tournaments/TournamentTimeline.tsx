"use client";

interface Tournament {
  id: number;
  tournament_name: string;
  tour: string;
  year: number;
  winner_name: string | null;
  winner_score: string | null;
  runner_up: string | null;
  notable_moments: string | null;
}

interface TournamentTimelineProps {
  tournaments: Tournament[];
}

function isUnderPar(score: string | null): boolean {
  if (!score) return false;
  return score.startsWith("-");
}

function TourBadge({ tour }: { tour: string }) {
  const colors: Record<string, string> = {
    "PGA Tour": "bg-blue-600/20 text-blue-400 border-blue-500/30",
    "LPGA": "bg-pink-600/20 text-pink-400 border-pink-500/30",
    "DP World Tour": "bg-purple-600/20 text-purple-400 border-purple-500/30",
    "Champions Tour": "bg-amber-600/20 text-amber-400 border-amber-500/30",
    "LIV Golf": "bg-red-600/20 text-red-400 border-red-500/30",
    "Major": "bg-[#00FF85]/20 text-[#00FF85] border-[#00FF85]/30",
    "Ryder Cup": "bg-yellow-600/20 text-yellow-400 border-yellow-500/30",
    "Presidents Cup": "bg-cyan-600/20 text-cyan-400 border-cyan-500/30",
    "US Amateur": "bg-orange-600/20 text-orange-400 border-orange-500/30",
  };

  const cls = colors[tour] || "bg-[#222] text-[#9CA3AF] border-[#333]";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${cls}`}>
      {tour}
    </span>
  );
}

export function TournamentTimeline({ tournaments }: TournamentTimelineProps) {
  if (!tournaments.length) {
    return (
      <div className="text-center py-12">
        <p className="text-[#9CA3AF]">No tournament history available for this course.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-[#222]" />

      <div className="space-y-6">
        {tournaments.map((t, i) => (
          <div key={t.id || i} className="relative flex items-start gap-4 pl-10">
            {/* Dot on timeline */}
            <div className="absolute left-[11px] top-2 w-2.5 h-2.5 rounded-full bg-[#00FF85] ring-2 ring-[#0A0A0A]" />

            <div className="flex-1 bg-[#111111] border border-[#222222] rounded-lg p-4 hover:border-[#00FF85]/30 transition-colors">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[#00FF85] font-bold text-lg">{t.year}</span>
                {t.tour && <TourBadge tour={t.tour} />}
              </div>
              <h4 className="text-white font-semibold text-sm mb-1">{t.tournament_name}</h4>
              {t.winner_name && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#9CA3AF]">Winner:</span>
                  <span className="text-white font-medium">{t.winner_name}</span>
                  {t.winner_score && (
                    <span className={`font-mono font-bold ${isUnderPar(t.winner_score) ? "text-[#00FF85]" : "text-white"}`}>
                      ({t.winner_score})
                    </span>
                  )}
                </div>
              )}
              {t.runner_up && (
                <div className="text-xs text-[#9CA3AF] mt-1">Runner-up: {t.runner_up}</div>
              )}
              {t.notable_moments && (
                <p className="text-xs text-[#9CA3AF] mt-2 italic leading-relaxed">{t.notable_moments}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
