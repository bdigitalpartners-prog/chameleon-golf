"use client";

import { useTheme } from "./ThemeProvider";
import { X, Check, Palette } from "lucide-react";
import { useEffect } from "react";

interface ThemeSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function ThemeSettings({ open, onClose }: ThemeSettingsProps) {
  const { theme, setThemeById, themes } = useTheme();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 z-50 h-full w-80 max-w-full overflow-y-auto shadow-2xl"
        style={{
          backgroundColor: "var(--cg-bg-card)",
          borderLeft: "1px solid var(--cg-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            borderBottom: "1px solid var(--cg-border)",
          }}
        >
          <div className="flex items-center gap-2">
            <Palette
              className="h-4.5 w-4.5"
              style={{ color: "var(--cg-accent)" }}
            />
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Theme Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--cg-text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--cg-text-primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--cg-text-muted)")
            }
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Theme grid */}
        <div className="px-5 py-5">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-4"
            style={{ color: "var(--cg-text-muted)" }}
          >
            Color Theme
          </p>

          <div className="grid grid-cols-2 gap-3">
            {themes.map((t) => {
              const isActive = t.id === theme.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setThemeById(t.id)}
                  className="relative rounded-xl p-3 text-left transition-all"
                  style={{
                    backgroundColor: t.bgCard,
                    border: `2px solid ${
                      isActive ? t.accent : t.border
                    }`,
                  }}
                >
                  {/* Color swatches */}
                  <div className="flex gap-1 mb-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: t.bgPrimary }}
                    />
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: t.accent }}
                    />
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: t.textSecondary }}
                    />
                  </div>

                  {/* Theme name */}
                  <p
                    className="text-xs font-semibold"
                    style={{ color: t.textPrimary }}
                  >
                    {t.name}
                  </p>

                  {/* Active check */}
                  {isActive && (
                    <div
                      className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full"
                      style={{ backgroundColor: t.accent }}
                    >
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview section */}
        <div
          className="mx-5 mb-5 rounded-xl p-4"
          style={{
            backgroundColor: "var(--cg-bg-tertiary)",
            border: "1px solid var(--cg-border)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--cg-text-muted)" }}
          >
            Preview
          </p>

          <div className="space-y-2">
            <div
              className="h-2 w-3/4 rounded"
              style={{ backgroundColor: "var(--cg-text-primary)", opacity: 0.8 }}
            />
            <div
              className="h-2 w-1/2 rounded"
              style={{ backgroundColor: "var(--cg-text-secondary)", opacity: 0.6 }}
            />
            <div
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
              style={{
                backgroundColor: "var(--cg-accent-bg)",
                color: "var(--cg-accent)",
              }}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: "var(--cg-accent)" }}
              />
              Accent color
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
