"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  ThemePreset,
  ThemeConfig,
  themePresets,
  defaultTheme,
  generateAccentFromHex,
} from "@/lib/themes";

interface ThemeContextValue {
  preset: ThemePreset;
  theme: ThemeConfig;
  customAccent: string | null;
  setPreset: (p: ThemePreset) => void;
  setCustomAccent: (hex: string | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

function applyThemeToDOM(theme: ThemeConfig, customAccent: string | null) {
  const root = document.documentElement;
  const colors = { ...theme.colors };

  // Override accent colors if user set a custom accent
  if (customAccent) {
    const custom = generateAccentFromHex(customAccent);
    colors.accent = custom.accent;
    colors.accentHover = custom.accentHover;
    colors.accentMuted = custom.accentMuted;
    colors.accentBg = custom.accentBg;
    colors.accentGlow = custom.accentGlow;
  }

  // Set CSS custom properties
  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = `--cg-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });

  // Set data attribute for conditional styling
  root.setAttribute("data-theme", theme.name);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPresetState] = useState<ThemePreset>(defaultTheme);
  const [customAccent, setCustomAccentState] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cg-theme");
      const storedAccent = localStorage.getItem("cg-accent");
      if (stored && stored in themePresets) {
        setPresetState(stored as ThemePreset);
      }
      if (storedAccent) {
        setCustomAccentState(storedAccent);
      }
    } catch {}
    setMounted(true);
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    if (!mounted) return;
    const theme = themePresets[preset];
    applyThemeToDOM(theme, customAccent);
  }, [preset, customAccent, mounted]);

  const setPreset = useCallback((p: ThemePreset) => {
    setPresetState(p);
    try { localStorage.setItem("cg-theme", p); } catch {}
  }, []);

  const setCustomAccent = useCallback((hex: string | null) => {
    setCustomAccentState(hex);
    try {
      if (hex) localStorage.setItem("cg-accent", hex);
      else localStorage.removeItem("cg-accent");
    } catch {}
  }, []);

  const theme = themePresets[preset];

  return (
    <ThemeContext.Provider value={{ preset, theme, customAccent, setPreset, setCustomAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}
