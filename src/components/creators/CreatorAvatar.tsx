"use client";

const CREATOR_COLORS: Record<string, string> = {
  "no-laying-up": "#F59E0B",
  "the-fried-egg": "#EF4444",
  "random-golf-club": "#10B981",
  "erik-anders-lang": "#8B5CF6",
  "rick-shiels": "#3B82F6",
  "golf-digest": "#EC4899",
  "links-magazine": "#06B6D4",
};

export function CreatorAvatar({ name, handle, size = "md" }: { name: string; handle?: string; size?: "sm" | "md" | "lg" }) {
  const color = CREATOR_COLORS[handle || ""] || "#6B7280";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-lg",
  };

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold flex-shrink-0 ${sizeClasses[size]}`}
      style={{ backgroundColor: color, color: "#FFFFFF" }}
    >
      {initials}
    </div>
  );
}
