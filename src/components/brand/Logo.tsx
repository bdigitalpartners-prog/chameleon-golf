"use client";

type LogoVariant = "golfEqualizer" | "coursefactor" | "lockup";
type LogoSize = "xs" | "sm" | "md" | "lg";
type LogoTheme = "dark" | "light";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  theme?: LogoTheme;
  className?: string;
}

const sizes: Record<LogoSize, { golf: string; cf: string; lockupGap: string }> = {
  xs: { golf: "text-sm", cf: "text-[10px]", lockupGap: "gap-0.5" },
  sm: { golf: "text-base", cf: "text-xs", lockupGap: "gap-1" },
  md: { golf: "text-xl", cf: "text-sm", lockupGap: "gap-1.5" },
  lg: { golf: "text-3xl", cf: "text-base", lockupGap: "gap-2" },
};

export function Logo({ variant = "golfEqualizer", size = "md", theme = "dark", className = "" }: LogoProps) {
  const s = sizes[size];
  const white = theme === "dark" ? "#f5f5f5" : "#0a0a0a";
  const green = "#4ADE80";
  const gray = theme === "dark" ? "#9CA3AF" : "#6B7280";

  if (variant === "coursefactor") {
    return (
      <span className={`inline-flex items-baseline font-sans tracking-tight ${s.cf} ${className}`} style={{ fontFamily: "Inter, sans-serif" }}>
        <span style={{ color: white, fontWeight: 800 }}>COURSE</span>
        <span style={{ color: gray, fontWeight: 300 }}>factor.ai</span>
      </span>
    );
  }

  if (variant === "lockup") {
    return (
      <div className={`inline-flex flex-col ${s.lockupGap} ${className}`}>
        <GolfEqualizerWordmark color={white} accent={green} className={s.golf} />
        <span className={`inline-flex items-center gap-1 ${s.cf}`} style={{ fontFamily: "Inter, sans-serif" }}>
          <span style={{ color: gray, fontWeight: 300 }}>powered by</span>
          <span style={{ color: white, fontWeight: 800 }}>COURSE</span>
          <span style={{ color: gray, fontWeight: 300 }}>factor.ai</span>
        </span>
      </div>
    );
  }

  // Default: golfEqualizer
  return <GolfEqualizerWordmark color={white} accent={green} className={`${s.golf} ${className}`} />;
}

function GolfEqualizerWordmark({ color, accent, className }: { color: string; accent: string; className?: string }) {
  return (
    <span className={`inline-flex items-baseline font-sans tracking-tight ${className}`} style={{ fontFamily: "Inter, sans-serif" }}>
      <span style={{ color, fontWeight: 200 }}>golf</span>
      <span style={{ color: accent, fontWeight: 800 }}>EQUALIZER</span>
    </span>
  );
}
