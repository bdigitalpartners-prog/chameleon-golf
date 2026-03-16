"use client";

/**
 * Generates a visually appealing, deterministic placeholder thumbnail
 * for courses without a primary image. Uses course style & name
 * to pick a themed gradient and displays a subtle golf icon + course initial.
 */

// Style-specific color palettes (gradient from/to + accent)
const STYLE_THEMES: Record<string, { from: string; to: string; accent: string }> = {
  Links:      { from: "#2d4a3e", to: "#1a332a", accent: "#6b9e7e" },
  Parkland:   { from: "#1e3a2f", to: "#0f1f18", accent: "#4a8a6a" },
  Desert:     { from: "#4a3928", to: "#2c1f12", accent: "#c4956a" },
  Mountain:   { from: "#2a3545", to: "#141c28", accent: "#6888a8" },
  Heathland:  { from: "#3a2d42", to: "#1e1624", accent: "#8a6e9a" },
  Coastal:    { from: "#1c3a4a", to: "#0e1e28", accent: "#5a9ab5" },
  Woodland:   { from: "#283a20", to: "#141e10", accent: "#5a8a48" },
  Moorland:   { from: "#3a3228", to: "#1e1a14", accent: "#8a7a5a" },
  Tropical:   { from: "#1a3a30", to: "#0e2018", accent: "#3aaa7a" },
  Sandbelt:   { from: "#3a3425", to: "#1e1a12", accent: "#aa9a6a" },
};

const DEFAULT_THEME = { from: "#1a2a22", to: "#0d1510", accent: "#3a8a5a" };

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getTheme(courseStyle: string | null | undefined, courseName: string) {
  if (courseStyle) {
    // Normalize and check
    const normalized = courseStyle.trim();
    for (const [key, theme] of Object.entries(STYLE_THEMES)) {
      if (normalized.toLowerCase().includes(key.toLowerCase())) return theme;
    }
  }
  // Deterministic fallback based on name hash
  const themes = Object.values(STYLE_THEMES);
  return themes[hashCode(courseName) % themes.length];
}

// SVG golf flag icon as a subtle watermark
function GolfFlag({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-16 w-16 opacity-20"
    >
      <path d="M4 22V4c0 0 2-2 6-2s6 2 6 2v10c0 0-2 2-6 2s-6-2-6-2" />
      <line x1="4" y1="22" x2="4" y2="4" />
    </svg>
  );
}

interface CoursePlaceholderProps {
  courseName: string;
  courseStyle?: string | null;
  size?: "card" | "thumbnail";
}

export function CoursePlaceholder({ courseName, courseStyle, size = "card" }: CoursePlaceholderProps) {
  const theme = getTheme(courseStyle, courseName);
  const initial = courseName.replace(/^(The |A |An )/i, "").charAt(0).toUpperCase();

  if (size === "thumbnail") {
    return (
      <div
        className="flex h-full w-full items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
        }}
      >
        <span
          className="text-sm font-bold opacity-60"
          style={{ color: theme.accent }}
        >
          {initial}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full items-center justify-center relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
      }}
    >
      {/* Subtle topographic-style lines */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 30% 50%, ${theme.accent} 0%, transparent 70%),
            radial-gradient(ellipse at 70% 30%, ${theme.accent} 0%, transparent 60%)
          `,
        }}
      />
      {/* Golf flag watermark */}
      <div className="absolute bottom-2 right-3 opacity-40">
        <GolfFlag color={theme.accent} />
      </div>
      {/* Large initial */}
      <span
        className="text-5xl font-bold opacity-30 select-none"
        style={{ color: theme.accent, fontFamily: "var(--font-display, serif)" }}
      >
        {initial}
      </span>
      {/* Course style label */}
      {courseStyle && (
        <span
          className="absolute bottom-3 left-3 text-[10px] font-medium uppercase tracking-wider opacity-40"
          style={{ color: theme.accent }}
        >
          {courseStyle.split("/")[0].trim()}
        </span>
      )}
    </div>
  );
}
