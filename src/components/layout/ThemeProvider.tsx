"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { ThemePreset, ThemeConfig, themePresets, defaultTheme } from "@/lib/themes";

interface ThemeContextValue {
  preset: ThemePreset;
  theme: ThemeConfig;
  setPreset: (p: ThemePreset) => void;
  // Legacy compat — no-ops
  customAccent: string | null;
  setCustomAccent: (hex: string | null) => void;
  overrides: Record<string, never>;
  setOverride: (key: string, value: string | null) => void;
  resetOverrides: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

function applyThemeToDOM(theme: ThemeConfig) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = `--cg-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });
  root.setAttribute("data-theme", theme.name);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPresetState] = useState<ThemePreset>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cg-theme");
      if (stored && stored in themePresets) {
        setPresetState(stored as ThemePreset);
      }
      // Clean up old override storage
      localStorage.removeItem("cg-overrides");
      localStorage.removeItem("cg-accent");
    } catch {}
    setMounted(true);
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    if (!mounted) return;
    applyThemeToDOM(themePresets[preset]);
  }, [preset, mounted]);

  const setPreset = useCallback((p: ThemePreset) => {
    setPresetState(p);
    try {
      localStorage.setItem("cg-theme", p);
    } catch {}
  }, []);

  const theme = themePresets[preset];

  return (
    <ThemeContext.Provider
      value={{
        preset,
        theme,
        setPreset,
        customAccent: null,
        setCustomAccent: () => {},
        overrides: {} as Record<string, never>,
        setOverride: () => {},
        resetOverrides: () => {},
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
