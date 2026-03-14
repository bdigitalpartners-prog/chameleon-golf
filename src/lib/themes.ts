// Chameleon Golf Theme System
// 3 presets + user accent color override

export type ThemePreset = "midnight" | "fairway" | "golden-hour";

export interface ThemeConfig {
  name: string;
  label: string;
  description: string;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgCard: string;
    bgCardHover: string;
    bgNav: string;
    bgOverlay: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    accent: string;
    accentHover: string;
    accentMuted: string;
    accentBg: string;
    accentGlow: string;
    border: string;
    borderSubtle: string;
    success: string;
    warning: string;
    error: string;
  };
}

export const themePresets: Record<ThemePreset, ThemeConfig> = {
  midnight: {
    name: "midnight",
    label: "Midnight",
    description: "Sleek black & charcoal with green accents",
    colors: {
      bgPrimary: "#0a0a0a",
      bgSecondary: "#111111",
      bgTertiary: "#1a1a1a",
      bgCard: "#141414",
      bgCardHover: "#1c1c1c",
      bgNav: "rgba(10, 10, 10, 0.95)",
      bgOverlay: "rgba(0, 0, 0, 0.7)",
      textPrimary: "#f5f5f5",
      textSecondary: "#a3a3a3",
      textMuted: "#666666",
      textInverse: "#0a0a0a",
      accent: "#22c55e",
      accentHover: "#16a34a",
      accentMuted: "#166534",
      accentBg: "rgba(34, 197, 94, 0.1)",
      accentGlow: "rgba(34, 197, 94, 0.25)",
      border: "#262626",
      borderSubtle: "#1a1a1a",
      success: "#22c55e",
      warning: "#eab308",
      error: "#ef4444",
    },
  },
  fairway: {
    name: "fairway",
    label: "Fairway",
    description: "Dark forest green with turf-inspired tones",
    colors: {
      bgPrimary: "#0c1a0f",
      bgSecondary: "#0f2214",
      bgTertiary: "#132b18",
      bgCard: "#0f2214",
      bgCardHover: "#163320",
      bgNav: "rgba(12, 26, 15, 0.95)",
      bgOverlay: "rgba(0, 0, 0, 0.7)",
      textPrimary: "#e8f5e9",
      textSecondary: "#a5d6a7",
      textMuted: "#5a7d5e",
      textInverse: "#0c1a0f",
      accent: "#4caf50",
      accentHover: "#388e3c",
      accentMuted: "#1b5e20",
      accentBg: "rgba(76, 175, 80, 0.12)",
      accentGlow: "rgba(76, 175, 80, 0.25)",
      border: "#1e3a22",
      borderSubtle: "#162e1a",
      success: "#66bb6a",
      warning: "#fdd835",
      error: "#ef5350",
    },
  },
  "golden-hour": {
    name: "golden-hour",
    label: "Golden Hour",
    description: "Deep navy with warm gold & classic serif accents",
    colors: {
      bgPrimary: "#0b0f1a",
      bgSecondary: "#0f1525",
      bgTertiary: "#141c30",
      bgCard: "#111828",
      bgCardHover: "#182035",
      bgNav: "rgba(11, 15, 26, 0.95)",
      bgOverlay: "rgba(0, 0, 0, 0.7)",
      textPrimary: "#f0ead6",
      textSecondary: "#a8a08e",
      textMuted: "#5c5647",
      textInverse: "#0b0f1a",
      accent: "#d4a843",
      accentHover: "#b8922e",
      accentMuted: "#7a6120",
      accentBg: "rgba(212, 168, 67, 0.1)",
      accentGlow: "rgba(212, 168, 67, 0.25)",
      border: "#242a3a",
      borderSubtle: "#1a2030",
      success: "#66bb6a",
      warning: "#d4a843",
      error: "#ef5350",
    },
  },
};

export const defaultTheme: ThemePreset = "midnight";

export const accentPresets = [
  { name: "Green", value: "#22c55e" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
  { name: "Gold", value: "#d4a843" },
  { name: "Red", value: "#ef4444" },
];

export function generateAccentFromHex(hex: string) {
  return {
    accent: hex,
    accentHover: adjustBrightness(hex, -15),
    accentMuted: adjustBrightness(hex, -40),
    accentBg: hexToRgba(hex, 0.1),
    accentGlow: hexToRgba(hex, 0.25),
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function adjustBrightness(hex: string, percent: number): string {
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.round(2.55 * percent)));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.round(2.55 * percent)));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(2.55 * percent)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
