export interface Theme {
  id: string;
  name: string;
  // Core background layers
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgCard: string;
  bgCardHover: string;
  // Borders
  border: string;
  borderSubtle: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Accent
  accent: string;
  accentBg: string;
  accentMuted: string;
  // Status
  success: string;
  error: string;
}

export const THEMES: Theme[] = [
  {
    id: "midnight",
    name: "Midnight",
    bgPrimary: "#0a0f1a",
    bgSecondary: "#0f1623",
    bgTertiary: "#151d2e",
    bgCard: "#111827",
    bgCardHover: "#1a2236",
    border: "#1e2d42",
    borderSubtle: "#172133",
    textPrimary: "#e8edf5",
    textSecondary: "#94a3b8",
    textMuted: "#4a5a72",
    accent: "#3b82f6",
    accentBg: "#1e3a5f",
    accentMuted: "#1e3a5f",
    success: "#22c55e",
    error: "#ef4444",
  },
  {
    id: "forest",
    name: "Forest",
    bgPrimary: "#0a1208",
    bgSecondary: "#0e1a0b",
    bgTertiary: "#132210",
    bgCard: "#0f1a0d",
    bgCardHover: "#182b14",
    border: "#1e3318",
    borderSubtle: "#172a12",
    textPrimary: "#e2eedd",
    textSecondary: "#86a87e",
    textMuted: "#4a6644",
    accent: "#4ade80",
    accentBg: "#14421e",
    accentMuted: "#14421e",
    success: "#22c55e",
    error: "#ef4444",
  },
  {
    id: "links",
    name: "Links",
    bgPrimary: "#f4f0e8",
    bgSecondary: "#ede8dc",
    bgTertiary: "#e5dfd0",
    bgCard: "#faf8f3",
    bgCardHover: "#f0ece0",
    border: "#c8bfa8",
    borderSubtle: "#d8d0bc",
    textPrimary: "#1a1510",
    textSecondary: "#5c5040",
    textMuted: "#8c7c68",
    accent: "#8b5e3c",
    accentBg: "#e8d5c0",
    accentMuted: "#e8d5c0",
    success: "#3a7d44",
    error: "#c0392b",
  },
  {
    id: "slate",
    name: "Slate",
    bgPrimary: "#0f1117",
    bgSecondary: "#14171f",
    bgTertiary: "#1a1d27",
    bgCard: "#13161e",
    bgCardHover: "#1c2030",
    border: "#252a38",
    borderSubtle: "#1e2230",
    textPrimary: "#e2e4eb",
    textSecondary: "#8890a8",
    textMuted: "#4a5168",
    accent: "#a78bfa",
    accentBg: "#2d1f6e",
    accentMuted: "#2d1f6e",
    success: "#22c55e",
    error: "#ef4444",
  },
  {
    id: "ember",
    name: "Ember",
    bgPrimary: "#100a06",
    bgSecondary: "#180e08",
    bgTertiary: "#20140a",
    bgCard: "#150c07",
    bgCardHover: "#1e1208",
    border: "#2a1a0e",
    borderSubtle: "#221508",
    textPrimary: "#f0e6da",
    textSecondary: "#a08060",
    textMuted: "#5a3e28",
    accent: "#f97316",
    accentBg: "#4a1e08",
    accentMuted: "#4a1e08",
    success: "#22c55e",
    error: "#ef4444",
  },
  {
    id: "arctic",
    name: "Arctic",
    bgPrimary: "#f0f4f8",
    bgSecondary: "#e8edf2",
    bgTertiary: "#dde3ea",
    bgCard: "#f8fafc",
    bgCardHover: "#edf1f5",
    border: "#b8c4d0",
    borderSubtle: "#cad4dc",
    textPrimary: "#0f1923",
    textSecondary: "#3d5068",
    textMuted: "#7a8fa4",
    accent: "#0ea5e9",
    accentBg: "#c8e8f8",
    accentMuted: "#c8e8f8",
    success: "#16a34a",
    error: "#dc2626",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    bgPrimary: "#050507",
    bgSecondary: "#08080c",
    bgTertiary: "#0d0d12",
    bgCard: "#070709",
    bgCardHover: "#101015",
    border: "#18181f",
    borderSubtle: "#111116",
    textPrimary: "#e8e8f0",
    textSecondary: "#8080a0",
    textMuted: "#3a3a50",
    accent: "#e879f9",
    accentBg: "#3a0a4a",
    accentMuted: "#3a0a4a",
    success: "#22c55e",
    error: "#ef4444",
  },
  {
    id: "dusk",
    name: "Dusk",
    bgPrimary: "#12080e",
    bgSecondary: "#1a0c14",
    bgTertiary: "#22101c",
    bgCard: "#160a11",
    bgCardHover: "#200e18",
    border: "#301830",
    borderSubtle: "#261225",
    textPrimary: "#f0e4ec",
    textSecondary: "#a07090",
    textMuted: "#5a3a54",
    accent: "#f472b6",
    accentBg: "#4a0a30",
    accentMuted: "#4a0a30",
    success: "#22c55e",
    error: "#ef4444",
  },
];

export const DEFAULT_THEME_ID = "midnight";

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.style.setProperty("--cg-bg-primary", theme.bgPrimary);
  root.style.setProperty("--cg-bg-secondary", theme.bgSecondary);
  root.style.setProperty("--cg-bg-tertiary", theme.bgTertiary);
  root.style.setProperty("--cg-bg-card", theme.bgCard);
  root.style.setProperty("--cg-bg-card-hover", theme.bgCardHover);
  root.style.setProperty("--cg-border", theme.border);
  root.style.setProperty("--cg-border-subtle", theme.borderSubtle);
  root.style.setProperty("--cg-text-primary", theme.textPrimary);
  root.style.setProperty("--cg-text-secondary", theme.textSecondary);
  root.style.setProperty("--cg-text-muted", theme.textMuted);
  root.style.setProperty("--cg-accent", theme.accent);
  root.style.setProperty("--cg-accent-bg", theme.accentBg);
  root.style.setProperty("--cg-accent-muted", theme.accentMuted);
  root.style.setProperty("--cg-success", theme.success);
  root.style.setProperty("--cg-error", theme.error);
}
