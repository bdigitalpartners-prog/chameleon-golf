"use client";

import { useState } from "react";
import { Palette, X, Check } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { themePresets, accentPresets, ThemePreset } from "@/lib/themes";

export function ThemeSettings() {
  const { preset, setPreset, customAccent, setCustomAccent } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 transition-colors"
        style={{ color: "var(--cg-text-secondary)" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--cg-bg-tertiary)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        title="Customize theme"
      >
        <Palette className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "var(--cg-bg-overlay)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
            style={{
              backgroundColor: "var(--cg-bg-secondary)",
              border: "1px solid var(--cg-border)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--cg-text-primary)" }}
              >
                Customize Theme
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 transition-colors"
                style={{ color: "var(--cg-text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cg-text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--cg-text-muted)")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Theme Presets */}
            <div className="mb-6">
              <label
                className="text-xs font-medium uppercase tracking-wider mb-3 block"
                style={{ color: "var(--cg-text-muted)" }}
              >
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(themePresets) as [ThemePreset, typeof themePresets[ThemePreset]][]).map(
                  ([key, t]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setPreset(key);
                        // Reset custom accent when switching themes
                        setCustomAccent(null);
                      }}
                      className="relative rounded-xl p-3 text-center transition-all"
                      style={{
                        backgroundColor: preset === key ? "var(--cg-accent-bg)" : "var(--cg-bg-tertiary)",
                        border: `2px solid ${preset === key ? "var(--cg-accent)" : "var(--cg-border)"}`,
                      }}
                    >
                      {/* Color preview dots */}
                      <div className="flex justify-center gap-1.5 mb-2">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: t.colors.bgPrimary, border: `1px solid ${t.colors.border}` }}
                        />
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: t.colors.accent }}
                        />
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: t.colors.textPrimary }}
                        />
                      </div>
                      <div
                        className="text-xs font-medium"
                        style={{ color: preset === key ? "var(--cg-accent)" : "var(--cg-text-secondary)" }}
                      >
                        {t.label}
                      </div>
                      {preset === key && (
                        <div
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "var(--cg-accent)" }}
                        >
                          <Check className="h-3 w-3" style={{ color: "var(--cg-text-inverse)" }} />
                        </div>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label
                className="text-xs font-medium uppercase tracking-wider mb-3 block"
                style={{ color: "var(--cg-text-muted)" }}
              >
                Accent Color
              </label>
              <div className="flex flex-wrap gap-2.5">
                {accentPresets.map((a) => {
                  const isActive =
                    customAccent === a.value ||
                    (!customAccent && themePresets[preset].colors.accent === a.value);
                  return (
                    <button
                      key={a.value}
                      onClick={() =>
                        setCustomAccent(
                          themePresets[preset].colors.accent === a.value ? null : a.value
                        )
                      }
                      className="group relative h-9 w-9 rounded-full transition-transform hover:scale-110"
                      style={{
                        backgroundColor: a.value,
                        boxShadow: isActive ? `0 0 0 3px var(--cg-bg-secondary), 0 0 0 5px ${a.value}` : "none",
                      }}
                      title={a.name}
                    >
                      {isActive && (
                        <Check
                          className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{ color: "#fff", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <p
                className="mt-3 text-xs"
                style={{ color: "var(--cg-text-muted)" }}
              >
                Pick an accent color to personalize buttons, links, and highlights.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
