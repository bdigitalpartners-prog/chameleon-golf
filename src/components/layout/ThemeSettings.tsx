"use client";

import { useState } from "react";
import { Palette, X, Check } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { themePresets, ThemePreset } from "@/lib/themes";

export function ThemeSettings() {
  const { preset, setPreset } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 transition-colors"
        style={{ color: "var(--cg-text-secondary)" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--cg-bg-tertiary)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
        title="Customize theme"
      >
        <Palette className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "var(--cg-bg-overlay)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl"
            style={{
              backgroundColor: "var(--cg-bg-secondary)",
              border: "1px solid var(--cg-border)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--cg-text-primary)" }}
              >
                Choose Theme
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 transition-colors"
                style={{ color: "var(--cg-text-muted)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--cg-text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--cg-text-muted)")
                }
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Theme Presets */}
            <div className="grid grid-cols-3 gap-3">
              {(
                Object.entries(themePresets) as [
                  ThemePreset,
                  (typeof themePresets)[ThemePreset],
                ][]
              ).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => {
                    setPreset(key);
                    setOpen(false);
                  }}
                  className="relative rounded-xl p-4 text-center transition-all"
                  style={{
                    backgroundColor:
                      preset === key
                        ? "var(--cg-accent-bg)"
                        : "var(--cg-bg-tertiary)",
                    border: `2px solid ${
                      preset === key ? "var(--cg-accent)" : "var(--cg-border)"
                    }`,
                  }}
                >
                  <div className="flex justify-center gap-1.5 mb-2.5">
                    <div
                      className="h-5 w-5 rounded-full"
                      style={{
                        backgroundColor: t.colors.bgPrimary,
                        border: `1px solid ${t.colors.border}`,
                      }}
                    />
                    <div
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: t.colors.accent }}
                    />
                    <div
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: t.colors.textPrimary }}
                    />
                  </div>
                  <div
                    className="text-sm font-semibold mb-0.5"
                    style={{
                      color:
                        preset === key
                          ? "var(--cg-accent)"
                          : "var(--cg-text-primary)",
                    }}
                  >
                    {t.label}
                  </div>
                  <div
                    className="text-[10px] leading-tight"
                    style={{ color: "var(--cg-text-muted)" }}
                  >
                    {t.description}
                  </div>
                  {preset === key && (
                    <div
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "var(--cg-accent)" }}
                    >
                      <Check
                        className="h-3 w-3"
                        style={{ color: "var(--cg-text-inverse)" }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
