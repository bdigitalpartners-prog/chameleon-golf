"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { THEMES, DEFAULT_THEME_ID, applyTheme, type Theme } from "@/lib/themes";

interface ThemeContextType {
  theme: Theme;
  setThemeById: (id: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES[0],
  setThemeById: () => {},
  themes: THEMES,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    THEMES.find((t) => t.id === DEFAULT_THEME_ID) ?? THEMES[0]
  );

  // On mount, load saved theme from localStorage and apply it
  useEffect(() => {
    const saved = localStorage.getItem("cg-theme");
    const found = THEMES.find((t) => t.id === saved);
    const initial = found ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID) ?? THEMES[0];
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const setThemeById = (id: string) => {
    const found = THEMES.find((t) => t.id === id);
    if (!found) return;
    setTheme(found);
    applyTheme(found);
    localStorage.setItem("cg-theme", id);
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeById, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}
