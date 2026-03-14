import { Card } from "@/components/ui/card";
import { MapPin, Flag } from "lucide-react";
import type { Course } from "@workspace/api-client-react";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Card className="p-5 hover-elevate border border-slate-200/60 shadow-sm transition-all duration-300 group hover:border-primary/20">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">{course.name}</h3>
          <div className="flex items-center text-sm text-muted-foreground mt-1 gap-1">
            <MapPin size={14} />
            <span>{course.location || "Unknown Location"}</span>
          </div>
        </div>
        <div className="bg-primary/10 text-primary p-2 rounded-lg">
          <Flag size={20} />
        </div>
      </div>
      
      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Holes</span>
          <span className="font-display font-bold text-lg">{course.holes}</span>
        </div>
        <div className="h-8 w-px bg-slate-200"></div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Par</span>
          <span className="font-display font-bold text-lg">{course.par}</span>
        </div>
      </div>
    </Card>
  );
}
