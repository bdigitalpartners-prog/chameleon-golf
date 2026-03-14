// CourseFACTOR Theme System
// 3 presets — Midnight, Fairway, Golden Hour

export type ThemePreset = "midnight" | "fairway" | "golden-hour";

export interface ThemeConfig {
  name: string;
  label: string;
  description: string;
  colors: {
    // Backgrounds
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgCard: string;
    bgCardHover: string;
    bgNav: string;
    bgOverlay: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;

    // Accent
    accent: string;
    accentHover: string;
    accentMuted: string;
    accentBg: string;
    accentGlow: string;

    // Borders
    border: string;
    borderSubtle: string;

    // Status
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

// Legacy exports — kept for compatibility, no longer used in UI
export interface CustomOverrides {
  accent?: string | null;
  background?: string | null;
  card?: string | null;
  text?: string | null;
}

export const accentPresets: { name: string; value: string }[] = [];
export const backgroundPresets: { name: string; value: string }[] = [];
export const cardPresets: { name: string; value: string }[] = [];
export const textPresets: { name: string; value: string }[] = [];

export function generateAccentFromHex(hex: string) {
  return { accent: hex, accentHover: hex, accentMuted: hex, accentBg: hex, accentGlow: hex };
}
export function generateBackgroundFromHex(hex: string) {
  return { bgPrimary: hex, bgSecondary: hex, bgTertiary: hex, bgNav: hex };
}
export function generateCardFromHex(hex: string) {
  return { bgCard: hex, bgCardHover: hex, border: hex, borderSubtle: hex };
}
export function generateTextFromHex(hex: string) {
  return { textPrimary: hex, textSecondary: hex, textMuted: hex };
}
