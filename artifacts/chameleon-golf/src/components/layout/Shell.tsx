import { Link, useLocation } from "wouter";
import { Flag, LayoutDashboard, Map, Plus } from "lucide-react";
import { cn } from "@/lib/golf-utils";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  // Hide bottom nav if we are actively playing a round to give more screen space
  const isPlayingRound = location.includes("/play");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card fixed inset-y-0 z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <Flag size={24} />
          </div>
          <h1 className="font-display font-bold text-xl text-foreground">Chameleon Golf</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/" className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium hover-elevate",
            location === "/" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
          )}>
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link href="/courses" className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium hover-elevate",
            location.startsWith("/courses") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
          )}>
            <Map size={20} />
            Courses
          </Link>
        </nav>
        
        <div className="p-4">
          <Link href="/rounds/new" className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-3 px-4 rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all active:translate-y-0">
            <Plus size={20} />
            New Round
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 w-full relative",
        "md:ml-64", 
        !isPlayingRound ? "pb-24 md:pb-8" : "pb-0 md:pb-0" // Room for bottom nav on mobile
      )}>
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-4 py-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="text-primary"><Flag size={20} /></div>
            <h1 className="font-display font-bold text-lg">Chameleon Golf</h1>
          </div>
        </header>
        
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto h-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      {!isPlayingRound && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-card md:hidden flex justify-around items-end pb-safe pt-2 px-2 z-50 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <Link href="/" className={cn(
            "flex flex-col items-center p-2 mb-2 transition-colors",
            location === "/" ? "text-primary" : "text-muted-foreground"
          )}>
            <LayoutDashboard size={24} className={location === "/" ? "fill-primary/20" : ""} />
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </Link>
          
          <Link href="/rounds/new" className="flex flex-col items-center group -mt-8 relative z-10">
            <div className="bg-primary text-primary-foreground rounded-full p-4 shadow-xl shadow-primary/30 group-hover:scale-105 group-active:scale-95 transition-transform mb-1 border-4 border-background">
              <Plus size={28} />
            </div>
            <span className="text-[10px] font-semibold text-primary">Play</span>
          </Link>
          
          <Link href="/courses" className={cn(
            "flex flex-col items-center p-2 mb-2 transition-colors",
            location.startsWith("/courses") ? "text-primary" : "text-muted-foreground"
          )}>
            <Map size={24} className={location.startsWith("/courses") ? "fill-primary/20" : ""} />
            <span className="text-[10px] mt-1 font-medium">Courses</span>
          </Link>
        </div>
      )}
    </div>
  );
}
