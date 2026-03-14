import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/golf-utils";

interface StepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  parJump?: number;
  className?: string;
}

export function Stepper({ value, onChange, min = 0, max = 20, parJump, className }: StepperProps) {
  return (
    <div className={cn("flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/50", className)}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200/50 flex items-center justify-center text-slate-600 active:scale-95 hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
        type="button"
      >
        <Minus size={20} />
      </button>
      
      <div className="w-10 text-center font-display font-bold text-2xl tracking-tighter text-slate-800 tabular-nums">
        {value === 0 ? "-" : value}
      </div>
      
      <button
        onClick={() => {
          if (value === 0 && parJump) {
            onChange(parJump);
          } else {
            onChange(Math.min(max, value + 1));
          }
        }}
        className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200/50 flex items-center justify-center text-slate-600 active:scale-95 hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
        type="button"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}
