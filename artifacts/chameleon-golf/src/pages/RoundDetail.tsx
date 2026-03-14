import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Calendar, MapPin, User, Trophy, Play } from "lucide-react";
import { useGetRound } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getRelativeScoreStr, getScoreColorClass } from "@/lib/golf-utils";
import type { Score } from "@workspace/api-client-react";

export default function RoundDetail() {
  const [, params] = useRoute("/rounds/:id");
  const roundId = parseInt(params?.id || "0");
  const { data: round, isLoading } = useGetRound(roundId);

  if (isLoading) {
    return <div className="space-y-4 p-8"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }
  if (!round) return <div className="p-8 text-center">Round not found</div>;

  const sortedScores = [...round.scores].sort((a, b) => a.holeNumber - b.holeNumber);
  const isInProgress = !round.totalScore || round.totalScore === 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover-elevate">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <h1 className="font-display text-3xl font-bold">Round Summary</h1>
      </div>

      <Card className="p-6 md:p-8 bg-gradient-to-br from-card to-slate-50 border-slate-200/60 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div className="space-y-3">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-primary flex items-center gap-2">
              <MapPin className="text-primary/60" /> {round.courseName}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <User size={16} className="text-slate-400" /> {round.playerName}
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <Calendar size={16} className="text-slate-400" /> {format(new Date(round.date), 'MMMM d, yyyy')}
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[160px]">
            {isInProgress ? (
              <div className="text-center">
                <div className="text-amber-600 font-bold mb-3">In Progress</div>
                <Link href={`/rounds/${round.id}/play`}>
                  <Button className="w-full gap-2">
                    <Play size={16} /> Resume
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">Final Score</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-5xl tabular-nums">{round.totalScore}</span>
                  <span className={`text-2xl ${getScoreColorClass(round.totalScore, round.totalPar)}`}>
                    {getRelativeScoreStr(round.totalScore, round.totalPar)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {!isInProgress && sortedScores.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-2xl font-bold flex items-center gap-2">
            <Trophy size={24} className="text-amber-500" /> Scorecard
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-3">
            {sortedScores.map((score: Score) => (
              <Card key={score.id} className="overflow-hidden text-center hover-elevate border-slate-200/50">
                <div className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold py-1.5 tracking-wider border-b border-slate-200/50">
                  Hole {score.holeNumber}
                </div>
                <div className="p-4 relative">
                  <div className={`font-display font-bold text-4xl tabular-nums leading-none ${getScoreColorClass(score.strokes, score.par)}`}>
                    {score.strokes}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground mt-2 bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-100">
                    Par {score.par}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
