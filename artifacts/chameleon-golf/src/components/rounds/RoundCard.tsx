import { Link } from "wouter";
import { format } from "date-fns";
import { Calendar, Trash2, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRelativeScoreStr, getScoreColorClass } from "@/lib/golf-utils";
import type { Round } from "@workspace/api-client-react";
import { useDeleteRound } from "@/hooks/use-golf";

export function RoundCard({ round }: { round: Round }) {
  const deleteRound = useDeleteRound();
  const isInProgress = !round.totalScore || round.totalScore === 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete this round?`)) {
      deleteRound.mutate({ id: round.id });
    }
  };

  const targetPath = isInProgress ? `/rounds/${round.id}/play` : `/rounds/${round.id}`;

  return (
    <Link href={targetPath} className="block">
      <Card className="p-5 hover-elevate border border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 relative group">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-foreground mb-1">{round.courseName || "Unknown Course"}</h3>
            <div className="flex items-center text-sm text-muted-foreground gap-1.5">
              <Calendar size={14} />
              <span>{format(new Date(round.date), 'MMM d, yyyy')}</span>
              <span className="mx-1">•</span>
              <span className="font-medium text-slate-700">{round.playerName}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isInProgress ? (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">In Progress</Badge>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDelete}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-1"
                disabled={deleteRound.isPending}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        </div>

        {!isInProgress && (
          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
            <div className="bg-primary/5 p-2 rounded-lg text-primary">
              <Trophy size={20} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-3xl tabular-nums tracking-tight">
                {round.totalScore}
              </span>
              <span className={`font-bold text-lg ${getScoreColorClass(round.totalScore, round.totalPar)}`}>
                ({getRelativeScoreStr(round.totalScore, round.totalPar)})
              </span>
            </div>
            <div className="ml-auto text-sm text-muted-foreground">
              Par {round.totalPar}
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}
