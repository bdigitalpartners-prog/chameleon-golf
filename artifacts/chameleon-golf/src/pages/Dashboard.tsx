import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Activity, Trophy, TrendingDown, Flag } from "lucide-react";
import { useGetRounds } from "@workspace/api-client-react";
import { RoundCard } from "@/components/rounds/RoundCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: rounds, isLoading } = useGetRounds();

  const completedRounds = rounds?.filter(r => r.totalScore && r.totalScore > 0) || [];
  const bestScore = completedRounds.length > 0 
    ? Math.min(...completedRounds.map(r => r.totalScore!))
    : null;
  const bestRelative = completedRounds.length > 0
    ? Math.min(...completedRounds.map(r => r.totalScore! - r.totalPar!))
    : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8"
    >
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-primary/10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-emerald-800/80 z-10 mix-blend-multiply" />
        <img 
          src={`${import.meta.env.BASE_URL}images/golf-hero.png`} 
          alt="Golf Course" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 p-8 sm:p-10 flex flex-col items-start text-white">
          <Badge className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md mb-4 border-white/30">
            Welcome back
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-2">Ready for the green?</h2>
          <p className="text-emerald-50 mb-6 max-w-md text-lg">Track your rounds, monitor your stats, and lower your handicap.</p>
          <Link href="/rounds/new">
            <Button size="lg" className="bg-white text-emerald-900 hover:bg-slate-50 font-bold shadow-lg text-base h-12 px-8 rounded-xl">
              Start New Round
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard 
          icon={<Activity className="text-blue-500" />} 
          label="Total Rounds" 
          value={completedRounds.length.toString()} 
          loading={isLoading} 
        />
        <StatCard 
          icon={<Trophy className="text-amber-500" />} 
          label="Best Score" 
          value={bestScore ? bestScore.toString() : "-"} 
          loading={isLoading} 
        />
        <StatCard 
          icon={<TrendingDown className="text-emerald-500" />} 
          label="Best vs Par" 
          value={bestRelative !== null ? (bestRelative <= 0 ? `${bestRelative}` : `+${bestRelative}`) : "-"} 
          loading={isLoading} 
        />
      </div>

      {/* Recent Rounds */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-display text-2xl font-bold">Recent Rounds</h3>
          <Link href="/rounds" className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : rounds && rounds.length > 0 ? (
          <div className="space-y-4">
            {rounds.slice(0, 5).map(round => (
              <RoundCard key={round.id} round={round} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Flag size={32} />
            </div>
            <h3 className="text-lg font-bold font-display mb-1">No rounds yet</h3>
            <p className="text-muted-foreground mb-6">Your first tee time awaits. Head to the course!</p>
            <Link href="/rounds/new">
              <Button>Play First Round</Button>
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, loading }: { icon: React.ReactNode, label: string, value: string, loading: boolean }) {
  return (
    <div className="bg-card border border-border/60 p-5 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
          {icon}
        </div>
        <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <div className="text-3xl font-display font-bold tabular-nums tracking-tight">
          {value}
        </div>
      )}
    </div>
  );
}

// Stub for Badge if it doesn't exist
function Badge({ className, children }: { className?: string, children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>{children}</span>
}
