import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useGetRound, useGetCourse } from "@workspace/api-client-react";
import { useSaveScores } from "@/hooks/use-golf";
import { Stepper } from "@/components/ui-custom/Stepper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getScoreColorClass } from "@/lib/golf-utils";
import type { CreateScore } from "@workspace/api-client-react";

type HoleState = { holeNumber: number; par: number; strokes: number };

export default function PlayRound() {
  const [, params] = useRoute("/rounds/:id/play");
  const [, setLocation] = useLocation();
  const roundId = parseInt(params?.id || "0");

  const { data: round, isLoading: roundLoading } = useGetRound(roundId);
  const { data: course, isLoading: courseLoading } = useGetCourse(round?.courseId || 0, {
    query: { enabled: !!round?.courseId }
  });

  const saveScores = useSaveScores(roundId);
  const [scores, setScores] = useState<Record<number, HoleState>>({});

  // Initialize scores when data is loaded
  useEffect(() => {
    if (course && round) {
      const initial: Record<number, HoleState> = {};
      for (let i = 1; i <= course.holes; i++) {
        const existing = round.scores.find(s => s.holeNumber === i);
        initial[i] = existing 
          ? { holeNumber: i, par: existing.par, strokes: existing.strokes } 
          : { holeNumber: i, par: 4, strokes: 0 };
      }
      setScores(initial);
    }
  }, [course, round]);

  const handleUpdate = (holeNumber: number, field: "par" | "strokes", value: number) => {
    setScores(prev => ({
      ...prev,
      [holeNumber]: { ...prev[holeNumber], [field]: value }
    }));
  };

  const handleComplete = () => {
    const payloadScores: CreateScore[] = Object.values(scores)
      .filter(s => s.strokes > 0)
      .map(s => ({
        holeNumber: s.holeNumber,
        par: s.par,
        strokes: s.strokes,
      }));

    saveScores.mutate({ id: roundId, data: { scores: payloadScores } }, {
      onSuccess: () => {
        // Compute total to see if we should trigger confetti
        const totalRelative = payloadScores.reduce((acc, curr) => acc + (curr.strokes - curr.par), 0);
        if (totalRelative < 0) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#34d399', '#f8fafc', '#0ea5e9']
          });
        }
        setLocation(`/rounds/${roundId}`);
      }
    });
  };

  if (roundLoading || courseLoading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }
  if (!round || !course) return <div className="p-8">Round not found</div>;

  const holesArr = Array.from({ length: course.holes }, (_, i) => i + 1);
  const currentStrokes = Object.values(scores).reduce((sum, s) => sum + s.strokes, 0);
  const currentPar = Object.values(scores).filter(s => s.strokes > 0).reduce((sum, s) => sum + s.par, 0);
  const diff = currentStrokes - currentPar;
  const relativeStr = diff === 0 ? "E" : diff > 0 ? `+${diff}` : `${diff}`;

  return (
    <div className="relative pb-24">
      {/* Sticky Header Summary */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl -mx-4 sm:-mx-8 px-4 sm:px-8 py-4 mb-6 border-b border-border/50 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="font-display font-bold text-xl leading-tight">{course.name}</h2>
          <p className="text-sm font-medium text-muted-foreground">{round.playerName}</p>
        </div>
        <div className="text-right flex items-center gap-3">
          <div className="flex flex-col items-end">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">To Par</div>
            <div className={`font-display font-bold text-xl ${getScoreColorClass(currentStrokes, currentPar)}`}>
              {currentStrokes > 0 ? relativeStr : "-"}
            </div>
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div className="flex flex-col items-end">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Total</div>
            <div className="font-display font-bold text-3xl leading-none text-foreground tabular-nums">
              {currentStrokes > 0 ? currentStrokes : "-"}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Holes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {holesArr.map(holeNum => {
          const state = scores[holeNum];
          if (!state) return null;
          
          const isPlayed = state.strokes > 0;
          
          return (
            <motion.div key={holeNum} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className={`overflow-hidden border-2 transition-all duration-300 ${isPlayed ? 'border-primary/20 shadow-sm bg-primary/[0.02]' : 'border-border/50 bg-card'}`}>
                <div className={`py-1.5 px-4 flex justify-between items-center text-xs font-bold uppercase tracking-wider ${isPlayed ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                  <span>Hole {holeNum}</span>
                  {isPlayed && <span className={getScoreColorClass(state.strokes, state.par)}>{getRelativeScoreStr(state.strokes, state.par)}</span>}
                </div>
                <div className="p-5 flex justify-between gap-6">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-muted-foreground mb-2 text-center">Par</div>
                    <Stepper 
                      value={state.par} 
                      onChange={(v) => handleUpdate(holeNum, "par", v)} 
                      min={3} max={6}
                      className="justify-center"
                    />
                  </div>
                  <div className="w-px bg-slate-100"></div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground mb-2 text-center">Strokes</div>
                    <Stepper 
                      value={state.strokes} 
                      onChange={(v) => handleUpdate(holeNum, "strokes", v)} 
                      min={0} max={15} parJump={state.par}
                      className={`justify-center ${isPlayed ? 'bg-primary/5 border-primary/20' : ''}`}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t z-40 md:left-64 flex justify-end shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <Button
          size="lg"
          className="w-full sm:w-auto h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20 rounded-xl"
          onClick={handleComplete}
          disabled={saveScores.isPending || currentStrokes === 0}
        >
          {saveScores.isPending ? "Saving..." : "Save & Finish Round"}
        </Button>
      </div>
    </div>
  );
}
