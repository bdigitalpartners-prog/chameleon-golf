import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRelativeScoreStr(strokes: number | undefined | null, par: number | undefined | null): string {
  if (!strokes || !par) return "-";
  const diff = strokes - par;
  if (diff === 0) return "E";
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}

export function getScoreColorClass(strokes: number | undefined | null, par: number | undefined | null): string {
  if (!strokes || !par) return "text-muted-foreground";
  const diff = strokes - par;
  if (diff < 0) return "text-emerald-600 font-bold";
  if (diff > 0) return "text-rose-500 font-bold";
  return "text-slate-600 font-bold";
}
